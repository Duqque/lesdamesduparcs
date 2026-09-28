// Faux serveurs pour les tests de paiement : HelloAsso (port 4599) et Resend (port 4598). Aucun appel réseau réel.
import http from "node:http";

const intents = new Map();
let seq = 1000;
const ha = { log: [] };

http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const u = new URL(req.url, "http://x");
    const send = (c, o) => { res.writeHead(c, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
    ha.log.push(`${req.method} ${u.pathname}`);
    if (u.pathname === "/oauth2/token") return send(200, { access_token: "tok", expires_in: 1800, token_type: "bearer" });
    let m = u.pathname.match(/^\/__(pay|refuse|refund)\/(\d+)$/);
    if (m) {
      const it = intents.get(m[2]);
      if (!it) return send(404, {});
      if (m[1] === "pay") { it.state = "Authorized"; it.paid = true; it.tip = Number(u.searchParams.get("tip") || 0); if (u.searchParams.get("total")) it.overrideTotal = Number(u.searchParams.get("total")); }
      if (m[1] === "refuse") { it.state = "Refused"; it.paid = true; }
      if (m[1] === "refund") { it.state = "Refunded"; it.refundAmount = Number(u.searchParams.get("amount") || 0); }
      return send(200, { ok: true });
    }
    if (u.pathname === "/__log") return send(200, ha.log);
    if (u.pathname === "/__intents") return send(200, [...intents.entries()].map(([id, i]) => ({ id, ...i.body })));
    if (req.headers.authorization !== "Bearer tok") return send(401, { message: "no token" });
    if (req.method === "POST" && u.pathname === "/v5/organizations/lesdames/checkout-intents") {
      const b = JSON.parse(body);
      if (process.env.MOCK_HA_DOWN === "1") return send(503, { message: "indisponible" });
      const id = ++seq;
      intents.set(String(id), { body: b, paid: false, state: "Pending", tip: 0, overrideTotal: null });
      return send(200, { id, redirectUrl: `http://mock/pay/${id}` });
    }
    m = u.pathname.match(/^\/v5\/organizations\/lesdames\/checkout-intents\/(\d+)$/);
    if (m && req.method === "GET") {
      const it = intents.get(m[1]);
      if (!it) return send(404, { message: "not found" });
      const out = { id: Number(m[1]), metadata: it.body.metadata };
      if (it.paid || it.state === "Refunded") {
        const total = it.overrideTotal ?? it.body.totalAmount;
        const pay = { id: 9000 + Number(m[1]), amount: total + it.tip, amountTip: it.tip, state: it.state };
        if (it.state === "Refunded") pay.refundOperations = [{ amount: it.refundAmount || total, status: "PROCESSED" }];
        out.order = { id: 5000 + Number(m[1]), amount: { total }, payments: [pay] };
      }
      return send(200, out);
    }
    m = u.pathname.match(/^\/v5\/payments\/(\d+)\/refund$/);
    if (m && req.method === "POST") return send(403, { errors: [{ code: "AuthorizationErrors.MFA.AccessTokenRequired", message: "Authentification forte requise." }] });
    send(404, { message: "?" });
  });
}).listen(4599, () => console.log("mock HelloAsso prêt"));

// Faux Resend : enregistre les e-mails ; les N premiers envois échouent si MOCK_RESEND_FAIL=N (fichier compteur en mémoire).
const mails = [];
let failLeft = 0;
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const u = new URL(req.url, "http://x");
    const send = (c, o) => { res.writeHead(c, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
    if (u.pathname === "/__mails") return send(200, mails);
    if (u.pathname === "/__fail") { failLeft = Number(u.searchParams.get("n") || 0); return send(200, { ok: true }); }
    if (u.pathname === "/__reset") { mails.length = 0; return send(200, { ok: true }); }
    if (req.headers.authorization !== "Bearer re_test") return send(401, { message: "clé invalide" });
    if (failLeft > 0) { failLeft--; return send(500, { message: "panne simulée" }); }
    const j = JSON.parse(body || "{}");
    for (const m of Array.isArray(j) ? j : [j]) mails.push({ to: m.to, subject: m.subject, attachments: (m.attachments ?? []).map((a) => a.filename), text: m.text });
    send(200, { id: "mail_" + mails.length });
  });
}).listen(4598, () => console.log("mock Resend prêt"));
