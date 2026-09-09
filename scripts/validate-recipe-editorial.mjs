import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {recipeSource} from './recipe-source.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
// The bd5a54b catalogue's ids + original source hashes. Review updates change
// reviewedHash, never this baseline, so legacy tolerance cannot hide new work.
const LEGACY_FINGERPRINT='49a96adb7e88646ae8f46baf918eb4e2c67f9f0bcfb32e5c7300be0e81b69c25';
export const recipeHash=recipe=>createHash('sha256').update(JSON.stringify(recipe)).digest('hex');
export function inspectRecipe(recipe,reading,{reviewed=false}={}){
  const findings=[];
  const add=(code,message,essential=false)=>findings.push({level:essential&&reviewed?'error':'warning',code,message});
  if(!recipe||typeof recipe.id!=='string'||!recipe.id.trim())return [{level:'error',code:'id',message:'Identifiant absent'}];
  if(!recipe.n||!recipe.m)add('identity','Nom ou appareil absent',true);
  if(!Array.isArray(recipe.i)||!recipe.i.length||!Array.isArray(recipe.p)||!recipe.p.length){add('structure','Ingrédients/étapes absents',true);return findings;}
  recipe.i.forEach((item,index)=>{
    if(!item||typeof item.n!=='string'||!item.n.trim())add('ingredient',`Ingrédient ${index} invalide`,true);
    if(item.q!=null&&(typeof item.q!=='number'||!Number.isFinite(item.q)||item.q<0))add('quantity',`Quantité ${index} invalide`,true);
    if(item.q==null)add('unquantified',`Quantité non chiffrée : ${item.n}`);
  });
  recipe.p.forEach((step,index)=>{
    if(typeof step!=='string'||!step.trim()){add('step',`Étape ${index+1} vide`,true);return;}
    const tokens=[...step.matchAll(/\{\{qty:(\d+)(?::(\d+(?:\.\d+)?))?\}\}/g)];
    for(const token of tokens){
      const item=recipe.i[Number(token[1])],share=token[2]===undefined?1:Number(token[2]);
      if(!item||item.q==null||!Number.isFinite(item.q)||share<=0||share>1)add('reference',`Référence invalide ${token[0]} étape ${index+1}`,true);
    }
    if(/\{\{|\}\}/.test(step.replace(/\{\{qty:(\d+)(?::(\d+(?:\.\d+)?))?\}\}/g,'')))add('reference','Marqueur de quantité mal formé',true);
    if(/\d+(?:[.,]\d+)?\s*(?:kg|g|cl|ml|litres?)\b/i.test(step))add('fixed-quantity',`Quantité figée à relire, étape ${index+1}`,true);
    if(/(?:un dixième|le quart|la moitié) (?:du|de la|des)/i.test(step))add('fraction',`Répartition à expliciter, étape ${index+1}`);
    if(/\b(?:pâtes|riz|semoule|quinoa|nouilles)\b/i.test(step)&&/\d+\s*minutes?/.test(step)&&!/paquet|emballage/.test(step))add('package-time',`Durée du produit à vérifier, étape ${index+1}`);
    if(/cuire|griller|poêler|enfourner/i.test(step)&&!/feu|°|paquet|emballage|frém|ébullition|plancha|barbecue|air fryer/i.test(step))add('heat',`Conditions de cuisson à relire, étape ${index+1}`);
  });
  if(typeof reading?.intro!=='string'||!reading.intro.trim())add('introduction','Introduction individuelle absente ou invalide',true);
  if(!Array.isArray(reading?.titles)||reading.titles.length!==recipe.p.length||reading.titles.some(t=>typeof t!=='string'||!t.trim()))add('titles','Titres absents ou non alignés avec les étapes',true);
  if(!reading?.times||!['prep','cook','rest','total'].every(key=>Object.hasOwn(reading.times,key)))add('times','Informations de temps incomplètes',true);
  else for(const key of ['prep','cook','rest','total'])if(reading.times[key]!=null&&typeof reading.times[key]!=='string')add('times',`Temps ${key} doit être un libellé explicite`,true);
  if(reading?.times?.prep==null)add('prep-time','Temps de préparation non détaillé');
  if(reading?.times?.cook==null&&recipe.m!=='Sans cuisson')add('cook-time','Temps de cuisson non détaillé');
  if(reading?.tip&&typeof reading.tip!=='string')add('tip','Un seul conseil textuel est accepté',true);
  if(reading?.groups){
    const indices=reading.groups.flatMap(g=>g.ingredients||[]);
    if(reading.groups.some(g=>!g.title||!Array.isArray(g.ingredients))||indices.length!==recipe.i.length||new Set(indices).size!==recipe.i.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=recipe.i.length))add('groups','Groupes incomplets ou ingrédients répétés',true);
  }
  if(reading?.optionalIngredients?.some(i=>!Number.isInteger(i)||i<0||i>=recipe.i.length))add('optional','Indice facultatif invalide',true);
  return findings;
}

export function validateEditorial({html,inventory}){
  const {recipes,editorial}=recipeSource(html);
  const errors=[],warnings=[],counts={pending:0,unchanged:0,corrected:0,blocked:0};
  const records=new Map(inventory.recipes.map(r=>[r.id,r]));
  const legacyIds=Array.isArray(inventory.baselineIds)?inventory.baselineIds:[];
  const legacy=new Set(legacyIds);
  if(legacyIds.length!==1553||inventory.baselineCount!==1553||recipeHash(legacyIds.map(id=>[id,records.get(id)?.sourceHash]))!==LEGACY_FINGERPRINT)errors.push('Référence historique modifiée : conserver les identifiants et sourceHash de la base bd5a54b');
  if(records.size!==inventory.recipes.length)errors.push('Identifiant dupliqué dans le registre');
  if(new Set(recipes.map(r=>r.id)).size!==recipes.length)errors.push('Identifiant dupliqué dans le catalogue');
  if(recipes.length!==records.size)errors.push('Inventaire et catalogue ne couvrent pas les mêmes fiches');
  for(const recipe of recipes){
    const record=records.get(recipe.id),reading=editorial[recipe.id];
    if(!record){errors.push(`${recipe.id}: aucune entrée dans le registre`);continue;}
    if(!Object.hasOwn(counts,record.status)){errors.push(`${recipe.id}: statut invalide`);continue;}
    counts[record.status]++;
    const reviewed=record.status!=='pending';
    if(!legacy.has(recipe.id)&&!reviewed)errors.push(`${recipe.id}: nouvelle fiche sans revue ; la tolérance historique ne s’applique pas`);
    if(recipeHash(recipe)!==(reviewed?record.reviewedHash:record.sourceHash))errors.push(`${recipe.id}: contenu modifié sans mise à jour de sa revue individuelle`);
    if(record.name!==recipe.n)errors.push(`${recipe.id}: nom différent du registre`);
    if(reviewed&&(!record.batch||!Array.isArray(record.issues)))errors.push(`${recipe.id}: revue non documentée`);
    if(record.status==='blocked'&&(!record.issues?.length||!reading?.reviewNote))errors.push(`${recipe.id}: blocage sans motif visible`);
    if(['corrected','unchanged'].includes(record.status)&&(record.issues?.length||reading?.reviewNote))errors.push(`${recipe.id}: ne peut être validée avec une réserve essentielle`);
    for(const issue of inspectRecipe(recipe,reading,{reviewed})){
      (issue.level==='error'?errors:warnings).push(`${recipe.id} [${issue.code}] ${issue.message}`);
    }
  }
  for(const id of Object.keys(editorial))if(!records.has(id))errors.push(`${id}: métadonnées orphelines`);
  return {errors,warnings,counts,total:recipes.length};
}

function tests(){
  const recipe={id:'test',n:'Test',m:'Casserole',i:[{q:100,u:'g',n:'riz'}],p:['Verser {{qty:0}} de riz. Cuire selon le paquet.']};
  const reading={intro:'Le riz cuit dans une casserole.',titles:['Cuire le riz'],times:{prep:null,cook:'Selon le paquet',rest:null,total:'Selon le paquet'}};
  assert.equal(inspectRecipe(recipe,reading,{reviewed:true}).filter(i=>i.level==='error').length,0);
  const detects=(r,m,code)=>assert.ok(inspectRecipe(r,m,{reviewed:true}).some(i=>i.code===code&&i.level==='error'),code);
  detects({...recipe,i:[{q:-1,n:'riz'}]},reading,'quantity');
  detects({...recipe,p:['Ajouter {{qty:9}} de riz.']},reading,'reference');
  detects({...recipe,p:['Ajouter {{qty:0:2}} de riz.']},reading,'reference');
  detects({...recipe,i:[{q:null,n:'riz'}]},reading,'reference');
  detects({...recipe,p:['Ajouter {{qty:0/2}} de riz.']},reading,'reference');
  detects({...recipe,p:['Ajouter 100 g de riz.']},reading,'fixed-quantity');
  detects(recipe,{...reading,titles:[]},'titles');
  detects(recipe,{...reading,intro:{text:'not a string'}},'introduction');
  detects(recipe,{...reading,groups:[{title:'Riz',ingredients:[0,0]}]},'groups');
  detects(recipe,{...reading,optionalIngredients:[2]},'optional');
  assert.ok(inspectRecipe(recipe,{},{}).every(i=>i.level==='warning'),'Legacy lacunae remain warnings');
}
function catalogueGuardTests(html,inventory){
  const altered=structuredClone(inventory);
  altered.recipes[0].sourceHash='0'.repeat(64);
  assert.ok(validateEditorial({html,inventory:altered}).errors.some(e=>e.startsWith('Référence historique modifiée')),'Original hashes cannot be refreshed to hide unreviewed changes');
  // Synthetic additions only in memory: no extra recipe is shipped.
  const recipe={id:'qa-future-editorial',n:'Salade de tomate de test',m:'Sans cuisson',t:'Selon préparation',servings:2,s:['été'],i:[{q:1,u:'',n:'tomate',k:'tomates'}],p:['Laver la tomate, la couper et servir.']};
  const futureHTML=html.replace('const recipeLibrary=[',`const recipeLibrary=[${JSON.stringify(recipe)},`);
  const finalRecipe=recipeSource(futureHTML).recipes.find(r=>r.id===recipe.id);
  assert.ok(finalRecipe,'Synthetic source addition');
  const hash=recipeHash(finalRecipe);
  const next=structuredClone(inventory);
  next.recipes.push({id:recipe.id,name:recipe.n,status:'pending',sourceHash:hash});
  assert.ok(validateEditorial({html:futureHTML,inventory:next}).errors.some(e=>e.includes('nouvelle fiche sans revue')),'New recipe cannot use historical tolerance');
  Object.assign(next.recipes.at(-1),{status:'corrected',reviewedHash:hash,batch:'qa',issues:[]});
  assert.ok(validateEditorial({html:futureHTML,inventory:next}).errors.some(e=>e.includes('[introduction]')),'New reviewed recipe needs editorial metadata');
  const reading={intro:'La tomate est servie crue.',titles:['Préparer et servir'],times:{prep:null,cook:'Sans cuisson',rest:null,total:'Selon préparation'}};
  const completeHTML=futureHTML.replace('const recipeLibrary=',`RECIPE_EDITORIAL[${JSON.stringify(recipe.id)}]=${JSON.stringify(reading)};\nconst recipeLibrary=`);
  assert.deepEqual(validateEditorial({html:completeHTML,inventory:next}).errors,[],'A properly reviewed new recipe remains supported');
}
const invoked=process.argv[1]?pathToFileURL(resolve(process.argv[1])).href:'';
if(invoked===import.meta.url){
  tests();
  const html=readFileSync(resolve(root,'index.html'),'utf8');
  const inventory=JSON.parse(readFileSync(resolve(root,'docs/recipe-editorial-inventory.json'),'utf8'));
  const result=validateEditorial({html,inventory});
  console.log(JSON.stringify({total:result.total,counts:result.counts,errors:result.errors.length,editorialWarnings:result.warnings.length},null,2));
  if(process.argv.includes('--warnings'))console.log(result.warnings.join('\n'));
  if(result.errors.length){console.error(result.errors.join('\n'));process.exitCode=1;}
  else {
    catalogueGuardTests(html,inventory);
    console.log('✓ Structure, immutable historical baseline, reviewed hashes, ingredient references and mandatory review for future additions');
  }
}
