# Modèle de données — Sprint 16

## Tables coeur

```txt
tenants
users
roles
permissions
tenant_users
tenant_settings
```

## Fournisseurs

```txt
suppliers
supplier_categories
supplier_category_supplier
supplier_documents
supplier_evaluations
supplier_status_histories
```

Champs fournisseurs :

- `tenant_id`
- `legal_name`
- `rccm`
- `niu`
- `address`
- `city`
- `country`
- `phone`
- `email`
- `commercial_contact_name`
- `bank_name`
- `iban`
- `swift`
- `payment_terms`
- `status`

Evaluation :

- credit fournisseur ;
- delai de paiement ;
- proximite geographique ;
- assistance ;
- garantie et SAV ;
- rapport qualite/prix.

Score global :

```txt
score = moyenne des 6 criteres
```

## ACDE

```txt
acde_needs
acde_items
```

`acde_items.kind` :

- `expectation`
- `constraint`
- `data`
- `requirement`

## Achat

```txt
purchase_requests
purchase_request_items
approval_workflows
approval_workflow_steps
approvals
```

Statuts :

- draft ;
- pending ;
- approved ;
- rejected ;
- in_consultation ;
- ordered.

## RFI et sourcing amont

```txt
information_requests
information_request_suppliers
information_request_documents
```

Les destinataires conservent le hash du token public, une copie chiffrée pour les relances, les horodatages de consultation et de réponse ainsi que l'éventuelle pièce jointe fournisseur.

## RFQ, offres et conformité

```txt
rfqs
rfq_items
rfq_suppliers
rfq_requirements
supplier_offers
supplier_offer_items
supplier_offer_requirement_responses
supplier_offer_versions
rfq_comparisons
offer_assessments
```

## Commandes

```txt
purchase_orders
purchase_order_items
purchase_order_approvals
deliveries
delivery_items
delivery_receipts
delivery_receipt_items
```

## Facturation, contrats et abonnement

```txt
invoices
contracts
contract_documents
contract_events
tenant_subscriptions
subscription_payments
payment_notification_logs
```

## Audit et documents

```txt
app_notifications
automation_settings
automation_events
audit_logs
```

Les documents sont stockés dans des tables spécialisées par dossier métier afin d'appliquer les règles de cycle de vie et les contrôles d'appartenance sans ambiguïté.
