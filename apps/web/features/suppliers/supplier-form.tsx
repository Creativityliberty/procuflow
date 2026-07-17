"use client";

import { CheckCircle2, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createSupplier } from "@/lib/procuflow-api";

export function SupplierForm() {
  const [savedId, setSavedId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const supplier = await createSupplier({
        ...values,
        products: String(values.products || "").split(",").map((value) => value.trim()).filter(Boolean),
        services: String(values.services || "").split(",").map((value) => value.trim()).filter(Boolean),
        payment_terms_days: Number(values.payment_terms_days || 0)
      });
      setSavedId(supplier.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Enregistrement impossible.");
    } finally {
      setLoading(false);
    }
  }

  if (savedId) {
    return (
      <section className="app-panel grid min-h-72 place-items-center p-6 text-center">
        <div>
          <CheckCircle2 className="mx-auto text-emerald-600" size={40} />
          <h2 className="mb-1 mt-4 text-lg font-semibold">Fournisseur enregistre</h2>
          <p className="m-0 text-sm text-[var(--muted)]">Le dossier est en brouillon. Vous pouvez maintenant ajouter ses documents.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3"><Link href={`/suppliers/${savedId}`} className="primary-button">Ouvrir le dossier</Link><Link href="/suppliers" className="secondary-button">Retour a la liste</Link></div>
        </div>
      </section>
    );
  }

  return (
    <form className="app-panel divide-y divide-[var(--border)]" onSubmit={handleSubmit}>
      <fieldset className="grid gap-4 p-5 md:grid-cols-2">
        <legend className="px-5 pt-5 text-base font-semibold">Informations generales</legend>
        <label className="md:col-span-2"><span className="field-label">Raison sociale *</span><input className="field-control" name="legal_name" required /></label>
        <label><span className="field-label">RCCM</span><input className="field-control" name="rccm" /></label>
        <label><span className="field-label">NIU</span><input className="field-control" name="niu" /></label>
        <label><span className="field-label">Categorie *</span><select className="field-control" name="category" required defaultValue=""><option value="" disabled>Selectionner</option><option>Informatique</option><option>Transport</option><option>BTP</option><option>Maintenance</option><option>Fournitures</option><option>Nettoyage</option><option>Consulting</option></select></label>
        <label><span className="field-label">Pays *</span><select className="field-control" name="country" defaultValue="CM"><option value="CM">Cameroun</option><option value="CI">Cote d'Ivoire</option><option value="SN">Senegal</option><option value="GA">Gabon</option></select></label>
        <label><span className="field-label">Ville</span><input className="field-control" name="city" /></label>
        <label><span className="field-label">Adresse</span><input className="field-control" name="address" /></label>
      </fieldset>
      <fieldset className="grid gap-4 p-5 md:grid-cols-2">
        <legend className="px-5 pt-5 text-base font-semibold">Contact commercial</legend>
        <label><span className="field-label">Nom du contact</span><input className="field-control" name="contact_name" /></label>
        <label><span className="field-label">E-mail *</span><input className="field-control" name="email" type="email" required /></label>
        <label><span className="field-label">Telephone</span><input className="field-control" name="phone" type="tel" placeholder="+237 6..." /></label>
        <label><span className="field-label">Conditions de paiement</span><select className="field-control" name="payment_terms_days" defaultValue="30"><option value="0">Comptant</option><option value="15">15 jours</option><option value="30">30 jours</option><option value="45">45 jours</option><option value="60">60 jours</option></select></label>
      </fieldset>
      <fieldset className="grid gap-4 p-5 md:grid-cols-2">
        <legend className="px-5 pt-5 text-base font-semibold">Offre et informations financieres</legend>
        <label><span className="field-label">Produits</span><textarea className="field-control min-h-20 resize-y" name="products" placeholder="Ordinateurs, imprimantes, onduleurs (separes par des virgules)" /></label>
        <label><span className="field-label">Services</span><textarea className="field-control min-h-20 resize-y" name="services" placeholder="Installation, maintenance, assistance (separes par des virgules)" /></label>
        <label><span className="field-label">Banque</span><input className="field-control" name="bank_name" /></label>
        <label><span className="field-label">IBAN / Numero de compte</span><input className="field-control" name="iban" autoComplete="off" /></label>
        <label><span className="field-label">SWIFT</span><input className="field-control" name="swift" autoComplete="off" /></label>
      </fieldset>
      {error ? <p className="mx-5 my-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-3 p-4"><Link href="/suppliers" className="secondary-button">Annuler</Link><button className="primary-button disabled:cursor-wait disabled:opacity-70" type="submit" disabled={loading}><Save size={17} /> {loading ? "Enregistrement..." : "Enregistrer"}</button></div>
    </form>
  );
}
