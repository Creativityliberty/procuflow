"use client";

import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supplierStatusLabels } from "@/lib/format";
import { getSuppliers } from "@/lib/procuflow-api";
import type { SupplierRecord } from "@/lib/types";

export function SupplierHealth() {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);

  useEffect(() => {
    getSuppliers().then((response) => setSuppliers(response.data.slice(0, 4))).catch(() => setSuppliers([]));
  }, []);

  return (
    <section className="app-panel overflow-hidden">
      <div className="border-b border-[var(--border)] p-4">
        <h2 className="m-0 text-base font-semibold">Dossiers fournisseurs</h2>
        <p className="mb-0 mt-1 text-xs text-[var(--muted)]">Statut et evaluation des partenaires</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {suppliers.length === 0 ? <p className="m-0 p-4 text-sm text-[var(--muted)]">Aucun fournisseur enregistre.</p> : suppliers.map((supplier) => {
          const Icon = supplier.status === "active" ? CheckCircle2 : supplier.status === "pending" || supplier.status === "draft" ? Clock3 : AlertTriangle;
          const color = supplier.status === "active" ? "text-emerald-600" : supplier.status === "pending" || supplier.status === "draft" ? "text-amber-600" : "text-red-600";
          return (
            <Link href={`/suppliers/${supplier.id}`} className="flex items-center gap-3 p-4 hover:bg-[var(--surface-soft)]" key={supplier.id}>
              <Icon className={color} size={18} />
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{supplier.legal_name}</strong><small className="text-[var(--muted)]">{supplierStatusLabels[supplier.status]}</small></span>
              <span className="text-xs font-semibold">{supplier.score ? `${Number(supplier.score).toFixed(1)}/5` : "-"}</span>
            </Link>
          );
        })}
      </div>
      <div className="p-3 text-right"><Link href="/suppliers" className="text-sm font-semibold text-[var(--violet)] hover:underline">Voir les fournisseurs</Link></div>
    </section>
  );
}
