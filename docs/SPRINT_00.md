# Sprint 00 - Fondation produit et technique

## Objectif

Transformer le cahier des charges en socle de produit SaaS clair, codable et vendable.

## Perimetre

Inclus :

- vision produit ;
- modules MVP ;
- roles ;
- modele de donnees initial ;
- routes API V1 ;
- logique DOHONE securisee ;
- direction UX/UI ;
- prototype dashboard ;
- packaging ZIP cumulatif.

Exclus :

- implementation Laravel complete ;
- authentification reelle ;
- base de donnees ;
- paiement DOHONE reel ;
- signature electronique reelle.

Ces elements commencent au Sprint 01 et Sprint 02.

## Decisions clefs

### 1. Architecture

Backend principal : Laravel API.

Frontend principal : Next.js au Sprint 01. Sprint 00 livre un prototype HTML/CSS/JS pour valider l'ergonomie avant industrialisation.

### 2. Multi-tenant

Le repo GitHub `hexclave/multi-tenant-starter-template` confirme une bonne direction UX : organisations/equipes, dashboard, team switcher, settings. Pour ProcuFlow Africa, le tenant sera gere cote backend par l'entreprise cliente.

### 3. UX

Direction visuelle :

- fond clair lavande/ivoire ;
- formes arrondies ;
- boutons violets ;
- navigation laterale moderne ;
- fiche detail contextuelle ;
- statuts metier visibles ;
- pas de noir massif.

### 4. Differenciation

Le module ACDE devient le coeur intelligent du produit. L'utilisateur ne cree pas seulement une demande d'achat : il clarifie le besoin avec Attentes, Contraintes, Donnees, Exigences.

## Roadmap

| Sprint | Objectif | Sortie |
| --- | --- | --- |
| 00 | Cadrage + prototype | ZIP fondation |
| 01 | Next.js shell + Laravel API shell | app dev executable |
| 02 | Auth multi-tenant + roles | login + organisations |
| 03 | Fournisseurs + documents | module fournisseur |
| 04 | ACDE + demandes d'achat | workflow besoin -> DA |
| 05 | Validations configurables | approbations |
| 06 | RFQ + offres fournisseurs | consultation |
| 07 | Comparaison + scoring | classement |
| 08 | Bons de commande + PDF | PO |
| 09 | Livraison + facture | rapprochement |
| 10 | DOHONE + abonnement | billing |
| 11 | Dashboard KPI + audit | pilotage |

## Definition du MVP vendable

En 30 jours, une entreprise doit pouvoir passer de demandes WhatsApp/Excel a un circuit achat clair :

- fournisseurs valides ;
- demandes tracees ;
- validations securisees ;
- commandes suivies ;
- documents centralises ;
- factures rapprochees ;
- KPI de base.

