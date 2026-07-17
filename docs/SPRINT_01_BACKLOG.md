# Sprint 01 - Backlog propose

> Archive historique. L'etat consolide et les ecarts restants sont suivis dans `SPRINT_05_AUDIT.md`.

## Objectif

Transformer le Sprint 00 en vraie base applicative Next.js + Laravel API.

## Frontend

- initialiser Next.js + TypeScript ;
- installer Tailwind, shadcn/ui, lucide-react, motion ;
- creer AppShell ;
- creer Sidebar retractable ;
- creer TenantSwitcher ;
- creer Dashboard ;
- creer pages fournisseurs, ACDE, demandes achat ;
- brancher des mocks TypeScript propres.

## Backend

- initialiser Laravel API ;
- configurer Sanctum ;
- preparer tenant middleware ;
- creer migrations coeur :
  - tenants ;
  - users ;
  - tenant_users ;
  - roles ;
  - permissions ;
  - suppliers ;
  - supplier_documents ;
  - acde_needs.

## API

- `/api/v1/auth/login`
- `/api/v1/me`
- `/api/v1/suppliers`
- `/api/v1/acde-needs`
- `/api/v1/dashboard`

## UX attendue

- menu moderne arrondi ;
- boutons violets ;
- fond clair ;
- tables propres ;
- fiche detail ;
- responsive mobile ;
- aucune dependance aux secrets DOHONE dans le front.

## Sortie Sprint 01

- app locale executable ;
- README lancement ;
- ZIP cumulatif Sprint 01 ;
- notes de migration depuis Sprint 00.
