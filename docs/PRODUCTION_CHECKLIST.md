# Checklist de mise en production

## Architecture minimale

Le frontend Next.js peut être déployé sur Vercel. L'API Laravel doit être hébergée séparément sur un environnement PHP 8.2+ persistant, avec PostgreSQL, un worker de queue, le scheduler Laravel et un stockage privé compatible S3. Aucun service propriétaire payant n'est imposé par le code.

## Avant déploiement

1. Copier `apps/api/.env.production.example` et `apps/web/.env.production.example` dans les variables secrètes des plateformes.
2. Générer `APP_KEY` avec `php artisan key:generate --show` et ne jamais la commiter.
3. Définir `APP_URL` sur l'URL HTTPS publique de l'API et `FRONTEND_URL` sur l'URL HTTPS du frontend.
4. Configurer PostgreSQL avec TLS, le stockage objet privé et le SMTP transactionnel.
5. Définir `NEXT_PUBLIC_DEMO_MODE=false` : une valeur `true` affiche uniquement les données locales de démonstration.
6. Autoriser exactement le domaine frontend dans CORS et Sanctum.
7. Exécuter `php artisan migrate --force`, puis créer le premier administrateur par une procédure contrôlée.
8. Lancer en continu `php artisan queue:work --tries=3 --timeout=120`.
9. Déclencher `php artisan schedule:run` chaque minute sur le serveur.
10. Configurer sauvegardes chiffrées, rétention, restauration testée, logs et alertes d'erreur.

## DOHONE

- renseigner le code marchand et le code de hachage uniquement côté API ;
- utiliser `https://api.votre-domaine.com/api/v1/subscriptions/dohone/notify` comme `notifyPage` ;
- utiliser les pages `/billing/success` et `/billing/cancel` du frontend ;
- vérifier que les trois URL sont publiques en HTTPS avant d'ouvrir les paiements ;
- effectuer un paiement réel de faible montant, puis vérifier `subscription_payments`, `payment_notification_logs` et l'activation du forfait ;
- ne jamais utiliser l'ancien endpoint `/payments/dohone/notify`, désormais neutralisé.

## Commandes de contrôle

```bash
pnpm install --frozen-lockfile
pnpm lint:web
pnpm build:web

cd apps/api
composer install --no-dev --prefer-dist --optimize-autoloader
php artisan test
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Test de réception

- inscription, connexion, invitation et récupération de mot de passe ;
- création ACDE avec un critère obligatoire, pièce jointe et export PDF ;
- transformation en demande d'achat, validation multi-niveaux et traçabilité ;
- RFQ, offre fournisseur, comparaison, commande, livraison et facture ;
- RFI avec pièce jointe, e-mail d'invitation, réponse fournisseur et clôture ;
- matrice RFQ complète et blocage d'une offre non conforme à une exigence obligatoire ;
- relances planifiées, reporting mensuel et export ;
- paiement d'abonnement, callback DOHONE répété et notification invalide ;
- vérification qu'un utilisateur d'un tenant ne peut lire aucun dossier d'un autre tenant.
