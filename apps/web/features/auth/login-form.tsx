"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/procuflow-api";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await login({
        email: String(data.get("email")),
        password: String(data.get("password")),
        remember: data.get("remember") === "on"
      });
      router.push("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="field-label">Adresse e-mail</span>
        <input className="field-control" name="email" type="email" placeholder="vous@entreprise.com" required autoComplete="email" />
      </label>
      <label className="block">
        <span className="field-label">Mot de passe</span>
        <span className="relative block">
          <input className="field-control pr-11" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" />
          <button
            type="button"
            className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-[var(--muted)] hover:bg-[var(--surface-soft)]"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      </label>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2"><input name="remember" type="checkbox" /> Se souvenir de moi</label>
        <Link href="/forgot-password" className="font-semibold text-[var(--violet)] hover:underline">Mot de passe oublie ?</Link>
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      <button type="submit" className="primary-button w-full disabled:cursor-wait disabled:opacity-70" disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </button>
      <p className="m-0 text-center text-sm text-[var(--muted)]">
        Nouveau sur ProcuFlow ?{" "}
        <Link href="/register" className="font-semibold text-[var(--violet)] hover:underline">Creer un compte</Link>
      </p>
    </form>
  );
}
