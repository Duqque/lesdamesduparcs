import { cookies } from "next/headers";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Empty, Field, Flash, PageHeader, Panel, TableWrap, Td, Th, inp } from "@/components/admin/ui";
import { fmtDateTime } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { ROLE_LABELS, type Role } from "@/lib/admin/permissions";
import { ensureSuperAdmin, requireAdmin } from "@/lib/server/admin-auth";
import { admins, resetRequests } from "@/lib/server/admin-store";
import { createAdminAction, resetLinkAction, revokeSessionsAction, updateAdminAction } from "../actions";

export const metadata = { title: "Administratrices" };

const roleOptions = (Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>);

export default async function AdminsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("admins.manage");
  await ensureSuperAdmin();
  const sp = await searchParams;
  const secret = (await cookies()).get("ddp_admin_flash")?.value;
  const [list, reqs] = await Promise.all([admins.all(), resetRequests.find((r) => r.status === "open")]);
  return (
    <>
      <PageHeader title="Administratrices" subtitle="Comptes de l'équipe et rôles. Seule la super administratrice gère ces comptes, la structure et le design du site." />
      {secret && <p role="status" className="mb-6 break-all rounded-[10px] border border-amber-400/40 bg-amber-400/10 px-4 py-3 font-body text-[13.5px] text-amber-100">{secret}</p>}
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      {reqs.length > 0 && (
        <Panel className="mb-4" title="Demandes de réinitialisation">
          <ul className="space-y-2 font-body text-[13.5px] text-white/85">{reqs.map((r) => <li key={r.id}>{r.email} · demandé le {fmtDateTime(r.createdAt)}</li>)}</ul>
          <p className="mt-3 font-body text-[12.5px] text-mist">Générez un lien depuis la fiche du compte concerné puis transmettez-le à la personne.</p>
        </Panel>
      )}
      <Panel flush className="mb-4">
        {list.length === 0 ? <Empty>Aucun compte.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Nom</Th><Th>Rôle</Th><Th>Statut</Th><Th>2FA</Th><Th>Dernière connexion</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="align-top">
                  <Td><span className="block font-medium text-white">{a.firstName} {a.lastName}</span><span className="text-[12px] text-mist">{a.email}</span></Td>
                  <Td>{ROLE_LABELS[a.role]}</Td>
                  <Td><Badge tone={a.active ? "green" : "grey"}>{a.active ? "Actif" : "Désactivé"}</Badge></Td>
                  <Td>{a.totpEnabled ? <Badge tone="green">Activée</Badge> : <span className="text-mist">Non</span>}</Td>
                  <Td className="tabular-nums text-[12.5px]">{a.lastLoginAt ? `${fmtDateTime(a.lastLoginAt)}` : "Jamais"}{a.lastLoginIp ? <span className="block text-mist">{a.lastLoginIp}</span> : null}</Td>
                  <Td>
                    <details>
                      <summary className="cursor-pointer font-body text-[12.5px] text-white/80 hover:text-white">Gérer</summary>
                      <form action={updateAdminAction.bind(null, a.id)} className="mt-3 grid w-[min(360px,80vw)] gap-3">
                        <input name="firstName" defaultValue={a.firstName} aria-label="Prénom" className={inp} />
                        <input name="lastName" defaultValue={a.lastName} aria-label="Nom" className={inp} />
                        <select name="role" defaultValue={a.role} className={inp}>{roleOptions}</select>
                        <label className="flex items-center gap-2 font-body text-[13px] text-white/85"><input type="checkbox" name="active" defaultChecked={a.active} className="size-4 accent-[#d90f2c]" /> Compte actif</label>
                        <SubmitButton variant="small">Enregistrer</SubmitButton>
                      </form>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <form action={resetLinkAction.bind(null, a.id)}><SubmitButton variant="small" confirm="Générer un lien de réinitialisation du mot de passe ?">Lien de réinitialisation</SubmitButton></form>
                        <form action={revokeSessionsAction.bind(null, a.id)}><SubmitButton variant="small" confirm="Fermer toutes les sessions de ce compte ?">Fermer les sessions</SubmitButton></form>
                      </div>
                      {a.id === ctx.admin.id && <p className="mt-2 font-body text-[11.5px] text-mist">C&rsquo;est votre compte.</p>}
                    </details>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
      <Panel title="Ajouter une administratrice">
        <form action={createAdminAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom"><input name="firstName" required className={inp} /></Field>
          <Field label="Nom"><input name="lastName" className={inp} /></Field>
          <Field label="Adresse e-mail"><input name="email" type="email" required className={inp} /></Field>
          <Field label="Rôle"><select name="role" defaultValue="admin" className={inp}>{roleOptions}</select></Field>
          <div className="sm:col-span-2"><SubmitButton>Créer le compte</SubmitButton><p className="mt-2 font-body text-[12px] text-mist">Un mot de passe provisoire est généré et affiché une seule fois. La personne le change depuis « Mon compte et sécurité ».</p></div>
        </form>
      </Panel>
    </>
  );
}
