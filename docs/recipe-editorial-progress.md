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

## Publication du lot 07

`b5e8c9ae19b8832e2117f3d1821b298c846de604` publié. Contrôles `34394570055` et `34394570851` réussis ; Pages `34394570001` et déploiement `6357550640` réussis. L’exécution Pages concurrente `34394568710` a été annulée au profit du déploiement réussi. HTTPS 200, index et service worker identiques au commit : SHA-256 `cecc0fac9371830619d1cb80160cb1b12bfb32b2cf9fa3fccc556e2ab0665bb5` et `3f65279bcbb27a897c1ed97cf7b0a242c2ef39ff56102e3ea040f8011f28657d`. Révision du navigateur `sha256:ca0d60f9050c5ec84b3eaac25cbecbe538891afccd873b0933b2a545848200c6`. Rémoulade légère vérifiée en ligne : poivre rétabli, trois étapes titrées et doses cohérentes.

## Lot 08 — trente variantes suivantes

[Journal par identifiant et sources](recipe-editorial-batch-08.md). 0 corrigée, 0 conforme, 30 bloquées. Toutes les préparations et ingrédients restent identiques ; seules les réserves et la présentation des fiches sélectionnées évoluent. Les répétitions de sauce, ingrédients oubliés et températures disparues ne sont pas résolus par des quantités ou appareils inventés.

**Cumul : 230 identifiants examinés, 106 corrigés, 124 bloqués, 1 323 à examiner.** Prochaine fiche globale : `gn-cotes-porc-champignons-polenta`, prochaine entrée : `a031`, prochain dessert : `d032`. Zéro erreur éditoriale, 9 136 avertissements. Les 85 minuteurs et 2 862 calculs des lots précédents restent validés ; contrôles du projet et présentation réexécutés. Ce lot ne compte aucune correction culinaire supplémentaire. Publication à consigner après vérification.

## Publication du lot 08

`a7bf702d90ccfc46aad5582d5ae80b02fab8af82` publié. Tests `34395127963`, Pages `34395127351` et déploiement `6357650144` réussis. HTTPS 200 avec et sans paramètre de contrôle ; fichiers identiques au commit : index `c4ec8a58ae41504dedc7bf06a71655a45a2599e4c5a50b56538de59ebc80412f`, service worker `bba5348480cf13f407e1c86569d7407523708fa640389a37394d80dea539297e`. Le navigateur a terminé son installation puis s’est rechargé automatiquement vers `sha256:026147506b43002fe6931072d0f6f08cee73cf0114e58f74ad66f21749d27927`. Réserve gingembre/soja du bœuf émincé vérifiée en production. Le diagnostic de l’ancienne version était sain pendant cette attente ; aucun effacement de cache ou modification du service worker n’a été nécessaire.

## Lot 09 — trente desserts

[Journal des relectures et références](recipe-editorial-batch-09.md). 25 corrigés et 5 bloqués (`d047`, `d058`, `d059`, `d061`, `d062`), aucun conforme sans modification. Tous les ingrédients et portions restent identiques. Deux libellés de temps distinguent le repos ou refroidissement (`d057`, `d063`). La crème citron sans cuisson demande du blanc pasteurisé ; les fruits partagés de la faisselle et de la mangue utilisent les quantités dynamiques existantes.

**Cumul : 260 identifiants examinés, 131 corrigés, 129 bloqués, 1 293 à examiner.** Prochain dessert `d064`, prochaine entrée `a031`, prochaine fiche globale `gn-cotes-porc-champignons-polenta`. Zéro erreur éditoriale, 9 014 avertissements. 99 minuteurs et 3 456 contrôles d’ingrédients dans les lots 02–09, plus les contrôles du premier lot. Tests du projet réussis ; Browser téléphone/tablette/ordinateur simulés vérifié, fin de recette accessible et quantités réparties cohérentes. Publication à consigner après vérification HTTPS.

## Publication du lot 09

`b05d6b95d7f6e330f5b34de84fb8cf2b8ed53782` publié. Tests `34396043508`, Pages `34396042754` et déploiement `6357809674` réussis. HTTPS 200 et fichiers identiques au commit : index `91e9e2c6f8347778023134bbdd3421db9a23f4c5cef6c1e5e69c3fda4cdcad78`, service worker `a9c302f00692bee94159c27d0ff96337fb9a52cd09267001d4e1722715311f18`. Révision chargée `sha256:2fc70f4a0ad3eef7963a84828bb669bfadd017f04b5b79a0a5cc8294bdb90b5c`. Faisselle vérifiée en production : les deux parts de 100 g correspondent aux 200 g de fruits rouges pour deux personnes.

## Lot 10 — trente entrées et soupes

[Journal et décisions individuelles](recipe-editorial-batch-10.md). 9 corrigées, 21 bloquées, aucune conforme sans modification. Quatre ingrédients rétablis depuis les anciennes étapes ; la pincée de muscade déjà demandée remplace une quantité non renseignée. Les deux pincées retrouvées sont dynamiques. Aucun changement des portions ou appareils, aucun changement culinaire des fiches bloquées.

**Cumul : 290 identifiants examinés, 140 corrigés, 150 bloqués, 1 263 à examiner.** Prochaine entrée `a063`, prochain dessert `d064`, prochaine fiche globale `gn-cotes-porc-champignons-polenta`. Zéro erreur éditoriale, 8 893 avertissements. 106 minuteurs et 3 738 contrôles d’ingrédients dans les lots 02–10. Contrôles du projet réussis ; publication à consigner après vérification HTTPS.

## Publication du lot 10

`06a98d80d2f492317b93b8ccdff83ddb6a85172e` publié. Tests `34397152947`, Pages `34397151975` et déploiement `6357997331` réussis. HTTPS 200 et fichiers identiques au commit : index `cf76840e21895e323b29847cc17f801722ec2df456cfcc1602cb3fcf1f160747`, service worker `096290d3823804fc32e1ac06800774cf8ea2695d55ad1d793a19f4f70308d4da`. Révision chargée `sha256:8816c497e5b9af6a74fa9ee2608bf77633786c6dba09ead1901595170b6a6f2d`. Crème d’endives vérifiée en ligne : pincée retrouvée dans la liste et la préparation, bon bouton de vingt minutes.

## Lot 11 — trente variantes de plats

[Journal des trente réserves](recipe-editorial-batch-11.md). 0 corrigée, 0 conforme, 30 bloquées. Tous les objets culinaires du catalogue restent identiques à la base du lot ; seulement trente métadonnées de lecture et leurs avertissements sont ajoutés. Aucune matière grasse, température ou répartition manquante n’est inventée.

**Cumul : 320 identifiants examinés, 140 corrigés, 180 bloqués, 1 233 à examiner.** Prochaine fiche globale `gn-pois-chiches-ratatouille`, prochaine entrée `a063`, prochain dessert `d064`. Zéro erreur éditoriale et 8 773 avertissements. Les 106 minuteurs et 3 738 contrôles de quantité des lots précédents restent vérifiés. Publication à consigner après contrôle en ligne.

## Publication du lot 11

`3f926eb23d08318a0f9527c5c68687ad992fdc13` publié. Tests `34397827417`, Pages `34397826384` et déploiement `6358110613` réussis. HTTPS 200 et fichiers identiques au commit : index `8c7e13c56386b57f10dae71371e67705fe0ae8a5ff59eeecb0748745b911d38e`, service worker `da835c22bea93bd2361112187080f35aa5e7b84b385fe2bf571b843db1c6805a`. Révision chargée dans le navigateur après mise à jour normale : `sha256:55257ed060c37e9034224941425258178d0d3faf4fe83b24c5e85bfd8fad0154`. L’ancienne version est restée disponible pendant la préparation ; aucun effacement de données n’a été nécessaire.

## Lot 12 — trente desserts et pâtisseries

[Journal, références et décisions](recipe-editorial-batch-12.md). 22 corrigés, 8 bloqués, aucun conforme sans modification. Tous les ingrédients et portions conservés, notamment les six portions du clafoutis final. Partage du sucre concret, cuisson à l’eau des îles flottantes documentée, appareils de cuisson et techniques préservés ; les choix techniques ajoutés sont distingués des informations retrouvées dans l’archive.

**Cumul : 350 identifiants examinés, 162 corrigés, 188 bloqués, 1 203 à examiner.** Prochain dessert `d094`, prochaine entrée `a063`, prochaine fiche globale `gn-pois-chiches-ratatouille`. Zéro erreur éditoriale et 8 653 avertissements. 128 minuteurs et 4 410 calculs d’ingrédients dans les lots 02–12 ; les 24 commandes du workflow réussissent. Publication à consigner après contrôle en ligne.

## Publication du lot 12

`9c16fda7bec94998e9b94a9f91de3878f219d6ae` publié. Tests `34399261897`, Pages `34399261483` et déploiement `6358361850` réussis. HTTPS 200 et fichiers identiques au commit : index `c8977c9b1c084c547f58f8f76c79b43fd6ac993004b6d6340d923d1041f5c4aa`, service worker `a4e343ef1d83a8746b4b1d46cfd50a2a4445cd2e38e6402014ff04b4b6a3ddd0`. Révision chargée après mise à jour normale : `sha256:97b01bb780a1cf1fe4e0da4c0bfc6a75e84f59d09f7c0280efdb0a144ac4d4ad`. Îles flottantes contrôlées en production à deux personnes : 30 g + 30 g de sucre, crème à 82–84 °C et deux boutons distincts de deux minutes.

## Lot 13 — trente entrées et une terrine

[Journal et décisions individuelles](recipe-editorial-batch-13.md). 13 corrigées, 17 bloquées, aucune conforme sans modification. Six ingrédients explicitement retrouvés dans les étapes sont rétablis sans quantité inventée. Toutes les portions et tous les dosages chiffrés restent inchangés ; la terrine garde son rendement fixe. Les cinq dernières minutes de la courge restent incluses dans les vingt-cinq de cuisson.

**Cumul : 380 identifiants examinés, 175 corrigés, 205 bloqués, 1 173 à examiner.** Prochaine entrée `a094`, prochain dessert `d094`, prochaine fiche globale `gn-pois-chiches-ratatouille`. Zéro erreur éditoriale, 8 539 avertissements. 144 minuteurs et 4 842 contrôles de quantité dans les lots 02–13. Les 24 commandes du workflow réussissent ; publication à consigner après contrôle en ligne.

## Publication du lot 13

`db525637226b490687873ccf91250a77e3451877` publié. Tests `34400058230`, Pages `34400057221` et déploiement `6358497262` réussis. HTTPS 200 et fichiers identiques au commit : index `68cd55536fec24a36dabf49d707a0c16588a776f4a17a0f24ffc99e6ac5d5e06`, service worker `f574f3370f6fc2b215843ed73867fe249de6083f123eac4bebfca290b8809bf2`. Révision chargée `sha256:d5e76564f71ec8012fa8dc044aa4b5f1ad0f095440112e4c3edc691b2295cc31`. Courge vérifiée en ligne à deux personnes, huile et miel de la liste repris dans les étapes, minuteurs de vingt puis cinq minutes.

## Lot 14 — cinquante variantes et leurs réserves

[Journal et cinquante décisions](recipe-editorial-batch-14.md). 50 bloquées, 0 corrigée et 0 conforme sans modification. Tous les objets culinaires du catalogue restent identiques à la base : aucune cuisson, dose, identité ou portion n’est changée. Les réserves de sauce, récipient et répartition sont précises ; deux avertissements sur la marinade au contact de viande crue sont explicités.

**Cumul : 430 identifiants examinés, 175 corrigés, 255 bloqués, 1 123 à examiner.** Prochaine fiche globale `gn2-boeuf-gingembre-sesame`, prochaine entrée `a094`, prochain dessert `d094`. Zéro erreur éditoriale et 8 339 avertissements. Les 24 commandes du workflow réussissent ; 144 minuteurs et 4 842 calculs d’ingrédients des lots précédents conservés. Publication à consigner après contrôle HTTPS.

## Publication du lot 14

`26931be05651e269f42fb008476abacae3b868e3` publié. Tests `34400888341`, Pages `34400886269` et déploiement `6358638232` réussis. HTTPS 200 et fichiers identiques au commit : index `07e36c062ddf28fb3bdb3a5820301700f2f5de5a6e09ce94b8142e65d10027f6`, service worker `bb83d9902947556fecf00ad4f1e7f52f7657035e84732aa4abef4ace0d8e7347`. Révision chargée après actualisation normale `sha256:09c5b0f3ae635521f93f527708b43a4ed408f602c2d48f9f0c2200ff98505c11`. Aucun effacement de données ni intervention sur le programme.

## Lot 15 — trente desserts

[Journal, références et décisions individuelles](recipe-editorial-batch-15.md). 20 corrigés, 10 bloqués, aucun conforme sans modification. Une pincée de sel retrouvée dans les étapes du far est rétablie ; autres ingrédients et portions inchangés. Répartition du sucre calculée, cuissons par face et repos distincts. Les dix objets culinaires bloqués restent intacts. La tolérance des quantités figées d’une fiche historique bloquée est strictement limitée au contenu original inchangé, avec tests négatifs et documentation.

**Cumul : 460 identifiants examinés, 195 corrigés, 265 bloqués, 1 093 à examiner.** Prochaine fiche globale `gn2-boeuf-gingembre-sesame`, prochaine entrée `a094`, prochain dessert `v74-reg-27`. Zéro erreur éditoriale et 8 209 avertissements. Les 24 commandes du workflow réussissent ; 185 minuteurs et 5 580 calculs d’ingrédients vérifiés dans les lots 02–15. Publication à consigner après vérification en production.

## Publication du lot 15

`c049cb54ed687ef7a302d03455e07e37f5178428` publié sur `main`. Tests `34402756386`, Pages `34402755897` et déploiement `6358953568` réussis. HTTPS 200 et fichiers identiques au commit : index `5850c71d39ad1689e2e92339550a33041ac91d85e23d0bb63726e48dbc8fad92`, service worker `9995b3d658673c4bf4cd80050bb968fddd990470727865b504284fda46c2d841`. Révision chargée `sha256:f13f18fa7c68228105a89d2da3a6af1754e346f8e0abaf08a52f665ead239cb9`. Île flottante de brasserie vérifiée en production à deux personnes : 40 g pour la crème, 30 g pour les blancs et 30 g distincts pour le caramel ; deux boutons d’une minute pour le pochage. Actualisation normale, sans effacer de données.

## Lot 16 — trente entrées et terrines

[Journal, sources et décisions](recipe-editorial-batch-16.md). 17 corrigées, 13 bloquées, aucune conforme sans modification. Trois assaisonnements déjà présents dans les étapes sont rétablis sans dose inventée. Rendements fixes, identifiants, portions, autres ingrédients et appareils conservés. Les températures à cœur corrigées sont justifiées par les références sanitaires, sans changer les fours ni les techniques ; les deux barèmes au foie de porc non établis restent bloqués.

**Cumul : 490 identifiants examinés, 212 corrigés, 278 bloqués, 1 063 à examiner.** Prochaine entrée `theme-bistrot-brasserie-03`, prochaine fiche globale `gn2-boeuf-gingembre-sesame`, prochain dessert `v74-reg-27`. Zéro erreur éditoriale et 8 089 avertissements. 210 minuteurs et 6 378 contrôles d’ingrédients dans les lots 02–16. Les 24 commandes du workflow réussissent ; formats téléphone, tablette et ordinateur contrôlés visuellement. Publication à consigner après contrôle en ligne.

## Publication du lot 16

`f8c0d20f53e6e015278016f8a6e129243fa3150a` publié sur `main`. Tests `34404163926`, Pages `34404162639` et déploiement `6359183795` réussis. HTTPS 200 et fichiers identiques au commit : index `58e88e6af43b9fe975db296fae7b8d0834dc24499cdbfa1d306df8cf2f8d695e`, service worker `4a2a5e0ac5b7915ccaa6e0c9de8a87d3ebb53652742acc4f495c5a93312b2dc9`. Révision chargée `sha256:5b5a6f32baebcf44d8f98a7fd8228e97b13bc8f6b014dfa5f3789092f3a019d4`. Terrine de foies de volaille vérifiée en ligne : 20 g puis 100 g de beurre, rendement fixe, cuisson finale à 74 °C et minuteurs 4/3/35–40 minutes. Actualisation normale, sans effacer de données.

## Lot 17 — cinquante variantes et leurs réserves

[Journal et décisions individuelles](recipe-editorial-batch-17.md). 50 bloquées, 0 corrigée, 0 conforme sans modification. Les cinquante listes et préparations sont identiques dans les deux archives ; leurs lacunes ne sont pas comblées arbitrairement. Tous les objets culinaires du catalogue restent intacts. Réserves précises sur les sauces répétées, les récipients, les ingrédients absents et les cuissons contradictoires.

**Cumul : 540 identifiants examinés, 212 corrigés, 328 bloqués, 1 013 à examiner.** Prochaine fiche globale `gn2-saumon-estragon-petits-pois`, prochaine entrée `theme-bistrot-brasserie-03`, prochain dessert `v74-reg-27`. Zéro erreur éditoriale et 7 889 avertissements. 2 532 rendus d’ingrédients supplémentaires pour les fiches réservées, à 1/2/3/4/5/8 personnes ; 210 minuteurs et 6 378 calculs d’ingrédients des corrections précédentes conservés. Les 24 commandes du workflow réussissent et les trois formats sont contrôlés visuellement. Publication à consigner après contrôle en ligne.

## Publication du lot 17

`4011681afc451abb9c46226b3b7276c7afa3b3f2` publié. Tests `34404996621`, Pages `34404995977` et déploiement `6359320497` réussis. HTTPS 200 et fichiers identiques au commit : index `5e6ad69d0651176334ebba07050d9d0ebd591bb5c8bd5fa329c24606f6afc6f4`, service worker `dda83833bbffceaf167b192cb4d73e63aa5cc8739156742985fac484bba727da`. Révision chargée après mise à jour normale `sha256:6abc80626f75d336bbc198e851643e572f46bc894229a7a02923a24d7dbce37c`. Filet mignon tomate/origan à l’Airfryer contrôlé en production : réserves visibles, 350 g de viande et 140 g de boulgour pour deux personnes, cuisson au panier inchangée. Pas d’effacement de données.

## Lot 18 — trente entrées régionales et de bistrot

[Journal, sources et décisions](recipe-editorial-batch-18.md). 14 corrigées, 16 bloquées, aucune conforme sans modification. La salade landaise ne change que d’une phrase pour rétablir son bouton de minuteur ; les quatre autres étapes sont conservées. Quantités de fromages liées aux ingrédients, eaux conditionnelles des veloutés et accompagnements source rétablis sans doses inventées. Les seize fiches réservées ne sont pas réécrites.

**Cumul : 570 identifiants examinés, 226 corrigés, 344 bloqués, 983 à examiner.** Prochaine entrée `v75-chef-ducasse-03`, prochaine fiche globale `gn2-saumon-estragon-petits-pois`, prochain dessert `v74-reg-27`. Zéro erreur éditoriale et 7 778 avertissements. 244 minuteurs et 7 074 contrôles d’ingrédients dans les corrections des lots 02–18, plus les 2 532 rendus réservés du lot 17. Les 24 commandes du workflow réussissent et les trois formats sont contrôlés visuellement. Publication à consigner après contrôle en ligne.

## Publication du lot 18

`30c33c8da911544e74ac61a3191260027a93b1d4` publié sur `main`. Tests `34406640370`, Pages `34406638704` et déploiement `6359604898` réussis. HTTPS 200 et fichiers identiques au commit : index `b0c6ca87124e033152cddf3497713adae4b613f6e0ad0d43ec6cb821c86b956c`, service worker `ed9fda4e634ca98c41ab8ad5e92e0e8a5a71b569e6543e891fd4cf21be6b5775`. Révision chargée après actualisation normale `sha256:59d0824116e874e9b0cd095a9f72a887a62ba547fd9a0f8f1155e5a045cfbaab`. Gougères bourguignonnes vérifiées en production : 50 g puis 20 g de comté à deux personnes, quatre minuteurs correctement placés, sans minuteur parasite de vingt minutes. Aucune donnée effacée.

## Lot 19 — les trente et un desserts restants

[Journal et sources](recipe-editorial-batch-19.md). 11 corrigées, 20 réservées, aucune conforme sans modification. Partages de sucre et de beurre liés aux ingrédients, crème facultative source rétablie et cuissons des préparations aux œufs explicitées. Les écarts d’identité et de technique non résolus restent visibles, sans réécriture de ces fiches.

**Cumul : 601 identifiants examinés, 237 corrigés, 364 bloqués, 952 à examiner.** Les 154 desserts sont désormais examinés : 108 corrigés et 46 bloqués, sans prétendre résoudre les réserves. Prochaine entrée `v75-chef-ducasse-03`, prochaine fiche globale `gn2-saumon-estragon-petits-pois`. Zéro erreur éditoriale et 7 647 avertissements. 268 minuteurs et 7 590 contrôles d’ingrédients dans les corrections des lots 02–19 ; 2 532 rendus réservés du lot 17 conservés. Les 24 commandes du workflow et les contrôles visuels aux trois formats passent. Publication à consigner après vérification en ligne.

## Publication du lot 19

`730f4629c45ecac21b589a45b360d46c2d885722` publié sur `main`. Tests `34407978746`, Pages `34407977433` et déploiement `6359837026` réussis. HTTPS 200 et fichiers identiques au commit : index `124ae1c07e9781b96b3f7330f91e8c5a263e4db7add4c80a7c50c307a4456b7d`, service worker `9d40a68f4700e472ac3ae59d62669831c7e2fc6768953e7a094b57aa3141fa18`. Révision chargée après actualisation normale `sha256:f7b66beff9083df968a144e0120ff7b8529a9c70e0d93a3d206a858997562423`. Café liégeois vérifié en production : quatre boules et deux expressos à deux personnes, unité visible dans l’étape, trois étapes et minuteur de refroidissement des coupes. Aucune donnée effacée.

## Lot 20 — trente plats et variantes

[Journal et décisions](recipe-editorial-batch-20.md). 2 corrigées, 28 réservées, aucune conforme sans modification. Les deux archives confirment les trente préparations finales. Rôti de porc et lentilles au lard précisés sans changement d’ingrédients ni de technique ; réserves individualisées pour sauces répétées, matière grasse non définie, mesures manquantes et cuissons ambiguës.

**Cumul : 631 identifiants examinés, 239 corrigés, 392 bloqués, 922 à examiner.** Prochaine fiche globale `v31n-orzo-tofu`, prochaine entrée `v75-chef-ducasse-03`. Zéro erreur éditoriale, 7 526 avertissements, 274 minuteurs et 7 686 contrôles d’ingrédients dans les corrections des lots 02–20. Les 24 commandes du workflow réussissent ; affichage et défilement contrôlés aux trois formats simulés. Publication à consigner après vérification en ligne.

## Publication du lot 20

`aa5971677d4a6c81ce5a1be4613a7ad02bba71a7` publié sur `main`. Tests `34409126967`, Pages `34409125528` et déploiement `6360028090` réussis. HTTPS 200 et fichiers identiques au commit : index `8e62828a1b3c38c7ca3a017624f95a03bf6325e1b0fdfa410e4a2144199a76dc`, service worker `0b48af8410c3cd04e9302dbe65f50099878faa8184b2e00f49a3a57cf04f2419`. Révision chargée après actualisation normale `sha256:79a8fda75a94cadca7d5ccf64897a52fb341268f59ab55ac491ad4b64e0c141e`. Lentilles vérifiées en production à deux personnes : 300 g de lentilles, 80 cl de bouillon, une cuillère à café de moutarde, étapes et minuteurs 5/30/5. Aucune donnée effacée.

## Lot 21 — trente plats européens

[Journal, sources et décisions](recipe-editorial-batch-21.md). 1 corrigée, 29 réservées, aucune conforme sans modification. Le gratin conserve la vapeur et la béchamel au beurre, avec gestes, ordre et quantités précisés. Les incohérences de liquide, graisse, ingrédients restants ou produits non identifiés sont réservées sans modifier les objets culinaires concernés.

**Cumul : 661 identifiants examinés, 240 corrigés, 421 bloqués, 892 à examiner.** Prochaine fiche globale `v31n-tacos-tofu`, prochaine entrée `v75-chef-ducasse-03`. Zéro erreur éditoriale, 7 404 avertissements, 277 minuteurs et 7 734 contrôles d’ingrédients dans les corrections des lots 02–21. Les 24 commandes du workflow passent ; contrôles visuels et défilement aux trois formats simulés réussis. Publication à consigner après contrôle en ligne.

## Publication du lot 21

`6de7ac063105ad44bae318e7c1ad9ea88a23f2df` publié sur `main`. Tests `34409982815`, Pages `34409982349` et déploiement `6360162735` réussis. HTTPS 200 et fichiers identiques au commit : index `de817fb08ec6585c80bd438ad62c4d456436249149762061e3f7c023a11ac20e`, service worker `1abc43371113c3787b7be53e35bcefc7bd4534f83bd3f2a1d27ae7c782762e23`. Révision chargée après actualisation normale `sha256:be9468d841ad62e1bd59c80fd4bdddbf446388aaf6bd748038f05f97aad4ef18`. Gratin vérifié en production à deux personnes : 40 g de beurre et farine, 45 cl de lait, 90 g de fromage, trois boutons 10/5/18 et vapeur conservée. Aucune donnée effacée.

## Lot 22 — trente plats, pochages et sautés

[Journal, sources et décisions](recipe-editorial-batch-22.md). 1 corrigée, 29 réservées, aucune conforme sans modification. L’oyakodon conserve le pochage au bouillon ; quantités, riz et service clarifiés, contrôles sanitaires sourcés. Les partages de marinade, rendements figés et graisses ou volumes indéfinis sont signalés sans modifier les autres objets culinaires.

**Cumul : 691 identifiants examinés, 241 corrigés, 450 bloqués, 862 à examiner.** Prochaine fiche globale `v31n-papillote-fenouil-tofu`, prochaine entrée `v75-chef-ducasse-03`. Zéro erreur éditoriale, 7 281 avertissements, 280 minuteurs et 7 782 contrôles d’ingrédients dans les corrections des lots 02–22. Les 24 commandes du workflow et les contrôles visuels aux trois formats simulés passent. Publication à consigner après contrôle HTTPS.

## Publication du lot 22

`7fceb1938f1a866a415c9bc46a7dab42e61cc2ef` publié sur `main`. Tests `34410662974`, Pages `34410662683` et déploiement `6360273600` réussis. HTTPS 200 et fichiers identiques au commit : index `e7a54b66c5d09cdf76573fb68944ead62ced3ee55e2a9bd3ae420028b4357dca`, service worker `e5a434847cafb5b74306dc247c8772dd829ed195da58986a4612b0a4ec193d66`. Révision chargée après actualisation normale `sha256:3255451bfcaa4979bab37c7844cf9c6a3dcc92ebeb0f864c1aed9bbd8c346b4e`. Oyakodon vérifié en production à deux personnes : 300 g de poulet, 140 g de riz, quatre œufs, 18 cl de bouillon et minuteurs 5/7/2–3 avec borne de trois minutes explicitée. Pochage conservé, aucune donnée effacée.

## Lot 23 — trente et une entrées

[Journal, sources et décisions](recipe-editorial-batch-23.md). 5 corrigées, 1 conforme sans réécriture, 25 réservées. Gésiers, langoustines, champignons, cervelas et pied de cochon clarifiés sans changement de technique ; os à moelle conservé mot pour mot. Huile et œufs distincts de la gribiche vérifiés, secondes sans minuteur arrondi, cuisson insuffisante des morilles signalée explicitement.

**Cumul : 722 identifiants examinés, 246 corrigés, 475 bloqués, 1 conforme sans réécriture, 831 à examiner.** Prochaine fiche globale `v31n-papillote-fenouil-tofu`. Zéro erreur éditoriale, 7 159 avertissements, 292 minuteurs et 8 112 calculs d’ingrédients des lots 02–23. Les 24 commandes du workflow passent ; affichage et mode cuisine contrôlés aux trois formats simulés. Publication à consigner après contrôle HTTPS.

## Publication du lot 23

`ee4d8303b8dd459f7b49706c420d697b11649028` publié sur `main`. Tests `34412430679`, Pages `34412426109` et déploiement `6360571084` réussis. Après une première réponse HTTPS encore sur le lot précédent pendant le déploiement, les fichiers sont confirmés identiques au commit : index `20bc99fac49f6f80350ca2a3db5ae45d9e0f5589c89f1f195424c4c1091acb19`, service worker `ae6c75985cb002723e43f25ac82d44224e40cad859f0cca1fb9ec8ee33b3e933`. HTTPS 200, révision chargée après actualisation normale `sha256:248372e80b6e37a27e53161cf679a1ec444c06b9e1fd647835f6df1fd29c0667`. Pied de cochon contrôlé en production à deux personnes : 6 cl d’huile de sauce, une cuillère à soupe de cuisson, œufs séparés et quatre minuteurs correctement attachés. Pas d’effacement de données.

## Lot 24 — petits-déjeuners et préparations de base

[Journal, sources et décisions](recipe-editorial-batch-24.md). 38 examinées : 21 corrigées, 4 conformes sans réécriture, 13 réservées. Quantités de beurre et sucre liées aux ingrédients ; rendement fixe du granola conservé. Deux sels déjà demandés dans la source rétablis sans dose inventée. Fond blanc sans rinçage de volaille crue et sans rôtissage ajouté ; sablage et crémage restent distincts.

**Cumul : 760 identifiants examinés, 267 corrigés, 488 bloqués, 5 conformes sans réécriture, 793 à examiner.** Tous les petits-déjeuners et fondamentaux sont examinés, sans prétendre résoudre leurs réserves. Zéro erreur éditoriale, 7 022 avertissements, 321 minuteurs et 8 934 calculs d’ingrédients des lots 02–24. Les 24 commandes du workflow réussissent ; affichage et dernière étape du mode cuisine contrôlés aux trois formats simulés. Publication à consigner après contrôle HTTPS. Les sauces et accompagnements restent à traiter.

## Publication du lot 24

`c4a920f46261ddf899a5b99a3923b53505099284` publié sur `main`. Tests `34413779450`, Pages `34413772701` et déploiement `6360799456` réussis. HTTPS 200 et fichiers identiques au commit : index `f390c82a358deb2cb59796a86d8eae38209028f23dd1639df15475f0063a7bff`, service worker `5c6588e551cc803419ae9220cc3f668c52a1773204ddd9f85e554e2b05bd92a0`. Révision chargée après mise à jour normale `sha256:8ebf1d3b9397c260e9de68577bee326511e292fdfc14fd62146704cb3169af02`. Caramel contrôlé en production à deux personnes : 25 g puis 50 g, préparation à sec inchangée et aucun minuteur arbitraire. Aucune donnée effacée.

## Lot 25 — quarante sauces

[Journal, sources et décisions](recipe-editorial-batch-25.md). 19 corrigées, 4 conformes sans réécriture, 17 réservées. Quantités de réduction et moutardes liées aux ingrédients, gestes du mortier et du couteau conservés. Choix d’œufs pasteurisés documenté pour les émulsions crues ou peu cuites complètes ; cuillerées ambiguës, partages de beurre et autres informations manquantes restent réservés. Aucun ingrédient ajouté ni portion modifiée.

**Cumul : 800 identifiants examinés, 286 corrigés, 505 bloqués, 9 conformes sans réécriture, 753 à examiner.** Les 40 sauces sont examinées. Zéro erreur éditoriale, 6 876 avertissements, 350 minuteurs et 9 894 calculs d’ingrédients des lots 02–25. Les 24 commandes du workflow réussissent ; affichage et mode cuisine contrôlés aux trois formats simulés. Publication à consigner après contrôle HTTPS. Les accompagnements et plats restants suivent.

## Publication du lot 25

`4f0b4e54a746544284e7420416a4fb5621777aab` publié sur `main`. Tests `34414671649`, Pages `34414670568` et déploiement `6360951007` réussis. HTTPS 200 et fichiers identiques au commit : index `2d33e099d30d75a133ded958aa2e5e98e578def629babd98acf5c48614413ca6`, service worker `4470fe446568a2e8982ddb67afd86d0e59657b62902ee3031315b74a95392dc0`. Révision chargée après mise à jour normale `sha256:8db86a72bcc8fee9d506253fcf835d91f62d70e78dd72119bd8b30ccbb664b18`. Sauce au vin blanc contrôlée en production à deux personnes : 7½ cl au départ puis 2½ cl restants, 12½ g de beurre uniquement en finition et minuteur de crème 3–4 minutes correctement attaché. Aucune donnée effacée.

## Lot 26 — cinquante accompagnements

[Journal, sources et décisions](recipe-editorial-batch-26.md). 28 corrigés, 1 conforme sans réécriture, 21 réservés. Eau des haricots blancs et citron des artichauts retrouvés dans la source ; cuisson créole et polenta selon le paquet, sans minuteur générique. Minutes de retournement et de finition comprises dans la durée prévue, purées au presse-purée et braisages conservés.

**Cumul : 850 identifiants examinés, 314 corrigés, 526 bloqués, 10 conformes sans réécriture, 703 à examiner.** Zéro erreur éditoriale, 6 676 avertissements, 399 minuteurs et 10 890 calculs d’ingrédients des lots 02–26. Les 24 commandes du workflow réussissent ; affichage, défilement et mode cuisine contrôlés aux trois formats simulés. Publication à consigner après contrôle HTTPS. Prochaine fiche globale `v31n-papillote-fenouil-tofu` ; l’accompagnement chef `v75-chef-robuchon-01` reste à examiner.

## Publication du lot 26

`567dc0a5c4c26396c75fd54c2aae4c13e4227f3e` publié sur `main`. Tests `34415980598`, Pages `34415979391` et déploiement `6361157976` réussis. Une première réponse HTTPS pendant la propagation servait encore le lot 25 ; le contrôle final confirme HTTPS 200 et des fichiers identiques au commit : index `5b3b716c010b5f626a471610789699056d1ddb233a7e44e9442396372c6ffef3`, service worker `357cb78af717d7e522738d2d6fe23c96aa2ef2e9fda3d0b1d73d7b1f4677e9a4`. Révision chargée après mise à jour normale `sha256:dbfa6c4969184ca3fd668b7a41e8f78fc1851b9b37de537f09f328621255105a`. Haricots blancs contrôlés en production à deux personnes : 8 cl d’eau dans la liste et dans l’étape, boutons 5/10/10 correctement attachés, aucun effacement de données.

## Lot 27 — trente plats et interprétations classiques

[Journal, sources et décisions](recipe-editorial-batch-27.md). 1 corrigée, 29 réservées, aucune conforme sans réécriture. Brochettes à la plancha clarifiées : marinade mesurée, boulgour selon paquet, cuisson simultanée et contrôle du bœuf à cœur. Les matières grasses, volumes de marinade, formats et répartitions non retrouvés restent réservés, sans remplacer les méthodes ni les ingrédients.

**Cumul : 880 identifiants examinés, 315 corrigés, 555 bloqués, 10 conformes sans réécriture, 673 à examiner.** Les 51 accompagnements sont examinés. Zéro erreur éditoriale, 6 555 avertissements, 403 minuteurs et 10 938 calculs d’ingrédients des lots 02–27. Les 24 commandes du workflow passent ; affichage, défilement et mode cuisine contrôlés aux trois formats simulés. Publication à consigner après contrôle HTTPS. Les plats restants suivent.

## Publication du lot 27

`c51225815842c5bc2ef0b232c00c2eff0632e67e` publié sur `main`. Tests `34416575436`, Pages `34416574534` et déploiement `6361251442` réussis. HTTPS 200 et fichiers identiques au commit : index `6a3fc637535e509f4d6ee37f3ec8f8b2209232d22f6dddddc04c85619671cd99`, service worker `ac96f2853d6740d68350125aedbc8f4ef37903d644a4170b6908d8e8f59acaad`. Révision chargée après mise à jour normale `sha256:8e5cf0bac931d241c93b4cb26b3f69705b7b78281a76f8010008f5f78ab5fcd3`. Brochettes vérifiées en production à deux personnes : une cuillère à soupe de chaque liquide, plancha conservée, quatre minuteurs correctement attachés et contrôle à cœur distinct de la coloration. Aucune donnée effacée.

## Lot 28 — trente classiques et plats régionaux

[Journal, sources et décisions](recipe-editorial-batch-28.md). 13 corrigées, 17 réservées, aucune conforme sans réécriture. Répartitions de beurre et gruyère calculées, sept ingrédients déjà demandés dans les étapes rétablis sans dose inventée, cuisson du riz et boulgour selon paquet. Précuissons en peau, meunière, cuisson vapeur et mijotages conservés ; contrôles sanitaires à cœur ajoutés avec références. Aucun partage incertain de sauce ou de matière grasse imposé.

**Cumul : 910 identifiants examinés, 328 corrigés, 572 bloqués, 10 conformes sans réécriture, 643 à examiner.** Zéro erreur éditoriale, 6 431 avertissements, 458 minuteurs et 11 610 calculs d’ingrédients des lots 02–28. Les 24 commandes du workflow passent ; six contrôles visuels du Livre et du mode cuisine aux trois formats simulés, avec défilement et dernière étape accessibles. Publication à consigner après contrôle HTTPS. Les plats restants suivent.

## Publication du lot 28

`10bdae223cf2e5e915e82296ef3844c1aa4ab684` publié sur `main`. Tests `34417729828`, Pages `34417729053` et déploiement `6361431874` réussis. HTTPS 200 et fichiers identiques au commit : index `17d5641d6ac3092aa95435565e0ad323f4bc7f71fe347d904f1d20025bcd12b1`, service worker `1f20fa30c169d160347b4b72af459b409fd077bdc42d4244ba73ae5741e7d6a1`. Révision chargée après actualisation normale `sha256:2e232d7a78bbe4ad415db9e1b790cabace05886f1af1e85a87d848e03e7ec11c`. Endives vérifiées en production à deux personnes : 10 cl d’eau dans la liste et l’étape, béchamel 30 g/30 g/40 cl, quatre minuteurs 20/1/5/20 et étuvage conservé. Aucune donnée effacée.

## Lot 29 — cinquante plats régionaux, familiaux et de bistrot

[Journal, sources et décisions](recipe-editorial-batch-29.md). 10 corrigées, 40 réservées, aucune conforme sans réécriture. Répartitions de beurre et fromage calculées, graisse du confit liée à sa mesure, cuisson des pâtes selon paquet et contrôle de la Morteau selon la source IGP. Un sel demandé dans la source rétabli sans dose inventée. Le basquaise reste réservé : le poids du riz d’accompagnement est absent des archives ; aucun riz ni quantité arbitraire ajouté.

**Cumul : 960 identifiants examinés, 338 corrigés, 612 bloqués, 10 conformes sans réécriture, 593 à examiner.** Zéro erreur éditoriale, 6 224 avertissements, 492 minuteurs et 12 078 calculs d’ingrédients des lots 02–29. Les 24 commandes du workflow passent ; six contrôles visuels du Livre et du mode cuisine aux trois formats simulés, avec dernières étapes accessibles et minuteur dégagé. Publication à consigner après contrôle HTTPS. Les plats restants suivent.

## Publication du lot 29

`943897e1f1326a0b639182ccf3e842c245fe0277` publié sur `main`. Tests `34419142900`, Pages `34419142364` et déploiement `6361652552` réussis. HTTPS 200 et fichiers identiques au commit : index `1e1514f82f5429c4c6aaf9dfcaa4fcaf321f431268fc191969ffbe2b07ca07b7`, service worker `716e2a00afadd70bb3eefa6e61deda505362b19815bd5774ada1eb549846eb79`. Révision chargée après actualisation normale `sha256:c2c08a268bb8223e7e3a9806751aa4a98895af913180833fc760325b2a5c0f5c`. Morteau contrôlée en production à deux personnes : 200 g de cancoillotte, 35–45 minutes dès le frémissement selon calibre et notice, vingt minutes de pommes de terre en parallèle et trois minutes de repos. Aucun effacement de données.

## Lot 30 — trente-quatre plats régionaux et interprétations de chefs

[Journal, sources et décisions](recipe-editorial-batch-30.md). 34 réservées, aucune corrigée ou conforme sans réécriture. Chaque objet culinaire est inchangé ; seuls présentation, titres et réserve précise évoluent. Les sources retrouvées ne justifient pas de transposer le poulet au tilleul en vessie à une cocotte, de prolonger arbitrairement une cuisson éclair ou d’inventer le partage de matières grasses.

**Cumul : 994 identifiants examinés, 338 corrigés, 646 bloqués, 10 conformes sans réécriture, 559 à examiner.** Zéro erreur éditoriale, 6 088 avertissements. Ce lot ajoute 1 848 contrôles d’ingrédients et 204 rendus de réserves, sans compter ces recettes comme culinaires validées. Les 24 commandes du workflow passent ; Livre et mode cuisine vérifiés aux trois formats simulés. Publication à consigner après contrôle HTTPS. Les autres plats suivent.

## Publication du lot 30

`ed25fdb7d3bb945d42b32e6c21669e4fc8766bb6` publié sur `main`. Tests `34419963946`, Pages `34419962959` et déploiement `6361775950` réussis. HTTPS 200 et fichiers identiques au commit : index `616610064eb6874658050c2bdeb0e341d0bfdc0090c7ef9a3926f0f04d16310f`, service worker `b37a261b00b52d46eb82986124d27807f4d9bc61378ec4a95fbb8366cdb73ea9`. Nouvel onglet normal de production chargé sur `sha256:f6a7fd2a83caaa57702959180c2bc0ecadf4e83b4db50b724582d81ef19b3dc4`, sans effacement du stockage. Marmite dieppoise vérifiée à deux personnes : liste adaptée (150 g de chaque poisson, 75 g de crevettes), réserve de la louche et des crevettes visible, préparation d’origine conservée avec partage de beurre explicitement réservé. Aucune validation culinaire de cette fiche n’est revendiquée.

## Lot 31 — trente plats de bistrot, poissons et premiers végétariens

[Journal, sources et décisions](recipe-editorial-batch-31.md). 9 corrigées, 21 réservées, aucune conforme sans réécriture. Beurre réparti en quantités calculées, vin réduit indiqué en volume concret, joues de porc avec minuteur exact de 105 minutes. Saisie, mijotage, panure, beurre noisette et Thermidor au four préservés ; aucun ingrédient ou appareil ajouté.

**Cumul : 1 024 identifiants examinés, 347 corrigés, 667 bloqués, 10 conformes sans réécriture, 529 à examiner.** Zéro erreur éditoriale, 5 969 avertissements ; 524 minuteurs et 12 576 calculs d’ingrédients des lots 02–31. Ce lot ajoute 1 176 rendus des ingrédients réservés et 126 réserves visibles. Les 24 commandes passent ; Livre et mode cuisine contrôlés aux trois formats simulés avec défilement. Publication à consigner après contrôle HTTPS. Les autres plats suivent.

## Publication du lot 31

`851ab09cbed99d8d95d3e38d3d6930a35c63b2ba` publié sur `main`. Tests `34420932447`, Pages `34420931916` et déploiement `6361926334` réussis. HTTPS 200 et fichiers identiques au commit : index `4dc5a549dd3a5126fac311b461c8287f4251a1e692a68ad18f37963dcc988dfd`, service worker `4608fddece17c1c1afb500322f4c9baa58910978fd4e8a84178e568272bb1c17`. Après activation automatique normale de la mise à jour, révision chargée `sha256:d82fc7e62645b344ce74a559073cfc280003d2851cc35b0bb2698d25b12ff1f0`. Truite vérifiée à deux personnes : 40 g de beurre dans la liste et 20 g à chaque usage, 30 g d’amandes, deux minuteurs distincts de 5–6 minutes par face, cuisson entière à la poêle et contrôle à 63 °C. Aucun stockage effacé.

## Lot 32 — trente plats végétariens

[Journal, sources et décisions](recipe-editorial-batch-32.md). 6 corrigées, 24 réservées, aucune conforme sans réécriture. Parts de beaufort et d’huile calculées, temps de paquet préservés, ajouts des feuilles de blettes organisés. Paneer, tofu laqué, gratins et pochage des gnocchi conservent leur technique. Aucune quantité d’huile ou d’eau devinée pour les recettes réservées.

**Cumul : 1 054 identifiants examinés, 353 corrigés, 691 bloqués, 10 conformes sans réécriture, 499 à examiner.** Zéro erreur éditoriale, 5 843 avertissements ; 548 minuteurs et 12 906 contrôles d’ingrédients des lots 02–32. Ce lot ajoute 1 278 rendus d’ingrédients réservés et 144 réserves visibles. Les 24 commandes passent ; Livre et mode cuisine inspectés aux trois formats simulés après défilement. Publication à consigner après contrôle HTTPS. Les autres plats suivent.

## Limites des vérifications

Les tests de structure, quantité, minuteurs, stockage simulé et rendu ne sont pas des essais culinaires. Les formats iPhone/PWA sont simulés, sauf mention explicite d’un appareil physique. Le total de fiches à examiner ne doit jamais être remplacé par le nombre de fiches auxquelles le style commun a été appliqué.
