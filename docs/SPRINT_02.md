# Sprint 02 - Pages applicatives et API prete a installer

## Objectif

Faire passer ProcuFlow Africa d'un shell Sprint 01 a une base produit plus concrete :

- routes frontend metier ;
- client API ;
- etats loading/error ;
- routes fournisseurs, ACDE, demandes achat et workflows ;
- middleware tenant cible ;
- policies et FormRequests Laravel ;
- seed demo ;
- test de verification DOHONE.

## Frontend ajoute

Routes :

```txt
/
/suppliers
/acde
/purchase-requests
/settings/workflows
```

Composants :

```txt
PageHeading
StateCard
AnimatedPanel
```

Client API :

```txt
apps/web/lib/api-client.ts
```

## Backend ajoute

```txt
apps/api/composer.json
apps/api/.env.example
apps/api/app/Http/Middleware/ResolveTenant.php
apps/api/app/Policies/SupplierPolicy.php
apps/api/app/Http/Requests/StoreSupplierRequest.php
apps/api/app/Http/Requests/StoreAcdeNeedRequest.php
apps/api/database/seeders/DemoSeeder.php
apps/api/tests/Unit/DohonePaymentServiceTest.php
```

## Decisions

- DOHONE reste cote backend uniquement.
- Le frontend ne contient aucun secret marchand.
- Le menu est route-aware avec `usePathname`.
- Sprint 02 reste cumulatif : Sprint 00 et Sprint 01 sont conserves.

## Limites

L'environnement actuel n'a pas PHP installe. Les fichiers Laravel sont donc structures pour l'installation au Sprint 03, mais non executes ici.

La generation du lock npm a aussi ete bloquee par le cache force vers `/root/.npm` dans l'environnement courant. Une `.npmrc` locale a ete ajoutee pour forcer un cache projet lors de l'installation dans un environnement dev normal.

## Sprint suivant

Sprint 03 :

- installer un vrai projet Laravel ;
- installer les dependances Next ;
- corriger le build si besoin ;
- connecter les pages aux endpoints ;
- ajouter le module documents fournisseurs ;
- produire ZIP cumulatif Sprint 03.
