# Exigences metier consolidees

Ce document consolide le cahier des charges initial, le logigramme achats, le manuel de procedures, la politique achats et la charte de gouvernance fournis pour ProcuFlow.

## Processus de reference

Besoin -> validation hierarchique et budgetaire -> controle de stock -> mise en concurrence -> choix fournisseur -> bon de commande -> reception -> rapprochement BC/BL/facture -> paiement.

## Decisions appliquees

- Le controle de stock precede obligatoirement toute RFQ.
- Un article disponible est reserve ou transfere et n'est pas achete.
- Une disponibilite partielle ne consulte que le reliquat.
- Une prestation ou un article non stocke utilise le statut `not_applicable` et reste a acheter.
- Les validations sont sequentielles par defaut; le modele permet une evolution vers des groupes paralleles.
- L'inscription fournisseur publique reste prevue.
- Le referentiel fournisseur pourra etre partage entre filiales, mais statut, conditions, documents et evaluations restent propres a chaque entreprise.
- La tolerance du futur rapprochement a trois pieces est fixee a zero par defaut.
- Les exceptions admises sont l'urgence prouvee, la source unique et le contrat recent reference. Elles exigent justification, preuve, decision et audit.
- Les achats fractionnes et depenses non approuvees devront etre detectes dans le module de controle.

## Donnees d'offre attendues

Prix, remise, taxe, devise, transport, assurance, delai, validite, paiement, conformite, garantie/SAV, Incoterm, observations et variantes versionnees.

## Points restant configurables

- decision DG seule ou comite au-dessus de 100 millions XAF ;
- fenetre qualifiant un contrat de recent ;
- fenetre de detection des achats fractionnes ;
- autorisation exceptionnelle d'inviter un fournisseur non homologue.

Ces points ne sont pas codes en dur. Ils restent des parametres de politique a confirmer avant production contractuelle.
