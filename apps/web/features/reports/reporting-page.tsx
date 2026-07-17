"use client";

import { AlertTriangle, Archive, BarChart3, CalendarRange, CheckCircle2, Clock3, Download, FileSpreadsheet, PackageCheck, RefreshCw, Save, ShieldAlert, TrendingDown, TrendingUp, UsersRound, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { downloadReport, generateReportSnapshot, getBudgetVariances, getReportOverview, getReportSnapshots, getSupplierPerformance } from "@/lib/procuflow-api";
import { formatMoney } from "@/lib/format";
import type { BudgetVarianceReport, ReportOverviewData, ReportSnapshotRecord, SupplierPerformanceReport } from "@/lib/types";

type ReportTab = "overview" | "budget" | "suppliers";

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function startOfYear() { return `${new Date().getFullYear()}-01-01`; }

export function ReportingPage() {
  const [tab, setTab] = useState<ReportTab>("overview");
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(isoDate(new Date()));
  const [overview, setOverview] = useState<ReportOverviewData | null>(null);
  const [budget, setBudget] = useState<BudgetVarianceReport | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierPerformanceReport | null>(null);
  const [snapshots, setSnapshots] = useState<ReportSnapshotRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setBusy(true); setMessage("");
    try {
      const [overviewData, budgetData, supplierData, archives] = await Promise.all([getReportOverview(from, to), getBudgetVariances(from, to), getSupplierPerformance(from, to), getReportSnapshots()]);
      setOverview(overviewData); setBudget(budgetData); setSuppliers(supplierData); setSnapshots(archives);
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Chargement impossible."); }
    finally { setBusy(false); }
  }, [from, to]);

  useEffect(() => { void load(); }, [load]);

  async function exportCurrent() {
    setBusy(true);
    try {
      const file = await downloadReport(tab, from, to);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = file.filename; anchor.click(); URL.revokeObjectURL(url);
      setMessage("Export CSV genere.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Export impossible."); }
    finally { setBusy(false); }
  }

  async function archiveCurrent() {
    setBusy(true);
    try { await generateReportSnapshot(tab, from, to); setMessage("Rapport fige et archive."); setSnapshots(await getReportSnapshots()); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : "Archivage impossible."); }
    finally { setBusy(false); }
  }

  function preset(days: number) { const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days + 1); setFrom(isoDate(start)); setTo(isoDate(end)); }

  return <div className="space-y-5"><PageHeading title="Pilotage achats" description="Suivez les economies, les delais, les ecarts budgetaires et les fournisseurs a risque sur une seule vue." />
    <section className="app-panel p-4"><div className="flex flex-wrap items-end gap-3"><label><span className="field-label">Du</span><input className="field-control w-[150px]" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label><span className="field-label">Au</span><input className="field-control w-[150px]" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><div className="flex flex-wrap gap-2"><button className="secondary-button min-h-10" onClick={() => preset(30)}>30 jours</button><button className="secondary-button min-h-10" onClick={() => preset(90)}>90 jours</button><button className="secondary-button min-h-10" onClick={() => setFrom(startOfYear())}>Cette annee</button></div><div className="ml-auto flex flex-wrap gap-2"><button className="secondary-button" disabled={busy} onClick={() => void load()}><RefreshCw size={15} />Actualiser</button><button className="secondary-button" disabled={busy} onClick={() => void archiveCurrent()}><Save size={15} />Archiver</button><button className="primary-button" disabled={busy} onClick={() => void exportCurrent()}><Download size={15} />Exporter CSV</button></div></div>{message ? <p className="mb-0 mt-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-800">{message}</p> : null}</section>

    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-white/70 p-1" aria-label="Rapports">{([{ id: "overview", label: "Vue d'ensemble", icon: BarChart3 }, { id: "budget", label: "Derives budgetaires", icon: WalletCards }, { id: "suppliers", label: "Performance fournisseurs", icon: UsersRound }] as const).map((item) => { const Icon = item.icon; return <button key={item.id} className={`flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold ${tab === item.id ? "bg-[var(--violet)] text-white" : "text-[var(--muted)] hover:bg-white"}`} onClick={() => setTab(item.id)}><Icon size={16} />{item.label}</button>; })}</nav>

    {tab === "overview" ? <Overview report={overview} /> : null}
    {tab === "budget" ? <Budget report={budget} /> : null}
    {tab === "suppliers" ? <Suppliers report={suppliers} /> : null}

    <section className="app-panel overflow-hidden"><div className="flex items-center gap-2 border-b border-[var(--border)] p-4"><Archive size={17} /><h2 className="m-0 text-base font-semibold">Rapports auto-generes</h2></div>{snapshots.length ? <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">{snapshots.map((snapshot) => <article key={snapshot.id} className="rounded-xl border border-[var(--border)] p-3"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{snapshot.report_type === "overview" ? "Tableau de bord Achats" : snapshot.report_type === "budget" ? "Derives budgetaires" : "Fournisseurs sous surveillance"}</strong><span className="status-badge bg-violet-50 text-violet-700">{snapshot.frequency === "monthly" ? "Mensuel" : "Trimestriel"}</span></div><small className="mt-2 block text-[var(--muted)]">{new Date(snapshot.period_start).toLocaleDateString("fr-FR")} au {new Date(snapshot.period_end).toLocaleDateString("fr-FR")}</small></article>)}</div> : <p className="m-0 p-4 text-sm text-[var(--muted)]">Le premier rapport sera genere automatiquement au prochain cycle.</p>}</section>
  </div>;
}

function Overview({ report }: { report: ReportOverviewData | null }) {
  const metrics = report?.metrics;
  const cards = [
    { label: "Volume achats", value: metrics ? formatMoney(metrics.purchase_volume, report?.currency) : "-", hint: `${metrics?.order_count ?? 0} commande(s)`, icon: PackageCheck },
    { label: "Economies mesurees", value: metrics ? formatMoney(metrics.savings, report?.currency) : "-", hint: "Budget estime moins commande", icon: TrendingDown },
    { label: "Delai moyen DA", value: metrics ? `${metrics.average_request_processing_days} j` : "-", hint: "Soumission a approbation", icon: Clock3 },
    { label: "Livraisons a l'heure", value: metrics ? `${metrics.on_time_delivery_rate} %` : "-", hint: "Receptions completes", icon: CheckCircle2 },
    { label: "Montant engage", value: metrics ? formatMoney(metrics.committed_amount, report?.currency) : "-", hint: "Commandes non soldees", icon: WalletCards },
    { label: "Montant realise", value: metrics ? formatMoney(metrics.realized_amount, report?.currency) : "-", hint: "Factures payees", icon: FileSpreadsheet },
    { label: "Taux de validation", value: metrics ? `${metrics.validation_rate} %` : "-", hint: "Demandes validees", icon: TrendingUp },
    { label: "Commandes non recues", value: metrics ? String(metrics.unreceived_orders) : "-", hint: `${metrics?.cancelled_orders ?? 0} annulee(s)`, icon: AlertTriangle }
  ];
  return <><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => { const Icon = card.icon; return <article className="app-panel p-4" key={card.label}><div className="flex items-start justify-between"><span className="text-sm text-[var(--muted)]">{card.label}</span><span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-50 text-violet-700"><Icon size={16} /></span></div><strong className="mt-2 block text-xl">{card.value}</strong><small className="text-[var(--muted)]">{card.hint}</small></article>; })}</section><SpendChart rows={report?.monthly_spend ?? []} /></>;
}

function SpendChart({ rows }: { rows: ReportOverviewData["monthly_spend"] }) {
  const max = useMemo(() => Math.max(1, ...rows.map((row) => row.amount)), [rows]);
  return <section className="app-panel p-4"><div className="flex items-center gap-2"><CalendarRange size={17} /><h2 className="m-0 text-base font-semibold">Evolution du volume achats</h2></div><div className="mt-5 flex h-56 items-end gap-2 overflow-x-auto border-b border-[var(--border)] px-2">{rows.map((row) => <div className="flex h-full min-w-[64px] flex-1 flex-col justify-end text-center" key={row.month}><small className="mb-2 text-[11px] font-semibold text-[var(--muted)]">{row.amount >= 1000000 ? `${(row.amount / 1000000).toFixed(1)}M` : `${Math.round(row.amount / 1000)}k`}</small><div className="mx-auto w-8 rounded-t-xl bg-gradient-to-t from-violet-700 to-violet-400" style={{ height: `${Math.max(4, row.amount / max * 150)}px` }} /><small className="mt-2 whitespace-nowrap text-[10px] text-[var(--muted)]">{row.label.replace(" 2026", "")}</small></div>)}</div></section>;
}

function Budget({ report }: { report: BudgetVarianceReport | null }) {
  const summary = report?.summary;
  return <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Budget total" value={summary ? formatMoney(summary.budget_total, report?.currency) : "-"} /><Metric label="Realise commande" value={summary ? formatMoney(summary.actual_total, report?.currency) : "-"} /><Metric label="Ecart global" value={summary ? formatMoney(summary.variance_total, report?.currency) : "-"} tone={(summary?.variance_total ?? 0) > 0 ? "danger" : "success"} /><Metric label="Dossiers en depassement" value={String(summary?.over_budget_count ?? 0)} /></section><section className="app-panel overflow-hidden"><div className="border-b border-[var(--border)] p-4"><h2 className="m-0 text-base font-semibold">Detail des ecarts</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-sm"><thead className="bg-[var(--surface-soft)] text-left text-xs text-[var(--muted)]"><tr><th className="p-3">Commande</th><th className="p-3">Objet / service</th><th className="p-3">Fournisseur</th><th className="p-3 text-right">Budget</th><th className="p-3 text-right">Commande</th><th className="p-3 text-right">Ecart</th><th className="p-3">Alerte</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{report?.rows.map((row) => <tr key={row.purchase_order_id}><td className="p-3 font-semibold">{row.reference}<small className="block font-normal text-[var(--muted)]">{row.request_reference}</small></td><td className="p-3">{row.title}<small className="block text-[var(--muted)]">{row.service} · {row.cost_center}</small></td><td className="p-3">{row.supplier}</td><td className="p-3 text-right">{formatMoney(row.budget_amount, row.currency)}</td><td className="p-3 text-right">{formatMoney(row.actual_amount, row.currency)}</td><td className={`p-3 text-right font-semibold ${row.variance_amount > 0 ? "text-red-700" : "text-emerald-700"}`}>{row.variance_percent > 0 ? "+" : ""}{row.variance_percent} %</td><td className="p-3"><span className={`status-badge ${row.severity === "high" ? "bg-red-50 text-red-700" : row.severity === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{row.severity === "high" ? "A traiter" : row.severity === "medium" ? "A surveiller" : "Sous budget"}</span></td></tr>)}</tbody></table></div></section></div>;
}

function Suppliers({ report }: { report: SupplierPerformanceReport | null }) {
  return <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Fournisseurs analyses" value={String(report?.summary.supplier_count ?? 0)} /><Metric label="Sous surveillance" value={String(report?.summary.watched_count ?? 0)} tone="warning" /><Metric label="Risque eleve" value={String(report?.summary.high_risk_count ?? 0)} tone="danger" /><Metric label="Score moyen" value={`${report?.summary.average_score ?? 0} / 5`} tone="success" /></section><section className="grid gap-3 xl:grid-cols-2">{report?.rows.map((row) => <article className="app-panel p-4" key={row.supplier_id}><div className="flex items-start gap-3"><span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${row.risk_level === "high" ? "bg-red-50 text-red-700" : row.risk_level === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{row.risk_level === "low" ? <CheckCircle2 size={19} /> : <ShieldAlert size={19} />}</span><span className="min-w-0 flex-1"><strong className="block truncate">{row.supplier}</strong><small className="text-[var(--muted)]">{row.category} · score {row.score || "-"}/5</small></span><span className={`status-badge ${row.risk_level === "high" ? "bg-red-50 text-red-700" : row.risk_level === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{row.risk_level === "high" ? "Risque eleve" : row.risk_level === "medium" ? "Surveillance" : "Maitrise"}</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><Mini label="CA realise" value={formatMoney(row.revenue, report.currency)} /><Mini label="Commandes" value={String(row.order_count)} /><Mini label="A l'heure" value={`${row.on_time_rate} %`} /><Mini label="Conformite" value={`${row.conformity_rate} %`} /></div>{row.risk_level !== "low" ? <p className="mb-0 mt-3 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-900">{row.late_orders} retard(s), {row.cancelled_orders} annulation(s), {row.disputes} litige(s). Action de suivi recommandee.</p> : null}</article>)}</section></div>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "danger" }) { const color = tone === "danger" ? "text-red-700" : tone === "warning" ? "text-amber-700" : tone === "success" ? "text-emerald-700" : "text-[var(--ink)]"; return <article className="app-panel p-4"><span className="text-sm text-[var(--muted)]">{label}</span><strong className={`mt-2 block text-xl ${color}`}>{value}</strong></article>; }
function Mini({ label, value }: { label: string; value: string }) { return <span><small className="block text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</small><strong className="mt-1 block text-sm">{value}</strong></span>; }
