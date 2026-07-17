# API V1

Base URL : `/api/v1`

Toutes les routes metier exigent un jeton Sanctum. Les routes d'une entreprise exigent aussi l'en-tete `X-Tenant-ID` ou utilisent l'entreprise courante du compte.

## Authentification

```txt
POST /auth/register
POST /auth/login
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me
POST /auth/logout
```

## Entreprises

```txt
GET  /tenants
POST /tenants/{tenant}/switch
GET  /tenant
PUT  /tenant
```

## Equipe et acces

```txt
GET    /team
POST   /team/invitations
DELETE /team/invitations/{invitation}
PUT    /team/members/{user}
DELETE /team/members/{user}
GET    /invitations/{token}
POST   /invitations/{token}/accept
```

## Fournisseurs

```txt
GET    /suppliers
POST   /suppliers
GET    /suppliers/{supplier}
PUT    /suppliers/{supplier}
PATCH  /suppliers/{supplier}
DELETE /suppliers/{supplier}
POST   /suppliers/{supplier}/submit
POST   /suppliers/{supplier}/approve
POST   /suppliers/{supplier}/suspend
POST   /suppliers/{supplier}/reactivate
GET    /suppliers/{supplier}/documents
POST   /suppliers/{supplier}/documents
GET    /suppliers/{supplier}/documents/{document}/download
DELETE /suppliers/{supplier}/documents/{document}
GET    /suppliers/{supplier}/evaluations
POST   /suppliers/{supplier}/evaluations
```

## Besoins ACDE

```txt
GET    /acde-needs
POST   /acde-needs
GET    /acde-needs/{acdeNeed}
PUT    /acde-needs/{acdeNeed}
PATCH  /acde-needs/{acdeNeed}
DELETE /acde-needs/{acdeNeed}
```

## Demandes d'achat

```txt
GET    /purchase-requests
POST   /purchase-requests
GET    /purchase-requests/{purchaseRequest}
PUT    /purchase-requests/{purchaseRequest}
PATCH  /purchase-requests/{purchaseRequest}
DELETE /purchase-requests/{purchaseRequest}
POST   /purchase-requests/{purchaseRequest}/submit
POST   /purchase-requests/{purchaseRequest}/approve
POST   /purchase-requests/{purchaseRequest}/reject
```

## Pilotage et paiements

```txt
GET  /dashboard
GET  /audit-logs
GET  /approval-workflow
PUT  /approval-workflow
GET  /approvals/inbox
POST /payments/dohone/start
GET  /payments/dohone/notify
```

`GET /approvals/inbox` ne retourne que les etapes en attente devenues actionnables. Une etape suivante reste masquee tant que l'etape precedente n'est pas approuvee.

Les routes RFQ, commandes, livraisons et factures sont detaillees ci-dessous. Les abonnements restent dans la feuille de route.
# Sprint 06 - Stock et consultations

Les routes suivantes sont disponibles sous `/api/v1`.

## Politique achats

- `GET /procurement-policy`
- `PUT /procurement-policy`

## Controle de stock

- `GET /purchase-requests/{id}/stock-check`
- `PUT /purchase-requests/{id}/stock-check`

## Consultations acheteur

- `GET /rfqs`
- `POST /rfqs`
- `GET /rfqs/{id}`
- `POST /rfqs/{id}/publish`
- `POST /rfqs/{id}/close`
- `POST /rfqs/{id}/suppliers/{invitation}/regenerate-link`
- `POST /rfqs/{id}/suppliers/{invitation}/revoke-link`
- `POST /rfqs/{id}/exception`
- `POST /rfqs/{id}/exception/decision`
- `POST /rfqs/{id}/messages`

## Portail fournisseur public securise

- `GET /supplier-portal/rfqs/{token}`
- `PUT /supplier-portal/rfqs/{token}/offer`
- `POST /supplier-portal/rfqs/{token}/offer/submit`
- `POST /supplier-portal/rfqs/{token}/decline`
- `POST /supplier-portal/rfqs/{token}/messages`

Le token public est aleatoire, non devinable et conserve uniquement sous forme de hash cote serveur.

# Sprint 07 - Comparaison et choix fournisseur

- `GET /rfqs/{id}/comparison`
- `POST /rfqs/{id}/comparison/generate`
- `PUT /rfqs/{id}/comparison/weights`
- `PUT /rfqs/{id}/comparison/assessments/{assessment}`
- `PUT /rfqs/{id}/comparison/synthesis`
- `POST /rfqs/{id}/comparison/submit`
- `POST /rfqs/{id}/comparison/decision`

La somme des ponderations doit etre exactement egale a 100. Les notes de prix et de delai sont normalisees par rapport a la meilleure offre. Le risque applique une penalite explicite. La decision est reservee aux roles habilites et passe la demande au statut `supplier_selected` apres approbation.

# Sprint 08 - Bons de commande

- `GET /purchase-orders`
- `POST /purchase-orders`
- `GET /purchase-orders/{id}`
- `PUT /purchase-orders/{id}`
- `POST /purchase-orders/{id}/submit`
- `POST /purchase-orders/{id}/decision`
- `POST /purchase-orders/{id}/send`
- `POST /purchase-orders/{id}/revoke-link`
- `GET /supplier-portal/purchase-orders/{token}`
- `POST /supplier-portal/purchase-orders/{token}/respond`

Le BC copie les lignes et montants de l'offre recommandee approuvee. Les validations sont strictement sequentielles. Le lien fournisseur est aleatoire, limite en debit et conserve uniquement sous forme de hash cote serveur.

# Sprint 09 - Livraisons

- `POST /supplier-portal/purchase-orders/{token}/confirm-delivery`
- `GET /deliveries`
- `GET /deliveries/{id}`
- `POST /deliveries/{id}/receipts`
- `GET /deliveries/{id}/receipts/{receipt}/{bl|pv}`

Une commande acceptee cree automatiquement son dossier de livraison. Chaque reception met a jour les quantites recues et restantes dans une transaction. Une quantite superieure au reliquat est refusee.

# Sprint 10 - Factures et rapprochement

- `POST /supplier-portal/purchase-orders/{token}/invoices`
- `GET /invoices`
- `GET /invoices/{id}`
- `POST /invoices/{id}/control`
- `POST /invoices/{id}/transmit`
- `POST /invoices/{id}/paid`
- `GET /invoices/{id}/download`

Le controle rapproche le total et la devise du BC, la reception complete et la facture. La tolerance montant par defaut est de 1 %. Une anomalie bloque la transmission au paiement.

# Sprint 11 - Automatisations

- `GET /notifications`
- `POST /notifications/{id}/read`
- `POST /notifications/read-all`
- `GET /automation-settings`
- `PUT /automation-settings`
- `POST /automations/run`

La commande `php artisan procuflow:automations` est planifiee tous les jours a 07:00. Les evenements sont dedupliques par entreprise, type, objet et date.

# Sprint 12 - Securite et administration

Les actions sensibles utilisent une matrice RBAC centralisee. Les invitations d'equipe expirent apres sept jours, ne fonctionnent qu'une fois et peuvent etre revoquees. Les liens fournisseur RFQ expirent a l'echeance de la consultation ; les liens BC expirent apres 90 jours. Une reinitialisation de mot de passe revoque toutes les sessions API existantes.

# Sprint 13 - Reporting LEAN

- `GET /reports/overview`
- `GET /reports/budget-variances`
- `GET /reports/supplier-performance`
- `GET /reports/snapshots`
- `GET /reports/export?type={overview|budget|suppliers}`
- `POST /reports/generate`

Les routes de lecture acceptent `from` et `to` au format ISO. La periode maximale est de deux ans. Les snapshots mensuels et trimestriels sont generes par le scheduler Laravel et peuvent aussi etre archives manuellement par les roles habilites.

# Sprint 14 - Contrats et abonnements SaaS

## Contrats fournisseurs

- `GET /contracts/summary`
- `GET /contracts/options`
- `GET /contracts`
- `POST /contracts`
- `GET /contracts/{id}`
- `PUT /contracts/{id}`
- `DELETE /contracts/{id}`
- `POST /contracts/{id}/activate`
- `POST /contracts/{id}/renew`
- `POST /contracts/{id}/terminate`
- `POST /contracts/{id}/documents`
- `GET /contracts/{id}/documents/{document}/download`
- `DELETE /contracts/{id}/documents/{document}`

L'activation exige au moins un document contractuel. Les statuts `active`, `expiring` et `expired` sont recalcules automatiquement selon l'echeance et le preavis du contrat.

## Abonnement et paiement

- `GET /subscription`
- `GET /subscription/payments`
- `POST /subscription/checkout`
- `POST /subscription/cancel`
- `POST /subscription/resume`
- `GET /subscriptions/dohone/notify` (public, limite en debit)

Le montant et la devise sont derives du catalogue serveur. La notification DOHONE valide le hash, le code marchand, la reference, le montant, la devise et l'identifiant de transaction avant d'activer le forfait dans une transaction idempotente.

# Sprint 15 - ACDE structure et durcissement paiement

- `POST /acde-needs/{id}/documents`
- `GET /acde-needs/{id}/documents/{document}/download`
- `DELETE /acde-needs/{id}/documents/{document}`
- `POST /purchase-requests/{id}/documents`
- `GET /purchase-requests/{id}/documents/{document}/download`
- `DELETE /purchase-requests/{id}/documents/{document}`

Chaque élément ACDE porte un niveau (`mandatory`, `desired`, `comfort`) et peut définir un critère, une cible, une unité, une tolérance et une méthode de vérification. La demande d'achat conserve `acde_need_id` et le lieu de livraison. Les documents restent privés et isolés par tenant.

Les endpoints historiques `/payments/dohone/start` et `/payments/dohone/notify` répondent désormais `410 Gone`. Le paiement d'abonnement passe uniquement par `/subscription/checkout` et `/subscriptions/dohone/notify`.

# Sprint 16 - Demandes d'information et conformité RFQ

## Demandes d'information internes

- `GET /information-requests`
- `POST /information-requests`
- `GET /information-requests/{id}`
- `POST /information-requests/{id}/publish`
- `POST /information-requests/{id}/close`
- `POST /information-requests/{id}/archive`
- `POST /information-requests/{id}/documents`
- `GET /information-requests/{id}/documents/{document}/download`
- `POST /information-requests/{id}/suppliers/{invitation}/regenerate-link`
- `GET /information-requests/{id}/suppliers/{invitation}/response/download`

## Portail RFI public sécurisé

- `GET /supplier-portal/information-requests/{token}`
- `POST /supplier-portal/information-requests/{token}/response`
- `GET /supplier-portal/information-requests/{token}/documents/{document}/download`

La publication régénère un token aléatoire de 64 caractères par fournisseur, en conserve uniquement le hash pour la recherche et une copie chiffrée pour les relances. Les documents restent privés et chaque téléchargement vérifie son rattachement à la demande.

## Conformité RFQ

Chaque RFQ issue d'une demande d'achat liée à un besoin ACDE reçoit un instantané de toutes les attentes, contraintes, données et exigences. L'offre fournisseur doit répondre à chaque ligne avec `compliant`, `partial`, `non_compliant` ou `not_applicable`. Le score pondère les niveaux obligatoire, souhaité et confort avec les poids 3, 2 et 1. Une non-conformité obligatoire bloque la recommandation finale.
