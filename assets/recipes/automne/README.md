# Vignettes Automne gourmand

Les dix photos originales ont été générées avec l’outil intégré imagegen le 6 octobre 2026, après lecture des recettes validées du commit 9ac9225. Aucune photographie provenant d’Internet. Les originaux PNG restent hors du dépôt.

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

Les dix chemins exacts sont déclarés dans AUTUMN_THUMBNAILS et associés aux seuls identifiants existants dans index.html. Le service worker conserve chaque WebP après sa première consultation. Une vignette jamais consultée nécessite donc une première connexion. Aucun préchargement des photos du catalogue ni ajout au noyau atomique CORE_FILES. Le noyau et le nouveau build ont leurs empreintes d’intégrité actualisées. Aucune migration ou modification de données personnelles.
