"use client";

import { Check, Clock3, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { approvalRoleLabels, formatMoney } from "@/lib/format";
import { approvePurchaseRequest, getApprovalInbox, rejectPurchaseRequest } from "@/lib/procuflow-api";
import type { ApprovalInboxRecord } from "@/lib/types";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalInboxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getApprovalInbox();
      setApprovals(response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function approve(approval: ApprovalInboxRecord) {
    setActionId(approval.id);
    setError("");
    try {
      await approvePurchaseRequest(approval.purchase_request.id);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Validation impossible.");
    } finally {
      setActionId(null);
    }
  }

  async function reject(approval: ApprovalInboxRecord) {
    if (!comment.trim()) return;
    setActionId(approval.id);
    setError("");
    try {
      await rejectPurchaseRequest(approval.purchase_request.id, comment.trim());
      setRejectId(null);
      setComment("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Rejet impossible.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <AppShell><div className="space-y-5">
      <PageHeading title="Validations" description="Demandes pour lesquelles votre decision est attendue maintenant." />
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      <section className="app-panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4"><div><h2 className="m-0 text-base font-semibold">A traiter</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Seule l&apos;etape actuellement ouverte est affichee.</p></div><button type="button" className="secondary-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Actualiser</button></div>
        {loading ? <div className="space-y-3 p-4">{[1, 2, 3].map((row) => <div className="h-24 animate-pulse rounded-xl bg-[var(--surface-soft)]" key={row} />)}</div> : approvals.length === 0 ? <div className="grid min-h-64 place-items-center p-6 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check size={23} /></span><h2 className="mb-1 mt-4 text-base font-semibold">Tout est a jour</h2><p className="m-0 text-sm text-[var(--muted)]">Aucune decision ne vous attend pour le moment.</p><Link href="/purchase-requests" className="secondary-button mt-4">Voir les demandes</Link></div></div> : <div className="divide-y divide-[var(--border)]">
          {approvals.map((approval) => {
            const request = approval.purchase_request;
            return <article className="p-4" key={approval.id}>
              <div className="flex flex-wrap items-start gap-4">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-amber-50 text-amber-700"><Clock3 size={19} /></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link href={`/purchase-requests/${request.id}`} className="font-semibold hover:text-[var(--violet)]">{request.reference} - {request.title}</Link><span className="status-badge bg-[var(--violet-soft)] text-[var(--violet)]">{approvalRoleLabels[approval.role] ?? approval.role}</span></div><p className="mb-0 mt-1 text-sm text-[var(--muted)]">{request.service} - {request.creator?.name || "Demandeur"}</p><strong className="mt-2 block text-sm">{formatMoney(request.estimated_amount, request.currency)}</strong></div>
                <div className="flex gap-2"><button type="button" className="secondary-button text-red-700" onClick={() => { setRejectId(rejectId === approval.id ? null : approval.id); setComment(""); }} disabled={actionId === approval.id}><X size={16} /> Rejeter</button><button type="button" className="primary-button" onClick={() => void approve(approval)} disabled={actionId === approval.id}><Check size={16} /> {actionId === approval.id ? "Traitement..." : "Approuver"}</button></div>
              </div>
              {rejectId === approval.id ? <div className="ml-0 mt-4 rounded-xl border border-red-100 bg-red-50 p-3 md:ml-14"><label><span className="field-label text-red-900">Motif du rejet *</span><textarea className="field-control min-h-20 resize-y" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Expliquez clairement les corrections attendues." autoFocus /></label><div className="mt-3 flex justify-end gap-2"><button type="button" className="secondary-button" onClick={() => setRejectId(null)}>Annuler</button><button type="button" className="primary-button border-red-700 bg-red-700 hover:border-red-800 hover:bg-red-800" disabled={!comment.trim() || actionId === approval.id} onClick={() => void reject(approval)}>Confirmer le rejet</button></div></div> : null}
            </article>;
          })}
        </div>}
      </section>
    </div></AppShell>
  );
}
