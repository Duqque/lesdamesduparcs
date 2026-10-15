import "server-only";
import { payments } from "./business";
import { deleteBlob } from "./blobs";
import { promoteWaitlist } from "./event-ops";
import { invoiceKey, invoices } from "./invoice";
import { releaseStock } from "./shop";
import { deleteOrderById, deleteRegistrationById, listAllRegistrations, listOrders } from "./store";

/**
 * Suppression définitive d'une ligne de transaction (adhésion, inscription à un événement, commande), avec sa facture éventuelle.
 * Une inscription supprimée libère sa place (liste d'attente servie) ; une commande non annulée rend son stock.
 */
export async function deleteTransaction(txId: string) {
  const [source, rowId] = txId.split(":");
  if (source === "payment") {
    if (!(await payments.findOne((p) => p.id === rowId))) return false;
    await payments.remove(rowId);
  } else if (source === "registration") {
    const reg = (await listAllRegistrations()).find((r) => r.id === rowId);
    if (!reg) return false;
    await deleteRegistrationById(rowId);
    await promoteWaitlist(reg.eventId);
  } else if (source === "order") {
    const order = (await listOrders()).find((o) => o.id === rowId);
    if (!order) return false;
    if (order.status !== "cancelled" && order.status !== "refunded") await releaseStock(order.lines);
    await deleteOrderById(rowId);
  } else return false;
  for (const inv of await invoices.find((i) => i.txId === txId)) {
    await invoices.remove(inv.id);
    await deleteBlob(invoiceKey(inv.id)).catch(() => undefined);
  }
  return true;
}
