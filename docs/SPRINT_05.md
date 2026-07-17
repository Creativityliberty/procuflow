# Sprint 05 - Donnees metier et validations configurables

## Objectif

Transformer les principaux parcours du prototype en parcours persistants, coherents entre le frontend, l'API et la base de donnees, puis rattraper les ecarts les plus importants du cahier des charges fournisseur et ACDE.

## Livre

- besoins ACDE persistants avec Attentes, Contraintes, Donnees et Exigences obligatoires ;
- liste, fiche detaillee, modification, suppression de brouillon et transformation vers une demande d'achat ;
- fournisseurs enrichis avec donnees bancaires et commerciales ;
- soumission, validation, suspension, reactivation et historique fournisseur ;
- evaluation fournisseur sur les six criteres du cahier des charges ;
- circuit des demandes d'achat configurable par seuil, role et ordre ;
- centre de validations qui respecte l'ordre des etapes ;
- tableaux de bord, listes et fiches branches sur l'API ou le magasin local persistant ;
- contrat OpenAPI aligne sur les routes effectivement disponibles ;
- tests Laravel ajoutes pour ACDE, fournisseur et configuration des validations.

## Verification effectuee

- installation des dependances avec le verrou pnpm ;
- ESLint sans erreur ni avertissement ;
- compilation Next.js de production reussie avec 21 routes ;
- controle du contrat OpenAPI et du diff Git ;
- absence de secret DOHONE dans les sources versionnees.

Les tests PHP sont fournis mais n'ont pas pu etre executes dans l'environnement de construction, qui ne contient pas PHP.

## Suite

Le Sprint 06 doit traiter le portail RFQ et les offres fournisseurs. Les commandes, livraisons, rapprochements, abonnements DOHONE et KPI avances restent ensuite ordonnes dans la feuille de route.
