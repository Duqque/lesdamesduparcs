"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { AudioProvider } from "@/components/chants/AudioProvider";
import { featuredChant } from "@/data/chants";
import { CustomCursor } from "./CustomCursor";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AudioProvider chant={featuredChant}>
        {children}
        <CustomCursor />
      </AudioProvider>
    </MotionConfig>
  );
}
