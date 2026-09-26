import { json, readJson, throttled, tooMany } from "@/lib/server/http";
import { consumeMemberResetToken } from "@/lib/server/member-reset";
import { passwordIssue } from "@/lib/members";

export async function POST(req: Request) {
  if (await throttled(req, "reset", 10, 3_600_000)) return tooMany();
  const body = await readJson<{ token?: string; password?: string }>(req, 4 * 1024);
  const password = String(body?.password ?? "").slice(0, 200);
  const issue = passwordIssue(password);
  if (issue) return json({ error: issue }, 422);
  if (!(await consumeMemberResetToken(String(body?.token ?? "").slice(0, 100), password))) return json({ error: "Lien invalide ou expiré. Demandez-en un nouveau." }, 400);
  return json({ ok: true });
}
