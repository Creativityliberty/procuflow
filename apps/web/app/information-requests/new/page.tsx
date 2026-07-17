"use client";

import { ArrowLeft, Check, FileUp, Search, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { createInformationRequest, getSuppliers, uploadInformationRequestDocument } from "@/lib/procuflow-api";
import type { SupplierRecord } from "@/lib/types";

function tomorrowAtNoon() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(12, 0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function NewInformationRequestPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState({ subject: "", description: "", response_deadline: tomorrowAtNoon() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSuppliers({ status: "active" })
      .then((result) => setSuppliers(result.data.filter((supplier) => Boolean(supplier.email))))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Chargement des fournisseurs impossible."));
  }, []);

  const categories = useMemo(() => [...new Set(suppliers.map((supplier) => supplier.category).filter(Boolean) as string[])].sort(), [suppliers]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return suppliers.filter((supplier) => (!category || supplier.category === category) && (!needle || `${supplier.legal_name} ${supplier.email} ${supplier.city ?? ""}`.toLowerCase().includes(needle)));
  }, [category, search, suppliers]);

  function toggle(id: number) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected.length) return setError("Selectionnez au moins un fournisseur.");
    setBusy(true);
    setError("");
    try {
      const request = await createInformationRequest({ ...form, category: category || undefined, supplier_ids: selected });
      for (const file of files) await uploadInformationRequestDocument(request.id, file);
      router.push(`/information-requests/${request.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Creation impossible.");
    } finally {
      setBusy(false);
    }
  }

  return <AppShell><div className="space-y-5">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]" href="/information-requests"><ArrowLeft size={16}/>Retour aux demandes</Link>
    <PageHeading eyebrow="Sourcing / Nouvelle RFI" title="Nouvelle demande d'information" description="Posez une question structurée à plusieurs fournisseurs et centralisez toutes les réponses."/>
    <form className="grid gap-4 xl:grid-cols-[1fr_390px]" onSubmit={submit}>
      <div className="space-y-4">
        <section className="app-panel space-y-4 p-5">
          <Field label="Objet de la demande"><input required maxLength={255} className="field-control" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Capacités de maintenance préventive 2026"/></Field>
          <Field label="Description et informations attendues"><textarea required minLength={10} className="field-control min-h-44" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Précisez le contexte, les questions, le format de réponse et les preuves attendues."/></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Date limite de réponse"><input required type="datetime-local" min={tomorrowAtNoon()} className="field-control" value={form.response_deadline} onChange={(event) => setForm({ ...form, response_deadline: event.target.value })}/></Field>
            <Field label="Famille achats"><select className="field-control" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Toutes les catégories</option>{categories.map((value) => <option value={value} key={value}>{value}</option>)}</select></Field>
          </div>
          <Field label="Documents à transmettre (20 Mo maximum par fichier)"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 p-5 text-sm font-semibold text-violet-700"><FileUp size={18}/>Ajouter des pièces<input className="sr-only" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => setFiles(Array.from(event.target.files ?? []))}/></label>{files.length ? <small className="mt-2 block text-[var(--muted)]">{files.map((file) => file.name).join(" · ")}</small> : null}</Field>
        </section>
      </div>
      <aside className="space-y-4">
        <section className="app-panel overflow-hidden">
          <div className="border-b border-[var(--border)] p-4"><div className="flex items-center justify-between gap-2"><strong>Fournisseurs destinataires</strong><span className="status-badge bg-violet-50 text-violet-700">{selected.length} sélectionné(s)</span></div><label className="relative mt-3 block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={15}/><input className="field-control pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher"/></label></div>
          <div className="max-h-[430px] divide-y divide-[var(--border)] overflow-y-auto">{filtered.map((supplier) => {const active = selected.includes(supplier.id); return <button type="button" className={`flex w-full items-center gap-3 p-4 text-left hover:bg-[var(--surface-soft)] ${active ? "bg-violet-50/60" : ""}`} onClick={() => toggle(supplier.id)} key={supplier.id}><span className={`grid h-8 w-8 flex-none place-items-center rounded-xl border ${active ? "border-violet-600 bg-violet-600 text-white" : "border-[var(--border)]"}`}>{active ? <Check size={15}/> : supplier.legal_name.slice(0, 1)}</span><span className="min-w-0"><strong className="block truncate text-sm">{supplier.legal_name}</strong><small className="block truncate text-[var(--muted)]">{supplier.email} · {supplier.category ?? "Non classé"}</small></span></button>})}{!filtered.length ? <p className="m-0 p-5 text-center text-sm text-[var(--muted)]">Aucun fournisseur actif avec une adresse e-mail.</p> : null}</div>
        </section>
        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <button className="primary-button w-full" disabled={busy || !selected.length}><Send size={16}/>{busy ? "Création..." : "Créer le brouillon"}</button>
      </aside>
    </form>
  </div></AppShell>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label><span className="field-label">{label}</span>{children}</label>;
}
