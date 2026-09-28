import type { MemberStatus } from "@/lib/server/admin-data";
import type { TxStatus } from "@/lib/server/business";
import type { Tone } from "./ui";

export const STATUS_TONE: Record<MemberStatus, Tone> = { active: "green", expired: "grey", suspended: "orange", expelled: "red", anonymized: "grey" };
export const STATUS_LABEL: Record<MemberStatus, string> = { active: "Active", expired: "Expirée", suspended: "Suspendue", expelled: "Radiée", anonymized: "Anonymisée" };
export const PAY_TONE: Record<TxStatus, Tone> = { paid: "green", pending: "orange", failed: "red", refunded: "blue", cancelled: "grey" };
