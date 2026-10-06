# Automne gourmand — test de dix recettes

Build produit : **Clair Repas 7.5 · 2026.10.06.1-automne-gourmand**. Socle Foundation.15 et schéma personnel 2 conservés. Base Git : `1ffdbf1a7abdbe06ae94d94490da0c5dd02c4098`.

La sélection utilise `collections: ['automne-gourmand']`, ajoutée aux collections déjà présentes. Elle s’ouvre depuis l’accueil et figure dans le Livre, avec dix cartes contenant titre, accroche, durée indicative, portions de référence, appareil et badge Automne. Les fiches et le Mode Cuisine utilisent les objets du catalogue, les métadonnées `RECIPE_EDITORIAL`, les calculs de portions et les minuteurs existants.

## Recettes améliorées, identifiants conservés

| Identifiant | Ancien titre | Titre du test |
| --- | --- | --- |
| v31n-orzo-boulettes | Poulet rôti traditionnel, pommes de terre | Poulet rôti, pommes de terre fondantes et thym |
| n64 | Saucisses aux lentilles express | Saucisses dorées aux lentilles mijotées |
| a042 | Velouté de courge et châtaignes | Velouté de potimarron et châtaignes |
| v39-boeuf-bourguignon | Bœuf bourguignon | Bœuf bourguignon facile |
| v39-gratin-chou-fleur | Gratin de chou-fleur classique | Gratin de chou-fleur à la béchamel |
| v39-hachis-parmentier | Hachis Parmentier classique | Parmentier de bœuf maison |
| d081 | Tarte fine aux pommes | Tarte fine aux pommes, cannelle et sucre roux |
| e03 | Omelette aux champignons et salade | Omelette forestière aux champignons |
| v39-roti-porc | Rôti de porc traditionnel | Rôti de porc, carottes et oignons confits |

Nouvelle fiche `automne-quiche-poireaux` : **Quiche poireaux, lardons et comté**, avec pâte brisée. Les proches existantes sont une quiche Lorraine sans poireaux, une quiche poireaux/bleu/noix végétarienne, et une quiche poireaux/jambon sans pâte : elles restent distinctes et inchangées. Aucune suppression. Catalogue final : **1 554 recettes**, dont **1 544 objets hors sélection identiques à la base**.

Les ingrédients des dix fiches ont des quantités explicites. Les étapes indiquent découpe, ordre d’ajout, feu, températures, durée, contrôle de cuisson et service. Les quantités incorporées au texte utilisent les références `{{qty:index}}` existantes et suivent les portions de la fiche. Les doses de sel et poivre sont séparées. Les temps sont indicatifs ; calibre, nombre de fournées et contrôle à cœur sont précisés quand ils modifient la cuisson.

## Vignettes

**0 octet d’images livré.** La page principale augmente de **27 931 octets** (environ 27 Ko, moins de 1 %). Aucune photographie téléchargée ou générée pour l’application. Les dix cartes restent complètes sans emplacement vide. Un champ facultatif `thumbnail` accepte uniquement `assets/recipes/automne/*.webp` ; taille affichée 80 × 80 px, 64 × 64 px sur petit écran, chargement paresseux et décodage asynchrone. Une erreur d’image masque la vignette.

L’emplacement et le budget sont documentés dans `assets/recipes/automne/README.md` : WebP 160 × 160 px, cible au plus 20 Ko par fichier. Le service worker a une liste facultative `AUTUMN_THUMBNAILS`, actuellement vide : les futures images déclarées seront mises en cache à leur première consultation, puis disponibles hors ligne. Aucune image du catalogue général n’est préchargée. Le cache atomique, ses empreintes et le retour à la version saine sont conservés.

## Vérifications

- `validate-automne-gourmand.mjs` : exactement dix fiches mises en avant, neuf identifiants conservés, une nouvelle quiche distincte, autres recettes et métadonnées inchangées, revue individuelle complète ; 60 rendus à 1/2/3/4/5/8 personnes ; quantités dans les ingrédients et les étapes ; attentes manuelles des minuteurs ; cartes avec/sans chemin WebP et rejet des chemins externes ou invalides.
- `validate-cooking-mode.mjs` : 3 108 rendus à 2/5 personnes, convives indépendants par repas, navigation, toutes les étapes, minuteur existant et Wake Lock simulé. Empreinte du moteur de minuteur inchangée.
- `validate-recipe-presentation.mjs` : 7 770 rendus de fiches. Les tests des anciens lots vérifient leur source historique, reconstruite en retirant uniquement le bloc Automne ; le nouveau validateur protège séparément les neuf remplacements autorisés et les 1 544 autres fiches. Les références historiques et `sourceHash` restent conservés.
- Courses V2 : 105/105 ; catalogue réel à 2 et 4 personnes, 6 216 contrats ; QR4 : 12/12. Les compteurs de catalogue et de sel/poivre composé sont actualisés explicitement. Aucun changement du moteur ou du transport Clair Courses.
- PWA/statique/minuteur : 15 groupes ; synchronisation simulée : 47 groupes ; réparation : 9 groupes ; dates civiles/Paris et changements d’heure ; catalogue public généré et vérifié ; premier lot et lots suivants ; revue éditoriale : zéro erreur. Les réserves hors sélection restent présentes.
- Navigateur Edge/Chromium isolé : ouverture depuis le nouveau raccourci d’accueil ; ouverture des dix cartes réelles, ingrédients et étapes titrées, retour à la liste ; changement de convives ; Mode Cuisine ; lancement, pause, reprise, réinitialisation et arrêt du minuteur ; sortie du mode sans perte du minuteur.
- Largeurs 320, 390, 820 et 1 440 px : aucune extension horizontale du document. Contrôle visuel des captures de cartes et du Mode Cuisine. Test à largeur iPhone, sans appareil iOS physique ni PWA iOS installée.
- WebP synthétique de contrôle, uniquement dans le serveur de test : affichage paresseux, conservation en cache à la première consultation et affichage hors ligne ; fichier manquant masqué, texte conservé. Ce fichier n’est pas livré.
- Rechargement sans réseau : dix cartes, fiche et Mode Cuisine accessibles ; préférences et programme local du navigateur de test inchangés par le rechargement. Aucune erreur JavaScript de page.
- `git diff --check` et syntaxe des scripts réussis.

## Fichiers concernés

`index.html`, `sw.js`, `v8/version.json`, `clair-repas-catalog.v1.json`, `assets/recipes/automne/README.md`, `docs/recipe-editorial-inventory.json`, `docs/recipe-editorial-progress.md`, ce journal, `scripts/automne-gourmand.fixture.json`, `scripts/validate-automne-gourmand.mjs`, `scripts/validate-cooking-mode.mjs`, `scripts/validate-recipe-clarity.mjs`, `scripts/validate-recipe-batches.mjs`, `scripts/validate-recipe-unblocking-pilot.mjs`, `scripts/validate-shopping-v2.mjs`, `scripts/validate-shopping-qr4.mjs`, `scripts/validate-static-app.mjs` et `.github/workflows/static-pwa.yml`.

## Données personnelles et publication

Aucune écriture, suppression, migration ou remise à zéro des données de l’utilisateur. Les essais utilisent des environnements isolés et des synchronisations simulées. Les moteurs de planification, courses, stockage et synchronisation ne sont pas modifiés.

Publication autorisée par la demande : contrôles locaux puis mise à jour sans force du `main` officiel et vérification des workflows et de GitHub Pages. Le commit et le résultat du déploiement sont indiqués dans le bilan de livraison.
