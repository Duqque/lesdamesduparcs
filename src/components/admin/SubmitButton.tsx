"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { btn } from "./ui";
import { cn } from "@/lib/cn";

/**
 * Bouton de validation d'un formulaire d'action : désactivé pendant l'envoi. La confirmation facultative s'affiche dans une fenêtre
 * du site (jamais dans la boîte de dialogue native du navigateur) ; une fois validée, le formulaire est envoyé avec ce bouton.
 */
export function SubmitButton({ children, variant = "primary", confirm, className, name, value }: { children: ReactNode; variant?: keyof typeof btn; confirm?: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  const [asking, setAsking] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={ref}
        type="submit"
        name={name}
        value={value}
        disabled={pending}
        onClick={(e) => {
          if (confirm) {
            e.preventDefault();
            setAsking(true);
          }
        }}
        className={cn(btn[variant], className)}
      >
        {pending ? "…" : children}
      </button>
      {asking && confirm && (
        <ConfirmDialog
          message={confirm}
          danger={variant === "danger"}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            const form = ref.current?.form;
            if (form) form.requestSubmit(ref.current);
          }}
        />
      )}
    </>
  );
}
