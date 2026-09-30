import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { sqlAll, sqlDelete, sqlEnabled, sqlGet, sqlMarkSeeded, sqlReplaceAll, sqlSeeded, sqlUpsert, withSqlLock } from "./sql";

/**
 * Données du site. Deux stockages avec la même interface :
 *  - MySQL / MariaDB quand DATABASE_URL est défini (production) ;
 *  - fichiers JSON dans .data/ sinon (développement local).
 * Les écritures sont sérialisées : file d'attente dans le processus + verrou MySQL (GET_LOCK) entre processus.
 */
export const DATA_DIR = path.join(process.cwd(), ".data");

let queue: Promise<unknown> = Promise.resolve();
const guarded = <T>(fn: () => Promise<T>) => (sqlEnabled() ? withSqlLock(fn) : fn());
export const locked = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(() => guarded(fn), () => guarded(fn));
  queue = run.catch(() => undefined);
  return run;
};

export interface Row {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const newId = () => randomUUID();
const nowIso = () => new Date().toISOString();

/* ---------- Stockage de listes (fichier ou SQL) ---------- */

async function fileRead<T>(file: string): Promise<T[] | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T[];
  } catch {
    return null;
  }
}
async function fileWrite<T>(file: string, rows: T[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(rows, null, 2), "utf8");
  await rename(tmp, file);
}

/**
 * Liste de documents identifiés par `id`, lue et écrite en bloc (utilisée par les anciennes files d'attente
 * d'adhérentes, d'inscriptions et de commandes). `seed` : jeu de départ inséré une seule fois.
 */
export function listStore<T extends { id: string }>(name: string, seed?: () => T[]) {
  const file = path.join(DATA_DIR, `${name}.json`);
  return {
    async read(): Promise<T[]> {
      if (sqlEnabled()) {
        if (seed && !(await sqlSeeded(name))) {
          const rows = seed();
          for (const r of rows) await sqlUpsert(name, r.id, r);
          await sqlMarkSeeded(name);
          return rows;
        }
        return sqlAll<T>(name);
      }
      const rows = await fileRead<T>(file);
      if (rows) return rows;
      if (!seed) return [];
      const fresh = seed();
      await fileWrite(file, fresh);
      return fresh;
    },
    async write(next: T[], previous: T[]) {
      if (sqlEnabled()) return sqlReplaceAll(name, previous, next);
      return fileWrite(file, next);
    },
    /** Lecture directe d'un document (SQL : une seule ligne). */
    async get(id: string): Promise<T | null> {
      if (sqlEnabled()) {
        if (seed && !(await sqlSeeded(name))) await this.read();
        return sqlGet<T>(name, id);
      }
      return (await this.read()).find((r) => r.id === id) ?? null;
    },
    async upsert(doc: T) {
      if (sqlEnabled()) return sqlUpsert(name, doc.id, doc);
      const rows = await this.read();
      const i = rows.findIndex((r) => r.id === doc.id);
      await fileWrite(file, i >= 0 ? rows.map((r, j) => (j === i ? doc : r)) : [...rows, doc]);
    },
    async remove(id: string) {
      if (sqlEnabled()) return sqlDelete(name, id);
      const rows = await this.read();
      const next = rows.filter((r) => r.id !== id);
      if (next.length === rows.length) return false;
      await fileWrite(file, next);
      return true;
    },
  };
}

export function collection<T extends Row>(name: string, seed?: () => Array<Omit<T, "createdAt" | "updatedAt"> & Partial<Row>>) {
  const store = listStore<T>(
    name,
    seed
      ? () => {
          const t = nowIso();
          return seed().map((r) => ({ createdAt: t, updatedAt: t, ...r })) as T[];
        }
      : undefined,
  );
  const read = () => store.read();

  /**
   * Variantes « Unlocked » : mêmes opérations, mais sans acquérir `locked()` — réservées à un appelant qui détient
   * déjà le verrou (ex. src/lib/server/discord/store.ts::linkDiscordAccount). Les utiliser hors d'un `locked()` déjà
   * actif retire la protection contre les accès concurrents ; les méthodes publiques ci-dessous restent le seul
   * point d'entrée normal.
   */
  const insertUnlocked = async (data: Omit<T, keyof Row> & Partial<Row>) => {
    const t = nowIso();
    const row = { id: newId(), createdAt: t, updatedAt: t, ...data } as T;
    if (sqlEnabled()) await store.get(row.id); // initialise le jeu de départ éventuel
    await store.upsert(row);
    return row;
  };
  const updateUnlocked = async (id: string, patch: Partial<Omit<T, "id" | "createdAt">>) => {
    const cur = await store.get(id);
    if (!cur) return null;
    const next = { ...cur, ...patch, updatedAt: nowIso() } as T;
    await store.upsert(next);
    return next;
  };
  const removeUnlocked = (id: string) => store.remove(id);

  return {
    all: () => read(),
    get: (id: string) => store.get(id),
    find: (pred: (x: T) => boolean) => read().then((r) => r.filter(pred)),
    findOne: (pred: (x: T) => boolean) => read().then((r) => r.find(pred) ?? null),
    insert: (data: Omit<T, keyof Row> & Partial<Row>) => locked(() => insertUnlocked(data)),
    insertUnlocked,
    update: (id: string, patch: Partial<Omit<T, "id" | "createdAt">>) => locked(() => updateUnlocked(id, patch)),
    updateUnlocked,
    remove: (id: string) => locked(() => removeUnlocked(id)),
    removeUnlocked,
    /** Modification atomique de toute la collection (ex. purge, réordonnancement). */
    mutate: (fn: (rows: T[]) => T[]) =>
      locked(async () => {
        const before = await read();
        const next = fn(before);
        await store.write(next, before);
        return next;
      }),
  };
}

/** Document unique (paramètres, configuration de l'accueil…). */
export function singleton<T extends object>(name: string, defaults: T) {
  const store = listStore<{ id: string }>("__singletons");
  const file = path.join(DATA_DIR, `${name}.json`);
  const read = async (): Promise<T> => {
    if (sqlEnabled()) {
      const doc = (await store.get(name)) as (Partial<T> & { id: string }) | null;
      if (!doc) return { ...defaults };
      const { id: _id, ...rest } = doc;
      void _id;
      return { ...defaults, ...(rest as Partial<T>) };
    }
    try {
      return { ...defaults, ...(JSON.parse(await readFile(file, "utf8")) as Partial<T>) };
    } catch {
      return { ...defaults };
    }
  };
  return {
    get: read,
    set: (patch: Partial<T>) =>
      locked(async () => {
        const next = { ...(await read()), ...patch };
        if (sqlEnabled()) await store.upsert({ id: name, ...next });
        else {
          await mkdir(DATA_DIR, { recursive: true });
          const tmp = `${file}.${randomUUID()}.tmp`;
          await writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
          await rename(tmp, file);
        }
        return next;
      }),
  };
}

export { path };
