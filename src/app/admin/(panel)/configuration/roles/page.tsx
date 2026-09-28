import { Check } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, TableWrap, Td, Th, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { PERMISSIONS, PERMISSION_LABELS, ROLE_DESCRIPTIONS, ROLE_LABELS, SUPER_ONLY, effectivePermissions, type Role } from "@/lib/admin/permissions";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { resetRolePermissionsAction, saveRolePermissionsAction, saveSecurityAction } from "../actions";

export const metadata = { title: "Rôles et permissions" };

export default async function RolesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("admins.manage");
  const isSuper = ctx.admin.role === "super";
  const sp = await searchParams;
  const { security, rolePermissions: custom } = await settings.get();
  const roles = Object.keys(ROLE_LABELS) as Role[];
  return (
    <>
      <PageHeader title="Rôles et permissions" subtitle="Chaque rôle a ses propres permissions. Le design et la structure du site restent réservés à la super administratrice." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {roles.map((r) => <div key={r} className="rounded-[12px] border border-line bg-night-900/85 p-4"><p className="font-body text-[14px] font-semibold text-white">{ROLE_LABELS[r]}</p><p className="mt-2 font-body text-[12.5px] leading-[1.6] text-mist">{ROLE_DESCRIPTIONS[r]}</p></div>)}
      </div>
      <Panel flush className="mb-4">
        <form action={saveRolePermissionsAction}>
          <TableWrap>
            <thead><tr><Th>Permission</Th>{roles.map((r) => <Th key={r} className="text-center">{ROLE_LABELS[r]}</Th>)}</tr></thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p}>
                  <Td>{PERMISSION_LABELS[p]}{SUPER_ONLY.includes(p) && <span className="ml-2 text-[11.5px] text-psg-red-bright">super uniquement</span>}</Td>
                  {roles.map((r) => {
                    const on = effectivePermissions(r, custom).has(p);
                    const locked = r === "super" || SUPER_ONLY.includes(p) || !isSuper;
                    return (
                      <Td key={r} className="text-center">
                        {locked ? (on ? <Check aria-label="Autorisé" className="mx-auto size-4 text-emerald-300" /> : <span className="text-white/25">·</span>) : <input type="checkbox" name={`${r}:${p}`} defaultChecked={on} aria-label={`${ROLE_LABELS[r]} : ${PERMISSION_LABELS[p]}`} className="size-4 accent-[#d90f2c]" />}
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {isSuper ? (
            <div className="flex flex-wrap items-center gap-3 border-t border-line p-5">
              <SubmitButton confirm="Enregistrer ces permissions ? Elles s'appliquent immédiatement à toutes les administratrices concernées.">Enregistrer les permissions</SubmitButton>
              <span className="font-body text-[12.5px] text-mist">Vous pouvez adapter chaque rôle. La structure du site et la gestion des administratrices restent réservées à la super administratrice.</span>
            </div>
          ) : <p className="border-t border-line p-5 font-body text-[13px] text-mist">Seule la super administratrice peut modifier les permissions.</p>}
        </form>
        {isSuper && Object.keys(custom).length > 0 && <form action={resetRolePermissionsAction} className="border-t border-line p-5"><SubmitButton variant="outline" confirm="Rétablir les permissions d'origine de tous les rôles ?">Rétablir les valeurs d&rsquo;origine</SubmitButton></form>}
      </Panel>
      <Panel title="Sécurité des connexions">
        <form action={saveSecurityAction} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="Expiration par inactivité (min)"><input name="timeout" type="number" min={5} max={480} defaultValue={security.sessionTimeoutMin} className={inp} /></Field>
          <Field label="Tentatives avant blocage"><input name="attempts" type="number" min={3} max={20} defaultValue={security.maxAttempts} className={inp} /></Field>
          <Field label="Durée du blocage (min)"><input name="lockout" type="number" min={1} max={240} defaultValue={security.lockoutMin} className={inp} /></Field>
          <label className="flex items-end gap-2 pb-2.5 font-body text-[13px] text-white/85"><input type="checkbox" name="require2fa" defaultChecked={security.require2fa !== false} className="size-4 accent-[#d90f2c]" /> 2FA obligatoire (toutes les administratrices)</label>
          <div className="sm:col-span-4"><SubmitButton>Enregistrer</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
