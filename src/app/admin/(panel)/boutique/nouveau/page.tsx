import { ProductForm } from "@/components/admin/ProductForm";
import { Flash, PageHeader } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { productsDb } from "@/lib/server/shop";

export const metadata = { title: "Nouveau produit" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("shop.edit");
  const sp = await searchParams;
  const cats = [...new Set((await productsDb.all()).map((p) => p.category))];
  return (
    <>
      <PageHeader back={{ href: "/admin/boutique", label: "Produits" }} title="Nouveau produit" subtitle={ctx.can("shop.pricing") ? undefined : "Le produit sera créé en brouillon : une personne autorisée fixera le prix et le mettra en vente."} />
      <Flash error={first(sp.erreur)} />
      <ProductForm categories={cats} can={{ edit: true, pricing: ctx.can("shop.pricing"), stock: ctx.can("shop.stock") }} />
    </>
  );
}
