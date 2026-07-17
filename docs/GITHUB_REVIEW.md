# Revue du repo GitHub fourni

Repo inspecte :

```txt
hexclave/multi-tenant-starter-template
```

## Ce qui peut aider

- structure Next.js App Router ;
- TypeScript ;
- Tailwind + shadcn/ui ;
- logique multi-tenant par teams/orgs ;
- dashboard ;
- switcher d'organisation ;
- settings utilisateur ;
- dark mode.

## Ce qu'on ne reprend pas tel quel

- dependance directe a Stack Auth pour le coeur metier ;
- logique backend absente ;
- modele achat absent ;
- gestion documents absente ;
- paiement DOHONE absent ;
- workflows achat absents.

## Decision

Le repo sert d'inspiration pour l'experience frontend et la logique multi-tenant. Pour ProcuFlow Africa, le backend Laravel reste source de verite pour :

- tenants ;
- roles ;
- permissions ;
- workflows ;
- documents ;
- paiements ;
- audit logs.

