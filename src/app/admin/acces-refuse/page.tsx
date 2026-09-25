import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AuthCard } from "@/components/admin/AuthCard";
import { btn } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/admin-auth";

export const metadata = { title: "Accès refusé" };

export default async function ForbiddenPage() {
  await requireAdmin();
  return (
    <AuthCard title="Accès refusé">
      <div className="flex flex-col items-center gap-5 text-center">
        <ShieldAlert aria-hidden className="size-10 text-[#ff8b9b]" strokeWidth={1.4} />
        <p className="font-body text-[14px] leading-[1.7] text-mist">Votre rôle ne donne pas accès à cette section. Contactez la super administratrice si vous en avez besoin.</p>
        <Link href="/admin" className={btn.outline}>Retour au tableau de bord</Link>
      </div>
    </AuthCard>
  );
}
