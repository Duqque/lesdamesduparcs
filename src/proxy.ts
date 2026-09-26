import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (avant chaque requête) :
 *  1. contrôle d'origine des requêtes qui modifient des données (défense CSRF en plus de SameSite) ;
 *  2. Content-Security-Policy stricte avec un nonce unique par requête ;
 *  3. en-têtes de sécurité (HSTS, anti-framing, nosniff, référent, permissions) ;
 *  4. aucune mise en cache de l'administration et des API.
 */
const isDev = process.env.NODE_ENV === "development";
/** Test local d'un build de production en http : pas de HSTS ni de mise à niveau forcée en https. */
const localHttp = process.env.SESSION_INSECURE_COOKIE === "1";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
/** Appelés par des serveurs (pas des navigateurs) : authentifiés par signature ou par jeton, pas par cookie. */
const MACHINE = ["/api/webhooks/", "/api/cron/"];

function allowedHosts(req: NextRequest) {
  const hosts = new Set<string>();
  for (const h of [req.headers.get("host"), req.headers.get("x-forwarded-host")]) if (h) hosts.add(h.split(",")[0].trim().toLowerCase());
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) hosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host.toLowerCase());
  } catch {
    /* URL du site invalide : ignorée */
  }
  return hosts;
}

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return allowedHosts(req).has(new URL(origin).host.toLowerCase());
    } catch {
      return false;
    }
  }
  const site = req.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}

function csp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Les attributs style="" générés par React / framer-motion nécessitent 'unsafe-inline' pour les styles (pas pour les scripts).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev || localHttp ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function harden(res: NextResponse, req: NextRequest) {
  const h = res.headers;
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()");
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Resource-Policy", req.nextUrl.pathname.startsWith("/medias/") ? "cross-origin" : "same-origin");
  h.set("X-DNS-Prefetch-Control", "off");
  h.set("X-Permitted-Cross-Domain-Policies", "none");
  if (!isDev && !localHttp) h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  const p = req.nextUrl.pathname;
  if (p.startsWith("/admin") || p.startsWith("/api/") || p.startsWith("/profil") || p.startsWith("/verification") || p.startsWith("/commande")) {
    h.set("Cache-Control", "no-store");
  }
  if (p.startsWith("/admin") || p.startsWith("/api/")) h.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!SAFE.has(req.method) && pathname.startsWith("/api/") && !MACHINE.some((m) => pathname.startsWith(m)) && !sameOrigin(req)) {
    return harden(NextResponse.json({ error: "Origine non autorisée." }, { status: 403 }), req);
  }

  // Les API et les fichiers n'ont pas besoin de nonce ; les pages en reçoivent un par requête.
  if (pathname.startsWith("/api/") || pathname.startsWith("/medias/")) return harden(NextResponse.next(), req);

  const nonce = btoa(crypto.randomUUID());
  const policy = csp(nonce);
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", policy);
  return harden(res, req);
}

export const config = {
  matcher: [{ source: "/((?!_next/static|_next/image|favicon.ico|loader/|.*\\.(?:png|jpg|jpeg|webp|svg|ico|woff2?|txt|xml)$).*)" }],
};
