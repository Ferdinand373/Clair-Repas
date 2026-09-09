# Clair Repas — premier lot de rédaction

Branche : `codex/recipe-clarity-batch-01`, créée depuis le commit officiel `af033fe6b95a48bc286f4ad2aaa84adeddf21cda`.

Statut : **20 recettes relues et révisées après validation du style**, publication autorisée par l’utilisateur via le GitHub Pages existant. Cinq fiches signalent explicitement des lacunes de leur source : elles ne sont pas présentées comme entièrement validées sur le plan culinaire. Les essais décrits ci-dessous sont des contrôles de code et d’interface, pas des essais culinaires réels.

## Analyse du catalogue

La source utilisée par l’application est la bibliothèque assemblée dans `index.html` : plats du midi/soir, entrées, desserts et recettes autonomes. Certaines fiches viennent de tableaux, d’autres de générateurs ou de remplacements ultérieurs par nom. Il faut donc contrôler les objets finaux, pas seulement les premières déclarations du fichier. Les archives historiques et les anciens fichiers d’ajouts ne sont pas les sources à réécrire pour ce lot.

Chaque fiche porte notamment `id` (identifiant durable), `n` (nom), `m` (appareil), `t` (durée affichée), `i` (ingrédients, avec quantité/unité/nom/clé) et `p` (étapes). `servings` vaut explicitement 2 pour les entrées/desserts retenus ; les plats retenus utilisent le défaut existant de 2 portions. Le catalogue public JSON ne contient que les identifiants et noms : il reste identique.

Le diagnostic sur la base initiale trouve 1 553 recettes, dont 442 préparations de moins de 250 caractères, 105 fiches ayant au moins une étape de moins de 25 caractères, et 1 032 fiches comportant au moins une quantité non chiffrée. Ces indicateurs servent au tri, pas de preuve automatique qu’une recette est mauvaise : le sel au goût et une salade simple ne justifient pas nécessairement une longue réécriture.

Problèmes récurrents constatés :

- gestes condensés (« monter », « sabler », « cuire le riz »), sans préparation des ingrédients ;
- absence de feu, préchauffage, récipient, épaisseur ou repère de fin de cuisson ;
- utilisation d’ingrédients non listés, notamment matière grasse et assaisonnement ;
- quantité d’un ingrédient répartie entre plusieurs actions sans préciser la répartition ;
- préparations simultanées non organisées ;
- appareils parfois ambigus, ou ingrédients déjà cuits qu’il ne faut pas recuire par automatisme ;
- minuteurs extraits des nombres présents dans le texte, y compris des écarts par rapport au temps d’un paquet.

## Les 20 recettes

| Appareil conservé | Identifiant | Recette |
| --- | --- | --- |
| Barbecue | n05 | Brochettes de poulet et légumes grillés |
| Barbecue | n97 | Côtelettes d’agneau, semoule aux herbes |
| Plancha | n26 | Poulet citron-herbes, semoule et courgettes |
| Plancha | n78 | Brochettes de bœuf, champignons et semoule |
| Air Fryer | n11 | Poisson blanc citronné et légumes rôtis |
| Air Fryer | e11 | Croque-monsieur et salade verte |
| Air Fryer | e58 | Croques au thon et à la tomate |
| Poêle | n88 | Pâtes au saumon, petits pois et citron |
| Poêle | e03 | Omelette aux champignons et salade |
| Poêle | e63 | Tortilla de pommes de terre au chorizo |
| Poêle | e92 | Chili végétarien au riz |
| Four | n07 | Jambon roulé gratiné et salade |
| Four | e78 | Gratin de pâtes au thon et tomate |
| Four | d028 | Pêches rôties au romarin |
| Four | d044 | Crumble poire et chocolat |
| Casserole | a048 | Velouté de chou-fleur au curry doux |
| Casserole | a088 | Quinoa aux herbes et légumes croquants |
| Casserole | d036 | Compote pomme-rhubarbe |
| Sans cuisson | e30 | Salade de haricots rouges, maïs et thon |
| Sans cuisson | a038 | Gaspacho de concombre à l’aneth |

Les ingrédients, quantités, unités, clés, noms, identifiants, métadonnées de classement et portions de référence restent identiques. Les quantités dans les étapes utilisent des références à la liste existante, calculées par `ingredientTextForRecipe` avec les convives du repas concerné. Le fromage des croques est ainsi réparti en 40 g + 40 g pour deux personnes, 60 g + 60 g pour trois, 100 g + 100 g pour cinq. Le bouillon du velouté affiche 50 cl, 75 cl ou 125 cl respectivement. Aucun nombre global de convives n’a été introduit ; la liste et les étapes se rafraîchissent ensemble.

Trois indications de durée ont été rendues cohérentes avec les étapes : `n11` de 28 à 35 min, `e63` de 25 à 35 min et `a088` de « 25 min » à « 25 min + refroidissement ». La durée initiale de `e78` (25 min) est conservée, sa cuisson restant à confirmer. Les durées restent indicatives pour une fournée ; augmenter les portions peut nécessiter plusieurs fournées. L’allumage d’un barbecue au charbon et les préchauffages variables selon les appareils ne deviennent pas des durées arbitraires.

## Cinq exemples avant / après

Extraits des étapes affichées pour deux personnes ; chaque fiche contient aussi les gestes complémentaires, l’organisation et le service.

### 1. Croque-monsieur et salade verte — e11

Avant : « Monter les croque-monsieur. »

Après : « Former les croques avec deux tranches de pain chacun. Poser les tranches du dessous face beurrée contre le plan de travail. Répartir dessus 40 g de fromage, tout le jambon plié à la taille du pain, puis les 40 g de fromage réservés. Refermer avec les tranches restantes, face beurrée dessus, et presser légèrement. »

Le panier, la couche unique, le retournement, les 7 à 9 minutes à 180 °C et les repères pain doré/fromage fondu sont ensuite précisés. L’appareil reste l’Air Fryer.

### 2. Gratin de pâtes au thon et tomate — e78

Avant : « Cuire les pâtes et poêler la courgette. »

Après : « En parallèle, cuire les pâtes dans la casserole d’eau bouillante 2 minutes de moins que le temps indiqué sur le paquet, car elles finiront au four. Elles doivent rester fermes sans être crues. Égoutter. »

La courgette reste poêlée séparément, sans cuisson dans le coulis. La matière grasse et la température du four ne sont pas documentées : avertissement visible au début de la fiche, sans dose ni température inventées. Le seul bouton est celui du gratin (12 minutes, durée de la source) ; aucun bouton de 2 minutes pour l’écart au paquet.

### 3. Velouté de chou-fleur au curry doux — a048

Avant : « Faire revenir l’oignon avec le curry. »

Après : « Faire revenir l’oignon avec le curry dans une casserole, selon la méthode à confirmer indiquée au début de la fiche. Préparer séparément 50 cl de bouillon, selon les indications de son emballage s’il est reconstitué. Ne pas prélever de bouillon pour remplacer la matière grasse manquante. »

La première proposition avait changé à tort « faire revenir » en cuisson dans du bouillon. Cette substitution est retirée. La source ne précise ni matière grasse ni quantité : avertissement explicite au début de la fiche. Aucun ajout d’huile ou de beurre n’est inventé ; le bouillon entier est ajouté après la cuisson de l’oignon. Le bouton de 4 minutes non documenté est supprimé, celui de 20 minutes est conservé.

### 4. Brochettes de poulet et légumes grillés — n05

Avant : « Couper le poulet et les légumes. »

Après, pour les légumes : « Laver la courgette, le poivron et le citron. Retirer les extrémités de la courgette et la couper en demi-rondelles de 1 cm. Retirer les graines et les membranes du poivron, puis le couper en carrés de 2 cm. Laver, sécher et hacher les herbes. »

Le poulet est préparé à part en cubes de 2 cm. La recette précise ensuite le montage sans tasser, la chaleur du barbecue, les retournements et la vérification à cœur.

### 5. Crumble poire et chocolat — d044

Avant : « Sabler farine, beurre et sucre. »

Après : « Dans un saladier, mélanger toute la farine avec le sucre. Couper tout le beurre froid en petits dés et l’ajouter. Frotter le mélange entre les doigts jusqu’à obtenir de grosses miettes, sans pétrir ni former une boule de pâte. »

Le plat, la découpe des poires, la répartition sans tasser, le four préchauffé et la tendreté des fruits sont précisés dans les autres étapes.

## Minuteurs et protection des quantités

`stepTimerDurations` ignore désormais un nombre suivi de « de moins que » ou « de plus que » : il s’agit d’un écart, pas d’une durée autonome. Les durées absolues, plages et prolongations réelles restent prises en compte. Pour une plage, le comportement existant est conservé : le bouton utilise la borne haute. Le texte donne les repères à contrôler avant cette borne.

Le lot contient 23 boutons, vérifiés étape par étape. Les quatre minuteurs associés aux cuissons de remplacement ou non documentées (velouté, courgette du gratin, poivron du chili et saumon) sont retirés. Pour `n88`, le bouton de 15 minutes est explicitement réservé aux petits pois frais ; les surgelés suivent leur paquet. Il n’y a aucun bouton arbitraire pour le riz, la semoule ou le quinoa dont la durée dépend du produit.

L’interface, les commandes Pause/Reprendre/Réinitialiser/Arrêter, la sauvegarde du minuteur et son placement au-dessus du bandeau ne sont pas modifiés. Les tests existants du minuteur restent passants.

## Vérifications

- Nouveau test `node scripts/validate-recipe-clarity.mjs`, intégré au workflow de validation : 20 fiches, 7 modes, 23 boutons, 654 contrôles d’ingrédients/rendu à 1/2/3/4/5/8 convives ; comparaison protégée du catalogue hors seules étapes/durées autorisées. Contrôles supplémentaires des quantités dans les étapes, du rafraîchissement 2/4/3/2 → 2/5/3/2, des rendements fixes, des références invalides et des cinq avertissements.
- Tests statiques/PWA : 15 groupes passants, dont persistance du minuteur, pause/reprise et alerte.
- Courses V2 : 105/105 ; courses QR4 : 12/12 ; synchronisation simulée : 47 groupes ; outil de réparation : 9 groupes ; dates de planification : passant.
- Catalogue public : 1 553 identifiants/noms inchangés, génération déterministe vérifiée.
- Dans le navigateur local : gratin à 2/3/5 convives (200/300/500 g de pâtes), croques à 5 convives, poisson avec deux minuteurs attachés aux bonnes étapes, crumble à 2 convives et gaspacho à 3 convives.
- Après ajustements : croques à 3 puis 5 convives, avec 60 g + 60 g puis 100 g + 100 g de fromage dans les étapes et 120/200 g dans les ingrédients ; velouté à 3 convives avec 75 cl de bouillon dans les étapes, avertissement visible et seul minuteur de 20 minutes. Contrôles renouvelés en Browser aux formats 390 × 844, 820 × 1180 et 1440 × 900 ; commandes lisibles, bandeau séparé et fin de recette accessible par défilement. Le minuteur suspendu reste suspendu après rechargement.
- Contrôles visuels aux formats 320 × 740, 390 × 844, 820 × 1180 et 1440 × 900. Lecture, défilement, commandes du minuteur et espace en fin de recette contrôlés. Il s’agit de formats simulés, pas de tests sur appareils physiques.

Les outils de contrôle n’accèdent pas aux données personnelles en production. Les interactions de test restent locales. Les empreintes PWA et les références de tests sont actualisées pour le lot ; la publication utilise uniquement le dépôt officiel et son déploiement GitHub Pages existant.

## Relecture culinaire avant publication

L’historique Git (notamment `3fce95d` et `7060659`) et les archives `index-old.html` et `index-avant-chantier.html` conservent tous la même fiche `a048` : chou-fleur 500 g, oignon 1, bouillon 50 cl, curry 0,5 c. à café et lait 5 cl, sans matière grasse. Aucune source culinaire externe n’est rattachée à cette fiche. Une autre soupe avec pomme de terre, crème et œuf existe, mais ce n’est pas la même recette : ses ingrédients ne sont pas transférés au velouté.

| Fiche à vérifier | Lacune conservée et signalée à l’écran |
| --- | --- |
| `a048` Velouté | Matière grasse et quantité pour faire revenir oignon/curry. Pas de substitution par du bouillon. |
| `e92` Chili | Matière grasse et quantité pour faire revenir le poivron. Pas de substitution par du coulis. |
| `e78` Gratin | Matière grasse pour poêler la courgette et température du four absentes. Les 200 °C ajoutés dans la proposition ne sont plus présentés comme établis. |
| `n88` Saumon | Méthode et durée de cuisson à la poêle non documentées. Ordre rétabli : cuire, émietter, puis ajouter la crème. Pas de pochage dans la crème. |
| `a038` Gaspacho | Sel/poivre cités dans la préparation mais absents des ingrédients ; aucun dosage ajouté. Épluchage non imposé par la source. |

Les quinze autres fiches ont été comparées individuellement aux étapes initiales. Appareils, gestes structurants et assaisonnements listés sont conservés. La tortilla mentionne explicitement la coloration des pommes de terre ; le quinoa et la compote refroidissent avant le service conformément à l’original. Pour le poisson citronné, tout le citron est appliqué avant cuisson, comme dans la source, ce qui évite une répartition arbitraire du jus. Les choix de découpe et repères de fin de cuisson explicitent le geste ; ils ne constituent pas des essais culinaires réels.

## Points restant à résoudre

- Le style est validé. Résoudre les cinq lacunes ci-dessus avec une source fiable ou une décision culinaire explicite avant de considérer ces fiches comme entièrement documentées. Poursuivre ensuite les 1 533 autres recettes par lots, sans réécriture automatique.
- Faire des essais culinaires sur les appareils réels, en priorité `n11` (épaisseur du poisson, capacité du panier), `n26`/`n78` (puissance de la plancha), `e63` (épaisseur de la tortilla) et les gratins. Les repères visuels et températures ne remplacent pas cette validation gustative/pratique.
- Les quantités initialement non chiffrées de sel, herbes, épices ou matières grasses ne sont pas transformées en grammages inventés. Les gestes précisent une pellicule, une fine couche ou un ajustement au goût. Une normalisation de leurs doses et des formats de boîtes nécessite une décision culinaire séparée, notamment pour les recettes contenant du thon ou des légumineuses en boîte.
- `a023`, Rillettes de thon au fromage blanc : exclue du lot. Le rôle existant de terrine entraîne un rendement fixe sans `yieldText`, avec un libellé incomplet à l’écran. Il faut confirmer le rendement voulu avant de toucher aux portions. Le poivre non listé et le pain grillé sous « Sans cuisson » restent également à clarifier.
- `n17`, Côte de bœuf, pommes grenailles et salade : poids/épaisseur de la côte et méthode de cuisson des pommes de terre à déterminer avant d’annoncer une durée fiable.
- `e10`, Velouté de légumes et tartines au fromage : « Poêle » ne suffit pas à décrire le récipient du velouté et l’appareil pour griller les tartines ; confirmer le matériel voulu.
- `d069`, Flan vanille maison : préciser moule unique ou ramequins, dimensions et forme de la vanille avant de valider le bain-marie et sa durée.
- Les autres limites de l’extraction de minuteurs (heures, secondes, formulations complexes) ne sont pas refondues dans ce lot.

## Sources des vérifications culinaires

Les étapes ont été rédigées individuellement à partir des recettes existantes, sans reprise d’une recette externe complète.

- Températures à cœur et repos des viandes : [FoodSafety.gov, tableau de températures minimales](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures). Repères retenus : volaille 74 °C ; poisson 63 °C ; pièces entières de bœuf/agneau 63 °C puis repos de 3 minutes.
- Cuissons au barbecue et influence de l’épaisseur : [Weber, tableau des temps de cuisson](https://www.weber.com/BE/fr/tableau-des-temps-de-cuisson/weber-49361.html). Les températures de l’appareil ne sont pas confondues avec les températures à cœur.
- Petits pois frais : [Fondation Louis Bonduelle, fiche petit pois](https://www.fondation-louisbonduelle.org/legume/petit-pois/). Les surgelés utilisent leur propre indication d’emballage.
- Préchauffage propre au modèle : [Philips, préchauffage de l’Airfryer](https://www.usa.philips.com/c-f/XC000005251/do-i-need-to-preheat-my-philips-airfryer). Aucun temps de préchauffage universel n’est imposé aux Air Fryer.
