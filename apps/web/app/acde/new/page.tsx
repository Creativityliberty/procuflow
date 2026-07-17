import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { NeedForm } from "@/features/acde/need-form";

export default function NewNeedPage() {
  return <AppShell><div className="space-y-5"><PageHeading eyebrow="Expression du besoin / Nouveau" title="Decrire un besoin" description="Repondez simplement aux quatre questions. Vous pourrez corriger le contenu avant la demande d'achat." /><NeedForm /></div></AppShell>;
}
