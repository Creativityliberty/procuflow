"use client";

import { Download, FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { deletePurchaseRequestDocument, downloadPurchaseRequestDocument, uploadPurchaseRequestDocument } from "@/lib/procuflow-api";
import type { DocumentAttachmentRecord } from "@/lib/types";

type Props = {
  requestId: number;
  status: string;
  initialDocuments?: DocumentAttachmentRecord[];
};

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export function PurchaseRequestDocuments({ requestId, status, initialDocuments = [] }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editable = status === "draft";

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const created: DocumentAttachmentRecord[] = [];
      for (const file of Array.from(files)) created.push(await uploadPurchaseRequestDocument(requestId, file) as DocumentAttachmentRecord);
      setDocuments((current) => [...created, ...current]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Televersement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function download(document: DocumentAttachmentRecord) {
    setError("");
    try {
      const result = await downloadPurchaseRequestDocument(requestId, document.id);
      const url = URL.createObjectURL(result.blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = result.filename || document.original_name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Telechargement impossible.");
    }
  }

  async function remove(documentId: number) {
    setBusy(true);
    setError("");
    try {
      await deletePurchaseRequestDocument(requestId, documentId);
      setDocuments((current) => current.filter((document) => document.id !== documentId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="app-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <div><h2 className="m-0 flex items-center gap-2 text-base font-semibold"><Paperclip size={17} /> Pieces justificatives</h2><p className="mb-0 mt-1 text-xs text-[var(--muted)]">{documents.length} fichier{documents.length > 1 ? "s" : ""} dans le dossier</p></div>
        {editable ? <label className="secondary-button cursor-pointer"><Upload size={16} /> {busy ? "Ajout..." : "Ajouter"}<input ref={inputRef} type="file" multiple className="sr-only" disabled={busy} onChange={(event) => void upload(event.target.files)} /></label> : null}
      </div>
      {error ? <p className="m-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      {documents.length ? <div className="divide-y divide-[var(--border)]">{documents.map((document) => <div className="flex items-center gap-3 p-4" key={document.id}><span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-violet-50 text-[var(--violet)]"><FileText size={18} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{document.original_name}</strong><small className="text-[var(--muted)]">{fileSize(document.size_bytes)}</small></span><button type="button" className="grid h-9 w-9 place-items-center rounded-xl hover:bg-[var(--surface-soft)]" onClick={() => void download(document)} aria-label={`Telecharger ${document.original_name}`}><Download size={16} /></button>{editable ? <button type="button" className="grid h-9 w-9 place-items-center rounded-xl text-red-600 hover:bg-red-50" disabled={busy} onClick={() => void remove(document.id)} aria-label={`Supprimer ${document.original_name}`}><Trash2 size={16} /></button> : null}</div>)}</div> : <p className="m-0 p-4 text-sm text-[var(--muted)]">Aucune piece ajoutee.</p>}
    </article>
  );
}
