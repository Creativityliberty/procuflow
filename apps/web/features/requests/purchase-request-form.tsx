"use client";

import { CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPurchaseRequest, getAcdeNeed, submitPurchaseRequest, uploadPurchaseRequestDocument } from "@/lib/procuflow-api";
import type { AcdeNeedRecord } from "@/lib/types";

type LineItem = { id: number; description: string; quantity: number; unit: string; estimated_unit_price: number; specifications?: string };

export function PurchaseRequestForm() {
  const [result, setResult] = useState<{ reference: string; status: string; warning?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ id: 1, description: "", quantity: 1, unit: "unite", estimated_unit_price: 0 }]);
  const [sourceNeed, setSourceNeed] = useState<AcdeNeedRecord | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);

  useEffect(() => {
    const sourceId = new URLSearchParams(window.location.search).get("acde");
    if (!sourceId) return;
    setPrefillLoading(true);
    getAcdeNeed(sourceId)
      .then((need) => {
        setSourceNeed(need);
        const dataTarget = need.items.find((item) => item.kind === "data" && item.target_value && Number(item.target_value) > 0);
        const quantity = dataTarget ? Number(dataTarget.target_value) : 1;
        const acceptedUnits = ["unite", "lot", "service", "mois", "kg", "litre"];
        const unit = dataTarget?.unit && acceptedUnits.includes(dataTarget.unit.toLowerCase()) ? dataTarget.unit.toLowerCase() : "unite";
        const specifications = need.items
          .filter((item) => item.kind === "constraint" || item.kind === "requirement")
          .map((item) => {
            const level = item.priority_level === "mandatory" ? "OBLIGATOIRE" : item.priority_level === "desired" ? "SOUHAITE" : "CONFORT";
            const smart = [item.criterion, item.target_value, item.unit, item.tolerance, item.verification_method].filter(Boolean).join(" | ");
            return `[${level}] ${item.content}${smart ? ` — ${smart}` : ""}`;
          })
          .join("\n");
        setItems([{ id: 1, description: need.title, quantity, unit, estimated_unit_price: Number(need.budget_amount || 0) / quantity, specifications }]);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Le besoin source est introuvable."))
      .finally(() => setPrefillLoading(false));
  }, []);

  function updateItem(id: number, field: keyof LineItem, value: string | number) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData);
    const attachments = formData.getAll("documents").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    delete values.documents;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;

    let draft: Awaited<ReturnType<typeof createPurchaseRequest>> | null = null;
    try {
      draft = await createPurchaseRequest({
        ...values,
        action: "draft",
        acde_need_id: sourceNeed?.id ?? null,
        currency: sourceNeed?.currency || "XAF",
        items: items.map(({ id: _id, ...item }) => item)
      });
      for (const file of attachments) await uploadPurchaseRequestDocument(draft.id, file);
      const request = submitter?.value === "submit" ? await submitPurchaseRequest(draft.id) : draft;
      setResult(request);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Enregistrement impossible.";
      if (draft) setResult({ ...draft, warning: `Le brouillon est créé, mais l'opération n'a pas été terminée : ${message}` });
      else setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const submitted = result.status === "pending";
    return (
      <section className="app-panel grid min-h-72 place-items-center p-6 text-center">
        <div>
          <CheckCircle2 className="mx-auto text-emerald-600" size={40} />
          <h2 className="mb-1 mt-4 text-lg font-semibold">Demande {result.reference} enregistree</h2>
          <p className={`m-0 text-sm ${result.warning ? "text-amber-700" : "text-[var(--muted)]"}`}>{result.warning || (submitted ? "Elle a ete transmise au premier valideur." : "Elle est en brouillon et peut encore etre modifiee.")}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3"><Link href="/purchase-requests" className="primary-button">Voir les demandes</Link><button type="button" className="secondary-button" onClick={() => setResult(null)}>Creer une autre</button></div>
        </div>
      </section>
    );
  }

  if (prefillLoading) return <div className="app-panel h-72 animate-pulse" aria-label="Chargement du besoin ACDE" />;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <section className="app-panel p-5">
        <h2 className="m-0 text-base font-semibold">Informations de la demande</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2"><span className="field-label">Objet de la demande *</span><input className="field-control" name="title" defaultValue={sourceNeed?.title || ""} placeholder="Ex. Renouvellement des ordinateurs du service finance" required /></label>
          <label><span className="field-label">Service demandeur *</span><select className="field-control" name="service" required defaultValue={sourceNeed?.service || ""}><option value="" disabled>Selectionner</option><option>Administration</option><option>Finance</option><option>Informatique</option><option>Operations</option><option>Ressources humaines</option></select></label>
          <label><span className="field-label">Centre de cout *</span><select className="field-control" name="cost_center" required defaultValue=""><option value="" disabled>Selectionner</option><option>CC-100 Direction</option><option>CC-210 Finance</option><option>CC-320 Operations</option></select></label>
          <label><span className="field-label">Priorite</span><select className="field-control" name="priority" defaultValue={sourceNeed?.priority || "normal"}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></label>
          <label><span className="field-label">Date souhaitee</span><input className="field-control" name="needed_at" type="date" defaultValue={sourceNeed?.needed_at?.slice(0, 10) || ""} /></label>
          <label><span className="field-label">Lieu de livraison</span><input className="field-control" name="delivery_location" defaultValue={sourceNeed?.delivery_location || ""} placeholder="Ex. Entrepot central, Douala" /></label>
          <label className="md:col-span-2"><span className="field-label">Justification *</span><textarea className="field-control min-h-24 resize-y" name="reason" defaultValue={sourceNeed?.context || ""} placeholder="Pourquoi cet achat est-il necessaire ?" required /></label>
        </div>
      </section>

      <section className="app-panel p-5">
        <h2 className="m-0 text-base font-semibold">Pieces justificatives</h2>
        <p className="mb-3 mt-1 text-xs text-[var(--muted)]">Devis, note technique, photo ou document utile. Les fichiers du besoin ACDE source restent egalement accessibles dans le dossier.</p>
        <input className="field-control" name="documents" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
      </section>

      <section className="app-panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <div><h2 className="m-0 text-base font-semibold">Articles demandes</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Ajoutez au moins un article ou service.</p></div>
          <button type="button" className="secondary-button" onClick={() => setItems((current) => [...current, { id: Date.now(), description: "", quantity: 1, unit: "unite", estimated_unit_price: 0 }])}><Plus size={16} /> Ajouter une ligne</button>
        </div>
        <div className="space-y-3 p-4">
          {items.map((item, index) => (
            <div className="rounded-xl border border-[var(--border)] bg-white/45 p-3" key={item.id}>
              <div className="grid gap-3 md:grid-cols-[36px_1fr_105px_125px_150px_38px] md:items-end">
                <span className="grid h-10 place-items-center text-sm font-semibold text-[var(--muted)]">{index + 1}</span>
                <label><span className="field-label">Designation *</span><input className="field-control" value={item.description} onChange={(event) => updateItem(item.id, "description", event.target.value)} required /></label>
                <label><span className="field-label">Quantite</span><input className="field-control" type="number" min="0.001" step="0.001" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", Number(event.target.value))} required /></label>
                <label><span className="field-label">Unite</span><select className="field-control" value={item.unit} onChange={(event) => updateItem(item.id, "unit", event.target.value)}><option value="unite">Unite</option><option value="lot">Lot</option><option value="service">Service</option><option value="mois">Mois</option><option value="kg">Kg</option><option value="litre">Litre</option></select></label>
                <label><span className="field-label">Prix estime</span><input className="field-control" type="number" min="0" step="1" value={item.estimated_unit_price} onChange={(event) => updateItem(item.id, "estimated_unit_price", Number(event.target.value))} /></label>
                <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-30" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} disabled={items.length === 1} aria-label={`Supprimer la ligne ${index + 1}`}><Trash2 size={17} /></button>
              </div>
              <label className="mt-3 block md:ml-12"><span className="field-label">Specifications</span><textarea className="field-control min-h-16 resize-y" value={item.specifications || ""} onChange={(event) => updateItem(item.id, "specifications", event.target.value)} placeholder="Caracteristiques, contraintes ou exigences de cette ligne." /></label>
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-3"><Link href="/purchase-requests" className="secondary-button">Annuler</Link><button type="submit" value="draft" className="secondary-button disabled:cursor-wait disabled:opacity-70" disabled={loading}><Save size={17} /> Enregistrer le brouillon</button><button type="submit" value="submit" className="primary-button disabled:cursor-wait disabled:opacity-70" disabled={loading}>{loading ? "Enregistrement..." : "Envoyer en validation"}</button></div>
    </form>
  );
}
