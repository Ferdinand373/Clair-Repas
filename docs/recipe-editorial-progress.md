# Suivi du catalogue — rédaction et lecture

## Référence et périmètre

- Dépôt : Ferdinand373/Clair-Repas. Base : `bd5a54bb8c661d77ffb778ee6fea70fc55589ac2`.
- Total réel : **1 553** recettes finales, pas 1 513. Aucun ajout demandé ou effectué.
- Registre par identifiant : [recipe-editorial-inventory.json](recipe-editorial-inventory.json).
- Le premier lot de 20 est conservé. Son journal est [recipe-clarity-batch-01.md](recipe-clarity-batch-01.md).
- Statuts : `pending` à examiner ; `unchanged` conforme sans réécriture ; `corrected` révisée ; `blocked` incertitude essentielle documentée. Une fiche bloquée n’est pas validée culinairement.

## État de départ

| Examinées dans le premier lot | Corrigées | Bloquées | Restant à examiner |
| --- | --- | --- | --- |
| 20 | 15 | 5 | 1 533 |

Les statuts ci-dessus concernent le contenu. La nouvelle présentation est commune aux 1 553 fiches, sans transformer automatiquement une fiche historique en recette relue.

## Publication P01 — présentation et standard

Introduction et titres individuels des 20 premières fiches, informations compactes, étapes numérotées et espacées, boutons de minuteur d’au moins 44 px. Les plages annoncent le repère du bouton. Les informations non disponibles restent explicitement non détaillées. Les anciennes fiches conservent leur texte et un affichage de secours, avec indication de vérification non réalisée. Les notes et avis personnels sont placés après la lecture sans changer leurs clés, contrôles ou sauvegardes.

Guide, modèle et instructions de contribution ajoutés. Audit des parcours : catalogue en ligne dans `index.html`, constructeurs, variantes et remplacements ; anciens fichiers de livraison non actifs ; sauvegardes personnelles sans import de nouvelles recettes ; export public limité aux identifiants/noms.

Contrôles P01 : 7 765 rendus (1 553 fiches à 1/2/3/5/8 convives), 654 contrôles du premier lot, 15 groupes statiques/PWA/minuteur, 105 tests de courses, 47 groupes de synchronisation simulée, 9 groupes de réparation, 12 tests QR4, dates et catalogue public déterministe. Contrôles Browser aux formats 390 × 844, 820 × 1180 et 1440 × 900 : titres lisibles, boutons de 44 px, écart minuteur/bandeau de 12 px, défilement et restauration du minuteur suspendu. Les 1 553 objets de recette restent strictement identiques à la base : seule la présentation et ses métadonnées de lecture évoluent.

## Priorités culinaires du lot suivant

Publication P01 confirmée : commit `58f7d6fed7d5265ee6f02a02d1d669382bda3933`, contrôle statique et GitHub Pages réussis (exécutions `34387369771` et `34387367066`). HTTPS 200 ; `index.html` et `sw.js` servis identiques aux fichiers du commit le 9 septembre 2026.

- `a048` — Velouté de chou-fleur au curry doux : les archives gardent oignon/curry à faire revenir sans matière grasse listée. Une soupe ressemblante ne suffit pas à retrouver la dose originale.
- `e92` — Chili végétarien au riz : même lacune pour le poivron.
- `e78` — Gratin de pâtes au thon et tomate : matière grasse pour la courgette et température du four manquantes.
- `n88` — Pâtes au saumon, petits pois et citron : cuisson du saumon non détaillée avant l’ajout de crème. La [recette Good Food de Caroline Hire](https://www.bbcgoodfood.com/recipes/pasta-salmon-peas), consultée le 9 septembre 2026, poche au contraire les morceaux avec crème et eau ; elle n’est donc pas une source permettant de rétablir la technique initiale de cette fiche.
- `a038` — Gaspacho de concombre à l’aneth : la source initiale cite déjà sel et poivre ; leur absence dans `i` peut être corrigée sans inventer de grammage, en conservant un assaisonnement au goût.

Ces cinq réserves ont été réexaminées dans le lot 02 : `a038` est corrigée depuis les archives ; les quatre autres restent affichées. Aucune adaptation incertaine n’est publiée pour les lever artificiellement.

## Lot 02 — relecture de 35 fiches

[Journal détaillé et sources](recipe-editorial-batch-02.md). 30 nouvelles fiches, plus les 5 réserves prioritaires réexaminées : 22 corrigées, 13 bloquées, 0 conformes sans réécriture. Les préparations des 13 fiches bloquées restent identiques ; leur réserve est visible.

**Cumul : 50 identifiants examinés, 37 corrigés, 13 bloqués, 1 503 à examiner.** Le catalogue reste à 1 553 recettes. Prochaine fiche à examiner dans l'ordre du registre : `n35`.

Contrôles locaux du lot 02 : 15 groupes statiques/PWA/minuteur, 105 tests de courses, 660 contrôles du lot 01 et 810 du lot 02, 7 765 rendus, 47 groupes de sauvegarde/synchronisation simulée, 9 groupes de réparation, QR4 12/12, dates et catalogue public déterministe inchangé. Le compteur QR4 passe de 468 à 469 occurrences composées à cause du sel/poivre rétabli dans `a038`, sans changement du moteur. Zéro erreur éditoriale bloquante ; 9 833 avertissements restent à relire dans le catalogue.

Inspection Browser du lot 02 aux dimensions réellement mesurées 390 × 844, 820 × 1180, 1440 × 900 : recette longue `n19`, courte `a038`, fin de recette accessible, pas de débordement horizontal, boutons du minuteur de 44 px et écart de 12 px avec la navigation. Pause/reprise, restauration après rechargement et réinitialisation sans départ vérifiées par l'interface locale ; les alertes et la zone de sécurité PWA sont également couvertes par les simulations existantes. Aucun test sur appareil physique ni essai culinaire.

## Publication du lot 02

Publication du lot 02 confirmée : `e19c4cdaa46955937fcf027c8bed0332e72414a2`. GitHub Pages `34389149432` réussi, contrôles statiques `34389150060` et `34389150772` réussis ; l'exécution Pages concurrente `34389148605` a été annulée au profit du déploiement réussi. HTTPS 200, fichiers `index.html` et `sw.js` identiques au commit. Mise à jour testée par le bouton existant ; révision chargée `sha256:6d47588ee4624f0ddf542061c902f61f427161782394bee8df67828824726cb2`.

## Lot 03 — 30 fiches suivantes

[Journal et sources](recipe-editorial-batch-03.md). `n35` à `n64` : 14 corrigées, 16 bloquées, aucune conforme sans réécriture. Les fiches bloquées restent inchangées culinairement avec une réserve visible. Les ingrédients, identifiants, portions, appareils et classements des 30 restent tous identiques.

**Cumul : 80 identifiants examinés, 51 corrigés, 29 bloqués, 1 473 à examiner.** Prochaine fiche : `n65`.

Contrôles du lot 03 : 15 groupes statiques/PWA/minuteur, 105 tests de courses, 660 contrôles du lot 01, 1 362 des lots 02/03 (dont 552 nouveaux), 7 765 rendus, 47 groupes de synchronisation simulée, 9 groupes de réparation, QR4 12/12, dates et catalogue public déterministe. Zéro erreur bloquante ; 9 709 avertissements éditoriaux restent à examiner. Affichage du chili long et de la salade courte contrôlé avec Browser à 390 × 844, 820 × 1180 et 1440 × 900 : dernière étape accessible et minuteur séparé de la navigation de 12 px. Tests sur formats simulés, pas sur iPhone physique.

## Reprise exacte à partir du dernier lot

1. Lire `CONTRIBUTING.md` et le standard.
2. Vérifier `main`, la branche et les travaux locaux sans les écraser.
3. Exécuter `node scripts/validate-recipe-editorial.mjs` pour les nombres exacts.
4. Lire les prochains objets finaux avec `node scripts/recipe-editorial-audit.mjs --pending 0 30`. Ce script ne rédige et ne valide aucune recette.
5. Relire chaque fiche, chercher les sources nécessaires, rédiger individuellement, renseigner les titres/temps et mettre à jour sa revue dans le registre. Isoler les blocages et poursuivre.
6. Après contrôle du diff, actualiser les empreintes de livraison avec le patch produit par `node scripts/release-integrity-patch.mjs` ; appliquer et vérifier ce patch. Ne pas actualiser une empreinte de revue pour faire passer un changement non relu.
7. Exécuter les validations du workflow, contrôler le navigateur, publier un lot limité et vérifier le commit servi en HTTPS. Consigner les résultats et les nombres cumulés ci-dessous.

## Limites des vérifications

Les tests de structure, quantité, minuteurs, stockage simulé et rendu ne sont pas des essais culinaires. Les formats iPhone/PWA sont simulés, sauf mention explicite d’un appareil physique. Le total de fiches à examiner ne doit jamais être remplacé par le nombre de fiches auxquelles le style commun a été appliqué.
