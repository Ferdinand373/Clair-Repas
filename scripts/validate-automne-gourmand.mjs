import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {recipeSource} from './recipe-source.mjs';
import {recipeHash,validateEditorial} from './validate-recipe-editorial.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('index.html'),{code,recipes:current,editorial:currentEditorial}=recipeSource(html);
const winter=JSON.parse(read('scripts/winter-season.fixture.json'));
const season=JSON.parse(read('scripts/autumn-season.fixture.json'));
const recipes=current.map(r=>winter.rows.find(row=>row.id===r.id)?.before||season.rows.find(row=>row.id===r.id)?.before||r);
const editorial=Object.fromEntries(Object.entries(currentEditorial).map(([id,e])=>[id,winter.rows.find(row=>row.id===id)?.readingBefore||season.rows.find(row=>row.id===id)?.readingBefore||e]));
const fixture=JSON.parse(read('scripts/automne-gourmand.fixture.json'));
const ids=new Set(fixture.recipes.map(r=>r.id));
assert.equal(ids.size,10);
assert.equal(fixture.recipes.filter(r=>r.before).length,9);
assert.equal(recipes.length,fixture.baselineCount+1);
assert.equal(new Set(recipes.map(r=>r.id)).size,recipes.length);
assert.equal(recipeHash(recipes.filter(r=>!ids.has(r.id))),fixture.baselineOtherHash,'All 1544 recipes outside the selection remain byte-equivalent as objects');
assert.equal(recipeHash(Object.fromEntries(Object.entries(editorial).filter(([id])=>!ids.has(id)))),fixture.baselineEditorialOtherHash);
assert.deepEqual(recipes.filter(r=>r.collections?.includes('automne-gourmand')).map(r=>r.id).sort(),[...ids].sort());
assert.deepEqual(validateEditorial({html,inventory:JSON.parse(read('docs/recipe-editorial-inventory.json'))}).errors,[]);
const block=(a,b)=>{const start=code.indexOf(a),end=code.indexOf(b,start);assert.ok(start>=0&&end>start,a);return code.slice(start,end)};
const context={window:{},$:()=>({value:'4'}),MEAL_TYPES:['mid','eve'],recipeRole:r=>r.role||r.course||'dish',
  recipeFeedbackHTML:()=>'',recipePersonalNoteHTML:()=>'',isFavorite:()=>false,recipeNote:()=>'',bookCourseLabel:r=>r.course||'Plat'};
vm.createContext(context);
vm.runInContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+
  block('function recipeText(','function inferFamily(')+'\n'+block('function escapeHTML(','let V73_NOTES_RAW')+'\n'+
  block('function formatQty(','function recipeFeedbackHTML(')+'\n'+block('function recipeHTML(','function recipeText(')+'\n'+
  block('function autumnFeatured(','// A missing or broken thumbnail')+'\n'+block('function bookRecipeResultHTML(','window.CR_AUTUMN_CARD_HTML='),context,{timeout:15000});
const timers={
  'v31n-orzo-boulettes':[[],[],[],[50,25],[],[5]],n64:[[],[8],[5],[15],[5],[]],a042:[[],[4],[25],[],[2]],
  'automne-quiche-poireaux':[[],[5],[12,3],[],[],[35,5],[5]],
  'v39-boeuf-bourguignon':[[],[5],[6,1],[],[120,30],[6],[25,15],[]],
  'v39-gratin-chou-fleur':[[],[12],[1],[5],[],[20,5,3]],
  'v39-hachis-parmentier':[[],[20],[5,6],[3],[2],[20,5],[5]],d081:[[],[],[],[25,5],[5]],e03:[[],[2,8],[],[4],[1]],
  'v39-roti-porc':[[],[8],[5],[45,25],[15,5],[10],[]]
};
let renders=0;
for(const row of fixture.recipes){
 const r=recipes.find(r=>r.id===row.id);
 const {thumbnail,...culinary}=r;
 assert.deepEqual(culinary,row.after,row.id+' approved culinary content');
 assert.equal(thumbnail,'assets/recipes/automne/'+r.id+'.webp');assert.deepEqual(editorial[r.id],row.reading);
 if(row.before)for(const collection of row.before.collections||[])assert.ok(r.collections.includes(collection),'Previous collection preserved');
 assert.ok(r.servings>0);assert.ok(r.i.every(i=>Number.isFinite(i.q)&&i.q>0&&typeof i.u==='string'),'Every ingredient quantified');
 assert.equal(row.reading.titles.length,r.p.length);assert.ok(row.reading.intro.length<160);
 assert.doesNotMatch(r.p.join(' '),/cuire les légumes|ajouter les ingrédients|jusqu’à cuisson|à préciser|selon besoin/);
 for(const count of [1,2,3,4,5,8]){
  const result=context.recipeHTML(r,{people:count,dayIndex:0,mealType:'eve'});
  assert.doesNotMatch(result,/\{\{qty:|>NaN|>undefined|historique|À vérifier/);
  assert.match(result,/data-cooking-id=/);assert.match(result,new RegExp('portion-count">'+count+'<'));
  for(const i of r.i)assert.ok(result.includes(context.ingredientTextForRecipe(i,r,count)),r.id+' ingredient quantity at '+count);
  const actual=[...result.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)].map(([,i,m])=>[+i,+m]);
  assert.deepEqual(actual,timers[r.id].flatMap((values,i)=>values.map(m=>[i,m])),r.id+' manually reviewed timer attachment');
  for(const [index,step] of r.p.entries())for(const token of step.matchAll(/\{\{qty:(\d+)(?::(\d+(?:\.\d+)?))?\}\}/g)){
    const item=r.i[+token[1]],share=token[2]?+token[2]:1;
    assert.ok(context.recipeStepText(step,r,count).includes(context.formatQty(item.q*count/r.servings*share)),r.id+' step '+index+' quantity');
  }
  renders++;
 }
 const card=context.bookRecipeResultHTML(r);assert.match(card,/autumn-featured/);assert.match(card,/Automne/);
 assert.ok(card.includes(context.escapeHTML(r.n)));assert.ok(card.includes(r.servings+' personnes'));assert.match(card,/<img/);
 const withPhoto=context.autumnCardHTML({...r,thumbnail:'assets/recipes/automne/test.webp'});
 assert.match(withPhoto,/<img/);assert.match(withPhoto,/loading="lazy" decoding="async"/);assert.match(withPhoto,/width="80" height="80"/);
 for(const thumbnail of ['https://example.org/photo.webp','assets/recipes/automne/../photo.webp','assets/recipes/automne/photo.jpg'])assert.doesNotMatch(context.autumnCardHTML({...r,thumbnail}),/<img/);
}
const other=recipes.find(r=>!ids.has(r.id));assert.doesNotMatch(context.autumnCardHTML({...other,thumbnail:'assets/recipes/automne/test.webp'}),/<img/);
assert.match(html,/event.target.hidden=true/);const paths=JSON.parse(read('sw.js').match(/const AUTUMN_THUMBNAILS = Object.freeze\((\[[\s\S]*?\])\);/)[1]).filter(path=>ids.has(path.split('/').at(-1).replace('.webp','')));
assert.deepEqual(paths.sort(),[...ids].map(id=>'./assets/recipes/automne/'+id+'.webp').sort());
assert.equal(recipes.filter(r=>r.thumbnail).length,10,'Only the ten featured recipes have photos');
let thumbnailBytes=0;
for(const path of paths){
 const bytes=readFileSync(resolve(root,path));
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.ok(bytes.length<=20000,path+' thumbnail budget');
 thumbnailBytes+=bytes.length;
}
assert.ok(thumbnailBytes<=200000,'Ten-thumbnail total budget');
assert.doesNotMatch(read('sw.js').match(/const CORE_FILES = (\[[\s\S]*?\]);/)[1],/assets\/recipes/,'Photos must not join the atomic core preload');
console.log(`✓ Archived ten-recipe release: 9 ids preserved, 1 distinct quiche, 1544 baseline recipes verified; extension checked by validate-autumn-season`);
console.log(`✓ ${renders} renders, scaled ingredients/steps, manual timer expectations, existing collections and editorial review`);
console.log('✓ Featured-only thumbnails, lazy WebP, absent/invalid-image fallback and ten optional image cache paths');
console.log(`✓ Ten genuine WebP assets: ${thumbnailBytes} bytes total; optional first-use cache, no catalogue image preload`);
