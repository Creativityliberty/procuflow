"use client";

import { MoreHorizontal, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { supplierStatusLabels } from "@/lib/format";
import { getSuppliers } from "@/lib/procuflow-api";
import type { SupplierRecord } from "@/lib/types";

const statusClass: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  draft: "bg-slate-100 text-slate-600",
  inactive: "bg-slate-100 text-slate-600",
  suspended: "bg-red-50 text-red-700"
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSuppliers({ search: search || undefined, status: status || undefined, category: category || undefined });
      setSuppliers(response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [category, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeading title="Fournisseurs" description="Coordonnees, documents, evaluations et statut de chaque fournisseur." action="Ajouter un fournisseur" actionHref="/suppliers/new" />
        <section className="app-panel overflow-hidden">
          <div className="flex flex-wrap gap-3 border-b border-[var(--border)] p-4">
            <input className="field-control max-w-xs" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un fournisseur..." aria-label="Rechercher un fournisseur" />
            <select className="field-control max-w-48" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrer par statut"><option value="">Tous les statuts</option><option value="active">Actif</option><option value="pending">En attente</option><option value="draft">Brouillon</option><option value="suspended">Suspendu</option></select>
            <select className="field-control max-w-48" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrer par categorie"><option value="">Toutes les categories</option><option>Informatique</option><option>Transport</option><option>BTP</option><option>Maintenance</option><option>Fournitures</option></select>
          </div>

          {error ? <div className="grid min-h-56 place-items-center p-5 text-center"><div><p className="m-0 text-sm text-red-700">{error}</p><button className="secondary-button mt-3" type="button" onClick={() => void load()}><RefreshCw size={16} /> Reessayer</button></div></div> : loading ? <div className="space-y-2 p-4">{[1, 2, 3].map((row) => <div className="h-12 animate-pulse rounded-xl bg-[var(--surface-soft)]" key={row} />)}</div> : suppliers.length === 0 ? <div className="grid min-h-56 place-items-center p-5 text-center"><div><strong className="block text-sm">Aucun fournisseur trouve</strong><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Ajoutez votre premier fournisseur ou modifiez les filtres.</p><Link href="/suppliers/new" className="primary-button mt-4">Ajouter un fournisseur</Link></div></div> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-[var(--surface-soft)] text-left text-xs font-semibold text-[var(--muted)]"><th className="border-b border-[var(--border)] px-4 py-3">Fournisseur</th><th className="border-b border-[var(--border)] px-4 py-3">Categorie</th><th className="border-b border-[var(--border)] px-4 py-3">Ville</th><th className="border-b border-[var(--border)] px-4 py-3">Score</th><th className="border-b border-[var(--border)] px-4 py-3">Statut</th><th className="border-b border-[var(--border)] px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{suppliers.map((supplier) => <tr className="hover:bg-[var(--surface-soft)]" key={supplier.id}><td className="border-b border-[var(--border)] px-4 py-3"><Link href={`/suppliers/${supplier.id}`} className="font-semibold hover:text-[var(--violet)]">{supplier.legal_name}</Link><small className="mt-0.5 block text-[var(--muted)]">{supplier.email || supplier.niu || "Dossier a completer"}</small></td><td className="border-b border-[var(--border)] px-4 py-3">{supplier.category || "-"}</td><td className="border-b border-[var(--border)] px-4 py-3 text-[var(--muted)]">{supplier.city || "-"}</td><td className="border-b border-[var(--border)] px-4 py-3 font-semibold">{supplier.score ? `${Number(supplier.score).toFixed(1)}/5` : "-"}</td><td className="border-b border-[var(--border)] px-4 py-3"><span className={`status-badge ${statusClass[supplier.status]}`}>{supplierStatusLabels[supplier.status]}</span></td><td className="border-b border-[var(--border)] px-4 py-3"><Link href={`/suppliers/${supplier.id}`} className="grid h-8 w-8 place-items-center rounded-xl hover:bg-white" aria-label={`Ouvrir ${supplier.legal_name}`}><MoreHorizontal size={17} /></Link></td></tr>)}</tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between p-4 text-xs text-[var(--muted)]"><span>{suppliers.length} fournisseur{suppliers.length > 1 ? "s" : ""}</span><span>Page 1</span></div>
        </section>
      </div>
    </AppShell>
  );
}
