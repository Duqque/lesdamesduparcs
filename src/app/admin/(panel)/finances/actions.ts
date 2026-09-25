"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { TX_STATUS_LABEL, getTransactions, setTxStatus, type PayMethod, type TxStatus } from "@/lib/server/business";
import { sendTemplate } from "@/lib/server/email";
import { eur } from "@/lib/admin/format";
import { safeReturn } from "@/lib/admin/params";

const BACK = "/admin/finances/transactions";

export async function txStatusAction(txId: string, status: TxStatus, returnToRaw: string, formData: FormData) {
  const returnTo = safeReturn(returnToRaw, BACK);
  const ctx = await requireAdmin("finance.edit");
  const method = (String(formData.get("method") ?? "") || undefined) as PayMethod | undefined;
  const tx = (await getTransactions()).find((t) => t.id === txId);
  const res = await setTxStatus(txId, status, { method });
  if (!res.ok) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}erreur=${encodeURIComponent(res.error)}`);
  await audit(ctx, status === "refunded" ? "remboursement" : "paiement", "transaction", `${tx?.name ?? txId} : ${tx ? eur(tx.amountCents) : ""} passé à « ${TX_STATUS_LABEL[status]} »`, { entityId: txId, before: tx?.status, after: status });
  if (status === "paid" && tx?.email) await sendTemplate("payment", tx.email, { prenom: tx.name.split(" ")[0], montant: eur(tx.amountCents), objet: tx.label }, "paymentConfirmation");
  revalidatePath("/admin", "layout");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}ok=${encodeURIComponent("Transaction mise à jour.")}`);
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
