"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthProvider, type Session } from "@/components/auth/AuthProvider";
import { AudioProvider } from "@/components/chants/AudioProvider";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { IntroLoader } from "@/components/intro/IntroLoader";
import { ShopProvider } from "@/components/shop/ShopProvider";
import type { ShopCatalog } from "@/lib/shop";
import { featuredChant } from "@/data/chants";
import { CustomCursor } from "./CustomCursor";

export function Providers({ children, shop, initialSession, initialCapReached }: { children: ReactNode; shop: ShopCatalog; initialSession?: Session; initialCapReached?: boolean }) {
  const admin = usePathname().startsWith("/admin");
  // Éco-conception : les composants « m » (importés sous le nom « motion ») ne chargent que les animations simples
  // (domAnimation) : ni glisser-déposer ni animations de mise en page, inutilisés sur le site.
  if (admin) return <LazyMotion features={domAnimation} strict><MotionConfig reducedMotion="user">{children}</MotionConfig></LazyMotion>;
  return (
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <AuthProvider initial={initialSession} initialCapReached={initialCapReached}>
        <AudioProvider chant={featuredChant}>
          <ShopProvider catalog={shop}>
            <IntroLoader />
            {children}
            <CartDrawer />
            <CustomCursor />
          </ShopProvider>
        </AudioProvider>
      </AuthProvider>
    </MotionConfig>
    </LazyMotion>
  );
}
