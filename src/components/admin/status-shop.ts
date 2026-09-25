import type { Fulfilment } from "@/lib/orders";

export const FULFIL_LABELS: Record<Fulfilment, string> = { to_prepare: "À préparer", preparing: "En préparation", shipped: "Expédiée", ready_for_pickup: "Prête au retrait", delivered: "Livrée / retirée" };
