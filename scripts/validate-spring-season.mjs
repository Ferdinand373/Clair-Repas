import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {recipeSource} from './recipe-source.mjs';
import {recipeHash,inspectRecipe} from './validate-recipe-editorial.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const f=JSON.parse(read('scripts/spring-season.fixture.json'));
assert.equal(f.otherHash,'446c4b5e56f0985879465203101a042737a7d970c816ee78163457e44fd78e99');
assert.equal(f.otherEditorialHash,'8a11c7c8bfcce2538f4536a581172e8d30e336382234fede2ee71a806c91fd1c');
assert.equal(f.protectedSeasonsHash,'484ae4a2f3567ff552db1e15bcc92545e5f23b27d1c975957b3f69257a09ab75');
assert.equal(f.protectedSeasonEditorialHash,'5ded6241e424262fe01029aaeedc06fb8aca5e8b781f1e65051ed1a4312e9197');
const {code,recipes:current,editorial:currentEditorial}=recipeSource(read('index.html'));
const recipes=current,editorial=currentEditorial;
const ids=new Set(f.rows.map(r=>r.id));
assert.equal(ids.size,40);assert.equal(recipes.length,1554);
assert.equal(recipes.filter(r=>r.thumbnail?.startsWith('assets/recipes/printemps/')).length,40,'Photos only on the selected forty recipes');
assert.deepEqual(recipes.filter(r=>r.collections?.includes('printemps-gourmand')).map(r=>r.id).sort(),[...ids].sort());
assert.equal(f.mid.length,20);assert.equal(f.eve.length,20);assert.equal(new Set([...f.mid,...f.eve]).size,40);
assert.equal(recipeHash(recipes.filter(r=>!ids.has(r.id))),f.otherHash,'1514 unselected recipes protected');
assert.equal(recipeHash(Object.fromEntries(Object.entries(editorial).filter(([id])=>!ids.has(id)))),f.otherEditorialHash);
assert.deepEqual(f.rows.reduce((a,r)=>(a[r.action]=(a[r.action]||0)+1,a),{}),{improved:31,selected:9});
const b=(a,z)=>{const start=code.indexOf(a),end=code.indexOf(z,start);assert.ok(start>=0&&end>start,a);return code.slice(start,end)};
assert.doesNotMatch(b('// Spring season extension','const recipeLibrary='),/localStorage|sessionStorage|fetch\(|saveState\(|removeItem\(|clear\(/,'Season data never touches personal storage');
const ctx={window:{},$:()=>({value:'4'}),MEAL_TYPES:['mid','eve'],recipeRole:r=>r.role||r.course||'dish',recipeFeedbackHTML:()=>'',recipePersonalNoteHTML:()=>'',isFavorite:()=>false,recipeNote:()=>''};
vm.createContext(ctx);vm.runInContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+b('function recipeText(','function inferFamily(')+'\n'+b('function escapeHTML(','let V73_NOTES_RAW')+'\n'+b('function formatQty(','function recipeFeedbackHTML(')+'\n'+b('function recipeHTML(','function recipeText(')+'\n'+b('function autumnFeatured(','// A missing or broken thumbnail'),ctx,{timeout:15000});
// Reviewed duration buttons. Seconds remain manual; mid-cooking additions
// written in words do not create a second, misleading countdown.
const timers={
 n18:[[],[],[8],[8],[]],n56:[[],[15],[],[18]],
 'v75-chef-guerard-02':[[8],[2,3],[20],[8],[3,1]],
 'v31n-orzo-crevettes':[[8],[2,5],[3],[2,3]],
 'theme-bistrot-plus-18':[[],[5],[4,1],[45],[30],[10],[10]],
 'theme-famille-dimanche-08':[[],[2],[40],[20],[15,5],[]],
 n16:[[20],[],[15],[3],[]],n33:[[20],[12],[8]],
 'bistrot-ext-29':[[20],[],[6],[6],[3],[],[]],
 'v75-chef-robuchon-05':[[12],[4,3],[1],[]],
 'v31n-couscous-minute-boulettes':[[7],[3,2],[18],[2]],
 'veg-l1-15':[[5],[20],[8],[8],[3],[]],
 'veg-l1-02':[[4],[],[],[],[],[35,5]],
 'v39-lasagnes-ricotta-epinards':[[],[5],[],[],[25],[15],[8]],
 'theme-famille-dimanche-04':[[],[15],[],[],[35],[10]],
 'ge-tofu-verts-quinoa':[[],[9],[10,2],[]],
 n38:[[],[8,3],[5],[3]],n53:[[],[],[],[20]],
 'veg-final-50':[[5],[],[],[6,1],[3]],
 'v31n-gratin-chou-fleur-poisson-blanc':[[],[3,1],[12],[4]],
 a040:[[10],[20],[]],a056:[[],[20],[7],[]],a059:[[],[10,8],[]],
 'ge-omelette-asperges-petits-pois':[[9],[],[10],[]],
 e66:[[5],[],[],[18,2]],
 'v31e-bouillon-nouilles-cotes-porc':[[6],[9],[8],[]],
 'v31e-pomme-terre-garnie-filet-mignon':[[12],[],[],[30,5]],
 'v31e-pomme-terre-garnie-saucisses':[[],[],[25],[]],
 'v31e-pomme-terre-garnie-falafels':[[],[],[7],[]],
 a099:[[12],[],[]],t411:[[15],[],[50],[]],q406:[[10],[],[3],[]],
 a017:[[],[9],[12],[],[]],'v74-reg-05':[[30],[],[],[],[],[10]],
 e24:[[],[],[8],[]],a063:[[4],[],[18]],
 'v31e-tartines-gratinees-crevettes':[[3],[1,12],[],[]],
 d048:[[],[],[]],d100:[[],[],[28]],e05:[[],[],[15,2],[]]
};
let renders=0,bytes=0;
for(const row of f.rows){
 const r=recipes.find(r=>r.id===row.id);assert.deepEqual(r,row.after,row.id+' approved object');assert.deepEqual(editorial[r.id],row.reading);
 if(row.action==='selected'){const {springMeals,thumbnail,collections,...now}=r,{thumbnail:oldThumbnail,collections:oldCollections,...before}=row.before;assert.deepEqual(now,before);assert.ok((oldCollections||[]).every(c=>collections.includes(c)));}
 assert.equal(inspectRecipe(r,editorial[r.id],{reviewed:true}).filter(e=>e.level==='error').length,0,r.id);
 assert.doesNotMatch(r.p.join(' '),/quelques minutes|cuire les légumes|jusqu’à cuisson|légumes à préciser|ajouter les ingrédients|selon besoin/);
 assert.equal(r.springMeals.length,1);assert.ok(f[r.springMeals[0]==='mid'?'mid':'eve'].includes(r.id));
 for(const count of [1,2,3,4,5,8]){
  const markup=ctx.recipeHTML(r,{people:count,dayIndex:0,mealType:r.springMeals[0]});assert.doesNotMatch(markup,/\{\{qty:|>NaN|>undefined|À vérifier/);
  for(const item of r.i)assert.ok(markup.includes(ctx.ingredientTextForRecipe(item,r,count)));
  if(timers[r.id])assert.deepEqual([...markup.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)].map(([,i,m])=>[+i,+m]),timers[r.id].flatMap((v,i)=>v.map(m=>[i,m])),r.id+' reviewed timers');
  renders++;
 }
 const card=ctx.springCardHTML(r);
 assert.match(card,/loading="lazy" decoding="async"/);
 assert.match(card,/width="80" height="80"/);
 assert.ok(card.includes(r.thumbnail));
 for(const thumbnail of ['https://example.org/photo.webp','assets/recipes/printemps/../photo.webp','assets/recipes/printemps/photo.jpg'])assert.doesNotMatch(ctx.springCardHTML({...r,thumbnail}),/<img/);
 if(process.argv.includes('--without-images'))continue;
 const image=readFileSync(resolve(root,r.thumbnail));assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');assert.equal(image.toString('ascii',12,16),'VP8 ');assert.equal(image.readUInt16LE(26)&0x3fff,160);assert.equal(image.readUInt16LE(28)&0x3fff,160);assert.ok(image.length<=20000);bytes+=image.length;
 assert.match(ctx.springCardHTML(r),/loading="lazy" decoding="async"/);
}
assert.equal(f.eve.filter(id=>/^(?:Soupe|Velouté|Consommé)/.test(recipes.find(r=>r.id===id).n)).length,3);
const protectedRecipes=recipes.filter(r=>r.collections?.some(c=>['automne-gourmand','hiver-gourmand'].includes(c)));
assert.equal(recipeHash(protectedRecipes),f.protectedSeasonsHash,'Both finished collections protected');
assert.equal(recipeHash(Object.fromEntries(protectedRecipes.map(r=>[r.id,editorial[r.id]]))),f.protectedSeasonEditorialHash);
for(const [path,sha] of Object.entries(f.protectedPhotos))assert.equal(createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex'),sha,'Original photo protected: '+path);
assert.ok(f.rows.every(r=>!r.after.collections.some(c=>['automne-gourmand','hiver-gourmand'].includes(c))),'No overlap with the finished collections');
const paths=JSON.parse(read('sw.js').match(/const SPRING_THUMBNAILS = Object.freeze\((\[[\s\S]*?\])\);/)[1]);assert.deepEqual(paths.sort(),f.rows.map(r=>'./'+r.after.thumbnail).sort());
assert.doesNotMatch(read('sw.js').match(/const CORE_FILES = (\[[\s\S]*?\]);/)[1],/assets\/recipes/);
console.log(`✓ 40 existing spring recipes: 20 Midi / 20 Soir, 3 soups; 9 selected, 31 improved; Autumn and Winter and 1514 other recipes unchanged`);
console.log(`✓ ${renders} scaled renders, reviewed timers, original ids/collections; ${process.argv.includes('--without-images')?'image verification deferred':'40 optional lazy WebP images ('+bytes+' bytes)'}`);
