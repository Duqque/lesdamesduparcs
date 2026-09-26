import "server-only";
import { settings, type AssociationInfo } from "./admin-store";
import { TBD } from "@/lib/legal-info";

export interface LegalContext {
  a: AssociationInfo;
  /** Valeur ou mention « à compléter » (les informations de l'association se modifient dans Configuration > Données de l'association). */
  v: (value: string | undefined) => string;
  fullAddress: string;
  retentionMonths: number;
  refundPolicy: string;
}

export async function getLegalContext(): Promise<LegalContext> {
  const conf = await settings.get();
  const a = conf.association;
  const v = (value?: string) => (value && value.trim() ? value.trim() : `[${TBD}]`);
  const fullAddress = [a.address, [a.postalCode, a.city].filter(Boolean).join(" ")].filter((x) => x && x.trim()).join(", ") || `[${TBD}]`;
  return { a, v, fullAddress, retentionMonths: conf.retention?.inactiveMonths ?? 36, refundPolicy: conf.payments?.refundPolicy ?? "" };
}
