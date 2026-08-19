/* CLAIR REPAS — CHANTIER 5 — RAYON DU LIVRE

1) Ajouter dans BOOK_SHELVES :

{id:'aperitifs-petites-assiettes',icon:'🥂',
 title:'Apéritifs & petites assiettes',
 description:'Tartinables, bouchées chaudes, petites assiettes et idées à partager pour l’apéritif.',
 filter:recipe=>Array.isArray(recipe.collections)&&recipe.collections.includes('aperitifs-petites-assiettes')},

2) Ajouter ce tableau de sous-rubriques :

const BOOK_APERO_SUBCATEGORIES=[
 {id:'all',title:'Tout le chapitre',filter:()=>true},
 {id:'tartinables',title:'À tartiner',filter:r=>r.aperitifType==='tartinables'},
 {id:'hot',title:'Bouchées chaudes',filter:r=>r.aperitifType==='bouchees-chaudes'},
 {id:'cold',title:'Bouchées froides',filter:r=>r.aperitifType==='froids'},
 {id:'sea',title:'Mer',filter:r=>r.aperitifType==='mer'},
 {id:'plates',title:'Petites assiettes',filter:r=>r.aperitifType==='petites-assiettes'}
];

3) Dans bookSubcategories(id), ajouter :
if(id==='aperitifs-petites-assiettes')return BOOK_APERO_SUBCATEGORIES;

Aucune recette existante n'est déplacée.
Une recette peut rester dans Bistrot, Régionale, Terrines ou Végétarien
tout en étant visible ici grâce à collections.
*/
