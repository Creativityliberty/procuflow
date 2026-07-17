import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-[var(--bg)] lg:grid-cols-[minmax(320px,42%)_1fr]">
      <section className="hidden relative p-10 text-white lg:flex lg:flex-col lg:justify-between overflow-hidden bg-[#1d1724]">
        {/* Background Image with Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-105"
          style={{ 
            backgroundImage: "url('/images/auth_bg.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0b15]/95 via-[#1d1724]/85 to-[#1d1724]/70 mix-blend-multiply" />
        
        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <BrandMark />
            <span className="brand-wordmark">ProcuFlow</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-sm font-semibold text-[#c7adff]">Vos achats, simplement.</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight">Un seul espace pour demander, valider, commander et suivre.</h2>
          <ul className="mt-7 space-y-4 text-sm text-white/90">
            <li className="flex gap-3"><CheckCircle2 size={18} className="flex-none text-[#b894ff]" /> Circuits de validation adaptes a votre entreprise</li>
            <li className="flex gap-3"><CheckCircle2 size={18} className="flex-none text-[#b894ff]" /> Dossiers fournisseurs et documents centralises</li>
            <li className="flex gap-3"><CheckCircle2 size={18} className="flex-none text-[#b894ff]" /> Suivi des commandes, livraisons et factures</li>
          </ul>
        </div>

        <p className="relative z-10 m-0 text-xs text-white/60">ProcuFlow Africa</p>
      </section>

      <section className="flex min-h-screen items-center justify-center p-5 sm:p-8">
        <div className="app-panel w-full max-w-md p-6 sm:p-7">
          <Link href="/" className="mb-8 flex items-center gap-2 font-semibold lg:hidden">
            <BrandMark />
            <span className="brand-wordmark">ProcuFlow</span>
          </Link>
          <h1 className="m-0 text-2xl font-bold">{title}</h1>
          <p className="mb-6 mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
