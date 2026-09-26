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

/** Crée la table au premier usage. */
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
