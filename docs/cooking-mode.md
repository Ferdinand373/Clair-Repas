# Mode Cuisine — première version

Travail du 3 octobre 2026 sur `codex/cooking-mode`, à partir de `8ae7927dc0f188a07d49d234569cf80e951d65e5` (dépôt Ferdinand373/Clair-Repas). Pas de publication demandée pour cette intervention.

## Utilisation

Ouvrir une recette depuis un repas du programme ou depuis le Livre, puis **Mode Cuisine**. La vue affiche son titre, le nombre de personnes du contexte d'ouverture, les informations de cuisson disponibles et les réserves éditoriales existantes. Les ingrédients se déplient ; les quantités utilisent les fonctions et portions de référence actuelles, y compris les rendements fixes.

**Précédente** et **Suivante** permettent de lire les étapes dans l'ordre. **Voir toutes les étapes** affiche la préparation entière, puis permet de revenir à la même étape. Une recette à une seule étape n'affiche pas de navigation inutile. Les champs absents ne sont pas complétés artificiellement.

Les températures restent celles du texte et des informations de cuisson d'origine. Aucun traitement du catalogue ni aucune nouvelle recette.

Les propositions **Lancer le minuteur** réutilisent les durées en minutes reconnues par CR et appellent directement `startKitchenTimer`. Les plages gardent leur libellé explicite, par exemple « 8–10 min · repère à 10 min ». Les durées relatives au paquet ne créent pas un faux minuteur. Par prudence, une durée composée en heures/secondes n'est pas réduite à son seul fragment en minutes : le texte reste affiché, sans nouveau bouton automatique pour ces formats. Aucun second moteur de minuteur.

Pause/Reprendre, Réinitialiser et Arrêter restent les commandes existantes. Quitter le mode ne les arrête pas. Après rechargement, la vue cuisine se ferme, mais le minuteur conserve sa restauration existante ; aucun état de lecture supplémentaire n'est sauvegardé.

## Écran et Wake Lock

Texte des étapes de 22 px, boutons de 48 px minimum, contraste élevé, contenu centré sur grand écran. La vue réserve en bas la hauteur mesurée du minuteur et du bandeau, avec la zone de sécurité de l'appareil. Aucun positionnement fondé sur une hauteur supposée du bandeau.

L'ancien libellé « Mode cuisine · écran maintenu allumé », qui n'ouvrait aucun mode dédié, est remplacé par cette activation explicite. Le maintien de l'écran est désormais demandé pendant le Mode Cuisine visible et relâché à sa sortie ou lors du masquage de la page. Une nouvelle demande est faite au retour au premier plan. L'interface n'annonce un écran maintenu allumé qu'après obtention effective du verrou. Une API absente, refusée ou un verrou relâché par le système n'empêche pas de lire la recette.

Les demandes simultanées sont regroupées et les réponses arrivant après la fermeture sont libérées, sans écraser un verrou plus récent. Aucune boucle de tentatives en cas de refus système. Références : [Screen Wake Lock API, W3C](https://www.w3.org/TR/screen-wake-lock/) et [gestion de visibilité et libération, MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

## Vérifications

- Nouveau `scripts/validate-cooking-mode.mjs` : 3 106 rendus du Mode Cuisine à 2 et 5 personnes ; étapes, réserves, vue complète, une/aucune étape, quantité manquante, rendement fixe, sortie clavier et navigation.
- Convives par créneau : `2/4/3/2` puis `2/5/3/2`, sans propagation. Le mode ne modifie ni la préférence générale ni le programme.
- Wake Lock simulé : API absente, refus, requêtes concurrentes, perte/retour de visibilité, pagehide/pageshow, libération système, sortie et réponses tardives.
- Empreintes inchangées des 1 553 recettes, métadonnées éditoriales, registre éditorial et bloc entier du moteur du minuteur ; aucune nouvelle clé de stockage, sauvegarde ou requête réseau dans le mode.
- Tests existants réussis : 15 groupes statiques/PWA/minuteur, 105 tests de courses, 47 groupes de synchronisation simulée, 9 groupes de réparation, QR4 12/12, dates, catalogue public, premier lot, lots suivants et 7 765 rendus classiques de recettes.
- Audit éditorial : zéro erreur, 3 912 avertissements préexistants ; totaux inchangés (428 corrigées, 11 conformes, 1 114 bloquées, 0 pending).
- Browser local : 390 × 844, 820 × 1180 et 1440 × 900, plus contrôle étroit à 320 × 568. Aucun débordement horizontal ; boutons du minuteur de 48 px en mode cuisine ; intervalle minuteur/bandeau de 12 px ; commandes de dernière étape accessibles après défilement.
- Ouverture réelle depuis le programme à 2 personnes et depuis le Livre à 3 personnes ; ingrédients et étapes correctement adaptés. Vue complète et retour à l'étape courante vérifiés.
- Pause/reprise, remise à zéro sans départ, restauration du minuteur suspendu après rechargement, arrêt et fin d'un minuteur de test de 2 secondes vérifiés par l'interface locale. L'alerte unique et sa précision sont aussi couvertes par les tests existants.
- Zone de sécurité de 34 px et bandeau agrandi simulés via l'outil local de prévisualisation existant : espace inférieur recalculé à 291 px, intervalle de 12 px préservé. Aucun test sur iPhone/iPad physique ni en PWA iOS installée ; le support réel de Wake Lock dépend du navigateur et de l'appareil.
- Aucune erreur ni alerte de console relevée sur le parcours testé. `git diff --check` réussi.

Les empreintes PWA et les assertions d'identité de la page sont actualisées ; le nouveau test est ajouté au workflow existant. Une borne d'extraction du test historique de quantités a été adaptée pour ne pas exécuter les nouveaux branchements d'interface dans son simulateur de portions. Ses assertions restent identiques.

Les contenus du catalogue, les moteurs de planification/courses/synchronisation, les liens avec les autres applications et la branche `shopping-v2-engine-test` ne sont pas modifiés. Aucun lot éditorial, commit ni push n'a été effectué pour cette fonctionnalité.
