"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { AudioProvider } from "@/components/chants/AudioProvider";
import { featuredChant } from "@/data/chants";
import { IntroLoader } from "@/components/intro/IntroLoader";
import { CustomCursor } from "./CustomCursor";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AudioProvider chant={featuredChant}>
        <IntroLoader />
        {children}
        <CustomCursor />
      </AudioProvider>
    </MotionConfig>
  );
}
