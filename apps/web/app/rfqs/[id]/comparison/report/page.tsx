"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getRfq, getRfqComparison } from "@/lib/procuflow-api";
import { formatMoney } from "@/lib/format";
import type { RfqComparisonRecord, RfqRecord } from "@/lib/types";

const labels: Record<string, string> = { price: "Prix", delivery: "Delai", technical: "Technique", payment: "Paiement", warranty: "Garantie & SAV", supplier_performance: "Performance fournisseur", proximity: "Proximite" };

export default function ComparisonReportPage() {
  const { id } = useParams<{ id: string }>();
  const [rfq, setRfq] = useState<RfqRecord | null>(null);
  const [comparison, setComparison] = useState<RfqComparisonRecord | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { const [a, b] = await Promise.all([getRfq(id), getRfqComparison(id)]); setRfq(a); setComparison(b); } catch (cause) { setError(cause instanceof Error ? cause.message : "Rapport indisponible."); } }, [id]);
  useEffect(() => { void load(); }, [load]);
  const rows = useMemo(() => [...(comparison?.assessments ?? [])].sort((a, b) => Number(a.rank ?? 99) - Number(b.rank ?? 99)), [comparison]);
  return <main className="mx-auto min-h-screen max-w-[1100px] bg-white p-5 text-[#17121f] sm:p-10">
    <div className="print-hidden mb-7 flex justify-between gap-3"><Link className="secondary-button" href={`/rfqs/${id}/comparison`}><ArrowLeft size={16}/>Retour</Link><button className="primary-button" onClick={() => window.print()}><Printer size={16}/>Imprimer / PDF</button></div>
    {error ? <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : null}
    {!rfq || !comparison ? <div className="h-80 animate-pulse rounded-xl bg-gray-100"/> : <article>
      <header className="flex items-start justify-between gap-6 border-b-2 border-violet-700 pb-6"><div><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-700 font-bold text-white">P</span><strong className="text-lg">ProcuFlow</strong></div><p className="mb-0 mt-4 text-xs uppercase text-gray-500">Note de synthese des offres</p><h1 className="mb-0 mt-1 text-2xl font-semibold">{rfq.title}</h1></div><div className="text-right text-sm"><strong>{rfq.reference}</strong><p className="mb-0 mt-2 text-gray-500">Version {comparison.version}<br/>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date())}</p></div></header>
      <section className="mt-7 grid grid-cols-3 gap-3"><ReportStat label="Offres comparees" value={String(rows.length)}/><ReportStat label="Statut" value={comparison.status === "approved" ? "Approuvee" : comparison.status === "pending_approval" ? "A valider" : "Brouillon"}/><ReportStat label="Meilleur score" value={`${Number(rows[0]?.final_score ?? 0).toFixed(1)} / 100`}/></section>
      <section className="mt-8"><h2 className="text-base font-semibold">Classement final</h2><table className="mt-3 w-full border-collapse text-left text-sm"><thead><tr className="bg-violet-50"><th className="p-3">Rang</th><th className="p-3">Fournisseur</th><th className="p-3">Montant</th><th className="p-3">Delai</th><th className="p-3">Risque</th><th className="p-3 text-right">Score</th></tr></thead><tbody>{rows.map((row) => <tr className="border-b border-gray-200" key={row.id}><td className="p-3 font-bold">{row.rank}</td><td className="p-3 font-semibold">{row.offer.invitation?.supplier?.legal_name ?? `Fournisseur ${row.supplier_offer_id}`}</td><td className="p-3">{formatMoney(row.offer.total_amount, row.offer.currency)}</td><td className="p-3">{row.offer.lead_time_days ?? "-"} jours</td><td className="p-3">{row.risk_level === "low" ? "Faible" : row.risk_level === "medium" ? "Moyen" : "Eleve"}</td><td className="p-3 text-right font-bold text-violet-700">{Number(row.final_score).toFixed(1)}</td></tr>)}</tbody></table></section>
      <section className="mt-8"><h2 className="text-base font-semibold">Ponderation appliquee</h2><div className="mt-3 grid grid-cols-4 gap-2">{Object.entries(comparison.weights).map(([key, value]) => <div className="rounded-lg border border-gray-200 p-3" key={key}><span className="block text-xs text-gray-500">{labels[key]}</span><strong className="mt-1 block">{value} %</strong></div>)}</div></section>
      <section className="mt-8 grid grid-cols-2 gap-6"><ReportText title="Resume executif" value={comparison.executive_summary}/><ReportText title="Analyse comparative" value={comparison.analysis}/><ReportText title="Risques et mesures" value={comparison.risks}/><ReportText title="Recommandation" value={comparison.recommendation_reason}/></section>
      <section className="mt-8 rounded-xl border border-violet-200 bg-violet-50 p-5"><span className="text-xs font-semibold uppercase text-violet-700">Fournisseur recommande</span><strong className="mt-2 block text-lg">{comparison.recommended_offer?.invitation?.supplier?.legal_name ?? "Non renseigne"}</strong></section>
      <footer className="mt-10 grid grid-cols-2 gap-8 border-t border-gray-200 pt-6 text-sm"><div><span className="text-gray-500">Prepare par</span><strong className="mt-2 block">{comparison.creator?.name ?? "Equipe Achats"}</strong></div><div><span className="text-gray-500">Decision</span><strong className="mt-2 block">{comparison.decision_maker?.name ?? "En attente de validation"}</strong>{comparison.decision_comment ? <p className="mt-2">{comparison.decision_comment}</p> : null}</div></footer>
    </article>}
  </main>;
}

function ReportStat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-gray-200 p-4"><span className="text-xs text-gray-500">{label}</span><strong className="mt-1 block text-lg">{value}</strong></div>; }
function ReportText({ title, value }: { title: string; value?: string | null }) { return <div><h2 className="text-base font-semibold">{title}</h2><p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{value || "Non renseigne"}</p></div>; }
