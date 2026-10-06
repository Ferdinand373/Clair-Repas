import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {recipeSource} from './recipe-source.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8').replace(/\r\n/g,'\n');
const {code,recipes,editorial}=recipeSource(html);
const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const block=(a,b)=>{const start=code.indexOf(a),end=code.indexOf(b,start);assert.ok(start>=0&&end>start,a);return code.slice(start,end)};
// Published autumn catalogue: culinary content is guarded by validate-automne-gourmand; timer engine remains frozen.
assert.equal(hash(recipes.map(({thumbnail,...recipe})=>recipe)),'778091ead3a7e9def616d925c859f6d2d4166531c683f52a81cabdd63c51e3a4');
assert.equal(hash(editorial),'ea8cee3da46730ec8d379a160cd8680de50d4a147fc5a2cd0c896d6b9144b27b');
assert.equal(hash(readFileSync(resolve(root,'docs/recipe-editorial-inventory.json'),'utf8').replace(/\r\n/g,'\n')),'fb4e0549d4dea290e5aa66e4e9746866a3bead685b74d421336e3bf822453ca9');
assert.equal(hash(block('const TIMER_KEY=','// Keep the timer and recipe scroll clearance')),'df74d392eee3cf6755ea3c59794253f61e4f1cf55ef14e960c215e5c2bc6f965');
const modeCode=block('// Cooking is a read-only view','function bindRecipeControls(');
const wakeCode=block('let wakeLock=null;','const TIMER_KEY=');
assert.doesNotMatch(modeCode+wakeCode,/localStorage|sessionStorage|fetch\(|saveState\(|setPeopleCount\(|setMealPeopleCount\(/);
for(const [,attrs,script] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!attrs.includes('src=')&&!attrs.includes('application/'))new vm.Script(script);

const listeners=new Map(),elements=new Map();
const classes=()=>{const values=new Set();return {add:x=>values.add(x),remove:x=>values.delete(x),contains:x=>values.has(x)}};
const element=id=>{
  if(!elements.has(id))elements.set(id,{id,innerHTML:'',textContent:'',hidden:true,inert:false,dataset:{},attributes:new Map(),isConnected:true,focusCount:0,scrollCount:0,
    addEventListener(name,fn){listeners.set(id+':'+name,fn)},focus(){this.focusCount++},scrollIntoView(){this.scrollCount++},
    getAttribute(name){return this.attributes.get(name)??null},setAttribute(name,value){this.attributes.set(name,value)},removeAttribute(name){this.attributes.delete(name)}});
  return elements.get(id);
};
const timers=[],plan=[{midPeople:2,evePeople:4},{midPeople:3,evePeople:2}];
element('people').value='8';
const context={window:{addEventListener:(event,fn)=>listeners.set('window:'+event,fn)},navigator:{},
  document:{visibilityState:'visible',body:{classList:classes()},getElementById:element,querySelector:selector=>element(selector),addEventListener:(event,fn)=>listeners.set('document:'+event,fn)},
  $:element,MEAL_TYPES:['mid','eve'],plan,peopleKey:type=>`${type}People`,
  recipeRole:r=>r.role||r.course||'dish',isFavorite:()=>false,recipeFeedbackHTML:()=>'',recipePersonalNoteHTML:()=>'',
  startKitchenTimer:(...args)=>timers.push(args),recordPlanSelections(){},updateTimerUI(){},closeRecipeBrowser(){element('recipeBrowser').hidden=true}
};
vm.createContext(context);
vm.runInContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+
  block('function recipeText(','function inferFamily(')+'\n'+
  block('function escapeHTML(','let V73_NOTES_RAW')+'\n'+
  block('function formatQty(','function recipeFeedbackHTML(')+'\n'+
  block('function recipeHTML(','function recipeText(')+'\n'+modeCode+'\n'+wakeCode,context,{timeout:15000});
const settle=()=>new Promise(setImmediate);
const run=source=>vm.runInContext(source,context);
const open=(id='e06',day=0,type='mid')=>{
  const button=element('entry');button.dataset={cookingId:id,...(day===null?{}:{day:String(day),type})};context.openCookingMode(button);return button;
};
const click=dataset=>context.handleCookingAction({target:{closest:()=>({dataset,hasAttribute:name=>name==='data-cooking-view'&&'view' in dataset})}});
const view=()=>element('cookingContent').innerHTML;
const stage=()=>element('cookingStage').innerHTML;
const before=JSON.stringify(plan);
for(const [day,type,people] of [[0,'mid',2],[0,'eve',4],[1,'mid',3],[1,'eve',2]]){
  open('e06',day,type);
  assert.equal(context.cookingPeopleCount(),people);
  assert.match(view(),new RegExp(200*people+' g pommes de terre cuites'));
  assert.match(stage(),new RegExp(200*people+' g'));
  assert.match(stage(),/Étape 1 sur 4/);
  assert.match(stage(),/data-cooking-move="-1" disabled/);
  assert.doesNotMatch(stage(),/data-cooking-timer/);
  click({cookingMove:'1'});assert.match(stage(),/Étape 2 sur 4/);
  click({cookingMove:'-1'});assert.match(stage(),/Étape 1 sur 4/);
  for(let i=0;i<3;i++)click({cookingMove:'1'});
  assert.match(stage(),/Étape 4 sur 4/);assert.match(stage(),/data-cooking-move="1" disabled/);
  click({view:''});assert.match(stage(),/Toutes les étapes/);assert.equal((stage().match(/<li class="cooking-step">/g)||[]).length,4);
  click({view:''});assert.match(stage(),/Étape 4 sur 4/);
  context.closeCookingMode();
  assert.equal(element('cookingMode').hidden,true);assert.equal(element('main').inert,false);
  assert.equal(element('recipeBrowser').getAttribute('aria-hidden'),null);
}
assert.equal(JSON.stringify(plan),before,'Opening, reading and exiting never writes meal people counts');
plan[0].evePeople=5;
for(const [day,type,people] of [[0,'mid',2],[0,'eve',5],[1,'mid',3],[1,'eve',2]]){open('e06',day,type);assert.equal(context.cookingPeopleCount(),people);context.closeCookingMode()}
open('e06',null);assert.equal(context.cookingPeopleCount(),8);context.closeCookingMode();
const entryMarkup=context.recipeHTML(recipes.find(r=>r.id==='e06'),{people:4,dayIndex:0,mealType:'eve'});
assert.match(entryMarkup,/data-cooking-id="e06" data-day="0" data-type="eve"/);
assert.match(context.cookingTimerButtons('Cuire 12 minutes à 180 °C.',2),/data-cooking-timer="12" data-step-index="2"/);
assert.match(context.cookingTimerButtons('Cuire 6 à 8 minutes.',0),/6–8 min · repère à 8 min/);
for(const text of ['Cuire selon le paquet.','Cuire 2 minutes de moins que le paquet.','Cuire 1 h 30 minutes.','Cuire 1h30 minutes.','Cuire 1 minute 30 secondes.','Laisser reposer 90 s.'])assert.equal(context.cookingTimerButtons(text,0),'',text);
open('e06');click({cookingTimer:'12',stepIndex:'2'});
assert.equal(timers.length,1);assert.equal(timers[0][0].id,'e06');assert.deepEqual(timers[0].slice(1),[12,2]);
context.closeCookingMode();assert.equal(timers.length,1,'Exit does not stop or reset the existing timer');
open();let prevented=false,stopped=false;
listeners.get('document:keydown')({key:'Escape',preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});
assert.ok(prevented&&stopped);assert.equal(run('cookingView'),null);assert.ok(element('entry').focusCount>0);
element('recipeBrowser').hidden=false;open();
listeners.get('.premium-dock:click')({target:{closest:()=>({dataset:{premiumNav:'home'}})}});
assert.equal(run('cookingView'),null);assert.equal(element('recipeBrowser').hidden,true);assert.equal(element('main').inert,false);
context.testRecipe={id:'cooking-test',n:'<Titre>',i:[],p:[]};
run("recipeIndex.set(testRecipe.id,testRecipe)");open('cooking-test');
assert.match(view(),/&lt;Titre&gt;/);assert.match(view(),/Aucun ingrédient renseigné/);assert.match(stage(),/Aucune étape renseignée/);assert.doesNotMatch(stage(),/data-cooking-move/);
context.closeCookingMode();
context.testRecipe={id:'cooking-test',n:'Test',role:'terrine',i:[{q:100,u:'g',n:'carottes'}],p:['Mélanger {{qty:0}} de carottes.']};
run("recipeIndex.set(testRecipe.id,testRecipe)");open('cooking-test',null);
assert.match(view(),/rendement fixe/);assert.match(view(),/100 g carottes/);assert.doesNotMatch(stage(),/data-cooking-move/);context.closeCookingMode();

let cookingRenders=0;
for(const recipe of recipes){
  for(const [day,type] of [[0,'mid'],[0,'eve']]){
    open(recipe.id,day,type);click({view:''});
    assert.doesNotMatch(view()+stage(),/\{\{qty:|>undefined<|>NaN</,recipe.id);
    assert.equal((stage().match(/<li class="cooking-step">/g)||[]).length,recipe.p.length,recipe.id);
    if(editorial[recipe.id]?.reviewNote)assert.ok(view().includes(context.escapeHTML(editorial[recipe.id].reviewNote)),recipe.id);
    context.closeCookingMode();cookingRenders++;
  }
}

// Unsupported, rejected, released, hidden and racing Wake Lock requests.
open();await context.updateWakeLock();assert.match(element('cookingWakeStatus').textContent,/mise en veille/);context.closeCookingMode();
context.navigator.wakeLock={request:()=>Promise.reject(new Error('NotAllowedError'))};
open();await context.updateWakeLock();await settle();assert.equal(run('wakeLock'),null);context.closeCookingMode();
const sentinel=()=>({released:false,releaseCount:0,listener:null,addEventListener(name,fn){this.listener=fn},async release(){this.released=true;this.releaseCount++;this.listener?.()}});
let requests=0,locks=[];
context.navigator.wakeLock={request:async kind=>{assert.equal(kind,'screen');requests++;const lock=sentinel();locks.push(lock);return lock}};
open();await context.updateWakeLock();await settle();
assert.equal(requests,1,'Concurrent requests coalesce');assert.equal(run('wakeLock'),locks[0]);assert.match(element('cookingWakeStatus').textContent,/Écran maintenu allumé/);
context.document.visibilityState='hidden';listeners.get('document:visibilitychange')();await settle();assert.equal(locks[0].releaseCount,1);
context.document.visibilityState='visible';listeners.get('document:visibilitychange')();await settle();assert.equal(requests,2);assert.equal(run('wakeLock'),locks[1]);
listeners.get('window:pagehide')();await settle();assert.equal(locks[1].releaseCount,1);
listeners.get('window:pageshow')();await settle();assert.equal(requests,3);
await locks[2].release();assert.match(element('cookingWakeStatus').textContent,/mise en veille/);assert.equal(requests,3,'No retry loop after an OS release');
await context.updateWakeLock();context.closeCookingMode();await settle();assert.equal(locks[3].releaseCount,1);
let resolveOld,resolveNew;
context.navigator.wakeLock={request:()=>new Promise(resolve=>{resolveOld=resolve})};
open();context.closeCookingMode();
context.navigator.wakeLock={request:()=>new Promise(resolve=>{resolveNew=resolve})};
open();const oldLock=sentinel(),newLock=sentinel();resolveNew(newLock);await settle();resolveOld(oldLock);await settle();await settle();
assert.equal(oldLock.releaseCount,1,'Late request after exit is released');assert.equal(run('wakeLock'),newLock,'Late completion must not clear the current lock');
context.closeCookingMode();assert.equal(newLock.releaseCount,1);
open();context.closeCookingMode();const afterClose=sentinel();resolveNew(afterClose);await settle();await settle();assert.equal(afterClose.releaseCount,1);
assert.equal(run('wakeLock'),null);assert.equal(run('wakeLockRequest'),null);
assert.match(html,/body\.timer-running \.cooking-page\{padding-bottom:var\(--timer-clearance\)/);
assert.match(html,/\.cooking-page button,\.cooking-page summary\{min-height:48px/);
assert.match(html,/safe-area-inset-top,0px/);
console.log('✓ Cooking mode: contextual 2/4/3/2 → 2/5/3/2 quantities, independent library portions, fixed yield, ordered steps, full view, missing data and existing timer delegation');
console.log('✓ '+cookingRenders+' cooking renders at 2/5 people, all sourced steps and editorial reservations retained');
console.log('✓ Wake Lock: unsupported/refused API, coalescing, visibility, page lifecycle, OS release, exit and late-request races');
console.log('✓ 1554 recipes and approved autumn metadata/inventory verified; timer engine unchanged; no new storage, sync or personal-data writes');
