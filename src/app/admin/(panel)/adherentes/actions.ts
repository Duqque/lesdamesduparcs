"use server";

import { safeUrl } from "@/lib/safe-url";
import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateMemberNumber, validateMember, type MemberInput } from "@/lib/members";
import { seasonOf } from "@/lib/season";
import { audit, requireAdmin, requireFresh } from "@/lib/server/admin-auth";
import { addMemberRaw, anonymizeMember, getMemberById, takenMemberNumbers, toPublic, updateMember, type StoredMember } from "@/lib/server/store";
import { createMembership, currentMembership, memberships, plans, setTxStatus, addManualPayment, type PayMethod, type TxStatus } from "@/lib/server/business";
import { hashPassword } from "@/lib/server/password";
import { sendEmail, sendTemplate } from "@/lib/server/email";
import { eraseMemberData } from "@/lib/server/privacy";
import { createMemberResetToken } from "@/lib/server/member-reset";
import { siteOrigin } from "@/lib/server/http";
import { cookies } from "next/headers";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (id: string, msg: { ok?: string; erreur?: string }) => redirect(`/admin/adherentes/${id}?${msg.ok ? `ok=${encodeURIComponent(msg.ok)}` : `erreur=${encodeURIComponent(msg.erreur!)}`}`);

export async function createMemberAction(formData: FormData) {
  const ctx = await requireAdmin("members.edit");
  const password = randomBytes(9).toString("base64url");
  const g = s(formData, "gFirstName");
  const input: MemberInput = {
    firstName: s(formData, "firstName"),
    lastName: s(formData, "lastName"),
    birthDate: s(formData, "birthDate"),
    email: s(formData, "email").toLowerCase(),
    phone: s(formData, "phone"),
    address: { line1: s(formData, "line1"), postalCode: s(formData, "postalCode"), city: s(formData, "city"), country: s(formData, "country") || "France" },
    password,
    guardian: g ? { firstName: g, lastName: s(formData, "gLastName"), relation: (s(formData, "gRelation") || "tuteur") as "mere" | "pere" | "tuteur", email: s(formData, "gEmail"), phone: s(formData, "gPhone") } : undefined,
    consents: { rules: true, privacy: true },
  };
  // Adhésion saisie par l'équipe : l'autorisation parentale d'une mineure est à déposer ensuite sur la fiche.
  const errors = validateMember(input, input.guardian ? 1 : 0);
  delete errors.authorization;
  if (Object.keys(errors).length) redirect(`/admin/adherentes/nouvelle?erreur=${encodeURIComponent(Object.values(errors)[0])}`);
  const plan = await plans.get(s(formData, "planId")) ;
  if (!plan) redirect("/admin/adherentes/nouvelle?erreur=Choisissez+une+formule.");
  const taken = await takenMemberNumbers();
  const season = seasonOf(new Date());
  const member: StoredMember = {
    ...(({ password: _p, ...rest }) => (void _p, rest))(input),
    id: randomUUID(),
    memberNumber: generateMemberNumber(input.lastName, input.firstName, input.birthDate, season.start, taken),
    token: randomBytes(18).toString("base64url"),
    season: season.label,
    authorizations: [],
    joinedAt: new Date().toISOString(),
    validUntil: season.validUntil,
    passwordHash: await hashPassword(password),
  };
  const res = await addMemberRaw(member);
  if (!res.ok) redirect("/admin/adherentes/nouvelle?erreur=Cette+adresse+e-mail+est+d%C3%A9j%C3%A0+utilis%C3%A9e.");
  const paid = s(formData, "paid") === "1";
  await createMembership(toPublic(member), plan, { paid, method: (s(formData, "method") || "manual") as PayMethod });
  await audit(ctx, "création", "adhérente", `Adhérente créée : ${member.firstName} ${member.lastName} (${member.memberNumber})`, { entityId: member.id });
  await sendTemplate("welcome", member.email, { prenom: member.firstName, saison: member.season, numero: member.memberNumber }, "welcome");
  const link = `${await siteOrigin()}/connexion/reinitialiser/${await createMemberResetToken(member.id, 7 * 24 * 3600_000)}`;
  const mail = await sendEmail({
    to: member.email,
    subject: "Votre compte Les Dames du Parc",
    body: `Bonjour ${member.firstName},\n\nL'équipe a créé votre compte membre (numéro ${member.memberNumber}). Pour définir votre mot de passe et accéder à votre espace, ouvrez ce lien (valable 7 jours, à usage unique) :\n${link}`,
    kind: "invitation",
  });
  await cookies().then((jar) => jar.set("ddp_admin_link", link, { httpOnly: true, sameSite: "strict", path: "/admin/adherentes", maxAge: 60, secure: process.env.NODE_ENV === "production" && process.env.SESSION_INSECURE_COOKIE !== "1" }));
  revalidatePath("/admin/adherentes");
  redirect(`/admin/adherentes/${member.id}?ok=${encodeURIComponent(mail.ok ? "Adhérente créée : un e-mail lui a été envoyé pour définir son mot de passe (lien aussi ci-dessous)." : "Adhérente créée. Aucun e-mail n'est parti (service d'e-mail non configuré) : transmettez-lui le lien ci-dessous pour qu'elle définisse son mot de passe.")}`);
}

export async function updateMemberAction(id: string, formData: FormData) {
  const ctx = await requireAdmin("members.edit");
  const before = await getMemberById(id);
  if (!before) redirect("/admin/adherentes");
  const patch = {
    firstName: s(formData, "firstName") || before.firstName,
    lastName: s(formData, "lastName") || before.lastName,
    email: (s(formData, "email") || before.email).toLowerCase(),
    phone: s(formData, "phone"),
    notes: s(formData, "notes") || undefined,
    ...(ctx.can("members.pii") ? {
      birthDate: s(formData, "birthDate") || before.birthDate,
      address: { line1: s(formData, "line1"), line2: s(formData, "line2") || undefined, postalCode: s(formData, "postalCode"), city: s(formData, "city"), country: s(formData, "country") || "France" },
    } : {}),
  };
  const after = await updateMember(id, patch);
  await audit(ctx, "modification", "adhérente", `Fiche modifiée : ${before.firstName} ${before.lastName}`, { entityId: id, before: { email: before.email, phone: before.phone, city: before.address.city }, after: { email: after?.email, phone: after?.phone, city: after?.address.city } });
  revalidatePath(`/admin/adherentes/${id}`);
  back(id, { ok: "Fiche enregistrée." });
}

export async function setMemberStatusAction(id: string, next: "suspended" | "active") {
  const ctx = await requireAdmin("members.edit");
  const m = await getMemberById(id);
  if (!m) redirect("/admin/adherentes");
  await updateMember(id, { status: next === "suspended" ? "suspended" : undefined });
  const cur = await currentMembership(id);
  if (cur) await memberships.update(cur.id, { status: next === "suspended" ? "suspended" : "active" });
  await audit(ctx, next === "suspended" ? "suspension" : "réactivation", "adhérente", `${next === "suspended" ? "Adhésion suspendue" : "Adhésion réactivée"} : ${m.firstName} ${m.lastName}`, { entityId: id });
  revalidatePath("/admin/adherentes");
  back(id, { ok: next === "suspended" ? "Adhésion suspendue." : "Adhésion réactivée." });
}

export async function renewMemberAction(id: string, formData: FormData) {
  const ctx = await requireAdmin("members.edit");
  const m = await getMemberById(id);
  const plan = await plans.get(s(formData, "planId"));
  if (!m || !plan) redirect("/admin/adherentes");
  const cur = await currentMembership(id);
  const startsAt = cur && new Date(cur.endsAt) > new Date() ? new Date(new Date(cur.endsAt).getTime() + 86_400_000) : new Date();
  const ms = await createMembership(toPublic(m), plan, { renewedFromId: cur?.id, startsAt, paid: s(formData, "paid") === "1", method: (s(formData, "method") || "manual") as PayMethod });
  await updateMember(id, { validUntil: ms.endsAt.slice(0, 10), season: ms.season, status: undefined });
  await audit(ctx, "renouvellement", "adhérente", `Adhésion renouvelée : ${m.firstName} ${m.lastName} (${ms.season})`, { entityId: id });
  revalidatePath("/admin/adherentes");
  back(id, { ok: `Adhésion ${ms.season} créée.` });
}

export async function anonymizeMemberAction(id: string) {
  const ctx = await requireAdmin();
  if (!ctx.can("members.delete") && !ctx.can("privacy.manage")) redirect("/admin/acces-refuse");
  await requireFresh(ctx);
  const m = await getMemberById(id);
  if (!m) redirect("/admin/adherentes");
  const label = m.memberNumber;
  const summary = await eraseMemberData(id);
  await audit(ctx, "effacement", "adhérente", `Données effacées : fiche ${id.slice(0, 8)} (${summary ? `${summary.registrations} inscription(s), ${summary.orders} commande(s)` : "aucune"})`, { entityId: id });
  void label;
  revalidatePath("/admin/adherentes");
  redirect("/admin/adherentes?ok=" + encodeURIComponent("Données effacées : fiche, coordonnées, pièces, inscriptions et commandes sont rendues anonymes ; seules les pièces comptables sont conservées."));
}

export async function sendMemberEmailAction(id: string, formData: FormData) {
  const ctx = await requireAdmin("communication.send");
  const m = await getMemberById(id);
  if (!m) redirect("/admin/adherentes");
  const subject = s(formData, "subject");
  const body = s(formData, "body");
  if (!subject || !body) back(id, { erreur: "Objet et message requis." });
  const r = await sendEmail({ to: m.email, subject, body, kind: "manuel" });
  await audit(ctx, "e-mail", "adhérente", `E-mail à ${m.firstName} ${m.lastName} : ${subject}`, { entityId: id });
  back(id, r.ok ? { ok: "E-mail envoyé." } : { erreur: r.skipped ? "Aucun service d'e-mail n'est configuré : le message est enregistré au journal mais n'est pas parti." : "Échec de l'envoi." });
}

export async function memberPaymentAction(id: string, txId: string, status: TxStatus, formData: FormData) {
  const ctx = await requireAdmin("finance.edit");
  if (status === "refunded") await requireFresh(ctx);
  const res = await setTxStatus(txId, status, { method: (String(formData.get("method") ?? "") || undefined) as PayMethod | undefined, skipRefund: formData.get("manual") === "1" });
  if (!res.ok) back(id, { erreur: res.error });
  await audit(ctx, "paiement", "transaction", `Paiement ${txId} passé à « ${status} »`, { entityId: txId });
  revalidatePath("/admin/finances");
  back(id, { ok: "Paiement mis à jour." });
}

export async function addPaymentAction(id: string, formData: FormData) {
  const ctx = await requireAdmin("finance.edit");
  const m = await getMemberById(id);
  if (!m) redirect("/admin/adherentes");
  const amount = Math.round(parseFloat(s(formData, "amount").replace(",", ".")) * 100);
  if (!Number.isFinite(amount) || amount <= 0) back(id, { erreur: "Montant invalide." });
  await addManualPayment({ memberNumber: m.memberNumber, name: `${m.firstName} ${m.lastName}`, email: m.email, label: s(formData, "label") || "Paiement", amountCents: amount, method: (s(formData, "method") || "manual") as PayMethod, status: "paid", note: s(formData, "note") || undefined });
  await audit(ctx, "paiement", "transaction", `Paiement manuel de ${(amount / 100).toFixed(2)} € enregistré pour ${m.firstName} ${m.lastName}`, { entityId: id });
  back(id, { ok: "Paiement enregistré." });
}

/* ---------- Formules ---------- */

export async function savePlanAction(formData: FormData) {
  const ctx = await requireAdmin("plans.manage");
  const id = s(formData, "id");
  const price = Math.round(parseFloat(s(formData, "price").replace(",", ".")) * 100);
  const promo = s(formData, "promo");
  const data = {
    name: s(formData, "name"),
    description: s(formData, "description"),
    priceCents: Number.isFinite(price) ? price : 0,
    promoPriceCents: promo ? Math.round(parseFloat(promo.replace(",", ".")) * 100) : undefined,
    durationMonths: Number(s(formData, "duration")) || 0,
    image: safeUrl(s(formData, "image")) || undefined,
    benefits: s(formData, "benefits").split("\n").map((x) => x.trim()).filter(Boolean),
    conditions: s(formData, "conditions"),
    visible: formData.get("visible") === "on",
    available: formData.get("available") === "on",
    autoRenew: formData.get("autoRenew") === "on",
    order: Number(s(formData, "order")) || 99,
  };
  if (!data.name) redirect("/admin/adherentes/formules?erreur=Le+nom+est+requis.");
  if (id) {
    const before = await plans.get(id);
    await plans.update(id, data);
    await audit(ctx, "modification", "formule", `Formule modifiée : ${data.name}`, { entityId: id, before: before && { price: before.priceCents, visible: before.visible }, after: { price: data.priceCents, visible: data.visible } });
  } else {
    const row = await plans.insert(data);
    await audit(ctx, "création", "formule", `Formule créée : ${data.name}`, { entityId: row.id });
  }
  revalidatePath("/admin/adherentes/formules");
  redirect("/admin/adherentes/formules?ok=Formule+enregistr%C3%A9e.");
}

export async function deletePlanAction(id: string) {
  const ctx = await requireAdmin("plans.manage");
  const used = await memberships.find((m) => m.planId === id);
  if (used.length) redirect("/admin/adherentes/formules?erreur=" + encodeURIComponent("Cette formule est utilisée par des adhésions : masquez-la plutôt que de la supprimer."));
  const p = await plans.get(id);
  await plans.remove(id);
  await audit(ctx, "suppression", "formule", `Formule supprimée : ${p?.name}`, { entityId: id });
  redirect("/admin/adherentes/formules?ok=Formule+supprim%C3%A9e.");
}

/* ---------- Import CSV ---------- */

function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const sep = (clean.split("\n")[0] ?? "").split(";").length >= (clean.split("\n")[0] ?? "").split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (q) {
      if (c === '"' && clean[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c;
    } else if (c === '"') q = true;
    else if (c === sep) { cur.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && clean[i + 1] === "\n") i++; cur.push(field); if (cur.some((x) => x.trim())) rows.push(cur); cur = []; field = ""; }
    else field += c;
  }
  if (field || cur.length) { cur.push(field); if (cur.some((x) => x.trim())) rows.push(cur); }
  return rows;
}

const norm = (h: string) => h.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

/** Colonnes attendues : prenom, nom, email, telephone, naissance (AAAA-MM-JJ ou JJ/MM/AAAA), adresse, codepostal, ville, pays, formule. */
export async function importMembersAction(formData: FormData) {
  const ctx = await requireAdmin("members.edit");
  await requireFresh(ctx);
  await requireAdmin("members.export");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/adherentes/import-export?erreur=" + encodeURIComponent("Choisissez un fichier CSV."));
  if (file.size > 2_000_000) redirect("/admin/adherentes/import-export?erreur=" + encodeURIComponent("Fichier trop volumineux (2 Mo maximum)."));
  const rows = parseCsv(await file.text());
  const head = (rows.shift() ?? []).map(norm);
  const col = (r: string[], ...names: string[]) => { for (const n of names) { const i = head.indexOf(n); if (i >= 0) return (r[i] ?? "").trim(); } return ""; };
  const planList = await plans.all();
  const fallback = planList.find((p) => p.visible && p.available) ?? planList[0];
  const taken = await takenMemberNumbers();
  const season = seasonOf(new Date());
  let created = 0;
  const skipped: string[] = [];
  for (const [n, r] of rows.entries()) {
    let birth = col(r, "naissance", "datedenaissance", "birthdate");
    const dm = birth.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dm) birth = `${dm[3]}-${dm[2]}-${dm[1]}`;
    const input: MemberInput = {
      firstName: col(r, "prenom", "firstname"), lastName: col(r, "nom", "lastname"), birthDate: birth, email: col(r, "email", "courriel").toLowerCase(), phone: col(r, "telephone", "tel", "phone"),
      address: { line1: col(r, "adresse", "address"), postalCode: col(r, "codepostal", "cp"), city: col(r, "ville", "city"), country: col(r, "pays", "country") || "France" },
      password: "Import-2026-x", consents: { rules: true, privacy: true },
    };
    const errs = validateMember(input, 1);
    delete errs.authorization; delete errs.guardianFirstName; delete errs.guardianLastName; delete errs.guardianRelation; delete errs.guardianEmail; delete errs.guardianPhone; delete errs.guardianConsent;
    if (Object.keys(errs).length) { skipped.push(`ligne ${n + 2} (${Object.values(errs)[0]})`); continue; }
    const plan = planList.find((p) => p.name.toLowerCase() === col(r, "formule", "plan").toLowerCase()) ?? fallback;
    const number = generateMemberNumber(input.lastName, input.firstName, input.birthDate, season.start, taken);
    taken.add(number);
    const { password: _pw, ...profile } = input;
    void _pw;
    const member: StoredMember = { ...profile, id: randomUUID(), memberNumber: number, token: randomBytes(18).toString("base64url"), season: season.label, authorizations: [], joinedAt: new Date().toISOString(), validUntil: season.validUntil, passwordHash: await hashPassword(randomBytes(12).toString("base64url")) };
    const res = await addMemberRaw(member);
    if (!res.ok) { skipped.push(`ligne ${n + 2} (e-mail déjà utilisé)`); continue; }
    if (plan) await createMembership(toPublic(member), plan, { paid: true, method: "autre" });
    created++;
  }
  await audit(ctx, "import", "adhérente", `Import CSV : ${created} créée(s), ${skipped.length} ignorée(s)`);
  revalidatePath("/admin/adherentes");
  const msg = `${created} adhérente(s) importée(s).` + (skipped.length ? ` Ignorées : ${skipped.slice(0, 5).join(" ; ")}${skipped.length > 5 ? "…" : ""}.` : "");
  redirect("/admin/adherentes/import-export?ok=" + encodeURIComponent(msg));
}

/** Génère un lien (7 jours, usage unique) que l'équipe peut transmettre : première connexion d'un compte créé par l'équipe, ou mot de passe perdu. */
export async function memberInviteLinkAction(id: string) {
  const ctx = await requireAdmin("members.edit");
  const m = await getMemberById(id);
  if (!m || m.status === "anonymized") redirect("/admin/adherentes");
  const link = `${await siteOrigin()}/connexion/reinitialiser/${await createMemberResetToken(id, 7 * 24 * 3600_000)}`;
  await cookies().then((jar) => jar.set("ddp_admin_link", link, { httpOnly: true, sameSite: "strict", path: "/admin/adherentes", maxAge: 60, secure: process.env.NODE_ENV === "production" && process.env.SESSION_INSECURE_COOKIE !== "1" }));
  await audit(ctx, "sécurité", "adhérente", `Lien de définition du mot de passe généré : fiche ${id.slice(0, 8)}`, { entityId: id });
  back(id, { ok: "Lien généré (valable 7 jours, à usage unique)." });
}
