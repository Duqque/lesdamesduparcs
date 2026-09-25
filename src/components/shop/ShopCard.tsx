import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { featuredShop } from "@/data/products";

export function ShopCard({ shop = featuredShop }: { shop?: typeof featuredShop }) {
  return (
    <PhotoCard label={shop.title} icon={ShoppingBag} image={shop.image} sizes="(min-width: 1280px) 19vw, (min-width: 768px) 33vw, 100vw">
      <h3 className="font-body text-[15px] font-semibold leading-tight text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
        {shop.description}
      </h3>
      <p className="mt-3 font-body text-[12px] text-white/85">{shop.tagline}</p>
      <div className="mt-7">
        <Button variant="outline" size="xs" href={shop.href}>
          Découvrir
        </Button>
      </div>
    </PhotoCard>
  );
}
