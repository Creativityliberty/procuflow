"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestPasswordReset, resetPassword } from "@/lib/procuflow-api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setMessage((await requestPasswordReset(email)).message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (message) return <div className="space-y-4 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={34} /><p className="text-sm leading-6 text-[var(--muted)]">{message}</p><Link className="secondary-button w-full" href="/login">Retour a la connexion</Link></div>;

  return <form className="space-y-4" onSubmit={submit}><label className="block"><span className="field-label">Adresse e-mail</span><input className="field-control" type="email" required autoComplete="email" placeholder="vous@entreprise.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<button type="submit" disabled={busy} className="primary-button w-full disabled:opacity-60">{busy ? "Envoi..." : "Envoyer le lien"}</button><Link href="/login" className="block text-center text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">Retour a la connexion</Link></form>;
}

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await resetPassword({ token, email, password: String(data.get("password")), password_confirmation: String(data.get("password_confirmation")) });
      router.push("/login?password=reset");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reinitialisation impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (!token || !email) return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Ce lien de reinitialisation est incomplet ou invalide.</p>;

  return <form className="space-y-4" onSubmit={submit}><label className="block"><span className="field-label">Compte</span><input className="field-control bg-slate-50" value={email} readOnly /></label><label className="block"><span className="field-label">Nouveau mot de passe</span><input name="password" className="field-control" type="password" minLength={10} required autoComplete="new-password" /></label><label className="block"><span className="field-label">Confirmer le mot de passe</span><input name="password_confirmation" className="field-control" type="password" minLength={10} required autoComplete="new-password" /></label><p className="text-xs text-[var(--muted)]">10 caracteres minimum, avec lettres et chiffres.</p>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<button className="primary-button w-full disabled:opacity-60" disabled={busy} type="submit">{busy ? "Mise a jour..." : "Definir le mot de passe"}</button></form>;
}
