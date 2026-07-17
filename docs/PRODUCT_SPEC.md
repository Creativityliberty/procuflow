# Specification produit

## Nom provisoire

ProcuFlow Africa

## Promesse

Digitaliser le processus achat des PME et entreprises africaines, de la formulation du besoin au paiement, avec validation, traçabilite et pilotage.

L'etat d'implementation reel par module est maintenu dans `SPRINT_05_AUDIT.md`. La liste ci-dessous decrit le perimetre produit vise et ne signifie pas que chaque module est deja livre.

## Utilisateurs

| Role | Besoin principal |
| --- | --- |
| Super Admin SaaS | gerer la plateforme |
| Admin Entreprise | configurer l'entreprise, les roles et workflows |
| Acheteur | gerer fournisseurs, RFQ, offres, commandes |
| Demandeur | creer des demandes internes |
| Responsable Achats / N+1 | valider ou rejeter |
| Magasin | confirmer les receptions |
| DAF | valider les engagements financiers |
| Controle de Gestion | verifier budget et centre de cout |
| DG | valider les gros montants |
| Fournisseur | deposer documents, offres, factures |
| Comptabilite | rapprocher facture, BC et BL |

## Modules MVP

### Authentification et tenants

- entreprise cliente ;
- utilisateurs rattaches ;
- roles et permissions ;
- switch d'organisation ;
- invitation utilisateur.

### Fournisseurs

- creation autonome ou par acheteur ;
- statuts : brouillon, en attente, actif, inactif, suspendu ;
- validation acheteur puis N+1 ;
- categories ;
- documents ;
- historique ;
- evaluation sur 6 criteres.

### ACDE

Rubriques :

- Attentes ;
- Contraintes ;
- Donnees ;
- Exigences.

Sorties possibles :

- cahier de charge ;
- demande d'achat ;
- RFQ ;
- note de synthese.

### Demande d'achat

- articles ;
- budget ;
- service ;
- projet ;
- priorite ;
- workflow de validation ;
- historique.

### RFQ et consultation

- selection fournisseurs par categorie ;
- envoi consultation ;
- relances ;
- reception offres ;
- cloture ;
- comparaison.

### Bon de commande

- generation ;
- validation multi-niveaux ;
- PDF ;
- signature simple au MVP ;
- envoi fournisseur ;
- accuse reception.

### Livraison et facture

- BL ;
- PV reception ;
- reception partielle/totale ;
- facture ;
- rapprochement BC/BL/facture ;
- transmission paiement.

### Dashboard

KPI acheteur :

- demandes en attente ;
- commandes non livrees ;
- montant engage ;
- temps moyen de traitement ;
- taux de validation.

KPI fournisseur :

- chiffre d'affaires realise ;
- commandes en retard ;
- taux de conformite ;
- score fournisseur.
