import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { PurchaseRequestSummary } from "@/features/requests/purchase-request-summary";
import { PurchaseRequestTable } from "@/features/requests/purchase-request-table";

export default function PurchaseRequestsPage() {
  return <AppShell><div className="space-y-5"><PageHeading title="Demandes d'achat" description="Suivez vos brouillons, validations et demandes en consultation." action="Creer une demande" actionHref="/purchase-requests/new" /><PurchaseRequestSummary /><PurchaseRequestTable /></div></AppShell>;
}
