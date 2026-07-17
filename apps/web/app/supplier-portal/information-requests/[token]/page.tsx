"use client";

import { Building2, CheckCircle2, Download, FileText, MessageSquareText, Send } from "lucide-react";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { downloadInformationRequestPortalDocument, getInformationRequestPortal, submitInformationResponse } from "@/lib/procuflow-api";
import type { PortalInformationRequestData } from "@/lib/types";

export default function InformationRequestPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalInformationRequestData | null>(null);
  const [response, setResponse] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try { const next = await getInformationRequestPortal(token); setData(next); setResponse(next.invitation.response ?? ""); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Ce lien n'est pas valide."); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try { const next = await submitInformationResponse(token, response, file); setData(next); setSuccess("Votre réponse a été enregistrée et transmise au Service Achats."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Envoi impossible."); }
    finally { setBusy(false); }
  }

  async function downloadDocument(documentId: number) {
    try { const result = await downloadInformationRequestPortalDocument(token, documentId); const url = URL.createObjectURL(result.blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = result.filename; anchor.click(); URL.revokeObjectURL(url); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Téléchargement impossible."); }
  }

  return <main className="min-h-screen bg-[#f4f1f8] p-4 sm:p-8"><div className="mx-auto max-w-4xl">
    <header className="mb-6 flex items-center gap-3"><BrandMark/><span><strong className="brand-wordmark block">ProcuFlow</strong><small className="text-[var(--muted)]">Espace fournisseur sécurisé</small></span></header>
    {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
    {!data ? <div className="app-panel h-80 animate-pulse"/> : <div className="space-y-4">
      <section className="app-panel p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><small className="font-semibold text-violet-700">DEMANDE D&apos;INFORMATION · {data.request.reference}</small><h1 className="mb-2 mt-2 text-xl font-semibold sm:text-2xl">{data.request.subject}</h1><p className="m-0 flex items-center gap-2 text-sm text-[var(--muted)]"><Building2 size={15}/>{data.supplier.legal_name}</p></div><span className={`status-badge ${data.is_open ? "bg-violet-50 text-violet-700" : "bg-gray-100 text-gray-700"}`}>{data.is_open ? "Réponse attendue" : "Demande clôturée"}</span></div><div className="mt-5 rounded-xl bg-violet-50/70 p-4"><small className="font-semibold text-violet-700">Date limite</small><strong className="mt-1 block">{dateTime(data.request.response_deadline)}</strong></div></section>
      <section className="app-panel p-5 sm:p-6"><div className="flex items-center gap-2"><MessageSquareText className="text-violet-600" size={18}/><h2 className="m-0 text-base">Informations demandées</h2></div><p className="mb-0 mt-4 whitespace-pre-wrap text-sm leading-7">{data.request.description}</p></section>
      {data.request.documents?.length ? <section className="app-panel overflow-hidden"><div className="border-b border-[var(--border)] p-4"><h2 className="m-0 text-base">Documents de référence</h2></div>{data.request.documents.map((item) => <button className="flex w-full items-center gap-3 border-t border-[var(--border)] p-4 text-left hover:bg-[var(--surface-soft)]" onClick={() => void downloadDocument(item.id)} key={item.id}><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><FileText size={17}/></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.original_name}</strong><small className="text-[var(--muted)]">{Math.ceil(item.size_bytes / 1024)} Ko</small></span><Download size={17}/></button>)}</section> : null}
      <form className="app-panel p-5 sm:p-6" onSubmit={submit}><div className="flex items-center gap-2"><Send className="text-violet-600" size={18}/><h2 className="m-0 text-base">Votre réponse</h2></div>{data.invitation.submitted_at ? <p className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={17}/>Dernier envoi : {dateTime(data.invitation.submitted_at)}</p> : null}<label className="mt-4 block"><span className="field-label">Réponse détaillée</span><textarea required minLength={5} disabled={!data.is_open} className="field-control min-h-48" value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Décrivez vos capacités, délais, références et conditions."/></label><label className="mt-4 block"><span className="field-label">Pièce justificative facultative</span><input disabled={!data.is_open} className="field-control" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => setFile(event.target.files?.[0])}/></label>{success ? <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{success}</p> : null}<div className="mt-4 flex justify-end"><button className="primary-button" disabled={busy || !data.is_open || response.trim().length < 5}><Send size={16}/>{busy ? "Transmission..." : data.invitation.submitted_at ? "Mettre à jour la réponse" : "Transmettre la réponse"}</button></div></form>
    </div>}
  </div></main>;
}

function dateTime(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)); }
