# Audit de couverture fonctionnelle — après Sprint 16

## Conclusion

ProcuFlow couvre désormais le cycle source-to-pay principal et peut servir de version pilote commercialisable. La mise en production chez un client réel reste conditionnée par la configuration de l'infrastructure, les tests Laravel complets et quelques écarts métier identifiés ci-dessous.

## Couverture du cahier des charges

| Domaine | Niveau | Éléments couverts | Écart restant prioritaire |
|---|---|---|---|
| Fournisseurs | Partiel avancé | dossier, statuts, documents, catégories, historique, score sur six critères | inscription autonome et validation distincte Acheteur puis N+1 |
| Demandes d'information | Couvert | création, diffusion, relances, réponses, documents, clôture, archivage | modèles de questionnaires réutilisables |
| Demandes de prix / RFQ | Couvert | sélection, portail, offres versionnées, relances, clôture | modèles multilingues d'e-mails |
| Approvisionnement magasin | Partiel | expression ACDE, contrôle de stock, reliquat à acheter | écran et statut séparés de demande d'approvisionnement magasin |
| Demandes d'achat | Couvert | formulaire, budget, service, projet, priorité, pièces, workflow | délégations temporaires de validation |
| Consultation fournisseurs | Couvert | prix, délais, garanties, conditions, remises, transport, notation | enchères ou tours de négociation formalisés |
| Synthèse des offres | Couvert | comparaison, classement, risques, recommandation, validation, PDF | signature de la note de synthèse |
| Bons de commande | Partiel avancé | génération, circuit multi-niveaux, document, envoi, acceptation | signature électronique qualifiée via prestataire externe |
| Livraisons | Couvert | confirmation, BL, PV, partiel, total, reliquats | gestion détaillée des litiges et retours |
| Facturation | Couvert | dépôt, contrôle, rapprochement BC/BL/facture, échéance, paiement | connecteur bancaire/comptable pour confirmer automatiquement le règlement |
| Automatisations | Couvert | RFI, RFQ, validations, livraisons, factures, documents, contrats | file dédiée, reprise sur erreur et supervision avancée |
| KPI et reporting | Couvert | acheteur, budget, fournisseurs, snapshots et CSV | mesure des heures libérées et objectifs par entreprise |
| Workflow global | Couvert | traçabilité ACDE jusqu'à la facture | gestion complète des avenants de commande |

## Exigences techniques

| Exigence | État | Observation |
|---|---|---|
| SaaS multi-tenant | Couvert | isolation par tenant et tests dédiés |
| Authentification et RBAC | Couvert | Sanctum, rôles et permissions centralisées |
| Workflow configurable | Couvert | seuils et rôles configurables |
| Signature électronique BC | Partiel | hash et traçabilité internes, pas de certificat qualifié |
| E-mail et notifications internes | Couvert | relances dédupliquées et centre de notifications |
| Journal d'audit | Couvert | actions sensibles journalisées |
| Gestion documentaire | Couvert | stockage privé configurable local/S3 |
| KPI temps réel | Couvert | calculés depuis les données opérationnelles |
| Recherche multicritère | Partiel avancé | filtres sur les principaux modules, pas d'index global unifié |
| API REST | Couvert | contrat OpenAPI versionné |
| Responsive web | Couvert | bureau, tablette et mobile |
| Sauvegarde et chiffrement | Infrastructure | stockage privé et secrets prêts ; sauvegarde/chiffrement au repos à configurer chez l'hébergeur |
| RGPD et traçabilité | Partiel avancé | audit et isolation présents ; politique de rétention/export/suppression à formaliser |

## Apports du livrable LEAN Digitalisation

- F1.1 à F1.6 : couverts par la demande d'achat, le workflow, les notifications, l'historique, le suivi et les pièces jointes ;
- F2.1 : relance des factures à l'échéance couverte, le délai exact de cinq jours ouvrés reste à rendre configurable ;
- F2.2 : relance d'accusé de réception commande couverte par le suivi automatisé, le seuil de trois jours doit devenir un réglage dédié ;
- F2.3 : alerte contrat à 90 jours couverte et configurable ;
- F3.1 à F3.3 : reporting achats, dérives budgétaires et fournisseurs sous surveillance couverts ;
- estimation des heures libérées : non encore calculée automatiquement.

## Sprints recommandés après cette livraison

1. **Sprint 17 — Onboarding fournisseur et double validation** : inscription autonome, contrôle Acheteur, décision N+1, demandes de correction et expiration documentaire.
2. **Sprint 18 — Gains LEAN et SLA** : temps passé avant/après, jours ouvrés, objectifs, retards, escalades et bilan de clôture Digitalisation.
3. **Sprint 19 — Intégrations production** : ERP/comptabilité, webhooks signés, file de reprise, journal d'échanges et rapprochement de paiement automatique.
4. **Sprint 20 — Certification de mise en marché** : tests de charge, sécurité, restauration, accessibilité, RGPD localisé et procédure d'exploitation.
