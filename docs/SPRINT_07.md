# Sprint 07 - Comparaison, synthese et selection fournisseur

## Objectif

Transformer les offres d'une consultation cloturee en decision achat justifiee, validee et exploitable pour le futur bon de commande.

## Parcours livre

1. L'acheteur ouvre une RFQ cloturee et genere le comparatif.
2. ProcuFlow normalise automatiquement le prix et le delai.
3. L'acheteur ajuste les notes qualitatives, le niveau de risque et les ponderations.
4. Le classement est recalcule et versionne a chaque changement.
5. L'acheteur redige la synthese, documente les risques et recommande une offre.
6. Le Responsable Achats approuve ou renvoie la synthese pour reprise.
7. Une approbation marque la demande `supplier_selected` et autorise le futur bon de commande.
8. Le rapport peut etre imprime ou enregistre en PDF depuis le navigateur.

## Regle de notation par defaut

| Critere | Poids |
| --- | ---: |
| Prix | 35 % |
| Delai | 15 % |
| Technique | 15 % |
| Paiement | 10 % |
| Garantie & SAV | 10 % |
| Performance fournisseur | 10 % |
| Proximite | 5 % |

Le prix et le delai sont notes relativement a la meilleure valeur. Les risques faible, moyen et eleve retirent respectivement 0, 4 et 10 points.

## Securite et tracabilite

- isolation de chaque RFQ par `tenant_id` ;
- comparaison verrouillee pendant et apres validation ;
- role de decision limite a owner, admin, direction et responsable achats ;
- audit de la generation, des notes, de la soumission et de la decision ;
- recommandation obligatoirement liee a une offre du comparatif.

## Verification

- test du classement de deux offres ;
- rejet d'une ponderation differente de 100 % ;
- test du cycle synthese, soumission, approbation et statut de la demande ;
- lint et controle TypeScript du frontend.

## Suite fonctionnelle

Le Sprint 08 couvre les bons de commande: generation depuis le fournisseur approuve, circuit Acheteur > N+1 > DAF > Controle de gestion > DG, export PDF, transmission et accuse de reception fournisseur.
