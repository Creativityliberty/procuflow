"use client";

import { RefreshCw, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatMoney, purchaseRequestStatusLabels } from "@/lib/format";
import { getPurchaseRequests } from "@/lib/procuflow-api";
import type { PurchaseRequestRecord } from "@/lib/types";

const statusClass: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  draft: "bg-slate-100 text-slate-600",
  in_consultation: "bg-violet-50 text-violet-700",
  ordered: "bg-blue-50 text-blue-700"
};

export function PurchaseRequestTable({ limit }: { limit?: number }) {
  const [requests, setRequests] = useState<PurchaseRequestRecord[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getPurchaseRequests({ status: status || undefined });
      setRequests(limit ? response.data.slice(0, limit) : response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [limit, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="app-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <div>
          <h2 className="m-0 text-base font-semibold">Demandes recentes</h2>
          <p className="mb-0 mt-1 text-xs text-[var(--muted)]">Dernieres demandes mises a jour</p>
        </div>
        <label className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[var(--muted)]" />
          <span className="sr-only">Filtrer par statut</span>
          <select className="field-control min-w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillons</option>
            <option value="pending">En validation</option>
            <option value="approved">Validees</option>
            <option value="rejected">Rejetees</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="grid min-h-44 place-items-center p-5 text-center">
          <div><p className="m-0 text-sm text-red-700">{error}</p><button type="button" className="secondary-button mt-3" onClick={() => void load()}><RefreshCw size={16} /> Reessayer</button></div>
        </div>
      ) : loading ? (
        <div className="space-y-2 p-4" aria-label="Chargement des demandes">
          {[1, 2, 3].map((row) => <div className="h-11 animate-pulse rounded-xl bg-[var(--surface-soft)]" key={row} />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="grid min-h-44 place-items-center p-5 text-center">
          <div><strong className="block text-sm">Aucune demande trouvee</strong><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Creez une demande ou changez le filtre.</p><Link href="/purchase-requests/new" className="primary-button mt-4">Creer une demande</Link></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--surface-soft)] text-left text-xs font-semibold text-[var(--muted)]">
                <th className="border-b border-[var(--border)] px-4 py-3">Reference</th>
                <th className="border-b border-[var(--border)] px-4 py-3">Objet</th>
                <th className="border-b border-[var(--border)] px-4 py-3">Service</th>
                <th className="border-b border-[var(--border)] px-4 py-3">Montant</th>
                <th className="border-b border-[var(--border)] px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr className="hover:bg-[var(--surface-soft)]" key={request.id}>
                  <td className="border-b border-[var(--border)] px-4 py-3 font-semibold text-[var(--violet)]"><Link href={`/purchase-requests/${request.id}`}>{request.reference}</Link></td>
                  <td className="border-b border-[var(--border)] px-4 py-3"><Link href={`/purchase-requests/${request.id}`} className="font-medium hover:text-[var(--violet)]">{request.title}</Link></td>
                  <td className="border-b border-[var(--border)] px-4 py-3 text-[var(--muted)]">{request.service}</td>
                  <td className="whitespace-nowrap border-b border-[var(--border)] px-4 py-3 font-medium">{formatMoney(request.estimated_amount, request.currency)}</td>
                  <td className="border-b border-[var(--border)] px-4 py-3"><span className={`status-badge ${statusClass[request.status] ?? "bg-slate-100 text-slate-600"}`}>{purchaseRequestStatusLabels[request.status] ?? request.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {limit ? <div className="p-3 text-right"><Link href="/purchase-requests" className="text-sm font-semibold text-[var(--violet)] hover:underline">Voir toutes les demandes</Link></div> : null}
    </section>
  );
}
