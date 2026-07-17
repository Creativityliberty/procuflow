# Sprint 15 — Durcissement production, DOHONE et cahier des charges ACDE

## Objectif

Fermer les écarts révélés par l'audit des sources métier et rendre les parcours paiement et spécification exploitables sans ressaisie ni ambiguïté.

## Livré

### DOHONE

- pages frontend de succès et d'annulation ;
- contrôle au démarrage du paiement des URL, du marchand et du code de hachage ;
- obligation HTTPS et URL publiques en production ;
- notification publique dédiée aux abonnements ;
- validation de `idReqDoh`, `rI`, `rMt`, `rDvs`, `rH`, `mode` et du hash ;
- contrôle de la référence, du montant, de la devise et de l'identifiant DOHONE ;
- idempotence stricte : une référence payée ne peut pas être rejouée avec une autre transaction ;
- journal séparé des notifications acceptées, répétées ou rejetées, sans stockage du hash reçu ;
- anciens endpoints de paiement neutralisés avec une réponse HTTP 410.

### Cahier des charges ACDE

- plusieurs éléments dans chacune des quatre rubriques : Attentes, Contraintes, Données, Exigences ;
- niveau par élément : obligatoire, souhaité ou de confort ;
- champs SMART : critère, cible, unité, tolérance et méthode de vérification ;
- budget, devise, lieu de livraison et date souhaitée ;
- pièces jointes privées, téléchargeables et supprimables uniquement en brouillon ;
- rapport imprimable ou enregistrable en PDF ;
- transformation vers une demande d'achat avec reprise du budget, du lieu et des exigences ;
- lien bidirectionnel entre le besoin ACDE et la demande d'achat ;
- gel du cahier des charges dès sa transformation en brouillon de demande d'achat.

### Demandes d'achat

- pièces justificatives privées ajoutées avant soumission ;
- consultation et téléchargement depuis le dossier ;
- affichage du cahier des charges source et du lieu de livraison ;
- transmission au workflow après téléversement pour garantir un dossier complet.

## Données et API

La migration `2026_07_17_000022_harden_payments_and_acde.php` ajoute les journaux de notification, les champs ACDE structurés, les liens de traçabilité et les tables documentaires. La migration suivante fournit les tables de cache, sessions et queues nécessaires au profil de production. Les routes sont décrites dans `backend/contracts/openapi.yaml`.

## Validation

- build et lint Next.js ;
- tests PHP ajoutés pour la matrice ACDE, ses champs SMART, les pièces jointes et les callbacks DOHONE acceptés, répétés ou rejetés ;
- exécution de `php artisan test` requise dans un environnement PHP 8.2+.
