"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { btn } from "./ui";
import { cn } from "@/lib/cn";

/** Bouton de validation d'un formulaire d'action : désactivé pendant l'envoi, confirmation facultative. */
export function SubmitButton({ children, variant = "primary", confirm, className, name, value }: { children: ReactNode; variant?: keyof typeof btn; confirm?: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(btn[variant], className)}
    >
      {pending ? "…" : children}
    </button>
  );
}
