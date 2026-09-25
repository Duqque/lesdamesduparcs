import { getEvent } from "@/lib/server/events";
import { formatEuros, validateRegistration, type RegistrationInput } from "@/lib/registration";
import { getSession } from "@/lib/server/session";
import { json, siteUrl, throttled } from "@/lib/server/http";
import { addRegistration, addWaitlistRegistration, listRegistrations, takenPlaces, updateRegistration } from "@/lib/server/store";
import { createCheckoutSession, stripeConfigured } from "@/lib/server/stripe";

type Ctx = { params: Promise<{ slug: string }> };

/** État public : places restantes, et inscription éventuelle de la membre connectée. */
export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return json({ error: "Événement introuvable." }, 404);
  const list = await listRegistrations(slug);
  const session = await getSession();
  const mine = session?.role === "member" ? list.find((r) => r.memberNumber === session.memberNumber) : undefined;
  return json({
    capacity: event.registration.capacity,
    remaining: Math.max(event.registration.capacity - takenPlaces(list), 0),
    paymentEnabled: stripeConfigured(),
    mine: mine ? { id: mine.id, status: mine.status, places: mine.places, amountCents: mine.amountCents } : null,
  });
}

/** Inscription : réservée aux membres connectées avec leur carte. */
export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return json({ error: "Événement introuvable." }, 404);
  if (event.registration.mode !== "form") return json({ error: "Inscription via la billetterie." }, 400);

  const session = await getSession();
  if (!session || session.role !== "member") return json({ error: "L'inscription est réservée aux membres. Connectez-vous avec votre carte." }, 401);
  if (throttled(req, `register:${session.memberNumber}`, 20)) return json({ error: "Trop de tentatives." }, 429);

  const input = (await req.json().catch(() => null)) as Partial<RegistrationInput> | null;
  if (!input) return json({ error: "Requête invalide." }, 400);

  const list = await listRegistrations(slug);
  if (list.some((r) => r.memberNumber === session.memberNumber && r.status !== "cancelled" && r.status !== "refunded")) return json({ error: "Vous êtes déjà inscrite à cet événement." }, 409);

  const remaining = Math.max(event.registration.capacity - takenPlaces(list), 0);
  const wantsWait = Boolean(event.registration.waitlist) && remaining <= 0;
  const errors = validateRegistration(input, event, wantsWait ? 99 : remaining);
  if (Object.keys(errors).length) return json({ error: "Certains champs sont à corriger.", errors }, 422);

  const places = event.registration.singlePlace ? 1 : Number(input.places);
  const amountCents = event.registration.priceCents * places;
  const clean: RegistrationInput = {
    firstName: input.firstName!.trim(),
    lastName: input.lastName!.trim(),
    email: input.email!.trim().toLowerCase(),
    phone: input.phone!.trim(),
    places,
    birthDate: input.birthDate,
    guardian: event.registration.guardianRequired ? input.guardian : undefined,
    emergency: { name: input.emergency!.name.trim(), phone: input.emergency!.phone.trim() },
    allergies: input.allergies?.trim().slice(0, 500),
    comment: input.comment?.trim().slice(0, 500),
    consents: { rules: true, privacy: true, image: Boolean(input.consents?.image) },
  };

  if (wantsWait) {
    const waiting = await addWaitlistRegistration({ ...clean, eventId: slug, memberNumber: session.memberNumber, amountCents, status: "waitlist" });
    if (!waiting) return json({ error: "Vous êtes déjà inscrite à cet événement." }, 409);
    return json({ registration: { id: waiting.id, status: "waitlist" }, message: "L'événement est complet : vous êtes inscrite sur la liste d'attente. Vous serez prévenue si une place se libère." }, 201);
  }

  const added = await addRegistration(
    {
    ...clean,
    eventId: slug,
    memberNumber: session.memberNumber,
    amountCents,
    status: amountCents > 0 ? "awaiting_payment" : "confirmed",
    },
    event.registration.capacity,
  );
  if (!added.ok) return json({ error: added.reason === "duplicate" ? "Vous êtes déjà inscrite à cet événement." : `Plus assez de places (${added.remaining} restante(s)).` }, 409);
  const registration = added.registration;

  if (amountCents === 0) return json({ registration: { id: registration.id, status: registration.status } }, 201);

  if (!stripeConfigured()) {
    return json({ registration: { id: registration.id, status: registration.status }, paymentEnabled: false, message: `Inscription enregistrée. Paiement de ${formatEuros(amountCents)} en attente : le paiement en ligne n'est pas encore activé.` }, 201);
  }

  try {
    const checkout = await createCheckoutSession({
      registrationId: registration.id,
      eventId: slug,
      eventTitle: event.title,
      unitAmountCents: event.registration.priceCents,
      quantity: places,
      customerEmail: clean.email,
      siteUrl: siteUrl(req),
    });
    await updateRegistration(registration.id, { stripeSessionId: checkout.id });
    return json({ registration: { id: registration.id, status: registration.status }, paymentEnabled: true, checkoutUrl: checkout.url }, 201);
  } catch {
    return json({ registration: { id: registration.id, status: registration.status }, paymentEnabled: false, message: "Inscription enregistrée, mais le paiement n'a pas pu être initialisé. Réessayez depuis cette page." }, 201);
  }
}
