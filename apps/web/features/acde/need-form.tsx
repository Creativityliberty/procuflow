"use client";

import { CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createAcdeNeed, uploadAcdeDocument } from "@/lib/procuflow-api";
import type { AcdeItemRecord, AcdeKind } from "@/lib/types";

const sections: Array<{ kind: AcdeKind; title: string; help: string; placeholder: string }> = [
  { kind: "expectation", title: "A — Attentes", help: "Résultats ou performances attendus.", placeholder: "Ex. Réduire de 20 % le temps de traitement." },
  { kind: "constraint", title: "C — Contraintes externes", help: "Normes, législation et environnement obligatoires.", placeholder: "Ex. Respect de la réglementation HSE locale." },
  { kind: "data", title: "D — Données", help: "Volumes, quantités, délais et lieux nécessaires à l'offre.", placeholder: "Ex. 12 postes à livrer à Douala." },
  { kind: "requirement", title: "E — Exigences internes", help: "Impératifs non négociables ; une offre non conforme sera rejetée.", placeholder: "Ex. Garantie minimale de 3 ans." },
];

type DraftItem = AcdeItemRecord & { key: number };

const initialItems = sections.map((section, index): DraftItem => ({
  key: index + 1,
  kind: section.kind,
  priority_level: "mandatory",
  content: "",
  criterion: "",
  target_value: "",
  unit: "",
  tolerance: "",
  verification_method: "",
  position: index,
}));

export function NeedForm() {
  const [savedId, setSavedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState(initialItems);

  function update(key: number, field: keyof DraftItem, value: string) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, [field]: value } : item));
  }

  function add(kind: AcdeKind) {
    setItems((current) => [...current, {
      key: Date.now(), kind, priority_level: "mandatory", content: "", criterion: "", target_value: "", unit: "", tolerance: "", verification_method: "", position: current.length,
    }]);
  }

  function remove(key: number, kind: AcdeKind) {
    if (items.filter((item) => item.kind === kind).length === 1) return;
    setItems((current) => current.filter((item) => item.key !== key));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const need = await createAcdeNeed({
        title: String(values.get("title")),
        context: String(values.get("context") || "") || null,
        service: String(values.get("service") || "") || null,
        needed_at: String(values.get("needed_at") || "") || null,
        priority: String(values.get("priority") || "normal") as "low" | "normal" | "high" | "urgent",
        budget_amount: Number(values.get("budget_amount") || 0) || null,
        currency: String(values.get("currency") || "XAF"),
        delivery_location: String(values.get("delivery_location") || "") || null,
        items: items.map(({ key: _key, ...item }, position) => ({ ...item, position })),
      });
      setSavedId(need.id);
      const files = values.getAll("documents").filter((value): value is File => value instanceof File && value.size > 0);
      for (const file of files) await uploadAcdeDocument(need.id, file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Enregistrement impossible.");
    } finally {
      setLoading(false);
    }
  }

  if (savedId) return (
    <section className="app-panel grid min-h-72 place-items-center p-6 text-center">
      <div>
        <CheckCircle2 className="mx-auto text-emerald-600" size={40} />
        <h2 className="mb-1 mt-4 text-lg font-semibold">Cahier des charges enregistré</h2>
        <p className={`m-0 text-sm ${error ? "text-amber-700" : "text-[var(--muted)]"}`}>
          {error ? `Le dossier est créé, mais un fichier n'a pas été ajouté : ${error}` : "Les critères SMART, pondérations et pièces jointes sont conservés."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href={`/acde/${savedId}`} className="primary-button">Ouvrir le cahier des charges</Link>
          <Link href={`/purchase-requests/new?acde=${savedId}`} className="secondary-button">Créer la demande d&apos;achat</Link>
        </div>
      </div>
    </section>
  );

  return (
    <form className="space-y-5" onSubmit={submit}>
      <section className="app-panel p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2"><span className="field-label">Titre du besoin *</span><input className="field-control" name="title" required /></label>
          <label><span className="field-label">Service</span><select className="field-control" name="service"><option>Administration</option><option>Finance</option><option>Informatique</option><option>Opérations</option><option>Ressources humaines</option></select></label>
          <label><span className="field-label">Priorité globale</span><select className="field-control" name="priority" defaultValue="normal"><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></label>
          <label><span className="field-label">Budget indicatif</span><div className="grid grid-cols-[1fr_90px] gap-2"><input className="field-control" min={0} name="budget_amount" type="number" /><select className="field-control" name="currency"><option>XAF</option><option>EUR</option><option>USD</option></select></div></label>
          <label><span className="field-label">Date souhaitée</span><input className="field-control" name="needed_at" type="date" /></label>
          <label><span className="field-label">Lieu de livraison</span><input className="field-control" name="delivery_location" placeholder="Douala, Bonamoussadi" /></label>
          <label><span className="field-label">Contexte</span><textarea className="field-control min-h-20" name="context" /></label>
        </div>
      </section>

      {sections.map((section) => (
        <section className="app-panel overflow-hidden" key={section.kind}>
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
            <div><h2 className="m-0 text-base font-semibold">{section.title}</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">{section.help}</p></div>
            <button type="button" className="secondary-button" onClick={() => add(section.kind)}><Plus size={15} /> Ajouter</button>
          </div>
          <div className="space-y-3 p-4">
            {items.filter((item) => item.kind === section.kind).map((item, index) => (
              <article className="rounded-xl border border-[var(--border)] bg-white/50 p-4" key={item.key}>
                <div className="flex justify-between gap-3"><strong className="text-sm">Élément {index + 1}</strong><button type="button" className="text-red-600 disabled:opacity-30" disabled={items.filter((row) => row.kind === section.kind).length === 1} onClick={() => remove(item.key, section.kind)} aria-label="Supprimer"><Trash2 size={16} /></button></div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="md:col-span-2"><span className="field-label">Description *</span><textarea className="field-control min-h-20" required placeholder={section.placeholder} value={item.content} onChange={(event) => update(item.key, "content", event.target.value)} /></label>
                  <label><span className="field-label">Niveau</span><select className="field-control" value={item.priority_level} onChange={(event) => update(item.key, "priority_level", event.target.value)}><option value="mandatory">Obligatoire</option><option value="desired">Souhaitée</option><option value="comfort">De confort</option></select></label>
                  <label><span className="field-label">Critère mesurable</span><input className="field-control" value={item.criterion ?? ""} onChange={(event) => update(item.key, "criterion", event.target.value)} placeholder="Ex. Durée de garantie" /></label>
                  <label><span className="field-label">Cible</span><input className="field-control" value={item.target_value ?? ""} onChange={(event) => update(item.key, "target_value", event.target.value)} placeholder="3" /></label>
                  <label><span className="field-label">Unité</span><input className="field-control" value={item.unit ?? ""} onChange={(event) => update(item.key, "unit", event.target.value)} placeholder="ans, %, jours..." /></label>
                  <label><span className="field-label">Tolérance</span><input className="field-control" value={item.tolerance ?? ""} onChange={(event) => update(item.key, "tolerance", event.target.value)} placeholder="Ex. ± 2 %" /></label>
                  <label><span className="field-label">Méthode de vérification</span><input className="field-control" value={item.verification_method ?? ""} onChange={(event) => update(item.key, "verification_method", event.target.value)} placeholder="Certificat, test, contrôle..." /></label>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="app-panel p-5"><label><span className="field-label">Pièces jointes</span><input className="field-control" multiple name="documents" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" /><small className="mt-2 block text-[var(--muted)]">Plans, photos, normes, devis ou documents techniques — 20 Mo maximum par fichier.</small></label></section>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex justify-end gap-3"><Link href="/acde" className="secondary-button">Annuler</Link><button className="primary-button" disabled={loading}><Save size={17} />{loading ? "Enregistrement..." : "Enregistrer le cahier des charges"}</button></div>
    </form>
  );
}
