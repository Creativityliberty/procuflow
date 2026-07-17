# Sprint 13 - Reporting LEAN et pilotage achats

## Objectif

Automatiser la production des indicateurs demandes dans le livrable de cloture du Pilier Digitalisation, sans extraction ni ressaisie manuelle.

## Rapports livres

### Tableau de bord Achats

- nombre et volume des commandes ;
- montants engages et realises ;
- economies mesurees entre budget DA et commande ;
- temps moyen de traitement des DA et BC ;
- taux de validation ;
- respect des delais de livraison ;
- commandes non recues et annulees ;
- tendance mensuelle du volume achats.

### Derives budgetaires

- budget estime, montant commande et ecart par dossier ;
- pourcentage d'ecart ;
- classement `sous budget`, `a surveiller` ou `a traiter` ;
- service, centre de cout et fournisseur concernes.

### Performance fournisseurs

- chiffre d'affaires realise et nombre de commandes ;
- retards, annulations et litiges ;
- delai moyen, respect des delais et conformite des factures ;
- score fournisseur et niveau de risque ;
- synthese des fournisseurs sous surveillance.

## Automatisation

- rapports Achats et Budget generes le premier jour de chaque mois a 06:00 ;
- rapport Fournisseurs genere le premier jour de chaque trimestre a 06:15 ;
- snapshots idempotents par entreprise, type et periode ;
- notifications applicatives et e-mails aux roles Direction, Achats et Controle de gestion concernes ;
- generation manuelle autorisee aux roles de pilotage ;
- export CSV UTF-8 compatible Excel, avec protection contre l'injection de formule.

Commandes d'exploitation :

```bash
php artisan procuflow:reports monthly
php artisan procuflow:reports quarterly
php artisan procuflow:reports all
```

## Principes de calcul

Les KPI sont calcules directement depuis les demandes, commandes, receptions, factures et evaluations fournisseurs. Seuls les rapports periodiques finalises sont archives. Les filtres sont limites a deux ans afin de proteger les performances.

## Suite recommandee

Le Sprint 14 ajoutera la base contrats, les responsables contractuels, les echeances et alertes a 90 jours, ainsi que le pilotage des abonnements et forfaits SaaS.
