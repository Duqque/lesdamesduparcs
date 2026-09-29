"use client";

import { MotionConfig } from "framer-motion";
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
  if (admin) return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
  return (
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
  );
}
