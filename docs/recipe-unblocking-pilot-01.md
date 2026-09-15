# Pilote de déblocage 01 — douze candidates, puis arrêt

Date : 15 septembre 2026. Dépôt : Ferdinand373/Clair-Repas.
Base : `da6ceeae6ab3d3ea0460c0cf017e4765358351f5`.
Branche de travail : `codex/unblocking-pilot-01`.

## Périmètre et résultat

Douze fiches `blocked`, retenues parmi les candidates de potentiel B dont le produit, l'état ou le calibre nécessite une vérification, dans l'ordre stable du registre. Les identifiants et réserves ont été annoncés avant modification. Les cas dont une autre lacune essentielle dominait ont été écartés avant cette sélection, sans les traiter.

**1 débloquée (`e06`), 11 toujours bloquées ; 0 recherche culinaire externe.** Le potentiel B n'était pas une promesse de résolution. Aucun produit commercial précis n'a été identifié dans les onze dossiers restants : une recherche générale ou une recette ressemblante ne serait pas une preuve.

| Identifiant | Résultat et information manquante après vérification interne | Effort |
| --- | --- | --- |
| `n33` | Bloquée : état cru, surgelé ou déjà cuit des petits pois non indiqué ; « réchauffer » ne le prouve pas. | Moyen |
| `n86` | Bloquée : nature exacte des ravioles et préparation initiale des épinards non établies. | Moyen |
| `v31n-bowl-quinoa-courge-saumon` | Bloquée : emploi de l'huile, forme du citron, tailles du poisson/légumes et charge du panier non précisés. | Moyen |
| `v39-quiche-lorraine` | Bloquée : dimensions/nombre de moules compatibles avec les portions, épaisseur et validation de cuisson non établis. | Moyen |
| `v39-paella` | Bloquée : état des petits pois, riz adapté, dimensions du poulet, tri/cuisson des moules et utilisation des assaisonnements restent à préciser. | Moyen |
| `theme-bistrot-brasserie-07` | Bloquée : épaisseur de la bavette et contrôle du degré de cuisson non établis ; minute supplémentaire par face conditionnelle. | Moyen |
| `theme-bistrot-plus-18` | Bloquée : état des petits pois, taille des carottes/navets et temps de coloration par fournée inconnus. | Moyen |
| `bistrot-ext-17` | Bloquée : composition/calibre des paupiettes et durée de coloration des champignons non précisés ; leur ajout dans les dix dernières minutes ne résout pas ces lacunes. | Moyen |
| `veg-l1-15` | Bloquée : état des petits pois, dimensions des pommes de terre/carottes/navets et emploi des assaisonnements non établis. | Moyen |
| `bourgeois-23` | Bloquée : queues d'écrevisses proposées en alternative sans état cuit explicite ; articulation des trois dernières minutes avec la réduction et calibre/cuisson du poulet incertains. | Moyen |
| `e05` | Bloquée : forme/taille des courgettes et charge/conduite du panier inconnues. La recette Moulinex déjà citée dans le journal 34 utilise un autre temps et une autre température : elle ne valide pas cette fiche. | Moyen |
| `e06` | **Corrigée** : les pommes de terre étaient explicitement déjà cuites dans la source du même identifiant. | Élevé |

Effort global : **élevé** au regard du rendement (1/12, soit 8,3 %), en raison de l'exploration historique. Les appréciations ci-dessus sont qualitatives, pas des temps chronométrés.

## Vérification des sources internes

Comparaison des objets finaux et de leurs réserves avec `index-old.html`, `index-avant-chantier.html`, les journaux 02, 04, 27, 28, 29, 31, 32 et 34, et les versions historiques du même catalogue. Lorsque présentes, les douze fiches de `89c0331:index (4).html` ont les mêmes données culinaires que la base du pilote. Les occurrences pertinentes aux jalons `7060659`, `3ffad05`, `149cb5d`, `5cc0f50` et `624c0ae` n'apportent pas les précisions manquantes.

Les livraisons d'origine ont également été comparées : `bistrot_40_recettes.json`/`.js` pour `bistrot-ext-17`, `vegetarien_60_recettes_complet.json`/`.js` pour `veg-l1-15`, `36_nouvelles_recettes.json`/`CHANTIER_4_RECETTES.js` pour `bourgeois-23`. Elles ne lèvent pas leurs réserves. Les recherches portent sur les identifiants et titres correspondants ; aucune donnée d'une recette voisine n'est transférée.

### Preuve décisive pour e06

[Source historique exacte : index.html, commit c456cee99249ce1545fe479598b6facb766a5fb4, ligne 163](https://github.com/Ferdinand373/Clair-Repas/blob/c456cee99249ce1545fe479598b6facb766a5fb4/index.html#L163) :

```js
I(400,'g','pommes de terre cuites')
```

Même identifiant `e06`, même intitulé « Saumon fumé, concombre et pommes de terre », même mode `Sans cuisson`, même quantité et mêmes trois étapes d'origine. Au jalon `82e19c7:index.html:161`, l'adjectif « cuites » a disparu du libellé alors que les autres données correspondantes restent identiques. La preuve est issue de l'historique Git local, pas d'une recherche Internet.

La correction rétablit **400 g de pommes de terre cuites pour les deux portions de référence**. La première étape utilise le jeton existant `{{qty:2}}` : 200, 400, 600, 800, 1 000 ou 1 600 g pour 1, 2, 3, 4, 5 ou 8 personnes. Aucune quantité crue équivalente n'est inventée. Aucun temps de cuisson, refroidissement, ingrédient ou appareil n'est ajouté.

La préparation est séparée en quatre gestes : couper les pommes de terre déjà cuites ; laver/couper le concombre ; mélanger la sauce existante ; assembler avec le saumon fumé. L'aneth et le citron restent l'assaisonnement d'origine sans grammage inventé ni choix imposé entre jus et zeste. Les 15 minutes restent indicatives, avec des pommes de terre déjà cuites disponibles.

## Protection des données et contrôles de fin de pilote

Seules deux entrées de `index.html` changent : l'objet culinaire de `e06` et ses métadonnées de lecture. La clé de courses `pommes de terre`, les quantités, les portions de référence, l'identifiant, le mode et les classements restent inchangés. Les onze autres candidates et les 1 552 autres fiches, métadonnées et enregistrements éditoriaux sont protégés par empreintes de la base. Aucun moteur de portions, minuteur, courses, programme, favoris, notes ou sauvegarde n'est modifié. La branche parallèle `shopping-v2-engine-test` n'est pas touchée.

Contrôles exécutés après traitement des douze candidates :

- `validate-recipe-unblocking-pilot.mjs` : succès ; preuve historique, transitions de statuts, 1 552 voisins inchangés, 30 rendus d'ingrédients, quantités de courses identiques avant/après, zéro minuteur dans les quatre étapes. Le contrôle des courses tient compte de la conversion d'affichage en kg à partir de 1 000 g et vérifie aussi la quantité de base en grammes.
- Cas par créneau `2/4/3/2` puis `2/5/3/2` : seul le rendu du deuxième repas change.
- `validate-recipe-batches.mjs` : succès, incluant le pilote, les 674 minuteurs historiques et 16 242 contrôles d'ingrédients ; les empreintes historiques du lot 43 sont conservées et leur unique supersession est documentée.
- `validate-recipe-editorial.mjs` : zéro erreur ; 3 912 avertissements existants sur le catalogue ne sont pas des validations culinaires.
- `validate-static-app.mjs` : 15 groupes réussis, dont PWA, positionnement et transitions/restauration/alerte du minuteur.
- `validate-shopping-v2.mjs` : 105/105 ; moteur inchangé, seule l'empreinte attendue de la page est actualisée.
- `generate-public-recipe-catalog.mjs --check` : succès ; export public des 1 553 identifiants/noms inchangé.
- `git diff --check` : succès.
- Vérification visuelle locale ciblée de `e06`, à 1 248 × 720 : trois personnes, 600 g de pommes de terre cuites, étapes lisibles, dernière étape accessible au-dessus de la navigation, aucun bouton de minuteur inapproprié. Pas de campagne Browser, d'appareil physique ni d'essai culinaire.

Les empreintes PWA de `index.html` et de `sw.js` sont actualisées via le mécanisme existant pour distribuer cette correction. Le nouveau contrôle est appelé par la suite de lots déjà exécutée dans le workflow ; aucun nouveau système de déploiement.

## État de sortie et arrêt

**1 553 examinées ; 428 corrigées ; 11 conformes ; 1 114 bloquées ; 0 pending.** Dernier lot principal : **43**. Dernière intervention : **pilote 01**.

Ce journal fait partie du commit local préparé pour publier le pilote. **Publication bloquée** : la connexion GitHub renvoie HTTP 403, `Resource not accessible by integration`, dès la création du premier blob. Le Git local ne dispose pas du transport `remote-https`. Aucun changement n'a été poussé et aucun déploiement de ce pilote n'a été déclenché. Une nouvelle lecture de `refs/heads/main` confirme la base `da6ceeae6ab3d3ea0460c0cf017e4765358351f5` inchangée. Les totaux ci-dessus décrivent donc le travail local validé ; la production reste à 427 corrigées et 1 115 bloquées.

Pour reprendre uniquement la publication : rétablir un accès d'écriture autorisé au dépôt officiel, vérifier que `main` n'a pas avancé, publier le commit de cette branche sans écraser de travaux concurrents, puis attendre les contrôles GitHub/Pages et comparer les fichiers servis en HTTPS au commit. Le SHA local exact figure dans le bilan remis à l'utilisateur et dans `git log -1`. Aucun succès de déploiement n'est anticipé.

Recommandation : **CONTINUER MAIS avec une autre sous-famille**, limitée aux mentions explicites perdues dans les anciennes révisions de libellés. Ce pilote ne justifie pas une recherche fabricant large sur des produits non identifiés. Une preuve historique ne dispense jamais de lever toutes les réserves restantes.

**STOP : aucune treizième recette, aucun nouveau lot ni automatisation. Reprise uniquement sur nouvelle instruction.**
