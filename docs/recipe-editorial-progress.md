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

Publication du lot 03 confirmée : `caf1d7fa5c7f1a68893277cf1ec6964897f968b6`. Contrôle statique `34390242468` et GitHub Pages `34390241713` réussis ; déploiement `6356805367` en succès. HTTPS 200 le 9 septembre 2026, `index.html` et `sw.js` identiques au commit. Révision de cache : `sha256:20843507090e9e2038d7b0ac231280227ecf53542721c3155841a4340584b9e1`.

## Renforcement P02 — futures contributions

Référence historique des 1 553 identifiants et de leurs `sourceHash` figée, distincte des empreintes de revue. Une nouvelle fiche laissée `pending`, une nouvelle fiche sans introduction/titres/temps et une réécriture dissimulée par changement de la référence sont rejetées. Une nouvelle fiche correctement documentée reste compatible. Les quatre scénarios sont simulés en mémoire ; aucune nouvelle recette n'est ajoutée. Aucun fichier chargé par l'application ni mécanisme de données personnelles n'est changé par P02.

Le mode de lecture du programme reste accessible. Le maintien physique de l'écran allumé dépend de l'autorisation Wake Lock et de la visibilité du navigateur ; son code est inchangé, et sa durée réelle sur iPhone physique n'a pas été testée.

## Procédure de reprise

P02 publié : `c87dc373c29cae1d6edb9c2ac6191004c69ba52a`, tests `34390827874` et Pages `34390827273` réussis. Le navigateur a terminé sa mise à jour et charge la révision `sha256:20843507090e9e2038d7b0ac231280227ecf53542721c3155841a4340584b9e1` du lot 03. Le délai d'installation ne nécessitait ni effacement des données ni correction du service worker.

## Lot 04

[Relectures et sources](recipe-editorial-batch-04.md) : 30 nouvelles fiches, 8 corrigées et 22 bloquées, aucune conforme sans modification. Huile de `n82` rétablie depuis la préparation publiée ; les autres ingrédients restent identiques. Les cinq variantes à ordre contradictoire restent explicitement à vérifier.

**Cumul : 110 identifiants examinés, 59 corrigés, 51 bloqués, 1 443 à examiner.** Prochaine fiche : `n100`. Catalogue toujours à 1 553 recettes. Zéro erreur éditoriale, 9 595 avertissements ; 68 minuteurs et 1 668 contrôles de quantité dans les lots 02/03/04, plus les contrôles du premier lot. Formats simulés téléphone, tablette et ordinateur inspectés ; aucun test physique ou culinaire.

## Publication du lot 04

`e0651372daaedcd762c5e6fdfa61ae25a7d3c260` publié sur `main`. Tests `34392022040` et Pages `34392021855` réussis ; déploiement `6357106346` réussi. HTTPS 200 et fichiers identiques au commit : index SHA-256 `770af0f32b6696ab3ec3a54fa2e3ca5d7c531814f96a03ade90c13c191b8dde9`, service worker `4ace299ecf769106f9f88467557975e92d844da0995805de3559f98c030452cd`. Le navigateur charge bien `sha256:8863c98f29bb1c3d4d28e0dccf0a7ac205bb3ebf0d0245c476e4b224099f946a`. `n82` vérifiée en production avec huile dans la liste, cinq titres et boutons 18/4/4 minutes.

## Lot 05 — réserves des variantes historiques

[Journal par identifiant](recipe-editorial-batch-05.md). 30 nouvelles fiches examinées : 0 corrigée, 0 conforme, 30 bloquées. Les objets culinaires des 1 553 recettes sont tous identiques à la base du lot ; seules les réserves et les métadonnées de lecture des fiches sélectionnées changent. Les températures perdues par génération et les gestes contradictoires ne sont pas complétés par supposition.

**Cumul : 140 identifiants examinés, 59 corrigés, 81 bloqués, 1 413 à examiner.** Prochaine fiche dans l'ordre : `gn-boulettes-tomate-basilic`. Le nombre de fiches corrigées n'augmente pas pour ce lot. Contrôles existants et rendus réussis ; zéro erreur éditoriale, 9 475 avertissements. Réserves et défilement inspectés dans le navigateur aux formats simulés téléphone/tablette/ordinateur, pas sur appareil physique.

## Publication du lot 05

`36bfd03f6af368ad21f6cf83682b0c5b57e9a336` publié sur `main`. Tests `34392595613`, Pages `34392595253` et déploiement `6357205765` réussis. HTTPS 200 et fichiers identiques au commit : index `ef58b89fd6c33e7cecac593322d3ea1e82773de6fe05fa40049cfc3d289f4299`, service worker `d9dd4a19f0499ab0eb59d598227dbd5559268de282ae52435434fc7ef257ecba`. Révision chargée dans le navigateur : `sha256:a502af39d3390549b78e5d57a1c8fe780fe3a400b3acfdf7e79458bbe871881d`. Réserve de `n100` visible en production, sans changement de préparation.

## Lot 06 — 30 desserts

[Journal et références](recipe-editorial-batch-06.md). 27 corrigés, 3 bloqués (`d010`, `d018`, `d030`), aucun conforme sans modification. Tous les ingrédients et portions conservés. `d017` distingue ses dix minutes de repos de la préparation ; `d024` indique le refroidissement en plus des vingt minutes annoncées. Les autres libellés historiques de durée restent identiques.

**Cumul : 170 identifiants examinés, 86 corrigés, 84 bloqués, 1 383 à examiner.** Prochaine fiche globale : `gn-boulettes-tomate-basilic` ; prochain dessert : `d032`. Ce lot change volontairement de famille, sans omettre les variantes encore à examiner. Zéro erreur bloquante et 9 359 avertissements. Les tests des lots 02 à 06 couvrent 76 minuteurs et 2 250 calculs d'ingrédients ; le lot initial conserve ses 660 contrôles et ses vingt fiches.

## Procédure de reprise à appliquer après le lot 06

1. Lire `CONTRIBUTING.md` et le standard.
2. Vérifier `main`, la branche et les travaux locaux sans les écraser.
3. Exécuter `node scripts/validate-recipe-editorial.mjs` pour les nombres exacts.
4. Lire les prochains objets finaux avec `node scripts/recipe-editorial-audit.mjs --pending 0 30`. Ce script ne rédige et ne valide aucune recette.
5. Relire chaque fiche, chercher les sources nécessaires, rédiger individuellement, renseigner les titres/temps et mettre à jour sa revue dans le registre. Isoler les blocages et poursuivre.
6. Après contrôle du diff, actualiser les empreintes de livraison avec le patch produit par `node scripts/release-integrity-patch.mjs` ; appliquer et vérifier ce patch. Ne pas actualiser une empreinte de revue pour faire passer un changement non relu.
7. Exécuter les validations du workflow, contrôler le navigateur, publier un lot limité et vérifier le commit servi en HTTPS. Consigner les résultats et les nombres cumulés ci-dessous.

## Publication du lot 06

`f6f6b236cc11389e9735b2a6e6d2015cc77513d9` publié sur `main`. Tests `34393535267`, Pages `34393534246` et déploiement `6357372224` réussis. HTTPS 200 et fichiers identiques au commit : index `d8f324b7c044b0498c3c392db2b4550707b2764ed6c8d447d1ad48e0be90bf75`, service worker `acccbdd68d5eca0e8cc9b025f8ea82dda5301a9807a8309474926ea3f1b8efe1`. Révision chargée : `sha256:73ac34f212bc6398378275c517d3274c436192894de87c28c0c843ad43a14ae6`. Fraises au balsamique vérifiées en ligne : dix minutes de repos séparées de la préparation et bon bouton de dix minutes.

## Lot 07 — 30 entrées

[Journal et sources](recipe-editorial-batch-07.md). 20 corrigées et 10 bloquées ; aucune conforme sans modification. Onze assaisonnements déjà demandés dans les anciennes étapes sont rétablis sans grammage inventé. Autres ingrédients, identifiants, portions, appareils et classements inchangés. Les deux rendements fixes du lot restent inchangés.

**Cumul : 200 identifiants examinés, 106 corrigés, 94 bloqués, 1 353 à examiner.** Prochaine entrée : `a031`. Prochaine fiche globale : `gn-boulettes-tomate-basilic`, prochain dessert : `d032`. Zéro erreur éditoriale, 9 256 avertissements ; 85 minuteurs et 2 862 contrôles d’ingrédients dans les lots 02–07, plus les tests du premier lot. Tests existants réussis, lecture téléphone/tablette/ordinateur simulée contrôlée. Publication et vérification HTTPS à consigner après le push.

## Limites des vérifications

Les tests de structure, quantité, minuteurs, stockage simulé et rendu ne sont pas des essais culinaires. Les formats iPhone/PWA sont simulés, sauf mention explicite d’un appareil physique. Le total de fiches à examiner ne doit jamais être remplacé par le nombre de fiches auxquelles le style commun a été appliqué.
