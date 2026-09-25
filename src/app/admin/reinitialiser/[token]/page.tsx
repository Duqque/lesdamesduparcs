import { AuthCard } from "@/components/admin/AuthCard";
import { ResetForm } from "@/components/admin/AuthForms";

export const metadata = { title: "Nouveau mot de passe" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthCard title="Nouveau mot de passe">
      <ResetForm token={token} />
    </AuthCard>
  );
}
