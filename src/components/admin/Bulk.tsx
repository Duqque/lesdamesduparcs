"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Sélection multiple dans les tableaux de l'administration. Les cases à cocher restent dans le tableau (y compris à côté des
 * formulaires de ligne) et sont rattachées au formulaire d'actions groupées par l'attribut HTML `form`.
 */
const boxes = (form: string) => [...document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name=ids][form="${form}"]`)];

/** Case d'une ligne. */
export function BulkCheck({ form, value, label }: { form: string; value: string; label: string }) {
  return <input type="checkbox" name="ids" value={value} form={form} aria-label={`Sélectionner ${label}`} className="size-4 accent-[#d90f2c]" onChange={() => document.dispatchEvent(new Event(`bulk:${form}`))} />;
}

/** Case « tout sélectionner » (lignes affichées). */
export function BulkAll({ form }: { form: string }) {
  const [all, setAll] = useState(false);
  useEffect(() => {
    const sync = () => {
      const b = boxes(form);
      setAll(b.length > 0 && b.every((x) => x.checked));
    };
    document.addEventListener(`bulk:${form}`, sync);
    return () => document.removeEventListener(`bulk:${form}`, sync);
  }, [form]);
  return (
    <input
      type="checkbox"
      aria-label="Tout sélectionner"
      checked={all}
      className="size-4 accent-[#d90f2c]"
      onChange={(e) => {
        for (const b of boxes(form)) b.checked = e.target.checked;
        document.dispatchEvent(new Event(`bulk:${form}`));
      }}
    />
  );
}

/** Barre d'actions groupées : formulaire relié aux cases, avec le nombre de lignes sélectionnées. Rien n'est envoyé sans sélection. */
export function BulkBar({ id, action, children }: { id: string; action: (formData: FormData) => void | Promise<void>; children: ReactNode }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const sync = () => setCount(boxes(id).filter((b) => b.checked).length);
    document.addEventListener(`bulk:${id}`, sync);
    return () => document.removeEventListener(`bulk:${id}`, sync);
  }, [id]);
  return (
    <form id={id} action={action} className="sticky top-2 z-20 mb-4 rounded-[12px] border border-white/10 bg-[#0d1530]/95 p-4 backdrop-blur" hidden={count === 0}>
      <p className="mb-3 font-body text-[13.5px] text-white">
        {count} ligne{count > 1 ? "s" : ""} sélectionnée{count > 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </form>
  );
}
