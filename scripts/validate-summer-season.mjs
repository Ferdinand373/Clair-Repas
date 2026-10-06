import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {recipeSource} from './recipe-source.mjs';
import {recipeHash,inspectRecipe} from './validate-recipe-editorial.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const f=JSON.parse(read('scripts/summer-season.fixture.json'));
assert.equal(f.otherHash,'f91ccda019376e526a55975622396482b43004a7a026dbbdf6d7103c823266d4');
assert.equal(f.otherEditorialHash,'6fdba30c368fad4d2c2d27e62b695cef4d82e6ab784a78c39c1cfdd0cfc46f4e');
assert.equal(f.protectedSeasonsHash,'dfc9697e63bda648513c972725044519a470b0ba7fd85fc877990684ebdeb4d7');
assert.equal(f.protectedSeasonEditorialHash,'46e4873b4b5bb2e362fe5464d5641ae2ffd9a74a6f27f307e45b68f5dd5ec03e');
const {code,recipes:current,editorial:currentEditorial}=recipeSource(read('index.html'));
const recipes=current,editorial=currentEditorial;
const ids=new Set(f.rows.map(r=>r.id));
assert.equal(ids.size,40);assert.equal(recipes.length,1554);
assert.equal(recipes.filter(r=>r.thumbnail?.startsWith('assets/recipes/ete/')).length,40,'Photos only on the selected forty recipes');
assert.deepEqual(recipes.filter(r=>r.collections?.includes('ete-gourmand')).map(r=>r.id).sort(),[...ids].sort());
assert.equal(f.mid.length,20);assert.equal(f.eve.length,20);assert.equal(new Set([...f.mid,...f.eve]).size,40);
assert.equal(recipeHash(recipes.filter(r=>!ids.has(r.id))),f.otherHash,'1514 unselected recipes protected');
assert.equal(recipeHash(Object.fromEntries(Object.entries(editorial).filter(([id])=>!ids.has(id)))),f.otherEditorialHash);
assert.deepEqual(f.rows.reduce((a,r)=>(a[r.action]=(a[r.action]||0)+1,a),{}),{improved:25,selected:15});
const b=(a,z)=>{const start=code.indexOf(a),end=code.indexOf(z,start);assert.ok(start>=0&&end>start,a);return code.slice(start,end)};
assert.doesNotMatch(b('// Summer season extension','const recipeLibrary='),/localStorage|sessionStorage|fetch\(|saveState\(|removeItem\(|clear\(/,'Season data never touches personal storage');
const ctx={window:{},$:()=>({value:'4'}),MEAL_TYPES:['mid','eve'],recipeRole:r=>r.role||r.course||'dish',recipeFeedbackHTML:()=>'',recipePersonalNoteHTML:()=>'',isFavorite:()=>false,recipeNote:()=>''};
vm.createContext(ctx);vm.runInContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+b('function recipeText(','function inferFamily(')+'\n'+b('function escapeHTML(','let V73_NOTES_RAW')+'\n'+b('function formatQty(','function recipeFeedbackHTML(')+'\n'+b('function recipeHTML(','function recipeText(')+'\n'+b('function autumnFeatured(','// A missing or broken thumbnail'),ctx,{timeout:15000});
// Reviewed duration buttons. Seconds remain manual; mid-cooking additions
// written in words do not create a second, misleading countdown.
const timers={
 n05:[[],[],[],[],[15],[]],n06:[[20],[],[],[15],[]],
 n43:[[],[],[15],[3]],n78:[[],[],[],[10],[],[3]],
 n10:[[],[],[5,1],[5],[]],n34:[[20],[],[12],[15],[]],
 q410:[[],[12],[],[],[20]],
 'v31n-bowl-quinoa-courge-falafels':[[],[10,3],[4,3],[]],
 'v31n-bowl-quinoa-courge-tofu':[[10],[],[],[3]],
 n32:[[20],[],[4],[4]],e79:[[15],[4],[],[],[40],[]],
 q403:[[12],[],[5,6],[22]],'veg-final-52':[[15],[],[],[],[],[25]],
 'veg-final-51':[[20],[20],[5],[12,2],[]],
 'v31n-couscous-minute-boeuf':[[15],[5,1],[5],[],[12]],
 n48:[[],[],[],[]],n49:[[],[],[]],e19:[[10],[],[]],n84:[[],[],[25],[]],
 'ge-falafels-grenailles-legumes':[[],[],[12],[10,2],[]],
 a037:[[],[],[30]],a038:[[],[],[],[]],a039:[[],[],[]],
 a014:[[],[],[]],a015:[[],[],[]],a016:[[],[],[]],e04:[[],[],[]],
 e12:[[],[],[]],e40:[[],[],[]],a064:[[5],[],[]],a024:[[],[],[]],
 'ge-omelette-courgette-feta':[[8],[10],[]],
 'v31e-pomme-terre-garnie-poisson-blanc':[[],[],[22],[]],
 'v31e-pomme-terre-garnie-saumon':[[5],[],[30],[5]],
 e16:[[],[],[4],[]],'v31e-riz-croustillant-tofu':[[20],[],[10],[]],
 a096:[[],[],[]],a072:[[],[1],[4],[]],d005:[[],[],[]],d029:[[],[15],[3]]
};
let renders=0,bytes=0;
const imageHashes=new Set();
assert.equal(Object.keys(timers).length,40,'Every selected recipe has reviewed duration buttons');
for(const row of f.rows){
 const r=recipes.find(r=>r.id===row.id);assert.deepEqual(r,row.after,row.id+' approved object');assert.deepEqual(editorial[r.id],row.reading);
 if(row.action==='selected'){const {summerMeals,thumbnail,collections,...now}=r,{thumbnail:oldThumbnail,collections:oldCollections,...before}=row.before;assert.deepEqual(now,before);assert.ok((oldCollections||[]).every(c=>collections.includes(c)));}
 assert.equal(inspectRecipe(r,editorial[r.id],{reviewed:true}).filter(e=>e.level==='error').length,0,r.id);
 assert.doesNotMatch(r.p.join(' '),/quelques minutes|cuire les légumes|jusqu’à cuisson|légumes à préciser|ajouter les ingrédients|selon besoin/);
 assert.equal(r.summerMeals.length,1);assert.ok(f[r.summerMeals[0]==='mid'?'mid':'eve'].includes(r.id));
 for(const count of [1,2,3,4,5,8]){
  const markup=ctx.recipeHTML(r,{people:count,dayIndex:0,mealType:r.summerMeals[0]});assert.doesNotMatch(markup,/\{\{qty:|>NaN|>undefined|À vérifier/);
  if(count===2&&process.argv.includes('--review-timers'))console.log(JSON.stringify({id:r.id,steps:r.p,timers:[...markup.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)].map(([,i,m])=>[+i,+m])}));
  for(const item of r.i)assert.ok(markup.includes(ctx.ingredientTextForRecipe(item,r,count)));
  if(timers[r.id])assert.deepEqual([...markup.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)].map(([,i,m])=>[+i,+m]),timers[r.id].flatMap((v,i)=>v.map(m=>[i,m])),r.id+' reviewed timers');
  renders++;
 }
 const card=ctx.summerCardHTML(r);
 assert.match(card,/loading="lazy" decoding="async"/);
 assert.match(card,/width="80" height="80"/);
 assert.ok(card.includes(r.thumbnail));
 for(const thumbnail of ['https://example.org/photo.webp','assets/recipes/ete/../photo.webp','assets/recipes/ete/photo.jpg'])assert.doesNotMatch(ctx.summerCardHTML({...r,thumbnail}),/<img/);
 if(process.argv.includes('--without-images'))continue;
 const image=readFileSync(resolve(root,r.thumbnail));assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');assert.equal(image.toString('ascii',12,16),'VP8 ');assert.equal(image.readUInt16LE(26)&0x3fff,160);assert.equal(image.readUInt16LE(28)&0x3fff,160);assert.ok(image.length<=20000);bytes+=image.length;
 imageHashes.add(createHash('sha256').update(image).digest('hex'));
 assert.match(ctx.summerCardHTML(r),/loading="lazy" decoding="async"/);
}
assert.equal(f.eve.filter(id=>/^(?:Soupe|Gaspacho)/.test(recipes.find(r=>r.id===id).n)).length,3);
if(!process.argv.includes('--without-images')){
 assert.equal(imageHashes.size,40,'Forty distinct recipe photos');
 const files=readdirSync(resolve(root,'assets/recipes/ete'));
 assert.deepEqual(files.filter(n=>n.endsWith('.webp')).sort(),[...ids].map(id=>id+'.webp').sort());
 assert.ok(files.every(n=>n.endsWith('.webp')||['README.md','prompts-2026-10-06.json'].includes(n)),'No high-definition originals or unrelated assets in the summer directory');
}
const protectedRecipes=recipes.filter(r=>r.collections?.some(c=>['automne-gourmand','hiver-gourmand','printemps-gourmand'].includes(c)));
assert.equal(recipeHash(protectedRecipes),f.protectedSeasonsHash,'All three finished collections protected');
assert.equal(recipeHash(Object.fromEntries(protectedRecipes.map(r=>[r.id,editorial[r.id]]))),f.protectedSeasonEditorialHash);
for(const [path,sha] of Object.entries(f.protectedPhotos))assert.equal(createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex'),sha,'Original photo protected: '+path);
assert.ok(f.rows.every(r=>!r.after.collections.some(c=>['automne-gourmand','hiver-gourmand','printemps-gourmand'].includes(c))),'No overlap with the finished collections');
const paths=JSON.parse(read('sw.js').match(/const SUMMER_THUMBNAILS = Object.freeze\((\[[\s\S]*?\])\);/)[1]);assert.deepEqual(paths.sort(),f.rows.map(r=>'./'+r.after.thumbnail).sort());
assert.doesNotMatch(read('sw.js').match(/const CORE_FILES = (\[[\s\S]*?\]);/)[1],/assets\/recipes/);
console.log(`✓ 40 existing summer recipes: 20 Midi / 20 Soir, 3 soups; 15 selected, 25 improved; Autumn, Winter and Spring and 1514 other recipes unchanged`);
console.log(`✓ ${renders} scaled renders, reviewed timers, original ids/collections; ${process.argv.includes('--without-images')?'image verification deferred':'40 optional lazy WebP images ('+bytes+' bytes)'}`);
