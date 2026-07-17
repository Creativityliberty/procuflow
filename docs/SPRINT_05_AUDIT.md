# Audit cumulatif des phases 00 a 05

## Sources examinees

- cahier des charges fonctionnel et technique fourni ;
- documents ACDE et documents de cadrage joints au projet ;
- manuel DOHONE Web API 1.15.7 ;
- `README.md`, specifications, architecture, modele de donnees et notes des Sprints 00 a 04 ;
- migrations, modeles, controleurs, routes, tests et ecrans du depot Sprint 04.

## Etat apres rattrapage

| Domaine | Etat Sprint 05 | Observation |
| --- | --- | --- |
| Authentification et entreprise | Operationnel | Inscription, connexion, session, entreprise courante et isolation tenant |
| Fournisseurs | Operationnel sur le coeur | Fiche, recherche, documents, cycle de statut, historique et score sur six criteres |
| ACDE | Operationnel | Les quatre familles sont persistees et exigent au moins une ligne chacune |
| Demandes d'achat | Operationnel sur le coeur | Lignes, montants, soumission, approbation, rejet et historique |
| Workflow | Operationnel sur les DA | Etapes configurables par ordre, role et seuil ; boite de validations actionnables |
| Dashboard | Partiel utile | KPI fournisseurs, demandes et validations issus des donnees disponibles |
| Audit | Operationnel sur les actions raccordees | Journal tenantise pour les operations principales |
| DOHONE | Preparation securisee | Payload serveur et verification Hashing ; aucun secret dans le frontend |
| Roles et invitations | Partiel | Roles de workflow presents ; ecran d'invitation et administration fine a terminer |
| Notifications et relances | Planifie | Centre de notifications, e-mails et taches planifiees a implementer |
| RFQ et offres | Planifie Sprint 06 | Selection, portail fournisseur, depot, cloture et comparaison a construire |
| Commandes | Planifie | Generation, validations, PDF, signature et accuse de reception a construire |
| Livraisons et factures | Planifie | Receptions partielles, BL/PV, rapprochement trois voies et paiement a construire |
| Abonnements DOHONE | Planifie | Webhook persistant et idempotent, plans, renouvellements et rapprochement a construire |
| KPI avances | Planifie | Delais, conformite, engagement/reel, performance fournisseur et exports |

## Decisions de conformite

- La methode DOHONE `Hashing` est conservee ; la methode `Verify` obsolete n'est pas utilisee.
- Le code marchand et le code de hachage doivent rester exclusivement dans les variables serveur.
- Les routes non implementees ne figurent pas dans le contrat OpenAPI comme si elles etaient disponibles.
- SQLite reste le choix local gratuit ; PostgreSQL est recommande en production sans imposer un fournisseur payant.
- Le mode decouverte stocke les donnees dans le navigateur pour une demonstration coherente, mais l'API Laravel reste la source de verite en environnement connecte.

## Risques restant a traiter

- ajouter les politiques d'autorisation fines par action et un ecran de gestion des membres ;
- persister et dedoublonner les notifications de paiement avant toute activation commerciale DOHONE ;
- executer la suite PHP dans la CI et ajouter des tests navigateur sur la preproduction ;
- definir retention, sauvegarde, chiffrement et stockage documentaire pour l'environnement de production ;
- completer les mentions legales, la politique de confidentialite et les procedures RGPD locales.
