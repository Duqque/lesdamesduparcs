"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AudioProvider } from "@/components/chants/AudioProvider";
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
          <CustomCursor />
        </AudioProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
