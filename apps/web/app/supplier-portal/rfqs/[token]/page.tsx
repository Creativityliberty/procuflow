"use client";

import { AlertTriangle, CheckCircle2, Clock3, Save, Send, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { formatMoney } from "@/lib/format";
import { getSupplierPortal, saveSupplierOffer, submitSupplierOffer } from "@/lib/procuflow-api";
import type { OfferRequirementResponseRecord, PortalRfqData, SupplierOfferItemRecord } from "@/lib/types";

const levelLabels = { mandatory: "Obligatoire", desired: "Souhaitée", comfort: "Confort" };
const responseLabels = { compliant: "Conforme", partial: "Partiellement conforme", non_compliant: "Non conforme", not_applicable: "Non applicable" };

export default function SupplierPortal() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalRfqData | null>(null);
  const [items, setItems] = useState<SupplierOfferItemRecord[]>([]);
  const [requirements, setRequirements] = useState<OfferRequirementResponseRecord[]>([]);
  const [transport, setTransport] = useState(0);
  const [lead, setLead] = useState(7);
  const [validity, setValidity] = useState(30);
  const [warranty, setWarranty] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hydrate = useCallback((portal: PortalRfqData) => {
    setData(portal);
    const existingItems = new Map(portal.offer?.items.map((item) => [item.rfq_item_id, item]) ?? []);
    setItems((portal.rfq.items ?? []).map((item) => existingItems.get(item.id) ?? { rfq_item_id: item.id, quantity: item.quantity, unit_price: 0, discount_percent: 0, tax_percent: 0, is_compliant: true }));
    const existingResponses = new Map(portal.offer?.requirement_responses?.map((response) => [response.rfq_requirement_id, response]) ?? []);
    setRequirements((portal.rfq.requirements ?? []).map((requirement) => existingResponses.get(requirement.id) ?? { rfq_requirement_id: requirement.id, status: "compliant", response: "", evidence_reference: "" }));
    if (portal.offer) {
      setTransport(portal.offer.transport_cost);
      setLead(portal.offer.lead_time_days ?? 7);
      setValidity(portal.offer.validity_days);
      setWarranty(portal.offer.warranty ?? "");
    }
  }, []);

  useEffect(() => { getSupplierPortal(token).then(hydrate).catch((cause) => setError(cause instanceof Error ? cause.message : "Invitation indisponible.")); }, [hydrate, token]);

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity) * item.unit_price * (1 - Number(item.discount_percent) / 100) * (1 + Number(item.tax_percent) / 100), transport), [items, transport]);
  const mandatoryGap = useMemo(() => (data?.rfq.requirements ?? []).some((requirement) => requirement.priority_level === "mandatory" && requirements.find((response) => response.rfq_requirement_id === requirement.id)?.status !== "compliant"), [data, requirements]);

  function payload() {
    return { currency: data?.rfq.currency ?? "XAF", transport_cost: transport, insurance_cost: 0, lead_time_days: lead, validity_days: validity, warranty: warranty || undefined, items, requirements };
  }

  async function save() {
    setSaving(true);
    try { hydrate(await saveSupplierOffer(token, payload())); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }

  async function submit() {
    setSaving(true);
    try { await saveSupplierOffer(token, payload()); hydrate(await submitSupplierOffer(token)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Envoi impossible."); }
    finally { setSaving(false); }
  }

  return <main className="min-h-screen bg-[var(--bg)]">
    <header className="bg-[#1d1724] text-white"><div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4"><BrandMark /><span><strong className="brand-wordmark block">ProcuFlow</strong><small className="text-white/55">Portail fournisseur</small></span><span className="ml-auto flex items-center gap-2 text-xs text-white/60"><ShieldCheck size={16} /> Accès privé</span></div></header>
    <div className="mx-auto max-w-6xl space-y-4 p-4 py-7">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {!data ? <div className="app-panel h-80 animate-pulse" /> : <>
        <section className="app-panel p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="mb-1 mt-0 text-xs font-semibold text-[var(--violet)]">{data.rfq.reference}</p><h1 className="m-0 text-2xl font-bold">{data.rfq.title}</h1><p className="mb-0 mt-2 text-sm text-[var(--muted)]">{data.rfq.description || "Renseignez votre meilleure offre et la conformité au cahier des charges."}</p></div><span className="status-badge bg-violet-50 text-violet-700">{data.invitation.status === "submitted" ? "Offre envoyée" : "Réponse attendue"}</span></div><p className="mb-0 mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4 text-sm"><Clock3 size={16} /> Avant le <strong>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(data.rfq.response_deadline))}</strong></p></section>
        {data.invitation.status === "submitted" ? <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 size={17} /> Votre offre a bien été reçue. Vous pouvez encore la corriger avant l&apos;échéance.</p> : null}

        <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <article className="app-panel overflow-hidden"><h2 className="m-0 border-b border-[var(--border)] p-4 text-base font-semibold">Votre offre financière</h2>{data.rfq.items?.map((rfqItem, index) => <div className="grid gap-3 border-t border-[var(--border)] p-4 md:grid-cols-[1fr_130px_100px_100px] md:items-end" key={rfqItem.id}><div><strong className="block text-sm">{rfqItem.description}</strong><small className="text-[var(--muted)]">{rfqItem.quantity} {rfqItem.unit}</small></div><label><span className="field-label">Prix unitaire</span><input className="field-control" type="number" min="0" value={items[index]?.unit_price ?? 0} onChange={(event) => setItems((all) => all.map((item, position) => position === index ? { ...item, unit_price: Number(event.target.value) } : item))} /></label><label><span className="field-label">Remise %</span><input className="field-control" type="number" min="0" max="100" value={items[index]?.discount_percent ?? 0} onChange={(event) => setItems((all) => all.map((item, position) => position === index ? { ...item, discount_percent: Number(event.target.value) } : item))} /></label><label><span className="field-label">Taxe %</span><input className="field-control" type="number" min="0" max="100" value={items[index]?.tax_percent ?? 0} onChange={(event) => setItems((all) => all.map((item, position) => position === index ? { ...item, tax_percent: Number(event.target.value) } : item))} /></label></div>)}</article>

            {(data.rfq.requirements?.length ?? 0) > 0 ? <article className="app-panel overflow-hidden"><div className="border-b border-[var(--border)] p-4"><h2 className="m-0 text-base font-semibold">Matrice de conformité</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Répondez séparément à chaque attente, contrainte, donnée et exigence.</p></div>{data.rfq.requirements?.map((requirement, index) => <div className="border-t border-[var(--border)] p-4" key={requirement.id}><div className="flex flex-wrap items-start justify-between gap-2"><div><strong className="block text-sm">{requirement.content}</strong><small className="text-[var(--muted)]">{requirement.criterion ? `${requirement.criterion} · ` : ""}{requirement.target_value ? `Cible ${requirement.target_value} ${requirement.unit ?? ""}` : ""}</small></div><span className={`status-badge ${requirement.priority_level === "mandatory" ? "bg-red-50 text-red-700" : "bg-violet-50 text-violet-700"}`}>{levelLabels[requirement.priority_level]}</span></div><div className="mt-3 grid gap-3 md:grid-cols-3"><label><span className="field-label">Votre conformité</span><select className="field-control" value={requirements[index]?.status ?? "compliant"} onChange={(event) => setRequirements((all) => all.map((response, position) => position === index ? { ...response, status: event.target.value as OfferRequirementResponseRecord["status"] } : response))}>{Object.entries(responseLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span className="field-label">Réponse / précision</span><input className="field-control" value={requirements[index]?.response ?? ""} onChange={(event) => setRequirements((all) => all.map((response, position) => position === index ? { ...response, response: event.target.value } : response))} placeholder="Décrivez votre solution" /></label><label><span className="field-label">Preuve ou référence</span><input className="field-control" value={requirements[index]?.evidence_reference ?? ""} onChange={(event) => setRequirements((all) => all.map((response, position) => position === index ? { ...response, evidence_reference: event.target.value } : response))} placeholder="Certificat, page du devis..." /></label></div></div>)}</article> : null}

            <article className="app-panel p-5"><h2 className="m-0 text-base font-semibold">Conditions commerciales</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="field-label">Délai de livraison (jours)</span><input className="field-control" type="number" min="0" value={lead} onChange={(event) => setLead(Number(event.target.value))} /></label><label><span className="field-label">Validité (jours)</span><input className="field-control" type="number" min="1" value={validity} onChange={(event) => setValidity(Number(event.target.value))} /></label><label><span className="field-label">Transport</span><input className="field-control" type="number" min="0" value={transport} onChange={(event) => setTransport(Number(event.target.value))} /></label><label><span className="field-label">Garantie et SAV</span><input className="field-control" value={warranty} onChange={(event) => setWarranty(event.target.value)} /></label></div></article>
          </div>

          <aside><section className="app-panel sticky top-4 p-4"><h2 className="m-0 text-base font-semibold">Récapitulatif</h2><p className="text-sm text-[var(--muted)]">Total de votre proposition</p><strong className="text-xl text-[var(--violet)]">{formatMoney(Math.round(total), data.rfq.currency)}</strong>{mandatoryGap ? <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><AlertTriangle className="flex-none" size={16} /> Votre offre contient une non-conformité obligatoire et ne pourra pas être recommandée.</p> : <p className="mt-4 flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="flex-none" size={16} /> Toutes les exigences obligatoires sont déclarées conformes.</p>}<div className="mt-4 space-y-2"><button className="secondary-button w-full" disabled={saving || !data.is_open} onClick={() => void save()}><Save size={16} /> Enregistrer</button><button className="primary-button w-full" disabled={saving || !data.is_open} onClick={() => void submit()}><Send size={16} /> Envoyer l&apos;offre</button></div>{data.offer?.current_version ? <p className="mb-0 mt-3 text-xs text-[var(--muted)]">Version {data.offer.current_version} conservée</p> : null}</section></aside>
        </section>
      </>}
    </div>
  </main>;
}
