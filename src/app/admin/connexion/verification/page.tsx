import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { MfaForm } from "@/components/admin/AuthForms";
import { getAdmin } from "@/lib/server/admin-auth";

export const metadata = { title: "Vérification" };

export default async function MfaPage() {
  const ctx = await getAdmin({ allowMfa: true });
  if (!ctx) redirect("/admin/connexion");
  if (ctx.stage === "ok") redirect("/admin");
  return (
    <AuthCard title="Double authentification" subtitle="Saisissez le code de votre application d'authentification.">
      <MfaForm />
    </AuthCard>
  );
}
