# Sprint 12 - Securite, roles et administration

## Objectif

Transformer le socle multi-tenant en produit administrable avant un pilote client, sans imposer de service payant.

## Livrables

- matrice RBAC centralisee dans `TenantPermissions` ;
- middleware unique applique aux ecritures sensibles ;
- ecran `Equipe et acces` pour inviter, modifier ou retirer un membre ;
- invitations valables sept jours, a usage unique et revocables ;
- rattachement securise d'un nouveau compte ou d'un compte existant ;
- parcours complet `mot de passe oublie` et `nouveau mot de passe` ;
- revocation automatique de tous les jetons Sanctum apres reinitialisation ;
- liens fournisseurs stockes sous forme de hash, limites dans le temps et revocables ;
- journalisation des operations d'administration et de revocation ;
- tests de permission, invitation, expiration et reinitialisation.

## Roles couverts

`owner`, `admin`, `requester`, `buyer`, `procurement_manager`, `manager`, `storekeeper`, `accounting`, `finance`, `controller` et `director`.

Les droits portent sur des capacites metier, pas sur des ecrans : entreprise, equipe, workflows, automatisations, fournisseurs, demandes, stock, consultations, commandes, receptions, controles facture et paiements.

## Exploitation sans abonnement obligatoire

- Laravel Password Broker utilise la base existante ;
- e-mails dans les logs en local, SMTP standard en production ;
- Sanctum gere les sessions API ;
- aucune dependance SaaS payante n'est necessaire.

## Suite recommandee

Le Sprint 13 portera le reporting LEAN auto-genere : economies, delais, ecarts, derives budgetaires, fournisseurs sous surveillance, filtres temporels et exports. Le Sprint 14 ajoutera les contrats, alertes a 90 jours et le pilotage des abonnements.
