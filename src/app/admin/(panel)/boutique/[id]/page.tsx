import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Flash, PageHeader, Panel, btn } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { productsDb } from "@/lib/server/shop";
import { deleteProductAction, setProductStatusAction } from "../actions";

export const metadata = { title: "Produit" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("shop.view");
  const { id } = await params;
  const sp = await searchParams;
  const [p, all] = await Promise.all([productsDb.get(id), productsDb.all()]);
  if (!p) notFound();
  const edit = ctx.can("shop.edit");
  return (
    <>
      <PageHeader back={{ href: "/admin/boutique", label: "Produits" }} title={p.name} actions={p.status === "active" && <Link href={`/boutique/${id}`} className={btn.outline}><ExternalLink aria-hidden className="size-4" /> Voir sur le site</Link>} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <ProductForm product={p} categories={[...new Set(all.map((x) => x.category))]} can={{ edit, pricing: ctx.can("shop.pricing"), stock: ctx.can("shop.stock") }} />
      {edit && (
        <Panel className="mt-4" title="Actions rapides">
          <div className="flex flex-wrap gap-2">
            {p.status !== "active" && <form action={setProductStatusAction.bind(null, id, "active")}><SubmitButton>Mettre en vente</SubmitButton></form>}
            {p.status === "active" && <form action={setProductStatusAction.bind(null, id, "draft")}><SubmitButton variant="outline">Retirer de la vente</SubmitButton></form>}
            {p.status !== "archived" && <form action={setProductStatusAction.bind(null, id, "archived")}><SubmitButton variant="outline">Archiver</SubmitButton></form>}
            <form action={deleteProductAction.bind(null, id)}><SubmitButton variant="danger" confirm="Supprimer ce produit ? S'il a déjà été commandé, il sera seulement archivé.">Supprimer</SubmitButton></form>
          </div>
        </Panel>
      )}
    </>
  );
}
