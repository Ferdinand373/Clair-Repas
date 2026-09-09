import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {recipeSource} from './recipe-source.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const {code,recipes,editorial}=recipeSource(html);
const block=(a,b)=>code.slice(code.indexOf(a),code.indexOf(b,code.indexOf(a)+a.length));
const context={window:{},MEAL_TYPES:['mid','eve'],recipeRole:r=>r.role||r.course||'dish',
  recipeFeedbackHTML:()=>'<div>PERSONAL_FEEDBACK</div>',recipePersonalNoteHTML:()=>'<div>PERSONAL_NOTE</div>',isFavorite:()=>false};
vm.runInNewContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+
  block('function recipeText(','function inferFamily(')+'\n'+
  block('function escapeHTML(','let V73_NOTES_RAW')+'\n'+
  block('function formatQty(','function recipeFeedbackHTML(')+'\n'+
  block('function recipeHTML(','function recipeText('),context,{timeout:15000});
let renders=0;
for(const recipe of recipes){
  for(const count of [1,2,3,5,8]){
    const result=context.recipeHTML(recipe,{people:count,dayIndex:0,mealType:'mid'});
    assert.match(result,/class="recipe-reading"/);
    assert.match(result,/class="recipe-essential"/);
    assert.equal([...result.matchAll(/class="recipe-step-title"/g)].length,recipe.p.length,recipe.id);
    assert.ok(result.indexOf('PERSONAL_NOTE')>result.indexOf('</ol>'),'Notes remain accessible after the cooking instructions');
    assert.doesNotMatch(result,/\{\{qty:|>undefined<|>NaN</,recipe.id);
    if(editorial[recipe.id]?.reviewNote)assert.match(result,/class="recipe-review-note"/);
    else if(!editorial[recipe.id])assert.match(result,/précisions culinaires non encore vérifiées/);
    const buttons=[...result.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)];
    for(const [,step,minutes] of buttons)assert.ok(Array.from(context.stepTimerDurations(recipe.p[Number(step)])).includes(Number(minutes)));
    renders++;
  }
}
assert.equal(context.stepTimerLabel('Cuire 6 à 8 minutes.',8),'⏱ 6–8 min · repère à 8 min');
assert.equal(context.stepTimerLabel('Cuire 12 minutes.',12),'⏱ 12 min');
assert.deepEqual(Array.from(context.stepTimerDurations('Cuire 2 minutes de moins que le paquet.')),[]);
const grouped={id:'test-reading',n:'Test',m:'Sans cuisson',t:'5 min',servings:2,i:[{q:100,u:'g',n:'tomates'},{q:null,n:'basilic'}],p:['Mélanger {{qty:0}} de tomates.']};
context.grouped=grouped;
vm.runInNewContext(`RECIPE_EDITORIAL['test-reading']={intro:'Tomates et basilic.',titles:['Assembler'],times:{prep:'5 min',cook:'Sans cuisson',rest:null,total:'5 min'},groups:[{title:'Salade',ingredients:[0]},{title:'Finition',ingredients:[1]}],optionalIngredients:[1],tip:'<Ne pas interpréter du HTML>'};`,context);
const rendered=context.recipeHTML(grouped,{people:3});
assert.match(rendered,/150 g de tomates/);
assert.match(rendered,/basilic \(facultatif\)/);
assert.match(rendered,/&lt;Ne pas interpréter du HTML&gt;/);
assert.match(rendered,/ingredient-group-title">Salade/);
assert.match(context.recipeHTML({...grouped,role:'terrine'},{people:8}),/Rendement fixe · voir les quantités/);
console.log(`✓ ${renders} common recipe renders; legacy fallback, headings, quantities, attached timers and personal-note placement`);
console.log('✓ Explicit range labels, relative-time exclusion, groups, optional ingredients, HTML escaping and fixed-yield fallback');
