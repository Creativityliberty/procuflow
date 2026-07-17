# Sprint 16 — RFI fournisseurs et conformité du cahier des charges

## Objectif

Fermer deux écarts importants du cahier des charges initial : la gestion des demandes d'information avant consultation et la vérification explicite de chaque exigence ACDE dans les offres fournisseurs.

## Livré

### Demandes d'information fournisseurs

- liste filtrable des RFI avec nombre d'invités et de réponses ;
- formulaire guidé avec objet, description, famille achats, date limite et documents ;
- sélection de fournisseurs actifs disposant d'une adresse e-mail ;
- brouillon, publication, clôture et archivage ;
- e-mail d'invitation envoyé à la publication ;
- token public aléatoire par fournisseur, recherche par hash et copie chiffrée pour les relances ;
- régénération individuelle d'un lien compromis ou perdu ;
- portail fournisseur responsive sans création de compte ;
- téléchargement des documents de référence et dépôt d'une réponse avec pièce jointe ;
- suivi des consultations, horodatage et archivage des réponses ;
- relances automatiques des fournisseurs n'ayant pas encore répondu.

### Matrice de conformité RFQ

- instantané des éléments ACDE au moment de créer la RFQ ;
- réponse du fournisseur à chaque attente, contrainte, donnée et exigence ;
- statuts conforme, partiel, non conforme et non applicable ;
- justification et référence de preuve par ligne ;
- score pondéré selon les niveaux obligatoire, souhaité et confort ;
- indicateur distinct de conformité aux exigences obligatoires ;
- reprise du score dans le comparatif multicritère ;
- risque élevé automatique en cas de non-conformité obligatoire ;
- impossibilité de recommander ou soumettre une offre non conforme.

## Back, front et API

Deux migrations ajoutent les exigences RFQ, leurs réponses, les RFI, les destinataires et les documents. Les modèles, contrôleurs, routes REST, données de démonstration, écrans acheteur, écrans fournisseur et automatisations sont livrés ensemble. Le contrat est documenté dans `backend/contracts/openapi.yaml`.

## Sécurité et traçabilité

- isolation stricte par `tenant_id` sur les routes internes ;
- contrôle d'appartenance des documents et réponses avant téléchargement ;
- aucune URL publique persistée en clair ;
- audit des créations, publications, régénérations, clôtures et réponses ;
- limitation de débit sur tout le portail public ;
- pièces jointes limitées à 20 Mo et à une liste de formats autorisés.

## Validation

- lint et build Next.js de production ;
- test d'intégration du cycle RFI complet ;
- test de propagation ACDE vers RFQ et calcul de conformité ;
- exécution de la suite Laravel requise dans un environnement PHP 8.2+.

## Suite recommandée

1. validation fournisseur à deux niveaux Acheteur puis Responsable Achats ;
2. mesure automatique des heures libérées par workflow, relances et reporting ;
3. connecteurs ERP/comptabilité avec webhooks signés et reprise sur erreur ;
4. modèles d'e-mails multilingues et file de messages dédiée ;
5. campagne de tests de charge, restauration et sécurité avant commercialisation.
