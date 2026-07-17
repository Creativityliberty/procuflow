# Sprint 08 - Bons de commande

## Objectif

Transformer une selection fournisseur approuvee en engagement contractuel trace, valide et accepte par le fournisseur.

## Parcours livre

1. L'acheteur genere le BC depuis la comparaison approuvee.
2. Les articles, prix, taxes, remises et frais de l'offre sont figes dans le BC.
3. L'acheteur renseigne le lieu, la date, le paiement, l'Incoterm et les notes.
4. Le BC suit Acheteur > N+1 > DAF > Controle de gestion > Direction generale.
5. Un rejet renvoie le BC en brouillon et rejoue le niveau concerne apres resoumission.
6. La validation finale appose un sceau d'integrite HMAC horodate sur le contenu du BC.
7. Le BC valide peut etre imprime en PDF et envoye par e-mail via un lien fournisseur securise.
8. Le fournisseur accepte ou refuse et peut joindre un commentaire.
9. A l'envoi, la demande d'achat passe au statut `ordered`.

## Etats

`created`, `in_validation`, `validated`, `sent`, `accepted`, `refused`, `cancelled`.

## Securite

- isolation par entreprise sur toutes les routes acheteur ;
- validation de role a chaque niveau ;
- une seule commande par comparaison approuvee ;
- token fournisseur de 64 caracteres stocke sous forme SHA-256 ;
- journal d'audit pour creation, modification, decisions, envoi et reponse ;
- aucune information bancaire ou secret de paiement expose au portail.

## Suite

Le Sprint 09 couvrira les livraisons: confirmation, BL, PV de reception, reception partielle ou totale et reliquat commande.
