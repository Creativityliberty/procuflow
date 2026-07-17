"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/procuflow-api";
import type { DashboardData } from "@/lib/types";

export function PurchaseRequestSummary() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    getDashboard().then(setData).catch(() => setData(null));
  }, []);

  const cards = [
    { label: "En validation", value: data?.pending_purchase_requests },
    { label: "Validees", value: data?.approved_purchase_requests },
    { label: "Brouillons", value: data?.draft_purchase_requests }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Resume des demandes">
      {cards.map((card) => (
        <article className="app-panel p-4" key={card.label}>
          <span className="text-sm text-[var(--muted)]">{card.label}</span>
          <strong className="mt-1 block text-xl">{card.value ?? "-"}</strong>
        </article>
      ))}
    </section>
  );
}
