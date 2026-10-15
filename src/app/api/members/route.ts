import { randomBytes, randomUUID } from "node:crypto";
import { json, throttled, tooMany } from "@/lib/server/http";
import { authConfigured, setSession } from "@/lib/server/session";
import { getAdmin } from "@/lib/server/admin-auth";
import { hashPassword } from "@/lib/server/password";
import { addMember, listMembers, type StoredMember } from "@/lib/server/store";
import { MAX_AUTH_FILE_BYTES, generateMemberNumber, MAX_AUTH_FILES, isMinor } from "@/lib/members";
import { parseSignup } from "@/lib/server/member-signup";
import { seasonOf } from "@/lib/season";
import { ADHESION_CAP_MESSAGE, adhesionCapStatus, createMembership, defaultPlan } from "@/lib/server/business";
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
  // Plafond de la première vague (Configuration > Adhésions) : une nouvelle inscription compte toujours comme une nouvelle adhésion.
  if ((await adhesionCapStatus()).blocked) return json({ error: ADHESION_CAP_MESSAGE }, 403);

  const form = await req.formData().catch(() => null);
  if (!form) return json({ error: "Requête invalide." }, 400);
  const parsed = await parseSignup(form);
  if (!parsed.ok) return json({ error: parsed.error, ...("errors" in parsed ? { errors: parsed.errors } : {}) }, parsed.status);
  const { input, minor, files } = parsed;

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
  // Le compte est créé et connecté : la page suivante propose le paiement de l'adhésion (en ligne, ou plus tard par espèces / chèque).
  return json({ ok: true, memberNumber: m.memberNumber, next: "/rejoindre-le-groupe/paiement" }, 201);
}
