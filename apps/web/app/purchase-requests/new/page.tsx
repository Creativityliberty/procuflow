import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { PurchaseRequestForm } from "@/features/requests/purchase-request-form";

export default function NewPurchaseRequestPage() {
  return <AppShell><div className="space-y-5"><PageHeading eyebrow="Demandes d'achat / Nouvelle" title="Nouvelle demande d'achat" description="Decrivez le besoin, ajoutez les articles puis envoyez la demande au bon valideur." /><PurchaseRequestForm /></div></AppShell>;
}
