import { XCircle } from "lucide-react";
import Link from "next/link";

export default function BillingCancelPage(){return <main className="grid min-h-screen place-items-center bg-[var(--bg)] p-5"><section className="app-panel w-full max-w-lg p-7 text-center"><XCircle className="mx-auto text-amber-600" size={48}/><h1 className="mb-2 mt-4 text-2xl">Paiement annule</h1><p className="text-sm leading-6 text-[var(--muted)]">Aucun changement n&apos;a ete applique a votre abonnement. Vous pouvez reprendre le paiement quand vous le souhaitez.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link className="primary-button" href="/settings/subscription">Reprendre le paiement</Link><Link className="secondary-button" href="/">Tableau de bord</Link></div></section></main>}
