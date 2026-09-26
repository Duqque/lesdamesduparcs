import Link from "next/link";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Empty, Field, Flash, Kpi, PageHeader, Panel, TableWrap, Td, Th, inp } from "@/components/admin/ui";
import { fmtDate } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { PRIVACY_STATUS_LABEL, PRIVACY_TYPE_LABEL, findPerson, inactiveMembers, privacyRequests } from "@/lib/server/privacy";
import { eraseInactiveAction, erasePersonAction, executeErasureRequestAction, setRequestStatusAction } from "./actions";

export const metadata = { title: "RGPD et données personnelles" };

export default async function PrivacyAdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("privacy.manage");
  const sp = await searchParams;
  const q = first(sp.q) ?? "";
  const months = (await settings.get()).retention?.inactiveMonths ?? 36;
  const [requests, inactive, person] = await Promise.all([privacyRequests.all(), inactiveMembers(months), q ? findPerson(q) : Promise.resolve(null)]);
  const sorted = [...requests].sort((a, b) => (a.status === "done" || a.status === "refused" ? 1 : 0) - (b.status === "done" || b.status === "refused" ? 1 : 0) || a.dueAt.localeCompare(b.dueAt));
  const open = requests.filter((r) => r.status === "received" || r.status === "in_progress");
  const late = open.filter((r) => new Date(r.dueAt).getTime() < Date.now());
  const tone = (s: keyof typeof PRIVACY_STATUS_LABEL) => (s === "done" ? "green" : s === "refused" ? "red" : s === "in_progress" ? "blue" : "orange");
  return (
    <>
      <PageHeader
        title="RGPD et données personnelles"
        subtitle="Demandes d'exercice de droits, effacement direct des données d'une personne et limitation de la conservation. Chaque effacement est journalisé et exige une confirmation d'identité."
        actions={<Link href="/admin/rgpd/registre" className="inline-flex h-10 items-center rounded-[10px] border border-white/20 px-4 font-body text-[13.5px] text-white hover:border-white/45">Registre des traitements</Link>}
      />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Kpi label="Demandes à traiter" value={open.length} tone={open.length ? "orange" : undefined} />
        <Kpi label="Hors délai (1 mois)" value={late.length} tone={late.length ? "red" : "green"} />
        <Kpi label={`Inactives depuis ${months} mois`} value={inactive.length} hint="candidates à l'effacement" />
      </div>

      <Panel title="Demandes reçues" className="mb-4" flush>
        {sorted.length === 0 ? <Empty>Aucune demande. Les personnes en déposent depuis la page publique « Mes données ».</Empty> : (
          <TableWrap>
            <thead><tr><Th>Reçue</Th><Th>Personne</Th><Th>Demande</Th><Th>Échéance</Th><Th>Statut</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {sorted.map((r) => {
                const overdue = (r.status === "received" || r.status === "in_progress") && new Date(r.dueAt).getTime() < Date.now();
                return (
                  <tr key={r.id} className="align-top">
                    <Td className="tabular-nums">{fmtDate(r.createdAt)}</Td>
                    <Td><span className="block font-medium text-white">{r.name}</span><span className="text-[12px] text-mist">{r.email}</span>{!r.verified && <span className="mt-1 block"><Badge tone="orange">E-mail non confirmé</Badge></span>}</Td>
                    <Td className="max-w-[280px]"><span className="block text-white">{PRIVACY_TYPE_LABEL[r.type]}</span>{r.message && <span className="block text-[12px] text-mist">{r.message.slice(0, 200)}</span>}{r.note && <span className="mt-1 block text-[12px] text-emerald-300">{r.note}</span>}</Td>
                    <Td className={`tabular-nums ${overdue ? "text-psg-red-bright" : ""}`}>{fmtDate(r.dueAt)}{overdue && <span className="block text-[11.5px]">En retard</span>}</Td>
                    <Td><Badge tone={tone(r.status)}>{PRIVACY_STATUS_LABEL[r.status]}</Badge></Td>
                    <Td>
                      {(r.status === "received" || r.status === "in_progress") ? (
                        <div className="flex flex-wrap gap-2">
                          {r.type === "effacement" && <form action={executeErasureRequestAction.bind(null, r.id)}><SubmitButton variant="danger" confirm="Effacer définitivement les données liées à cette adresse ? Cette action est irréversible.">Exécuter l&rsquo;effacement</SubmitButton></form>}
                          {r.status === "received" && <form action={setRequestStatusAction.bind(null, r.id, "in_progress")}><SubmitButton variant="small">Prendre en charge</SubmitButton></form>}
                          <form action={setRequestStatusAction.bind(null, r.id, "done")} className="flex items-center gap-2"><input name="note" placeholder="Note (facultatif)" className={inp + " h-8 w-[150px] text-[12.5px]"} /><SubmitButton variant="small">Clôturer</SubmitButton></form>
                          <form action={setRequestStatusAction.bind(null, r.id, "refused")}><SubmitButton variant="outline" confirm="Refuser cette demande ? Pensez à en informer la personne et à motiver le refus.">Refuser</SubmitButton></form>
                        </div>
                      ) : <span className="text-[12px] text-mist">{r.handledBy ? `Par ${r.handledBy}` : ""}</span>}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title="Rechercher et effacer les données d'une personne" className="mb-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <Field label="Adresse e-mail ou numéro de membre" className="min-w-[260px] flex-1"><input name="q" defaultValue={q} required minLength={3} autoComplete="off" className={inp} /></Field>
          <SubmitButton variant="outline">Rechercher</SubmitButton>
        </form>
        {q && (
          <div className="mt-6 border-t border-line pt-5">
            {!person || (!person.member && person.registrations + person.orders + person.payments + person.emails === 0) ? (
              <p className="font-body text-[13.5px] text-mist">Aucune donnée trouvée pour « {q} ».</p>
            ) : (
              <div className="grid gap-4">
                <ul className="font-body text-[13.5px] text-white/85">
                  {person.member && <li>Fiche adhérente : <strong className="text-white">{person.member.firstName} {person.member.lastName}</strong> ({person.member.memberNumber}) · <Link href={`/admin/adherentes/${person.member.id}`} className="underline">ouvrir la fiche</Link> · <a href={`/admin/export/membre/${person.member.id}`} className="underline">exporter ses données (JSON)</a></li>}
                  <li>{person.registrations} inscription(s) à des événements · {person.orders} commande(s) · {person.payments} paiement(s) manuel(s) · {person.emails} e-mail(s) dans le journal</li>
                </ul>
                <form action={erasePersonAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="q" value={q} />
                  <Field label="Tapez EFFACER pour confirmer" className="w-[220px]"><input name="confirm" required autoComplete="off" className={inp} /></Field>
                  <SubmitButton variant="danger" confirm="Effacer définitivement toutes les données personnelles de cette personne ? Les pièces comptables sont conservées sans lien avec elle.">Effacer ses données</SubmitButton>
                </form>
              </div>
            )}
          </div>
        )}
      </Panel>

      <Panel title={`Adhérentes inactives depuis plus de ${months} mois`} flush>
        {inactive.length === 0 ? <Empty>Aucune adhérente concernée. La durée se règle dans la configuration (rétention).</Empty> : (
          <TableWrap>
            <thead><tr><Th>Adhérente</Th><Th>Dernière adhésion</Th><Th>Action</Th></tr></thead>
            <tbody>
              {inactive.slice(0, 100).map(({ member, lastActivity }) => (
                <tr key={member.id}>
                  <Td><Link href={`/admin/adherentes/${member.id}`} className="font-medium text-white underline-offset-4 hover:underline">{member.firstName} {member.lastName}</Link><span className="block text-[12px] text-mist">{member.memberNumber}</span></Td>
                  <Td className="tabular-nums">{fmtDate(new Date(lastActivity).toISOString())}</Td>
                  <Td><form action={eraseInactiveAction.bind(null, member.id)}><SubmitButton variant="danger" confirm={`Effacer définitivement les données de ${member.firstName} ${member.lastName} ?`}>Effacer</SubmitButton></form></Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
