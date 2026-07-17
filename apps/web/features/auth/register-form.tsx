"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { register, type RegisterPayload } from "@/lib/procuflow-api";

const initialData: RegisterPayload = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirmation: "",
  company: "",
  country: "CM",
  company_size: "11-50"
};

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function field(name: keyof RegisterPayload) {
    return {
      name,
      value: data[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setData((current) => ({ ...current, [name]: event.target.value }))
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (step === 1) {
      if (data.password !== data.password_confirmation) {
        setError("Les deux mots de passe doivent etre identiques.");
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      await register(data);
      router.push("/onboarding");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Creation du compte impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 flex items-center gap-2" aria-label={`Etape ${step} sur 2`}>
        <span className="h-1.5 flex-1 rounded-full bg-[var(--violet)]" />
        <span className={`h-1.5 flex-1 rounded-full ${step === 2 ? "bg-[var(--violet)]" : "bg-[#e8e4eb]"}`} />
        <span className="ml-2 text-xs font-semibold text-[var(--muted)]">{step}/2</span>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="field-label">Prenom</span><input className="field-control" {...field("first_name")} required autoComplete="given-name" /></label>
            <label><span className="field-label">Nom</span><input className="field-control" {...field("last_name")} required autoComplete="family-name" /></label>
          </div>
          <label className="block"><span className="field-label">E-mail professionnel</span><input className="field-control" {...field("email")} type="email" placeholder="vous@entreprise.com" required autoComplete="email" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="field-label">Mot de passe</span><input className="field-control" {...field("password")} type="password" minLength={8} required autoComplete="new-password" /></label>
            <label><span className="field-label">Confirmer</span><input className="field-control" {...field("password_confirmation")} type="password" minLength={8} required autoComplete="new-password" /></label>
          </div>
          <small className="block text-xs text-[var(--muted)]">8 caracteres minimum, avec lettres et chiffres</small>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block"><span className="field-label">Nom de l'entreprise</span><input className="field-control" {...field("company")} placeholder="Ex. Yogi Conseils" required /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="field-label">Pays</span><select className="field-control" {...field("country")}><option value="CM">Cameroun</option><option value="CI">Cote d'Ivoire</option><option value="SN">Senegal</option><option value="GA">Gabon</option><option value="OTHER">Autre</option></select></label>
            <label><span className="field-label">Taille</span><select className="field-control" {...field("company_size")}><option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option></select></label>
          </div>
          <label className="flex items-start gap-2 text-sm leading-5"><input className="mt-1" type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} required /><span>J'accepte les conditions d'utilisation et la politique de confidentialite.</span></label>
        </div>
      )}

      {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      <div className="mt-6 flex gap-3">
        {step === 2 ? <button type="button" className="secondary-button" onClick={() => setStep(1)}><ArrowLeft size={17} /> Retour</button> : null}
        <button type="submit" className="primary-button flex-1 disabled:cursor-wait disabled:opacity-70" disabled={loading || (step === 2 && !accepted)}>
          {loading ? "Creation..." : step === 1 ? <>Continuer <ArrowRight size={17} /></> : <>Creer mon espace <Check size={17} /></>}
        </button>
      </div>
      <p className="mb-0 mt-5 text-center text-sm text-[var(--muted)]">Deja inscrit ? <Link href="/login" className="font-semibold text-[var(--violet)] hover:underline">Se connecter</Link></p>
    </form>
  );
}
