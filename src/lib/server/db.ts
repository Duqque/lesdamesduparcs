import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Base de données du back-office : collections JSON dans .data/ (écritures sérialisées, remplacement atomique).
 * Chaque collection expose la même interface : le passage à une vraie base (PostgreSQL, SQLite…) ne touchera que ce fichier.
 */
export const DATA_DIR = path.join(process.cwd(), ".data");

let queue: Promise<unknown> = Promise.resolve();
const locked = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn, fn);
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

export function collection<T extends Row>(name: string, seed?: () => Array<Omit<T, "createdAt" | "updatedAt"> & Partial<Row>>) {
  const file = path.join(DATA_DIR, `${name}.json`);

  async function read(): Promise<T[]> {
    try {
      return JSON.parse(await readFile(file, "utf8")) as T[];
    } catch {
      if (!seed) return [];
      const t = nowIso();
      const rows = seed().map((r) => ({ createdAt: t, updatedAt: t, ...r })) as T[];
      await write(rows);
      return rows;
    }
  }
  async function write(rows: T[]) {
    await mkdir(DATA_DIR, { recursive: true });
    const tmp = `${file}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(rows, null, 2), "utf8");
    await rename(tmp, file);
  }

  return {
    all: () => read(),
    get: (id: string) => read().then((r) => r.find((x) => x.id === id) ?? null),
    find: (pred: (x: T) => boolean) => read().then((r) => r.filter(pred)),
    findOne: (pred: (x: T) => boolean) => read().then((r) => r.find(pred) ?? null),
    insert: (data: Omit<T, keyof Row> & Partial<Row>) =>
      locked(async () => {
        const t = nowIso();
        const row = { id: newId(), createdAt: t, updatedAt: t, ...data } as T;
        await write([...(await read()), row]);
        return row;
      }),
    update: (id: string, patch: Partial<Omit<T, "id" | "createdAt">>) =>
      locked(async () => {
        const rows = await read();
        const i = rows.findIndex((x) => x.id === id);
        if (i < 0) return null;
        rows[i] = { ...rows[i], ...patch, updatedAt: nowIso() };
        await write(rows);
        return rows[i];
      }),
    remove: (id: string) =>
      locked(async () => {
        const rows = await read();
        const next = rows.filter((x) => x.id !== id);
        if (next.length === rows.length) return false;
        await write(next);
        return true;
      }),
    /** Modification atomique de toute la collection (ex. purge, réordonnancement). */
    mutate: (fn: (rows: T[]) => T[]) =>
      locked(async () => {
        const next = fn(await read());
        await write(next);
        return next;
      }),
  };
}

/** Document unique (paramètres, configuration de l'accueil…). */
export function singleton<T extends object>(name: string, defaults: T) {
  const file = path.join(DATA_DIR, `${name}.json`);
  const read = async (): Promise<T> => {
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
        await mkdir(DATA_DIR, { recursive: true });
        const tmp = `${file}.${randomUUID()}.tmp`;
        await writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
        await rename(tmp, file);
        return next;
      }),
  };
}

export { path };
