# Sprint 09 - Livraisons et receptions

## Objectif

Suivre une commande acceptee jusqu'a sa reception complete, avec preuves documentaires et reliquats fiables.

## Parcours livre

1. L'acceptation fournisseur cree automatiquement le dossier de livraison.
2. Le fournisseur confirme une date et peut ajouter une precision.
3. Le magasin saisit les quantites recues pour chaque article.
4. Le bon de livraison et le PV de reception sont obligatoires.
5. ProcuFlow calcule les quantites cumulees et les reliquats.
6. Le dossier reste `partial` tant qu'un reliquat existe et devient `complete` lorsque tout est recu.
7. Chaque reception conserve sa reference, sa date, son responsable et ses documents.

## Securite

- fichiers PDF/JPG/PNG limites a 10 Mo et stockes hors du web public ;
- telechargement autorise uniquement dans le tenant proprietaire ;
- transaction et verrouillage des lignes pendant le calcul des reliquats ;
- impossibilite de recevoir plus que la quantite commandee ;
- audit des confirmations et receptions.

## Suite

Le Sprint 10 couvrira les factures, le controle TVA, le rapprochement a trois voies BC/BL/facture et la transmission au paiement.
