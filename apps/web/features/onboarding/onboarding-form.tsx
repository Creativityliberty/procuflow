"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateTenant } from "@/lib/procuflow-api";

const steps = ["Entreprise", "Achats", "Validations"];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    legal_name: "Yogi Conseils",
    rccm: "",
    niu: "",
    city: "Douala",
    country: "CM",
    currency: "XAF",
    rfq_threshold: "500000",
    default_payment_days: "30",
    cost_center_required: true
  });

  function field(name: keyof typeof data) {
    return {
      name,
      value: String(data[name]),
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setData((current) => ({ ...current, [name]: event.target.value }))
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }

    setLoading(true);
    try {
      await updateTenant({
        ...data,
        rfq_threshold: Number(data.rfq_threshold),
        default_payment_days: Number(data.default_payment_days),
        complete_onboarding: true
      });
      router.push("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Configuration impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Configuration de l'entreprise">
        {steps.map((label, index) => (
          <li className="min-w-0" key={label}>
            <span className={`mb-2 block h-1.5 rounded-full ${index <= step ? "bg-[var(--violet)]" : "bg-[#e8e4eb]"}`} />
            <span className={`text-xs font-semibold ${index <= step ? "text-[var(--violet)]" : "text-[var(--muted)]"}`}>{index + 1}. {label}</span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <fieldset className="space-y-4">
          <legend className="mb-1 text-lg font-semibold">Informations de l'entreprise</legend>
          <p className="mb-5 mt-0 text-sm text-[var(--muted)]">Ces informations apparaitront sur vos documents d'achat.</p>
          <label className="block"><span className="field-label">Raison sociale</span><input className="field-control" {...field("legal_name")} required /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="field-label">RCCM</span><input className="field-control" {...field("rccm")} placeholder="RC/DLA/2024/..." /></label>
            <label><span className="field-label">NIU</span><input className="field-control" {...field("niu")} placeholder="M012345678" /></label>
            <label><span className="field-label">Ville</span><input className="field-control" {...field("city")} /></label>
            <label><span className="field-label">Pays</span><select className="field-control" {...field("country")}><option value="CM">Cameroun</option><option value="CI">Cote d'Ivoire</option><option value="SN">Senegal</option><option value="GA">Gabon</option></select></label>
          </div>
        </fieldset>
      ) : null}

      {step === 1 ? (
        <fieldset className="space-y-4">
          <legend className="mb-1 text-lg font-semibold">Regles d'achat</legend>
          <p className="mb-5 mt-0 text-sm text-[var(--muted)]">Choisissez les valeurs utilisees par defaut.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="field-label">Devise</span><select className="field-control" {...field("currency")}><option>XAF</option><option>XOF</option><option>EUR</option><option>USD</option></select></label>
            <label><span className="field-label">Seuil de consultation</span><input className="field-control" {...field("rfq_threshold")} type="number" min="0" /></label>
          </div>
          <label className="block"><span className="field-label">Delai de paiement par defaut</span><select className="field-control" {...field("default_payment_days")}><option value="0">Comptant</option><option value="15">15 jours</option><option value="30">30 jours</option><option value="45">45 jours</option><option value="60">60 jours</option></select></label>
          <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-white/45 p-3"><input className="mt-1" type="checkbox" checked={data.cost_center_required} onChange={(event) => setData((current) => ({ ...current, cost_center_required: event.target.checked }))} /><span><strong className="block text-sm">Exiger un centre de cout</strong><small className="text-[var(--muted)]">Chaque demande devra etre rattachee a un budget.</small></span></label>
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset className="space-y-3">
          <legend className="mb-1 text-lg font-semibold">Circuit de validation</legend>
          <p className="mb-5 mt-0 text-sm text-[var(--muted)]">Un circuit initial est pret. Vous pourrez l'ajuster dans les parametres.</p>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/45 p-3"><Check className="text-[var(--violet)]" size={17} /><span className="flex-1"><strong className="block text-sm">Responsable hierarchique</strong><small className="text-[var(--muted)]">Valide toutes les demandes</small></span></div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/45 p-3"><Check className="text-[var(--violet)]" size={17} /><span className="flex-1"><strong className="block text-sm">Direction financiere</strong><small className="text-[var(--muted)]">Valide a partir de 1 000 000 XAF</small></span></div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/45 p-3"><Check className="text-[var(--violet)]" size={17} /><span className="flex-1"><strong className="block text-sm">Direction generale</strong><small className="text-[var(--muted)]">Valide a partir de 10 000 000 XAF</small></span></div>
        </fieldset>
      ) : null}

      {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      <div className="mt-7 flex justify-between gap-3 border-t border-[var(--border)] pt-5">
        <button type="button" className="secondary-button" disabled={step === 0 || loading} onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft size={17} /> Retour</button>
        <button type="submit" className="primary-button disabled:cursor-wait disabled:opacity-70" disabled={loading}>{loading ? "Configuration..." : step === steps.length - 1 ? <>Terminer <Check size={17} /></> : <>Continuer <ArrowRight size={17} /></>}</button>
      </div>
    </form>
  );
}
