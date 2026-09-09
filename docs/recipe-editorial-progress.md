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

## Limites des vérifications

Les tests de structure, quantité, minuteurs, stockage simulé et rendu ne sont pas des essais culinaires. Les formats iPhone/PWA sont simulés, sauf mention explicite d’un appareil physique. Le total de fiches à examiner ne doit jamais être remplacé par le nombre de fiches auxquelles le style commun a été appliqué.
