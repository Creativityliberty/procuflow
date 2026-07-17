"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSubscription } from "@/lib/procuflow-api";
import type { SubscriptionDetail } from "@/lib/types";

export default function BillingSuccessPage(){const[data,setData]=useState<SubscriptionDetail|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");async function load(){setLoading(true);setError("");try{setData(await getSubscription())}catch(caught){setError(caught instanceof Error?caught.message:"Verification momentanement indisponible.")}finally{setLoading(false)}}useEffect(()=>{void load()},[]);const active=data?.subscription.status==="active";return <main className="grid min-h-screen place-items-center bg-[var(--bg)] p-5"><section className="app-panel w-full max-w-lg p-7 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={48}/><h1 className="mb-2 mt-4 text-2xl">Paiement recu</h1><p className="text-sm leading-6 text-[var(--muted)]">{loading?"Verification de votre abonnement...":error||active?error||`Votre forfait ${data?.plan.name} est maintenant actif.`:"La confirmation DOHONE est en cours. Actualisez dans quelques secondes."}</p><div className="mt-6 flex flex-wrap justify-center gap-3">{!active?<button className="secondary-button" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/>Actualiser</button>:null}<Link className="primary-button" href="/settings/subscription">Voir mon abonnement</Link><Link className="secondary-button" href="/">Tableau de bord</Link></div></section></main>}
