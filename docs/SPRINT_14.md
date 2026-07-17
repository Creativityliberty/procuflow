# Sprint 14 - Contrats, echeances et abonnement SaaS

## Objectif

Combler le volet contractuel du cahier des charges et rendre ProcuFlow exploitable comme produit SaaS : contrats fournisseurs centralises, alertes a 90 jours, forfaits avec quotas et paiement DOHONE securise.

## Gestion contractuelle

- fiche contrat liee a un fournisseur actif et a un responsable interne ;
- reference unique par entreprise, type, valeur, devise, periode, perimetre et clauses de renouvellement ;
- statuts `draft`, `active`, `expiring`, `expired` et `terminated` ;
- depot prive du contrat signe, avenants, renouvellements et documents de resiliation ;
- activation bloquee sans document contractuel ;
- renouvellement et resiliation avec historique horodate et journal d'audit ;
- tableau de suivi avec valeur engagee et contrats a renouveler.

## Alertes automatiques

Le moteur quotidien actualise les statuts contractuels et avertit les administrateurs, les responsables achats et le responsable du contrat. Le delai est configurable de 1 a 365 jours et vaut 90 jours par defaut, conformement au livrable de cloture Digitalisation.

## Produit SaaS

- essai Performance de 14 jours cree a l'inscription ;
- forfaits Essentiel, Performance et Entreprise, mensuels ou annuels en FCFA ;
- suivi de l'usage utilisateurs, fournisseurs et stockage documentaire ;
- quotas appliques cote API aux invitations et a la creation de fournisseurs ;
- resiliation en fin de periode et reprise avant echeance ;
- historique des tentatives de paiement.

## Securite DOHONE

- prix et devise calcules exclusivement cote serveur ;
- aucun code de hachage envoye au navigateur ou versionne ;
- notification publique protegee par limitation de debit ;
- verification MD5 `idReqDoh + rI + rMt + code de hachage` ;
- verification supplementaire du marchand, de la reference, du montant et de la devise ;
- verrou transactionnel et identifiant DOHONE unique pour garantir l'idempotence ;
- conservation d'un sous-ensemble non secret de la notification dans le journal de paiement.

## Validation

- ESLint sans erreur ;
- build de production Next.js reussi, 28 pages generees ;
- tests de workflow ajoutes pour les contrats, le paiement DOHONE idempotent et les quotas ;
- tests Laravel non executes dans l'environnement de livraison, PHP n'y etant pas installe.

## Suite recommandee

Le Sprint 15 couvrira les demandes d'information fournisseurs (RFI), leur portail de reponse et leurs relances, puis renforcera le workflow de validation fournisseur a deux niveaux et la mesure des gains de temps du Pilier Digitalisation.
