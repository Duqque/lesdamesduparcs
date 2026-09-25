"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { LoginPanel } from "@/components/auth/LoginPanel";
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
              : `L'inscription est réservée aux membres des Dames du Parc, sur présentation de leur carte${cfg.priceCents > 0 ? ` (${formatEuros(cfg.priceCents)} par place)` : " (gratuit)"}.`}
        </p>

        {banner && (
          <p role="status" className={`mt-8 rounded-[12px] border px-5 py-4 font-body text-[14.5px] ${banner.tone === "ok" ? "border-white/25 bg-white/10 text-white" : "border-psg-red/40 bg-psg-red/10 text-[#ff9aa8]"}`}>
            {banner.text}
          </p>
        )}

        <div className="mt-12">
          {session.status === "loading" && <p className="font-body text-[14px] text-mist">Chargement de votre espace…</p>}

          {session.status === "anon" && (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-20">
              <LoginPanel />
              <div className="lg:pt-4">
                <h3 className="font-body text-[18px] font-medium text-white">Pourquoi se connecter ?</h3>
                <ul className="mt-5 space-y-4 font-body text-[15px] leading-[1.7] text-mist">
                  <li>Le formulaire d&rsquo;inscription et le paiement sont accessibles uniquement avec une carte de membre valide.</li>
                  <li>Vos informations sont préremplies à partir de votre carte.</li>
                  <li>L&rsquo;équipe organisatrice se connecte via l&rsquo;onglet Administrateur pour suivre les inscriptions.</li>
                </ul>
                <p className="mt-8 font-body text-[14px] text-mist">
                  Pas encore membre ?{" "}
                  <Link href="/rejoindre-le-groupe" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                    Rejoindre le groupe
                  </Link>
                </p>
              </div>
            </div>
          )}

          {(session.status === "member" || session.status === "admin") && (
            <>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <p className="font-body text-[14px] text-mist">
                  Connectée en tant que <span className="font-medium text-white">{session.firstName} {session.lastName}</span> ({session.status === "admin" ? "administrateur" : "membre"})
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
