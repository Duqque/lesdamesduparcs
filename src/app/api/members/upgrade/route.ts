import { json, throttled, tooMany } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { generateMemberNumber, MAX_AUTH_FILE_BYTES, MAX_AUTH_FILES } from "@/lib/members";
import { parseSignup } from "@/lib/server/member-signup";
import { seasonOf } from "@/lib/season";
import { ADHESION_CAP_MESSAGE, adhesionCapStatus, createMembership, defaultPlan, payments } from "@/lib/server/business";
import { sendTemplate } from "@/lib/server/email";
import { authorizationKey, putBlob } from "@/lib/server/blobs";
import { getMemberByNumber, listAllRegistrations, listOrders, takenMemberNumbers, toPublic, updateMember, updateOrder, updateRegistration } from "@/lib/server/store";
import { invoices } from "@/lib/server/invoice";
import { emailJobs } from "@/lib/server/email-jobs";

const MAX_BODY = MAX_AUTH_FILES * MAX_AUTH_FILE_BYTES + 256 * 1024;

/**
 * Compte client → adhérente : la personne connectée complète le formulaire d'adhésion. Le compte est conservé (connexion, mot de
 * passe, billets, commandes, reçus) ; il reçoit un numéro de carte de membre, reporté sur ses inscriptions, commandes, paiements
 * et factures. L'adhésion est ensuite réglée comme une adhésion classique (page de paiement).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "member") return json({ error: "Connectez-vous à votre compte pour adhérer." }, 401);
  if (await throttled(req, "signup", 8, 3_600_000)) return tooMany();
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return json({ error: "Fichiers trop volumineux." }, 413);
  const stored = await getMemberByNumber(session.memberNumber);
  if (!stored || stored.accountType !== "client") return json({ error: "Ce compte est déjà un compte d'adhérente." }, 409);
  if ((await adhesionCapStatus()).blocked) return json({ error: ADHESION_CAP_MESSAGE }, 403);

  const form = await req.formData().catch(() => null);
  if (!form) return json({ error: "Requête invalide." }, 400);
  const parsed = await parseSignup(form, { email: stored.email });
  if (!parsed.ok) return json({ error: parsed.error, ...("errors" in parsed ? { errors: parsed.errors } : {}) }, parsed.status);
  const { input, minor, files } = parsed;

  for (const f of files) await putBlob(authorizationKey(stored.id, f.id), f.bytes, "application/pdf");
  const now = new Date();
  const season = seasonOf(now);
  const oldNumber = stored.memberNumber;
  const newNumber = generateMemberNumber(input.lastName, input.firstName, input.birthDate, season.start, await takenMemberNumbers());
  const { password: _pw, ...profile } = input;
  void _pw;
  const updated = await updateMember(stored.id, {
    ...profile,
    accountType: undefined,
    memberNumber: newNumber,
    season: season.label,
    validUntil: season.validUntil,
    joinedAt: now.toISOString(),
    guardian: minor ? input.guardian : undefined,
    authorizations: [...stored.authorizations, ...files.map((f) => ({ id: f.id, name: f.name, size: f.bytes.length }))],
  });
  if (!updated) return json({ error: "Compte introuvable." }, 404);

  // Le numéro de compte client est remplacé partout par le numéro de carte.
  for (const r of (await listAllRegistrations()).filter((x) => x.memberNumber === oldNumber)) await updateRegistration(r.id, { memberNumber: newNumber });
  for (const o of (await listOrders()).filter((x) => x.memberNumber === oldNumber)) await updateOrder(o.id, { memberNumber: newNumber });
  for (const p of await payments.find((x) => x.memberNumber === oldNumber)) await payments.update(p.id, { memberNumber: newNumber });
  for (const i of await invoices.find((x) => x.memberNumber === oldNumber)) await invoices.update(i.id, { memberNumber: newNumber });
  for (const j of await emailJobs.find((x) => x.memberNumber === oldNumber)) await emailJobs.update(j.id, { memberNumber: newNumber });

  const plan = await defaultPlan();
  if (plan) await createMembership(toPublic(updated), plan);
  await sendTemplate("welcome", updated.email, { prenom: updated.firstName, saison: updated.season, numero: updated.memberNumber }, "welcome");
  return json({ ok: true, memberNumber: newNumber, next: "/rejoindre-le-groupe/paiement" }, 201);
}
