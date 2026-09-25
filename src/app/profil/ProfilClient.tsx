"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Download, ExternalLink, FileText, LogOut, QrCode as QrIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberCard } from "@/components/member/MemberCard";
import { useMemberData } from "@/components/member/useMemberData";
import { Button } from "@/components/ui/Button";
import { benefits } from "@/data/membership";
import { formatEuros } from "@/lib/money";
import { guardianRelations, isMinor } from "@/lib/members";

const dateFr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-40 border-t border-white/10 pt-12">
      <h2 className="t-h2">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

const linkBtn =
  "inline-flex h-[52px] items-center justify-center gap-3 rounded-[10px] border border-white/[0.12] bg-[#121417]/90 px-6 font-body text-[14.5px] font-medium text-white transition-colors hover:border-white/30";

type Tx = { key: string; date: string; label: string; kind: string; status: string; amountCents: number };
const orderStatus = { paid: "Payée", awaiting_payment: "En attente de paiement" } as const;
const regStatus = { paid: "Payée", confirmed: "Confirmée", awaiting_payment: "En attente de paiement" } as const;

function MemberSpace({ welcome }: { welcome: boolean }) {
  const data = useMemberData();
  if (!data) return <p className="mt-8 font-body text-mist">Chargement de votre espace…</p>;
  const { member, verifyUrl, orders, registrations } = data;
  const minor = isMinor(member.birthDate, member.joinedAt.slice(0, 10));
  const tx: Tx[] = [
    ...orders.map((o) => ({ key: o.id, date: o.createdAt, label: o.label, kind: "Boutique", status: orderStatus[o.status], amountCents: o.totalCents })),
    ...registrations.map((r) => ({ key: r.id, date: r.createdAt, label: `${r.title} · ${r.places} place${r.places > 1 ? "s" : ""}`, kind: "Événement", status: regStatus[r.status], amountCents: r.amountCents })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mt-12 space-y-16">
      {welcome && (
        <p role="status" className="flex items-start gap-3 rounded-[12px] border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 font-body text-[14.5px] leading-[1.7] text-emerald-100">
          <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={1.7} />
          Bienvenue chez les Dames du Parc ! Votre compte est créé, votre carte membre et votre attestation PDF sont prêtes.
        </p>
      )}

      <section id="carte" className="scroll-mt-40">
        <h2 className="t-h2">Ma carte membre</h2>
        <div className="mt-10">
          <MemberCard name={`${member.firstName} ${member.lastName}`} season={member.season} number={member.memberNumber} qrValue={verifyUrl} />
        </div>
        <p className="mx-auto mt-8 max-w-md text-center text-mist t-small">
          Le QR code de votre carte ouvre la preuve d&rsquo;adhésion, que les administrateurs peuvent vérifier à tout moment.
        </p>
      </section>

      <Section id="attestation" title="Mon attestation">
        <p className="max-w-xl text-mist t-lead">
          Votre attestation d&rsquo;adhésion {member.season} est générée automatiquement au format PDF, avec votre numéro et son QR code de vérification.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={`/api/attestation/${member.token}`} target="_blank" rel="noreferrer" className="inline-flex h-[52px] items-center justify-center gap-3 rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] px-6 font-body text-[14.5px] font-medium text-white hover:brightness-110">
            <Download aria-hidden className="size-[18px]" strokeWidth={1.8} /> Télécharger mon attestation (PDF)
          </a>
          <Link href={`/verification/${member.token}`} className={linkBtn}>
            <QrIcon aria-hidden className="size-[18px]" strokeWidth={1.7} /> Voir ma preuve d&rsquo;adhésion
          </Link>
        </div>
        {minor && member.guardian && (
          <div className="mt-8 rounded-[12px] border border-white/10 bg-black/20 p-5 font-body text-[14px] leading-[1.7] text-mist">
            <p className="text-white">Autorisation parentale de {member.guardian.firstName} {member.guardian.lastName} ({guardianRelations[member.guardian.relation].toLowerCase()})</p>
            <ul className="mt-3 space-y-2">
              {member.authorizations.map((f) => (
                <li key={f.id}>
                  <a href={`/api/members/${member.token}/autorisation/${f.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                    <FileText aria-hidden className="size-4" strokeWidth={1.7} /> {f.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section id="transactions" title="Mes transactions">
        {tx.length === 0 ? (
          <p className="text-mist t-lead">
            Aucune transaction pour le moment. Vos achats à la <Link href="/boutique" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">boutique</Link> et vos inscriptions aux{" "}
            <Link href="/evenements" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">événements</Link> apparaîtront ici.
          </p>
        ) : (
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {tx.map((t) => (
              <li key={t.key} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-5 font-body">
                <div className="min-w-0">
                  <p className="text-[15px] text-white">{t.label}</p>
                  <p className="mt-1 text-[12.5px] text-mist">{t.kind} · {dateFr(t.date)} · {t.status}</p>
                </div>
                <p className="text-[15px] tabular-nums text-white">{t.amountCents ? formatEuros(t.amountCents) : "Gratuit"}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="avantages" title="Mes avantages">
        <ul className="grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <li key={b.id} className="rounded-[14px] border border-white/10 bg-[#0b1327]/90 p-6">
              <p className="t-eyebrow">{b.kicker}</p>
              <p className="mt-3 font-display text-[30px] font-semibold uppercase tracking-[0.05em] text-white">{b.big}</p>
              <p className="mt-1 font-body text-[14px] text-mist">{b.sub}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 font-body text-[13px] text-mist">Avantages valables jusqu&rsquo;au {dateFr(member.validUntil)}, présentez votre carte pour en bénéficier.</p>
      </Section>

      <Section id="informations" title="Mes informations">
        <dl className="divide-y divide-white/10 border-y border-white/10 font-body">
          {[
            ["Nom", `${member.firstName} ${member.lastName}`],
            ["Numéro de membre", member.memberNumber],
            ["Né(e) le", dateFr(member.birthDate)],
            ["E-mail", member.email],
            ["Téléphone", member.phone],
            ["Adresse", `${member.address.line1}${member.address.line2 ? `, ${member.address.line2}` : ""}, ${member.address.postalCode} ${member.address.city}`],
            ["Adhérent(e) depuis", dateFr(member.joinedAt)],
          ].map(([k, val]) => (
            <div key={k} className="flex justify-between gap-6 py-4">
              <dt className="text-[13px] uppercase tracking-[0.18em] text-mist">{k}</dt>
              <dd className="text-right text-[15px] text-white">{val}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  );
}

interface AdminRow { memberNumber: string; token: string; name: string; email: string; season: string; joinedAt: string; minor: boolean; authorizations: number }

function AdminMembers() {
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/members", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<AdminRow[]>) : []))
      .then((d) => live && setRows(d))
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, []);
  return (
    <Section id="adherentes" title="Adhérentes">
      {rows === null ? (
        <p className="font-body text-mist">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="font-body text-[15px] text-mist">Aucune adhésion enregistrée.</p>
      ) : (
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {rows.map((r) => (
            <li key={r.memberNumber} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 font-body">
              <div className="min-w-0">
                <p className="text-[15px] text-white">{r.name}{r.minor && <span className="ml-3 rounded-full border border-white/20 px-2.5 py-0.5 text-[11.5px] text-white/80">Mineure</span>}</p>
                <p className="mt-1 text-[12.5px] tabular-nums text-mist">{r.memberNumber} · {r.email} · {dateFr(r.joinedAt)}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/verification/${r.token}`} className="inline-flex items-center gap-2 text-[13.5px] text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                  Vérifier <ExternalLink aria-hidden className="size-3.5" />
                </Link>
                <a href={`/api/attestation/${r.token}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13.5px] text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                  PDF <Download aria-hidden className="size-3.5" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function ProfilClient({ welcome }: { welcome: boolean }) {
  const { session, logout } = useAuth();
  return (
    <main className="mx-auto max-w-[860px] px-[var(--gutter)] pb-32 pt-[200px] md:pt-[250px]">
      <p className="t-eyebrow">Espace personnel</p>
      <h1 className="mt-4 t-h1">
        {session.status === "member" || session.status === "admin" ? `Bonjour ${session.firstName}` : "Mon espace"}
      </h1>

      {session.status === "loading" && <p className="mt-8 font-body text-mist">Chargement…</p>}

      {session.status === "anon" && (
        <>
          <p className="mt-6 max-w-md text-mist t-lead">Vous n&rsquo;êtes pas connectée. Connectez-vous pour retrouver votre carte membre, votre attestation et vos transactions.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" href="/connexion">Se connecter</Button>
            <Button size="lg" variant="outline" href="/rejoindre-le-groupe/inscription" arrow={false}>Devenir membre</Button>
          </div>
        </>
      )}

      {session.status === "member" && <MemberSpace welcome={welcome} />}

      {session.status === "admin" && (
        <>
          <p className="mt-6 max-w-lg text-mist t-lead">Espace administrateur : vérifiez les adhésions et consultez les autorisations parentales.</p>
          <div className="mt-12">
            <AdminMembers />
          </div>
        </>
      )}

      {(session.status === "member" || session.status === "admin") && (
        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-10 sm:flex-row">
          <Button size="lg" href="/evenements">Voir les événements</Button>
          <button type="button" onClick={logout} className="inline-flex h-[54px] items-center justify-center gap-3 rounded-[10px] border border-white/[0.12] bg-[#121417]/90 px-7 font-body text-[15.5px] font-medium text-white hover:border-white/30">
            <LogOut aria-hidden className="size-5" strokeWidth={1.7} /> Se déconnecter
          </button>
        </div>
      )}
    </main>
  );
}
