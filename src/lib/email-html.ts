/**
 * Gabarit HTML des e-mails automatiques, à l'identité du site : fond nuit, logo blanc de l'association, titres en Special Gothic
 * Expanded One, texte en Geomini (polices chargées depuis le site pour les clients qui les acceptent, avec repli lisible ailleurs),
 * bouton rouge, bande bleu-rouge-blanc. Mise en page en tableaux (compatible Gmail, Outlook, Apple Mail).
 * Fonction pure, sans dépendance : tout le contenu saisi est échappé.
 */
export interface EmailBrand {
  origin: string;
  name: string;
  address?: string;
  email?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  signature?: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const URL_RE = /https?:\/\/[^\s<>"']+/g;
const NAVY = "#030919";
const CARD = "#0b1327";
const RED = "#d90f2c";
const BODY_FONT = "'Geomini','Trebuchet MS','Segoe UI',Helvetica,Arial,sans-serif";
const TITLE_FONT = "'Special Gothic Expanded One','Arial Black','Arial Bold',Arial,sans-serif";

/** Libellé du bouton selon le type de message. */
const CTA_LABEL: Record<string, string> = {
  "mot-de-passe": "Définir mon mot de passe",
  invitation: "Accéder à mon espace",
  rgpd: "Confirmer ma demande",
  "nouvel-article": "Lire l’article",
  "nouvel-evenement": "Voir l’événement",
  "nouveau-produit": "Voir dans la boutique",
};

const linkify = (escaped: string) => escaped.replace(URL_RE, (u) => `<a href="${u}" style="color:#ffffff;text-decoration:underline;text-decoration-color:${RED};">${u}</a>`);

export function renderEmail(opts: { subject: string; body: string; kind?: string; brand: EmailBrand; image?: { src: string; alt: string }; unsubscribeUrl?: string }): { html: string; text: string } {
  const { subject, body, kind = "", brand, image, unsubscribeUrl } = opts;
  const o = brand.origin.replace(/\/$/, "");
  const button = (t: string) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 6px;"><tr><td bgcolor="${RED}" style="border-radius:10px;background:linear-gradient(180deg,#e51b36 0%,#b30d27 100%);"><a href="${esc(t)}" style="display:inline-block;padding:15px 30px;font-family:${BODY_FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(CTA_LABEL[kind] ?? "Ouvrir le lien")}</a></td></tr></table><p style="margin:6px 0 20px;font-family:${BODY_FONT};font-size:12px;line-height:1.5;color:#8d99b0;word-break:break-all;">${esc(t)}</p>`;
  const para = (lines: string[]) =>
    `<p style="margin:0 0 18px;font-family:${BODY_FONT};font-size:16px;line-height:1.7;font-weight:400;color:#e9edf5;">${linkify(esc(lines.join("\n"))).replace(/\n/g, "<br>")}</p>`;
  // Une adresse seule sur sa ligne devient un bouton d'action (l'adresse reste visible dessous pour les clients qui bloquent les boutons).
  const blocks = body
    .replace(/\r/g, "")
    .trim()
    .split(/\n{2,}/)
    .map((p) => {
      const out: string[] = [];
      let buf: string[] = [];
      const flush = () => {
        if (buf.length && buf.join("").trim()) out.push(para(buf));
        buf = [];
      };
      for (const line of p.split("\n")) {
        if (/^\s*https?:\/\/\S+\s*$/.test(line)) {
          flush();
          out.push(button(line.trim()));
        } else buf.push(line);
      }
      flush();
      return out.join("");
    })
    .join("");
  const preheader = esc(body.replace(/\s+/g, " ").replace(URL_RE, "").trim().slice(0, 110));
  const signature = brand.signature?.trim()
    ? `<p style="margin:26px 0 0;font-family:${BODY_FONT};font-size:15px;line-height:1.6;color:#c3ccdc;">${esc(brand.signature.trim()).replace(/\n/g, "<br>")}</p>`
    : "";
  const social = [
    brand.instagram && ["Instagram", brand.instagram],
    brand.tiktok && ["TikTok", brand.tiktok],
    brand.facebook && ["Facebook", brand.facebook],
  ]
    .filter((x): x is string[] => Array.isArray(x))
    .map(([label, url]) => `<a href="${esc(url)}" style="color:#c3ccdc;text-decoration:none;font-weight:600;">${label}</a>`)
    .join(`<span style="color:#4a5674;"> &nbsp;·&nbsp; </span>`);
  const legal = ["mes-donnees|Mes données", "politique-de-confidentialite|Confidentialité", "mentions-legales|Mentions légales"]
    .map((x) => {
      const [path, label] = x.split("|");
      return `<a href="${o}/${path}" style="color:#8d99b0;text-decoration:underline;">${label}</a>`;
    })
    .join(`<span style="color:#4a5674;"> &nbsp;·&nbsp; </span>`);

  const html = `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<style>
@font-face{font-family:'Geomini';src:url('${o}/fonts/Geomini-Variable.woff2') format('woff2');font-weight:200 800;font-style:normal;}
@font-face{font-family:'Special Gothic Expanded One';src:url('${o}/fonts/SpecialGothicExpandedOne-Regular.woff2') format('woff2');font-weight:400;font-style:normal;}
body{margin:0;padding:0;background:${NAVY};}
a{color:#ffffff;}
@media (max-width:620px){.wrap{padding:0 !important}.card{padding:28px 22px !important}.title{font-size:20px !important}}
</style>
</head>
<body style="margin:0;padding:0;background:${NAVY};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${NAVY};font-size:1px;line-height:1px;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${NAVY}" style="background:${NAVY};">
<tr><td align="center" class="wrap" style="padding:28px 12px 40px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
    <tr><td align="center" style="padding:6px 0 26px;">
      <a href="${o}" style="text-decoration:none;"><img src="${o}/email/logo.png" width="230" alt="${esc(brand.name)}" style="display:block;width:230px;max-width:70%;height:auto;border:0;outline:none;"></a>
    </td></tr>
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="34%" height="4" bgcolor="#1b3f8f" style="height:4px;font-size:0;line-height:0;">&nbsp;</td>
        <td width="33%" height="4" bgcolor="${RED}" style="height:4px;font-size:0;line-height:0;">&nbsp;</td>
        <td width="33%" height="4" bgcolor="#ffffff" style="height:4px;font-size:0;line-height:0;">&nbsp;</td>
      </tr></table>
    </td></tr>
    <tr><td class="card" bgcolor="${CARD}" style="background:${CARD};padding:38px 36px 34px;border:1px solid #1c2846;border-top:0;border-radius:0 0 14px 14px;">
      <h1 class="title" style="margin:0 0 24px;font-family:${TITLE_FONT};font-size:24px;line-height:1.2;font-weight:400;text-transform:uppercase;color:#ffffff;">${esc(subject)}</h1>
      ${image ? `<img src="${esc(image.src)}" width="528" alt="${esc(image.alt)}" style="display:block;width:100%;max-width:528px;height:auto;border:0;border-radius:10px;margin:0 0 22px;">` : ""}
      ${blocks}
      ${signature}
    </td></tr>
    <tr><td align="center" style="padding:26px 10px 0;font-family:${BODY_FONT};font-size:13px;line-height:1.7;color:#8d99b0;">
      ${social ? `<p style="margin:0 0 12px;font-size:13px;">${social}</p>` : ""}
      <p style="margin:0 0 6px;"><strong style="color:#c3ccdc;font-weight:600;">${esc(brand.name)}</strong>${brand.address ? ` · ${esc(brand.address)}` : ""}</p>
      ${brand.email ? `<p style="margin:0 0 12px;"><a href="mailto:${esc(brand.email)}" style="color:#8d99b0;text-decoration:underline;">${esc(brand.email)}</a></p>` : ""}
      <p style="margin:0;font-size:12px;">${legal}</p>
      ${unsubscribeUrl ? `<p style="margin:14px 0 0;font-size:12px;">Vous recevez ce message car vous êtes adhérente. <a href="${esc(unsubscribeUrl)}" style="color:#c3ccdc;text-decoration:underline;">Ne plus recevoir ces e-mails de nouveautés</a></p>` : ""}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = `${body.trim()}${brand.signature?.trim() ? `\n\n${brand.signature.trim()}` : ""}\n\n—\n${brand.name}${brand.address ? `\n${brand.address}` : ""}${brand.email ? `\n${brand.email}` : ""}\n${o}${unsubscribeUrl ? `\n\nNe plus recevoir ces e-mails de nouveautés : ${unsubscribeUrl}` : ""}`;
  return { html, text };
}
