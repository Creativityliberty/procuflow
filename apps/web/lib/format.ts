export function formatMoney(amount: number, currency = "XAF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export const purchaseRequestStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  pending: "En validation",
  approved: "Validee",
  rejected: "Rejetee",
  in_consultation: "En consultation",
  supplier_selected: "Fournisseur selectionne",
  ordered: "Commandee"
};

export const supplierStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu"
};

export const approvalRoleLabels: Record<string, string> = {
  owner: "Proprietaire",
  admin: "Administrateur",
  requester: "Demandeur",
  manager: "Responsable hierarchique",
  buyer: "Acheteur",
  procurement_manager: "Responsable achats",
  controller: "Controle de gestion",
  finance: "Direction financiere",
  director: "Direction generale",
  storekeeper: "Magasin / reception",
  accounting: "Comptabilite"
};

export const priorityLabels: Record<string, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente"
};
