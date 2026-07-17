# Sprint 11 - Relances, notifications et alertes

## Objectif

Eviter les retards silencieux et rendre chaque echeance visible sans suivi manuel permanent.

## Alertes livrees

- RFQ proche de la date limite de reponse ;
- bon de commande bloque dans une validation ;
- livraison attendue, partielle ou en retard ;
- facture proche de l'echeance ou non payee ;
- document fournisseur proche de l'expiration.

## Canaux et regles

- notification dans l'application ;
- e-mail via le mailer Laravel configure ;
- activation independante de chaque canal ;
- delais configurables par entreprise ;
- destinataires choisis selon leur role ;
- une alerte maximum par objet et par jour.

## Exploitation

Le scheduler Laravel execute le moteur chaque jour a 07:00. Sur un serveur classique :

```bash
* * * * * cd /chemin/procuflow/apps/api && php artisan schedule:run
```

L'administrateur peut aussi cliquer sur `Executer maintenant` ou appeler `POST /automations/run`.

## Suite

Le Sprint 12 couvrira les KPI avances acheteur et fournisseur, tendances, filtres temporels et exports de pilotage.
