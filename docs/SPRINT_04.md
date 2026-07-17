# Sprint 04 - Identite et socle metier

## Objectif

Faire evoluer la base Sprint 03 vers un produit plus presentable commercialement, avec une identite coherente et un backend local reel sans abonnement obligatoire.

## Livre

- marque ProcuFlow et symbole double chevron sans initiales ;
- typographie Geist, rayons harmonises et glassmorphism leger ;
- menu retractable conserve sur ordinateur et tiroir mobile ;
- inscription et connexion Sanctum ;
- creation automatique d'une entreprise et de son administrateur ;
- isolation inter-entreprises par middleware et verification d'appartenance ;
- fournisseurs, documents prives, demandes d'achat et lignes ;
- validation responsable, finance et direction selon le montant ;
- KPI calcules et journal d'audit ;
- formulaires frontend raccordes a l'API avec mode decouverte local ;
- SQLite local et alternatives PostgreSQL/S3 optionnelles ;
- tests de securite et de workflow fournis.

## Verification effectuee

- installation pnpm et verrou de dependances actualise ;
- ESLint sans avertissement ;
- compilation Next.js de production reussie ;
- 18 routes applicatives verifiees en HTTP 200 ;
- 404 verifiee pour une route inconnue ;
- absence de secrets DOHONE dans le frontend controlee.

Les tests PHP sont fournis mais n'ont pas pu etre executes dans l'environnement de construction, qui ne contient ni PHP ni Composer.
