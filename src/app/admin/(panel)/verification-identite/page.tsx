import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin, safeAdminPath } from "@/lib/server/admin-auth";
import { confirmIdentityAction } from "./actions";

export const metadata = { title: "Confirmer votre identité" };

export default async function ConfirmIdentityPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const next = safeAdminPath(first(sp.next));
  return (
    <>
      <PageHeader title="Confirmer votre identité" subtitle="Cette action est sensible : saisissez votre mot de passe et un code de double authentification. La confirmation reste valable 10 minutes." />
      <Flash error={first(sp.erreur)} />
      <Panel title="Vérification">
        <form action={confirmIdentityAction} className="grid max-w-md gap-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Mot de passe"><input type="password" name="password" required autoComplete="current-password" className={inp} /></Field>
          <Field label="Code à 6 chiffres (ou code de secours)"><input name="code" required autoComplete="one-time-code" maxLength={16} className={inp} /></Field>
          <div><SubmitButton>Confirmer</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
