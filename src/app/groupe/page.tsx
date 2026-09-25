import type { Metadata } from "next";
import Image from "next/image";
import { GroupHero } from "@/components/group/GroupHero";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { groupSeason, groupValues } from "@/data/group";

export const metadata: Metadata = {
  title: "Le groupe",
  description:
    "Les Dames du Parc, association de supportrices du Paris Saint-Germain : une voix de femmes dans les tribunes parisiennes, au Parc des Princes et partout ailleurs.",
};

const label = "font-body text-[12px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright";
const h2 = "mt-4 font-display text-[clamp(30px,4.4vw,60px)] font-semibold uppercase leading-[1.02] tracking-[0.05em] text-white";
const body = "font-body text-[16px] leading-[1.8] text-white/80 md:text-[17px]";

export default function GroupPage() {
  return (
    <main>
      <GroupHero />

      <section aria-labelledby="qui" className="mx-auto max-w-[1200px] px-[var(--gutter)] py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <Reveal>
            <p className={label}>Qui sommes-nous</p>
            <h2 id="qui" className={h2}>
              Une voix de femmes dans les tribunes parisiennes
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="space-y-5">
            <p className={body}>
              Les Dames du Parc forment une association de supportrices unies par l&rsquo;amour du Paris Saint-Germain. Leur ambition est simple : faire entendre la voix
              des femmes dans les tribunes et offrir à chacune un lieu où vibrer sans retenue.
            </p>
            <p className={body}>
              Ici, on ne se contente pas de regarder le match. On se retrouve avant le coup d&rsquo;envoi, on chante à pleins poumons, on partage les joies comme les
              déceptions, puis on prolonge la soirée bien après le coup de sifflet final.
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="psg" className="mx-auto max-w-[1300px] px-[var(--gutter)] pb-16 md:pb-24">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <Reveal>
            <div className="relative aspect-[3/2] overflow-hidden rounded-[8px] border border-line shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]" data-cursor="view">
              <Image
                src="/images/supportrices-parc-des-princes.webp"
                alt="Des supporters du Paris Saint-Germain chantant dans les gradins, drapeaux et écharpes aux couleurs du club"
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(3,9,25,0.55))]" />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="space-y-5">
            <p className={label}>Le Paris Saint-Germain</p>
            <h2 id="psg" className={h2}>
              Le PSG, notre boussole
            </h2>
            <p className={body}>
              Tout part du Paris Saint-Germain et tout y revient. Le rouge et le bleu, l&rsquo;écusson brodé sur les écharpes, le grondement du Parc des Princes les soirs de
              grande affiche : voilà ce qui nous rassemble.
            </p>
            <p className={body}>
              Nous accompagnons l&rsquo;équipe dans la victoire comme dans l&rsquo;adversité, convaincues que Paris se soutient jusqu&rsquo;au dernier souffle. Et quand le
              club soulève un nouveau trophée, c&rsquo;est un bonheur immense que nous savourons côte à côte.
            </p>
            <p className={body}>Portées par cet attachement, nous défendons un supportérisme exigeant, chaleureux et résolument parisien.</p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="valeurs" className="mx-auto max-w-[1300px] px-[var(--gutter)] pb-16 md:pb-24">
        <Reveal>
          <p className={label}>Nos valeurs</p>
          <h2 id="valeurs" className={h2}>
            Ce qui nous anime
          </h2>
        </Reveal>
        <ul className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {groupValues.map((v, i) => (
            <li key={v.id}>
              <Reveal delay={i * 0.06} className="h-full">
                <div className="h-full rounded-[8px] border border-line bg-night-900/85 p-6">
                  <span aria-hidden className="block h-[2px] w-8 bg-psg-red" />
                  <h3 className="mt-5 font-display text-[26px] font-semibold uppercase tracking-[0.08em] text-white">{v.title}</h3>
                  <p className="mt-3 font-body text-[14.5px] leading-[1.7] text-mist">{v.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="saison" className="mx-auto max-w-[1200px] px-[var(--gutter)] pb-16 md:pb-24">
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <Reveal>
            <p className={label}>Au fil de la saison</p>
            <h2 id="saison" className={h2}>
              Des rendez-vous à ne pas manquer
            </h2>
          </Reveal>
          <ol className="divide-y divide-white/10 border-y border-white/10">
            {groupSeason.map((s, i) => (
              <li key={s.id}>
                <Reveal delay={i * 0.05} className="grid grid-cols-[auto_1fr] gap-5 py-6 md:gap-8">
                  <span className="font-display text-[34px] font-semibold leading-none tabular-nums text-psg-red-bright">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <h3 className="font-body text-[17px] font-semibold text-white">{s.title}</h3>
                    <p className="mt-2 font-body text-[15px] leading-[1.75] text-mist">{s.text}</p>
                  </span>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="rejoindre" className="relative isolate overflow-hidden px-[var(--gutter)] py-20 text-center md:py-28">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgba(217,15,44,0.18),transparent_70%)]" />
        <Reveal className="mx-auto max-w-2xl">
          <p className="font-script text-[clamp(30px,4.6vw,56px)] italic leading-tight text-white">On ne choisit pas le PSG, le PSG nous choisit.</p>
          <h2 id="rejoindre" className="mt-8 font-display text-[clamp(28px,4vw,52px)] font-semibold uppercase tracking-[0.06em] text-white">
            Prête à rejoindre la famille ?
          </h2>
          <p className="mx-auto mt-4 max-w-md font-body text-[16px] leading-[1.7] text-white/80">
            Devenez membre et vivez la saison à nos côtés, du premier au dernier coup de sifflet.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" href="/abonnement">
              Devenir membre
            </Button>
            <Button size="lg" variant="outline" href="/">
              Retour à l&rsquo;accueil
            </Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
