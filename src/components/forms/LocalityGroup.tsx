"use client";

import { useState } from "react";
import { LocalityFields, type Locality } from "./LocalityFields";

/** Code postal / ville / pays avec autocomplétion pour les formulaires d'administration (état interne, champs envoyés par le formulaire). */
export function LocalityGroup({ defaults, idPrefix = "loc" }: { defaults?: Partial<Locality>; idPrefix?: string }) {
  const [v, setV] = useState<Locality>({ postalCode: defaults?.postalCode ?? "", city: defaults?.city ?? "", country: defaults?.country || "France" });
  return (
    <LocalityFields
      variant="admin"
      ids={{ postalCode: `${idPrefix}-postalCode`, city: `${idPrefix}-city`, country: `${idPrefix}-country` }}
      names={{ postalCode: "postalCode", city: "city", country: "country" }}
      value={v}
      onChange={(patch) => setV((p) => ({ ...p, ...patch }))}
    />
  );
}
