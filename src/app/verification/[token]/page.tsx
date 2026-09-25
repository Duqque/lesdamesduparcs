import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Download, FileText, ShieldAlert } from "lucide-react";
import { settings } from "@/lib/server/admin-store";
import { getAdmin } from "@/lib/server/admin-auth";
import { getMemberByToken, toPublic } from "@/lib/server/store";
import { guardianRelations, isMinor } from "@/lib/members";

export const metadata: Metadata = { title: "Vérification d'adhésion", robots: { index: false, follow: false } };

const dateFr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-4">
      <dt className="text-[13px] uppercase tracking-[0.18em] text-mist">{k}</dt>
      <dd className="text-right text-[15px] text-white">{children}</dd>
    </div>
  );
}

/** Page ouverte par le QR code de la carte : preuve d'adhésion, comme une licence. Détails complets pour les administrateurs connectés. */
export default async function VerificationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [stored, adminCtx, { association }] = await Promise.all([getMemberByToken(token), getAdmin(), settings.get()]);
  if (!stored) notFound();
  const m = toPublic(stored);
  const admin = Boolean(adminCtx?.can("members.pii"));
  const valid = m.validUntil >= new Date().toISOString().slice(0, 10);
  const minor = isMinor(m.birthDate, m.joinedAt.slice(0, 10));

  return (
    <main className="mx-auto max-w-[640px] px-[var(--gutter)] pb-32 pt-[190px] md:pt-[240px]">
      <div className="flex items-center gap-4">
        <Image src="/logos/dames-du-parc-logo.webp" alt="" width={64} height={64} className="size-16 rounded-full" />
        <div>
          <p className="t-eyebrow">Vérification d&rsquo;adhésion</p>
          <p className="mt-1 font-body text-[14px] text-mist">{association.legalName}</p>
        </div>
      </div>

      <div
        role="status"
        className={`mt-10 flex items-center gap-4 rounded-[14px] border px-6 py-5 ${valid ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-100" : "border-psg-red/40 bg-psg-red/10 text-[#ffb4bf]"}`}
      >
        {valid ? <BadgeCheck aria-hidden className="size-8 shrink-0" strokeWidth={1.5} /> : <ShieldAlert aria-hidden className="size-8 shrink-0" strokeWidth={1.5} />}
        <div>
          <p className="font-display text-[26px] font-semibold uppercase tracking-[0.06em]">{valid ? "Adhésion valide" : "Adhésion expirée"}</p>
          <p className="font-body text-[13.5px] opacity-90">Saison {m.season} · {valid ? "valable" : "échue"} jusqu&rsquo;au {dateFr(m.validUntil)}</p>
        </div>
      </div>

      <h1 className="mt-10 t-h1">
        {m.firstName} {m.lastName}
      </h1>

      <dl className="mt-8 divide-y divide-white/10 border-y border-white/10 font-body">
        <Row k="Numéro de membre"><span className="tabular-nums">{m.memberNumber}</span></Row>
        <Row k="Saison">{m.season}</Row>
        <Row k="Adhérent(e) depuis">{dateFr(m.joinedAt)}</Row>
        {admin && (
          <>
            <Row k="Né(e) le">{dateFr(m.birthDate)}{minor && " (mineur(e) à l'inscription)"}</Row>
            <Row k="E-mail">{m.email}</Row>
            <Row k="Téléphone">{m.phone}</Row>
            <Row k="Adresse">{m.address.line1}{m.address.line2 ? `, ${m.address.line2}` : ""}, {m.address.postalCode} {m.address.city}, {m.address.country}</Row>
            {minor && m.guardian && (
              <>
                <Row k="Responsable légal">{m.guardian.firstName} {m.guardian.lastName} ({guardianRelations[m.guardian.relation].toLowerCase()})</Row>
                <Row k="Contact du responsable">{m.guardian.email} · {m.guardian.phone}</Row>
              </>
            )}
          </>
        )}
      </dl>

      {admin ? (
        <div className="mt-8 space-y-4">
          {minor && (
            <div className="rounded-[12px] border border-white/10 bg-black/20 p-5 font-body text-[14px] text-mist">
              <p className="text-white">Autorisation parentale : {m.authorizations.length} document(s)</p>
              <ul className="mt-3 space-y-2">
                {m.authorizations.map((f) => (
                  <li key={f.id}>
                    <a href={`/api/members/${m.token}/autorisation/${f.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                      <FileText aria-hidden className="size-4" strokeWidth={1.7} /> {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <a href={`/api/attestation/${m.token}`} target="_blank" rel="noreferrer" className="inline-flex h-[52px] items-center gap-3 rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] px-6 font-body text-[14.5px] font-medium text-white hover:brightness-110">
            <Download aria-hidden className="size-[18px]" strokeWidth={1.8} /> Attestation PDF
          </a>
        </div>
      ) : (
        <p className="mt-8 text-mist t-small">
          Les informations personnelles complètes et les pièces du dossier sont réservées aux administrateurs de l&rsquo;association.{" "}
          <Link href="/admin/connexion" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Connexion administrateur</Link>
        </p>
      )}

      <p className="mt-12 text-mist/80 t-caption">
        Contrôle effectué le {dateFr(new Date().toISOString())}. {association.legalName} · SIRET {association.siret} (fictif).
      </p>
    </main>
  );
}
