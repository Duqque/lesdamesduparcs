"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

/** Champ de mot de passe avec une petite icône pour afficher ou masquer ce que l'on tape. */
export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={show ? "text" : "password"} className={cn(className, "!pr-12")} />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setShow((v) => !v);
        }}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-white/60 hover:text-white"
      >
        {show ? <EyeOff aria-hidden className="size-[18px]" strokeWidth={1.7} /> : <Eye aria-hidden className="size-[18px]" strokeWidth={1.7} />}
      </button>
    </span>
  );
}
