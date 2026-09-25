"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AudioProvider } from "@/components/chants/AudioProvider";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { IntroLoader } from "@/components/intro/IntroLoader";
import { featuredChant } from "@/data/chants";
import { CustomCursor } from "./CustomCursor";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <AudioProvider chant={featuredChant}>
          <IntroLoader />
          {children}
          <CartDrawer />
          <CustomCursor />
        </AudioProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
