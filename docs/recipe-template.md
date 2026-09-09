# Modèle compatible avec Clair Repas

Ce modèle n’ajoute aucune recette automatiquement. Les valeurs entre chevrons sont à remplacer après vérification, jamais à publier telles quelles.

```js
// Source active : tableau, constructeur ou crUpsert… existant dans index.html.
{
  id: '<identifiant-stable>', n: '<nom>', m: '<appareil initial>',
  t: '<temps écoulé indicatif>', servings: 2,
  // Conserver aussi toutes les métadonnées de classement existantes.
  i: [I(80, 'g', 'fromage')],
  p: [
    'Répartir {{qty:0}} de fromage…',
    '<cuisson et service vérifiés>'
  ]
}

// Métadonnées de lecture, dans RECIPE_EDITORIAL (même index.html).
'<identifiant-stable>': {
  intro: '<une phrase propre au plat>',
  titles: ['<action précise>', '<cuisson et service>'],
  times: {
    prep: '<estimation expliquée ou null>',
    cook: '<durée vérifiée ou indication du paquet>',
    rest: null,
    total: '<temps écoulé indicatif, pas somme des tâches parallèles>'
  },
  // Facultatifs : groups: [{title:'Sauce',ingredients:[0]}],
  // optionalIngredients: [0], tip: '<un seul conseil fiable>',
  // reviewNote: '<incertitude essentielle, si blocked>'
}
```

`p` reste un tableau de textes, `i` conserve ses clés et unités. L’ordre des titres doit correspondre à celui des étapes. Les métadonnées sont facultatives pour les anciennes fiches, obligatoires pour valider les nouvelles. Ne pas réutiliser le champ historique `editorial`, déjà employé comme étiquette de collection.

Ajouter la revue individuelle au registre et au journal du lot ; lancer `node scripts/validate-recipe-editorial.mjs` et les autres contrôles de contribution. Ne pas marquer `corrected` tant qu’une information essentielle manque.

Pour une nouvelle fiche, ajouter une entrée du registre avec `id`, `name`, `status` (`corrected`, `unchanged` ou `blocked` selon la revue), `reviewedHash` calculé avec `recipeHash` sur l'objet final, `batch` et `issues`. `blocked` exige un motif visible dans `reviewNote`. Ne pas ajouter le nouvel identifiant dans `baselineIds` : cette liste et les `sourceHash` des fiches historiques sont immuables. Un nouvel identifiant laissé `pending` est une erreur bloquante.
