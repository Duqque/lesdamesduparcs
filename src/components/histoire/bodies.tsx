import Image from "next/image";
import { Calendar, Clock, Globe, Handshake, Heart, House, IdCard, Mail, Megaphone, MessageCircle, MessagesSquare, PartyPopper, Quote, ShoppingBag, Sparkles, Star, Ticket, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { adhesion as a } from "@/data/adhesion";
import { histoire as h } from "@/data/histoire";
import { membership } from "@/data/membership";
import { CountUp } from "./CountUp";
import { HorizontalSteps } from "./HorizontalSteps";
import { MatchdayRoute } from "./MatchdayRoute";
import { MemberCard } from "./MemberCard";
import { StoryTimeline } from "./StoryTimeline";
import { Timeline } from "./Timeline";
import { ValueIcon } from "./ValueIcon";
import { WhyTabs } from "./WhyTabs";
import { bigc, body, card, h2c, pullc, wrap } from "./styles";
import { JoinGate } from "@/components/member/JoinGate";

const Sign = () => (
  <Reveal>
    <p className="pt-4 text-white/80 t-lead">
      Avec toute notre passion,
      <br />
      <span className="font-display text-[26px] font-semibold uppercase tracking-[0.05em] text-white">Les Dames du Parc</span>
    </p>
  </Reveal>
);

export function LetterBody() {
  return (
    <div className={wrap}>
      <Reveal>
        <p className="max-w-[34ch] break-words text-[clamp(22px,3vw,40px)] font-medium leading-[1.16] text-white">{h.letter.statement}</p>
      </Reveal>
      <div className="mt-16 grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
        <Reveal className="min-w-0">
          <p className={`${pullc} max-w-[16ch] md:sticky md:top-32`}>{h.letter.pull}</p>
        </Reveal>
        <div className="min-w-0 space-y-7">
          {h.letter.paragraphs.map((p, i) => (
            <Reveal key={p}>
              <p className={i === 3 ? "max-w-[62ch] break-words font-semibold text-white t-lead" : body}>{p}</p>
            </Reveal>
          ))}
          <Sign />
        </div>
      </div>
    </div>
  );
}

export function StoryBody() {
  return (
    <div className={wrap}>
      <StoryTimeline steps={h.story.steps} />
    </div>
  );
}

const figureIcons: LucideIcon[] = [Users, IdCard, Ticket, Star, Calendar];

export function WhoBody() {
  return (
    <div className={wrap}>
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div className="min-w-0 space-y-7">
          <Reveal><p className={body}>{h.who.paragraphs[0]}</p></Reveal>
          <Reveal><p className={body}>{h.who.paragraphs[1]}</p></Reveal>
          <Reveal><h2 className={`${h2c} pt-6`}>{h.who.profilsTitle}</h2></Reveal>
          <Reveal><p className={body}>{h.who.paragraphs[2]}</p></Reveal>
          <Reveal><p className={body}>{h.who.paragraphs[3]}</p></Reveal>
        </div>
        <Reveal delay={0.1} className="min-w-0">
          <p className={`${pullc} max-w-[18ch] md:sticky md:top-32`}>{h.who.pull}</p>
        </Reveal>
      </div>
      <div className="mt-24">
        <Reveal>
          <p className="t-eyebrow">Notre communauté en chiffres</p>
          <h2 className={`${h2c} mt-4 max-w-[20ch]`}>{h.who.figuresTitle}</h2>
        </Reveal>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {h.who.figures.map((f, i) => {
            const Icon = figureIcons[i] ?? Star;
            return (
              <li key={f.label} className="min-w-0">
                <Reveal delay={i * 0.06} className="h-full">
                  <div className={`${card} flex h-full min-h-[230px] flex-col justify-between gap-8 p-7`}>
                    <div className="flex items-start justify-between gap-4">
                      <p data-fit-group="figures" className="font-display text-[clamp(56px,6vw,92px)] font-semibold leading-none tabular-nums text-white">
                        {f.count !== null ? <CountUp to={f.count} /> : f.value}
                      </p>
                      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full border border-psg-red-bright/50">
                        <Icon className="size-5 text-white" strokeWidth={1.6} />
                      </span>
                    </div>
                    <p className="break-words text-mist t-small">{f.label}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
        <Reveal><p className="mt-8 max-w-[70ch] break-words text-mist t-small">{h.who.note}</p></Reveal>
      </div>
    </div>
  );
}

export function ValuesBody() {
  return (
    <div className={wrap}>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {h.values.items.map((v, i) => (
          <li key={v.title} className="min-w-0">
            <Reveal delay={(i % 3) * 0.06} className="h-full">
              <div className={`${card} flex h-full flex-col gap-5 p-7`}>
                <div className="flex items-center justify-between gap-4">
                  <ValueIcon name={v.title} />
                  <p className="text-[12px] font-semibold tabular-nums tracking-[0.2em] text-psg-red-bright">{String(i + 1).padStart(2, "0")}</p>
                </div>
                <h2 data-fit-group="values" className="break-words font-display text-[clamp(30px,3.2vw,44px)] font-semibold uppercase leading-[1.05] tracking-[0.04em] text-white">{v.title}</h2>
                <p className="break-words text-white/75 t-small">{v.text}</p>
                <blockquote className="mt-auto break-words border-t border-line pt-5 font-body text-[18px] font-semibold uppercase leading-[1.25] tracking-[0.03em] text-psg-red-bright">{v.quote}</blockquote>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhyBody() {
  return (
    <div className={wrap}>
      <Reveal>
        <p className="max-w-[46ch] break-words text-[clamp(19px,2.1vw,28px)] font-medium leading-[1.28] text-white">{h.why.intro}</p>
      </Reveal>
      <div className="mt-14">
        <WhyTabs tabs={h.why.tabs} />
      </div>
    </div>
  );
}

const buildIcons: LucideIcon[] = [Users, Handshake, Globe, Sparkles];

export function BuildBody() {
  return (
    <div className={wrap}>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {h.build.items.map((b, i) => {
          const Icon = buildIcons[i] ?? Sparkles;
          return (
            <li key={b.title} className="min-w-0">
              <Reveal delay={(i % 2) * 0.06} className="h-full">
                <div className={`${card} group flex h-full flex-col gap-5 p-7 md:p-9`}>
                  <div className="flex items-center justify-between gap-4">
                    <span aria-hidden className="grid size-14 place-items-center overflow-hidden rounded-full border border-psg-red-bright/50 bg-night-800 transition-transform duration-500 group-hover:-translate-y-1">
                      <Icon className="size-6 text-white" strokeWidth={1.6} />
                    </span>
                    <p className="font-display text-[40px] font-semibold leading-none tabular-nums text-psg-red-bright">{String(i + 1).padStart(2, "0")}</p>
                  </div>
                  <h2 className={h2c}>{b.title}</h2>
                  <p className="break-words text-white/75 t-lead">{b.text}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function VoicesBody() {
  return (
    <>
      <ul
        role="region"
        aria-label="Témoignages de supportrices, à faire défiler horizontalement"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-6 [scrollbar-color:#d90f2c_transparent] [scrollbar-width:thin]"
      >
        {h.voices.items.map((q, i) => (
          <li key={q} className="w-[min(82vw,400px)] shrink-0 snap-start">
            <blockquote
              className={`flex h-full min-h-[340px] min-w-0 flex-col justify-between gap-8 overflow-hidden rounded-[10px] border p-7 ${
                i % 3 === 1 ? "border-psg-red-bright/50 bg-psg-red text-white" : "border-line bg-night-900/85 text-white"
              }`}
            >
              <Quote aria-hidden className="size-9 shrink-0 opacity-70" strokeWidth={1.4} />
              <p className="break-words font-display text-[clamp(21px,2vw,28px)] font-semibold uppercase leading-[1.14] tracking-[0.02em]">{q}</p>
            </blockquote>
          </li>
        ))}
      </ul>
      <p className={`${wrap} mt-6 t-caption text-mist`}>Faites défiler pour lire toutes les voix.</p>
    </>
  );
}

export function DailyBody() {
  const blockIcons: LucideIcon[] = [MessagesSquare, PartyPopper];
  return (
    <div className={wrap}>
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <Reveal className="min-w-0">
          <p className="max-w-[40ch] break-words text-[clamp(19px,2vw,26px)] font-medium leading-[1.35] text-white">{h.daily.lead}</p>
        </Reveal>
        <div className="min-w-0 space-y-10">
          {h.daily.blocks.map((b, i) => {
            const Icon = blockIcons[i] ?? MessagesSquare;
            return (
              <Reveal key={b.title} className="space-y-5">
                <h2 className="flex items-center gap-4 break-words font-display text-[clamp(22px,2.4vw,30px)] font-semibold uppercase leading-[1.1] tracking-[0.04em] text-white">
                  <span aria-hidden className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-psg-red-bright/50">
                    <Icon className="size-5" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0">{b.title}</span>
                </h2>
                {b.paragraphs.map((p) => (
                  <p key={p} className={body}>{p}</p>
                ))}
              </Reveal>
            );
          })}
        </div>
      </div>
      <Reveal className="mt-20">
        <figure className="relative isolate overflow-hidden rounded-[10px] border border-line bg-night-900 p-7 md:p-14">
          <Image src="/images/supportrices-parc-des-princes.webp" alt="" fill sizes="(min-width: 1200px) 1200px, 100vw" className="-z-10 object-cover object-[50%_35%]" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,9,25,0.92)_0%,rgba(3,9,25,0.72)_60%,rgba(3,9,25,0.5)_100%)]" />
          <blockquote className={`${bigc} max-w-[22ch]`}>{h.daily.quote}</blockquote>
          <figcaption className="mt-8 text-[12px] font-semibold uppercase tracking-[0.3em] text-white/80">{h.daily.caption}</figcaption>
        </figure>
      </Reveal>
    </div>
  );
}

export function OffMatchBody() {
  return (
    <div className={wrap}>
      <div className="grid items-start gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-20">
        <div className="min-w-0 space-y-7">
          <Reveal>
            <figure className="relative aspect-[16/9] overflow-hidden rounded-[8px] border border-line">
              <Image src="/images/vestiaire-fauteuils.webp" alt="Le vestiaire du Parc des Princes, fauteuils bleus et maillots accrochés au nom des joueurs" fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
            </figure>
          </Reveal>
          {h.offMatch.paragraphs.map((p) => (
            <Reveal key={p}><p className={body}>{p}</p></Reveal>
          ))}
        </div>
        <div className="min-w-0 space-y-8">
          <Reveal><p className={`${pullc} max-w-[20ch]`}>{h.offMatch.pull}</p></Reveal>
          <Reveal><p className={body}>{h.offMatch.after}</p></Reveal>
        </div>
      </div>
      <div className="mt-20 grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
        <Reveal className="min-w-0">
          <p className="t-eyebrow">Une journée type</p>
          <h2 className={`${h2c} mt-4`}>Le Stadium Tour et la suite</h2>
        </Reveal>
        <MatchdayRoute />
      </div>
    </div>
  );
}

export function EvidenceBody() {
  return (
    <div className={wrap}>
      <Reveal className="mb-16">
        <figure className="relative aspect-[21/9] overflow-hidden rounded-[8px] border border-line">
          <Image src="/images/parc-des-princes-facade.webp" alt="La façade en béton du Parc des Princes vue depuis le boulevard périphérique" fill sizes="(min-width: 1200px) 1200px, 100vw" className="object-cover" />
        </figure>
      </Reveal>
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div className="min-w-0 space-y-7">
          {h.evidence.left.map((p) => (
            <Reveal key={p}><p className={body}>{p}</p></Reveal>
          ))}
        </div>
        <div className="min-w-0 space-y-7">
          <Reveal><p className={`${pullc} max-w-[22ch]`}>{h.evidence.pull}</p></Reveal>
          {h.evidence.right.map((p) => (
            <Reveal key={p}><p className={body}>{p}</p></Reveal>
          ))}
          <Reveal><p className={`${bigc} pt-4 !text-psg-red-bright`}>{h.evidence.final}</p></Reveal>
        </div>
      </div>
    </div>
  );
}

export function ConclusionBody() {
  return (
    <div className={wrap}>
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div className="min-w-0 space-y-7">
          {h.conclusion.left.map((p) => (
            <Reveal key={p}><p className={body}>{p}</p></Reveal>
          ))}
        </div>
        <div className="min-w-0 space-y-7">
          <Reveal><p className={`${pullc} max-w-[22ch]`}>{h.conclusion.pull}</p></Reveal>
          {h.conclusion.right.map((p) => (
            <Reveal key={p}><p className={body}>{p}</p></Reveal>
          ))}
          <Sign />
        </div>
      </div>
      <Reveal className="mt-20 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" href="/rejoindre-le-groupe/adhesion">Communauté & adhésion</Button>
        <JoinGate><Button size="lg" variant="outline" href="/rejoindre-le-groupe">Devenir membre</Button></JoinGate>
      </Reveal>
    </div>
  );
}

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

