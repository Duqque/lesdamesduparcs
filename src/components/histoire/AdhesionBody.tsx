import { Clock, Globe, Heart, House, IdCard, Mail, Megaphone, MessageCircle, MessagesSquare, ShoppingBag, Sparkles, Ticket, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { adhesion as a } from "@/data/adhesion";
import { membership } from "@/data/membership";
import { CountUp } from "./CountUp";
import { HorizontalSteps } from "./HorizontalSteps";
import { MemberCard } from "./MemberCard";
import { Timeline } from "./Timeline";
import { card, h2c, wrap } from "./styles";
import { JoinGate } from "@/components/member/JoinGate";

/** Contenu de la page « Adhésion » (/rejoindre-le-groupe/adhesion) : communauté, avantages, étapes, tarif. */
const benefitIcons: Record<string, LucideIcon> = { Ticket, Clock, IdCard, MessageCircle, Sparkles, Megaphone, MessagesSquare, Globe, Home: House, Heart, Users, ShoppingBag, Mail };

export function AdhesionBody() {
  return (
    <div className={`${wrap} space-y-28 md:space-y-40`}>
      <section aria-label="Communauté et adhésion, en bref" className="grid gap-10 md:grid-cols-2 md:gap-16">
        {[a.community, a.members].map((col, k) => (
          <Reveal key={col.title} delay={k * 0.08} className="min-w-0">
            <div className={`${card} flex h-full flex-col gap-5 p-7 md:p-9`}>
              <span aria-hidden className="grid size-12 place-items-center overflow-hidden rounded-full border border-psg-red-bright/50">
                {k === 0 ? <Users className="size-5" strokeWidth={1.6} /> : <IdCard className="size-5" strokeWidth={1.6} />}
              </span>
              <h3 className="break-words font-display text-[clamp(26px,2.6vw,36px)] font-semibold uppercase tracking-[0.04em] text-white">{col.title}</h3>
              <p className="break-words font-semibold text-white t-lead">{col.lead}</p>
              <p className="break-words text-white/80 t-small">{col.text}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section aria-labelledby="ad-pourquoi" className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <Reveal className="min-w-0">
          <h2 id="ad-pourquoi" className={h2c}>Pourquoi adhérer ?</h2>
        </Reveal>
        <Reveal delay={0.08} className="min-w-0">
          <p className="break-words text-white/80 t-lead">{a.why}</p>
        </Reveal>
      </section>

      <section aria-labelledby="ad-recoit">
        <Reveal>
          <h2 id="ad-recoit" className={`${h2c} max-w-[28ch]`}>Ce que comprend l’adhésion</h2>
        </Reveal>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {a.benefits.map((b, i) => {
            const Icon = benefitIcons[b.icon] ?? Sparkles;
            return (
              <li key={b.title} className="min-w-0">
                <Reveal delay={(i % 4) * 0.06} className="h-full">
                  <div className={`${card} group flex h-full flex-col gap-4 p-7`}>
                    <span aria-hidden className="grid size-14 place-items-center overflow-hidden rounded-full border border-psg-red-bright/50 bg-night-800 transition-transform duration-500 group-hover:-translate-y-1">
                      <Icon className="size-6 text-white" strokeWidth={1.6} />
                    </span>
                    <h3 className="break-words font-body text-[17px] font-semibold text-white">{b.title}</h3>
                    <p className="break-words text-white/75 t-small">{b.text}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="ad-tarif" className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <Reveal className="min-w-0">
          <h2 id="ad-tarif" className={h2c}>{a.price.amount} € pour la saison {a.price.season}</h2>
        </Reveal>
        <Reveal delay={0.08} className="min-w-0">
          <div className={`${card} p-7 md:p-10`}>
            <p className="font-display text-[clamp(64px,9vw,120px)] font-semibold leading-none tabular-nums text-white">
              <CountUp to={a.price.amount} /> €
            </p>
            <p className="mt-3 break-words font-semibold text-white t-lead">{a.price.lead}</p>
            <div className="mt-6 space-y-3">
              <p className="break-words text-white/75 t-lead">{a.price.validUntil}</p>
              <p className="break-words text-white/75 t-small">{a.price.renewal}</p>
            </div>
            <JoinGate><Button size="lg" className="mt-8" href={membership.joinHref}>J’adhère</Button></JoinGate>
          </div>
        </Reveal>
      </section>

      <section aria-labelledby="ad-devenir">
        <Reveal>
          <h2 id="ad-devenir" className={`${h2c} max-w-[28ch]`}>Comment devient-on membre ?</h2>
        </Reveal>
        <Reveal delay={0.06} className="mx-auto mt-12 max-w-[460px]">
          <MemberCard season={membership.season} />
        </Reveal>
        <div className="mt-16 lg:hidden">
          <Timeline items={a.steps} label="Les quatre étapes pour devenir membre" />
        </div>
        <div className="mt-16">
          <HorizontalSteps items={a.steps} label="Les quatre étapes pour devenir membre" />
        </div>
      </section>

      <section aria-labelledby="ad-espace" className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <Reveal className="min-w-0">
          <h2 id="ad-espace" className={h2c}>L’espace privé des membres</h2>
        </Reveal>
        <Reveal delay={0.08} className="min-w-0">
          <p className="break-words text-white/80 t-lead">{a.privateSpace.lead}</p>
          <Button size="lg" className="mt-8" href="/profil#espace-prive">{a.privateSpace.cta}</Button>
        </Reveal>
      </section>

      <Reveal className="text-center">
        <p className="mx-auto max-w-[32ch] break-words font-display text-[clamp(22px,2.6vw,32px)] font-semibold uppercase leading-[1.2] tracking-[0.03em] text-white">
          {a.final.split("\n").map((line) => (
            <span key={line} className="block">{line}</span>
          ))}
        </p>
      </Reveal>
    </div>
  );
}

