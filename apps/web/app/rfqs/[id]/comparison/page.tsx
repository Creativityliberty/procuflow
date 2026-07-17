"use client";

import { ArrowLeft, Check, FileText, RefreshCw, Save, Send, ShieldCheck, SlidersHorizontal, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { createPurchaseOrder, decideComparison, generateRfqComparison, getRfq, getRfqComparison, submitComparison, updateComparisonSynthesis, updateComparisonWeights, updateOfferAssessment } from "@/lib/procuflow-api";
import { formatMoney } from "@/lib/format";
import type { ComparisonCriterion, ComparisonWeights, OfferAssessmentRecord, RfqComparisonRecord, RfqRecord } from "@/lib/types";

const criteria: Array<{ key: ComparisonCriterion; label: string }> = [
  { key: "price", label: "Prix" }, { key: "delivery", label: "Delai" }, { key: "technical", label: "Technique" },
  { key: "payment", label: "Paiement" }, { key: "warranty", label: "Garantie & SAV" },
  { key: "supplier_performance", label: "Performance fournisseur" }, { key: "proximity", label: "Proximite" }
];

const statusLabel = { draft: "Brouillon", pending_approval: "A valider", approved: "Approuvee", rejected: "A reprendre" };
const riskLabel = { low: "Faible", medium: "Moyen", high: "Eleve" };

export default function ComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rfq, setRfq] = useState<RfqRecord | null>(null);
  const [comparison, setComparison] = useState<RfqComparisonRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [weights, setWeights] = useState<ComparisonWeights | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [synthesis, setSynthesis] = useState({ executive_summary: "", analysis: "", risks: "", recommended_offer_id: 0, recommendation_reason: "" });

  const applyComparison = useCallback((value: RfqComparisonRecord) => {
    setComparison(value); setWeights(value.weights);
    setSynthesis({
      executive_summary: value.executive_summary ?? "", analysis: value.analysis ?? "", risks: value.risks ?? "",
      recommended_offer_id: Number(value.recommended_offer_id ?? value.assessments.find((row) => row.rank === 1)?.supplier_offer_id ?? 0),
      recommendation_reason: value.recommendation_reason ?? ""
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const rfqData = await getRfq(id); setRfq(rfqData);
      try { applyComparison(await getRfqComparison(id)); } catch { setComparison(null); }
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Chargement impossible."); }
  }, [applyComparison, id]);

  useEffect(() => { void load(); }, [load]);
  const editable = comparison?.status === "draft" || comparison?.status === "rejected";
  const totalWeight = useMemo(() => weights ? Object.values(weights).reduce((sum, value) => sum + Number(value), 0) : 0, [weights]);
  const ranked = useMemo(() => [...(comparison?.assessments ?? [])].sort((a, b) => Number(a.rank ?? 99) - Number(b.rank ?? 99)), [comparison]);
  const best = ranked[0];
  const supplierName = (row: OfferAssessmentRecord) => row.offer.invitation?.supplier?.legal_name ?? `Fournisseur ${row.supplier_offer_id}`;

  async function run(action: () => Promise<RfqComparisonRecord>) {
    setBusy(true); try { applyComparison(await action()); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Action impossible."); } finally { setBusy(false); }
  }

  return <AppShell><div className="space-y-5">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]" href={`/rfqs/${id}`}><ArrowLeft size={16}/>Retour a la consultation</Link>
    {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    {!rfq ? <div className="app-panel h-80 animate-pulse"/> : <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading eyebrow={rfq.reference} title="Comparaison des offres" description="Classement multicritere, recommandation et validation du choix fournisseur."/>
        <div className="flex items-center gap-2">
          {comparison ? <span className="status-badge bg-violet-50 text-violet-700">{statusLabel[comparison.status]}</span> : null}
          {comparison ? <Link className="secondary-button" href={`/rfqs/${id}/comparison/report`}><FileText size={16}/>Rapport</Link> : null}
        </div>
      </div>
      {!comparison ? <section className="app-panel grid min-h-64 place-items-center p-8 text-center"><div><SlidersHorizontal className="mx-auto text-violet-600" size={34}/><h2 className="mb-2 mt-4 text-lg font-semibold">Le comparatif est pret a etre genere</h2><p className="mx-auto max-w-lg text-sm text-[var(--muted)]">Les offres soumises seront classees selon le prix, le delai, la conformite et la performance fournisseur.</p><button className="primary-button mt-3" disabled={busy || rfq.status !== "closed"} onClick={() => void run(() => generateRfqComparison(id))}><RefreshCw size={16}/>Generer le comparatif</button></div></section> : <>
        <section className="grid gap-3 md:grid-cols-3">
          <article className="app-panel p-4"><span className="text-xs font-semibold text-[var(--muted)]">Offres comparees</span><strong className="mt-2 block text-2xl">{ranked.length}</strong></article>
          <article className="app-panel p-4"><span className="text-xs font-semibold text-[var(--muted)]">Meilleur score</span><strong className="mt-2 block text-2xl text-violet-700">{Number(best?.final_score ?? 0).toFixed(1)} / 100</strong></article>
          <article className="app-panel p-4"><span className="text-xs font-semibold text-[var(--muted)]">Offre en tete</span><strong className="mt-2 block truncate text-base">{best ? supplierName(best) : "-"}</strong></article>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4"><div><h2 className="m-0 text-base font-semibold">Classement</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Le risque est deduit du score final.</p></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[960px] border-collapse text-left text-sm"><thead className="bg-violet-50/70 text-xs text-[var(--muted)]"><tr><th className="p-3">Rang</th><th className="p-3">Fournisseur</th><th className="p-3">Montant</th><th className="p-3">Delai</th><th className="p-3">Conformité</th><th className="p-3">Prix</th><th className="p-3">Technique</th><th className="p-3">Performance</th><th className="p-3">Risque</th><th className="p-3 text-right">Score</th></tr></thead><tbody>{ranked.map((row) => <tr className="border-t border-[var(--border)]" key={row.id}><td className="p-3">{row.rank === 1 ? <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-violet-700"><Trophy size={15}/></span> : <strong className="pl-3">{row.rank}</strong>}</td><td className="p-3"><strong>{supplierName(row)}</strong><small className="mt-1 block text-[var(--muted)]">{row.offer.invitation?.supplier?.city ?? "Ville non renseignee"}</small></td><td className="p-3 font-semibold">{formatMoney(row.offer.total_amount, row.offer.currency)}</td><td className="p-3">{row.offer.lead_time_days ?? "-"} j</td><td className="p-3"><strong>{Number(row.offer.compliance_score).toFixed(0)} %</strong><small className={`mt-1 block ${row.offer.mandatory_compliant ? "text-emerald-700" : "text-red-700"}`}>{row.offer.mandatory_compliant ? "Obligatoires conformes" : "Écart obligatoire"}</small></td><td className="p-3">{Number(row.score_breakdown?.price?.score ?? 0).toFixed(0)}</td><td className="p-3">{row.technical_score}</td><td className="p-3">{Number(row.score_breakdown?.supplier_performance?.score ?? 0).toFixed(0)}</td><td className="p-3"><span className={`status-badge ${row.risk_level === "high" ? "bg-red-50 text-red-700" : row.risk_level === "medium" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{riskLabel[row.risk_level]}</span></td><td className="p-3 text-right text-base font-bold text-violet-700">{Number(row.final_score).toFixed(1)}</td></tr>)}</tbody></table></div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
          <section className="app-panel p-4"><div className="flex items-center justify-between"><h2 className="m-0 text-base font-semibold">Ponderation</h2><span className={`status-badge ${totalWeight === 100 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{totalWeight} %</span></div><div className="mt-4 space-y-3">{weights && criteria.map((criterion) => <label className="grid grid-cols-[1fr_72px] items-center gap-3" key={criterion.key}><span className="text-sm">{criterion.label}</span><input className="field-control text-right" disabled={!editable} min={0} max={100} type="number" value={weights[criterion.key]} onChange={(event) => setWeights({ ...weights, [criterion.key]: Number(event.target.value) })}/></label>)}</div><button className="secondary-button mt-4 w-full" disabled={!editable || busy || totalWeight !== 100 || !weights} onClick={() => weights && void run(() => updateComparisonWeights(id, weights))}><Save size={15}/>Enregistrer</button></section>
          <section className="app-panel overflow-hidden"><div className="border-b border-[var(--border)] p-4"><h2 className="m-0 text-base font-semibold">Evaluation qualitative</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Les criteres financiers et les delais sont calcules automatiquement.</p></div>{ranked.map((row) => <AssessmentEditor disabled={!editable || busy} key={row.id} row={row} supplier={supplierName(row)} onSave={(payload) => run(() => updateOfferAssessment(id, row.id, payload))}/>)}</section>
        </div>

          <section className="app-panel p-4"><h2 className="m-0 text-base font-semibold">Synthese et recommandation</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><label><span className="field-label">Resume executif</span><textarea className="field-control min-h-28" disabled={!editable} value={synthesis.executive_summary} onChange={(e) => setSynthesis({ ...synthesis, executive_summary: e.target.value })}/></label><label><span className="field-label">Analyse comparative</span><textarea className="field-control min-h-28" disabled={!editable} value={synthesis.analysis} onChange={(e) => setSynthesis({ ...synthesis, analysis: e.target.value })}/></label><label><span className="field-label">Risques et mesures</span><textarea className="field-control min-h-28" disabled={!editable} value={synthesis.risks} onChange={(e) => setSynthesis({ ...synthesis, risks: e.target.value })}/></label><div className="space-y-4"><label><span className="field-label">Fournisseur recommande</span><select className="field-control" disabled={!editable} value={synthesis.recommended_offer_id} onChange={(e) => setSynthesis({ ...synthesis, recommended_offer_id: Number(e.target.value) })}><option value={0}>Selectionner</option>{ranked.map((row) => <option disabled={!row.offer.mandatory_compliant} key={row.id} value={row.supplier_offer_id}>{supplierName(row)} - {Number(row.final_score).toFixed(1)}/100{row.offer.mandatory_compliant ? "" : " — non conforme"}</option>)}</select></label><label><span className="field-label">Motif de la recommandation</span><textarea className="field-control min-h-24" disabled={!editable} value={synthesis.recommendation_reason} onChange={(e) => setSynthesis({ ...synthesis, recommendation_reason: e.target.value })}/></label></div></div>{editable ? <div className="mt-4 flex flex-wrap justify-end gap-2"><button className="secondary-button" disabled={busy} onClick={() => void run(() => updateComparisonSynthesis(id, synthesis))}><Save size={15}/>Enregistrer la synthese</button><button className="primary-button" disabled={busy || !synthesis.recommended_offer_id || synthesis.executive_summary.length < 20 || synthesis.analysis.length < 20 || synthesis.risks.length < 10 || synthesis.recommendation_reason.length < 20} onClick={() => void run(async () => { await updateComparisonSynthesis(id, synthesis); return submitComparison(id); })}><Send size={15}/>Soumettre pour validation</button></div> : null}</section>

        {comparison.status === "pending_approval" ? <section className="app-panel p-4"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-violet-700"/><h2 className="m-0 text-base font-semibold">Decision du responsable achats</h2></div><textarea className="field-control mt-4 min-h-20" value={decisionComment} onChange={(e) => setDecisionComment(e.target.value)} placeholder="Commentaire de decision (optionnel)"/><div className="mt-3 flex justify-end gap-2"><button className="secondary-button text-red-700" disabled={busy} onClick={() => void run(() => decideComparison(id, "rejected", decisionComment))}><X size={15}/>Demander une reprise</button><button className="primary-button" disabled={busy} onClick={() => void run(() => decideComparison(id, "approved", decisionComment))}><Check size={15}/>Approuver le choix</button></div></section> : null}
        {comparison.status === "approved" ? <section className="app-panel flex flex-wrap items-center gap-3 border-green-200 bg-green-50/80 p-4"><ShieldCheck className="text-green-700" size={20}/><div className="min-w-0 flex-1"><strong className="text-green-800">Choix fournisseur approuve</strong><p className="mb-0 mt-1 text-sm text-green-800">La demande d&apos;achat est prete pour la creation du bon de commande.</p></div><button className="primary-button" disabled={busy} onClick={async()=>{setBusy(true);try{const order=await createPurchaseOrder({rfq_comparison_id:comparison.id,delivery_location:rfq.delivery_location??undefined});router.push(`/purchase-orders/${order.id}`)}catch(cause){setError(cause instanceof Error?cause.message:"Creation impossible.");setBusy(false)}}}>Creer le bon de commande</button></section> : null}
      </>}
    </>}
  </div></AppShell>;
}

function AssessmentEditor({ row, supplier, disabled, onSave }: { row: OfferAssessmentRecord; supplier: string; disabled: boolean; onSave: (payload: { technical_score: number; payment_score: number; warranty_score: number; proximity_score: number; risk_level: "low" | "medium" | "high"; assessor_notes?: string }) => Promise<unknown> }) {
  const [form, setForm] = useState({ technical_score: row.technical_score, payment_score: row.payment_score, warranty_score: row.warranty_score, proximity_score: row.proximity_score, risk_level: row.risk_level, assessor_notes: row.assessor_notes ?? "" });
  useEffect(() => setForm({ technical_score: row.technical_score, payment_score: row.payment_score, warranty_score: row.warranty_score, proximity_score: row.proximity_score, risk_level: row.risk_level, assessor_notes: row.assessor_notes ?? "" }), [row]);
  return <div className="border-t border-[var(--border)] p-4"><div className="mb-3 flex items-center justify-between gap-3"><strong>{supplier}</strong><span className="font-bold text-violet-700">{Number(row.final_score).toFixed(1)}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{(["technical_score", "payment_score", "warranty_score", "proximity_score"] as const).map((key) => <label key={key}><span className="field-label">{{ technical_score: "Technique", payment_score: "Paiement", warranty_score: "Garantie", proximity_score: "Proximite" }[key]}</span><input className="field-control" disabled={disabled} min={0} max={100} type="number" value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}/></label>)}<label><span className="field-label">Risque</span><select className="field-control" disabled={disabled} value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value as typeof form.risk_level })}><option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Eleve</option></select></label></div><div className="mt-3 flex gap-2"><input className="field-control" disabled={disabled} value={form.assessor_notes} onChange={(e) => setForm({ ...form, assessor_notes: e.target.value })} placeholder="Observation interne"/><button className="secondary-button" disabled={disabled} onClick={() => void onSave(form)}><Save size={15}/><span className="hidden sm:inline">Enregistrer</span></button></div></div>;
}
