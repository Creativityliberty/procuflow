import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-white/80 px-5 backdrop-blur-md lg:px-8">
        <Link href="/" className="flex items-center gap-2"><BrandMark /><span className="brand-wordmark">ProcuFlow</span></Link>
        <Link href="/" className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">Configurer plus tard</Link>
      </header>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="app-panel p-5 sm:p-8">
          <p className="mb-1 mt-0 text-xs font-semibold text-[var(--violet)]">PREMIERE CONFIGURATION</p>
          <h1 className="m-0 text-2xl font-bold">Preparons votre espace</h1>
          <p className="mb-7 mt-2 text-sm text-[var(--muted)]">Trois etapes suffisent pour commencer a gerer vos achats.</p>
          <OnboardingForm />
        </div>
      </section>
    </main>
  );
}
