import { json, siteUrl } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber, toPublic } from "@/lib/server/store";
import { getTransactions, membershipsOf, syncMemberships } from "@/lib/server/business";
import { benefitsDb, offersDb, partnersDb } from "@/lib/server/content";

/** Espace de la membre connectée : fiche, lien de vérification, transactions (adhésion, événements, boutique) et avantages. */
export async function GET(req: Request) {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  const stored = await getMemberByNumber(s.memberNumber);
  if (!stored) return json({ error: "Compte introuvable." }, 404);
  await syncMemberships();
  const member = toPublic(stored);
  const today = new Date().toISOString().slice(0, 10);
  const [txs, ms, benefits, offers, partners] = await Promise.all([getTransactions(), membershipsOf(member.id), benefitsDb.all(), offersDb.all(), partnersDb.all()]);
  const live = (v?: string, e?: string) => (!v || v <= today) && (!e || e >= today);
  return json({
    member: { ...member, authorizations: member.authorizations.map((f) => ({ id: f.id, name: f.name })) },
    verifyUrl: `${siteUrl(req)}/verification/${member.token}`,
    membership: ms[0] ? { planName: ms[0].planName, season: ms[0].season, startsAt: ms[0].startsAt, endsAt: ms[0].endsAt, status: ms[0].status } : null,
    transactions: txs.filter((t) => t.memberNumber === member.memberNumber).map((t) => ({ id: t.id, at: t.at, type: t.type, label: t.label, amountCents: t.amountCents, status: t.status, method: t.method })),
    benefits: benefits.filter((b) => b.visible).sort((a, b) => a.order - b.order).map((b) => ({ id: b.id, title: b.title, text: b.text })),
    offers: [
      ...offers.filter((o) => o.visible && live(o.startsAt, o.endsAt)).map((o) => ({ id: o.id, title: o.title, text: o.text, partner: partners.find((p) => p.id === o.partnerId)?.name })),
      ...partners.filter((p) => p.visible && live(p.startsAt, p.endsAt) && p.advantage).map((p) => ({ id: p.id, title: p.name, text: p.advantage, code: p.promoCode })),
    ],
  });
}
