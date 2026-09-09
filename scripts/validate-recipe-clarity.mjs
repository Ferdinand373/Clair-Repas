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
  block('function escapeHTML(','let V73_NOTES_RAW')+'\n'+
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
  // Quantities in prose reference the scaled ingredient list, never fixed numbers.
  assert.doesNotMatch(preparation,/\d+(?:[.,]\d+)?\s*(?:kg|g|cl|ml|litres?|cuillères?)\b/i,entry.id+' fixed ingredient quantity');
  assert.doesNotMatch(preparation,/(?:un dixième|le quart|la moitié) (?:du|de la|des)/i,entry.id+' impractical fraction');
  for(const token of preparation.matchAll(/\{\{qty:(\d+)(?::(\d+(?:\.\d+)?))?\}\}/g)){
    assert.ok(recipe.i[Number(token[1])]?.q!=null,entry.id+' valid quantity reference');
    assert.ok(token[2]===undefined||(Number(token[2])>0&&Number(token[2])<=1));
  }
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
    assert.doesNotMatch(rendered,/\{\{|NaN|undefined/);
    for(const step of recipe.p)assert.ok(rendered.includes(context.recipeStepText(step,recipe,count)));
  }
}

// Concrete portions at the point of use, independently of the global default (8).
const byId=id=>recipes.find(r=>r.id===id);
for(const [count,cheese,broth,milk] of [[1,20,25,2.5],[2,40,50,5],[3,60,75,7.5],[4,80,100,10],[5,100,125,12.5],[8,160,200,20]]){
  assert.match(context.recipeStepText(byId('e11').p[2],byId('e11'),count),new RegExp(`${cheese} g de fromage.*${cheese} g de fromage`));
  assert.ok(context.recipeStepText(byId('a048').p[1],byId('a048'),count).includes(`${broth} cl de bouillon`));
  assert.ok(context.recipeStepText(byId('a048').p[3],byId('a048'),count).includes(`${context.formatQty(milk)} cl de lait`));
}
assert.equal(context.recipeStepText('{{qty:0:0.5}}',{servings:4,i:[{q:200,u:'g',n:'farine'}]},3),'75 g');
assert.equal(context.recipeStepText('{{qty:0:0.5}}',{role:'terrine',i:[{q:200,u:'g',n:'farine'}]},8),'100 g');
assert.equal(context.recipeStepText('{{qty:0}}',{i:[{q:null,n:'sel'}]},3),'la quantité indiquée dans les ingrédients');
assert.equal(context.recipeStepText('{{qty:99}}',byId('e11'),3),'la quantité indiquée dans les ingrédients');
for(const recipe of recipes.filter(r=>!selected.has(r.id))){
  for(const step of recipe.p)assert.equal(context.recipeStepText(step,recipe,5),step,'Untouched recipes retain their exact step text');
}

// Exercise the actual in-place refresh + meal setter with four independent slots.
const lines=[['0','mid'],['0','eve'],['1','mid'],['1','eve']].map(([day,type])=>({
  dataset:{recipeId:'e11',stepIndex:'2',day,type},textContent:''
}));
const globalLine={dataset:{recipeId:'e11',stepIndex:'2'},textContent:''};
context.plan=[{midPeople:2,evePeople:4},{midPeople:3,evePeople:2}];
context.peopleKey=type=>`${type}People`;
context.saveState=()=>{};
context.document={getElementById:()=>({value:'8'}),querySelectorAll:selector=>selector==='.recipe-step-quantities'?[...lines,globalLine]:[]};
vm.runInNewContext(block('function refreshPortionDisplays(','function bindRecipeControls('),context);
context.refreshPortionDisplays();
const original=lines.map(line=>line.textContent);
assert.deepEqual(original.map(text=>Number(text.match(/Répartir dessus (\d+) g/)[1])),[40,80,60,40]);
context.setMealPeopleCount(0,'eve',5,false);
assert.deepEqual(lines.map(line=>Number(line.textContent.match(/Répartir dessus (\d+) g/)[1])),[40,100,60,40]);
for(const index of [0,2,3])assert.equal(lines[index].textContent,original[index]);
assert.match(globalLine.textContent,/160 g de fromage/);
assert.deepEqual(context.plan,[{midPeople:2,evePeople:5},{midPeople:3,evePeople:2}]);

// Preserve original techniques and expose source gaps rather than inventing them.
for(const id of ['a048','e78','e92','n88','a038'])assert.match(byId(id).p[0],/^À vérifier/);
assert.match(byId('a048').p[1],/^Faire revenir l’oignon avec le curry/);
assert.doesNotMatch(byId('a048').p.join(' '),/Verser un dixième|cuire 4 minutes/);
assert.match(byId('e78').p[2],/^Poêler les dés de courgette/);
assert.match(byId('e92').p[2],/^Faire revenir les dés de poivron/);
assert.match(byId('n88').p[5],/^Une fois le saumon cuit et émietté, ajouter/);
assert.match(byId('e63').p[1],/sans couvercle au début pour les faire dorer/);
assert.match(byId('a088').p[3],/Laisser refroidir le quinoa avant/);
assert.match(byId('d036').p[3],/laisser refroidir avant de servir/);

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
console.log('✓ Concrete step quantities refresh per meal (2/4/3/2 → 2/5/3/2), fixed yields and other recipes preserved');
console.log('✓ Original techniques restored; 5 source gaps explicitly flagged in the application');
