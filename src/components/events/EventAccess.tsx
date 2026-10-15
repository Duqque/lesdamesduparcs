"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { ClientSignupPanel } from "@/components/auth/ClientSignupPanel";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatEuros } from "@/lib/registration";
import type { ClubEvent } from "@/types";
import { AdminRegistrations } from "./AdminRegistrations";
import { RegistrationForm } from "./RegistrationForm";

const banners: Record<string, { text: string; tone: "ok" | "warn" }> = {
  succes: { text: "Paiement reçu, merci ! Votre inscription est confirmée.", tone: "ok" },
  annule: { text: "Le paiement a été annulé. Votre inscription reste en attente : vous pouvez le relancer ci-dessous.", tone: "warn" },
  erreur: { text: "Le paiement n'a pas pu être vérifié. Si vous avez été débitée, contactez-nous.", tone: "warn" },
};

/** Espaces de connexion (membre / administrateur) et inscription d'un événement. */
export function EventAccess({ event }: { event: ClubEvent }) {
  const { session, logout } = useAuth();
  const params = useSearchParams();
  const banner = banners[params.get("paiement") ?? ""];
  const cfg = event.registration;

  return (
    <section id="inscription" aria-labelledby="inscription-title" className="scroll-mt-32 border-t border-white/10 px-[var(--gutter)] py-28 md:py-40">
      <div className="mx-auto max-w-[1100px]">
        <p className="t-eyebrow">Inscription</p>
        <h2 id="inscription-title" className="mt-3 t-h2">
          {session.status === "admin" ? "Espace administrateur" : "Participer à l'événement"}
        </h2>
        <p className="mt-5 max-w-2xl text-white/80 t-lead">
          {session.status === "admin"
            ? "Suivez les inscriptions et les paiements de cet événement."
            : cfg.mode === "closed"
              ? "Cet événement est terminé : les inscriptions sont closes."
              : cfg.mode === "external"
              ? "Les places de cet événement se réservent via la billetterie. Les membres retrouvent ici leur espace personnel."
              : cfg.membersOnly
                ? `La réservation est réservée aux adhérentes des Dames du Parc${cfg.priceCents > 0 ? ` (${formatEuros(cfg.priceCents)} par place)` : ""}.`
                : `Événement ouvert à toutes : connectez-vous ou créez votre compte pour réserver${cfg.priceCents > 0 ? ` (${formatEuros(cfg.priceCents)} par place)` : ""}. Pas besoin d'être adhérente.`}
        </p>

        {banner && (
          <p role="status" className={`mt-8 rounded-[12px] border px-5 py-4 font-body text-[14.5px] ${banner.tone === "ok" ? "border-white/25 bg-white/10 text-white" : "border-psg-red/40 bg-psg-red/10 text-[#ff9aa8]"}`}>
            {banner.text}
          </p>
        )}

        <div className="mt-12">
          {session.status === "loading" && <p className="font-body text-[14px] text-mist">Chargement de votre espace…</p>}

          {session.status === "anon" && <AnonAccess />}

          {(session.status === "member" || session.status === "admin") && (
            <>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <p className="font-body text-[14px] text-mist">
                  Connectée en tant que <span className="font-medium text-white">{session.firstName} {session.lastName}</span> ({session.status === "admin" ? "administrateur" : session.client ? "compte client" : "adhérente"})
                </p>
                <button type="button" onClick={logout} className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/[0.12] bg-[#121417]/90 px-4 font-body text-[13.5px] font-medium text-white hover:border-white/30">
                  <LogOut aria-hidden className="size-4" strokeWidth={1.7} /> Se déconnecter
                </button>
              </div>

              {session.status === "admin" && (
                <>
                  <Link href={`/admin/evenements/${event.id}`} className="mb-6 inline-flex min-h-11 items-center font-body text-[14px] font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                    Gérer cet événement dans l&rsquo;administration
                  </Link>
                  <AdminRegistrations event={event} />
                </>
              )}
              {session.status === "member" &&
                (cfg.mode === "form" ? (
                  <RegistrationForm event={event} member={session} />
                ) : cfg.mode === "closed" ? (
                  <p className="rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-8 text-white/80 t-lead">Cet événement est terminé. Retrouvez les prochains rendez-vous dans le calendrier.</p>
                ) : (
                  <div className="rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-8">
                    <p className="text-white/80 t-lead">Votre carte est vérifiée. Réservez votre place pour cet événement depuis la billetterie.</p>
                    <Link href={event.href} className="mt-6 inline-flex h-12 items-center rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36,#b30d27)] px-6 font-body text-[14.5px] font-medium text-white">
                      Accéder à la billetterie
                    </Link>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/** Visiteuse non connectée : connexion, ou création d'un compte client (sans adhésion). */
function AnonAccess() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,500px)_1fr] lg:gap-20">
      <div>
        <div role="tablist" aria-label="Accès" className="mb-5 grid grid-cols-2 gap-1 rounded-[12px] border border-white/10 bg-[#0b1327]/90 p-1">
          {([["login", "J'ai un compte"], ["signup", "Créer mon compte"]] as const).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-11 rounded-[9px] font-body text-[14px] font-medium transition-colors ${tab === k ? "bg-white text-night-950" : "text-white/75 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
        {tab === "login" ? <LoginPanel /> : <ClientSignupPanel />}
      </div>
      <div className="lg:pt-16">
        <h3 className="font-body text-[18px] font-medium text-white">Comment réserver ?</h3>
        <ul className="mt-5 space-y-4 font-body text-[15px] leading-[1.7] text-mist">
          <li>Les watch parties sont ouvertes à toutes, adhérentes ou non : un compte suffit pour réserver et payer.</li>
          <li>Votre billet (avec son code-barres) vous est envoyé par e-mail et reste disponible dans votre espace.</li>
          <li>Déjà adhérente ? Connectez-vous avec l&rsquo;adresse e-mail de votre adhésion.</li>
        </ul>
        <p className="mt-8 font-body text-[14px] text-mist">
          Envie de rejoindre le groupe ?{" "}
          <Link href="/rejoindre-le-groupe" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
            Découvrir l&rsquo;adhésion
          </Link>
        </p>
      </div>
    </div>
  );
}
