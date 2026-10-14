import Image from "next/image";
import { Globe, Handshake, Sparkles, Users, type LucideIcon } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "@/components/icons/BrandIcons";
import { Reveal } from "@/components/ui/Reveal";
import { ValueIcon } from "@/components/histoire/ValueIcon";
import { CountUp } from "@/components/histoire/CountUp";
import { body, card, h2c, pullc, wrap } from "@/components/histoire/styles";
import { groupe as g } from "@/data/groupe";
import { toParagraphs } from "@/lib/paragraphs";
import { cmsDefault } from "@/data/cms-fields";
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
        unoptimized={photo.src.startsWith("http")}
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
        {Number.isFinite(n) && String(n) === value.replace(/\s/g, "") ? <CountUp to={n} grouping={/\s/.test(value.trim())} /> : value}
      </p>
      <p className="break-words text-mist t-small">{label}</p>
    </div>
  );
}

/** Page unique « Qui sommes-nous » (ex-« Le groupe ») : chiffres clés, origine du projet, positionnement, valeurs, ambitions. */
export function QuiSommesNousBody({ photos, cms }: { photos: Record<string, GroupPhoto>; cms: { t: (key: string, fallback: string) => string } }) {
  // Chaque texte de la page : celui saisi dans l'administration, sinon celui d'origine (src/data/cms-fields.ts).
  const t = (key: string) => cms.t(key, cmsDefault(key));
  const origineParagraphs = toParagraphs(t("groupe.origine.texte"));
  const pourquoiParagraphs = toParagraphs(t("groupe.pourquoi.texte"));
  const stats = g.bento.stats.map((_, i) => ({ value: t(`groupe.bento.chiffre${i + 1}.valeur`), label: t(`groupe.bento.chiffre${i + 1}.legende`) }));
  // L'icône d'une valeur reste liée à son nom d'origine : renommer « Passion » ne doit pas lui faire perdre sa flamme.
  const values = g.values.items.map((v, i) => ({ icon: v.title, title: t(`groupe.valeurs.${i + 1}.titre`), text: t(`groupe.valeurs.${i + 1}.texte`) }));
  const build = g.build.items.map((_, i) => ({ title: t(`groupe.construire.${i + 1}.titre`), text: t(`groupe.construire.${i + 1}.texte`) }));
  const followLabel = t("groupe.bento.reseaux");
  return (
    <div className="space-y-28 md:space-y-40">
      {/* Bento : chiffres clés + réseaux, en un coup d'œil */}
      <section aria-labelledby="en-bref" className={wrap}>
        <Reveal className="max-w-2xl">
          <p className="t-eyebrow">{t("groupe.bento.etiquette")}</p>
          <h2 id="en-bref" className={`${h2c} mt-4`}>{t("groupe.bento.titre")}</h2>
          <p className="mt-5 max-w-[62ch] break-words text-white/80 t-lead">{t("groupe.bento.texte")}</p>
        </Reveal>

        {/* Grille en damier à partir de lg ; empilée verticalement en dessous. */}
        <div className="mt-12 hidden gap-4 lg:grid lg:grid-cols-4" style={{ gridTemplateAreas: `"photoA photoA stat1 stat2" "photoA photoA social stat3" "photoB photoB photoB stat4"` }}>
          <div style={{ gridArea: "photoA" }} className="min-h-[340px]"><Reveal className="h-full"><BentoPhoto photo={photos["bento-1"]} className="h-full min-h-[340px]" /></Reveal></div>
          <div style={{ gridArea: "stat1" }}><Reveal delay={0.05} className="h-full"><StatCard value={stats[0].value} label={stats[0].label} dark /></Reveal></div>
          <div style={{ gridArea: "stat2" }}><Reveal delay={0.1} className="h-full"><StatCard value={stats[1].value} label={stats[1].label} /></Reveal></div>
          <div style={{ gridArea: "social" }}>
            <Reveal delay={0.15} className="h-full">
              <div className="flex h-full min-h-[140px] flex-col justify-between gap-4 rounded-[10px] border border-line bg-night-900/85 p-6">
                <p className="t-eyebrow">{followLabel}</p>
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
          <div style={{ gridArea: "stat3" }}><Reveal delay={0.2} className="h-full"><StatCard value={stats[2].value} label={stats[2].label} /></Reveal></div>
          <div style={{ gridArea: "photoB" }} className="min-h-[180px]"><Reveal delay={0.25} className="h-full"><BentoPhoto photo={photos["bento-2"]} className="h-full min-h-[180px]" /></Reveal></div>
          <div style={{ gridArea: "stat4" }}><Reveal delay={0.3} className="h-full"><StatCard value={stats[3].value} label={stats[3].label} dark /></Reveal></div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 lg:hidden">
          <Reveal className="col-span-2"><BentoPhoto photo={photos["bento-1"]} className="aspect-[16/10] w-full" /></Reveal>
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 0.05}><StatCard value={s.value} label={s.label} dark={i % 2 === 0} /></Reveal>
          ))}
          <div className="col-span-2 flex items-center justify-between gap-4 rounded-[10px] border border-line bg-night-900/85 p-6">
            <p className="t-eyebrow">{followLabel}</p>
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
        <div className="mx-auto max-w-[760px] text-center">
          <Reveal>
            <p className="t-eyebrow">{t("groupe.origine.etiquette")}</p>
            <h2 id="origine-titre" className={`${h2c} mt-4`}>{t("groupe.origine.titre")}</h2>
          </Reveal>
          <div className="mt-10 space-y-6 text-left">
            {origineParagraphs.map((p, i) => (
              <Reveal key={i}><p className={`${body} max-w-none whitespace-pre-line`}>{p}</p></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Séparateur visuel entre « Notre histoire » et « Notre positionnement » */}
      <Reveal className={wrap}>
        <BentoPhoto photo={photos.pourquoi} className="aspect-[21/9] w-full" />
      </Reveal>

      {/* Pourquoi un fan club 100 % féminin */}
      <section aria-labelledby="pourquoi-titre" className={wrap}>
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <Reveal className="min-w-0">
            <p className="t-eyebrow">{t("groupe.pourquoi.etiquette")}</p>
            <h2 id="pourquoi-titre" className={`${h2c} mt-4`}>{t("groupe.pourquoi.titre")}</h2>
            <p className={`${pullc} mt-8 max-w-[18ch]`}>{t("groupe.pourquoi.accroche")}</p>
          </Reveal>
          <div className="min-w-0 space-y-6">
            {pourquoiParagraphs.map((p, i) => (
              <Reveal key={i}><p className={`${body} whitespace-pre-line`}>{p}</p></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nos valeurs */}
      <section aria-labelledby="valeurs-titre" className={wrap}>
        <Reveal className="max-w-2xl">
          <p className="t-eyebrow">{t("groupe.valeurs.etiquette")}</p>
          <h2 id="valeurs-titre" className={`${h2c} mt-4`}>{t("groupe.valeurs.titre")}</h2>
        </Reveal>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <li key={i} className="min-w-0">
              <Reveal delay={(i % 3) * 0.06} className="h-full">
                <div className={`${card} flex h-full flex-col gap-5 p-7`}>
                  <ValueIcon name={v.icon} />
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
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-stretch md:gap-16">
          <Reveal className="flex min-w-0 flex-col">
            <p className="t-eyebrow">{t("groupe.construire.etiquette")}</p>
            <h2 id="construire-titre" className={`${h2c} mt-4`}>{t("groupe.construire.titre")}</h2>
            {/* Pas de ratio fixe : la photo s'étire exactement à la hauteur des quatre cartes en face, quel que soit l'écran. */}
            <div className="mt-10 hidden min-h-[220px] flex-1 md:block"><BentoPhoto photo={photos.construire} className="h-full w-full" /></div>
          </Reveal>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {build.map((b, i) => {
              const Icon = buildIcons[i] ?? Sparkles;
              return (
                <li key={i} className="min-w-0">
                  <Reveal delay={(i % 2) * 0.06} className="h-full">
                    {/* justify-between : la carte peut être étirée (pour égaler la photo) sans jamais laisser un vide après le texte,
                        l'espace en trop se répartit avant le paragraphe, jamais après. */}
                    <div className={`${card} flex h-full flex-col justify-between gap-6 p-7`}>
                      <div className="flex flex-col gap-4">
                        <Icon aria-hidden className="size-7 text-psg-red-bright" strokeWidth={1.6} />
                        <h3 className="break-words font-display text-[19px] font-semibold uppercase tracking-[0.04em] text-white">{b.title}</h3>
                      </div>
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
