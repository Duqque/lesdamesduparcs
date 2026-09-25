import { AuthCard } from "@/components/admin/AuthCard";
import { ForgotForm } from "@/components/admin/AuthForms";

export const metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  return (
    <AuthCard title="Mot de passe oublié" subtitle="Indiquez votre adresse e-mail : la super administratrice vous enverra un lien.">
      <ForgotForm />
    </AuthCard>
  );
}
