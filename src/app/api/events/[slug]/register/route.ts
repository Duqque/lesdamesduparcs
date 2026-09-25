import { formatEuros, validateRegistration, type RegistrationInput, type RegistrationStatus } from "@/lib/registration";
import { sendTemplate } from "@/lib/server/email";
import { getEvent } from "@/lib/server/events";
import { json, siteUrl, throttled } from "@/lib/server/http";
import { eventUnitPrice } from "@/lib/server/pricing";
import { getSession } from "@/lib/server/session";
import { checkPromo, consumePromo } from "@/lib/server/shop";
import { addRegistration, addWaitlistRegistration, listRegistrations, takenPlaces, updateRegistration } from "@/lib/server/store";
import { createCheckoutSession, stripeConfigured } from "@/lib/server/stripe";
import { formatLongDate } from "@/lib/format";

type Ctx = { params: Promise<{ slug: string }> };

const active = (s: RegistrationStatus) => s !== "cancelled" && s !== "refunded";

/** État public : places restantes, tarif applicable à la membre connectée, mode de paiement et inscription éventuelle. */
export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return json({ error: "Événement introuvable." }, 404);
  const list = await listRegistrations(slug);
  const session = await getSession();
  const memberNumber = session?.role === "member" ? session.memberNumber : undefined;
  const mine = memberNumber ? list.find((r) => r.memberNumber === memberNumber && active(r.status)) : undefined;
  const price = await eventUnitPrice(event, memberNumber);
  return json({
    capacity: event.registration.capacity,
    remaining: Math.max(event.registration.capacity - takenPlaces(list), 0),
    waitlist: Boolean(event.registration.waitlist),
    paymentEnabled: stripeConfigured(),
    paymentMode: event.registration.paymentMode ?? "online",
    paymentInstructions: event.registration.paymentInstructions ?? "",
    unitCents: price.unitCents,
    tier: price.tier ?? null,
    mine: mine ? { id: mine.id, status: mine.status, places: mine.places, amountCents: mine.amountCents } : null,
  });
}

/** Inscription : réservée aux membres connectées. Le prix, la réduction et le mode de paiement sont décidés ici, jamais par le navigateur. */
export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return json({ error: "Événement introuvable." }, 404);
  if (event.registration.mode !== "form") return json({ error: "Inscription via la billetterie." }, 400);

  const session = await getSession();
  if (!session || session.role !== "member") return json({ error: "L'inscription est réservée aux membres. Connectez-vous avec votre carte." }, 401);
  if (throttled(req, `register:${session.memberNumber}`, 20)) return json({ error: "Trop de tentatives." }, 429);

  const input = (await req.json().catch(() => null)) as (Partial<RegistrationInput> & { promoCode?: string }) | null;
  if (!input) return json({ error: "Requête invalide." }, 400);

  const list = await listRegistrations(slug);
  if (list.some((r) => r.memberNumber === session.memberNumber && active(r.status))) return json({ error: "Vous êtes déjà inscrite à cet événement." }, 409);

  const remaining = Math.max(event.registration.capacity - takenPlaces(list), 0);
  const wantsWait = Boolean(event.registration.waitlist) && remaining <= 0;
  const errors = validateRegistration(input, event, wantsWait ? 99 : remaining);
  if (Object.keys(errors).length) return json({ error: "Certains champs sont à corriger.", errors }, 422);

  const cfg = event.registration;
  const mode = cfg.paymentMode ?? "online";
  const places = cfg.singlePlace ? 1 : Number(input.places);
  const { unitCents } = await eventUnitPrice(event, session.memberNumber);
  const baseCents = unitCents * places;
  const promo = baseCents > 0 ? await checkPromo(input.promoCode, "event", baseCents) : null;
  if (promo && !promo.ok) return json({ error: promo.error, errors: { promoCode: promo.error } }, 422);
  const discountCents = promo?.ok ? promo.discountCents : 0;
  const amountCents = baseCents - discountCents;

  const clean: RegistrationInput = {
    firstName: input.firstName!.trim(),
    lastName: input.lastName!.trim(),
    email: input.email!.trim().toLowerCase(),
    phone: input.phone!.trim(),
    places,
    birthDate: input.birthDate,
    guardian: cfg.guardianRequired ? input.guardian : undefined,
    emergency: { name: input.emergency!.name.trim(), phone: input.emergency!.phone.trim() },
    allergies: input.allergies?.trim().slice(0, 500),
    comment: input.comment?.trim().slice(0, 500),
    consents: { rules: true, privacy: true, image: Boolean(input.consents?.image) },
  };
  const extra = { unitCents, promoCode: promo?.ok ? promo.promo.code : undefined, discountCents: discountCents || undefined };

  if (wantsWait) {
    const waiting = await addWaitlistRegistration({ ...clean, ...extra, eventId: slug, memberNumber: session.memberNumber, amountCents, status: "waitlist" });
    if (!waiting) return json({ error: "Vous êtes déjà inscrite à cet événement." }, 409);
    return json({ registration: { id: waiting.id, status: "waitlist" }, message: "L'événement est complet : vous êtes inscrite sur la liste d'attente. Vous serez prévenue si une place se libère." }, 201);
  }

  // Statut initial selon le mode de paiement : en ligne et manuel attendent le règlement, sur place et facultatif confirment tout de suite.
  const status: RegistrationStatus = amountCents === 0 ? "confirmed" : mode === "online" || mode === "manual" ? "awaiting_payment" : "confirmed";
  const added = await addRegistration({ ...clean, ...extra, eventId: slug, memberNumber: session.memberNumber, amountCents, status }, cfg.capacity);
  if (!added.ok) return json({ error: added.reason === "duplicate" ? "Vous êtes déjà inscrite à cet événement." : `Plus assez de places (${added.remaining} restante(s)).` }, 409);
  const registration = added.registration;
  if (promo?.ok) await consumePromo(promo.promo);
  const ref = { id: registration.id, status: registration.status };
  const vars = { prenom: clean.firstName, objet: event.title, date: formatLongDate(event.date), montant: formatEuros(amountCents), consignes: cfg.paymentInstructions ?? "" };

  if (amountCents === 0) {
    await sendTemplate("event_confirmation", clean.email, vars, "eventConfirmation");
    return json({ registration: ref }, 201);
  }

  if (mode === "onsite") {
    await sendTemplate("event_payment_due", clean.email, { ...vars, consignes: "Le règlement se fait sur place, le jour de l'événement." });
    return json({ registration: ref, message: `Inscription confirmée. Vous réglerez ${formatEuros(amountCents)} sur place, le jour de l'événement.` }, 201);
  }
  if (mode === "manual") {
    await sendTemplate("event_payment_due", clean.email, vars);
    return json({ registration: ref, message: `Inscription enregistrée. Montant à régler : ${formatEuros(amountCents)}. ${cfg.paymentInstructions ?? "L'équipe vous précisera comment payer."}`.trim() }, 201);
  }
  if (mode === "optional") {
    return json({ registration: ref, paymentEnabled: stripeConfigured(), message: `Inscription confirmée. Vous pouvez régler ${formatEuros(amountCents)} en ligne dès maintenant ou plus tard depuis cette page.` }, 201);
  }

  if (!stripeConfigured()) {
    return json({ registration: ref, paymentEnabled: false, message: `Inscription enregistrée. Paiement de ${formatEuros(amountCents)} en attente : le paiement en ligne n'est pas encore activé, l'équipe reviendra vers vous.` }, 201);
  }
  try {
    const checkout = await createCheckoutSession({ registrationId: registration.id, eventId: slug, eventTitle: event.title, totalCents: amountCents, places, customerEmail: clean.email, siteUrl: siteUrl(req) });
    await updateRegistration(registration.id, { stripeSessionId: checkout.id });
    return json({ registration: ref, paymentEnabled: true, checkoutUrl: checkout.url }, 201);
  } catch {
    return json({ registration: ref, paymentEnabled: false, message: "Inscription enregistrée, mais le paiement n'a pas pu être initialisé. Réessayez depuis cette page." }, 201);
  }
}
