# Standard éditorial des recettes

Ce standard s’applique aux ajouts et aux fiches modifiées. Il décrit une qualité de lecture et de précision, sans badge commercial. Le catalogue historique reste compatible, mais une fiche non relue ne devient pas validée automatiquement.

## Source active et parcours d’ajout

- Le catalogue actif est assemblé dans `index.html` : tableaux `noon`/`evening`, constructeurs `A`/`D`, recettes autonomes, générateurs de variantes et remplacements `crUpsertDish`/`crUpsertCourse` par nom. Contrôler l’objet final : une déclaration peut être remplacée plus loin.
- Les fichiers `CHANTIER_*`, `AJOUT_*`, `*_recettes*.js` et leurs JSON sont des livraisons historiques. Ils ne sont pas chargés par la page. Ne pas en déduire qu’une modification y change la production ; reporter uniquement les fiches revues dans la source active.
- Il n’existe pas d’éditeur ni d’import de recettes utilisateur. L’import/export de sauvegarde transporte les préférences, identifiants et programmes personnels : ce n’est pas une porte d’ajout au catalogue et il doit rester inchangé.
- `scripts/generate-public-recipe-catalog.mjs` exporte seulement les identifiants/noms du catalogue assemblé pour la compatibilité entre applications. Il ne crée pas de recettes.
- Chaque nouveau résultat d’un générateur doit être examiné individuellement. Une variante héritée ne bénéficie pas automatiquement de la validation de sa recette mère.

## Rubriques

1. **Introduction** : une ou deux phrases propres au plat, sur ses ingrédients, sa texture ou son assemblage. Ni superlatif systématique ni histoire ou bénéfice nutritionnel inventé.
2. **Essentiel** : convives du repas, appareil conservé, temps de préparation, cuisson, repos et total écoulé. Un temps approximatif reste annoncé comme indicatif ; un temps inconnu reste inconnu. Ne pas additionner les tâches simultanées pour calculer le total.
3. **Ingrédients** : quantité de référence, unité, nom et clé compatibles avec les courses. Un groupement principal/sauce/accompagnement est facultatif et doit couvrir chaque ingrédient une seule fois. Signaler les ingrédients réellement facultatifs ; ne pas transformer en option un ingrédient oublié.
4. **Préparation** : étapes numérotées, titre court et spécifique, gestes dans l’ordre réel. Séparer les actions lorsque cela améliore la lecture, pas pour allonger la fiche.
5. **Finition/service** : terminer et assembler explicitement, généralement dans la dernière étape. Aucun panneau à ouvrir en mode cuisine.
6. **Conseil** : au maximum un conseil utile et vérifié. Pas de rubrique vide, de variante, de conservation ou de réchauffage ajoutés pour remplir.

## Gestes et fidélité culinaire

Laver/éplucher/parer seulement quand nécessaire ; préciser la découpe utile et sa taille indicative. Décrire le récipient, le préchauffage, le feu ou la température, le couvercle, les retournements et l’égouttage. Associer cuisson et repos à un résultat observable. Expliquer dans la phrase « sabler », « nacrer », « déglacer », etc.

Utiliser « Pendant cette cuisson… » pour les préparations simultanées. Ne pas demander de commencer une cuisson avant que les ingrédients soient prêts. Prévoir les fournées supplémentaires uniquement lorsque la capacité le justifie.

Préserver appareil, technique, portions de référence et identité du plat. Faire revenir n’est pas cuire dans du bouillon. Un four n’est pas un airfryer. La couleur seule n’est pas une garantie de cuisson sûre pour les aliments sensibles : employer un repère vérifié adapté à l’aliment. Consulter une source fiable si nécessaire, sans inventer température, poids ou durée.

## Quantités liées aux ingrédients

Les champs historiques `i` et `p` restent compatibles. Les quantités répétées dans les étapes utilisent `{{qty:INDEX}}` ou `{{qty:INDEX:PART}}`, où INDEX est l’indice **à partir de zéro** de l’ingrédient et PART une proportion entre 0 et 1. Exemple : `Répartir {{qty:2:0.5}} de fromage… puis les {{qty:2:0.5}} réservés.`

Le rendu appelle le mécanisme existant `ingredientTextForRecipe` avec les convives du créneau. Ne jamais figer « 40 g » dans une étape qui doit s’adapter, ni utiliser une valeur globale. Les parts doivent couvrir la quantité prévue sans doublon. Une quantité non chiffrée ne peut pas être convertie en dose inventée ; employer un geste mesurable ou conserver la réserve.

Ne pas multiplier les températures, les durées, les tailles de découpe ni les dimensions de moule avec les portions. Préserver les rendements fixes. Si un dosage fixé à la cuillère vient d’une source, le lier également à la liste.

## Minuteurs

Un bouton correspond à une action et une durée réelle, pas à tout nombre suivi de « minutes ». Les différences avec le paquet ne sont pas des durées : `2 minutes de moins que le paquet` n’a pas de bouton de 2 minutes.

Pour les pâtes, riz et produits variables, suivre leur paquet lorsque c’est pertinent. Ne pas inventer un temps commun. Une plage doit rester affichée comme une plage ; si le bouton utilise une borne, annoncer clairement le repère choisi. Une durée conditionnelle doit préciser sa condition. Les heures/secondes ou formulations non prises en charge restent sans bouton, jamais transformées en minutes arbitraires.

Préserver Pause/Reprendre, Réinitialiser sans redémarrage, Arrêter, persistance et alerte unique. Préserver la séparation minuteur/navigation, la zone de sécurité iPhone/PWA et l’accès à la fin de recette.

## Sources et incertitudes

Chercher d’abord la fiche initiale et les archives. Une recette ressemblante trouvée sur internet ne prouve pas l’intention de l’auteur de la fiche. Une adaptation doit être identifiée comme telle dans le suivi, avec référence et justification ; ne pas la présenter comme une information retrouvée.

Rédiger un texte original, ne pas recopier la source. Référencer précisément URL/titre ou commit/fichier dans le journal du lot. Consigner toute correction substantielle (ingrédient manquant, ordre, cuisson, quantité).

Une incertitude essentielle donne un statut `blocked` et un motif précis à l’écran et dans l’inventaire. Garder le texte et les ingrédients sûrs ; exclure de la publication toute adaptation culinaire incertaine. Ne pas qualifier de validée une fiche qui reste bloquée. Une estimation de préparation n’est pas une mesure réalisée en cuisine.

## Contrôles et suivi

Le registre couvre tous les identifiants : `pending` (à examiner), `unchanged` (conforme sans changement du texte), `corrected`, `blocked`. Les lots comptent 30 à 50 fiches maximum. La présentation commune est indépendante de la validation individuelle.

Erreurs bloquantes : identifiant dupliqué/invalide, quantité non numérique ou négative, étape vide, référence d’ingrédient invalide, groupes incomplets/dupliqués, titres incompatibles avec les étapes, référence dynamique vers une quantité inconnue, modification non consignée, statut validé avec incertitude essentielle déclarée.

Avertissements à relire : quantité non chiffrée, durée/feu non détaillés, terme technique non expliqué, ingrédient possiblement oublié, source absente ou durée de paquet ambiguë. Les heuristiques ne prouvent ni présence/absence culinaire ni qualité du goût. Ne pas remplir des champs génériques pour faire disparaître un avertissement.

Vérifier à plusieurs nombres de personnes, dont 2/4/3/2 puis 2/5/3/2, et avec un rendement fixe. Contrôler recettes courtes/longues, minuteurs, recherche, filtres et courses. Distinguer les simulations de téléphone des essais sur appareil physique, et les tests informatiques des essais culinaires.

## Exemples

- À éviter : « Cuire les légumes. » À préciser selon la recette : « Faire revenir les dés de courgette dans l’huile, en remuant, jusqu’à ce qu’ils soient tendres et légèrement dorés. » Le feu et la durée doivent venir de la fiche vérifiée.
- À éviter : « Ajouter un dixième du bouillon. » Préférer une quantité liée à un ingrédient réellement réparti, affichée en cl/ml par le calcul existant. Ne pas inventer cette répartition.
- À éviter : « Sabler puis enfourner. » Préférer : « Frotter farine, sucre et beurre froid entre les doigts pour obtenir des miettes, sans pétrir. » Puis décrire séparément la cuisson vérifiée.
- À éviter : « Un plat exceptionnel et détox. » Préférer : « Les poires cuisent sous des miettes de pâte, avec des morceaux de chocolat. »
