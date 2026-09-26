import "server-only";
import mysql, { type Pool } from "mysql2/promise";

/**
 * Stockage MySQL / MariaDB (Infomaniak…) : activé par la variable DATABASE_URL, ex.
 *   mysql://utilisateur:motdepasse@hote:3306/nomdelabase   (encoder les caractères spéciaux du mot de passe : @ → %40)
 * Toutes les collections vivent dans une seule table de documents JSON ; elle est créée automatiquement.
 */
export const sqlEnabled = () => Boolean(process.env.DATABASE_URL);

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

export function getPool(): Pool {
  if (!pool) {
    const u = new URL(process.env.DATABASE_URL!);
    pool = mysql.createPool({
      host: u.hostname,
      port: Number(u.port) || 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ""),
      charset: "utf8mb4",
      connectionLimit: 6,
      connectTimeout: 10_000,
      waitForConnections: true,
    });
  }
  return pool;
}

/** Crée les tables au premier usage (documents, fichiers, compteurs de limitation). */
export function ensureSchema(): Promise<void> {
  ready ??= getPool()
    .query(
      `CREATE TABLE IF NOT EXISTS ddp_docs (
        seq BIGINT NOT NULL AUTO_INCREMENT,
        coll VARCHAR(64) NOT NULL,
        id VARCHAR(191) NOT NULL,
        data LONGTEXT NOT NULL,
        PRIMARY KEY (coll, id),
        UNIQUE KEY uq_seq (seq)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
    )
    .then(() =>
      getPool().query(
        `CREATE TABLE IF NOT EXISTS ddp_files (
          id VARCHAR(191) NOT NULL,
          mime VARCHAR(100) NOT NULL,
          size INT NOT NULL,
          data LONGBLOB NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
      ),
    )
    .then(() =>
      getPool().query(
        `CREATE TABLE IF NOT EXISTS ddp_rate (
          k VARCHAR(191) NOT NULL,
          reset_at BIGINT NOT NULL,
          n INT NOT NULL,
          PRIMARY KEY (k)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
      ),
    )
    .then(() => undefined);
  ready.catch(() => {
    ready = null;
  });
  return ready;
}

export async function sqlAll<T>(coll: string): Promise<T[]> {
  await ensureSchema();
  const [rows] = await getPool().query("SELECT data FROM ddp_docs WHERE coll = ? ORDER BY seq", [coll]);
  return (rows as Array<{ data: string }>).map((r) => JSON.parse(r.data) as T);
}

export async function sqlGet<T>(coll: string, id: string): Promise<T | null> {
  await ensureSchema();
  const [rows] = await getPool().query("SELECT data FROM ddp_docs WHERE coll = ? AND id = ?", [coll, id]);
  const r = (rows as Array<{ data: string }>)[0];
  return r ? (JSON.parse(r.data) as T) : null;
}

export async function sqlUpsert(coll: string, id: string, doc: unknown) {
  await ensureSchema();
  await getPool().query("INSERT INTO ddp_docs (coll, id, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)", [coll, id, JSON.stringify(doc)]);
}

export async function sqlDelete(coll: string, id: string) {
  await ensureSchema();
  const [res] = await getPool().query("DELETE FROM ddp_docs WHERE coll = ? AND id = ?", [coll, id]);
  return (res as { affectedRows: number }).affectedRows > 0;
}

/** Remplace tout le contenu d'une collection en n'écrivant que les différences (transaction). */
export async function sqlReplaceAll<T extends { id: string }>(coll: string, before: T[], after: T[]) {
  await ensureSchema();
  const old = new Map(before.map((r) => [r.id, JSON.stringify(r)]));
  const keep = new Set(after.map((r) => r.id));
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    for (const r of before) if (!keep.has(r.id)) await conn.query("DELETE FROM ddp_docs WHERE coll = ? AND id = ?", [coll, r.id]);
    for (const r of after) {
      const json = JSON.stringify(r);
      if (old.get(r.id) !== json) await conn.query("INSERT INTO ddp_docs (coll, id, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)", [coll, r.id, json]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** Marque une collection comme déjà initialisée (jeu de départ inséré une seule fois). */
export async function sqlSeeded(coll: string): Promise<boolean> {
  return (await sqlGet("__seeded", coll)) !== null;
}
export const sqlMarkSeeded = (coll: string) => sqlUpsert("__seeded", coll, { id: coll });

/* ---------- Fichiers (pièces déposées, médiathèque) ---------- */

export async function sqlPutFile(id: string, mime: string, bytes: Buffer) {
  await ensureSchema();
  await getPool().query("INSERT INTO ddp_files (id, mime, size, data) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE mime = VALUES(mime), size = VALUES(size), data = VALUES(data)", [id, mime, bytes.length, bytes]);
}

export async function sqlGetFile(id: string): Promise<{ mime: string; bytes: Buffer } | null> {
  await ensureSchema();
  const [rows] = await getPool().query("SELECT mime, data FROM ddp_files WHERE id = ?", [id]);
  const r = (rows as Array<{ mime: string; data: Buffer }>)[0];
  return r ? { mime: r.mime, bytes: Buffer.from(r.data) } : null;
}

export async function sqlDeleteFile(id: string) {
  await ensureSchema();
  await getPool().query("DELETE FROM ddp_files WHERE id = ?", [id]);
}

/* ---------- Compteurs de limitation (partagés entre processus) ---------- */

/** Incrémente atomiquement le compteur `key` (fenêtre glissante fixe) et renvoie sa valeur. */
export async function sqlHit(key: string, windowMs: number): Promise<number> {
  await ensureSchema();
  const now = Date.now();
  const conn = await getPool().getConnection();
  try {
    await conn.query(
      "INSERT INTO ddp_rate (k, reset_at, n) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE n = IF(reset_at < ?, 1, n + 1), reset_at = IF(reset_at < ?, ?, reset_at)",
      [key, now + windowMs, now, now, now + windowMs],
    );
    const [rows] = await conn.query("SELECT n FROM ddp_rate WHERE k = ?", [key]);
    return Number((rows as Array<{ n: number }>)[0]?.n ?? 1);
  } finally {
    conn.release();
  }
}

export async function sqlPurgeRate() {
  await ensureSchema();
  await getPool().query("DELETE FROM ddp_rate WHERE reset_at < ?", [Date.now()]);
}

/** Verrou d'écriture global (GET_LOCK) : sérialise les modifications même avec plusieurs processus Node. */
export async function withSqlLock<T>(fn: () => Promise<T>): Promise<T> {
  await ensureSchema();
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.query("SELECT GET_LOCK('ddp_write', 30) AS ok");
    if (Number((rows as Array<{ ok: number | null }>)[0]?.ok) !== 1) throw new Error("Base de données occupée, réessayez.");
    try {
      return await fn();
    } finally {
      await conn.query("SELECT RELEASE_LOCK('ddp_write')").catch(() => undefined);
    }
  } finally {
    conn.release();
  }
}

/** État de la base pour l'écran de sécurité de l'administration. */
export async function sqlStats() {
  await ensureSchema();
  const [rows] = await getPool().query("SELECT coll, COUNT(*) AS n FROM ddp_docs WHERE coll NOT LIKE '\\_\\_%' GROUP BY coll ORDER BY coll");
  const [files] = await getPool().query("SELECT COUNT(*) AS n, COALESCE(SUM(size),0) AS bytes FROM ddp_files");
  const [ver] = await getPool().query("SELECT VERSION() AS v");
  return {
    version: String((ver as Array<{ v: string }>)[0]?.v ?? ""),
    collections: (rows as Array<{ coll: string; n: number }>).map((r) => ({ name: r.coll, count: Number(r.n) })),
    files: { count: Number((files as Array<{ n: number }>)[0]?.n ?? 0), bytes: Number((files as Array<{ bytes: number }>)[0]?.bytes ?? 0) },
  };
}
