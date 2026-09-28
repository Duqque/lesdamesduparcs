// Tests d'intégration du paiement (adhésions, boutique, promotions, webhook, e-mails) contre un site en fonctionnement
// avec les faux serveurs HelloAsso et Resend (voir test.sh). Le stockage est en fichiers JSON : DATA_DIR pointe sur .data/.
import crypto from "node:crypto";
import fs from "node:fs";

const B = process.env.SITE ?? "http://localhost:3199";
const HA = "http://127.0.0.1:4599";
const RS = "http://127.0.0.1:4598";
const DATA = process.env.DATA_DIR ?? "/tmp/ddp-pay-test/.data";
const WSEC = "webhook-secret-1234567890";
const SIGKEY = "sigkey-abc";
const CRON = "cron-secret-1234567890";

const _f = globalThis.fetch;
globalThis.fetch = (u, o = {}) => _f(u, { signal: AbortSignal.timeout(30000), ...o });

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { (cond ? pass++ : fail++); console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  → " + extra}`); };
const read = (c) => { try { return JSON.parse(fs.readFileSync(`${DATA}/${c}.json`, "utf8")); } catch { return []; } };
const write = (c, rows) => fs.writeFileSync(`${DATA}/${c}.json`, JSON.stringify(rows));
const patchRow = (c, id, patch) => { const rows = read(c); const i = rows.findIndex((r) => r.id === id); rows[i] = { ...rows[i], ...patch }; write(c, rows); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ha = (p) => fetch(HA + p).then((r) => r.json());
const rs = (p) => fetch(RS + p).then((r) => r.json());

const jar = () => ({ c: {}, h() { return Object.entries(this.c).map(([k, v]) => `${k}=${v}`).join("; "); } });
async function call(method, path, { json, form, c, headers = {}, origin = B } = {}) {
  // Chaque requête simule une visiteuse différente (adresse IP distincte) : les limiteurs de tentatives ne faussent pas les tests.
  const h = { "x-forwarded-for": `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, ...headers };
  if (origin) h.Origin = origin;
  if (c) h.Cookie = c.h();
  let body;
  if (json) { body = JSON.stringify(json); h["content-type"] = "application/json"; }
  if (form) body = form;
  const res = await fetch(B + path, { method, headers: h, body, redirect: "manual" });
  if (c) for (const sc of res.headers.getSetCookie?.() ?? []) { const [kv] = sc.split(";"); const i = kv.indexOf("="); c.c[kv.slice(0, i)] = kv.slice(i + 1); }
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("json") ? await res.json().catch(() => null) : null;
  return { status: res.status, data, res, loc: res.headers.get("location") };
}
const webhookRaw = (qs, raw, extra = {}) => fetch(`${B}/api/webhooks/helloasso${qs}`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, ...extra }, body: raw });
const sign = (raw) => crypto.createHmac("sha256", SIGKEY).update(raw).digest("hex");
async function webhook(kind, ref, extra = {}) {
  const raw = JSON.stringify({ eventType: extra.eventType ?? "Order", data: { id: extra.dataId ?? 1, ...(extra.data ?? {}) }, metadata: { kind, ref } });
  const r = await webhookRaw(`?k=${WSEC}`, raw, { "x-ha-signature": sign(raw) });
  return { status: r.status, data: await r.json().catch(() => null), raw };
}

const member = (n, extra = {}) => ({ firstName: "Camille", lastName: "Payeuse" + n, birthDate: "1990-05-12", email: `pay${n}${Date.now()}@example.com`, phone: "0612345678", address: { line1: "1 rue de Paris", postalCode: "75016", city: "Paris", country: "France" }, password: "MotDePasse123", consents: { rules: true, privacy: true, image: true }, ...extra });
const signupForm = (m) => { const f = new FormData(); f.set("data", JSON.stringify(m)); return f; };
const contact = (n) => ({ email: `client${n}${Date.now()}@example.com`, firstName: "Marie", lastName: "Dupont" });

await call("GET", "/boutique");
await sleep(500);
const products = read("products");
const scarf = products.find((p) => p.id === "echarpe-fiere-parisienne") ?? products.find((p) => !p.sizes.length && p.trackStock);
const tee = products.find((p) => p.id === "tshirt-dames-du-parc") ?? products.find((p) => p.sizes.length && p.trackStock);
const stockOf = (p, size) => { const cur = read("products").find((x) => x.id === p.id); return cur.stock[size ?? "_"] ?? cur.stock[Object.keys(cur.stock)[0]]; };
const teeSize = tee.sizes[0];
const order = (id) => read("orders").find((o) => o.id === id);
const jobs = (orderId) => read("email_jobs").filter((j) => j.orderId === orderId);
const shopBody = (n, items, extra = {}) => ({ items, contact: contact(n), delivery: { mode: "event" }, acceptTerms: true, ...extra });
const payAndNotify = async (o, extra) => { await ha(`/__pay/${o.checkoutId}${extra ?? ""}`); return webhook("order", o.id); };

console.log(`\n== Panier et calcul serveur ==`);
const scarfStock0 = stockOf(scarf);
let r = await call("POST", "/api/checkout", { json: shopBody(1, [{ productId: scarf.id, qty: 2 }], { totalCents: 1, price: 1, discountCents: 99999, status: "PAID" }) });
ok("Commande créée (201) avec URL de paiement", r.status === 201 && r.data?.checkoutUrl?.startsWith("http://mock/pay/"), JSON.stringify(r.data));
let o1 = order(r.data.orderId);
ok("Le total est celui du catalogue (prix, réduction et statut envoyés par le navigateur sont ignorés)", o1.totalCents === scarf.priceCents * 2 && !o1.discountCents && o1.status === "awaiting_payment", JSON.stringify(o1));
ok("Numéro de commande DDP-AAAA-NNNNN", /^DDP-\d{4}-\d{5}$/.test(o1.orderNumber), o1.orderNumber);
ok("Les lignes copient nom et prix du moment", o1.lines[0].name === scarf.name && o1.lines[0].unitCents === scarf.priceCents);
const intents = await ha("/__intents");
const intent = intents.find((i) => String(i.id) === o1.checkoutId);
ok("HelloAsso reçoit le montant serveur et les métadonnées de rapprochement", intent.totalAmount === o1.totalCents && intent.metadata.kind === "order" && intent.metadata.ref === o1.id && intent.metadata.orderNumber === o1.orderNumber, JSON.stringify(intent?.metadata));
ok("Le stock est réservé dès la commande (deux articles), jamais négatif", stockOf(scarf) === scarfStock0 - 2, `${stockOf(scarf)} vs ${scarfStock0 - 2}`);
r = await call("POST", "/api/checkout", { json: shopBody(2, [{ productId: "produit-inexistant", qty: 1 }]) });
ok("Produit inexistant refusé", r.status === 400);
r = await call("POST", "/api/checkout", { json: shopBody(2, [{ productId: scarf.id, qty: 0 }]) });
ok("Quantité invalide refusée", r.status === 400);
r = await call("POST", "/api/checkout", { json: shopBody(2, [{ productId: tee.id, qty: 1 }]) });
ok("Taille obligatoire quand le produit en a", r.status === 400);
r = await call("POST", "/api/checkout", { json: { ...shopBody(2, [{ productId: scarf.id, qty: 1 }]), acceptTerms: false } });
ok("Conditions de vente obligatoires", r.status === 422);

console.log(`\n== Scénario B : paiement d'un produit, l'utilisatrice ferme son navigateur (webhook seul) ==`);
const stockBefore = stockOf(scarf);
const w1 = await payAndNotify(o1);
ok("Webhook valide : traitement (200)", w1.status === 200 && w1.data?.result === "paid", JSON.stringify(w1.data));
o1 = order(o1.id);
ok("Commande PAID (sans passage par la page de retour)", o1.status === "paid" && !!o1.paidAt);
ok("Le stock reste décrémenté (une seule fois)", stockOf(scarf) === stockBefore);
ok("Un seul paiement HelloAsso enregistré, unique par identifiant", read("helloasso_payments").filter((p) => p.ref === o1.id).length === 1);
ok("E-mail de confirmation mis en file (ORDER_CONFIRMATION)", jobs(o1.id).some((j) => j.type === "ORDER_CONFIRMATION"));
await sleep(1500);
ok("E-mail envoyé par Resend (confirmation + facture en pièce jointe)", (await rs("/__mails")).some((m) => /commande Les Dames du Parc est confirmée/.test(m.subject)) && (await rs("/__mails")).some((m) => m.attachments.some((a) => /^facture-/.test(a))));
ok("Facture éditée pour la commande", read("invoices").some((i) => i.txId === `order:${o1.id}`));
const st = await call("GET", `/api/orders/${o1.id}?t=${o1.token}`);
ok("GET /api/orders/{id} : PAID avec le jeton", st.status === 200 && st.data.status === "PAID", JSON.stringify(st.data));
ok("GET /api/orders/{id} : refusé sans le bon jeton", (await call("GET", `/api/orders/${o1.id}?t=faux`)).status === 404);

console.log(`\n== Scénario F : même notification reçue deux fois ==`);
const jobsBefore = read("email_jobs").length, paysBefore = read("helloasso_payments").length, mailsBefore = (await rs("/__mails")).length;
const dup = await webhookRaw(`?k=${WSEC}`, w1.raw, { "x-ha-signature": sign(w1.raw) });
const dupData = await dup.json();
ok("Notification rejouée : 200 et « duplicate »", dup.status === 200 && dupData.duplicate === true, JSON.stringify(dupData));
await sleep(800);
ok("Aucun second paiement, aucune seconde tâche e-mail, aucun second e-mail", read("helloasso_payments").length === paysBefore && read("email_jobs").length === jobsBefore && (await rs("/__mails")).length === mailsBefore);
const other = await webhook("order", o1.id, { dataId: 2, eventType: "Payment" });
ok("Autre notification de la même commande : idempotent (« already »)", other.status === 200 && other.data.result === "already" && read("helloasso_payments").filter((p) => p.ref === o1.id).length === 1 && jobs(o1.id).filter((j) => j.type === "ORDER_CONFIRMATION").length === 1, JSON.stringify(other.data));
ok("Notifications consignées (corps brut, traitée)", read("webhook_events").filter((e) => e.processed && e.payload.includes(o1.id)).length >= 2);

console.log(`\n== Sécurité du webhook ==`);
let w = await webhookRaw("", "{}");
ok("Sans jeton : 401", w.status === 401);
w = await webhookRaw("?k=mauvais-jeton-xxxxxxxx", "{}");
ok("Mauvais jeton : 401", w.status === 401);
w = await webhookRaw(`?k=${WSEC}`, "{}", { "x-ha-signature": "00" });
ok("Mauvaise signature : 401", w.status === 401);
w = await webhookRaw(`?k=${WSEC}`, "pas du json", { "x-ha-signature": sign("pas du json") });
ok("Corps invalide : 400", w.status === 400);
const unknown = await webhook("order", "00000000-0000-0000-0000-000000000000");
ok("Commande inexistante : traitée sans effet (200, unknown)", unknown.status === 200 && unknown.data.result === "unknown", JSON.stringify(unknown.data));

console.log(`\n== Montant incorrect ==`);
r = await call("POST", "/api/checkout", { json: shopBody(3, [{ productId: scarf.id, qty: 1 }]) });
let o2 = order(r.data.orderId);
const bad = await payAndNotify(o2, `?total=${o2.totalCents - 100}`);
ok("Paiement d'un montant différent : refusé (mismatch), commande non validée", bad.data?.result === "mismatch" && order(o2.id).status === "awaiting_payment", JSON.stringify(bad.data));

console.log(`\n== Paiement refusé puis nouvel essai (même commande) ==`);
r = await call("POST", "/api/checkout", { json: shopBody(4, [{ productId: scarf.id, qty: 1 }]) });
let o3 = order(r.data.orderId);
await ha(`/__refuse/${o3.checkoutId}`);
const refused = await webhook("order", o3.id, { eventType: "Payment" });
ok("Paiement refusé par la banque : commande FAILED", refused.data?.result === "failed" && order(o3.id).status === "failed", JSON.stringify(refused.data));
ok("E-mail « paiement non abouti » mis en file", jobs(o3.id).some((j) => j.type === "PAYMENT_FAILED"));
const oldCheckout = o3.checkoutId;
r = await call("POST", `/api/orders/${o3.id}/retry`, { json: { t: o3.token } });
ok("Nouvel essai : nouvelle URL de paiement pour la MÊME commande", r.status === 200 && !!r.data.checkoutUrl && read("orders").filter((x) => x.orderNumber === o3.orderNumber).length === 1, JSON.stringify(r.data));
o3 = order(o3.id);
ok("Le nouvel essai crée une nouvelle intention et remet la commande en attente", o3.checkoutId !== oldCheckout && o3.status === "awaiting_payment" && o3.attempts === 2, JSON.stringify({ c: o3.checkoutId, s: o3.status, a: o3.attempts }));
ok("Nouvel essai refusé sans jeton", (await call("POST", `/api/orders/${o3.id}/retry`, { json: { t: "faux" } })).status === 404);
await payAndNotify(o3);
ok("Le second essai payé : commande PAID", order(o3.id).status === "paid");
ok("Nouvel essai refusé sur une commande payée (409)", (await call("POST", `/api/orders/${o3.id}/retry`, { json: { t: o3.token } })).status === 409);

console.log(`\n== Remboursement notifié par HelloAsso ==`);
const stockPre = stockOf(scarf);
await ha(`/__refund/${o3.checkoutId}`);
const rf = await webhook("order", o3.id, { eventType: "Payment", dataId: 9 });
ok("Paiement remboursé : commande REFUNDED", rf.data?.result === "refunded" && order(o3.id).status === "refunded", JSON.stringify(rf.data));
ok("Le stock est remis en vente", stockOf(scarf) === stockPre + 1, `${stockOf(scarf)} vs ${stockPre + 1}`);

console.log(`\n== Stock : deux acheteuses pour le dernier article ==`);
const tees = read("products"); const ti = tees.findIndex((p) => p.id === tee.id); const savedStock = { ...tees[ti].stock };
tees[ti].stock = { ...tees[ti].stock, [teeSize]: 1 }; write("products", tees);
const a = await call("POST", "/api/checkout", { json: shopBody(5, [{ productId: tee.id, size: teeSize, qty: 1 }]) });
const b = await call("POST", "/api/checkout", { json: shopBody(6, [{ productId: tee.id, size: teeSize, qty: 1 }]) });
ok("Dernier article : la première commande passe, la seconde est refusée (stock jamais négatif)", a.status === 201 && b.status === 409 && stockOf(tee, teeSize) === 0, `${a.status} ${b.status} ${stockOf(tee, teeSize)}`);
{ const rows = read("products"); const i = rows.findIndex((p) => p.id === tee.id); rows[i].stock = { ...savedStock }; write("products", rows); }
{ const oo = order(a.data.orderId); await payAndNotify(oo); }

console.log(`\n== Promotions ==`);
const today = new Date().toISOString().slice(0, 10);
const mkPromo = (p) => { const rows = read("promo_codes"); rows.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), label: p.code, scope: "shop", uses: 0, active: true, ...p }); write("promo_codes", rows); };
mkPromo({ code: "PARC15", type: "percent", value: 15 });
mkPromo({ code: "WELCOME10", type: "amount", value: 1000 });
mkPromo({ code: "EXPIRE", type: "percent", value: 20, endsAt: "2020-01-01" });
mkPromo({ code: "LIMITE1", type: "percent", value: 10, maxUses: 1 });
mkPromo({ code: "UNEFOIS", type: "percent", value: 10, perUserLimit: 1 });
mkPromo({ code: "MEMBRE20", type: "percent", value: 20, membersOnly: true });
mkPromo({ code: "PLAFOND", type: "percent", value: 50, maxDiscountCents: 500 });
mkPromo({ code: "SEULETEE", type: "percent", value: 50, productIds: [tee.id] });
mkPromo({ code: "MINI", type: "percent", value: 10, minCents: 99999 });
const q = (code, items, extra = {}) => call("POST", "/api/checkout", { json: { ...shopBody(20 + Math.random(), items), promoCode: code, ...extra } });
r = await q("PARC15", [{ productId: scarf.id, qty: 1 }, { productId: tee.id, size: teeSize, qty: 1 }]);
let od = order(r.data.orderId);
const sub = scarf.priceCents + tee.priceCents;
ok("Scénario D : écharpe + T-shirt + code 15 % : réduction et total corrects", od.discountCents === Math.round(sub * 0.15) && od.totalCents === sub - Math.round(sub * 0.15) && od.promoCode === "PARC15", JSON.stringify({ d: od.discountCents, t: od.totalCents, sub }));
await payAndNotify(od);
ok("Scénario D : commande payée, e-mail avec le détail de la réduction", order(od.id).status === "paid" && jobs(od.id).some((j) => j.type === "ORDER_CONFIRMATION" && j.payload.discountCents === od.discountCents));
r = await q("WELCOME10", [{ productId: scarf.id, qty: 1 }]);
ok("Réduction fixe de 10 €", order(r.data.orderId).discountCents === 1000);
r = await q("EXPIRE", [{ productId: scarf.id, qty: 1 }]); ok("Code expiré refusé", r.status === 422);
r = await q("N'EXISTE-PAS", [{ productId: scarf.id, qty: 1 }]); ok("Code inexistant refusé", r.status === 422);
r = await q("LIMITE1", [{ productId: scarf.id, qty: 1 }]); ok("Code limité : première utilisation acceptée", r.status === 201);
r = await q("LIMITE1", [{ productId: scarf.id, qty: 1 }]); ok("Code limité : au-delà de la limite, refusé", r.status === 422);
const fixedContact = contact(31);
r = await call("POST", "/api/checkout", { json: { ...shopBody(31, [{ productId: scarf.id, qty: 1 }], { contact: fixedContact }), promoCode: "UNEFOIS" } }); ok("Une utilisation par compte : première acceptée", r.status === 201);
r = await call("POST", "/api/checkout", { json: { ...shopBody(31, [{ productId: scarf.id, qty: 1 }], { contact: fixedContact }), promoCode: "UNEFOIS" } }); ok("Une utilisation par compte : seconde refusée", r.status === 422);
r = await q("MEMBRE20", [{ productId: scarf.id, qty: 1 }]); ok("Code réservé aux membres : refusé à une visiteuse", r.status === 422);
r = await q("PLAFOND", [{ productId: scarf.id, qty: 1 }, { productId: tee.id, size: teeSize, qty: 1 }]); ok("Réduction maximum respectée", order(r.data.orderId).discountCents === 500);
r = await q("SEULETEE", [{ productId: scarf.id, qty: 1 }, { productId: tee.id, size: teeSize, qty: 1 }]); ok("Réduction limitée à un produit éligible", order(r.data.orderId).discountCents === Math.round(tee.priceCents * 0.5), String(order(r.data.orderId)?.discountCents));
r = await q("SEULETEE", [{ productId: scarf.id, qty: 1 }]); ok("Code non applicable si aucun article éligible", r.status === 422);
r = await q("MINI", [{ productId: scarf.id, qty: 1 }]); ok("Panier minimum exigé", r.status === 422);

console.log(`\n== Scénario A : adhésion seule ==`);
const cA = jar(); const mA = member(1);
r = await call("POST", "/api/members", { form: signupForm(mA), c: cA });
ok("Inscription : compte créé, la page de paiement personnalisée est l'étape suivante", r.status === 201 && r.data.next === "/rejoindre-le-groupe/paiement" && !r.data.checkoutUrl, JSON.stringify(r.data));
ok("Compte créé : e-mail de bienvenue mis en file d'envoi", read("email_log").some((l) => l.kind === "welcome" && l.to === mA.email));
r = await call("POST", "/api/members/adhesion", { c: cA });
ok("Étape de paiement : redirection HelloAsso pour l'adhésion", r.status === 200 && r.data.url?.startsWith("http://mock/pay/"), JSON.stringify(r.data));
const memA = read("members").find((x) => x.email === mA.email);
ok("Adhésion créée mais inactive tant que le paiement n'est pas confirmé", (await call("GET", "/api/auth/session", { c: cA })).data.membership === "pending");
ok("Discord : lien absent de l'espace tant que l'adhésion n'est pas validée", !(await call("GET", "/api/members/me", { c: cA })).data.discordUrl);
const payA = read("payments").find((p) => p.email === mA.email);
await ha(`/__pay/${payA.checkoutId}`);
const wA = await webhook("membership", payA.id);
ok("Webhook adhésion : traitée", wA.data?.result === "paid", JSON.stringify(wA.data));
ok("Membre ACTIVE", (await call("GET", "/api/auth/session", { c: cA })).data.membership === "active");
ok("Discord : lien d'invitation fourni à la membre dont l'adhésion est valide", (await call("GET", "/api/members/me", { c: cA })).data.discordUrl === "https://discord.com/invite/XTmbz3GWu");
ok("Un seul paiement HelloAsso pour l'adhésion", read("helloasso_payments").filter((p) => p.ref === payA.id).length === 1);
ok("E-mail d'adhésion mis en file (MEMBERSHIP_CONFIRMATION avec numéro d'adhérente)", read("email_jobs").some((j) => j.type === "MEMBERSHIP_CONFIRMATION" && j.memberNumber === memA.memberNumber && j.payload.memberNumber === memA.memberNumber));
await sleep(1200);
ok("E-mail « Bienvenue » envoyé", (await rs("/__mails")).some((m) => /Bienvenue chez Les Dames du Parc/.test(m.subject)));
r = await call("POST", "/api/members/adhesion", { c: cA }); ok("Adhésion déjà active : pas de nouveau paiement (409)", r.status === 409);
const wA2 = await webhook("membership", payA.id, { dataId: 5 });
ok("Notification rejouée : une seule activation", wA2.data?.result === "already" && read("email_jobs").filter((j) => j.type === "MEMBERSHIP_CONFIRMATION" && j.memberNumber === memA.memberNumber).length === 1);

console.log(`\n== Paiement différé (espèces, chèque), rappels J+7 et J+15, code sur l'adhésion ==`);
const cL = jar(); const mL = member(7);
await call("POST", "/api/members", { form: signupForm(mL), c: cL });
r = await call("POST", "/api/members/adhesion/differer", { c: cL });
ok("« Passer cette étape » : enregistré, la carte reste en cours de création", r.status === 200 && (await call("GET", "/api/auth/session", { c: cL })).data.membership === "pending");
const payL = read("payments").find((p) => p.email === mL.email);
ok("Paiement marqué comme différé", !!payL.deferredAt);
await sleep(1200);
ok("E-mail avec le lien de paiement envoyé", (await rs("/__mails")).some((m) => /Finalisez votre adhésion/.test(m.subject) && m.to.includes(mL.email)));
await call("POST", "/api/members/adhesion/differer", { c: cL });
await sleep(600);
ok("Deuxième clic : pas de second e-mail", (await rs("/__mails")).filter((m) => /Finalisez votre adhésion/.test(m.subject) && m.to.includes(mL.email)).length === 1);
const tick = () => call("POST", "/api/cron/tick", { headers: { Authorization: `Bearer ${CRON}` }, origin: null });
await tick(); await sleep(500);
ok("Avant 7 jours : aucun rappel", !(await rs("/__mails")).some((m) => /pas encore validée/.test(m.subject) && m.to.includes(mL.email)));
patchRow("payments", payL.id, { createdAt: new Date(Date.now() - 8 * 86400000).toISOString() });
await tick(); await sleep(800);
ok("À J+7 : rappel automatique", (await rs("/__mails")).filter((m) => /pas encore validée/.test(m.subject) && m.to.includes(mL.email)).length === 1);
await tick(); await sleep(500);
ok("Le rappel J+7 n'est envoyé qu'une fois", (await rs("/__mails")).filter((m) => /pas encore validée/.test(m.subject) && m.to.includes(mL.email)).length === 1);
patchRow("payments", payL.id, { createdAt: new Date(Date.now() - 16 * 86400000).toISOString() });
await tick(); await sleep(800);
ok("À J+15 : second rappel automatique", (await rs("/__mails")).filter((m) => /pas encore validée/.test(m.subject) && m.to.includes(mL.email)).length === 2);
mkPromo({ code: "ADH50", type: "percent", value: 50, scope: "adhesion" });
mkPromo({ code: "OFFERT", type: "percent", value: 100, scope: "adhesion" });
r = await call("POST", "/api/members/adhesion", { json: { promoCode: "ADH50", check: true }, c: cL });
ok("Code sur l'adhésion : réduction recalculée par le serveur", r.data.amountCents === 600 && r.data.discountCents === 600, JSON.stringify(r.data));
r = await call("POST", "/api/members/adhesion", { json: { promoCode: "EXPIRE" }, c: cL });
ok("Code non applicable à l'adhésion refusé", r.status === 422);
r = await call("POST", "/api/members/adhesion", { json: { promoCode: "ADH50" }, c: cL });
const intentL = (await ha("/__intents")).find((i) => String(i.id) === read("payments").find((p) => p.id === payL.id).checkoutId);
ok("Paiement HelloAsso au prix réduit (6 €)", r.status === 200 && intentL.totalAmount === 600, JSON.stringify(intentL));
r = await call("POST", "/api/members/adhesion", { json: { promoCode: "OFFERT" }, c: cL });
ok("Code à 100 % : adhésion activée sans paiement", r.data.free === true && (await call("GET", "/api/auth/session", { c: cL })).data.membership === "active", JSON.stringify(r.data));

console.log(`\n== Codes réservés aux membres (membre active) ==`);
r = await call("POST", "/api/checkout", { json: { ...shopBody(40, [{ productId: scarf.id, qty: 1 }]), contact: { email: mA.email, firstName: "Camille", lastName: "Payeuse" }, promoCode: "MEMBRE20" }, c: cA });
ok("Code réservé aux membres : accepté pour une adhérente active", r.status === 201 && order(r.data.orderId).discountCents === Math.round(scarf.priceCents * 0.2), JSON.stringify(r.data));

console.log(`\n== Scénario C : adhésion (renouvellement) + produits, un seul paiement ==`);
const memRows = read("memberships"); const mine = memRows.find((x) => x.memberNumber === memA.memberNumber);
patchRow("memberships", mine.id, { endsAt: "2020-08-31T23:59:59.000Z", startsAt: "2019-09-01T00:00:00.000Z" });
ok("Adhésion terminée : état « expired »", (await call("GET", "/api/auth/session", { c: cA })).data.membership === "expired");
const offer = await call("GET", "/api/shop/membership-offer", { c: cA });
ok("Le panier propose le renouvellement au prix de la formule (serveur)", offer.data.available === true && offer.data.amountCents === 1200, JSON.stringify(offer.data));
const teeStock0 = stockOf(tee, teeSize);
r = await call("POST", "/api/checkout", { json: { ...shopBody(41, [{ productId: tee.id, size: teeSize, qty: 1 }]), contact: { email: mA.email, firstName: "Camille", lastName: "Payeuse" }, includeMembership: true }, c: cA });
let oc = order(r.data.orderId);
ok("Commande mixte : total = produit + adhésion", r.status === 201 && oc.totalCents === tee.priceCents + 1200 && oc.membership?.amountCents === 1200, JSON.stringify(oc));
ok("Une visiteuse ne peut pas ajouter d'adhésion", (await call("POST", "/api/checkout", { json: { ...shopBody(42, [{ productId: scarf.id, qty: 1 }]), includeMembership: true } })).status === 401);
await payAndNotify(oc);
oc = order(oc.id);
ok("Commande mixte payée : commande PAID", oc.status === "paid");
ok("Adhésion réactivée par le même paiement", (await call("GET", "/api/auth/session", { c: cA })).data.membership === "active");
ok("Stock du produit confirmé (-1)", stockOf(tee, teeSize) === teeStock0 - 1);
ok("Un seul paiement HelloAsso pour toute la commande", read("helloasso_payments").filter((p) => p.ref === oc.id).length === 1 && read("helloasso_payments").filter((p) => p.ref === oc.membership.paymentId).length === 0);
ok("Le paiement d'adhésion est rattaché à la commande (non compté deux fois)", read("payments").find((p) => p.id === oc.membership.paymentId)?.viaOrderId === oc.id);
ok("E-mails en file : confirmation de commande ET d'adhésion", jobs(oc.id).some((j) => j.type === "ORDER_CONFIRMATION") && read("email_jobs").filter((j) => j.type === "MEMBERSHIP_CONFIRMATION" && j.dedupeKey.includes(oc.membership.membershipId)).length === 1);
ok("Une seule facture pour la commande mixte", read("invoices").filter((i) => i.txId === `order:${oc.id}`).length === 1);

console.log(`\n== E-mails : échec Resend, nouvelle tentative ==`);
// On vide d'abord la file (tous les e-mails précédents partent), puis on programme UNE panne de Resend.
await call("POST", "/api/cron/tick", { headers: { Authorization: `Bearer ${CRON}` }, origin: null });
await sleep(1500);
await rs("/__reset");
await rs("/__fail?n=1");
r = await call("POST", "/api/checkout", { json: shopBody(50, [{ productId: scarf.id, qty: 1 }]) });
let oe = order(r.data.orderId);
await payAndNotify(oe);
await sleep(1500);
const failedJob = jobs(oe.id).find((j) => j.type === "ORDER_CONFIRMATION");
ok("Resend en panne : le paiement reste VALIDÉ, l'e-mail passe en échec (à retenter)", order(oe.id).status === "paid" && failedJob.status === "failed" && failedJob.attempts === 1, JSON.stringify(failedJob));
patchRow("email_jobs", failedJob.id, { nextAttemptAt: new Date(Date.now() - 1000).toISOString() });
await call("POST", "/api/cron/tick", { headers: { Authorization: `Bearer ${CRON}` }, origin: null });
await sleep(800);
ok("Nouvelle tentative réussie : e-mail envoyé une seule fois", read("email_jobs").find((j) => j.id === failedJob.id).status === "sent" && (await rs("/__mails")).filter((m) => /commande Les Dames du Parc est confirmée/.test(m.subject) && m.to.includes(oe.contact.email)).length === 1);

console.log(`\n== HelloAsso indisponible ==`);
ok("Commande d'un panier vide refusée", (await call("POST", "/api/checkout", { json: shopBody(60, []) })).status === 400);

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail ? 1 : 0);
