# Sprint 10 - Facturation et rapprochement a trois voies

## Objectif

Recevoir, controler et payer uniquement les factures coherentes avec la commande et la reception.

## Parcours livre

1. Le fournisseur depose sa facture PDF ou image depuis la commande acceptee.
2. ProcuFlow conserve le numero, la devise, les montants, la TVA et l'echeance.
3. La comptabilite lance le rapprochement BC, livraison et facture.
4. Le moteur controle le montant avec une tolerance de 1 %, la devise et la reception complete.
5. Chaque ecart est affiche et conserve dans le journal d'audit.
6. Seule une facture conforme peut etre transmise au paiement.
7. Le role Finance enregistre la reference et la date du reglement.

## Etats

`received`, `controlled`, `compliant`, `in_payment`, `paid`.

## Securite

- facture stockee hors du web public et telechargeable uniquement dans son tenant ;
- numero de facture unique par entreprise ;
- montant et dates valides cote serveur ;
- paiement confirmable uniquement par Owner, Admin ou Finance ;
- depot fournisseur lie au token chiffre de la commande acceptee.

## Suite

Le Sprint 11 couvrira les relances automatiques, les notifications applicatives et e-mail, les echeances et les alertes operationnelles.
