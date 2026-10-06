# Vignettes Automne gourmand

Les dix premières photos originales ont été générées avec l’outil intégré imagegen le 6 octobre 2026, après lecture des recettes validées du commit 9ac9225. Aucune photographie provenant d’Internet. Les originaux PNG restent hors du dépôt.

## Optimisation et affichage

WebP RGB, 160 × 160 px, réduction Lanczos, qualité 85, méthode 6. Vignettes affichées à 80 × 80 px (64 × 64 px sur mobile), object-fit: cover, dimensions réservées, loading="lazy" et decoding="async". Une photo absente est masquée ; le titre, les informations et l’ouverture de recette restent disponibles.

| Fichier | Octets | Sujet / consigne individuelle |
|---|---:|---|
| v31n-orzo-boulettes.webp | 9670 | Cuisses de poulet, pommes de terre en quartiers, ail et thym séché au jus. |
| n64.webp | 9508 | Saucisses de porc, lentilles, rondelles de carotte, oignon et thym séché. |
| a042.webp | 5618 | Velouté lisse de potimarron et châtaignes, oignon, beurre et crème, sans garniture ajoutée. |
| automne-quiche-poireaux.webp | 10546 | Quiche à la pâte brisée, poireaux, lardons, œufs, crème et comté gratiné. |
| v39-boeuf-bourguignon.webp | 9010 | Bœuf en cubes, lardons, carottes, champignons et oignon dans une sauce au vin rouge ; bouquet garni retiré. |
| v39-gratin-chou-fleur.webp | 9464 | Bouquets de chou-fleur sous une béchamel au lait, beurre et muscade, avec comté doré. |
| v39-hachis-parmentier.webp | 9336 | Bœuf haché et oignon sous une purée striée au lait et beurre, comté gratiné ; portion ouverte montrant les couches. |
| d081.webp | 9718 | Tarte fine de pâte feuilletée, lamelles de pommes pelées, sucre roux, cannelle et beurre ; aucun accompagnement. |
| e03.webp | 8214 | Omelette pliée aux champignons de Paris, échalote et persil, cuite au beurre. |
| v39-roti-porc.webp | 9300 | Rôti de porc tranché, carottes en bâtonnets, quartiers d’oignon confits, ail, thym séché et jus. |

Total : **90384 octets**, soit **90.384 Ko** (Ko décimaux).

## Direction commune des prompts

Photographie culinaire originale carrée et réaliste. Gros plan à environ 45 degrés, lumière naturelle douce et chaude, couleurs naturelles peu saturées, vaisselle crème simple sur bois clair, cuisine familiale traditionnelle, textures gourmandes, plat centré immédiatement identifiable. Peu d’accessoires, aucun texte, filigrane ou ingrédient important absent de la fiche. Les consignes individuelles figurent dans le tableau.

## Cache hors ligne

Les quarante chemins exacts sont déclarés dans AUTUMN_THUMBNAILS et associés aux seuls identifiants existants dans index.html. Le service worker conserve chaque WebP après sa première consultation. Une vignette jamais consultée nécessite donc une première connexion. Aucun préchargement des photos du catalogue ni ajout au noyau atomique CORE_FILES. Le noyau et le nouveau build ont leurs empreintes d’intégrité actualisées. Aucune migration ou modification de données personnelles.

## Extension saisonnière — 30 photos supplémentaires

Outil intégré imagegen, même direction familiale et chaude. Consignes individuelles complètes dans [prompts-2026-10-06.json](prompts-2026-10-06.json). PNG sources hors dépôt ; optimisation identique aux dix premières photos.

| Fichier | Octets |
|---|---:|
| theme-cuisine-regionale-07.webp | 9742 |
| theme-cuisine-regionale-08.webp | 10062 |
| bourgeois-15.webp | 9632 |
| bistrot-ext-26.webp | 9576 |
| bistrot-ext-24.webp | 9200 |
| theme-bistrot-plus-12.webp | 10046 |
| theme-famille-dimanche-09.webp | 9458 |
| q407.webp | 9824 |
| v31n-orzo-poisson-blanc.webp | 9652 |
| v31n-orzo-tofu.webp | 9826 |
| veg-l1-08.webp | 9528 |
| veg-l1-17.webp | 10044 |
| q405.webp | 8958 |
| n61.webp | 9450 |
| n99.webp | 9988 |
| theme-famille-dimanche-02.webp | 5462 |
| theme-petits-gourmands-01.webp | 6648 |
| theme-bistrot-brasserie-05.webp | 9164 |
| a051.webp | 6332 |
| a052.webp | 7466 |
| v31e-pita-chaude-filet-mignon.webp | 9250 |
| a028.webp | 9218 |
| a065.webp | 10558 |
| q409.webp | 10258 |
| v75-chef-constant-05.webp | 11418 |
| veg-l1-09.webp | 9928 |
| veg-l1-20.webp | 10712 |
| a084.webp | 11334 |
| gn-poisson-blanc-poireaux-creme.webp | 9386 |
| q408.webp | 10020 |

Ajout : **282140 octets**. Total des 40 photos : **372524 octets**. Les dix premières images n’ont pas été remplacées.
