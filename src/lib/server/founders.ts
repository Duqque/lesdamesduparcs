import "server-only";
import { currentMembership, memberships, paymentOfMembership, payments, setTxStatus } from "./business";
import { deleteBlob } from "./blobs";
import { invoiceKey, invoices } from "./invoice";
import { getMemberById, updateMember } from "./store";

export const FOUNDER_NOTE = "Membre fondatrice : adhésion offerte";

/**
 * Membre fondatrice : adhésion offerte. La fiche porte la mention, l'adhésion en cours et son paiement passent à 0 € (la carte reste
 * valide, le paiement est « payé » à 0 €) : les recettes ne comptent plus ce montant. La facture déjà éditée pour l'ancien montant
 * est retirée. Retirer la mention ne rétablit pas de montant.
 */
export async function setFounder(memberId: string, on: boolean) {
  const m = await getMemberById(memberId);
  if (!m || m.status === "anonymized") return false;
  await updateMember(memberId, { founder: on || undefined });
  if (!on) return true;
  const cur = await currentMembership(memberId);
  if (!cur) return true;
  if (cur.amountCents) await memberships.update(cur.id, { amountCents: 0 });
  const pay = await paymentOfMembership(cur.id);
  if (!pay) return true;
  await payments.update(pay.id, { amountCents: 0, baseCents: pay.baseCents ?? pay.amountCents, note: FOUNDER_NOTE });
  const txId = `payment:${pay.id}`;
  for (const inv of await invoices.find((i) => i.txId === txId && i.amountCents > 0)) {
    await invoices.remove(inv.id);
    await deleteBlob(invoiceKey(inv.id)).catch(() => undefined);
  }
  // Adhésion pas encore réglée : elle devient valide (payée à 0 €).
  if (pay.status !== "paid") await setTxStatus(txId, "paid", { method: "autre", note: FOUNDER_NOTE });
  return true;
}
