/* CLAIR REPAS — CHANTIER 4 — RAYON DU LIVRE

1) Ajouter dans BOOK_SHELVES :

{id:'cuisine-bourgeoise-recevoir',icon:'🥂',
 title:'Cuisine bourgeoise & recevoir',
 description:'Les beaux plats de maison, recettes de réception et grands classiques élégants à partager.',
 filter:recipe=>Array.isArray(recipe.collections)&&recipe.collections.includes('cuisine-bourgeoise-recevoir')},

2) Dans bookSubcategories(id), la liste actuelle des collections utilisant
CR_THEME_SUBCATEGORIES contient :
'bistrot-brasserie','cuisine-regionale','famille-dimanche','petits-gourmands'

Ajouter simplement :
'cuisine-bourgeoise-recevoir'

Le chapitre bénéficiera ainsi des sous-rubriques :
- Tout le chapitre
- Entrées
- Plats
- Desserts

Aucune recette n'est déplacée ni supprimée : il s'agit d'une nouvelle collection éditoriale.
