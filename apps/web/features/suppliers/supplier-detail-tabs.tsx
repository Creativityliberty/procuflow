"use client";

import { AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";
import { useState } from "react";
import { supplierStatusLabels } from "@/lib/format";
import { evaluateSupplier, transitionSupplier, uploadSupplierDocument } from "@/lib/procuflow-api";
import type { SupplierEvaluationRecord, SupplierRecord } from "@/lib/types";

const tabs = ["Informations", "Documents", "Evaluation", "Historique"] as const;
type Tab = (typeof tabs)[number];
type ScoreKey = "credit_score" | "payment_terms_score" | "proximity_score" | "support_score" | "warranty_score" | "value_score";

const criteria: Array<{ key: ScoreKey; label: string }> = [
  { key: "credit_score", label: "Credit fournisseur" },
  { key: "payment_terms_score", label: "Delai de paiement" },
  { key: "proximity_score", label: "Proximite geographique" },
  { key: "support_score", label: "Assistance" },
  { key: "warranty_score", label: "Garantie et SAV" },
  { key: "value_score", label: "Rapport qualite/prix" }
];

const documentLabels: Record<string, string> = { rccm: "RCCM", niu: "NIU", tax_certificate: "Attestation fiscale", insurance: "Assurance", approval: "Agrement", other: "Autre document" };

export function SupplierDetailTabs({ supplier, onChange }: { supplier: SupplierRecord; onChange: () => Promise<void> }) {
  const [activeTab, setActiveTab] = useState<Tab>("Informations");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("rccm");
  const [expiresAt, setExpiresAt] = useState("");
  const [scores, setScores] = useState<Record<ScoreKey, number>>({ credit_score: 4, payment_terms_score: 4, proximity_score: 4, support_score: 4, warranty_score: 4, value_score: 4 });
  const [evaluationComment, setEvaluationComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const latestEvaluation = supplier.evaluations?.[0];

  async function run(action: () => Promise<unknown>, success: string) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await action();
      await onChange();
      setMessage(success);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    await run(() => uploadSupplierDocument(supplier.id, { document_type: documentType, file, expires_at: expiresAt || undefined }), "Document ajoute au dossier.");
    setFile(null);
    setUploadOpen(false);
  }

  async function handleEvaluation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: Omit<SupplierEvaluationRecord, "id" | "score" | "evaluator" | "created_at"> = { ...scores, comment: evaluationComment || null };
    await run(() => evaluateSupplier(supplier.id, payload), "Evaluation enregistree et score recalcule.");
  }

  const statusAction = supplier.status === "draft" ? { action: "submit" as const, label: "Envoyer en validation" } : supplier.status === "pending" ? { action: "approve" as const, label: "Valider le fournisseur" } : supplier.status === "active" ? { action: "suspend" as const, label: "Suspendre le fournisseur" } : { action: "reactivate" as const, label: "Reactiver le fournisseur" };

  return (
    <>
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)]" role="tablist" aria-label="Dossier fournisseur">
        {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "border-b-2 border-[var(--violet)] px-3 py-2 text-sm font-semibold text-[var(--violet)]" : "px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"} onClick={() => { setActiveTab(tab); setError(""); setMessage(""); }}>{tab}</button>)}
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700" role="status">{message}</p> : null}

      {activeTab === "Informations" ? (
        <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="app-panel p-5"><h2 className="m-0 text-base font-semibold">Informations generales</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-[var(--muted)]">Raison sociale</dt><dd className="m-0 mt-1 font-semibold">{supplier.legal_name}</dd></div><div><dt className="text-[var(--muted)]">Categorie</dt><dd className="m-0 mt-1 font-semibold">{supplier.category || "Non precisee"}</dd></div><div><dt className="text-[var(--muted)]">RCCM</dt><dd className="m-0 mt-1">{supplier.rccm || "Non renseigne"}</dd></div><div><dt className="text-[var(--muted)]">NIU</dt><dd className="m-0 mt-1">{supplier.niu || "Non renseigne"}</dd></div><div><dt className="text-[var(--muted)]">E-mail</dt><dd className="m-0 mt-1">{supplier.email || "Non renseigne"}</dd></div><div><dt className="text-[var(--muted)]">Telephone</dt><dd className="m-0 mt-1">{supplier.phone || "Non renseigne"}</dd></div><div><dt className="text-[var(--muted)]">Contact commercial</dt><dd className="m-0 mt-1">{supplier.contact_name || "Non renseigne"}</dd></div><div><dt className="text-[var(--muted)]">Conditions de paiement</dt><dd className="m-0 mt-1">{supplier.payment_terms_days} jours</dd></div><div><dt className="text-[var(--muted)]">Banque</dt><dd className="m-0 mt-1">{supplier.bank_name || "Non renseignee"}</dd></div><div><dt className="text-[var(--muted)]">IBAN / Compte</dt><dd className="m-0 mt-1 break-all">{supplier.iban || "Non renseigne"}</dd></div><div className="sm:col-span-2"><dt className="text-[var(--muted)]">Produits et services</dt><dd className="m-0 mt-1">{[...(supplier.products || []), ...(supplier.services || [])].join(", ") || "Non renseignes"}</dd></div></dl></div>
          <aside className="app-panel h-fit p-4"><h2 className="m-0 text-base font-semibold">Statut du dossier</h2><div className="mt-4 flex items-center gap-3">{supplier.status === "active" ? <CheckCircle2 className="text-emerald-600" size={24} /> : <AlertTriangle className={supplier.status === "suspended" ? "text-red-600" : "text-amber-600"} size={24} />}<span><strong className="block text-sm">{supplierStatusLabels[supplier.status]}</strong><small className="text-[var(--muted)]">Score : {supplier.score ? `${Number(supplier.score).toFixed(2)}/5` : "non evalue"}</small></span></div><button type="button" className={supplier.status === "active" ? "secondary-button mt-5 w-full text-red-700" : "primary-button mt-5 w-full"} disabled={loading} onClick={() => void run(() => transitionSupplier(supplier.id, statusAction.action), "Statut du fournisseur mis a jour.")}>{loading ? "Traitement..." : statusAction.label}</button></aside>
        </section>
      ) : null}

      {activeTab === "Documents" ? (
        <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="app-panel overflow-hidden"><div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4"><div><h2 className="m-0 text-base font-semibold">Documents administratifs</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">{supplier.documents?.length ?? 0} document(s)</p></div><button type="button" className="primary-button" onClick={() => setUploadOpen((value) => !value)}><Upload size={16} /> Ajouter</button></div>{uploadOpen ? <form className="grid gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:grid-cols-3" onSubmit={handleUpload}><label><span className="field-label">Type</span><select className="field-control" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{Object.entries(documentLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span className="field-label">Fichier *</span><input className="field-control" type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><label><span className="field-label">Expiration</span><input className="field-control" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label><div className="flex justify-end gap-2 sm:col-span-3"><button type="button" className="secondary-button" onClick={() => setUploadOpen(false)}>Annuler</button><button type="submit" className="primary-button" disabled={loading || !file}>{loading ? "Envoi..." : "Televerser"}</button></div></form> : null}<div className="divide-y divide-[var(--border)]">{supplier.documents?.length ? supplier.documents.map((document) => <div className="grid gap-3 p-4 sm:grid-cols-[36px_1fr_auto_auto] sm:items-center" key={document.id}><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface-soft)] text-[var(--muted)]"><FileText size={18} /></span><span><strong className="block text-sm">{documentLabels[document.document_type] || document.document_type}</strong><small className="text-[var(--muted)]">{document.original_name}</small></span><span className={`status-badge ${document.status === "valid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{document.status === "valid" ? "Valide" : "A verifier"}</span><span className="text-xs text-[var(--muted)]">{document.expires_at ? `Expire le ${new Intl.DateTimeFormat("fr-FR").format(new Date(document.expires_at))}` : "Sans expiration"}</span></div>) : <p className="m-0 p-5 text-sm text-[var(--muted)]">Aucun document ajoute.</p>}</div></div>
          <aside className="app-panel h-fit p-4"><h2 className="m-0 text-base font-semibold">Documents acceptes</h2><p className="mb-0 mt-2 text-xs leading-5 text-[var(--muted)]">PDF, JPG ou PNG, 10 Mo maximum. Les fichiers restent dans le stockage prive de l'entreprise.</p></aside>
        </section>
      ) : null}

      {activeTab === "Evaluation" ? (
        <form className="app-panel p-5" onSubmit={handleEvaluation}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="m-0 text-base font-semibold">Evaluation fournisseur</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">Chaque critere est note de 1 a 5; le score global est calcule automatiquement.</p></div>{latestEvaluation ? <span className="status-badge bg-[var(--violet-soft)] text-[var(--violet)]">Dernier score : {Number(latestEvaluation.score).toFixed(2)}/5</span> : null}</div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{criteria.map((criterion) => <label className="rounded-xl border border-[var(--border)] p-3" key={criterion.key}><span className="field-label">{criterion.label}</span><select className="field-control" value={scores[criterion.key]} onChange={(event) => setScores((current) => ({ ...current, [criterion.key]: Number(event.target.value) }))}><option value="1">1 - Faible</option><option value="2">2</option><option value="3">3 - Moyen</option><option value="4">4</option><option value="5">5 - Excellent</option></select></label>)}</div><label className="mt-4 block"><span className="field-label">Commentaire</span><textarea className="field-control min-h-20 resize-y" value={evaluationComment} onChange={(event) => setEvaluationComment(event.target.value)} placeholder="Points forts, risques ou actions de progres." /></label><div className="mt-4 flex justify-end"><button type="submit" className="primary-button" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer l'evaluation"}</button></div></form>
      ) : null}

      {activeTab === "Historique" ? (
        <section className="app-panel overflow-hidden"><div className="border-b border-[var(--border)] p-4"><h2 className="m-0 text-base font-semibold">Historique du dossier</h2></div>{supplier.status_history?.length ? <ol className="divide-y divide-[var(--border)] pl-0">{supplier.status_history.map((event) => <li className="p-4 text-sm" key={event.id}><strong className="block">{supplierStatusLabels[event.to_status] || event.to_status}</strong><small className="mt-1 block text-[var(--muted)]">{event.user?.name || "Utilisateur"}{event.created_at ? ` - ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}` : ""}</small>{event.comment ? <p className="mb-0 mt-2">{event.comment}</p> : null}</li>)}</ol> : <p className="m-0 p-5 text-sm text-[var(--muted)]">Aucun changement de statut enregistre.</p>}</section>
      ) : null}
    </>
  );
}
