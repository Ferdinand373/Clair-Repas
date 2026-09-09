# Contribuer à Clair Repas

La source active est le catalogue assemblé dans `index.html`, et non les copies historiques `index-old.html` / `index-avant-chantier.html` ni les fichiers d’ajouts archivés.

Toute création ou modification de recette doit suivre le [standard éditorial](docs/recipe-editorial-standard.md) et son [modèle](docs/recipe-template.md). Lire le [suivi du catalogue](docs/recipe-editorial-progress.md) avant de choisir les fiches à travailler.

Conserver les identifiants, le nombre de portions de référence et les données personnelles. Ne pas recopier un ancien catalogue sur le catalogue actif. Ne pas transformer une cuisson ou inventer une quantité pour satisfaire un test.

Avant publication : validations du workflow `.github/workflows/static-pwa.yml`, revue individuelle du contenu, contrôles Browser de lecture et de quantités. Séparer commits de présentation et lots éditoriaux (50 fiches au maximum), puis vérifier le déploiement GitHub Pages et la version HTTPS. Les tests ne prouvent pas la justesse culinaire.

Les nouveaux identifiants ne bénéficient pas de la tolérance historique : une revue et les métadonnées du standard sont obligatoires. Ne pas modifier `baselineIds` ni les `sourceHash` historiques pour contourner une erreur de validation.
