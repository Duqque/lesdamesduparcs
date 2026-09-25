import { getSession } from "@/lib/server/session";
import { json } from "@/lib/server/http";

export async function GET() {
  const s = await getSession();
  if (!s) return json({ role: "anon" });
  return json(s);
}
