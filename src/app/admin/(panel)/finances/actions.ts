"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin, requireFresh } from "@/lib/server/admin-auth";
import { TX_STATUS_LABEL, getTransactions, setTxStatus, type PayMethod, type TxStatus } from "@/lib/server/business";
import { sendTemplate } from "@/lib/server/email";
import { eur } from "@/lib/admin/format";
import { safeReturn } from "@/lib/admin/params";
import { deleteTransaction } from "@/lib/server/tx-delete";

const BACK = "/admin/finances/transactions";

export async function txStatusAction(txId: string, status: TxStatus, returnToRaw: string, formData: FormData) {
  const returnTo = safeReturn(returnToRaw, BACK);
  const ctx = await requireAdmin("finance.edit");
  if (status === "refunded") await requireFresh(ctx, returnTo);
  const method = (String(formData.get("method") ?? "") || undefined) as PayMethod | undefined;
  const tx = (await getTransactions()).find((t) => t.id === txId);
  const res = await setTxStatus(txId, status, { method, skipRefund: formData.get("manual") === "1" });
  if (!res.ok) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}erreur=${encodeURIComponent(res.error)}`);
  await audit(ctx, status === "refunded" ? "remboursement" : "paiement", "transaction", `${tx?.name ?? txId} : ${tx ? eur(tx.amountCents) : ""} passé à « ${TX_STATUS_LABEL[status]} »`, { entityId: txId, before: tx?.status, after: status });
  if (status === "paid" && tx?.email) await sendTemplate("payment", tx.email, { prenom: tx.name.split(" ")[0], montant: eur(tx.amountCents), objet: tx.label }, "paymentConfirmation");
  revalidatePath("/admin", "layout");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}ok=${encodeURIComponent("Transaction mise à jour.")}`);
}

/** Actions groupées sur les transactions sélectionnées : annuler (en attente uniquement) ou supprimer définitivement. */
export async function bulkTxAction(formData: FormData) {
  const op = String(formData.get("op") ?? "");
  const returnTo = safeReturn(String(formData.get("returnTo") ?? ""), BACK);
  const ids = [...new Set(formData.getAll("ids").map(String))].slice(0, 500);
  const go = (k: "ok" | "erreur", msg: string) => {
    revalidatePath("/admin", "layout");
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${k}=${encodeURIComponent(msg)}`);
  };
  if (!ids.length) go("erreur", "Sélectionnez au moins une transaction.");
  const ctx = await requireAdmin("finance.edit");
  if (op === "delete") await requireFresh(ctx, returnTo);
  const txs = await getTransactions();
  let n = 0;
  for (const id of ids) {
    const tx = txs.find((t) => t.id === id);
    if (!tx) continue;
    if (op === "delete") {
      if (!(await deleteTransaction(id))) continue;
      await audit(ctx, "suppression", "transaction", `Transaction supprimée : ${tx.name}, ${tx.label}, ${eur(tx.amountCents)} (${TX_STATUS_LABEL[tx.status]})`, { entityId: id });
    } else if (op === "cancel") {
      if (tx.status !== "pending" && tx.status !== "failed") continue;
      const res = await setTxStatus(id, "cancelled");
      if (!res.ok) continue;
      await audit(ctx, "paiement", "transaction", `${tx.name} : ${eur(tx.amountCents)} passé à « Annulé »`, { entityId: id, before: tx.status, after: "cancelled" });
    } else go("erreur", "Action inconnue.");
    n++;
  }
  go("ok", op === "delete" ? `${n} transaction(s) supprimée(s).` : `${n} transaction(s) annulée(s) (seules les transactions en attente ou échouées peuvent l'être).`);
}

export async function remindAction(txId: string, returnToRaw: string) {
  const returnTo = safeReturn(returnToRaw, BACK);
  const ctx = await requireAdmin("finance.edit");
  const tx = (await getTransactions()).find((t) => t.id === txId);
  if (!tx?.email) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}erreur=${encodeURIComponent("Pas d'adresse e-mail pour cette personne.")}`);
  await sendTemplate("payment_failed", tx.email, { prenom: tx.name.split(" ")[0], objet: tx.label, montant: eur(tx.amountCents) });
  await audit(ctx, "relance", "transaction", `Relance envoyée à ${tx.name} (${tx.label})`, { entityId: txId });
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}ok=${encodeURIComponent("Relance enregistrée (elle part si un service d'e-mail est configuré).")}`);
}
