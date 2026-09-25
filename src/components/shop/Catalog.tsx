"use client";

import { useMemo, useState } from "react";
import { useShop } from "./ShopProvider";
import { cn } from "@/lib/cn";
import { ProductCard } from "./ProductCard";

type Sort = "new" | "asc" | "desc";

export function Catalog() {
  const { products, categories: shopCategories } = useShop();
  const [cat, setCat] = useState<string>("Tout");
  const [sort, setSort] = useState<Sort>("new");
  const list = useMemo(() => {
    const l = products.filter((p) => cat === "Tout" || p.category === cat);
    if (sort === "asc") return [...l].sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "desc") return [...l].sort((a, b) => b.priceCents - a.priceCents);
    return [...l].sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
  }, [cat, sort, products]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div role="group" aria-label="Filtrer par catégorie" className="flex flex-wrap gap-2">
          {(["Tout", ...shopCategories] as const).map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={cn("min-h-11 rounded-full border px-5 font-body text-[13.5px] font-medium transition-colors", cat === c ? "border-white bg-white text-night-950" : "border-white/15 bg-white/[0.06] text-white/85 hover:border-white/40")}>
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 font-body text-[13px] text-mist">
          Trier par
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-11 rounded-[10px] border border-white/[0.12] bg-[#0d1220] px-3 text-[13.5px] text-white focus:outline-none">
            <option value="new">Nouveautés</option>
            <option value="asc">Prix croissant</option>
            <option value="desc">Prix décroissant</option>
          </select>
        </label>
      </div>
      <ul className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
