"use client";

import { ArrowDown, ArrowUp, CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { approvalRoleLabels, formatMoney } from "@/lib/format";
import { getApprovalWorkflow, updateApprovalWorkflow } from "@/lib/procuflow-api";
import type { ApprovalWorkflowStepRecord } from "@/lib/types";

const roleOptions = Object.entries(approvalRoleLabels);

export default function WorkflowSettingsPage() {
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<ApprovalWorkflowStepRecord[]>([]);
  const [testAmount, setTestAmount] = useState(2500000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getApprovalWorkflow()
      .then((workflow) => {
        setName(workflow.name);
        setSteps(workflow.steps);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Chargement impossible."))
      .finally(() => setLoading(false));
  }, []);

  const matchingSteps = useMemo(() => steps.filter((step) => testAmount >= step.minimum_amount && (step.maximum_amount == null || testAmount <= step.maximum_amount)), [steps, testAmount]);

  function updateStep(index: number, patch: Partial<ApprovalWorkflowStepRecord>) {
    setSteps((current) => current.map((step, position) => position === index ? { ...step, ...patch } : step));
    setSaved(false);
  }

  function moveStep(index: number, direction: -1 | 1) {
    setSteps((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((step, position) => ({ ...step, step_order: position + 1 }));
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const workflow = await updateApprovalWorkflow({
        name,
        steps: steps.map((step) => ({ role: step.role, minimum_amount: Number(step.minimum_amount), maximum_amount: step.maximum_amount ?? null }))
      });
      setSteps(workflow.steps);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell><div className="space-y-5">
      <PageHeading title="Regles de validation" description="Definissez qui valide une demande et a partir de quel montant." />
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
      {loading ? <div className="app-panel h-80 animate-pulse" /> : (
        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="app-panel overflow-hidden">
            <div className="border-b border-[var(--border)] p-4">
              <label className="block"><span className="field-label">Nom du circuit</span><input className="field-control max-w-lg" value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} /></label>
              <p className="mb-0 mt-2 text-xs text-[var(--muted)]">Les etapes sont executees dans cet ordre. Une etape s&apos;applique lorsque le montant atteint son seuil.</p>
            </div>
            <div className="space-y-3 p-4">
              {steps.map((step, index) => (
                <div className="grid gap-3 rounded-xl border border-[var(--border)] p-3 md:grid-cols-[40px_1fr_190px_104px] md:items-end" key={`${step.id ?? "step"}-${index}`}>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--violet-soft)] text-sm font-bold text-[var(--violet)]">{index + 1}</span>
                  <label><span className="field-label">Role valideur</span><select className="field-control" value={step.role} onChange={(event) => updateStep(index, { role: event.target.value })}>{roleOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                  <label><span className="field-label">A partir de</span><div className="flex"><input className="field-control rounded-r-none" type="number" min="0" step="1000" value={step.minimum_amount} onChange={(event) => updateStep(index, { minimum_amount: Number(event.target.value) })} /><span className="grid min-w-14 place-items-center rounded-r-xl border border-l-0 border-[var(--border)] bg-[var(--surface-soft)] text-xs">XAF</span></div></label>
                  <div className="flex justify-end gap-1">
                    <button type="button" className="grid h-10 w-8 place-items-center rounded-xl hover:bg-[var(--surface-soft)] disabled:opacity-25" disabled={index === 0} onClick={() => moveStep(index, -1)} aria-label="Monter l'etape"><ArrowUp size={16} /></button>
                    <button type="button" className="grid h-10 w-8 place-items-center rounded-xl hover:bg-[var(--surface-soft)] disabled:opacity-25" disabled={index === steps.length - 1} onClick={() => moveStep(index, 1)} aria-label="Descendre l'etape"><ArrowDown size={16} /></button>
                    <button type="button" className="grid h-10 w-8 place-items-center rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-25" disabled={steps.length === 1} onClick={() => { setSteps((current) => current.filter((_, position) => position !== index).map((entry, position) => ({ ...entry, step_order: position + 1 }))); setSaved(false); }} aria-label="Supprimer l'etape"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              <button type="button" className="secondary-button" onClick={() => { setSteps((current) => [...current, { step_order: current.length + 1, role: "manager", minimum_amount: 0, maximum_amount: null }]); setSaved(false); }}><Plus size={16} /> Ajouter une etape</button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] p-4">
              {saved ? <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 size={17} /> Regles enregistrees</span> : null}
              <button className="primary-button disabled:cursor-wait disabled:opacity-70" type="button" onClick={() => void handleSave()} disabled={saving || !name.trim() || steps.length === 0}><Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer les regles"}</button>
            </div>
          </div>

          <aside className="app-panel h-fit p-4">
            <h2 className="m-0 text-base font-semibold">Tester le circuit</h2>
            <p className="mb-4 mt-1 text-xs leading-5 text-[var(--muted)]">Saisissez un montant pour voir les validations qui seront creees.</p>
            <label><span className="field-label">Montant de la demande</span><input className="field-control" type="number" min="0" step="1000" value={testAmount} onChange={(event) => setTestAmount(Number(event.target.value))} /></label>
            <strong className="mt-4 block text-sm">Circuit pour {formatMoney(testAmount)}</strong>
            <ol className="mb-0 mt-3 space-y-2 pl-0">
              {matchingSteps.map((step, index) => <li className="flex items-center gap-3 rounded-xl bg-[var(--surface-soft)] p-3 text-sm" key={`${step.role}-${index}`}><span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--violet)] text-xs font-bold text-white">{index + 1}</span><span>{approvalRoleLabels[step.role] ?? step.role}</span></li>)}
            </ol>
            {matchingSteps.length === 0 ? <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Aucune etape ne correspond a ce montant. Ajustez les seuils avant d&apos;enregistrer.</p> : null}
          </aside>
        </section>
      )}
    </div></AppShell>
  );
}
