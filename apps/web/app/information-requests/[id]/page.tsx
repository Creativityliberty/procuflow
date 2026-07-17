"use client";

import { Archive, ArrowLeft, Clipboard, Download, ExternalLink, FileUp, LockKeyhole, RefreshCw, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { archiveInformationRequest, closeInformationRequest, downloadInformationRequestDocument, downloadInformationResponse, getInformationRequest, publishInformationRequest, regenerateInformationRequestLink, uploadInformationRequestDocument } from "@/lib/procuflow-api";
import type { InformationRequestRecord, PortalLinkRecord } from "@/lib/types";

const labels: Record<string, string> = { draft: "Brouillon", published: "En cours", closed: "Clôturée", archived: "Archivée" };

export default function InformationRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<InformationRequestRecord | null>(null);
  const [links, setLinks] = useState<PortalLinkRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setRequest(await getInformationRequest(id)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Chargement impossible."); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const submitted = useMemo(() => request?.suppliers?.filter((supplier) => supplier.status === "submitted").length ?? 0, [request]);

  async function action(run: () => Promise<InformationRequestRecord>) {
    setBusy(true); setError("");
    try { setRequest(await run()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Action impossible."); }
    finally { setBusy(false); }
  }

  async function publish() {
    setBusy(true); setError("");
    try { const next = await publishInformationRequest(id); setRequest(next); setLinks(next.portal_links ?? []); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Publication impossible."); }
    finally { setBusy(false); }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || !file.size) return;
    setBusy(true); setError("");
    try { await uploadInformationRequestDocument(id, file); form.reset(); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Téléversement impossible."); }
    finally { setBusy(false); }
  }

  async function copyFreshLink(invitationId: number) {
    setBusy(true);
    try { const link = await regenerateInformationRequestLink(id, invitationId); await navigator.clipboard.writeText(link.url); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Lien impossible à générer."); }
    finally { setBusy(false); }
  }

  async function downloadFile(result: Promise<{ blob: Blob; filename: string }>) {
    try { const file = await result; const url = URL.createObjectURL(file.blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = file.filename; anchor.click(); URL.revokeObjectURL(url); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Téléchargement impossible."); }
  }

  if (!request) return <AppShell><div className="space-y-4">{error ? <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p> : null}<div className="app-panel h-80 animate-pulse"/></div></AppShell>;
  return <AppShell><div className="space-y-5">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]" href="/information-requests"><ArrowLeft size={16}/>Retour aux demandes</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><PageHeading eyebrow={request.reference} title={request.subject} description={`Réponses attendues avant le ${dateTime(request.response_deadline)}`}/><span className="status-badge bg-violet-50 text-violet-700">{labels[request.status]}</span></div>
    {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    {links.length ? <section className="app-panel overflow-hidden"><div className="border-b border-[var(--border)] bg-violet-50 p-4"><strong className="text-violet-800">Liens sécurisés générés</strong><p className="mb-0 mt-1 text-xs text-violet-700">Copiez-les maintenant. Ils pourront être renouvelés individuellement plus tard.</p></div>{links.map((link) => <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] p-3" key={`${link.supplier_id}-${link.email}`}><span className="min-w-48 flex-1 truncate text-sm">{link.email}</span><button className="secondary-button" onClick={() => void navigator.clipboard.writeText(link.url)}><Clipboard size={15}/>Copier</button><Link className="secondary-button" href={link.url} target="_blank"><ExternalLink size={15}/>Ouvrir</Link></div>)}</section> : null}
    <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <article className="app-panel p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="m-0 text-base">Questionnaire transmis</h2><span className="text-xs font-semibold text-[var(--muted)]">{request.category ?? "Toutes catégories"}</span></div><p className="mb-0 mt-4 whitespace-pre-wrap text-sm leading-7">{request.description}</p></article>
        <article className="app-panel overflow-hidden"><div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4"><div><h2 className="m-0 text-base">Réponses fournisseurs</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">{submitted} réponse(s) sur {request.suppliers?.length ?? 0}</p></div></div>{request.suppliers?.map((invitation) => <div className="border-t border-[var(--border)] p-4" key={invitation.id}><div className="flex flex-wrap items-start justify-between gap-3"><span><strong className="block text-sm">{invitation.supplier?.legal_name}</strong><small className="text-[var(--muted)]">{invitation.contact_email} · {statusLabel(invitation.status)}</small></span><div className="flex gap-2">{request.status === "published" ? <button className="secondary-button" disabled={busy} onClick={() => void copyFreshLink(invitation.id)}><Clipboard size={15}/>Nouveau lien</button> : null}{invitation.response_original_name ? <button className="secondary-button" onClick={() => void downloadFile(downloadInformationResponse(id, invitation.id))}><Download size={15}/>Pièce jointe</button> : null}</div></div>{invitation.response ? <div className="mt-3 rounded-xl bg-[var(--surface-soft)] p-4 text-sm leading-6"><p className="m-0 whitespace-pre-wrap">{invitation.response}</p><small className="mt-2 block text-[var(--muted)]">Reçue le {invitation.submitted_at ? dateTime(invitation.submitted_at) : "—"}</small></div> : <p className="mb-0 mt-3 text-xs text-[var(--muted)]">Aucune réponse déposée.</p>}</div>)}</article>
      </div>
      <aside className="space-y-4">
        <section className="app-panel p-4"><h2 className="m-0 text-base">Pilotage</h2><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Invités" value={request.suppliers?.length ?? 0}/><Metric label="Réponses" value={submitted}/></div><div className="mt-4 space-y-2">{request.status === "draft" ? <button className="primary-button w-full" disabled={busy} onClick={() => void publish()}><Send size={16}/>Publier et envoyer</button> : null}{request.status === "published" ? <button className="primary-button w-full" disabled={busy} onClick={() => void action(() => closeInformationRequest(id))}><LockKeyhole size={16}/>Clôturer les réponses</button> : null}{["published", "closed"].includes(request.status) ? <button className="secondary-button w-full" disabled={busy} onClick={() => void action(() => archiveInformationRequest(id))}><Archive size={16}/>Archiver</button> : null}<button className="secondary-button w-full" disabled={busy} onClick={() => void load()}><RefreshCw size={16}/>Actualiser</button></div></section>
        <section className="app-panel p-4"><div className="flex items-center justify-between gap-2"><h2 className="m-0 text-base">Documents</h2><span className="text-xs text-[var(--muted)]">{request.documents?.length ?? 0}</span></div>{request.status === "draft" ? <form className="mt-3 flex gap-2" onSubmit={upload}><input required name="file" type="file" className="field-control min-w-0" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"/><button className="primary-button px-3" disabled={busy} aria-label="Ajouter"><FileUp size={16}/></button></form> : null}<div className="mt-3 divide-y divide-[var(--border)]">{request.documents?.map((document) => <button className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm" onClick={() => void downloadFile(downloadInformationRequestDocument(id, document.id))} key={document.id}><span className="min-w-0"><strong className="block truncate">{document.original_name}</strong><small className="text-[var(--muted)]">{Math.ceil(document.size_bytes / 1024)} Ko</small></span><Download className="flex-none text-violet-600" size={16}/></button>)}{!request.documents?.length ? <p className="text-sm text-[var(--muted)]">Aucune pièce jointe.</p> : null}</div></section>
      </aside>
    </section>
  </div></AppShell>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-violet-50 p-3"><small className="text-violet-700">{label}</small><strong className="mt-1 block text-xl">{value}</strong></div>; }
function statusLabel(status: string) { return ({ invited: "Invité", viewed: "Consulté", submitted: "Réponse reçue" } as Record<string, string>)[status] ?? status; }
function dateTime(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)); }
