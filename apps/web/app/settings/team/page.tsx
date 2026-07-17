"use client";

import { MailPlus, RefreshCw, Save, ShieldCheck, Trash2, UserRoundCog, UsersRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { approvalRoleLabels } from "@/lib/format";
import { getTeam, inviteTeamMember, removeTeamMember, revokeTeamInvitation, updateTeamMember } from "@/lib/procuflow-api";
import type { TeamData, TeamMemberRecord } from "@/lib/types";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    try { setTeam(await getTeam()); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Equipe inaccessible."); }
  }
  useEffect(() => { void load(); }, []);

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await inviteTeamMember({ email: String(data.get("email")), role: String(data.get("role")) });
      form.reset();
      setMessage("Invitation envoyee. Le lien expire dans 7 jours.");
      await load();
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Invitation impossible."); }
    finally { setBusy(false); }
  }

  return <AppShell><div className="space-y-5"><PageHeading title="Equipe et acces" description="Invitez vos collaborateurs et attribuez uniquement les droits necessaires a leur fonction." />
    <section className="app-panel p-4 sm:p-5"><div className="flex items-center gap-2"><MailPlus size={18} className="text-[var(--violet)]" /><h2 className="m-0 text-base font-semibold">Inviter un collaborateur</h2></div><form className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_auto]" onSubmit={invite}><label><span className="field-label">Adresse e-mail</span><input className="field-control" name="email" type="email" required placeholder="collaborateur@entreprise.com" /></label><label><span className="field-label">Role</span><select className="field-control" name="role" defaultValue="requester">{(team?.roles ?? []).filter((role) => role !== "owner").map((role) => <option key={role} value={role}>{approvalRoleLabels[role] ?? role}</option>)}</select></label><button className="primary-button self-end disabled:opacity-60" disabled={busy || !team} type="submit"><MailPlus size={16} />Inviter</button></form>{message ? <p className="mb-0 mt-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-800">{message}</p> : null}</section>
    <section className="app-panel overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--border)] p-4"><div className="flex items-center gap-2"><UsersRound size={18} /><h2 className="m-0 text-base font-semibold">Membres actifs</h2></div><button className="secondary-button min-h-9 px-3" onClick={() => void load()} title="Actualiser"><RefreshCw size={15} /></button></div>{!team ? <p className="p-5 text-sm text-[var(--muted)]">Chargement de l&apos;equipe...</p> : <div className="divide-y divide-[var(--border)]">{team.members.map((member) => <MemberRow key={member.id} member={member} roles={team.roles} onChanged={load} onMessage={setMessage} />)}</div>}</section>
    <section className="app-panel overflow-hidden"><div className="flex items-center gap-2 border-b border-[var(--border)] p-4"><ShieldCheck size={18} /><h2 className="m-0 text-base font-semibold">Invitations en attente</h2></div>{team?.invitations.length ? <div className="divide-y divide-[var(--border)]">{team.invitations.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center gap-3 p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><UserRoundCog size={17} /></span><span className="min-w-[190px] flex-1"><strong className="block text-sm">{invitation.email}</strong><small className="text-[var(--muted)]">{approvalRoleLabels[invitation.role] ?? invitation.role} · expire le {new Date(invitation.expires_at).toLocaleDateString("fr-FR")}</small></span><button className="secondary-button min-h-9 text-red-700" onClick={async () => { await revokeTeamInvitation(invitation.id); setMessage("Invitation revoquee."); await load(); }}><X size={15} />Revoquer</button></div>)}</div> : <p className="m-0 p-5 text-sm text-[var(--muted)]">Aucune invitation en attente.</p>}</section>
  </div></AppShell>;
}

function MemberRow({ member, roles, onChanged, onMessage }: { member: TeamMemberRecord; roles: string[]; onChanged: () => Promise<void>; onMessage: (message: string) => void }) {
  const [role, setRole] = useState(member.role);
  const [jobTitle, setJobTitle] = useState(member.job_title ?? "");
  const [busy, setBusy] = useState(false);

  async function save() { setBusy(true); try { await updateTeamMember(member.id, { role, job_title: jobTitle || null }); onMessage(`${member.name} a ete mis a jour.`); await onChanged(); } catch (caught) { onMessage(caught instanceof Error ? caught.message : "Modification impossible."); } finally { setBusy(false); } }
  async function remove() { if (!window.confirm(`Retirer l acces de ${member.name} ?`)) return; setBusy(true); try { await removeTeamMember(member.id); onMessage(`${member.name} a ete retire de l equipe.`); await onChanged(); } catch (caught) { onMessage(caught instanceof Error ? caught.message : "Suppression impossible."); } finally { setBusy(false); } }

  return <div className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_200px_220px_auto]"><span className="min-w-0 self-center"><strong className="block truncate text-sm">{member.name}</strong><small className="block truncate text-[var(--muted)]">{member.email}</small></span><label><span className="sr-only">Role de {member.name}</span><select className="field-control" value={role} onChange={(event) => setRole(event.target.value)}>{roles.map((item) => <option key={item} value={item}>{approvalRoleLabels[item] ?? item}</option>)}</select></label><label><span className="sr-only">Fonction de {member.name}</span><input className="field-control" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Fonction (facultatif)" /></label><span className="flex gap-2"><button className="secondary-button min-h-10 px-3" disabled={busy} onClick={() => void save()} title="Enregistrer"><Save size={15} /></button><button className="secondary-button min-h-10 px-3 text-red-700" disabled={busy} onClick={() => void remove()} title="Retirer"><Trash2 size={15} /></button></span></div>;
}
