import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, Clock, MapPin, Ticket } from "lucide-react";
import { Suspense } from "react";
import { ScheduleTile } from "@/components/events/ScheduleTile";
import { EventAccess } from "@/components/events/EventAccess";
import { ReserveBar } from "@/components/events/ReserveBar";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { events, getEvent } from "@/data/events";
import { formatLongDate, formatTime } from "@/lib/format";

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return {};
  return { title: event.title, description: event.summary, openGraph: { title: event.title, description: event.summary, images: [event.image] } };
}

const label = "font-body text-[12px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright";
const h2 = "mt-3 font-display text-[clamp(26px,3.4vw,44px)] font-semibold uppercase leading-[1.04] tracking-[0.05em] text-white";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const others = events.filter((e) => e.id !== event.id).sort((a, b) => a.date.localeCompare(b.date));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: `${event.date}T${event.time}:00+01:00`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: event.venue, address: event.address },
    organizer: { "@type": "Organization", name: "Les Dames du Parc" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden px-[var(--gutter)] pb-16 pt-[200px] md:pb-24">
        <Image src={event.image} alt={event.imageAlt} fill priority sizes="100vw" className="-z-10 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(3,9,25,0.55)_0%,rgba(3,9,25,0.25)_35%,rgba(3,9,25,0.92)_100%),linear-gradient(90deg,rgba(3,9,25,0.7)_0%,transparent_65%)]" />
        <div className="mx-auto w-full max-w-[1300px]">
          <Link href="/evenements" className="group mb-8 inline-flex min-h-11 items-center gap-2 font-body text-[12px] font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white">
            <ArrowLeft aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Tous les événements
          </Link>
          <p className="w-fit rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-body text-[11px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-md">{event.tag}</p>
          <h1 className="mt-5 max-w-3xl font-display text-[clamp(38px,6.4vw,92px)] font-semibold uppercase leading-[0.96] tracking-[0.05em] text-white">{event.title}</h1>
          <p className="mt-5 max-w-2xl font-body text-[16px] leading-relaxed text-white/85 md:text-[19px]">{event.subtitle}</p>
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-body text-[14px] text-white/90">
            <li className="flex items-center gap-2.5">
              <CalendarPlus aria-hidden className="size-4 text-psg-red-bright" strokeWidth={1.8} />
              <time dateTime={event.date}>{formatLongDate(event.date)}</time>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock aria-hidden className="size-4 text-psg-red-bright" strokeWidth={1.8} />
              {formatTime(event.time)} à {formatTime(event.endTime)}
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin aria-hidden className="size-4 text-psg-red-bright" strokeWidth={1.8} />
              {event.venue}
            </li>
          </ul>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" href="#inscription">
              Réserver ma place
            </Button>
            <Button size="lg" variant="outline" href={`/evenements/${event.id}/event.ics`} download arrow={false}>
              Ajouter à mon agenda
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1300px] gap-16 px-[var(--gutter)] py-28 md:py-40 lg:grid-cols-[1fr_360px] lg:gap-24">
        <div className="space-y-28">
          <Reveal>
            <p className={label}>L&rsquo;événement</p>
            <h2 className={h2}>{event.summary}</h2>
            <div className="mt-8 space-y-7 font-body text-[16px] leading-[1.9] text-white/80 md:text-[17px]">
              {event.description.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>

          <section aria-labelledby="programme">
            <Reveal>
              <p className={label}>Déroulé</p>
              <h2 id="programme" className={h2}>
                Au programme
              </h2>
            </Reveal>
            <ol className="mt-12 border-l border-white/15">
              {event.program.map((item, i) => (
                <li key={item.time + item.title}>
                  <Reveal delay={Math.min(i, 4) * 0.04} className="relative grid gap-1 pb-14 pl-8 last:pb-0 sm:grid-cols-[92px_1fr] sm:gap-6">
                    <span aria-hidden className="absolute -left-[5px] top-[9px] size-[9px] rounded-full bg-psg-red-bright ring-4 ring-night-950" />
                    <span className="font-display text-[26px] font-semibold tabular-nums leading-none tracking-[0.04em] text-white">{formatTime(item.time)}</span>
                    <span>
                      <h3 className="font-body text-[16px] font-semibold text-white">{item.title}</h3>
                      <p className="mt-1.5 font-body text-[15px] leading-[1.7] text-mist">{item.text}</p>
                    </span>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>

          {event.speakers.length > 0 && (
            <section aria-labelledby="intervenants">
              <Reveal>
                <p className={label}>Invitées et invités</p>
                <h2 id="intervenants" className={h2}>
                  Les intervenants
                </h2>
              </Reveal>
              <ul className="mt-12 grid gap-6 sm:grid-cols-2">
                {event.speakers.map((s, i) => (
                  <li key={s.name} className={i === 0 ? "sm:col-span-2" : ""}>
                    <Reveal delay={i * 0.06} className="h-full">
                      <div className="flex h-full gap-5 rounded-[14px] border border-line bg-night-900/85 p-5 md:p-6">
                        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#12285a,#0a1430)] font-display text-[22px] font-semibold tracking-[0.06em] text-white ring-1 ring-white/20 md:size-[72px]">
                          {s.initials}
                        </span>
                        <div>
                          <h3 className="font-body text-[17px] font-semibold text-white">{s.name}</h3>
                          <p className="mt-1 font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-psg-red-bright">{s.role}</p>
                          <p className="mt-3 font-body text-[14.5px] leading-[1.7] text-mist">{s.bio}</p>
                        </div>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside aria-label="Informations pratiques" className="lg:sticky lg:top-[100px] lg:self-start">
          <Reveal>
            <div className="rounded-[16px] border border-line bg-night-900/90 p-6 shadow-[0_30px_60px_-36px_rgba(0,0,0,0.9)]">
              <p className={label}>Infos pratiques</p>
              <dl className="mt-5 divide-y divide-white/10">
                <div className="pb-4">
                  <dt className="font-body text-[11px] uppercase tracking-[0.2em] text-mist">Date</dt>
                  <dd className="mt-1.5 font-body text-[15px] font-medium text-white">{formatLongDate(event.date)}</dd>
                </div>
                <div className="py-4">
                  <dt className="font-body text-[11px] uppercase tracking-[0.2em] text-mist">Horaires</dt>
                  <dd className="mt-1.5 font-body text-[15px] font-medium text-white">
                    {formatTime(event.time)} à {formatTime(event.endTime)}
                  </dd>
                </div>
                <div className="py-4">
                  <dt className="font-body text-[11px] uppercase tracking-[0.2em] text-mist">Lieu</dt>
                  <dd className="mt-1.5 font-body text-[15px] font-medium text-white">{event.venue}</dd>
                  <dd className="mt-0.5 font-body text-[13.5px] text-mist">{event.address}</dd>
                </div>
                {event.practical.map((row) => (
                  <div key={row.label} className="py-4 last:pb-0">
                    <dt className="font-body text-[11px] uppercase tracking-[0.2em] text-mist">{row.label}</dt>
                    <dd className="mt-1.5 font-body text-[14.5px] leading-snug text-white/90">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-col gap-2.5">
                <Button size="lg" href="#inscription" className="w-full">
                  <Ticket aria-hidden className="mr-1 inline size-4" />
                  Réserver ma place
                </Button>
                <Button size="lg" variant="outline" href={`/evenements/${event.id}/event.ics`} download arrow={false} className="w-full">
                  Ajouter à mon agenda
                </Button>
              </div>
              <p className="mt-4 font-body text-[12px] leading-relaxed text-mist">Informations données à titre indicatif, sous réserve de confirmation par les organisatrices.</p>
            </div>
          </Reveal>
        </aside>
      </div>

      <Suspense fallback={null}>
        <EventAccess event={event} />
      </Suspense>
      <ReserveBar event={event} />

      <section aria-labelledby="autres" className="pb-40 md:pb-56">
        <div className="mx-auto flex max-w-[1300px] items-end justify-between px-[var(--gutter)]">
          <div>
            <p className={label}>À suivre</p>
            <h2 id="autres" className={h2}>
              D&rsquo;autres rendez-vous
            </h2>
          </div>
          <Link href="/evenements" className="hidden min-h-11 items-center font-body text-[12.5px] font-medium text-white/80 hover:text-white sm:inline-flex">
            Voir le calendrier
          </Link>
        </div>
        <ul className="mt-14 flex snap-x gap-6 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:none] md:gap-8 [&::-webkit-scrollbar]:hidden">
          {others.map((e) => (
            <li key={e.id} className="shrink-0 snap-start">
              <ScheduleTile event={e} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
