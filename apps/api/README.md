# API ProcuFlow

API Laravel 11 executable, protegee par Sanctum et isolee par entreprise.

## Couverture Sprint 05

- creation de compte, connexion, session par jeton et deconnexion ;
- creation automatique de l'entreprise et du circuit de validation initial ;
- selection d'entreprise controlee par appartenance ;
- fournisseurs, recherche, filtres, documents prives, statuts et evaluations ;
- besoins ACDE complets avec leurs quatre familles et leurs lignes ;
- demandes d'achat, articles, montants et validations multi-niveaux configurables ;
- centre de validations actionnables et KPI calcules depuis la base ;
- journal d'audit ;
- integration serveur DOHONE par Hashing.

## Installation locale gratuite

```bash
composer install
cp .env.example .env
touch database/database.sqlite
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

L'API repond sur `http://localhost:8000/api/v1`. Le compte local est documente dans le README racine.

## Tests

```bash
php artisan test
```

Les tests couvrent l'inscription, l'isolation inter-entreprises, les besoins ACDE, le cycle fournisseur, la configuration du workflow, le traitement des demandes et le rejet d'un hash DOHONE invalide.

Le webhook DOHONE verifie actuellement l'integrite Hashing. La persistance idempotente des evenements et la gestion d'abonnement seront livrees avec le module de paiement ; elles ne doivent pas etre considerees comme terminees dans ce sprint.

Pour la production, utiliser PostgreSQL et un stockage objet prive chiffre ou un volume prive sauvegarde. Ces options restent interchangeables et ne rendent aucun fournisseur cloud obligatoire.
