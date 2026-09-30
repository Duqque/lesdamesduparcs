import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./db";
import { sqlDeleteFile, sqlEnabled, sqlGetFile, sqlPutFile } from "./sql";

/**
 * Fichiers binaires (autorisations parentales, médiathèque) : dans la base de données (table ddp_files) dès que
 * DATABASE_URL est défini, sinon dans .data/files/ (développement local). Les clés sont contrôlées : jamais de chemin libre.
 */
const KEY = /^[A-Za-z0-9_-]{1,120}$/;
const dir = path.join(DATA_DIR, "files");

const check = (key: string) => {
  if (!KEY.test(key)) throw new Error("Clé de fichier invalide.");
  return key;
};

export async function putBlob(key: string, bytes: Buffer, mime: string) {
  check(key);
  if (sqlEnabled()) return sqlPutFile(key, mime, bytes);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, key), bytes);
  await writeFile(path.join(dir, `${key}.mime`), mime);
}

export async function getBlob(key: string): Promise<{ bytes: Buffer; mime: string } | null> {
  check(key);
  if (sqlEnabled()) return sqlGetFile(key);
  try {
    return { bytes: await readFile(path.join(dir, key)), mime: await readFile(path.join(dir, `${key}.mime`), "utf8") };
  } catch {
    return null;
  }
}

export async function deleteBlob(key: string) {
  check(key);
  if (sqlEnabled()) return sqlDeleteFile(key);
  await rm(path.join(dir, key), { force: true });
  await rm(path.join(dir, `${key}.mime`), { force: true });
}

export const authorizationKey = (memberId: string, fileId: string) => `auth-${memberId}-${fileId}`;
export const mediaKey = (id: string) => `media-${id}`;
export const photoKey = (memberId: string) => `photo-${memberId}`;
