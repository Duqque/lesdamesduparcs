"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { formatEuros, type Registration, type RegistrationStatus } from "@/lib/registration";
import type { ClubEvent } from "@/types";

interface Data {
  capacity: number;
  taken: number;
  collectedCents: number;
  registrations: Registration[];
}

const statusLabel: Record<RegistrationStatus, string> = { confirmed: "Confirmée", awaiting_payment: "Paiement en attente", paid: "Payée", waitlist: "Liste d’attente", cancelled: "Annulée", refunded: "Remboursée" };

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  // Neutralise l'injection de formules dans les tableurs
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function AdminRegistrations({ event }: { event: ClubEvent }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${event.id}/registrations`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) setError(d.error ?? "Chargement impossible.");
        else setData(d as Data);
      })
      .catch(() => !cancelled && setError("Chargement impossible."));
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  function exportCsv() {
    if (!data) return;
    const head = ["Prénom", "Nom", "E-mail", "Téléphone", "Carte membre", "Places", "Montant", "Statut", "Date de naissance", "Responsable", "Tél. responsable", "Contact d'urgence", "Tél. urgence", "Allergies", "Droit à l'image", "Inscrite le"];
    const rows = data.registrations.map((r) => [r.firstName, r.lastName, r.email, r.phone, r.memberNumber, r.places, r.amountCents / 100, statusLabel[r.status], r.birthDate ?? "", r.guardian?.name ?? "", r.guardian?.phone ?? "", r.emergency.name, r.emergency.phone, r.allergies ?? "", r.consents.image ? "oui" : "non", r.createdAt]);
    const csv = [head, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscriptions-${event.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <p role="alert" className="rounded-[12px] border border-psg-red/40 bg-psg-red/10 p-5 font-body text-[14px] text-[#ff9aa8]">{error}</p>;
  if (!data) return <p className="font-body text-[14px] text-mist">Chargement des inscriptions…</p>;

  const tiles = [
    { label: "Inscriptions", value: String(data.registrations.length) },
    { label: "Places prises", value: event.registration.mode === "form" ? `${data.taken} / ${data.capacity}` : "Billetterie" },
    { label: "Encaissé", value: formatEuros(data.collectedCents) },
  ];

  return (
    <div className="rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-6 md:p-9">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-[12px] border border-white/10 bg-black/20 p-5">
            <p className="font-body text-[12px] uppercase tracking-[0.2em] text-mist">{t.label}</p>
            <p className="mt-2 font-display text-[34px] font-semibold tabular-nums leading-none text-white">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h3 className="font-body text-[16px] font-medium text-white">Liste des inscriptions</h3>
        <button type="button" onClick={exportCsv} disabled={data.registrations.length === 0} className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/[0.12] bg-[#121417]/90 px-4 font-body text-[13.5px] font-medium text-white hover:border-white/30 disabled:opacity-40">
          <Download aria-hidden className="size-4" strokeWidth={1.7} /> Exporter en CSV
        </button>
      </div>

      {data.registrations.length === 0 ? (
        <p className="mt-6 font-body text-[14.5px] text-mist">Aucune inscription pour le moment.</p>
      ) : (
        <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
          {data.registrations.map((r) => (
            <li key={r.id} className="grid gap-2 py-4 sm:grid-cols-[1.4fr_1.2fr_auto] sm:items-center sm:gap-6">
              <div>
                <p className="font-body text-[15px] font-medium text-white">
                  {r.firstName} {r.lastName}
                </p>
                <p className="font-body text-[12.5px] tabular-nums text-mist">{r.memberNumber}</p>
              </div>
              <div className="font-body text-[13px] text-mist">
                <p>{r.email}</p>
                <p>{r.phone}</p>
              </div>
              <div className="flex items-center gap-3 sm:justify-end">
                <span className="font-body text-[13px] tabular-nums text-white/80">
                  {r.places} pl. · {formatEuros(r.amountCents)}
                </span>
                <span className="rounded-full border border-white/15 px-3 py-1 font-body text-[12px] text-white/85">{statusLabel[r.status]}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
