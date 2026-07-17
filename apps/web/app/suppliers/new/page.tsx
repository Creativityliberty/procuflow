import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { SupplierForm } from "@/features/suppliers/supplier-form";

export default function NewSupplierPage() {
  return <AppShell><div className="space-y-5"><PageHeading eyebrow="Fournisseurs / Nouveau" title="Ajouter un fournisseur" description="Commencez par les informations principales. Les documents pourront etre ajoutes ensuite." /><SupplierForm /></div></AppShell>;
}
