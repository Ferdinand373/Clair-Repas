import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {recipeSource} from './recipe-source.mjs';
import {recipeHash} from './validate-recipe-editorial.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {code,recipes,editorial}=recipeSource(readFileSync(resolve(root,'index.html'),'utf8'));
const batchNumbers=['02','03','04','05','06'];
const fixture={recipes:batchNumbers.flatMap(number=>JSON.parse(readFileSync(resolve(root,`scripts/recipe-editorial-batch-${number}.fixture.json`),'utf8')).recipes)};
const slice=(a,b)=>code.slice(code.indexOf(a),code.indexOf(b,code.indexOf(a)+a.length));
const context={window:{},$:()=>({value:'8'}),MEAL_TYPES:['mid','eve'],recipeRole:r=>r.role||r.course||'dish',isFavorite:()=>false,recipeFeedbackHTML:()=>'',recipePersonalNoteHTML:()=>''};
vm.runInNewContext(code.slice(0,code.indexOf("$('libraryCount').textContent="))+'\n'+
  slice('function recipeText(','function inferFamily(')+'\n'+
  slice('function escapeHTML(','let V73_NOTES_RAW')+'\n'+
  slice('function formatQty(','function recipeFeedbackHTML(')+'\n'+
  slice('function recipeHTML(','function recipeText('),context,{timeout:15000});
// Independent manual expectations: a range is its stated upper reference,
// each face has its own action, package-dependent times have no fixed button.
const timers={
  n01:[[],[15],[],[20],[]],n02:[[],[15],[10],[10],[3]],n06:[[],[],[],[]],
  n10:[[],[],[],[5],[]],n15:[[],[],[],[]],n16:[[],[],[15],[],[]],
  n18:[[],[],[8],[8],[]],n19:[[],[6],[4],[20],[],[]],n20:[[],[8],[5],[]],
  n21:[[],[10],[9],[9],[3]],n12:[[],[],[],[]],n13:[[],[20],[],[2,3],[]],
  n22:[[],[12],[25],[]],n24:[[],[8],[5,3],[]],n25:[[],[],[],[],[]],
  n28:[[],[15],[],[18],[3]],n29:[[],[],[],[]],n30:[[],[],[],[]],
  n31:[[],[],[10],[]],n32:[[],[],[4],[4]],n34:[[20],[],[12],[15],[]],a038:[[],[],[],[]],
  n35:[[],[7],[4],[4],[]],n39:[[],[4],[6],[12],[5],[]],n41:[[],[],[25],[],[3]],
  n43:[[],[],[15],[3]],n44:[[],[],[],[],[]],n46:[[],[],[],[]],n47:[[],[],[],[]],
  n48:[[],[],[],[]],n51:[[],[],[9],[]],n53:[[],[],[],[20]],n56:[[],[15],[],[18]],
  n59:[[],[],[12],[10],[]],n61:[[],[],[],[2],[3]],n63:[[],[],[15],[]],
  n74:[[],[],[]],n76:[[],[],[35],[]],n80:[[],[20],[],[]],n81:[[],[18],[5],[3]],
  n82:[[18],[],[],[4],[4]],n84:[[],[],[25],[]],n98:[[],[],[25]],n99:[[15],[],[12],[]],
  d001:[[],[],[]],d002:[[],[],[]],d003:[[],[],[]],d004:[[],[],[]],d005:[[],[],[]],
  d006:[[],[],[]],d007:[[],[],[]],d008:[[],[],[]],d009:[[],[],[]],d011:[[],[],[]],
  d012:[[],[],[]],d013:[[],[],[5]],d014:[[],[],[]],d015:[[],[],[]],d016:[[],[],[]],
  d017:[[],[10],[]],d019:[[],[],[]],d020:[[],[],[]],d021:[[],[],[]],d022:[[],[],[]],
  d023:[[],[],[]],d024:[[],[10],[],[]],d025:[[],[],[]],d026:[[],[],[28]],
  d027:[[],[],[22]],d029:[[],[15],[3]],d031:[[],[],[12]]
};
const ingredients={
  n01:['poulet','pommes de terre','paprika','huile','sel.*poivre'],
  n02:['échines','courgette','poivron','oignon','beurre ou d’huile','saler.*poivrer'],
  n06:['saucisses','courgette','poivron','oignon','huile','sel.*poivre'],
  n10:['pâtes','poulet','tomates','ail','basilic','huile d’olive'],
  n15:['pommes de terre','knacks','oignon','salade','beurre ou d’huile','persil'],
  n16:['saumon','pommes de terre','crème','aneth','citron','saler.*poivrer'],
  n18:['poulet','semoule','carottes','citron','huile.*herbes','saler.*poivrer'],
  n19:['spaghetti','bœuf','œuf','chapelure','tomates concassées','oignon','ail','huile d’olive','origan','parmesan','sel.*poivre'],
  n20:['crevettes','riz','courgette','ail','citron','huile.*persil'],
  n21:['côtes','pommes de terre','tomates','oignon','beurre ou d’huile','saler.*poivrer'],
  n12:['steaks','pommes de terre','salade','échalote','beurre','saler.*poivrer'],
  n13:['magret','courgettes','miel','vinaigre balsamique','saler.*poivrer'],
  n22:['cuisses','pommes de terre','carottes','paprika','huile','sel.*poivre'],
  n24:['bœuf','nouilles','poivron','oignon','sauce soja','huile'],
  n25:['œufs','pommes de terre','oignon','salade','huile','sel.*poivre'],
  n28:['côtes','pommes de terre','carottes','miel','moutarde','saler.*poivrer'],
  n29:['chipolatas','ratatouille','semoule','oignon','huile','herbes de Provence'],
  n30:['merguez','poivrons','oignon','semoule','huile','cumin'],
  n31:['boulettes','riz','courgette','coulis','oignon','huile'],
  n32:['thon','pommes de terre','tomates','citron','huile d’olive','basilic'],
  n34:['truite','pommes de terre','haricots','citron','aneth','huile'],
  a038:['concombre','yaourt','citron','aneth','huile d’olive','sel et du poivre'],
  n35:['crevettes','riz','lait de coco','curry','courgette','ail','huile','coriandre','sel'],
  n39:['bœuf','haricots','tomates concassées','riz','oignon','ail','cumin','paprika','piment','huile','sel'],
  n41:['filet mignon','pâtes','tomates','mozzarella','basilic','huile'],
  n43:['porc','poivrons','oignon','riz','huile.*paprika','sel.*poivre'],
  n44:['saucisses','pommes de terre','oignons','lait','beurre','moutarde'],
  n46:['œufs','pommes de terre','lardons','oignon','persil','poivrer.*saler'],
  n47:['tortellini','coulis','mozzarella','courgette','basilic','huile'],
  n48:['poulet','quinoa','tomates','concombre','feta','vinaigrette'],
  n51:['pain','poulet','tomate','fromage','salade','moutarde'],
  n53:['ravioles','courgette','jambon','crème','fromage','poivre.*sel'],
  n56:['poulet','pommes de terre','citron','ail','huile.*thym','sel.*poivre'],
  n59:['saumon','riz','brocoli','sauce soja','miel','sésame'],
  n61:['bœuf','pommes de terre','oignons','sauce soja','huile','poivrer'],
  n63:['poulet','semoule','poivron','oignon','curry','yaourt'],
  n74:['pâtes déjà cuites','poulet déjà cuit','salade','tomates','parmesan','sauce César'],
  n76:['viande hachée','œuf','chapelure','oignon','pommes de terre','ketchup'],
  n80:['poulet','spaghetti','coulis','parmesan','chapelure','basilic'],
  n81:['porc','mozzarella','tomates','courgette','origan','saler.*poivrer'],
  n82:['thon','pommes de terre','œuf','chapelure','poivrons','tomates','citron','persil','huile'],
  n84:['courgettes','jambon','fromage','semoule','crème','herbes'],
  n98:['poulet','pesto','mozzarella','tomates','pommes de terre','saler.*poivrer'],
  n99:['cabillaud','parmesan','chapelure','pommes de terre','citron','persil'],
  d001:['fraises','citron','menthe','sucre'],
  d002:['fraises','framboises','myrtilles','citron','basilic'],
  d003:['melon','citron vert','menthe'],d004:['pastèque','citron','menthe'],
  d005:['pêches','framboises','citron','miel'],d006:['nectarines','citron','miel','thym citron'],
  d007:['abricots','miel','citron','lavande alimentaire'],d008:['ananas','citron vert','menthe'],
  d009:['oranges','cannelle','miel','menthe'],d011:['kiwis','pomme','citron','miel'],
  d012:['poires','chocolat noir','citron'],d013:['pommes','raisins secs','cannelle','citron'],
  d014:['raisin','noix','miel'],d015:['mangue','fruits de la passion','citron vert'],
  d016:['bananes','citron','cacao non sucré'],d017:['fraises','vinaigre balsamique','sucre','basilic'],
  d019:['cerises','amandes','citron'],d020:['prunes','citron','menthe','miel'],
  d021:['figues','noix','miel'],d022:['kakis','orange','citron'],
  d023:['clémentines','grenade','menthe'],d024:['rhubarbe','fraises','sucre','eau'],
  d025:['ananas','mangue','banane','citron vert'],d026:['pommes','miel','cannelle','eau'],
  d027:['poires','miel','vanille','eau'],d029:['abricots','amandes effilées','miel','eau'],
  d031:['bananes','chocolat noir','noix de coco']
};
assert.equal(fixture.recipes.length,155);
let quantityChecks=0,timerCount=0;
for(const record of fixture.recipes){
  const recipe=recipes.find(r=>r.id===record.id);
  assert.equal(recipeHash(recipe),record.reviewedHash,record.id+' approved content');
  const protectedRecipe={...recipe};delete protectedRecipe.p;delete protectedRecipe.t;
  assert.equal(recipeHash(protectedRecipe),record.protectedRecipeSha256,record.id+' identity, ingredients and servings');
  if(record.status==='blocked'){
    assert.equal(record.reviewedHash,record.sourceHash,record.id+' uncertain culinary content was not rewritten');
    assert.match(editorial[record.id].reviewNote,/À vérifier/);
    continue;
  }
  assert.ok(!editorial[record.id].reviewNote,record.id+' no essential reservation');
  assert.equal(ingredients[record.id].length,recipe.i.length,record.id+' one manual ingredient term per ingredient');
  for(const term of ingredients[record.id])assert.match(recipe.p.join(' '),new RegExp(term,'i'),record.id+' ingredient '+term);
  assert.equal(timers[record.id].length,recipe.p.length,record.id+' timer steps');
  recipe.p.forEach((step,index)=>{
    assert.deepEqual(Array.from(context.stepTimerDurations(step)),timers[record.id][index],record.id+' timer step '+(index+1));
    timerCount+=timers[record.id][index].length;
  });
  for(const count of [1,2,3,4,5,8]){
    const output=context.recipeHTML(recipe,{people:count,dayIndex:1,mealType:'eve'});
    for(const ingredient of recipe.i){
      const quantity=ingredient.q==null?null:ingredient.q*count/(recipe.servings||2);
      const text=context.ingredientText(ingredient,quantity,count);
      assert.equal(context.ingredientTextForRecipe(ingredient,recipe,count),text);
      assert.ok(output.includes('>'+text+'</li>'),record.id+' '+count+' people ingredient '+ingredient.n);
      quantityChecks++;
    }
    assert.doesNotMatch(output,/\{\{|undefined|NaN/);
    const attached=[...output.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)].map(([,step,min])=>[+step,+min]);
    assert.deepEqual(attached,timers[record.id].flatMap((mins,step)=>mins.map(min=>[step,min])));
  }
}
const meatballs=recipes.find(r=>r.id==='n19');
for(const [count,share] of [[1,'7½'],[2,'15'],[3,'22½'],[4,'30'],[5,'37½'],[8,'60']]){
  assert.ok(context.recipeStepText(meatballs.p[0],meatballs,count).includes(share+' g de parmesan'));
  assert.ok(context.recipeStepText(meatballs.p[5],meatballs,count).includes(share+' g de parmesan'));
}
assert.match(meatballs.p[0],/4 cm/);
assert.doesNotMatch(meatballs.p.join(' '),/huit boulettes|5 cl|la moitié du/);
assert.match(recipes.find(r=>r.id==='n25').p[3],/retourner l’ensemble/);
assert.match(recipes.find(r=>r.id==='n28').p[1],/ne prévoit pas d’huile/);
const patties=recipes.find(r=>r.id==='n82');
assert.deepEqual(patties.i.at(-1),{q:null,u:'',n:'huile',k:'huile'});
assert.match(fixture.recipes.find(r=>r.id==='n82').beforeSteps.join(' '),/poêle légèrement huilée/);
assert.match(recipes.find(r=>r.id==='n74').p[0],/pas des poids crus/);
assert.match(recipes.find(r=>r.id==='n80').p[1],/Aucun œuf ni passage à la poêle/);
assert.match(recipes.find(r=>r.id==='n81').p[3],/63 °C/);
assert.match(recipes.find(r=>r.id==='n99').p[2],/sans retourner le poisson/);
assert.doesNotMatch(recipes.find(r=>r.id==='d016').p.join(' '),/deux coupelles/);
assert.match(recipes.find(r=>r.id==='d017').t,/repos \+ préparation/);
assert.match(recipes.find(r=>r.id==='d024').t,/refroidissement/);
assert.match(recipes.find(r=>r.id==='d024').p[2],/sans remettre sur le feu/);
assert.match(recipes.find(r=>r.id==='d029').p[2],/toutes les amandes.*3 minutes/);
assert.match(recipes.find(r=>r.id==='d031').p[0],/sans percer la peau du dessous/);
const corrected=fixture.recipes.filter(r=>r.status==='corrected').length;
console.log(`✓ Batches ${batchNumbers.join('/')}: ${fixture.recipes.length} individual review records, ${corrected} corrected, ${fixture.recipes.length-corrected} blocked with original content preserved; ${timerCount} manually checked timers`);
console.log(`✓ ${quantityChecks} ingredient checks at 1/2/3/4/5/8 people; split parmesan quantities, per-face timing and original cooking techniques`);
