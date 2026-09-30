import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { LoginForm } from "@/components/admin/AuthForms";
import { getAdmin } from "@/lib/server/admin-auth";

export const metadata = { title: "Connexion" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ reinit?: string }> }) {
  const { reinit } = await searchParams;
  if (await getAdmin()) redirect("/admin");
  return (
    <AuthCard title="Administration" backToSite>
      <LoginForm reinit={reinit === "1"} />
    </AuthCard>
  );
}
