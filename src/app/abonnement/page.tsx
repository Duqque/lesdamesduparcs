import type { Metadata } from "next";
import { Gift, ShoppingBag, Sparkles, Ticket } from "lucide-react";
import { MembershipCard } from "@/components/membership/MembershipCard";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { currentMember } from "@/data/members";
import { membershipBenefits } from "@/data/membership";

export const metadata: Metadata = {
  title: "Abonnement",
  description: "La carte membre des Dames du Parc : billets prioritaires, événements et avantages exclusifs.",
};

const icons = { tickets: Ticket, events: Sparkles, benefits: Gift, shop: ShoppingBag } as const;

export default function AbonnementPage() {
  const number = currentMember.membership.memberNumber.replace(/^DDP-/, "").replace("-", " ");
  return (
    <main className="overflow-x-clip">
      <section className="relative isolate px-[var(--gutter)] pb-20 pt-[110px] md:pb-28 md:pt-[130px]">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_48%,rgba(30,58,120,0.38),transparent_70%)]" />
        <div className="mx-auto max-w-[1100px] text-center">
          <p className="font-body text-[12px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright">Abonnement</p>
          <h1 className="mt-4 font-display text-[clamp(38px,6vw,84px)] font-semibold uppercase leading-none tracking-[0.07em] text-white">Ta carte membre</h1>
          <p className="mx-auto mt-5 max-w-lg font-body text-[15px] leading-relaxed text-mist md:text-[16px]">
            Un objet à ton nom, qui t&rsquo;ouvre les portes du groupe. Survole-la pour la faire vivre, touche-la pour la retourner.
          </p>
        </div>
        <div className="mt-14 md:mt-20">
          <MembershipCard memberNumber={number} />
        </div>
      </section>

      <section aria-labelledby="benefits-title" className="mx-auto max-w-[1200px] px-[var(--gutter)] pb-24">
        <h2 id="benefits-title" className="font-display text-[clamp(28px,3.4vw,44px)] font-semibold uppercase tracking-[0.07em] text-white">
          Ce que t&rsquo;offre la carte
        </h2>
        <ul className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {membershipBenefits.map((b, i) => {
            const Icon = icons[b.id];
            return (
              <li key={b.id}>
                <Reveal delay={i * 0.06} className="h-full">
                  <div className="h-full rounded-[6px] border border-line bg-night-900/85 p-5">
                    <Icon aria-hidden className="size-6 text-psg-red-bright" strokeWidth={1.6} />
                    <h3 className="mt-4 font-body text-[15px] font-semibold text-white">{b.title}</h3>
                    <p className="mt-2 font-body text-[13.5px] leading-relaxed text-mist">{b.text}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Button size="lg" href="/communaute">
            Rejoindre le groupe
          </Button>
          <p className="font-body text-[13px] text-mist">Tarifs et modalités d&rsquo;adhésion : bientôt disponibles.</p>
        </div>
      </section>
    </main>
  );
}
