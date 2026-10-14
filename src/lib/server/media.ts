import "server-only";
import { randomUUID } from "node:crypto";
import { deleteBlob, getBlob, mediaKey, putBlob } from "./blobs";
import { mediaDb, type MediaFile } from "./content";

export const MAX_MEDIA_BYTES = 12 * 1024 * 1024;

const TYPES: Record<string, { ext: string; folder: MediaFile["folder"] }> = {
  "image/jpeg": { ext: "jpg", folder: "photos" },
  "image/png": { ext: "png", folder: "photos" },
  "image/webp": { ext: "webp", folder: "photos" },
  "image/gif": { ext: "gif", folder: "photos" },
  "image/svg+xml": { ext: "svg", folder: "logos" },
  "video/mp4": { ext: "mp4", folder: "videos" },
  "video/webm": { ext: "webm", folder: "videos" },
  "application/pdf": { ext: "pdf", folder: "documents" },
};

/** Contrôle du contenu réel du fichier (et non de son nom) : évite de déposer autre chose qu'une image, une vidéo ou un PDF. */
export function sniff(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (b.subarray(0, 3).toString("latin1") === "GIF") return "image/gif";
  if (b.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (b.subarray(4, 8).toString("latin1") === "ftyp") return "video/mp4";
  if (b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  const head = b.subarray(0, 300).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "image/svg+xml";
  return null;
}

export function dimensions(b: Buffer, mime: string): { width?: number; height?: number } {
  try {
    if (mime === "image/png") return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (mime === "image/gif") return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
    if (mime === "image/webp") {
      const kind = b.subarray(12, 16).toString("latin1");
      if (kind === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
      if (kind === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      if (kind === "VP8L") { const v = b.readUInt32LE(21); return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 }; }
    }
    if (mime === "image/jpeg") {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch {
    /* dimensions facultatives */
  }
  return {};
}

/** Au-delà, une photo est réduite à l'envoi (une photo de téléphone dépasse souvent 5 Mo pour un affichage plein écran). */
const MAX_SIDE = 2560;
const SHRINK_ABOVE_BYTES = 1.5 * 1024 * 1024;

/**
 * Allège une photo à l'envoi : redimensionnée à 2560 px au plus grand côté et convertie en WebP (qualité 82), seulement si
 * elle dépasse cette taille ou 1,5 Mo. Les SVG, GIF (animations) et petites images sont gardés tels quels. Sans `sharp`
 * sur le serveur, l'original est conservé (l'optimiseur d'images réduit de toute façon ce qui est affiché).
 */
async function shrinkImage(bytes: Buffer, mime: string): Promise<{ bytes: Buffer; mime: string }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return { bytes, mime };
  const { width = 0, height = 0 } = dimensions(bytes, mime);
  if (Math.max(width, height) <= MAX_SIDE && bytes.length <= SHRINK_ABOVE_BYTES) return { bytes, mime };
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(bytes).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    return out.length < bytes.length ? { bytes: out, mime: "image/webp" } : { bytes, mime };
  } catch {
    return { bytes, mime };
  }
}

export async function saveMedia(file: File): Promise<{ ok: true; media: MediaFile } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: "Fichier vide." };
  if (file.size > MAX_MEDIA_BYTES) return { ok: false, error: "Fichier trop volumineux (12 Mo maximum)." };
  const raw = Buffer.from(await file.arrayBuffer());
  const sniffed = sniff(raw);
  if (!sniffed || !TYPES[sniffed]) return { ok: false, error: `« ${file.name} » : type de fichier non accepté (images, vidéos MP4/WebM, PDF).` };
  const { bytes, mime } = await shrinkImage(raw, sniffed);
  const id = randomUUID().replace(/-/g, "").slice(0, 16);
  await putBlob(mediaKey(id), bytes, mime);
  const lower = file.name.toLowerCase();
  const folder = /logo/.test(lower) ? "logos" : /affiche|poster/.test(lower) ? "affiches" : TYPES[mime].folder;
  const media = await mediaDb.insert({ id, name: file.name.slice(0, 120), mime, size: bytes.length, ext: TYPES[mime].ext, folder, ...dimensions(bytes, mime) } as never);
  return { ok: true, media };
}

/** Remplace le contenu d'un média en conservant son adresse publique (/medias/[id]). */
export async function replaceMedia(id: string, file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  const old = await mediaDb.get(id);
  if (!old) return { ok: false, error: "Média introuvable." };
  if (file.size === 0 || file.size > MAX_MEDIA_BYTES) return { ok: false, error: "Fichier vide ou trop volumineux (12 Mo maximum)." };
  const raw = Buffer.from(await file.arrayBuffer());
  const sniffed = sniff(raw);
  if (!sniffed || !TYPES[sniffed]) return { ok: false, error: "Type de fichier non accepté." };
  const { bytes, mime } = await shrinkImage(raw, sniffed);
  await putBlob(mediaKey(id), bytes, mime);
  await mediaDb.update(id, { mime, ext: TYPES[mime].ext, size: bytes.length, width: undefined, height: undefined, ...dimensions(bytes, mime) } as never);
  return { ok: true };
}

export async function readMedia(id: string) {
  const m = await mediaDb.get(id);
  if (!m) return null;
  const file = await getBlob(mediaKey(m.id));
  return file ? { media: m, bytes: file.bytes } : null;
}

export async function deleteMedia(id: string) {
  const m = await mediaDb.get(id);
  if (!m) return;
  await deleteBlob(mediaKey(m.id));
  await mediaDb.remove(id);
}

export const mediaUrl = (m: MediaFile) => `/medias/${m.id}`;
