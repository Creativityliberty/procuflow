"use client";

import { Building2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { acceptInvitation, getInvitation } from "@/lib/procuflow-api";
import { approvalRoleLabels } from "@/lib/format";
import type { InvitationPreview } from "@/lib/types";

export function InvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { getInvitation(token).then(setInvitation).catch((caught) => setError(caught instanceof Error ? caught.message : "Invitation invalide.")); }, [token]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await acceptInvitation(token, { name: String(data.get("name") || "") || undefined, password: String(data.get("password")), password_confirmation: String(data.get("password_confirmation") || "") || undefined });
      router.push("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Acceptation impossible.");
      setBusy(false);
    }
  }

  if (error && !invitation) return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!invitation) return <p className="text-sm text-[var(--muted)]">Verification de l&apos;invitation...</p>;

  return <form className="space-y-4" onSubmit={submit}><div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-violet-50/70 p-3"><span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-violet-700 text-white"><Building2 size={18} /></span><span><strong className="block">{invitation.tenant.name}</strong><small className="text-[var(--muted)]">Role : {approvalRoleLabels[invitation.role] ?? invitation.role}</small></span></div><label className="block"><span className="field-label">Adresse invitee</span><input className="field-control bg-slate-50" readOnly value={invitation.email} /></label>{!invitation.existing_user ? <label className="block"><span className="field-label">Nom complet</span><input className="field-control" name="name" required autoComplete="name" /></label> : null}<label className="block"><span className="field-label">{invitation.existing_user ? "Mot de passe actuel" : "Creer un mot de passe"}</span><input className="field-control" name="password" type="password" minLength={invitation.existing_user ? undefined : 10} required autoComplete={invitation.existing_user ? "current-password" : "new-password"} /></label>{!invitation.existing_user ? <label className="block"><span className="field-label">Confirmer le mot de passe</span><input className="field-control" name="password_confirmation" type="password" minLength={10} required autoComplete="new-password" /></label> : null}{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<button className="primary-button w-full disabled:opacity-60" disabled={busy} type="submit"><CheckCircle2 size={17} />{busy ? "Activation..." : "Rejoindre l equipe"}</button></form>;
}
