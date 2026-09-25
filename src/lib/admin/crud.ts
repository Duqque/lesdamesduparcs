import "server-only";
import { benefitsDb, offersDb, partnersDb, promoCodes } from "@/lib/server/content";
import type { Permission } from "./permissions";

export type FieldType = "text" | "textarea" | "date" | "number" | "money" | "checkbox" | "select" | "url";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: Array<[string, string]>;
  required?: boolean;
  full?: boolean;
  hint?: string;
}

export interface KindDef {
  title: string;
  singular: string;
  perm: Permission;
  intro: string;
  columns: Array<{ label: string; value: (row: Record<string, unknown>) => string }>;
  fields: FieldDef[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coll: any;
}

const yesNo = (v: unknown) => (v ? "Oui" : "Non");

export const KINDS: Record<string, KindDef> = {
  avantages: {
    title: "Avantages", singular: "avantage", perm: "community.edit", coll: benefitsDb,
    intro: "Les avantages accordés aux adhérentes. Ils s'affichent dans leur espace membre.",
    columns: [{ label: "Avantage", value: (r) => String(r.title) }, { label: "Ordre", value: (r) => String(r.order) }, { label: "Visible", value: (r) => yesNo(r.visible) }],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true, full: true },
      { name: "text", label: "Description", type: "textarea", full: true },
      { name: "order", label: "Ordre d'affichage", type: "number" },
      { name: "visible", label: "Visible par les adhérentes", type: "checkbox" },
    ],
  },
  partenaires: {
    title: "Partenaires", singular: "partenaire", perm: "community.edit", coll: partnersDb,
    intro: "Marques, commerces et lieux partenaires. Leur avantage s'affiche dans l'espace membre des adhérentes.",
    columns: [{ label: "Partenaire", value: (r) => String(r.name) }, { label: "Catégorie", value: (r) => String(r.category ?? "") }, { label: "Avantage", value: (r) => String(r.advantage ?? "") }, { label: "Visible", value: (r) => yesNo(r.visible) }],
    fields: [
      { name: "name", label: "Nom", type: "text", required: true },
      { name: "category", label: "Catégorie", type: "text" },
      { name: "description", label: "Description", type: "textarea", full: true },
      { name: "advantage", label: "Avantage proposé aux membres", type: "text", full: true },
      { name: "promoCode", label: "Code promo", type: "text" },
      { name: "website", label: "Site internet", type: "url" },
      { name: "address", label: "Adresse", type: "text" },
      { name: "contact", label: "Contact", type: "text" },
      { name: "logo", label: "Logo (adresse)", type: "text" },
      { name: "startsAt", label: "Début", type: "date" },
      { name: "endsAt", label: "Fin", type: "date" },
      { name: "visible", label: "Visible", type: "checkbox" },
    ],
  },
  offres: {
    title: "Offres", singular: "offre", perm: "community.edit", coll: offersDb,
    intro: "Offres ponctuelles réservées aux membres.",
    columns: [{ label: "Offre", value: (r) => String(r.title) }, { label: "Membres seulement", value: (r) => yesNo(r.membersOnly) }, { label: "Fin", value: (r) => String(r.endsAt ?? "") }, { label: "Visible", value: (r) => yesNo(r.visible) }],
    fields: [
      { name: "title", label: "Titre", type: "text", required: true, full: true },
      { name: "text", label: "Description", type: "textarea", full: true },
      { name: "startsAt", label: "Début", type: "date" },
      { name: "endsAt", label: "Fin", type: "date" },
      { name: "membersOnly", label: "Réservée aux membres", type: "checkbox" },
      { name: "visible", label: "Visible", type: "checkbox" },
    ],
  },
  "codes-promo": {
    title: "Codes promotionnels", singular: "code promotionnel", perm: "community.edit", coll: promoCodes,
    intro: "Codes de réduction. Ils sont enregistrés et suivis ici ; leur application automatique au paiement viendra avec la prochaine étape du parcours de commande.",
    columns: [{ label: "Code", value: (r) => String(r.code) }, { label: "Réduction", value: (r) => (r.type === "percent" ? `${r.value} %` : `${Number(r.value) / 100} €`) }, { label: "Utilisations", value: (r) => `${r.uses ?? 0}${r.maxUses ? ` / ${r.maxUses}` : ""}` }, { label: "Actif", value: (r) => yesNo(r.active) }],
    fields: [
      { name: "code", label: "Code", type: "text", required: true },
      { name: "label", label: "Libellé", type: "text" },
      { name: "type", label: "Type", type: "select", options: [["percent", "Pourcentage"], ["amount", "Montant fixe"]] },
      { name: "value", label: "Valeur (% ou €)", type: "money", required: true, hint: "Pour un pourcentage, écrivez 10 pour 10 %." },
      { name: "scope", label: "S'applique à", type: "select", options: [["all", "Tout"], ["adhesion", "Adhésion"], ["event", "Événements"], ["shop", "Boutique"]] },
      { name: "maxUses", label: "Utilisations maximum", type: "number" },
      { name: "startsAt", label: "Début", type: "date" },
      { name: "endsAt", label: "Fin", type: "date" },
      { name: "active", label: "Actif", type: "checkbox" },
    ],
  },
};

/** Convertit un formulaire en objet prêt à stocker, selon la définition des champs. */
export function parseFields(def: KindDef, f: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const type = String(f.get("type") ?? "");
  for (const fld of def.fields) {
    const raw = f.get(fld.name);
    const v = typeof raw === "string" ? raw.trim() : "";
    if (fld.type === "checkbox") out[fld.name] = raw === "on";
    else if (fld.type === "number") out[fld.name] = v ? Number(v) : undefined;
    else if (fld.type === "money") {
      const n = parseFloat(v.replace(",", "."));
      out[fld.name] = Number.isFinite(n) ? (type === "percent" ? Math.round(n) : Math.round(n * 100)) : 0;
    } else out[fld.name] = v || undefined;
  }
  if (typeof out.code === "string") out.code = out.code.toUpperCase().replace(/\s+/g, "");
  return out;
}
