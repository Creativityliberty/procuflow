import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { RfqForm } from "@/features/rfqs/rfq-form";
import { Suspense } from "react";

export default function NewRfqPage() {
  return <AppShell><div className="space-y-5"><PageHeading eyebrow="Consultations / Nouvelle" title="Nouvelle consultation" description="Choisissez une demande validee, une date limite et les fournisseurs a consulter." /><Suspense fallback={<div className="app-panel h-80 animate-pulse" />}><RfqForm /></Suspense></div></AppShell>;
}
