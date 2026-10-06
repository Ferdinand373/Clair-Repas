import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {recipeSource} from './recipe-source.mjs';
import {recipeHash,inspectRecipe} from './validate-recipe-editorial.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const f=JSON.parse(read('scripts/autumn-season.fixture.json'));
assert.equal(f.otherHash,'5fb7a6bd118b15276c080532ee00627a2962c9bf5d03ce6f9d355a01f1abc519');
assert.equal(f.otherEditorialHash,'65901a0deb01fb5c4c2b280297e0950cdd5f142d036d5724957340c17f9f6b26');
const {code,recipes,editorial}=recipeSource(read('index.html'));
const ids=new Set(f.rows.map(r=>r.id));
assert.equal(ids.size,40);assert.equal(recipes.length,1554);
assert.equal(recipes.filter(r=>r.thumbnail).length,40,'Photos only on the selected forty recipes');
assert.deepEqual(recipes.filter(r=>r.collections?.includes('automne-gourmand')).map(r=>r.id).sort(),[...ids].sort());
assert.equal(f.mid.length,20);assert.equal(f.eve.length,20);assert.equal(new Set([...f.mid,...f.eve]).size,40);
assert.equal(recipeHash(recipes.filter(r=>!ids.has(r.id))),f.otherHash,'1514 unselected recipes protected');
assert.equal(recipeHash(Object.fromEntries(Object.entries(editorial).filter(([id])=>!ids.has(id)))),f.otherEditorialHash);
assert.deepEqual(f.rows.reduce((a,r)=>(a[r.action]=(a[r.action]||0)+1,a),{}),{preserved:10,selected:16,improved:14});
const b=(a,z)=>{const start=code.indexOf(a),end=code.indexOf(z,start);assert.ok(start>=0&&end>start,a);return code.slice(start,end)};
const ctx={window:{},$:()=>({value:'4'}),MEAL_TYPES:['mid','eve'],recipeRole:r=>r.role||r.course||'dish',recipeFeedbackHTML:()=>'',recipePersonalNoteHTML:()=>'',isFavorite:()=>false,recipeNote:()=>''};
vm.createContext(ctx);vm.runInContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+b('function recipeText(','function inferFamily(')+'\n'+b('function escapeHTML(','let V73_NOTES_RAW')+'\n'+b('function formatQty(','function recipeFeedbackHTML(')+'\n'+b('function recipeHTML(','function recipeText(')+'\n'+b('function autumnFeatured(','// A missing or broken thumbnail'),ctx,{timeout:15000});
const timers={a051:[[],[4],[25],[]],a052:[[],[5],[18],[2]],'v31e-pita-chaude-filet-mignon':[[],[7],[18],[7],[2]],a028:[[],[7],[],[12,2]],a065:[[],[8],[],[8]],'gn-poisson-blanc-poireaux-creme':[[],[12],[12],[],[18]],q408:[[],[7],[3],[4],[]],n61:[[],[22],[5],[2],[3]],'bourgeois-15':[[5],[10],[5],[],[55],[]],'bistrot-ext-24':[[10],[7],[2],[],[30],[3,10]],'bistrot-ext-26':[[8],[6],[3],[105],[12],[5]],'theme-famille-dimanche-09':[[],[6],[5],[75],[45],[]],'veg-l1-20':[[],[10,2],[8],[1,5],[],[25]]};
let renders=0,bytes=0;
for(const row of f.rows){
 const r=recipes.find(r=>r.id===row.id);assert.deepEqual(r,row.after,row.id+' approved object');assert.deepEqual(editorial[r.id],row.reading);
 if(row.action==='preserved'||row.action==='selected'){const {autumnMeals,thumbnail,collections,...now}=r,{thumbnail:oldThumbnail,collections:oldCollections,...before}=row.before;assert.deepEqual(now,before);assert.ok((oldCollections||[]).every(c=>collections.includes(c)));}
 assert.equal(inspectRecipe(r,editorial[r.id],{reviewed:true}).filter(e=>e.level==='error').length,0,r.id);
 assert.doesNotMatch(r.p.join(' '),/quelques minutes|cuire les légumes|jusqu’à cuisson|légumes à préciser|ajouter les ingrédients|selon besoin/);
 assert.equal(r.autumnMeals.length,1);assert.ok(f[r.autumnMeals[0]==='mid'?'mid':'eve'].includes(r.id));
 for(const count of [1,2,3,4,5,8]){
  const markup=ctx.recipeHTML(r,{people:count,dayIndex:0,mealType:r.autumnMeals[0]});assert.doesNotMatch(markup,/\{\{qty:|>NaN|>undefined|À vérifier/);
  for(const item of r.i)assert.ok(markup.includes(ctx.ingredientTextForRecipe(item,r,count)));
  if(timers[r.id])assert.deepEqual([...markup.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)].map(([,i,m])=>[+i,+m]),timers[r.id].flatMap((v,i)=>v.map(m=>[i,m])),r.id+' reviewed timers');
  renders++;
 }
 const image=readFileSync(resolve(root,r.thumbnail));assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');assert.equal(image.toString('ascii',12,16),'VP8 ');assert.equal(image.readUInt16LE(26)&0x3fff,160);assert.equal(image.readUInt16LE(28)&0x3fff,160);assert.ok(image.length<=20000);bytes+=image.length;
 assert.match(ctx.autumnCardHTML(r),/loading="lazy" decoding="async"/);
}
assert.equal(f.eve.filter(id=>/^(?:Soupe|Velouté)/.test(recipes.find(r=>r.id===id).n)).length,7);
const paths=JSON.parse(read('sw.js').match(/const AUTUMN_THUMBNAILS = Object.freeze\((\[[\s\S]*?\])\);/)[1]);assert.deepEqual(paths.sort(),f.rows.map(r=>'./'+r.after.thumbnail).sort());
assert.doesNotMatch(read('sw.js').match(/const CORE_FILES = (\[[\s\S]*?\]);/)[1],/assets\/recipes/);
console.log(`✓ 40 existing autumn recipes: 20 Midi / 20 Soir, 7 soups; 10 preserved, 16 selected, 14 improved; 1514 other recipes unchanged`);
console.log(`✓ ${renders} scaled renders, reviewed timers, original ids/collections, 40 optional lazy WebP images (${bytes} bytes)`);
