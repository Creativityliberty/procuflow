# Sprint 06 - Controle de stock, RFQ et portail fournisseur

## Objectif

Transformer la consultation fournisseur, auparavant illustrative, en un parcours exploitable de bout en bout avec persistance Laravel, API REST et mode local Next.js.

## Parcours livre

1. Une demande d'achat est approuvee.
2. Le magasin controle chaque ligne : disponible, partiellement disponible, indisponible ou hors stock.
3. Seule la quantite restante est transferee vers la consultation.
4. La regle de mise en concurrence est choisie automatiquement selon le montant.
5. L'acheteur invite des fournisseurs actifs.
6. Chaque fournisseur recoit un lien prive, consulte le dossier et enregistre une offre.
7. Chaque sauvegarde et chaque soumission creent une version horodatee.
8. La cloture verifie le nombre minimum d'offres, sauf derogation approuvee.
9. Les offres cloturees sont pretes pour le comparatif du sprint suivant.

## Regles par defaut

| Montant XAF | Offres | Methode |
| --- | ---: | --- |
| 0 a 99 999 | 1 | Achat direct |
| 100 000 a 999 999 | 2 | Consultation simplifiee |
| 1 000 000 a 9 999 999 | 3 | Consultation concurrentielle |
| 10 000 000 a 100 000 000 | 3 | Appel d'offres restreint |
| Plus de 100 000 000 | 5 | Appel d'offres formel |

Les bornes ne se chevauchent pas. Les regles sont stockees par entreprise et modifiables par API.

## Securite

- isolation stricte par `tenant_id` sur les ressources acheteur ;
- jetons fournisseur aleatoires de 64 caracteres, stockes uniquement sous forme SHA-256 ;
- regeneration d'un lien invalide automatiquement le precedent ;
- les messages prives d'un fournisseur ne sont pas visibles par les autres ;
- audit des controles, publications, offres, derogations et clotures ;
- montant d'offre recalcule cote serveur ;
- secrets et code marchand DOHONE absents du frontend.

## Verification

```bash
pnpm lint:web
cd apps/web && pnpm exec tsc --noEmit
pnpm build:web
cd apps/api && php artisan test
```

PHP n'est pas installe dans l'environnement de fabrication du ZIP. Les tests Laravel sont fournis mais doivent etre executes sur une machine equipee de PHP 8.2 et Composer 2.
