"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { computeTotals, setDrawer, useCartLines, useDrawerOpen } from "@/lib/cart";
import { shipping } from "@/data/shop";
import { formatPrice } from "@/lib/money";
import { CartLines } from "./CartLines";

/** Panier latéral : s'ouvre à l'ajout d'un article ou depuis l'icône du header. */
export function CartDrawer() {
  const open = useDrawerOpen();
  const lines = useCartLines();
  const totals = computeTotals(lines);
  const close = () => setDrawer(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const missing = Math.max(shipping.freeFromCents - totals.subtotalCents, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div aria-hidden className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Panier"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[71] flex w-[min(440px,100vw)] flex-col border-l border-white/10 bg-night-900"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h2 className="font-display text-[22px] font-semibold uppercase tracking-[0.08em] text-white">Panier ({totals.count})</h2>
              <button type="button" onClick={close} aria-label="Fermer le panier" className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10">
                <X aria-hidden className="size-5" />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                <ShoppingBag aria-hidden className="size-10 text-white/40" strokeWidth={1.2} />
                <p className="font-body text-[15px] text-mist">Votre panier est vide.</p>
                <Link href="/boutique" onClick={close} className="font-body text-[14px] font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                  Découvrir la boutique
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  <CartLines lines={lines} onNavigate={close} compact />
                </div>
                <div className="border-t border-white/10 px-6 pb-6 pt-5">
                  {missing > 0 ? (
                    <p className="mb-4 font-body text-[12.5px] text-mist">Plus que {formatPrice(missing)} pour la livraison offerte.</p>
                  ) : (
                    <p className="mb-4 font-body text-[12.5px] text-white/85">Livraison offerte.</p>
                  )}
                  <div className="flex items-center justify-between font-body text-[15px] text-white">
                    <span>Sous-total</span>
                    <span className="font-medium tabular-nums">{formatPrice(totals.subtotalCents)}</span>
                  </div>
                  <div className="mt-5 flex flex-col gap-3">
                    <div onClick={close}>
                      <Button href="/commande" size="lg" arrow={false} className="w-full">
                        Commander
                      </Button>
                    </div>
                    <div onClick={close}>
                      <Button href="/panier" size="sm" variant="outline" arrow={false} className="w-full">
                        Voir le panier
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
