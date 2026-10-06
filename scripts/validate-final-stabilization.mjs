import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {recipeSource} from './recipe-source.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const {code}=recipeSource(html);
const block=(start,end)=>{const a=code.indexOf(start),b=code.indexOf(end,a);assert.ok(a>=0&&b>a,start);return code.slice(a,b);};
const catalog={window:{}};
vm.runInNewContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+
  block('function recipeText(','function inferFamily(')+'\n'+
  block('const recipeSearchCache=','function seasonalRecipeScore(')+'\n'+
  block('function bookRecipeText(','const BOOK_MOODS=')+
  '\nthis.meat=recipeLibrary.filter(BOOK_SHELVES.find(s=>s.id==="meat").filter).map(r=>r.id);'+
  '\nthis.categories=Object.fromEntries(recipeLibrary.map(r=>[r.id,recipeSearchData(r).categories]));',
  catalog,{timeout:15000});
// Regression: "veau" inside "nouveau/nouveaux" must not classify vegetables as meat.
const vegetableIds=['v75-chef-ducasse-01','veg-final-59','veg-l1-15','v31n-croustillant-coleslaw-saumon','veg-final-23','veg-l1-06','veg-final-34','v31e-crumble-sale-poulet','v31e-bouillon-nouilles-cotes-porc','veg-l1-02','v31e-crumble-sale-poisson-blanc'];
for(const id of vegetableIds){assert.ok(!catalog.meat.includes(id),id);assert.doesNotMatch(catalog.categories[id],/\bviandes?\b/,id);}
for(const id of ['v39-boeuf-bourguignon','v39-blanquette-veau','n97'])assert.ok(catalog.meat.includes(id),id+' remains in the meat chapter');

// Execute the production dock click handler with an open recipe overlay.
const buttons=['home','plan','book','favorites'].map(view=>({dataset:{premiumNav:view},classList:{toggle(name,value){this.active=value;}}}));
const dock={dataset:{},querySelectorAll:()=>buttons,addEventListener(event,handler){this.handler=handler;}};
const overlay={hidden:false},calls=[];
const navContext={
  document:{querySelector(selector){return selector==='.premium-dock'?dock:{scrollIntoView:()=>calls.push('plan')};},getElementById(id){return {click:()=>calls.push(id)};}},
  window:{scrollTo:()=>calls.push('home')},
  $:()=>overlay,
  closeRecipeBrowser(){overlay.hidden=true;calls.push('close');}
};
vm.runInNewContext(code.slice(code.indexOf('function setPremiumDockView(')),navContext);
for(const view of ['home','plan']){
  overlay.hidden=false;calls.length=0;
  dock.handler({target:{closest:()=>buttons.find(b=>b.dataset.premiumNav===view)}});
  assert.ok(overlay.hidden,view+' closes the overlay');
  assert.deepEqual(calls,['close',view]);assert.equal(dock.dataset.mainView,view);
  assert.equal(buttons.filter(b=>b.classList.active).length,1);
}
for(const view of ['book','favorites']){
  calls.length=0;dock.handler({target:{closest:()=>buttons.find(b=>b.dataset.premiumNav===view)}});
  assert.deepEqual(calls,[view==='book'?'chooseRecipe':'openFavorites']);
  assert.equal(buttons.filter(b=>b.classList.active).length,1);
}
console.log('PASS: 11 false meat classifications excluded; real meat retained; Home/Programme dismiss the recipe overlay; dock targets and active states preserved.');
