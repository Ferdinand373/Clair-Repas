import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {recipeSource} from './recipe-source.mjs';
import {recipeHash,inspectRecipe} from './validate-recipe-editorial.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const f=JSON.parse(read('scripts/winter-season.fixture.json'));
assert.equal(f.otherHash,'d45f4443d4b7363ea9233840cdb3760c6384592214cba2775d72496209480165');
assert.equal(f.otherEditorialHash,'f7cd290678897feeac36c8ef5fc52f40a3792679b29984205c4b22a15aac63f0');
assert.equal(f.autumnHash,'51644980a6546049c69729c0328af71552c095096b5ec3b60bb2e2bd5d2cb459');
const {code,recipes:current,editorial:currentEditorial}=recipeSource(read('index.html'));
const recipes=current,editorial=currentEditorial;
const ids=new Set(f.rows.map(r=>r.id));
assert.equal(ids.size,40);assert.equal(recipes.length,1554);
assert.equal(recipes.filter(r=>r.thumbnail?.startsWith('assets/recipes/hiver/')).length,40,'Photos only on the selected forty recipes');
assert.deepEqual(recipes.filter(r=>r.collections?.includes('hiver-gourmand')).map(r=>r.id).sort(),[...ids].sort());
assert.equal(f.mid.length,20);assert.equal(f.eve.length,20);assert.equal(new Set([...f.mid,...f.eve]).size,40);
assert.equal(recipeHash(recipes.filter(r=>!ids.has(r.id))),f.otherHash,'1514 unselected recipes protected');
assert.equal(recipeHash(Object.fromEntries(Object.entries(editorial).filter(([id])=>!ids.has(id)))),f.otherEditorialHash);
assert.deepEqual(f.rows.reduce((a,r)=>(a[r.action]=(a[r.action]||0)+1,a),{}),{improved:19,selected:21});
const b=(a,z)=>{const start=code.indexOf(a),end=code.indexOf(z,start);assert.ok(start>=0&&end>start,a);return code.slice(start,end)};
assert.doesNotMatch(b('// Winter season extension','const recipeLibrary='),/localStorage|sessionStorage|fetch\(|saveState\(|removeItem\(|clear\(/,'Season data never touches personal storage');
const ctx={window:{},$:()=>({value:'4'}),MEAL_TYPES:['mid','eve'],recipeRole:r=>r.role||r.course||'dish',recipeFeedbackHTML:()=>'',recipePersonalNoteHTML:()=>'',isFavorite:()=>false,recipeNote:()=>''};
vm.createContext(ctx);vm.runInContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+b('function recipeText(','function inferFamily(')+'\n'+b('function escapeHTML(','let V73_NOTES_RAW')+'\n'+b('function formatQty(','function recipeFeedbackHTML(')+'\n'+b('function recipeHTML(','function recipeText(')+'\n'+b('function autumnFeatured(','// A missing or broken thumbnail'),ctx,{timeout:15000});
const timers={
 'v39-pot-au-feu':[[10],[5],[120],[25,20],[25],[15]],
 'v39-blanquette-veau':[[4],[75,10],[8],[1,5],[10],[3]],
 'theme-bistrot-plus-10':[[],[65],[25],[20],[10],[]],
 'gn-poulet-poireaux-creme':[[],[12],[10],[3],[18]],
 n22:[[],[12],[25],[]],
 'theme-famille-dimanche-11':[[10],[3,2],[50],[25],[5],[2]],
 'veg-final-39':[[3],[],[10],[],[35],[10]],
 'veg-l1-04':[[],[5],[10],[15],[3],[]],
 a054:[[25],[4],[]],a048:[[],[5],[20],[2]],
 'v31e-ragout-leger-boeuf':[[],[4],[18],[2]],
 a045:[[18],[1,12],[],[5]],
 'theme-petits-gourmands-03':[[],[],[],[15,2],[5]],
 q402:[[],[8],[10],[]],n25:[[],[20],[7],[5],[]],e11:[[],[],[],[9],[]],
 'veg-l1-14':[[1],[5],[20],[],[],[]],
 'theme-cuisine-regionale-06':[[20],[],[],[3],[]],
 'theme-bistrot-brasserie-03':[[],[25],[],[10]]
};
let renders=0,bytes=0;
for(const row of f.rows){
 const r=recipes.find(r=>r.id===row.id);assert.deepEqual(r,row.after,row.id+' approved object');assert.deepEqual(editorial[r.id],row.reading);
 if(row.action==='selected'){const {winterMeals,thumbnail,collections,...now}=r,{thumbnail:oldThumbnail,collections:oldCollections,...before}=row.before;assert.deepEqual(now,before);assert.ok((oldCollections||[]).every(c=>collections.includes(c)));}
 assert.equal(inspectRecipe(r,editorial[r.id],{reviewed:true}).filter(e=>e.level==='error').length,0,r.id);
 assert.doesNotMatch(r.p.join(' '),/quelques minutes|cuire les légumes|jusqu’à cuisson|légumes à préciser|ajouter les ingrédients|selon besoin/);
 assert.equal(r.winterMeals.length,1);assert.ok(f[r.winterMeals[0]==='mid'?'mid':'eve'].includes(r.id));
 for(const count of [1,2,3,4,5,8]){
  const markup=ctx.recipeHTML(r,{people:count,dayIndex:0,mealType:r.winterMeals[0]});assert.doesNotMatch(markup,/\{\{qty:|>NaN|>undefined|À vérifier/);
  for(const item of r.i)assert.ok(markup.includes(ctx.ingredientTextForRecipe(item,r,count)));
  if(timers[r.id])assert.deepEqual([...markup.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)].map(([,i,m])=>[+i,+m]),timers[r.id].flatMap((v,i)=>v.map(m=>[i,m])),r.id+' reviewed timers');
  renders++;
 }
 const card=ctx.winterCardHTML(r);
 assert.match(card,/loading="lazy" decoding="async"/);
 assert.match(card,/width="80" height="80"/);
 assert.ok(card.includes(r.thumbnail));
 for(const thumbnail of ['https://example.org/photo.webp','assets/recipes/hiver/../photo.webp','assets/recipes/hiver/photo.jpg'])assert.doesNotMatch(ctx.winterCardHTML({...r,thumbnail}),/<img/);
 if(process.argv.includes('--without-images'))continue;
 const image=readFileSync(resolve(root,r.thumbnail));assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');assert.equal(image.toString('ascii',12,16),'VP8 ');assert.equal(image.readUInt16LE(26)&0x3fff,160);assert.equal(image.readUInt16LE(28)&0x3fff,160);assert.ok(image.length<=20000);bytes+=image.length;
 assert.match(ctx.winterCardHTML(r),/loading="lazy" decoding="async"/);
}
assert.equal(f.eve.filter(id=>/^(?:Soupe|Velouté|Crème d’endives)/.test(recipes.find(r=>r.id===id).n)).length,7);
assert.equal(recipeHash(recipes.filter(r=>r.collections?.includes('automne-gourmand'))),f.autumnHash,'Autumn culinary content and classification protected');
for(const [path,sha] of Object.entries(f.autumnPhotos))assert.equal(createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex'),sha,'Autumn original photo protected: '+path);
assert.ok(f.rows.every(r=>!r.after.collections.includes('automne-gourmand')),'No overlap with final Autumn collection');
const paths=JSON.parse(read('sw.js').match(/const WINTER_THUMBNAILS = Object.freeze\((\[[\s\S]*?\])\);/)[1]);assert.deepEqual(paths.sort(),f.rows.map(r=>'./'+r.after.thumbnail).sort());
assert.doesNotMatch(read('sw.js').match(/const CORE_FILES = (\[[\s\S]*?\]);/)[1],/assets\/recipes/);
console.log(`✓ 40 existing winter recipes: 20 Midi / 20 Soir, 7 soups; 21 selected, 19 improved; Autumn and 1514 other recipes unchanged`);
console.log(`✓ ${renders} scaled renders, reviewed timers, original ids/collections; ${process.argv.includes('--without-images')?'image verification deferred':'40 optional lazy WebP images ('+bytes+' bytes)'}`);
