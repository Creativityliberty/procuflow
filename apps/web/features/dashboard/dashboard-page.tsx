"use client";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Circle,
  ClipboardPlus,
  PackageCheck,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PurchaseRequestTable } from "@/features/requests/purchase-request-table";
import { SupplierHealth } from "@/features/suppliers/supplier-health";
import { formatMoney } from "@/lib/format";
import { currentSession, getDashboard } from "@/lib/procuflow-api";
import type { DashboardData } from "@/lib/types";

const quickActions = [
  { title: "Ajouter un fournisseur", description: "Enregistrer ses coordonnees et documents", href: "/suppliers/new", icon: Building2 },
  { title: "Creer une demande d'achat", description: "Exprimer un besoin et lancer la validation", href: "/purchase-requests/new", icon: ClipboardPlus },
  { title: "Traiter mes validations", description: "Approuver ou rejeter les demandes en attente", href: "/approvals", icon: BadgeCheck }
];

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getDashboard(), currentSession()])
      .then(([dashboard, session]) => {
        setData(dashboard);
        setFirstName(session.user.name.split(" ")[0] || session.user.name);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Chargement impossible."));
  }, []);

  const metrics = [
    { label: "Validations a traiter", value: data ? String(data.pending_approvals) : "-", hint: "Etape actuellement actionnable", icon: BadgeCheck },
    { label: "Montant engage", value: data ? formatMoney(data.committed_amount_xaf) : "-", hint: "Demandes en cours et validees", icon: PackageCheck },
    { label: "Fournisseurs actifs", value: data ? String(data.active_suppliers) : "-", hint: "Dossiers disponibles pour consultation", icon: UsersRound },
    { label: "Demandes en validation", value: data ? String(data.pending_purchase_requests) : "-", hint: "Tous circuits confondus", icon: ClipboardPlus }
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm text-[var(--muted)]">Vue d'ensemble des achats</p>
          <h1 className="mb-0 mt-1 text-2xl font-bold">Bonjour{firstName ? `, ${firstName}` : ""}</h1>
        </div>
        <Link href="/onboarding" className="secondary-button">Configurer mon entreprise</Link>
      </header>

      {error ? <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs cles">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article className="app-panel p-4" key={metric.label}>
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-[var(--muted)]">{metric.label}</span>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--violet-soft)] text-[var(--violet)]"><Icon size={17} /></span>
              </div>
              <strong className="mt-2 block text-xl font-bold">{metric.value}</strong>
              <small className="mt-1 block text-xs text-[var(--muted)]">{metric.hint}</small>
            </article>
          );
        })}
      </section>

      <section className="app-panel p-4">
        <div className="mb-3">
          <h2 className="m-0 text-base font-semibold">Mettre l'espace en service</h2>
          <p className="mb-0 mt-1 text-sm text-[var(--muted)]">Les reglages essentiels restent accessibles a tout moment.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <Link href="/onboarding" className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--surface-soft)]">
            <CheckCircle2 size={19} className="flex-none text-emerald-600" /><span className="min-w-0 flex-1"><strong className="block text-sm">Informations entreprise</strong><small className="text-[var(--muted)]">Coordonnees et regles d'achat</small></span><ArrowRight size={16} className="text-[var(--muted)]" />
          </Link>
          <Link href="/suppliers/new" className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--surface-soft)]">
            {data?.active_suppliers ? <CheckCircle2 size={19} className="flex-none text-emerald-600" /> : <Circle size={19} className="flex-none text-[#aaa3af]" />}<span className="min-w-0 flex-1"><strong className="block text-sm">Premier fournisseur</strong><small className="text-[var(--muted)]">Coordonnees et dossier administratif</small></span><ArrowRight size={16} className="text-[var(--muted)]" />
          </Link>
          <Link href="/settings/workflows" className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--surface-soft)]">
            <CheckCircle2 size={19} className="flex-none text-emerald-600" /><span className="min-w-0 flex-1"><strong className="block text-sm">Circuit de validation</strong><small className="text-[var(--muted)]">Roles et seuils de montant</small></span><ArrowRight size={16} className="text-[var(--muted)]" />
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 mt-0 text-base font-semibold">Actions courantes</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return <Link href={action.href} className="app-panel flex items-center gap-3 p-4 hover:border-[#cfc9d6]" key={action.title}><span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[var(--violet-soft)] text-[var(--violet)]"><Icon size={19} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{action.title}</strong><small className="mt-0.5 block text-[var(--muted)]">{action.description}</small></span><ArrowRight size={17} className="text-[var(--muted)]" /></Link>;
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <PurchaseRequestTable limit={5} />
        <SupplierHealth />
      </section>
    </div>
  );
}
