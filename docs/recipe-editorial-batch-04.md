# Lot éditorial 04 — 30 fiches de n65 à n99

Base : `c87dc373c29cae1d6edb9c2ac6191004c69ba52a`. Relecture individuelle du 9 septembre 2026 : **8 corrigées, 22 bloquées, 0 conformes sans modification**. Les identifiants déjà relus dans le lot initial sont exclus.

Cumul : **110 identifiants examinés, 59 corrigés, 51 bloqués, 1 443 à examiner**, sur 1 553 recettes. Prochaine fiche : `n100`.

## Sources et décisions

Les 30 objets finaux ont été lus avant rédaction. Les déclarations de `index-avant-chantier.html` ont été comparées pour les lacunes des fiches historiques. Le mécanisme `curateGeneratedRecipe`, sa liste `legacyRecipesToCurate` et le remplacement `legacyTunaPatties` ont été lus : ce sont les sources effectives des variantes et des galettes, et non les premières déclarations portant les mêmes identifiants.

- `n82` : la source publiée à la base demande explicitement une **poêle légèrement huilée**, mais omet l'huile dans `i`. L'huile est rétablie avec `q:null`, sans dose arbitraire. La méthode des galettes et leur garniture de pommes de terre/poivrons restent celles du remplacement publié, pas l'ancienne recette au riz. Une cuisson à petite ébullition et une découpe régulière explicitent la préparation des pommes de terre à écraser ; les 18 minutes sont celles de la source, avec contrôle de tendreté.
- `n68`, `n69`, `n70`, `n85`, `n96` : la curation historique insère des gestes de finition avant le reste de la préparation et répète certains ingrédients. Aucun réagencement culinaire non confirmé n'est publié. Les objets restent identiques, avec un avertissement précis.
- [FoodSafety.gov — températures internes](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures), consulté le 9 septembre 2026 : contrôles du porc, des viandes hachées, des plats aux œufs, du poulet et du poisson. Ce sont des repères de contrôle ajoutés, pas une preuve de durée exacte ou un essai culinaire.
- [Larousse — Kefta’cos](https://www.editions-larousse.fr/recette/keftacos/) et [Weber — Wrap de bœuf sauce Baharat](https://www.weber.com/FR/fr/recettes/b%C5%93uf/wrap-de-b%C5%93uf-sauce-baharat/weber-2050913.html) : comparaison pour `n95`. Larousse emploie une plancha huilée ; Weber cuit ses keftas sur la grille, la plancha servant à la sauce. Ces recettes différentes ne justifient ni l'ajout silencieux d'huile ni une transposition du mode de cuisson. La fiche reste bloquée.

Une recherche Philips sur le pain de viande à l'Air Fryer n'a pas fourni de fiche complète exploitable. La plage de `n76` reste donc celle de Clair Repas, 30–35 minutes à 180 °C, présentée comme indicative et subordonnée au contrôle à cœur. Ni huile, ni œuf de panure, ni température supplémentaire ne sont inventés. Les tailles de découpe sont des indications fixes, pas des grandeurs multipliées par le nombre de personnes.

## Relectures par identifiant

| ID | Statut | Point principal |
| --- | --- | --- |
| n65 | Bloquée | Légumes sur plancha avant les saucisses, sans conduite ni matière grasse définies. |
| n66 | Bloquée | Précuisson des pommes de terre non définie ; coloration seule des merguez insuffisante. |
| n67 | Bloquée | Courgette poêlée sans matière grasse ; la crème ajoutée ensuite ne la remplace pas. |
| n68 | Bloquée | Compotée et saisie dans un ordre contradictoire ; olives ajoutées deux fois. |
| n69 | Bloquée | Pesto/citron répétés avant et après mijotage ; échalote et persil à préciser. |
| n70 | Bloquée | Infusion et finition avant la saisie/crème ; matière grasse et persil à préciser. |
| n71 | Bloquée | Filet et échalote à dorer sans matière grasse listée. |
| n72 | Bloquée | Crème incomplètement répartie ; cuisson du saumon non détaillée. |
| n73 | Bloquée | Assaisonnement du poisson non listé et cuisson non définie. |
| n74 | Corrigée | Poids déjà cuits conservés, lavage/essorage et assemblage de la salade explicités. |
| n75 | Bloquée | Préparation des pommes de terre absente. |
| n76 | Corrigée | Mélange, pain régulier et cuisson Air Fryer explicites ; capacité et cuisson à cœur contrôlées. |
| n77 | Bloquée | Mode des carottes et conduite de cuisson du magret absents. |
| n79 | Bloquée | Matière grasse du poisson pané et cuisson des pommes de terre manquantes. |
| n80 | Corrigée | Enrobage léger sans liant ajouté, coulis au fond du plat, four conservé, spaghetti au paquet. |
| n81 | Corrigée | Deux phases 18 puis 5 min à 185 °C, garniture tardive, contrôle et repos du porc. |
| n82 | Corrigée | Huile déjà mentionnée rétablie, salade en parallèle, 4 min pour chaque face séparées. |
| n83 | Bloquée | Viande et oignon à faire revenir sans conduite ni matière grasse. |
| n84 | Corrigée | Barquettes de courgette, farce avec toute la crème et le fromage, herbes utilisées, semoule au paquet. |
| n85 | Bloquée | Pesto ajouté trois fois dans un ordre ambigu et type de gnocchis absent. |
| n86 | Bloquée | Cuisson initiale des épinards et type de ravioles à préciser. |
| n90 | Bloquée | Saisie sans matière grasse et verre d'eau de volume inconnu. |
| n91 | Bloquée | Matière grasse de la saisie absente ; soja ajouté seulement ensuite. |
| n92 | Bloquée | Cuisson initiale et finale insuffisamment définies, persil oublié. |
| n93 | Bloquée | Matière grasse des légumes revenus absente. |
| n94 | Bloquée | Conduite et matière grasse de la saisie absentes. |
| n95 | Bloquée | Sel/poivre non listés, menthe non utilisée, conduite de plancha non définie. |
| n96 | Bloquée | Double déglaçage sans répartition du cidre, type et cuisson des saucisses inconnus. |
| n98 | Corrigée | Plat unique au four conservé, pesto dynamique, contrôle séparé du poulet et des pommes de terre. |
| n99 | Corrigée | Pommes de terre d'abord, poisson ensuite ; citron au service et plage de cuisson explicite. |

## Vérifications

- 12 minuteurs du lot vérifiés par attentes manuelles : dont 18 min et deux fois 4 min pour `n82`, 18/5/3 pour `n81`, 15 puis plage 10–12 pour `n99`. Le libellé des pommes de terre de `n82` a été corrigé après détection de l'absence de bouton. Les plages affichent leur repère supérieur ; pâtes/semoule au paquet sans faux compte à rebours.
- 306 nouveaux contrôles d'ingrédients à 1/2/3/4/5/8 personnes, soit 1 668 pour les lots 02/03/04 ; 660 pour le premier lot. Indépendance des repas 2/4/3/2 puis 2/5/3/2 protégée par les tests existants.
- 7 765 rendus communs. Aucun changement des identifiants, portions, appareils ou classements. Seule exception d'ingrédient : huile de `n82` retrouvée explicitement dans la source. Les 22 objets culinaires bloqués et les 1 523 objets non sélectionnés sont conservés.
- Inspection Browser : galettes longues à 390 × 844 et 820 × 1180 avec minuteur en pause, dernière étape accessible et commandes de 44 px, écart de 12 px au bandeau ; salade courte à 1440 × 900 avec 300 g de pâtes cuites et 450 g de poulet cuit pour 3 personnes. Aucun débordement horizontal observé.
- Contrôles statiques/PWA/minuteur, courses, dates, synchronisation simulée, réparation et catalogue public existants exécutés. Zéro erreur éditoriale bloquante ; 9 595 avertissements restent dans l'ensemble du catalogue.

Ces validations sont éditoriales et informatiques. Elles ne constituent pas des essais culinaires, des mesures sur iPhone physique ou une nouvelle validation matérielle du Wake Lock. Le code de ces fonctions et les données personnelles ne sont pas modifiés.
