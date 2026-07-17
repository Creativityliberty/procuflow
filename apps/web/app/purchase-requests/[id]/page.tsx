"use client";

import { ArrowLeft, Check, Send, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { PurchaseRequestDocuments } from "@/features/requests/purchase-request-documents";
import { StockCheckPanel } from "@/features/requests/stock-check-panel";
import { approvalRoleLabels, formatMoney, purchaseRequestStatusLabels } from "@/lib/format";
import { approvePurchaseRequest, getPurchaseRequest, rejectPurchaseRequest, submitPurchaseRequest } from "@/lib/procuflow-api";
import type { PurchaseRequestRecord } from "@/lib/types";

const statusClass: Record<string, string> = { draft: "bg-slate-100 text-slate-700", pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700", rejected: "bg-red-50 text-red-700", in_consultation: "bg-violet-50 text-violet-700", ordered: "bg-blue-50 text-blue-700" };

export default function PurchaseRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<PurchaseRequestRecord | null>(null);
  const [comment, setComment] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try { setRequest(await getPurchaseRequest(params.id)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Chargement impossible."); }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  async function decide(decision: "approved" | "rejected") {
    if (decision === "rejected" && !comment.trim()) return;
    setActing(true);
    setError("");
    try {
      const updated = decision === "approved" ? await approvePurchaseRequest(params.id, comment || undefined) : await rejectPurchaseRequest(params.id, comment.trim());
      setRequest(updated);
      setComment("");
      setRejecting(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Decision impossible.");
    } finally {
      setActing(false);
    }
  }

  async function submitDraft() {
    setActing(true);
    setError("");
    try { setRequest(await submitPurchaseRequest(params.id)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Envoi impossible."); }
    finally { setActing(false); }
  }

  const currentApproval = request?.approvals?.filter((approval) => approval.status === "pending").sort((a, b) => a.step_order - b.step_order)[0];

  return (
    <AppShell><div className="space-y-5">
      <Link href="/purchase-requests" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--violet)]"><ArrowLeft size={16} /> Retour aux demandes</Link>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      {!request ? <div className="app-panel h-72 animate-pulse" /> : <>
        <div className="flex flex-wrap items-start justify-between gap-3"><PageHeading eyebrow={`Demandes d'achat / ${request.reference}`} title={request.title} description={`${request.service} - ${request.creator?.name || "Demandeur"}`} /><span className={`status-badge ${statusClass[request.status]}`}>{purchaseRequestStatusLabels[request.status]}</span></div>
        <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <article className="app-panel p-5"><h2 className="m-0 text-base font-semibold">Details de la demande</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-[var(--muted)]">Montant estime</dt><dd className="m-0 mt-1 text-base font-bold">{formatMoney(request.estimated_amount, request.currency)}</dd></div><div><dt className="text-[var(--muted)]">Centre de cout</dt><dd className="m-0 mt-1 font-semibold">{request.cost_center || "Non precise"}</dd></div><div><dt className="text-[var(--muted)]">Date souhaitee</dt><dd className="m-0 mt-1">{request.needed_at ? new Intl.DateTimeFormat("fr-FR").format(new Date(request.needed_at)) : "Non precisee"}</dd></div><div><dt className="text-[var(--muted)]">Priorite</dt><dd className="m-0 mt-1 capitalize">{request.priority}</dd></div><div><dt className="text-[var(--muted)]">Lieu de livraison</dt><dd className="m-0 mt-1">{request.delivery_location || "Non precise"}</dd></div>{request.source_need ? <div><dt className="text-[var(--muted)]">Cahier des charges source</dt><dd className="m-0 mt-1"><Link className="font-semibold text-[var(--violet)]" href={`/acde/${request.source_need.id}`}>{request.source_need.title}</Link></dd></div> : null}<div className="sm:col-span-2"><dt className="text-[var(--muted)]">Justification</dt><dd className="m-0 mt-1 leading-6">{request.reason}</dd></div></dl></article>
            <article className="app-panel overflow-hidden"><div className="border-b border-[var(--border)] p-4"><h2 className="m-0 text-base font-semibold">Articles et services</h2></div><div className="divide-y divide-[var(--border)]">{request.items?.map((item, index) => <div className="grid gap-2 p-4 text-sm sm:grid-cols-[36px_1fr_auto]" key={item.id ?? index}><span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--surface-soft)] font-semibold">{index + 1}</span><span><strong className="block">{item.description}</strong><small className="mt-1 block whitespace-pre-line text-[var(--muted)]">{item.specifications || `${item.quantity} ${item.unit}`}</small></span><strong className="whitespace-nowrap">{formatMoney(Number(item.quantity) * item.estimated_unit_price, request.currency)}</strong></div>)}</div></article>
            <PurchaseRequestDocuments requestId={request.id} status={request.status} initialDocuments={request.documents} />
            {request.status === "approved" || request.status === "in_consultation" ? <StockCheckPanel purchaseRequest={request} onSaved={(stock_check)=>setRequest((current)=>current?{...current,stock_check}:current)}/> : null}
          </div>
          <aside className="space-y-4">
            {request.status === "draft" ? <section className="app-panel p-4"><h2 className="m-0 text-base font-semibold">Demande en brouillon</h2><p className="mb-4 mt-1 text-xs leading-5 text-[var(--muted)]">Envoyez-la lorsque les informations et le montant estime sont prets.</p><button type="button" className="primary-button w-full" onClick={() => void submitDraft()} disabled={acting}><Send size={17} /> {acting ? "Envoi..." : "Envoyer en validation"}</button></section> : null}
            <section className="app-panel p-4"><h2 className="m-0 text-base font-semibold">Circuit de validation</h2><ol className="mb-0 mt-4 space-y-3 pl-0">{request.approvals?.map((approval) => <li className="flex gap-3" key={approval.id}><span className={`grid h-8 w-8 flex-none place-items-center rounded-full ${approval.status === "approved" ? "bg-emerald-50 text-emerald-700" : approval.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{approval.status === "approved" ? <Check size={16} /> : approval.status === "rejected" ? <X size={16} /> : approval.step_order}</span><span><strong className="block text-sm">{approvalRoleLabels[approval.role] ?? approval.role}</strong><small className="text-[var(--muted)]">{approval.status === "approved" ? `Valide${approval.approver ? ` par ${approval.approver.name}` : ""}` : approval.status === "rejected" ? "Rejete" : currentApproval?.id === approval.id ? "Decision attendue" : "En attente de l'etape precedente"}</small>{approval.comment ? <p className="mb-0 mt-1 text-xs leading-5">{approval.comment}</p> : null}</span></li>)}</ol></section>
            {request.status === "pending" && currentApproval ? <section className="app-panel p-4"><h2 className="m-0 text-base font-semibold">Votre decision</h2><p className="mb-3 mt-1 text-xs text-[var(--muted)]">Etape : {approvalRoleLabels[currentApproval.role] ?? currentApproval.role}</p><textarea className="field-control min-h-20 resize-y" value={comment} onChange={(event) => setComment(event.target.value)} placeholder={rejecting ? "Motif du rejet obligatoire" : "Commentaire facultatif"} /><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" className="secondary-button text-red-700" onClick={() => rejecting ? void decide("rejected") : setRejecting(true)} disabled={acting || (rejecting && !comment.trim())}><X size={16} /> {rejecting ? "Confirmer" : "Rejeter"}</button><button type="button" className="primary-button" onClick={() => void decide("approved")} disabled={acting}><Check size={16} /> Approuver</button></div>{rejecting ? <button type="button" className="mt-2 w-full text-xs font-semibold text-[var(--muted)]" onClick={() => { setRejecting(false); setComment(""); }}>Annuler le rejet</button> : null}</section> : null}
            {request.status === "approved" && request.stock_check?.items.some((item)=>Number(item.procurement_quantity)>0) ? <Link href={`/rfqs/new?request=${request.id}`} className="primary-button w-full"><Send size={17} /> Creer une consultation</Link> : null}
          </aside>
        </section>
      </>}
    </div></AppShell>
  );
}
