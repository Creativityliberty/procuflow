# Architecture technique

## Architecture cible

```txt
Frontend Web
  Next.js / TypeScript / Tailwind / shadcn / Motion
        |
        | REST JSON / Bearer token
        v
Backend API
  Laravel API / Policies / Queues / Notifications
        |
        +--> PostgreSQL
        +--> Redis queues
        +--> Storage documents
        +--> DOHONE
        +--> Email provider
```

## Socle exécutable au Sprint 16

- Next.js et API Laravel REST ;
- authentification Sanctum et isolation par entreprise ;
- SQLite local, avec configuration PostgreSQL disponible pour la production ;
- documents fournisseurs sur disque prive configurable ;
- stockage privé des documents ACDE, demandes, RFI, contrats, livraisons et factures ;
- audit des actions principales, validations synchrones et relances dédupliquées ;
- portail fournisseur public à tokens hashés pour RFI, RFQ et commandes ;
- reporting périodique, contrats et abonnement SaaS ;
- vérification Hashing et idempotence des notifications DOHONE.

Redis, un worker de queue, un SMTP transactionnel et un stockage objet compatible S3 sont recommandés en production. Le code n'impose aucun abonnement propriétaire.

## Principes

- API versionnee : `/api/v1`.
- Multi-tenant obligatoire des le depart.
- Toutes les tables metier portent `tenant_id`.
- Les documents sont rattaches a une entite metier et soumis aux permissions.
- Les validations sont journalisees.
- Les webhooks paiement sont idempotents.

## Frontend

Sprint 01 :

```txt
apps/web
  app/
  components/
  features/
  lib/
  styles/
```

Composants prioritaires :

- AppShell ;
- Sidebar moderne retractable ;
- Topbar ;
- TenantSwitcher ;
- StatCard ;
- DataTable ;
- StatusBadge ;
- DetailPanel ;
- WorkflowTimeline ;
- AcdeBuilder.

## Backend

Sprint 01 :

```txt
apps/api
  app/Models
  app/Http/Controllers/Api/V1
  app/Policies
  app/Services
  app/Actions
  app/Jobs
  database/migrations
```

Services prioritaires :

- TenantResolver ;
- SupplierScoringService ;
- WorkflowService ;
- DocumentService ;
- DohonePaymentService ;
- AuditLogger.

## Securite

- secrets via `.env` uniquement ;
- hash DOHONE verifie cote serveur ;
- audit logs ;
- permissions par role ;
- matrice RBAC centralisee et appliquee par middleware ;
- invitations d'equipe et liens fournisseurs temporaires, hashes et revocables ;
- reinitialisation de mot de passe avec revocation des sessions ;
- reporting calcule depuis les donnees metier, snapshots periodiques et index temporels dedies ;
- rate limit sur auth et webhook ;
- verification de montant/devise/reference paiement ;
- stockage prive des documents.
