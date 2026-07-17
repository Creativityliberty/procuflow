"use client";

import { AlertCircle } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] p-6 text-center">
      <section className="app-panel max-w-md p-7">
        <AlertCircle className="mx-auto text-red-600" size={34} />
        <h1 className="mb-1 mt-4 text-xl font-semibold">Impossible de charger cette page</h1>
        <p className="mb-5 mt-1 text-sm text-[var(--muted)]">Verifiez votre connexion puis reessayez.</p>
        <button type="button" className="primary-button" onClick={reset}>Reessayer</button>
      </section>
    </main>
  );
}
