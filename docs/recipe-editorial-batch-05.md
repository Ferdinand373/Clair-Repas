# Lot éditorial 05 — lacunes des premières variantes générées

Base : `e0651372daaedcd762c5e6fdfa61ae25a7d3c260`. Le 9 septembre 2026, **30 nouveaux identifiants examinés, 0 corrigé, 0 conforme sans modification, 30 bloqués**. Ce lot publie uniquement des réserves documentées et leur présentation : **aucune préparation ni aucun ingrédient ne sont réécrits**.

Cumul : **140 identifiants examinés, 59 corrigés, 81 bloqués, 1 413 à examiner**. Les 1 553 recettes restent présentes. Prochaine fiche dans l'ordre du registre : `gn-boulettes-tomate-basilic`.

## Recherche des sources

Chaque objet final a été lu avec son nom, son appareil, tous ses ingrédients et toutes ses étapes. La première déclaration de `n100` et les sources `lunchProteins`, `lunchProfiles`, `generatedNoon`, `CURATION_ACCENTS`, `CURATION_EXPERIENCE_BY_ACCENT` et `curateGeneratedRecipe` ont été examinées. L'archive `index-avant-chantier.html` contient les mêmes profils.

Le problème ne provient pas de l'affichage actuel : certains profils remplacent le texte de cuisson de la protéine par sa seule durée numérique et perdent sa température. La première cuisson des légumes n'a elle-même aucune température. Retrouver 180, 185 ou 190 °C dans la table d'une protéine ne démontre pas la température de toute la cuisson mixte. La curation ajoute ensuite des gestes de sauce ou de poêle avant la cuisson restante, parfois incompatibles avec l'appareil indiqué. Aucune température uniforme ni transposition d'appareil n'est donc appliquée.

Autres lacunes lues individuellement : ingrédients absents des listes, même quantité demandée plusieurs fois, ail dit rôti sans cuisson, chimichurri employé avant sa préparation. Les sources présentes ne permettent pas de trancher ces intentions ; les références culinaires externes ne sont pas utilisées pour remplacer arbitrairement les variantes de Clair Repas. Les textes et les minuteurs historiques sont conservés mais **ne sont pas déclarés validés culinairement**.

## Décisions individuelles

| ID | Réserve exacte |
| --- | --- |
| n100 | La matière grasse pour dorer les médaillons, l’oignon et le poivron est absente ; la crème ajoutée ensuite ne remplace pas la saisie. |
| gn-poulet-citron-herbes | L’infusion citron/estragon précède la grillade dans le texte. Le rôle du citron frais et du citron confit, l’assaisonnement et la cuisson de la courgette sont à préciser. |
| gn-dinde-citron-herbes | La sauce moutarde est annoncée avant la grillade. Le jus à recueillir sur la plancha, l’assaisonnement et la conduite de la courgette ne sont pas définis. |
| gn-filet-mignon-citron-herbes | La crème au poivre est réduite deux fois dans le texte, avant la grillade puis pendant trois minutes. Récipient de sauce, répartition et cuisson de la courgette manquent. |
| gn-saumon-citron-herbes | Le citron intervient dans les sucs puis avec la courgette sans répartition. Le persil apparaît dans deux ingrédients ; le jus et la cuisson de la courgette sur plancha sont à définir. |
| gn-poisson-blanc-citron-herbes | La plancha est dite huilée mais l’huile manque dans la liste. Citron et pesto sont employés à plusieurs moments sans répartition, et l’ordre de la finition est ambigu. |
| gn-crevettes-citron-herbes | La cuisson est dite douce puis en saisie, sans conduite de plancha définie. Le citron est répété pour crevettes, courgette et service sans répartition ; assaisonnement non listé. |
| gn-poulet-paprika-grenailles | La température de départ des grenailles a disparu du profil généré. Torréfaction du paprika à feu moyen et panier Air Fryer se mélangent ; paprika fumé et amandes sont ajoutés plusieurs fois. |
| gn-dinde-paprika-grenailles | La température des grenailles manque. La variante demande une compotée et du jus de tomate avec seulement des tomates séchées ; olives ajoutées deux fois et méthode incompatible non résolue. |
| gn-cotes-porc-paprika-grenailles | Température initiale des grenailles absente ; saisie et arrosage au jus ne sont pas organisés dans l’Air Fryer. L’ail cru de la liste devient rôti sans étape de cuisson. |
| gn-saumon-paprika-grenailles | Température des grenailles absente ; mijotage de tomate puis panier Air Fryer non organisés. Le basilic demandé dans le nom et les étapes manque dans la liste. |
| gn-poisson-blanc-paprika-grenailles | Le même poivron et le paprika sont utilisés au départ puis ajoutés grillés sans répartition. Température Air Fryer absente et articulation des deux minutes couvertes et trois minutes finales inconnue. |
| gn-saucisses-paprika-grenailles | La température des grenailles manque. Échalote et balsamique sont cuits/déglacés deux fois sans répartition ni récipient compatible ; type des saucisses inconnu. |
| gn-boulettes-paprika-grenailles | Température Air Fryer absente. Chimichurri employé avant d’être préparé, vinaigre non listé et répartition marinade/service manquante ; ne pas servir une marinade ayant touché de la viande crue. |
| gn-falafels-paprika-grenailles | La température des grenailles n’est pas donnée ; le profil individuel des falafels ne renseigne pas cette première cuisson. Type des falafels et dilution de la sauce tahini/citron restent à préciser. |
| gn-pois-chiches-paprika-grenailles | La température initiale des grenailles manque et le rinçage/séchage des pois chiches a disparu de la préparation générée. Le profil de pois chiches à 190 °C ne suffit pas à établir toute la cuisson mixte. |
| gn-poulet-moutarde-champignons | Matière grasse pour échalote, champignons et poulet absente. Infusion citron/estragon placée avant la saisie, puis finition avant ajout de crème ; ordre à confirmer. |
| gn-dinde-moutarde-champignons | Matière grasse de l’échalote, des champignons et de la dinde absente. Deux moutardes distinctes sont listées mais les étapes ne les distinguent pas ; sauce avant cuisson de la viande. |
| gn-filet-mignon-moutarde-champignons | Matière grasse des cuissons initiales absente. La seule quantité de crème est réduite puis ajoutée de nouveau avec la moutarde ; aucune répartition n’est fournie. |
| gn-cotes-porc-moutarde-champignons | Matière grasse de l’échalote, des champignons et du porc absente. L’ail listé cru doit être écrasé rôti, sans instruction de cuisson ; les herbes sont ajoutées plusieurs fois. |
| gn-saumon-moutarde-champignons | Matière grasse des légumes et du saumon absente. Le pesto citronné est annoncé hors du feu puis suivi d’un réchauffage à la crème ; citron pour sauce et quartier de service non réparti. |
| gn-poisson-blanc-moutarde-champignons | Matière grasse des cuissons initiales absente. Citron et aneth sont ajoutés avant la crème puis de nouveau au service sans répartition ; geste de finition à confirmer. |
| gn-boulettes-moutarde-champignons | Matière grasse initiale absente. Le cidre est employé pour deux déglaçages, et la moutarde ajoutée deux fois sans répartition ; état cru/cuit des boulettes inconnu. |
| gn-poulet-tomate-basilic | Courgette, ail, tomate et poulet à saisir sans matière grasse. Olives à compoter puis à ajouter dans les trois dernières minutes : chronologie contradictoire. |
| gn-dinde-tomate-basilic | Matière grasse des légumes et de la dinde absente. Pesto et basilic sont ajoutés avant la cuisson, après celle-ci puis encore au service, sans répartition claire. |
| gn-filet-mignon-tomate-basilic | Matière grasse de la saisie absente. L’unique gousse d’ail est revenue avec les légumes puis demandée rôtie dans le jus, sans répartition ni étape de rôtissage. |
| gn-boeuf-tomate-basilic | Matière grasse de la courgette, de l’ail et du bœuf absente. Échalote et balsamique sont cuits/déglacés deux fois sans répartition ni organisation des poêles. |
| gn-saumon-tomate-basilic | Matière grasse des légumes et du poisson absente. Tomates cerises et tomates entières sont listées séparément mais les étapes ne les distinguent pas ; olives mijotées avant leur ajout. |
| gn-poisson-blanc-tomate-basilic | Matière grasse de la courgette, de l’ail et du poisson absente. Le même geste est demandé à feu vif puis moyen ; citron partagé entre pesto et quartier de service sans répartition. |
| gn-crevettes-tomate-basilic | La matière grasse des légumes et des crevettes manque. Le trait de citron pour détendre les sucs n’est pas dans la liste, et persil/câpres sont ajoutés avant puis au service sans organisation. |

## Portée et vérifications

Tous les objets culinaires du catalogue sont identiques à la base, y compris les 30 examinés. Seules les introductions descriptives, les titres qui indiquent les actions à préciser et les réserves visibles sont ajoutés à la présentation commune. Les temps restent expressément annoncés et non vérifiés. Aucun recalcul, identifiant, portion, appareil, favori, programme, course ou donnée personnelle n'est modifié.

Le test des lots protège les 30 objets entiers par leurs empreintes originales. Il couvre désormais 125 enregistrements de revue des lots 02/03/04/05 ; les 68 attentes de minuteurs et 1 668 contrôles de quantités précédemment validés restent inchangés. Le premier lot garde ses 660 contrôles. Le rendu commun couvre 7 765 combinaisons et le registre reste sans erreur bloquante, avec 9 475 avertissements éditoriaux.

Les contrôles existants de l'application et de ses données sont réexécutés avant publication. Les inspections visuelles sont des simulations de formats, pas des essais sur iPhone physique. Aucun essai culinaire n'a été réalisé. Ce lot de réserves ne doit jamais être compté comme 30 recettes corrigées.

