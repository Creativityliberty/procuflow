"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { SupplierDetailTabs } from "@/features/suppliers/supplier-detail-tabs";
import { getSupplier } from "@/lib/procuflow-api";
import type { SupplierRecord } from "@/lib/types";

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<SupplierRecord | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try { setSupplier(await getSupplier(params.id)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Chargement impossible."); }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppShell><div className="space-y-5">
      <Link href="/suppliers" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--violet)]"><ArrowLeft size={16} /> Retour aux fournisseurs</Link>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : !supplier ? <div className="app-panel h-72 animate-pulse" /> : <><PageHeading eyebrow="Fournisseurs / Dossier" title={supplier.legal_name} description={`${supplier.category || "Sans categorie"} - ${supplier.city || supplier.country || "Localisation non precisee"}`} /><SupplierDetailTabs supplier={supplier} onChange={load} /></>}
    </div></AppShell>
  );
}
