/**
 * Adresse publique du site, sans barre finale. NEXT_PUBLIC_SITE_URL (fixée sur le serveur) prime ; sinon le domaine officiel,
 * SANS « www » : www.lesdamesduparc.com ne répond pas, une adresse de secours avec « www » produirait des liens morts.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || "https://lesdamesduparc.com";
