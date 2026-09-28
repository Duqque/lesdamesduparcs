import "server-only";
import { after } from "next/server";
import { formatLongDate } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { settings } from "./admin-store";
import { memberships, payments, effectiveStatus, type Membership, type Payment } from "./business";
import { articlesDb, emailLog, ensureTemplates, templates } from "./content";
import { collection, type Row } from "./db";
import { sendBulk } from "./email";
import { eventsDb } from "./events";
import { siteOrigin } from "./http";
import { productsDb } from "./shop";
import { listStoredMembers } from "./store";
import { unsubscribeToken } from "./unsubscribe";

/**
 * E-mails de nouveautés aux adhérentes actives : un message à chaque nouvel article, nouvel événement ou nouveau produit.
 *
 * Principe (robuste, sans doublon) : on parcourt ce qui est PUBLIC ; tout élément jamais annoncé (clé enregistrée dans
 * automation_log) est annoncé une seule fois. La clé est enregistrée AVANT l'envoi : même si deux traitements se croisent,
 * personne ne reçoit deux fois le même message. Les publications programmées sont rattrapées par la tâche planifiée.
 * Au tout premier passage, le contenu déjà en ligne est enregistré comme « déjà annoncé » (sans envoi) : seules les vraies
 * nouveautés partent, jamais l'historique.
 */
interface NotifyLog extends Row {
  key: string;
  note?: string;
}
const notified = collection<NotifyLog>("automation_log");

interface Item {
  key: string;
  kind: "article" | "event" | "product";
  template: "new_article" | "new_event" | "new_product";
  mailKind: "nouvel-article" | "nouvel-evenement" | "nouveau-produit";
  title: string;
  summary: string;
  path: string;
  image?: { src: string; alt: string };
  extra: Record<string, string>;
  /** Créé très récemment par l'équipe : à annoncer même au premier passage */
  fresh: boolean;
}

const FRESH_MS = 15 * 60_000;
const isFresh = (r: { createdAt: string; origin?: string }) => r.origin !== "seed" && Date.now() - new Date(r.createdAt).getTime() < FRESH_MS;
const today = () => new Date().toISOString().slice(0, 10);

async function collectItems(): Promise<Item[]> {
  const now = Date.now();
  const items: Item[] = [];
  for (const a of await articlesDb.all()) {
    if (!(a.status === "published" || (a.status === "scheduled" && a.publishAt && new Date(a.publishAt).getTime() <= now))) continue;
    items.push({ key: `notify:article:${a.id}`, kind: "article", template: "new_article", mailKind: "nouvel-article", title: a.title, summary: a.summary, path: `/actualites/${a.id}`, image: a.image ? { src: a.image, alt: a.imageAlt } : undefined, extra: {}, fresh: isFresh(a) });
  }
  for (const e of await eventsDb.all()) {
    const live = e.status === "published" || e.status === undefined || (e.status === "scheduled" && e.publishAt !== undefined && new Date(e.publishAt).getTime() <= now);
    if (!live || e.date < today()) continue;
    items.push({ key: `notify:event:${e.id}`, kind: "event", template: "new_event", mailKind: "nouvel-evenement", title: e.title, summary: e.summary, path: `/evenements/${e.id}`, image: e.image ? { src: e.image, alt: e.imageAlt } : undefined, extra: { date: `${formatLongDate(e.date)}${e.time ? ` à ${e.time}` : ""}`, lieu: e.venue }, fresh: isFresh(e) });
  }
  for (const p of await productsDb.all()) {
    if (p.status !== "active") continue;
    items.push({ key: `notify:product:${p.id}`, kind: "product", template: "new_product", mailKind: "nouveau-produit", title: p.name, summary: p.tagline || p.description, path: `/boutique/${p.id}`, image: p.images[0] ? { src: p.images[0], alt: p.name } : undefined, extra: { prix: formatEuros(p.priceCents) }, fresh: isFresh(p) });
  }
  return items;
}

/** Adhérentes actives (adhésion en cours ET réglée, compte non suspendu) qui n'ont pas refusé les e-mails de nouveautés. */
export async function newsRecipients() {
  const [members, ms, pays] = await Promise.all([listStoredMembers(), memberships.all(), payments.all()]);
  const payByMs = new Map<string, Payment>();
  for (const p of pays) if (p.kind === "adhesion" && p.membershipId) payByMs.set(p.membershipId, p);
  const latest = new Map<string, Membership>();
  for (const m of ms) {
    const cur = latest.get(m.memberId);
    if (!cur || m.startsAt > cur.startsAt) latest.set(m.memberId, m);
  }
  const out: Array<{ id: string; email: string; firstName: string }> = [];
  const seen = new Set<string>();
  for (const m of members) {
    if (m.status === "anonymized" || m.status === "suspended" || m.status === "expelled" || m.emailUpdates === false) continue;
    const cur = latest.get(m.id);
    if (!cur || effectiveStatus(cur) !== "active") continue;
    const pay = payByMs.get(cur.id);
    if (pay && pay.status !== "paid") continue;
    const email = m.email.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push({ id: m.id, email: m.email, firstName: m.firstName });
  }
  return out;
}

let running: Promise<unknown> | null = null;

/** Annonce aux adhérentes ce qui vient d'être publié. Sans danger à rappeler : chaque élément n'est annoncé qu'une fois. */
export function notifyNewContent() {
  running = (running ?? Promise.resolve()).then(run, run);
  return running as Promise<{ announced: number; recipients: number }>;
}

/** Premier passage : le contenu déjà en ligne est enregistré comme « déjà annoncé ». Appelé dès le démarrage du site (contrôle de santé, administration). */
async function baseline(items: Item[], logged: Set<string>) {
  if (logged.has("notify:init")) return;
  for (const it of items) if (!it.fresh && !logged.has(it.key)) await notified.insert({ key: it.key, note: "existant" }).then(() => logged.add(it.key));
  await notified.insert({ key: "notify:init" });
  logged.add("notify:init");
}

let baselined = false;
export function ensureNotifyBaseline() {
  if (baselined) return Promise.resolve();
  baselined = true;
  running = (running ?? Promise.resolve()).then(async () => baseline(await collectItems(), new Set((await notified.all()).map((l) => l.key))), () => undefined);
  return running as Promise<void>;
}

async function run(): Promise<{ announced: number; recipients: number }> {
  const conf = (await settings.get()).automations;
  const items = await collectItems();
  const logged = new Set((await notified.all()).map((l) => l.key));
  await baseline(items, logged);
  const pending = items.filter((it) => !logged.has(it.key));
  if (!pending.length) return { announced: 0, recipients: 0 };

  await ensureTemplates();
  const flag = { article: conf.notifyArticle, event: conf.notifyEvent, product: conf.notifyProduct } as const;
  const list = await newsRecipients();
  let origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.lesdamesduparc.com";
  try {
    origin = await siteOrigin();
  } catch {
    /* tâche planifiée : adresse configurée */
  }
  const links = new Map<string, string>();
  for (const r of list) links.set(r.id, `${origin}/desabonnement?t=${encodeURIComponent(await unsubscribeToken(r.id))}`);

  let announced = 0;
  for (const it of pending) {
    // Enregistré avant l'envoi : jamais deux annonces pour le même élément.
    await notified.insert({ key: it.key, note: flag[it.kind] ? undefined : "automatisation désactivée" });
    if (!flag[it.kind]) continue;
    const tpl = await templates.findOne((t) => t.key === it.template);
    if (!tpl) continue;
    const vars = { titre: it.title, resume: it.summary, lien: `${origin}${it.path}`, date: "", lieu: "", prix: "", ...it.extra };
    // {{prenom}} reste à remplir pour chaque destinataire : on ne remplace que les variables de l'élément.
    const fillItem = (text: string) => text.replace(/\{\{(\w+)\}\}/g, (m, k: string) => (k === "prenom" ? m : String(vars[k as keyof typeof vars] ?? "")));
    const body = fillItem(tpl.body).replace(/\n{3,}/g, "\n\n");
    const res = await sendBulk(
      list.map((r) => ({ email: r.email, firstName: r.firstName, unsubscribeUrl: links.get(r.id)! })),
      { subject: fillItem(tpl.subject), body, kind: it.mailKind, image: it.image ? { src: it.image.src.startsWith("http") ? it.image.src : `${origin}${it.image.src}`, alt: it.image.alt } : undefined },
    );
    announced++;
    if (res.failed) await emailLog.insert({ to: `${res.failed} destinataire(s)`, subject: it.title, kind: it.mailKind, status: "failed", detail: "Envoi partiel : consultez le service d'e-mail." });
  }
  return { announced, recipients: list.length };
}

/** À appeler après l'enregistrement d'un article, d'un événement ou d'un produit : l'annonce part après la réponse à l'administratrice. */
export function announceAfterSave() {
  try {
    after(() => notifyNewContent().catch(() => undefined));
  } catch {
    void notifyNewContent().catch(() => undefined);
  }
}
