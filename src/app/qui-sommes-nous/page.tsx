import type { Metadata } from "next";
import { seoFor } from "@/lib/server/site";
import { getGroupPhotos } from "@/lib/server/site";
import { getCms } from "@/lib/server/cms";
import { GroupHero } from "@/components/group/GroupHero";
import { QuiSommesNousBody } from "@/components/group/QuiSommesNousBody";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { JoinGate } from "@/components/member/JoinGate";
import { cmsDefault } from "@/data/cms-fields";

export async function generateMetadata(): Promise<Metadata> {
  return seoFor("/qui-sommes-nous", {
    title: "Qui sommes-nous",
    description: "Les Dames du Parc, première communauté 100 % féminine de supportrices du Paris Saint-Germain : notre histoire, nos 15 fondatrices, pourquoi un fan club féminin, nos valeurs et ce que nous voulons construire.",
  });
}

export default async function GroupPage() {
  const [photos, cms] = await Promise.all([getGroupPhotos(), getCms()]);
  const t = (key: string) => cms.t(key, cmsDefault(key));
  return (
    <main className="overflow-x-clip">
      <GroupHero eyebrow={t("groupe.hero.etiquette")} title={t("groupe.titre")} intro={t("groupe.intro")} button={t("groupe.bouton")} joinButton={t("groupe.hero.bouton2")} image={photos.hero.src} imageAlt={photos.hero.alt} />

      <div className="py-24 md:py-32">
        <QuiSommesNousBody photos={photos} cms={cms} />
      </div>

      <section aria-labelledby="rejoindre" className="relative isolate overflow-hidden px-[var(--gutter)] py-28 text-center md:py-40">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgba(217,15,44,0.18),transparent_70%)]" />
        <Reveal className="mx-auto max-w-2xl">
          <h2 id="rejoindre" className="break-words text-balance font-display text-[clamp(30px,4.4vw,56px)] font-semibold uppercase leading-[1.04] tracking-[0.04em] text-white">{t("groupe.rejoindre.titre")}</h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <JoinGate><Button size="lg" href="/rejoindre-le-groupe">{t("groupe.rejoindre.bouton1")}</Button></JoinGate>
            <Button size="lg" variant="outline" href="/rejoindre-le-groupe/adhesion">{t("groupe.rejoindre.bouton2")}</Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
