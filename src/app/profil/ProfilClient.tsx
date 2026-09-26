"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Download, FileText, LogOut, QrCode as QrIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberCard } from "@/components/member/MemberCard";
import { useMemberData } from "@/components/member/useMemberData";
import { Button } from "@/components/ui/Button";
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

const txStatus = { paid: "Payé", pending: "En attente de paiement", failed: "Échoué", refunded: "Remboursé", cancelled: "Annulé" } as const;

function MemberSpace({ welcome }: { welcome: boolean }) {
  const data = useMemberData();
  if (!data) return <p className="mt-8 font-body text-mist">Chargement de votre espace…</p>;
  const { member, verifyUrl, transactions: tx, benefits, offers, membership } = data;
  const minor = isMinor(member.birthDate, member.joinedAt.slice(0, 10));
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
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-5 font-body">
                <div className="min-w-0">
                  <p className="text-[15px] text-white">{t.label}</p>
                  <p className="mt-1 text-[12.5px] text-mist">{t.type} · {dateFr(t.at)} · {txStatus[t.status]}</p>
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
              <p className="font-body text-[16px] font-semibold text-white">{b.title}</p>
              <p className="mt-2 font-body text-[14px] leading-[1.7] text-mist">{b.text}</p>
            </li>
          ))}
          {offers.map((o) => (
            <li key={o.id} className="rounded-[14px] border border-psg-red-bright/30 bg-[#0b1327]/90 p-6">
              <p className="t-eyebrow">{o.partner ?? "Offre partenaire"}</p>
              <p className="mt-3 font-body text-[16px] font-semibold text-white">{o.title}</p>
              <p className="mt-2 font-body text-[14px] leading-[1.7] text-mist">{o.text}</p>
              {o.code && <p className="mt-3 inline-block rounded-[6px] border border-dashed border-white/25 px-2.5 py-1 font-body text-[13px] tracking-[0.1em] text-white">{o.code}</p>}
            </li>
          ))}
        </ul>
        <p className="mt-5 font-body text-[13px] text-mist">Avantages valables jusqu&rsquo;au {dateFr(membership?.endsAt ?? member.validUntil)}, présentez votre carte pour en bénéficier.</p>
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

      <Section id="securite" title="Sécurité du compte">
        <PasswordForm />
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout-all", { method: "POST" });
            window.location.href = "/connexion";
          }}
          className="mt-8 font-body text-[14px] text-mist underline underline-offset-4 hover:text-white"
        >
          Me déconnecter de tous mes appareils
        </button>
        <p className="mt-6 font-body text-[14px] text-mist">
          Vos droits sur vos données (télécharger, corriger, supprimer votre compte) : <Link href="/mes-donnees" className="text-white underline underline-offset-4">Mes données</Link>.
        </p>
      </Section>
    </div>
  );
}

function PasswordForm() {
  const [state, setState] = useState<{ ok?: boolean; msg?: string; busy?: boolean }>({});
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("next") !== f.get("confirm")) return setState({ msg: "Les mots de passe ne correspondent pas." });
    setState({ busy: true });
    const res = await fetch("/api/members/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: f.get("current"), next: f.get("next") }) });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      form.reset();
      setState({ ok: true, msg: "Mot de passe modifié. Vos autres appareils ont été déconnectés." });
    } else setState({ msg: data.error ?? "Modification impossible." });
  }
  const field = "mt-1.5 h-12 w-full rounded-[10px] border border-white/[0.14] bg-white/[0.04] px-4 font-body text-[15px] text-white outline-none focus:border-white/40";
  return (
    <form onSubmit={submit} className="mt-6 grid max-w-md gap-4 font-body">
      <label className="text-[13px] text-mist">Mot de passe actuel<input name="current" type="password" required autoComplete="current-password" className={field} /></label>
      <label className="text-[13px] text-mist">Nouveau mot de passe (10 caractères minimum, lettres et chiffres)<input name="next" type="password" required minLength={10} autoComplete="new-password" className={field} /></label>
      <label className="text-[13px] text-mist">Confirmer<input name="confirm" type="password" required autoComplete="new-password" className={field} /></label>
      {state.msg && <p role="status" className={state.ok ? "text-[14px] text-emerald-300" : "text-[14px] text-psg-red-bright"}>{state.msg}</p>}
      <div><button type="submit" disabled={state.busy} className="inline-flex h-12 items-center rounded-[10px] border border-white/[0.14] px-6 text-[14.5px] font-medium text-white hover:border-white/35 disabled:opacity-60">Changer le mot de passe</button></div>
    </form>
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
          <p className="mt-6 max-w-lg text-mist t-lead">Vous êtes connectée à l&rsquo;administration. La gestion des adhérentes, des événements et des finances se fait dans le back-office.</p>
          <div className="mt-8">
            <Button size="lg" href="/admin">Ouvrir l&rsquo;administration</Button>
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
