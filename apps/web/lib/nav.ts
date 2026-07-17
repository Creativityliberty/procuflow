import {
  BadgeCheck,
  BellRing,
  BarChart3,
  ChartNoAxesCombined,
  ClipboardList,
  FileCheck2,
  FileText,
  GitCompare,
  MessageSquareText,
  PackageCheck,
  ScrollText,
  Truck,
  UsersRound
} from "lucide-react";

export const navItems = [
  { label: "Tableau de bord", icon: BarChart3, href: "/" },
  { label: "Pilotage achats", icon: ChartNoAxesCombined, href: "/reports" },
  { label: "Fournisseurs", icon: UsersRound, href: "/suppliers" },
  { label: "Contrats", icon: ScrollText, href: "/contracts" },
  { label: "Expression du besoin", icon: ClipboardList, href: "/acde" },
  { label: "Demandes d'information", icon: MessageSquareText, href: "/information-requests" },
  { label: "Demandes d'achat", icon: FileText, href: "/purchase-requests" },
  { label: "Validations", icon: BadgeCheck, href: "/approvals" },
  { label: "Automatisations", icon: BellRing, href: "/settings/automations" },
  { label: "Consultations", icon: GitCompare, href: "/rfqs" },
  { label: "Commandes", icon: PackageCheck, href: "/purchase-orders" },
  { label: "Livraisons", icon: Truck, href: "/deliveries" },
  { label: "Factures", icon: FileCheck2, href: "/invoices" }
];
