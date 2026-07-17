"use client";

import { FileCheck2, GitCompareArrows, RefreshCw, Send } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { getRfqs } from "@/lib/procuflow-api";
import type { RfqRecord } from "@/lib/types";

const labels = { draft: "Brouillon", published: "En cours", closed: "Cloturee", cancelled: "Annulee" };

export default function RfqsPage() {
  const [rows, setRows] = useState<RfqRecord[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await getRfqs({ status: status || undefined })).data); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Chargement impossible."); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);

  return <AppShell><div className="space-y-5">
    <PageHeading title="Consultations fournisseurs" description="Invitez les fournisseurs, recevez leurs offres et suivez les reponses." action="Nouvelle consultation" actionHref="/rfqs/new"/>
    <section className="grid gap-3 sm:grid-cols-2">
      <article className="app-panel flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Send size={18}/></span><span><small className="block text-[var(--muted)]">En cours</small><strong className="text-xl">{rows.filter((row) => row.status === "published").length}</strong></span></article>
      <article className="app-panel flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><FileCheck2 size={18}/></span><span><small className="block text-[var(--muted)]">Offres recues</small><strong className="text-xl">{rows.reduce((sum, row) => sum + Number(row.submitted_offers_count ?? 0), 0)}</strong></span></article>
    </section>
    <section className="app-panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4"><h2 className="m-0 text-base font-semibold">Toutes les consultations</h2><select className="field-control max-w-44" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous les statuts</option><option value="draft">Brouillons</option><option value="published">En cours</option><option value="closed">Cloturees</option></select></div>
      {error ? <div className="p-8 text-center"><p className="text-red-700">{error}</p><button className="secondary-button" onClick={() => void load()}><RefreshCw size={16}/>Reessayer</button></div>
        : loading ? <div className="h-56 animate-pulse bg-[var(--surface-soft)]"/>
        : !rows.length ? <div className="p-8 text-center"><strong>Aucune consultation</strong><p className="text-sm text-[var(--muted)]">Commencez depuis une demande approuvee et controlee.</p><Link className="primary-button" href="/rfqs/new">Creer une consultation</Link></div>
        : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-[var(--surface-soft)] text-left text-xs text-[var(--muted)]"><tr><th className="p-3">Reference</th><th className="p-3">Objet</th><th className="p-3">Echeance</th><th className="p-3">Reponses</th><th className="p-3">Statut</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{rows.map((rfq) => <tr className="border-t border-[var(--border)]" key={rfq.id}><td className="p-3 font-semibold text-[var(--violet)]"><Link href={`/rfqs/${rfq.id}`}>{rfq.reference}</Link></td><td className="p-3"><Link href={`/rfqs/${rfq.id}`}>{rfq.title}</Link></td><td className="p-3 text-[var(--muted)]">{new Intl.DateTimeFormat("fr-FR").format(new Date(rfq.response_deadline))}</td><td className="p-3">{rfq.submitted_offers_count ?? 0} / {rfq.required_quote_count}</td><td className="p-3"><span className="status-badge bg-violet-50 text-violet-700">{labels[rfq.status]}</span></td><td className="p-3 text-right">{rfq.status === "closed" ? <Link className="secondary-button" href={`/rfqs/${rfq.id}/comparison`}><GitCompareArrows size={15}/>Comparer</Link> : <Link className="text-sm font-semibold text-violet-700" href={`/rfqs/${rfq.id}`}>Ouvrir</Link>}</td></tr>)}</tbody></table></div>}
    </section>
  </div></AppShell>;
}
