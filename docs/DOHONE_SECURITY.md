# Integration DOHONE - notes de securite

## Usage Sprint 15

DOHONE est utilise pour le paiement de l'abonnement SaaS. Le navigateur ne choisit jamais le montant : le serveur le calcule depuis le forfait et la periodicite.

## Variables d'environnement

```txt
DOHONE_MERCHANT_CODE=
DOHONE_HASH_CODE=
DOHONE_PAYMENT_URL=https://www.my-dohone.com/dohone/pay
DOHONE_NOTIFY_URL=https://api.example.com/api/v1/subscriptions/dohone/notify
DOHONE_SUCCESS_URL=https://app.example.com/billing/success
DOHONE_CANCEL_URL=https://app.example.com/billing/cancel
```

## Regles

- ne jamais exposer `DOHONE_HASH_CODE` dans le frontend ;
- ne jamais commiter le code marchand ;
- ne jamais commiter le code de hashage ;
- verifier le hash recu ;
- verifier le montant ;
- verifier la devise ;
- verifier la reference interne ;
- verifier que le paiement n'est pas deja traite ;
- journaliser chaque notification acceptée, répétée ou rejetée sans conserver le hash reçu.

## Notification

Le manuel DOHONE indique que `notifyPage` est appelee par le serveur DOHONE, pas par le navigateur client. Elle ne doit donc pas dependre d'une session utilisateur.

## Verification du hash

Formule indiquee dans le manuel :

```txt
MD5(idReqDoh + rI + rMt + DOHONE_HASH_CODE)
```

Le endpoint d'abonnement `/subscriptions/dohone/notify` compare le hash recu avec le hash recalcule cote backend, puis verifie aussi `rH`, `rI`, `rMt`, `rDvs` et `idReqDoh`. La methode historique `Verify` n'est pas utilisee.

## Statuts paiement

```txt
pending
paid
failed
cancelled
fraud_suspected
```

## Idempotence

Une notification DOHONE peut etre repetee. Le backend accepte sans retraitement le même couple référence/`idReqDoh`, mais refuse qu'une référence déjà payée soit présentée avec une autre transaction.
