"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin, requireFresh } from "@/lib/server/admin-auth";
import { PRIVACY_STATUS_LABEL, eraseByEmail, eraseMemberData, findPerson, privacyRequests, type ErasureSummary, type PrivacyStatus } from "@/lib/server/privacy";
import { listStoredMembers } from "@/lib/server/store";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
function back(m: { ok?: string; erreur?: string }, extra = ""): never {
  redirect(`/admin/rgpd?${m.ok ? `ok=${encodeURIComponent(m.ok)}` : `erreur=${encodeURIComponent(m.erreur!)}`}${extra}`);
}

const describe = (x: ErasureSummary) =>
  `${x.member ? "fiche adhérente, " : ""}${x.registrations} inscription(s), ${x.orders} commande(s), ${x.payments} paiement(s), ${x.emails} e-mail(s) du journal, ${x.contacts} message(s) de contact, ${x.files} pièce(s) supprimée(s)`;

export async function setRequestStatusAction(id: string, status: PrivacyStatus, formData: FormData) {
  const ctx = await requireAdmin("privacy.manage");
  const req = await privacyRequests.get(id);
  if (!req) back({ erreur: "Demande introuvable." });
  await privacyRequests.update(id, { status, note: s(formData, "note") || req.note, handledBy: `${ctx.admin.firstName} ${ctx.admin.lastName}`.trim(), closedAt: status === "done" || status === "refused" ? new Date().toISOString() : undefined });
  await audit(ctx, "RGPD", "demande", `Demande ${id.slice(0, 8)} : ${PRIVACY_STATUS_LABEL[status]}`, { entityId: id });
  revalidatePath("/admin/rgpd");
  back({ ok: `Demande passée à « ${PRIVACY_STATUS_LABEL[status]} ».` });
}

/** Exécute une demande d'effacement : efface la fiche (si l'adresse correspond à un compte) et toutes les données liées à l'adresse. */
export async function executeErasureRequestAction(id: string) {
  const ctx = await requireAdmin("privacy.manage");
  await requireFresh(ctx);
  const req = await privacyRequests.get(id);
  if (!req) back({ erreur: "Demande introuvable." });
  const member = (await listStoredMembers()).find((m) => m.status !== "anonymized" && m.email.toLowerCase() === req.email.toLowerCase());
  const summary = member ? await eraseMemberData(member.id) : await eraseByEmail(req.email);
  await privacyRequests.update(id, { status: "done", closedAt: new Date().toISOString(), handledBy: `${ctx.admin.firstName} ${ctx.admin.lastName}`.trim(), note: `Effacement exécuté : ${summary ? describe(summary) : "aucune donnée trouvée"}.` });
  await audit(ctx, "effacement", "RGPD", `Effacement exécuté pour la demande ${id.slice(0, 8)}`, { entityId: id });
  revalidatePath("/admin");
  back({ ok: `Données effacées (${summary ? describe(summary) : "aucune donnée trouvée"}).` });
}

/** Effacement direct, sans demande préalable : par adresse e-mail ou numéro de membre. */
export async function erasePersonAction(formData: FormData) {
  const ctx = await requireAdmin("privacy.manage");
  await requireFresh(ctx);
  const q = s(formData, "q");
  if (s(formData, "confirm").toUpperCase() !== "EFFACER") back({ erreur: "Saisissez le mot EFFACER pour confirmer." }, `&q=${encodeURIComponent(q)}`);
  const found = await findPerson(q);
  if (!found) back({ erreur: "Recherche trop courte." });
  const summary = found.member ? await eraseMemberData(found.member.id) : await eraseByEmail(found.email);
  await audit(ctx, "effacement", "RGPD", `Effacement direct des données d'une personne (${found.member ? found.member.id.slice(0, 8) : "sans compte"})`);
  revalidatePath("/admin");
  back({ ok: `Données effacées (${summary ? describe(summary) : "aucune donnée trouvée"}).` });
}

export async function eraseInactiveAction(memberId: string) {
  const ctx = await requireAdmin("privacy.manage");
  await requireFresh(ctx);
  const summary = await eraseMemberData(memberId);
  await audit(ctx, "effacement", "RGPD", `Effacement d'une adhérente inactive (${memberId.slice(0, 8)})`, { entityId: memberId });
  revalidatePath("/admin");
  back({ ok: summary ? `Fiche effacée (${describe(summary)}).` : "Fiche introuvable." });
}
