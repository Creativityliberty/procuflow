"use client";

import { ArrowRight, CalendarDays, CircleDollarSign, ListChecks, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { priorityLabels } from "@/lib/format";
import { getAcdeNeeds } from "@/lib/procuflow-api";
import type { AcdeNeedRecord } from "@/lib/types";

const questions = [
  { title: "Quel resultat attendez-vous ?", text: "Objectif et niveau de performance souhaite", icon: ListChecks },
  { title: "Quelles limites externes respecter ?", text: "Normes, legislation, environnement et risques", icon: ShieldCheck },
  { title: "Quels sont les chiffres utiles ?", text: "Quantite, budget, lieu et date souhaitee", icon: CircleDollarSign },
  { title: "Qu'est-ce qui est non negociable ?", text: "Criteres internes imposes au fournisseur", icon: CalendarDays }
];

export default function AcdePage() {
  const [needs, setNeeds] = useState<AcdeNeedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAcdeNeeds().then((response) => setNeeds(response.data)).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell><div className="space-y-5">
      <PageHeading title="Expression du besoin" description="Repondez a quatre questions simples pour preparer une demande claire." action="Decrire un besoin" actionHref="/acde/new" />
      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="app-panel p-4"><h2 className="m-0 text-base font-semibold">Les 4 points a preciser</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{questions.map((question, index) => { const Icon = question.icon; return <div className="flex gap-3 rounded-xl border border-[var(--border)] p-4" key={question.title}><span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-[var(--violet-soft)] text-[var(--violet)]"><Icon size={18} /></span><span><small className="font-semibold text-[var(--violet)]">Question {index + 1}</small><strong className="mt-1 block text-sm">{question.title}</strong><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{question.text}</span></span></div>; })}</div></div>
        <aside className="app-panel overflow-hidden">
          <div className="border-b border-[var(--border)] p-4"><h2 className="m-0 text-base font-semibold">Besoins enregistres</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Chaque dossier conserve sa matrice complete.</p></div>
          <div className="divide-y divide-[var(--border)]">
            {loading ? <div className="space-y-2 p-4">{[1, 2].map((row) => <div className="h-16 animate-pulse rounded-xl bg-[var(--surface-soft)]" key={row} />)}</div> : needs.length === 0 ? <div className="p-5 text-center"><strong className="block text-sm">Aucun besoin</strong><Link className="primary-button mt-4" href="/acde/new">Decrire un besoin</Link></div> : needs.map((need) => <Link href={`/acde/${need.id}`} className="flex items-center gap-3 p-4 hover:bg-[var(--surface-soft)]" key={need.id}><span className="min-w-0 flex-1"><strong className="block text-sm">{need.title}</strong><small className="mt-1 block text-[var(--muted)]">{need.service || "Service non precise"} - Priorite {priorityLabels[need.priority || "normal"]}</small><span className="status-badge mt-2 bg-[var(--violet-soft)] text-[var(--violet)]">{need.items.length} informations ACDE</span></span><ArrowRight size={16} className="text-[var(--muted)]" /></Link>)}
          </div>
        </aside>
      </section>
    </div></AppShell>
  );
}
