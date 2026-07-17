# Sprint 02 - Backlog propose

> Archive historique. L'etat consolide et les ecarts restants sont suivis dans `SPRINT_05_AUDIT.md`.

## Objectif

Transformer le squelette Sprint 01 en application locale executable avec installation reelle des dependances et premiers flux branches.

## Frontend

- installer les dependances Next.js ;
- verifier le build ;
- brancher un client API ;
- creer les routes :
  - `/`
  - `/suppliers`
  - `/acde`
  - `/purchase-requests`
  - `/settings/workflows`
- ajouter transitions Motion sur sidebar et panneaux ;
- ajouter etats loading, empty, error.

## Backend

- installer Laravel reel dans `apps/api` ;
- installer Sanctum ;
- creer migrations reelles ;
- creer seeders demo ;
- implementer middleware tenant ;
- implementer policies fournisseurs ;
- implementer endpoints :
  - `GET /api/v1/dashboard`
  - `GET /api/v1/suppliers`
  - `POST /api/v1/suppliers`
  - `GET /api/v1/acde-needs`
  - `POST /api/v1/acde-needs`

## Paiement DOHONE

- ne pas brancher de paiement reel avant auth et billing ;
- garder uniquement `.env.example` et service de verification ;
- ajouter tests unitaires sur hash.

## Sortie

- app locale executable ;
- ZIP cumulatif Sprint 02 ;
- README lancement dev ;
- capture ou verification UI.
