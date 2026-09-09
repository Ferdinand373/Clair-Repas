#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const fixture=JSON.parse(readFileSync(resolve(root,'scripts/recipe-clarity-batch-01.fixture.json'),'utf8'));
const code=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .find(([,attrs,body])=>!attrs.includes('src=')&&body.includes('const recipeLibrary='))[2];
const block=(start,end)=>{
  const a=code.indexOf(start),b=code.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Source boundary: ${start}`);
  return code.slice(a,b);
};
const context={window:{},$:()=>({value:'8'}),MEAL_TYPES:['mid','eve'],
  recipeRole:r=>r.role||r.course||'dish',isFavorite:()=>false,
  recipeFeedbackHTML:()=>'',recipePersonalNoteHTML:()=>''};
vm.runInNewContext(
  code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+
  block('function recipeText(','function inferFamily(')+'\n'+
  block('function formatQty(','function recipeFeedbackHTML(')+'\n'+
  block('function recipeHTML(','function recipeText(')+'\n;this.recipes=recipeLibrary;',
  context,{timeout:15000});
const recipes=JSON.parse(JSON.stringify(context.recipes));
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const selected=new Map(fixture.recipes.map(r=>[r.id,r]));
assert.equal(selected.size,20);
assert.equal(recipes.length,1553);
const protectedRows=recipes.map(r=>{
  const copy={...r};
  if(selected.has(r.id)){delete copy.p;if(selected.get(r.id).afterTime)delete copy.t;}
  return copy;
});
assert.equal(sha(protectedRows),fixture.protectedCatalogSha256,
  'All ingredients, reference servings, ids, names, appliances and non-selected recipes must stay unchanged');

// Manually reviewed ingredient coverage: each entry corresponds to one ingredient.
const ingredientTerms={
  n05:['poulet','courgette','poivron','citron','huile.*herbes','saler.*poivrer'],
  n07:['jambon','gruyère','crème','concentré de tomate','salade'],
  n11:['poisson','courgette','carottes','citron','huile.*herbes','sel.*poivre'],
  n26:['poulet','semoule','courgette','citron','huile.*herbes','saler.*poivrer'],
  n78:['bœuf','champignons','oignon','semoule','huile.*herbes','saler.*poivrer'],
  n88:['pâtes','saumon','petits pois','crème','citron','aneth'],
  n97:['côtelettes','semoule','tomates','concombre','citron','menthe.*persil'],
  e03:['œufs','champignons','salade','beurre','sel.*poivre'],
  e11:['pain','jambon','fromage','salade','beurre'],
  e30:['haricots rouges','thon','maïs','tomates','échalote','vinaigrette'],
  e58:['pain','thon','tomate','fromage','salade','moutarde'],
  e63:['œufs','pommes de terre','chorizo','oignon','salade','huile'],
  e78:['pâtes','thon','coulis','fromage','courgette','origan'],
  e92:['haricots rouges','pois chiches','riz','coulis','poivron','cumin.*paprika'],
  a038:['concombre','yaourt','citron','aneth','huile'],
  a048:['chou-fleur','oignon','bouillon','curry','lait'],
  a088:['quinoa','concombre','tomate','citron','persil.*menthe'],
  d028:['pêches','miel','romarin','citron'],
  d036:['pommes','rhubarbe','sucre','eau'],
  d044:['poires','chocolat','farine','beurre','sucre']
};
let timerCount=0,quantityChecks=0;
for(const entry of fixture.recipes){
  const recipe=recipes.find(r=>r.id===entry.id);
  assert.ok(recipe,entry.id);
  assert.equal(recipe.n,entry.name);
  assert.equal(recipe.m,entry.method);
  assert.equal(Number(recipe.servings)||2,entry.baseServings);
  assert.equal(context.recipeHasFixedYield(recipe),entry.fixedYield);
  assert.equal(recipe.t,entry.afterTime||entry.beforeTime);
  assert.equal(sha(recipe.p),entry.stepsSha256,entry.id+' reviewed wording');
  assert.notDeepEqual(recipe.p,entry.beforeSteps);
  assert.equal(recipe.p.length,entry.timers.length);
  assert.equal(ingredientTerms[entry.id].length,recipe.i.length);
  const preparation=recipe.p.join(' ');
  for(const term of ingredientTerms[entry.id])assert.match(preparation,new RegExp(term,'i'),entry.id+' ingredient '+term);
  // Ingredient quantities remain in the scaled list, not frozen in prose.
  assert.doesNotMatch(preparation,/\d+(?:[.,]\d+)?\s*(?:kg|g|cl|ml|litres?|cuillères?)\b/i,entry.id+' fixed ingredient quantity');
  recipe.p.forEach((step,index)=>{
    const actual=Array.from(context.stepTimerDurations(step));
    assert.deepEqual(actual,entry.timers[index],`${entry.id} step ${index+1}`);
    timerCount+=actual.length;
  });
  for(const count of [1,2,3,4,5,8]){
    const rendered=context.recipeHTML(recipe,{people:count,dayIndex:1,mealType:'eve'});
    assert.ok(!rendered.includes('undefined'),entry.id+' undefined UI field');
    for(const ingredient of recipe.i){
      const q=ingredient.q==null?null:entry.fixedYield?ingredient.q:ingredient.q*count/entry.baseServings;
      const expected=context.ingredientText(ingredient,q,count);
      assert.equal(context.ingredientTextForRecipe(ingredient,recipe,count),expected);
      assert.ok(rendered.includes('>'+expected+'</li>'),`${entry.id} ingredient ${ingredient.n} for ${count}`);
      quantityChecks++;
    }
    if(!entry.fixedYield)assert.match(rendered,/data-day="1" data-type="eve"/);
    const renderedTimers=[...rendered.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)]
      .map(([,index,minutes])=>[Number(index),Number(minutes)]);
    assert.deepEqual(renderedTimers,entry.timers.flatMap((durations,index)=>durations.map(minutes=>[index,minutes])));
    for(const step of recipe.p)assert.ok(rendered.includes(step));
  }
}

const timerCases=[
  ['Cuire 2 minutes de moins que le temps indiqué sur le paquet.',[]],
  ['Cuire 2 min de plus que le paquet.',[]],
  ['Cuire les pâtes 2 minutes de moins que le paquet, puis gratiner 12 minutes.',[12]],
  ['Cuire selon le paquet.',[]],
  ['Couper en morceaux de 2 cm.',[]],
  ['Cuire 6 à 8 minutes à 180 °C.',[8]],
  ['Cuire 3 minutes par face.',[3]],
  ['Poursuivre 2 minutes de plus si nécessaire.',[2]],
  ['Laisser reposer 3 minutes.',[3]]
];
for(const [step,expected] of timerCases)assert.deepEqual(Array.from(context.stepTimerDurations(step)),expected,step);
console.log(`✓ Editorial batch: 20 reviewed recipes, ${new Set(fixture.recipes.map(r=>r.method)).size} methods, ${timerCount} correctly attached timers`);
console.log(`✓ ${quantityChecks} ingredient/render checks at 1/2/3/4/5/8 people; original fixed-yield exception preserved`);
console.log('✓ 1553 ids/names/ingredient lists/reference portions and 1533 other recipes unchanged');
console.log('✓ Relative package times excluded; ranges, per-face and additional active durations preserved');
