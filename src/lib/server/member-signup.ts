import "server-only";
import { randomUUID } from "node:crypto";
import { MAX_AUTH_FILE_BYTES, isMinor, validateMember, type Guardian, type MemberInput } from "@/lib/members";

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export type SignupFile = { id: string; bytes: Buffer; name: string };

/**
 * Lecture et validation du formulaire d'adhésion (données JSON + autorisations parentales PDF des mineures), partagées par la
 * création d'un compte d'adhérente et par le passage d'un compte client à l'adhésion. `keep` impose l'e-mail et dispense du
 * mot de passe (compte déjà existant).
 */
export async function parseSignup(form: FormData, keep?: { email: string }) {
  let raw: Record<string, unknown> | null = null;
  try {
    raw = JSON.parse(String(form.get("data"))) as Record<string, unknown>;
  } catch {
    raw = null;
  }
  if (!raw || typeof raw !== "object") return { ok: false as const, status: 400, error: "Requête invalide." };
  const a = (raw.address ?? {}) as Record<string, unknown>;
  const g = raw.guardian as Record<string, unknown> | undefined;
  const c = (raw.consents ?? {}) as Record<string, unknown>;
  const input: MemberInput = {
    firstName: str(raw.firstName, 80),
    lastName: str(raw.lastName, 80),
    birthDate: str(raw.birthDate, 10),
    email: keep ? keep.email : str(raw.email, 160).toLowerCase(),
    phone: str(raw.phone, 20),
    address: { line1: str(a.line1), line2: str(a.line2) || undefined, postalCode: str(a.postalCode, 10), city: str(a.city, 80), country: str(a.country, 60) },
    // Compte existant : le mot de passe ne change pas (valeur conforme uniquement pour la validation).
    password: keep ? "Compte-existant-0" : typeof raw.password === "string" ? raw.password.slice(0, 200) : "",
    guardian: g ? { firstName: str(g.firstName, 80), lastName: str(g.lastName, 80), relation: str(g.relation, 10) as Guardian["relation"], email: str(g.email, 160).toLowerCase(), phone: str(g.phone, 20) } : undefined,
    consents: { rules: c.rules === true, privacy: c.privacy === true, image: c.image === true, guardianConsent: c.guardianConsent === true },
  };
  const minor = isMinor(input.birthDate);
  const uploads = minor ? form.getAll("authorization").filter((f): f is File => typeof f !== "string" && f.size > 0) : [];
  const errors = validateMember(input, uploads.length);
  const files: SignupFile[] = [];
  if (!errors.authorization) {
    for (const f of uploads) {
      const bytes = Buffer.from(await f.arrayBuffer());
      if (f.size > MAX_AUTH_FILE_BYTES) errors.authorization = `« ${f.name} » dépasse 5 Mo.`;
      else if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") errors.authorization = `« ${f.name} » n'est pas un fichier PDF valide.`;
      else files.push({ id: randomUUID(), bytes, name: f.name.replace(/[^\w.\- ()À-ÿ]/g, "_").slice(0, 120) });
    }
  }
  if (Object.keys(errors).length) return { ok: false as const, status: 422, error: "Certains champs sont à corriger.", errors };
  return { ok: true as const, input, minor, files };
}
