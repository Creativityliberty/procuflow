# Sprint 01 - App shell et socle applicatif

## Objectif

Passer du prototype Sprint 00 a une base applicative structurée :

- shell Next.js ;
- menu moderne responsive ;
- mocks TypeScript ;
- premiers composants metier ;
- squelette Laravel API ;
- ZIP cumulatif.

## Ajouts

### Frontend

```txt
apps/web
  app/
  components/
  features/
  lib/
```

Pages et composants :

- `AppShell`
- `Sidebar`
- `DashboardPage`
- `PurchaseRequestTable`
- `SupplierHealth`
- `AcdePreview`

### Backend

```txt
apps/api
  routes/api.php
  app/Models
  app/Services
  app/Http/Controllers/Api/V1
  database/migrations
```

Squelette inclus :

- tenants ;
- fournisseurs ;
- ACDE ;
- demandes achat ;
- DOHONE payment service ;
- dashboard endpoint.

## Conservation Sprint 00

Le prototype HTML est conserve dans :

```txt
frontend/index.html
```

Il sert de preview rapide sans installation.

## Limites

Le dossier `apps/api` est un squelette Laravel cible, pas encore un projet Laravel installe par Composer. L'installation complete est prevue au Sprint 02.

## Sprint suivant

Sprint 02 :

- installer Laravel reel ;
- installer Next.js dependencies ;
- connecter frontend aux premiers endpoints ;
- ajouter auth multi-tenant ;
- generer ZIP cumulatif Sprint 02.

