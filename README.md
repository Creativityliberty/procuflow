# ProcuFlow Africa - Sprint 16 cumulatif

SaaS multi-tenant de gestion des achats et des approvisionnements, concu pour les entreprises africaines.

## Fonctionnalites disponibles

- inscription, connexion, configuration guidee et roles par entreprise ;
- interface responsive, menu retractable, composants arrondis et glassmorphism leger ;
- fournisseurs, documents prives, historique et evaluation sur six criteres ;
- besoins ACDE multi-criteres, niveaux obligatoire/souhaite/confort et objectifs SMART ;
- budget, lieu, pieces justificatives, export PDF et transformation tracee en demande d'achat ;
- validations configurables selon le montant et centre de validations ;
- controle de stock obligatoire et achat limite au reliquat ;
- politique de mise en concurrence et derogations tracees ;
- consultations RFQ, invitations privees et portail fournisseur sans compte ;
- matrice de conformite des offres issue automatiquement du cahier des charges ACDE ;
- blocage de la recommandation lorsqu'une exigence obligatoire n'est pas conforme ;
- demandes d'information fournisseurs (RFI), documents, diffusion par e-mail et portail de reponse securise ;
- suivi des consultations RFI, pieces de reponse, cloture, archivage et liens regenerables ;
- offres versionnees, messages et cloture selon le quota requis ;
- comparaison multicritere avec pondérations configurables et classement automatique ;
- evaluation qualitative, risque, synthese et recommandation fournisseur ;
- validation Responsable Achats et rapport imprimable en PDF ;
- bons de commande generes depuis une selection approuvee et lignes contractuelles figees ;
- circuit BC Acheteur, N+1, DAF, Controle de gestion et Direction generale ;
- document BC imprimable, envoi securise et accuse d'acceptation fournisseur ;
- confirmation de livraison par le fournisseur et planning de reception ;
- receptions partielles ou totales avec reliquats calcules par article ;
- archivage prive des bons de livraison et PV de reception ;
- depot securise des factures fournisseur et controle des echeances ;
- rapprochement automatique a trois voies BC, BL et facture avec tolerance ;
- transmission au paiement, reference de reglement et statut paye ;
- relances automatiques RFI, RFQ, validations, livraisons, factures, contrats et documents ;
- centre de notifications, e-mails, reglages par entreprise et anti-doublon ;
- permissions centralisees par role pour chaque action sensible ;
- administration de l'equipe, invitations temporaires et revocables ;
- recuperation de mot de passe avec invalidation des anciennes sessions ;
- expiration et revocation des liens prives RFQ et bons de commande ;
- reporting LEAN avec KPI acheteur, tendances et filtres temporels ;
- analyse des derives budgetaires par commande, service et centre de cout ;
- performance et surveillance fournisseurs avec niveaux de risque ;
- rapports mensuels et trimestriels archives automatiquement, export CSV ;
- tableau de bord, isolation multi-tenant et journal d'audit ;
- integration DOHONE avec pages de retour, controle de configuration, Hashing cote serveur et journal des notifications ;
- contrats fournisseurs avec responsable, valeur, documents prives et historique complet ;
- alertes contractuelles configurables, initialisees a 90 jours avant echeance ;
- activation conditionnee au depot du contrat signe, renouvellement et resiliation traces ;
- essai SaaS de 14 jours, forfaits FCFA, quotas utilisateurs/fournisseurs/stockage ;
- paiement des abonnements DOHONE avec prix calcule cote serveur, verification Hashing stricte et idempotence.

Le prochain bloc fonctionnel pourra renforcer la validation fournisseur a deux niveaux, la mesure des gains de temps LEAN et les connecteurs ERP/comptabilite.

## Stack sans abonnement obligatoire

- Next.js 14, React, TypeScript et Tailwind CSS ;
- Laravel 11 et Sanctum ;
- SQLite en local, PostgreSQL possible en production ;
- stockage prive local, compatible S3 ;
- e-mails dans les logs en local.

## Frontend

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web
```

Ouvrir `http://localhost:3000`. Pour le Sprint 9 : faire accepter une commande dans le portail fournisseur, confirmer sa date puis ouvrir `Livraisons` pour enregistrer BL, PV et quantites recues.

## API Laravel

Prerequis : PHP 8.2+, extension SQLite et Composer 2.

```bash
cd apps/api
composer install
cp .env.example .env
touch database/database.sqlite
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Configurer ensuite le frontend :

```dotenv
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Compte du seeder : `demo@procuflow.local` / `Procuflow2026`.

## Verification

```bash
pnpm lint:web
pnpm build:web

cd apps/api
php artisan test
```

Le detail fonctionnel est disponible dans `docs/SPRINT_16.md`, et l'etat de couverture complet dans `docs/SPRINT_16_AUDIT.md`. Le contrat REST est dans `backend/contracts/openapi.yaml` et la mise en production dans `docs/PRODUCTION_CHECKLIST.md`.

## Securite DOHONE

Le code de hachage reste exclusivement dans les variables d'environnement du serveur. Le code marchand est configure cote serveur puis transmis uniquement dans le formulaire DOHONE, comme l'exige le protocole. Aucun secret DOHONE n'est livre au navigateur ou dans le depot.

## Livraison

Chaque sprint produit un ZIP cumulatif du projet complet, sans dependances generees, caches ni secrets.
