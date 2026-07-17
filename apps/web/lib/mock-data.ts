export const metrics = [
  { label: "Demandes en attente", value: "18", hint: "+6 cette semaine" },
  { label: "Montant engage", value: "42.8M XAF", hint: "Budget sous controle" },
  { label: "Fournisseurs actifs", value: "126", hint: "14 a valider" },
  { label: "Commandes non livrees", value: "9", hint: "3 urgentes" }
];

export const purchaseRequests = [
  {
    reference: "DA-2401",
    title: "Ordinateurs equipe finance",
    service: "Finance",
    amount: "6.2M XAF",
    status: "En validation"
  },
  {
    reference: "DA-2402",
    title: "Maintenance groupe electrogene",
    service: "Operations",
    amount: "1.1M XAF",
    status: "Validee"
  },
  {
    reference: "DA-2403",
    title: "Fournitures bureau Q3",
    service: "Admin",
    amount: "850k XAF",
    status: "Brouillon"
  }
];

export const suppliers = [
  {
    id: "sup_001",
    name: "CamTech Services",
    category: "Informatique",
    city: "Douala",
    status: "Actif",
    score: "4.6",
    risk: "low"
  },
  {
    id: "sup_002",
    name: "LogisPro Douala",
    category: "Transport",
    city: "Douala",
    status: "En attente N+1",
    score: "4.1",
    risk: "medium"
  },
  {
    id: "sup_003",
    name: "BTP Horizon",
    category: "BTP",
    city: "Yaounde",
    status: "Assurance expiree",
    score: "3.2",
    risk: "high"
  }
];

export const acdeCards = [
  { letter: "A", title: "Attentes", text: "Resultats et performances souhaitees." },
  { letter: "C", title: "Contraintes", text: "Normes, obligations, contexte externe." },
  { letter: "D", title: "Donnees", text: "Quantites, delais, lieux, budgets." },
  { letter: "E", title: "Exigences", text: "Imperatifs internes non negociables." }
];

export const acdeNeeds = [
  {
    id: "acde_001",
    title: "Renouvellement parc informatique finance",
    owner: "Equipe Finance",
    priority: "Haute",
    status: "Pret pour demande achat"
  },
  {
    id: "acde_002",
    title: "Maintenance groupe electrogene siege",
    owner: "Operations",
    priority: "Moyenne",
    status: "A completer"
  }
];

export const workflowSteps = [
  { label: "Demandeur", description: "Cree et justifie le besoin" },
  { label: "N+1", description: "Valide l'opportunite" },
  { label: "Controle Gestion", description: "Verifie budget et centre de cout" },
  { label: "DAF", description: "Valide l'engagement financier" },
  { label: "DG", description: "Valide les montants sensibles" }
];

