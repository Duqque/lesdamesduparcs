import Image from "next/image";
import { Globe, Handshake, Sparkles, Users, type LucideIcon } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "@/components/icons/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { ValueIcon } from "@/components/histoire/ValueIcon";
import { CountUp } from "@/components/histoire/CountUp";
import { body, card, h2c, pullc, wrap } from "@/components/histoire/styles";
import { groupe as g } from "@/data/groupe";
import { socialLinks } from "@/data/navigation";
import type { GroupPhoto } from "@/lib/group-photos";

const buildIcons: LucideIcon[] = [Users, Handshake, Globe, Sparkles];

function BentoPhoto({ photo, className }: { photo: GroupPhoto; className: string }) {
  return (
    <div className={`relative isolate overflow-hidden rounded-[10px] border border-line bg-night-900 ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        unoptimized={photo.src.startsWith("/medias/") || photo.src.startsWith("http")}
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="object-cover saturate-[0.85]"
      />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,25,0)_55%,rgba(3,9,25,0.55)_100%)]" />
    </div>
  );
}

function StatCard({ value, label, dark }: { value: string; label: string; dark?: boolean }) {
  const n = Number(value.replace(/\s/g, ""));
  return (
    <div className={`flex h-full min-h-[140px] flex-col justify-between gap-4 rounded-[10px] border p-6 ${dark ? "border-psg-red-bright/40 bg-[linear-gradient(160deg,#1a0a14_0%,#0b1327_100%)]" : "border-line bg-night-900/85"}`}>
      <p className="font-display text-[clamp(34px,3.4vw,48px)] font-semibold leading-none tabular-nums text-white">
        {Number.isFinite(n) && String(n) === value.replace(/\s/g, "") ? <CountUp to={n} /> : value}
      </p>
      <p className="break-words text-mist t-small">{label}</p>
    </div>
  );
}

/** Page unique « Qui sommes-nous » (ex-« Le groupe ») : chiffres clés, origine du projet, positionnement, valeurs, ambitions. */
export function QuiSommesNousBody({ photos }: { photos: Record<string, GroupPhoto> }) {
  return (
    <div className="space-y-28 md:space-y-40">
      {/* Bento : chiffres clés + réseaux, en un coup d'œil */}
      <section aria-labelledby="en-bref" className={wrap}>
        <Reveal className="max-w-2xl">
          <p className="t-eyebrow">{g.bento.eyebrow}</p>
          <h2 id="en-bref" className={`${h2c} mt-4`}>{g.bento.title}</h2>
          <p className="mt-5 max-w-[62ch] break-words text-white/80 t-lead">{g.bento.lead}</p>
        </Reveal>

        {/* Grille en damier à partir de lg ; empilée verticalement en dessous. */}
        <div className="mt-12 hidden gap-4 lg:grid lg:grid-cols-4" style={{ gridTemplateAreas: `"photoA photoA stat1 stat2" "photoA photoA social stat3" "photoB photoB photoB stat4"` }}>
          <div style={{ gridArea: "photoA" }} className="min-h-[340px]"><Reveal className="h-full"><BentoPhoto photo={photos["bento-1"]} className="h-full min-h-[340px]" /></Reveal></div>
          <div style={{ gridArea: "stat1" }}><Reveal delay={0.05} className="h-full"><StatCard value={g.bento.stats[0].value} label={g.bento.stats[0].label} dark /></Reveal></div>
          <div style={{ gridArea: "stat2" }}><Reveal delay={0.1} className="h-full"><StatCard value={g.bento.stats[1].value} label={g.bento.stats[1].label} /></Reveal></div>
          <div style={{ gridArea: "social" }}>
            <Reveal delay={0.15} className="h-full">
              <div className="flex h-full min-h-[140px] flex-col justify-between gap-4 rounded-[10px] border border-line bg-night-900/85 p-6">
                <p className="t-eyebrow">Nous suivre</p>
                <div className="flex gap-3">
                  {socialLinks.map((s) => {
                    const Icon = s.id === "instagram" ? InstagramIcon : TikTokIcon;
                    return (
                      <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid size-11 place-items-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-psg-red-bright hover:text-white">
                        <Icon className="size-[18px]" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
          <div style={{ gridArea: "stat3" }}><Reveal delay={0.2} className="h-full"><StatCard value={g.bento.stats[2].value} label={g.bento.stats[2].label} /></Reveal></div>
          <div style={{ gridArea: "photoB" }} className="min-h-[180px]"><Reveal delay={0.25} className="h-full"><BentoPhoto photo={photos["bento-2"]} className="h-full min-h-[180px]" /></Reveal></div>
          <div style={{ gridArea: "stat4" }}><Reveal delay={0.3} className="h-full"><StatCard value={g.bento.stats[3].value} label={g.bento.stats[3].label} dark /></Reveal></div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 lg:hidden">
          <Reveal className="col-span-2"><BentoPhoto photo={photos["bento-1"]} className="aspect-[16/10] w-full" /></Reveal>
          {g.bento.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05}><StatCard value={s.value} label={s.label} dark={i % 2 === 0} /></Reveal>
          ))}
          <div className="col-span-2 flex items-center justify-between gap-4 rounded-[10px] border border-line bg-night-900/85 p-6">
            <p className="t-eyebrow">Nous suivre</p>
            <div className="flex gap-3">
              {socialLinks.map((s) => {
                const Icon = s.id === "instagram" ? InstagramIcon : TikTokIcon;
                return (
                  <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid size-11 place-items-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-psg-red-bright hover:text-white">
                    <Icon className="size-[18px]" />
                  </a>
                );
              })}
            </div>
          </div>
          <Reveal className="col-span-2"><BentoPhoto photo={photos["bento-2"]} className="aspect-[16/9] w-full" /></Reveal>
        </div>
      </section>

      {/* Notre histoire */}
      <section id="origine" aria-labelledby="origine-titre" className={`${wrap} scroll-mt-32`}>
        <Reveal className="max-w-2xl">
          <p className="t-eyebrow">{g.origin.eyebrow}</p>
          <h2 id="origine-titre" className={`${h2c} mt-4`}>{g.origin.title}</h2>
        </Reveal>
        <div className="mt-10 grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <div className="min-w-0 space-y-6">
            {g.origin.paragraphs.map((p) => (
              <Reveal key={p}><p className={body}>{p}</p></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi un fan club 100 % féminin */}
      <section aria-labelledby="pourquoi-titre" className={wrap}>
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <Reveal className="min-w-0">
            <p className="t-eyebrow">{g.why.eyebrow}</p>
            <h2 id="pourquoi-titre" className={`${h2c} mt-4`}>{g.why.title}</h2>
            <p className={`${pullc} mt-8 max-w-[18ch]`}>{g.why.pull}</p>
          </Reveal>
          <div className="min-w-0 space-y-6">
            {g.why.paragraphs.map((p) => (
              <Reveal key={p}><p className={body}>{p}</p></Reveal>
            ))}
            <Reveal><BentoPhoto photo={photos.pourquoi} className="mt-4 aspect-[16/9] w-full" /></Reveal>
          </div>
        </div>
      </section>

      {/* Nos valeurs */}
      <section aria-labelledby="valeurs-titre" className={wrap}>
        <Reveal className="max-w-2xl">
          <p className="t-eyebrow">{g.values.eyebrow}</p>
          <h2 id="valeurs-titre" className={`${h2c} mt-4`}>{g.values.title}</h2>
        </Reveal>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {g.values.items.map((v, i) => (
            <li key={v.title} className="min-w-0">
              <Reveal delay={(i % 3) * 0.06} className="h-full">
                <div className={`${card} flex h-full flex-col gap-5 p-7`}>
                  <ValueIcon name={v.title} />
                  <div>
                    <h3 className="break-words font-display text-[22px] font-semibold uppercase tracking-[0.04em] text-white">{v.title}</h3>
                    <p className="mt-2 break-words text-white/75 t-small">{v.text}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Ce que nous voulons construire */}
      <section aria-labelledby="construire-titre" className={wrap}>
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <Reveal className="min-w-0">
            <p className="t-eyebrow">{g.build.eyebrow}</p>
            <h2 id="construire-titre" className={`${h2c} mt-4`}>{g.build.title}</h2>
            <div className="mt-10 hidden md:block"><BentoPhoto photo={photos.construire} className="aspect-[4/5] w-full" /></div>
          </Reveal>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {g.build.items.map((b, i) => {
              const Icon = buildIcons[i] ?? Sparkles;
              return (
                <li key={b.title} className="min-w-0">
                  <Reveal delay={(i % 2) * 0.06} className="h-full">
                    <div className={`${card} flex h-full flex-col gap-4 p-7`}>
                      <Icon aria-hidden className="size-7 text-psg-red-bright" strokeWidth={1.6} />
                      <h3 className="break-words font-display text-[19px] font-semibold uppercase tracking-[0.04em] text-white">{b.title}</h3>
                      <p className="break-words text-white/75 t-small">{b.text}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
