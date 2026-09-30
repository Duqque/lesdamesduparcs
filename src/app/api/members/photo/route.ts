import { json } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber, updateMember } from "@/lib/server/store";
import { removePhoto, savePhoto } from "@/lib/server/photo";

/** Photo de profil (facultative), déposée depuis /profil : déjà recadrée en 300×400 par le navigateur (voir PhotoCropField). */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  const m = await getMemberByNumber(s.memberNumber);
  if (!m) return json({ error: "Compte introuvable." }, 404);
  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) return json({ error: "Aucune photo reçue." }, 400);
  const res = await savePhoto(m.id, file);
  if (!res.ok) return json({ error: res.error }, 400);
  await updateMember(m.id, { photo: { updatedAt: new Date().toISOString() } });
  return json({ ok: true });
}

export async function DELETE() {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  const m = await getMemberByNumber(s.memberNumber);
  if (!m) return json({ error: "Compte introuvable." }, 404);
  if (m.photo) await removePhoto(m.id);
  await updateMember(m.id, { photo: undefined });
  return json({ ok: true });
}
