import { randomBytes, randomUUID } from "node:crypto";
import { json, readJson, throttled, tooMany } from "@/lib/server/http";
import { authConfigured, setSession } from "@/lib/server/session";
import { hashPassword } from "@/lib/server/password";
import { addMemberRaw, takenMemberNumbers, type StoredMember } from "@/lib/server/store";
import { passwordIssue } from "@/lib/members";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+0-9][0-9 .()-]{7,19}$/;
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Numéro de compte client : « CLI- » + 8 caractères, distinct des numéros de carte des adhérentes. */
async function clientNumber() {
  const taken = await takenMemberNumbers();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let n = "";
  do n = `CLI-${Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join("")}`;
  while (taken.has(n));
  return n;
}

/**
 * Compte client : pour réserver une place aux événements ouverts à toutes (watch parties…) sans adhérer. Aucune carte de membre,
 * aucune adhésion : la personne peut devenir adhérente plus tard. La session est ouverte dès la création.
 */
export async function POST(req: Request) {
  if (!(await authConfigured())) return json({ error: "L'authentification n'est pas disponible sur ce serveur." }, 503);
  if (await throttled(req, "signup-client", 8, 3_600_000)) return tooMany();
  const b = await readJson<Record<string, unknown>>(req);
  if (!b) return json({ error: "Requête invalide." }, 400);
  const input = { firstName: str(b.firstName), lastName: str(b.lastName), email: str(b.email, 160).toLowerCase(), phone: str(b.phone, 30), password: typeof b.password === "string" ? b.password.slice(0, 200) : "" };
  const c = (b.consents ?? {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  if (!input.firstName) errors.firstName = "Prénom requis.";
  if (!input.lastName) errors.lastName = "Nom requis.";
  if (!EMAIL.test(input.email)) errors.email = "Adresse e-mail invalide.";
  if (!PHONE.test(input.phone)) errors.phone = "Numéro de téléphone invalide.";
  const pwd = passwordIssue(input.password);
  if (pwd) errors.password = pwd;
  if (c.privacy !== true) errors.privacy = "Vous devez accepter le traitement de vos données.";
  if (Object.keys(errors).length) return json({ error: "Certains champs sont à corriger.", errors }, 422);

  const now = new Date().toISOString();
  const member: StoredMember = {
    id: randomUUID(),
    memberNumber: await clientNumber(),
    token: randomBytes(18).toString("base64url"),
    accountType: "client",
    season: "",
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: "",
    email: input.email,
    phone: input.phone,
    address: { line1: "", postalCode: "", city: "", country: "France" },
    authorizations: [],
    consents: { rules: true, privacy: true, image: c.image === true },
    joinedAt: now,
    validUntil: "",
    passwordHash: await hashPassword(input.password),
  };
  const res = await addMemberRaw(member);
  if (!res.ok) return json({ error: "Un compte existe déjà avec cette adresse e-mail : connectez-vous (ou utilisez « Mot de passe oublié »).", errors: { email: "Adresse déjà utilisée." } }, 409);
  await setSession(member.id);
  return json({ ok: true }, 201);
}
