# Sprint 03 - Experience produit vendable

## Objectif

Permettre a un utilisateur non forme de creer son compte, configurer son entreprise et executer les premieres actions d'achat sans vocabulaire technique visible.

## Realise

- refonte visuelle compacte sans transparence ni grands titres ;
- menu retractable 240 px / 72 px avec icones Lucide et infobulles ;
- tiroir de navigation mobile ;
- suppression des mentions Sprint, demo, tenant et architecture dans le produit ;
- parcours connexion et inscription en deux etapes ;
- configuration guidee de l'entreprise en trois etapes ;
- tableau de bord avec demarrage rapide et actions courantes ;
- formulaire fournisseur et dossier documentaire ;
- assistant d'expression du besoin en langage simple ;
- formulaire de demande d'achat avec lignes dynamiques ;
- formulaire de consultation fournisseurs ;
- etats vides metier pour commandes, livraisons et factures ;
- regles de validation lisibles et configurables ;
- previsualisation HTML harmonisee.

## Principes UX retenus

- taille de base 14 px ;
- titres de pages 24 px maximum ;
- rayon standard 8 px ;
- fond gris neutre et surfaces blanches opaques ;
- violet reserve a l'action principale, a la selection et aux liens ;
- une action principale visible par ecran ;
- libelles metier comprehensibles sans formation.

## Limites de validation locale

Les formulaires frontend simulent leur confirmation en local jusqu'au branchement complet de l'API et de l'authentification. Les services Laravel restent le socle cible pour la persistance et l'isolation des entreprises.
