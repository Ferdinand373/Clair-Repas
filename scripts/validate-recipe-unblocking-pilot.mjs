import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {recipeSource} from './recipe-source.mjs';
import {recipeHash} from './validate-recipe-editorial.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const pilot=JSON.parse(readFileSync(resolve(root,'scripts/recipe-unblocking-pilot-01.fixture.json'),'utf8'));

export function verifyUnblockingPilot(){
  const {code,recipes,editorial}=recipeSource(readFileSync(resolve(root,'index.html'),'utf8'));
  const inventory=JSON.parse(readFileSync(resolve(root,'docs/recipe-editorial-inventory.json'),'utf8'));
  const r=recipes.find(x=>x.id==='e06'),before=pilot.before.recipe;
  assert.equal(pilot.baselineCommit,'da6ceeae6ab3d3ea0460c0cf017e4765358351f5');
  assert.equal(pilot.source.commit,'c456cee99249ce1545fe479598b6facb766a5fb4');
  assert.equal(pilot.source.ingredient,"I(400,'g','pommes de terre cuites')");
  assert.equal(recipeHash(before),'f37d7d093e61f0a00f8a42271d56fb72615cf14a14b1e377406fc5c93dcedf4a');
  assert.equal(pilot.selectedIds.length,12);
  assert.equal(new Set(pilot.selectedIds).size,12);
  assert.deepEqual(inventory.recipes.filter(x=>pilot.selectedIds.includes(x.id)).map(x=>x.id),pilot.selectedIds,'stable inventory order');
  assert.equal(inventory.recipes.filter(x=>pilot.selectedIds.includes(x.id)&&x.status==='blocked').length,11);
  assert.equal(recipes.filter(x=>x.id!=='e06').length,1552);
  assert.equal(recipeHash(recipes.filter(x=>x.id!=='e06')),pilot.outside.recipesSha256,'1552 other recipes untouched');
  assert.equal(recipeHash(Object.entries(editorial).filter(([id])=>id!=='e06')),pilot.outside.editorialSha256,'other reading metadata untouched');
  assert.equal(recipeHash(inventory.recipes.filter(x=>x.id!=='e06')),pilot.outside.inventorySha256,'other reviews untouched');
  assert.deepEqual(inventory.recipes.reduce((s,x)=>(s[x.status]=(s[x.status]||0)+1,s),{}),{corrected:428,blocked:1114,unchanged:11});
  const {protectedRecipeSha256,...expectedRecord}=pilot.after.record;
  assert.deepEqual(inventory.recipes.find(x=>x.id==='e06'),expectedRecord);
  assert.equal(recipeHash(r),expectedRecord.reviewedHash);
  const protectedRecipe={...r};delete protectedRecipe.p;delete protectedRecipe.t;
  assert.equal(recipeHash(protectedRecipe),protectedRecipeSha256);
  const identity=x=>{const result=structuredClone(x);delete result.p;result.i[2].n='pommes de terre';return result;};
  assert.deepEqual(identity(r),identity(before),'only potato state and steps may change');
  assert.deepEqual(r.i[2],{q:400,u:'g',n:'pommes de terre cuites',k:'pommes de terre'});
  assert.equal(r.m,'Sans cuisson');assert.equal(r.servings||2,2);
  assert.equal(r.p.length,4);assert.match(r.p[0],/déjà cuites.*sans cuisson/);
  assert.ok(!editorial.e06.reviewNote);
  assert.equal(editorial.e06.titles.length,4);

  const slice=(a,b)=>code.slice(code.indexOf(a),code.indexOf(b,code.indexOf(a)+a.length));
  const context={window:{},$:()=>({value:'8'}),MEAL_TYPES:['mid','eve'],recipeRole:r=>r.role||r.course||'dish',isFavorite:()=>false,recipeFeedbackHTML:()=>'',recipePersonalNoteHTML:()=>''};
  vm.runInNewContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+
    slice('function recipeText(','function inferFamily(')+'\n'+
    slice('function escapeHTML(','let V73_NOTES_RAW')+'\n'+
    slice('function formatQty(','function recipeFeedbackHTML(')+'\n'+
    slice('function recipeHTML(','function recipeText('),context,{timeout:15000});
  const shopping=createRequire(import.meta.url)(resolve(root,'shopping-v2-engine.js'));
  let ingredientChecks=0;
  for(const people of [1,2,3,4,5,8]){
    const output=context.recipeHTML(r,{people,dayIndex:1,mealType:'eve'});
    for(const item of r.i){
      const q=item.q==null?null:item.q*people/2;
      assert.ok(output.includes('>'+context.ingredientText(item,q,people)+'</li>'));ingredientChecks++;
    }
    assert.ok(context.recipeStepText(r.p[0],r,people).includes(context.formatQty(200*people)+' g'));
    assert.match(output,/pommes de terre cuites/);
    assert.doesNotMatch(output,/\{\{|undefined|NaN|data-timer-minutes/);
    assert.deepEqual(r.p.map(step=>Array.from(context.stepTimerDurations(step))),[[],[],[],[]]);
    const totals=recipe=>shopping.buildDraft([recipe],{peopleCount:people}).map(x=>({key:x.canonicalName,quantity:x.exactQuantity,unit:x.exactUnit,purchaseQuantity:x.purchaseQuantity,purchaseUnit:x.purchaseUnit}));
    assert.deepEqual(totals(r),totals(before),'shopping quantities and canonical ingredient keys preserved');
    const potatoes=shopping.buildDraft([r],{peopleCount:people}).find(x=>x.canonicalName==='pommes de terre');
    assert.equal(potatoes.baseQuantity,200*people);assert.equal(potatoes.baseUnit,'g');
  }
  const meals=[2,4,3,2];
  const render=()=>meals.map((people,i)=>context.recipeHTML(r,{people,dayIndex:Math.floor(i/2),mealType:i%2?'eve':'mid'}));
  const first=render();meals[1]=5;const next=render();
  assert.notEqual(first[1],next[1]);for(const i of [0,2,3])assert.equal(first[i],next[i]);
  console.log('✓ Pilot 01: 12 candidates, e06 source-restored, 11 blocked unchanged; 1552 recipes/metadata/reviews protected; '+ingredientChecks+' ingredient renders, shopping equivalence, no timers and independent 2/4/3/2 → 2/5/3/2 meals');
  return {ingredientChecks};
}
const invoked=process.argv[1]?pathToFileURL(resolve(process.argv[1])).href:'';
if(invoked===import.meta.url)verifyUnblockingPilot();
