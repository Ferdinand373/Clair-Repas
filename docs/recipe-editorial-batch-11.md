# Lot 11 — trente variantes de plats relues

Base : `06a98d80d2f492317b93b8ccdff83ddb6a85172e`. **0 corrigée, 0 conforme sans modification, 30 bloquées**. Quatre variantes champignons/polenta, six grillades au maïs, dix plats haricots/riz et dix ratatouilles/semoule. Chaque objet final a été relu, puis comparé aux profils `lunchProfiles`, aux cuissons de protéines et aux ajouts `CURATION_ACCENTS` / `CURATION_EXPERIENCE_BY_ACCENT` dans `index.html`.

## Origine des réserves

Le profil polenta ne donne ni liquide ni matière grasse du sauté ; il utilise seulement « un peu » de crème sans préciser le reste. Le profil barbecue ne décrit pas la grillade des légumes. Les ajouts de sauce peuvent demander des sucs avant la grillade, sans récipient ou collecte du jus. Le profil haricots/riz demande une échalote revenue sans matière grasse. La ratatouille ne détaille ni conduite de départ ni assaisonnement final. La composition automatique des phrases produit des répétitions et des étapes hors ordre ; ce lot ne modifie pas le générateur global, les recettes ni leurs quantités pour résoudre ces incertitudes par supposition.

Références complémentaires consultées le 9 septembre 2026 :

- [Tipiak — polenta onctueuse](https://www.tipiak.fr/produit/polenta-onctueuse) distingue dosage liquide, produit et durée. Son mode lait/eau ne permet pas de retrouver le liquide historique des 140 g de polenta de Clair Repas. Aucune quantité de lait, eau ou parmesan n’est transposée.
- [Weber — côtelettes de porc, sauce marsala et cèpes](https://www.weber.com/CA/fr/recettes/pork/c%C3%B4telettes-de-porc/weber-7689.html) sépare explicitement la sauce en casserole de la grillade. Cette technique différente ne permet pas de retrouver les sucs et le récipient implicites des grillades de Clair Repas. Aucun beurre, marsala ou appareil supplémentaire n’est transposé.
- [USDA — grillades et sécurité alimentaire](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/grilling-and-food-safety) : la sauce destinée au service doit être séparée avant contact avec la viande crue, ou traitée de façon sûre. La réserve de `gn-boeuf-ratatouille` précise de ne pas servir crue la sauce ayant touché la viande crue ; aucune fraction arbitraire de chimichurri n’est introduite.

Ces références ne sont pas présentées comme les sources originales des variantes. Les références historiques ne résolvent pas les lacunes décrites ci-dessous. Les 1 553 objets culinaires sont tous conservés à l’identique par rapport à la base de ce lot. Seules les métadonnées de lecture et les avertissements des trente fiches changent.

## Relecture individuelle

| ID | Statut | Réserve |
| --- | --- | --- |
| gn-cotes-porc-champignons-polenta | Bloquée | le liquide de la polenta et la matière grasse du sauté échalote/champignons ne sont pas définis. L’ail est listé cru mais demandé rôti sans cuisson décrite ; seule une partie non mesurée de la crème est utilisée. |
| gn-boeuf-champignons-polenta | Bloquée | l’échalote et le balsamique sont cuits puis demandés de nouveau sans répartition des quantités. Liquide de polenta, matière grasse du sauté et quantité de crème réellement utilisée ne sont pas définis. |
| gn-boulettes-champignons-polenta | Bloquée | le poivron doit griller sans feu ni durée définis ; les deux minutes sous couvercle ne sont pas une durée de grillade. Liquide de polenta, matière grasse des champignons et part de crème manquent. |
| gn-pois-chiches-champignons-polenta | Bloquée | le pesto est incorporé hors du feu avant puis après la cuisson des pois chiches. Les noix sont demandées à deux moments sans partage ; liquide de polenta, matière grasse des champignons et part de crème manquent. |
| gn-poulet-grillade-mais | Bloquée | l’estragon doit infuser hors du feu avant la grillade du poulet. Le maïs et les grenailles n’ont ni durée ni zone de barbecue définie ; citron et huile/herbes sont employés sans répartition précise. |
| gn-dinde-grillade-mais | Bloquée | la sauce à la moutarde utilise des sucs avant la grillade et réclame ensuite une cuillerée de jus sans collecte ni récipient définis au barbecue. La cuisson du maïs et des grenailles reste non minutée. |
| gn-filet-mignon-grillade-mais | Bloquée | la crème est réduite avant la grillade puis ajoutée à nouveau sans partage des 10 cl. La collecte des sucs et le récipient au barbecue ne sont pas définis ; maïs et grenailles n’ont pas de durée de grillade. |
| gn-cotes-porc-grillade-mais | Bloquée | l’ail rôti n’a pas de cuisson décrite et le jus pour arroser n’a pas de mode de collecte au barbecue. La cuisson du maïs et des grenailles, ainsi que l’emploi de l’huile et des herbes, restent à définir. |
| gn-saumon-grillade-mais | Bloquée | le citron est ajouté à la cuisson, en finition, aux légumes puis au dressage sans répartition. La feuille de cuisson n’est pas définie compatible avec le barbecue ; la grillade du maïs et des grenailles manque de réglage et de durée. |
| gn-saucisses-grillade-mais | Bloquée | le poivron est grillé sans durée ni intensité, puis couvert deux minutes : cette attente ne remplace pas son temps de grillade. La cuisson du maïs et des grenailles et la répartition huile/herbes restent imprécises. |
| gn-poulet-haricots-riz | Bloquée | l’échalote doit revenir sans matière grasse listée. L’infusion hors du feu précède la cuisson du poulet et le citron est réemployé sans partage ; la cuisson des haricots n’est pas définie. |
| gn-dinde-haricots-riz | Bloquée | le sauté de l’échalote n’a pas de matière grasse listée. La moutarde est montée dans les sucs avant la cuisson puis redemandée avec une cuillerée de jus ; ordre et partage restent à confirmer, ainsi que les haricots. |
| gn-filet-mignon-haricots-riz | Bloquée | échalote et balsamique sont employés à plusieurs cuissons sans répartition. La matière grasse du sauté initial manque et la cuisson des haricots n’est pas définie ; ne pas attribuer une portion arbitraire au déglaçage. |
| gn-cotes-porc-haricots-riz | Bloquée | les 8 cl de cidre servent à deux déglaçages sans partage. L’ordre braisage puis cuisson par face est ambigu ; matière grasse pour l’échalote et conduite des haricots ne sont pas définies. |
| gn-boeuf-haricots-riz | Bloquée | la crème et le poivre sont réduits avant la saisie du bœuf puis ajoutés une seconde fois, sans partage. Matière grasse de l’échalote et conduite des haricots manquent ; ne pas doubler les 10 cl de crème. |
| gn-saumon-haricots-riz | Bloquée | le pesto citronné est ajouté hors du feu avant la cuisson détaillée puis de nouveau après. Citron demandé aussi aux légumes et en quartier, sans partage ; matière grasse du sauté et cuisson des haricots manquent. |
| gn-poisson-blanc-haricots-riz | Bloquée | le citron est demandé à plusieurs moments sans partage entre jus, légumes et dressage. Matière grasse pour faire revenir l’échalote et conduite de cuisson des haricots ne sont pas définies. |
| gn-crevettes-haricots-riz | Bloquée | l’échalote doit revenir sans matière grasse listée. Le citron et le persil sont employés à plusieurs reprises sans répartition ; l’état cru ou cuit des crevettes et la cuisson des haricots restent à confirmer. |
| gn-boulettes-haricots-riz | Bloquée | l’ail est listé cru mais ajouté rôti sans cuisson prévue. La matière grasse du sauté de l’échalote et la cuisson des haricots ne sont pas définies ; le poids total des boulettes ne précise pas leur taille. |
| gn-pois-chiches-haricots-riz | Bloquée | l’origan demandé est absent des ingrédients. Les pois chiches doivent être dorés après le début du mijotage de la sauce ; ordre de cuisson, matière grasse de l’échalote et haricots restent à préciser. |
| gn-poulet-ratatouille | Bloquée | olives et tomates doivent compoter puis être ajoutées de nouveau sans répartition. L’état des tomates séchées et la matière grasse de saisie du poulet ne sont pas définis ; l’assaisonnement final n’est pas listé. |
| gn-dinde-ratatouille | Bloquée | le jus d’orange est réduit avant la dinde puis utilisé pour un second déglaçage sans partage. La matière grasse de cuisson et l’assaisonnement final ne figurent pas dans la liste ; ne pas ajouter une autre orange. |
| gn-filet-mignon-ratatouille | Bloquée | l’ail rôti est demandé sans cuisson décrite alors que les gousses sont listées crues. Matière grasse de saisie et assaisonnement final ne sont pas définis ; ne pas remplacer l’ail rôti par de l’ail cru. |
| gn-cotes-porc-ratatouille | Bloquée | le poivron doit griller sans intensité ni durée définies, puis étuver deux minutes. Matière grasse des côtes et assaisonnement de la ratatouille ne sont pas listés ; les deux minutes ne valent pas pour la grillade. |
| gn-boeuf-ratatouille | Bloquée | huile et vinaigre du chimichurri sont absents de la liste et non dosés. La sauce est utilisée pour mariner avant sa préparation, puis au service sans part propre réservée. Ne pas servir crue une sauce ayant touché la viande crue. |
| gn-saumon-ratatouille | Bloquée | le citron utilisé pour détendre les sucs est absent de la liste et sans dose. La matière grasse de cuisson et l’assaisonnement final ne sont pas définis ; ne pas supprimer le citron pour masquer l’omission. |
| gn-poisson-blanc-ratatouille | Bloquée | le citron est ajouté à plusieurs moments sans partage entre cuisson, finition et dressage. La matière grasse de cuisson et l’assaisonnement de la ratatouille ne sont pas définis. |
| gn-crevettes-ratatouille | Bloquée | le basilic annoncé au titre et au service manque aux ingrédients. Tomates et olives sont demandées à plusieurs cuissons sans partage ; l’état des crevettes, la matière grasse et l’assaisonnement restent à préciser. |
| gn-saucisses-ratatouille | Bloquée | échalote et balsamique sont cuits puis redemandés après les saucisses sans partage de la quantité listée. La conduite de la ratatouille et son assaisonnement restent imprécis ; ne pas doubler la sauce. |
| gn-boulettes-ratatouille | Bloquée | l’origan demandé manque aux ingrédients. La sauce tomate et les olives mijotent avant les boulettes puis sont ajoutées de nouveau sans partage ; matière grasse de coloration et assaisonnement restent à préciser. |

## Exemples représentatifs

- `gn-cotes-porc-champignons-polenta` : l’ail demandé rôti n’a pas de cuisson décrite et le liquide de polenta est absent. Ces deux omissions restent visibles, sans ajouter four, lait ou huile.
- `gn-filet-mignon-grillade-mais` : les 10 cl de crème sont demandés avant puis après la grillade. La sauce n’est ni doublée ni séparée en fractions inventées.
- `gn-crevettes-ratatouille` : le basilic figure dans le titre et la finition, mais pas dans les ingrédients. La recette n’est pas déclarée entièrement validée.

## Contrôles et reprise

Les 30 empreintes bloquées restent égales à leur source. Les 106 minuteurs et 3 738 contrôles d’ingrédients des lots 02–10 restent vérifiés, ainsi que les 660 du premier lot. Aucune nouvelle cuisson n’est validée dans ce lot. Les 24 commandes du workflow passent : syntaxe, catalogue public, 15 groupes statiques/PWA, 7 765 rendus, quantités, indépendance des repas, courses 105/105, QR4 12/12, dates, synchronisation 47 groupes et réparation 9 groupes simulées. Browser à 390 × 844 : réserve chimichurri visible avant les ingrédients. À 820 × 1180 : fin de recette accessible, minuteur de repos de 5 minutes suspendu, boutons de 44 px et écart de 12 px au bandeau. À 1440 × 900 : titre long et réserve polenta lisibles, pas de débordement horizontal. Quantités à trois personnes cohérentes. Aucun essai culinaire réel ni appareil physique.

**Cumul : 320 identifiants examinés, 140 corrigés, 180 bloqués, 1 233 à examiner.** Zéro erreur éditoriale et 8 773 avertissements. Prochaine fiche globale : `gn-pois-chiches-ratatouille` ; prochaine entrée : `a063` ; prochain dessert : `d064`.
