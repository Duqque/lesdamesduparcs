import "server-only";
import { deleteBlob, getBlob, photoKey, putBlob } from "./blobs";
import { dimensions, sniff } from "./media";

/** Photo de profil (facultative) : portrait 300×400px, déposée déjà recadrée par le navigateur (voir PhotoCropField). */
export const PHOTO_WIDTH = 300;
export const PHOTO_HEIGHT = 400;
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export async function savePhoto(memberId: string, file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: "Fichier vide." };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: "Fichier trop volumineux (3 Mo maximum)." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime || !["image/jpeg", "image/png", "image/webp"].includes(mime)) return { ok: false, error: "Format d'image non accepté (JPEG, PNG ou WebP)." };
  const { width, height } = dimensions(bytes, mime);
  if (width !== PHOTO_WIDTH || height !== PHOTO_HEIGHT) return { ok: false, error: `La photo doit faire exactement ${PHOTO_WIDTH}×${PHOTO_HEIGHT}px.` };
  await putBlob(photoKey(memberId), bytes, mime);
  return { ok: true };
}

export const readPhoto = (memberId: string) => getBlob(photoKey(memberId));
export const removePhoto = (memberId: string) => deleteBlob(photoKey(memberId));
