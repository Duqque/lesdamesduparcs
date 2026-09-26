import { randomBytes, randomUUID } from "node:crypto";
import { json, throttled, tooMany } from "@/lib/server/http";
import { authConfigured, setSession } from "@/lib/server/session";
import { getAdmin } from "@/lib/server/admin-auth";
import { hashPassword } from "@/lib/server/password";
import { addMember, listMembers, type StoredMember } from "@/lib/server/store";
import { MAX_AUTH_FILE_BYTES, generateMemberNumber, MAX_AUTH_FILES, isMinor, validateMember, type Guardian, type MemberInput } from "@/lib/members";
import { seasonOf } from "@/lib/season";
import { createMembership, defaultPlan } from "@/lib/server/business";
import { sendTemplate } from "@/lib/server/email";

const MAX_BODY = MAX_AUTH_FILES * MAX_AUTH_FILE_BYTES + 256 * 1024;
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Liste des membres : réservée aux administrateurs. */
export async function GET() {
  const admin = await getAdmin();
  if (!admin?.can("members.view")) return json({ error: "Accès réservé aux administrateurs." }, 403);
  const list = (await listMembers()).map((m) => ({
    memberNumber: m.memberNumber,
    token: m.token,
    name: `${m.firstName} ${m.lastName}`,
    email: m.email,
    season: m.season,
    joinedAt: m.joinedAt,
    minor: isMinor(m.birthDate, m.joinedAt.slice(0, 10)),
    authorizations: m.authorizations.length,
  }));
  return json(list.reverse());
}

/** Création du compte : valide les données, enregistre l'autorisation parentale (mineures), génère le numéro et ouvre la session. */
export async function POST(req: Request) {
  if (!(await authConfigured())) return json({ error: "L'authentification n'est pas disponible sur ce serveur." }, 503);
  if (await throttled(req, "signup", 8, 3_600_000)) return tooMany();
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return json({ error: "Fichiers trop volumineux." }, 413);

  const form = await req.formData().catch(() => null);
  let raw: Record<string, unknown> | null = null;
  try {
    raw = form ? (JSON.parse(String(form.get("data"))) as Record<string, unknown>) : null;
  } catch {
    raw = null;
  }
  if (!form || !raw || typeof raw !== "object") return json({ error: "Requête invalide." }, 400);

  const a = (raw.address ?? {}) as Record<string, unknown>;
  const g = raw.guardian as Record<string, unknown> | undefined;
  const c = (raw.consents ?? {}) as Record<string, unknown>;
  const input: MemberInput = {
    firstName: str(raw.firstName, 80),
    lastName: str(raw.lastName, 80),
    birthDate: str(raw.birthDate, 10),
    email: str(raw.email, 160).toLowerCase(),
    phone: str(raw.phone, 20),
    address: { line1: str(a.line1), line2: str(a.line2) || undefined, postalCode: str(a.postalCode, 10), city: str(a.city, 80), country: str(a.country, 60) },
    password: typeof raw.password === "string" ? raw.password.slice(0, 200) : "",
    guardian: g ? { firstName: str(g.firstName, 80), lastName: str(g.lastName, 80), relation: str(g.relation, 10) as Guardian["relation"], email: str(g.email, 160).toLowerCase(), phone: str(g.phone, 20) } : undefined,
    consents: { rules: c.rules === true, privacy: c.privacy === true, image: c.image === true, guardianConsent: c.guardianConsent === true },
  };

  const minor = isMinor(input.birthDate);
  const uploads = minor ? form.getAll("authorization").filter((f): f is File => typeof f !== "string" && f.size > 0) : [];
  const errors = validateMember(input, uploads.length);

  const files: Array<{ id: string; bytes: Buffer; name: string }> = [];
  if (!errors.authorization) {
    for (const f of uploads) {
      const bytes = Buffer.from(await f.arrayBuffer());
      if (f.size > MAX_AUTH_FILE_BYTES) errors.authorization = `« ${f.name} » dépasse 5 Mo.`;
      else if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") errors.authorization = `« ${f.name} » n'est pas un fichier PDF valide.`;
      else files.push({ id: randomUUID(), bytes, name: f.name.replace(/[^\w.\- ()À-ÿ]/g, "_").slice(0, 120) });
    }
  }
  if (Object.keys(errors).length) return json({ error: "Certains champs sont à corriger.", errors }, 422);

  const id = randomUUID();
  const now = new Date();
  const season = seasonOf(now);
  const passwordHash = await hashPassword(input.password);
  const result = await addMember(
    (taken) => {
      const { password: _pw, ...profile } = input;
      void _pw;
      const stored: StoredMember = {
        ...profile,
        id,
        memberNumber: generateMemberNumber(input.lastName, input.firstName, input.birthDate, season.start, taken),
        token: randomBytes(18).toString("base64url"),
        season: season.label,
        authorizations: files.map((f) => ({ id: f.id, name: f.name, size: f.bytes.length })),
        guardian: minor ? input.guardian : undefined,
        joinedAt: now.toISOString(),
        validUntil: season.validUntil,
        passwordHash,
      };
      return stored;
    },
    files,
    input.email,
    id,
  );
  if (!result.ok) return json({ error: "Un compte existe déjà avec cette adresse e-mail.", errors: { email: "Adresse déjà utilisée : connectez-vous." } }, 409);

  const m = result.member;
  const plan = await defaultPlan();
  if (plan) await createMembership(m, plan);
  await sendTemplate("welcome", m.email, { prenom: m.firstName, saison: m.season, numero: m.memberNumber }, "welcome");
  await setSession(m.id);
  return json({ ok: true, memberNumber: m.memberNumber }, 201);
}
