import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {recipeSource} from './recipe-source.mjs';
import {recipeHash} from './validate-recipe-editorial.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {code,recipes,editorial}=recipeSource(readFileSync(resolve(root,'index.html'),'utf8'));
const batchNumbers=['02','03','04','05','06','07','08','09','10','11','12','13'];
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
  d027:[[],[],[22]],d029:[[],[15],[3]],d031:[[],[],[12]],
  a001:[[],[],[]],a002:[[],[],[]],a004:[[],[],[5]],a005:[[],[],[]],
  a006:[[],[],[]],a007:[[],[],[10]],a009:[[],[],[]],a010:[[],[],[]],
  a011:[[20],[],[]],a012:[[22],[],[10]],a013:[[],[],[]],a014:[[],[],[]],
  a015:[[],[],[]],a016:[[],[],[]],a017:[[],[9],[12],[],[]],
  a020:[[],[],[]],a021:[[],[],[]],a025:[[],[],[]],a026:[[9],[],[]],a029:[[],[],[],[25]],
  d032:[[],[],[18]],d033:[[],[],[12]],d034:[[],[18],[]],d035:[[],[18],[]],
  d037:[[],[15],[]],d038:[[],[15],[]],d039:[[],[12],[]],d040:[[],[],[20]],
  d041:[[],[],[10]],d042:[[],[],[25]],d043:[[],[],[25]],d045:[[],[],[12]],
  d046:[[],[],[]],d048:[[],[],[]],d049:[[],[],[]],d050:[[],[],[]],
  d051:[[],[],[]],d052:[[],[],[]],d053:[[],[],[]],d054:[[],[],[]],
  d055:[[],[],[]],d056:[[],[],[]],d057:[[],[],[],[20]],d060:[[],[],[]],d063:[[],[],[30],[]],
  a036:[[],[],[]],a037:[[],[],[30]],a039:[[],[],[]],a043:[[],[25],[]],
  a046:[[],[20],[]],a047:[[],[15],[]],a053:[[],[20],[]],a058:[[],[20],[]],a062:[[18],[],[]],
  d065:[[],[4],[],[],[],[]],d066:[[],[],[]],d067:[[],[],[]],d068:[[],[],[]],
  d069:[[],[],[30],[]],d070:[[],[],[30]],d071:[[],[],[30]],d072:[[],[],[30],[]],
  d073:[[2],[35],[]],d074:[[],[8],[]],d075:[[],[],[]],d077:[[],[],[],[2],[2],[]],
  d082:[[],[],[32]],d083:[[],[],[32]],d085:[[],[],[],[],[40],[20]],d086:[[],[],[35]],
  d087:[[],[],[30]],d088:[[],[],[30]],d089:[[],[],[20]],d091:[[],[],[30]],d092:[[],[20],[12]],d093:[[],[],[14]],
  a064:[[5],[],[]],a068:[[],[],[25]],a069:[[],[],[3],[3]],a071:[[],[],[14]],
  a074:[[],[],[7],[]],a075:[[],[4],[1],[]],a077:[[9],[],[],[3],[3]],
  a080:[[22],[],[]],a082:[[],[],[]],a084:[[],[20],[5]],a085:[[15],[],[]],a086:[[],[],[]],a093:[[],[],[30],[]]
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
  d031:['bananes','chocolat noir','noix de coco'],
  a001:['tomates','échalote','basilic','huile d’olive','vinaigre balsamique','sel.*poivre'],
  a002:['concombre','yaourt nature','citron','menthe','sel.*poivre'],
  a004:['carottes','orange','cumin','huile d’olive','sel.*poivre'],
  a005:['betteraves cuites','pomme','noix','vinaigre de cidre','huile de noix','sel.*poivre'],
  a006:['céleri-rave','moutarde','fromage blanc','citron','persil','poivre'],
  a007:['chou rouge','pomme','vinaigre de cidre','huile','miel'],
  a009:['fenouil','orange','olives','huile d’olive','sel.*poivre'],
  a010:['courgette','parmesan','citron','huile d’olive','sel.*poivre'],
  a011:['poivrons','ail','persil','huile d’olive','sel.*poivre'],
  a012:['aubergine','citron','ail','menthe','huile d’olive'],
  a013:['chou-fleur','tomates','concombre','citron','persil et la menthe'],
  a014:['melon','jambon cru','poivrer','basilic'],a015:['pastèque','feta','menthe','citron'],
  a016:['tomates','pêches','mozzarella','basilic','huile d’olive','poivre'],
  a017:['asperges','œufs','moutarde','vinaigre','huile'],
  a020:['avocat','crevettes déjà cuites','citron','fromage blanc','ciboulette','poivrer'],
  a021:['pamplemousse','avocat','crevettes déjà cuites','huile d’olive','poivrer'],
  a025:['maquereau fumé','pomme','citron','fromage blanc','aneth'],
  a026:['œufs','moutarde','fromage blanc','ciboulette'],a029:['courgette','œufs','lait','parmesan','basilic'],
  d032:['prunes','miel','cannelle','eau'],d033:['figues','miel','noix','cannelle'],
  d034:['pommes','eau','cannelle'],d035:['pommes','poires','eau','vanille'],
  d037:['abricots','sucre','vanille','eau'],d038:['prunes','sucre','cannelle'],
  d039:['pêches','sucre','verveine','eau'],d040:['poires','sucre','eau','vanille','citron'],
  d041:['oranges','pamplemousse','miel','cannelle'],d042:['pommes','farine','flocons d’avoine','beurre','sucre','cannelle'],
  d043:['fruits rouges','farine','beurre','sucre','poudre d’amande'],d045:['bananes','orange','raisins secs','cannelle'],
  d046:['yaourts nature','miel','noix'],d048:['fromage blanc','fraises','sucre','menthe'],
  d049:['fromage blanc','poires','vanille','miel'],d050:['yaourt grec','pêches','miel','amandes effilées'],
  d051:['faisselle','fruits rouges','miel'],d052:['skyr','pomme','cannelle','miel'],
  d053:['petits-suisses','abricots','miel'],d054:['yaourts nature','mangue','citron vert'],
  d055:['yaourts nature','framboises','granola','miel'],d056:['fromage blanc','kiwis','citron vert','miel'],
  d057:['yaourt grec','citron','miel','blanc d’œuf'],d060:['poires','fromage blanc','spéculoos','vanille'],
  d063:['lait','œufs','sucre','vanille','caramel'],
  a036:['concombre','yaourt grec','ail','citron','aneth','saler'],
  a037:['tomates','poivron rouge','concombre','vinaigre','huile d’olive','sel.*poivre'],
  a039:['melon','citron','basilic','huile d’olive','sel'],
  a043:['poireaux','pommes de terre','oignon','bouillon','poivre'],
  a046:['tomates','oignon','bouillon','basilic','huile d’olive'],
  a047:['carotte','poireau','courgette','bouillon','vermicelles'],
  a053:['endives','pomme de terre','bouillon','crème légère','muscade'],
  a058:['fenouil','tomates','oignon','bouillon','basilic'],
  a062:['poireaux','moutarde','vinaigre','huile','ciboulette'],
  d065:['chocolat noir','œufs','beurre','sucre','sel'],
  d066:['fromage blanc','citron','blancs d’œufs','sucre'],
  d067:['framboises','fromage blanc','blancs d’œufs','sucre'],
  d068:['mangue','crème entière','citron vert','sucre'],
  d069:['lait','œufs','sucre','vanille'],d070:['lait de coco','de lait','œufs','sucre','noix de coco râpée'],
  d071:['pommes','œufs','lait','sucre','farine'],d072:['lait','œufs','sucre','vanille'],
  d073:['riz rond','lait','sucre','vanille'],d074:['semoule fine','lait','sucre','fleur d’oranger'],
  d075:['tapioca','lait','sucre','vanille'],d077:['œufs','lait','sucre','vanille','caramel'],
  d082:['pâte brisée','poires','poudre d’amande','sucre','œuf','beurre'],
  d083:['pâte brisée','abricots','sucre','poudre d’amande'],
  d085:['cerises','œufs','sucre','farine','lait','crème liquide','beurre','vanille'],
  d086:['poires','œufs','lait','farine','sucre','vanille'],
  d087:['yaourt nature','œufs','farine','sucre','huile','citron','levure chimique'],
  d088:['pommes','œufs','farine','sucre','beurre','levure chimique'],
  d089:['chocolat noir','beurre','œufs','sucre','farine'],
  d091:['œufs','farine','sucre','beurre','chocolat noir','vanille','levure chimique'],
  d092:['œufs','farine','sucre','beurre','citron','levure chimique'],
  d093:['blancs d’œufs','poudre d’amande','sucre glace','farine','beurre'],
  a064:['pain','tomates','ail','basilic','huile d’olive'],
  a068:['tomates cerises','œufs','lait','farine','basilic','sel.*poivre'],
  a069:['courgette','œuf','farine','persil.*ciboulette','huile','saler'],
  a071:['poisson blanc déjà cuit','farine','œuf','oignon nouveau','persil','paprika'],
  a074:['moules','échalote','vin blanc','persil','beurre'],
  a075:['calamar','ail','persil','citron','huile d’olive'],
  a077:['feuilles de brick','thon','œufs','persil','citron','huile'],
  a080:['pommes de terre grenaille','yaourt nature','citron','ciboulette.*persil','huile','sel.*poivre'],
  a082:['champignons de Paris','parmesan','citron','huile d’olive','persil','sel.*poivre'],
  a084:['courge','noisettes','miel','thym','huile'],
  a085:['poireaux','saumon fumé','fromage blanc','citron','aneth'],
  a086:['avocat','orange','pamplemousse','graines de courge','huile d’olive','sel.*poivre'],
  a093:['saumon','œufs','crème légère','citron','aneth']
};
assert.equal(fixture.recipes.length,365);
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
      const quantity=ingredient.q==null?null:context.recipeHasFixedYield(recipe)?ingredient.q:ingredient.q*count/(recipe.servings||2);
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
const restoredSeasonings={a001:'sel et poivre',a002:'sel et poivre',a004:'sel et poivre',a005:'sel et poivre',a006:'poivre',a009:'sel et poivre',a010:'sel et poivre',a011:'sel et poivre',a016:'poivre',a020:'poivre',a021:'poivre'};
for(const [id,n] of Object.entries(restoredSeasonings)){
  assert.deepEqual(recipes.find(r=>r.id===id).i.at(-1),{q:null,u:'',n,k:n});
  const before=fixture.recipes.find(r=>r.id===id).beforeSteps.join(' ');
  assert.match(before,/poivr/i,id+' seasoning explicitly in the source');
  if(n==='sel et poivre')assert.match(before,/\bsel\b|saler/i);
}
assert.match(recipes.find(r=>r.id==='a012').p[0],/Garder toute l’huile pour la marinade/);
assert.match(recipes.find(r=>r.id==='a012').p[1],/Pendant cette cuisson/);
assert.match(recipes.find(r=>r.id==='a017').p[2],/En parallèle/);
assert.match(recipes.find(r=>r.id==='a017').p[3],/Pendant les cuissons/);
assert.doesNotMatch(recipes.find(r=>r.id==='a029').p.join(' '),/deux ramequins/);
assert.match(recipes.find(r=>r.id==='a029').p[3],/71 °C/);
for(const id of ['a023','a030'])assert.equal(recipes.find(r=>r.id===id).role,'terrine');
assert.match(editorial['gn-poulet-curry-doux'].reviewNote,/Ne pas servir froide une marinade ayant touché du poulet cru/);
assert.match(editorial['gn-saumon-poireaux-creme'].reviewNote,/température/);
assert.match(editorial['gn-boeuf-soja-miel'].reviewNote,/gingembre.*absent/);
for(const [count,grams] of [[1,'50'],[2,'100'],[3,'150'],[4,'200'],[5,'250'],[8,'400']]){
  const faisselle=recipes.find(r=>r.id==='d051');
  const rendered=context.recipeStepText(faisselle.p[0],faisselle,count);
  assert.equal(rendered.split(grams+' g de fruits rouges').length-1,2,'equal coulis and garnish shares at '+count+' people');
}
assert.match(recipes.find(r=>r.id==='d054').p[0],/\{\{qty:1:0\.5\}\}/);
assert.doesNotMatch(recipes.find(r=>r.id==='d046').p.join(' '),/deux coupelles/);
assert.match(recipes.find(r=>r.id==='d039').p[1],/\{\{qty:2\}\} de verveine/);
assert.match(recipes.find(r=>r.id==='d056').p[1],/le zeste, pas le jus/);
assert.match(recipes.find(r=>r.id==='d057').p[0],/blanc d’œuf pasteurisé/);
assert.match(recipes.find(r=>r.id==='d057').t,/20 min au frais/);
assert.doesNotMatch(recipes.find(r=>r.id==='d063').p.join(' '),/deux ramequins/);
assert.match(recipes.find(r=>r.id==='d063').p[2],/71 °C/);
for(const [id,n,proof] of [['a036','sel',/le saler/],['a037','sel et poivre',/sel et le poivre/],['a043','poivre',/poivrer généreusement/]]){
  assert.deepEqual(recipes.find(r=>r.id===id).i.at(-1),{q:null,u:'',n,k:n});
  assert.match(fixture.recipes.find(r=>r.id===id).beforeSteps.join(' '),proof);
}
for(const [id,n,step] of [['a039','sel',1],['a053','muscade',2]]){
  const recipe=recipes.find(r=>r.id===id);
  assert.deepEqual(recipe.i[4],{q:1,u:'pincée',n,k:n});
  assert.match(fixture.recipes.find(r=>r.id===id).beforeSteps.join(' '),new RegExp('une pincée de '+n));
  for(const [count,quantity] of [[1,'½'],[2,'1'],[3,'1½'],[4,'2'],[5,'2½'],[8,'4']]){
    assert.ok(context.recipeStepText(recipe.p[step],recipe,count).includes(quantity+' pincée'),id+' sourced pinch scales at '+count+' people');
  }
}
assert.match(recipes.find(r=>r.id==='a037').t,/30 min au frais/);
assert.match(recipes.find(r=>r.id==='a046').p[1],/huile d’olive.*Ajouter l’oignon.*Ajouter les tomates/);
assert.match(recipes.find(r=>r.id==='a047').p[2],/temps indiqué sur leur paquet/);
assert.match(recipes.find(r=>r.id==='a058').p[1],/sans les faire revenir/);
assert.match(recipes.find(r=>r.id==='a058').p[2],/garder des morceaux/);
assert.match(recipes.find(r=>r.id==='a062').p[0],/panier vapeur.*ou les plonger.*15 à 18 minutes/);
assert.match(editorial['gn-saumon-grillade-mais'].reviewNote,/feuille de cuisson.*compatible.*barbecue/);
assert.match(editorial['gn-boeuf-ratatouille'].reviewNote,/Ne pas servir crue une sauce ayant touché la viande crue/);
assert.match(editorial['gn-crevettes-ratatouille'].reviewNote,/basilic.*manque/);
assert.match(editorial['gn-cotes-porc-champignons-polenta'].reviewNote,/liquide.*polenta.*ail.*rôti/);
const islands=recipes.find(r=>r.id==='d077');
for(const [count,share] of [[1,'15'],[2,'30'],[3,'45'],[4,'60'],[5,'75'],[8,'120']]){
  for(const step of [0,2])assert.ok(context.recipeStepText(islands.p[step],islands,count).includes(share+' g de sucre'));
}
assert.match(islands.p[1],/82–84 °C/);
assert.match(islands.p[3],/de l’eau.*80–85 °C/);
assert.doesNotMatch(islands.p.join(' '),/micro-ondes|enfourner/i);
assert.equal(recipes.find(r=>r.id==='d085').servings,6);
assert.equal(recipes.find(r=>r.id==='d065').i[0].q,150);
assert.match(recipes.find(r=>r.id==='d065').p[1],/œufs pasteurisés/);
assert.match(recipes.find(r=>r.id==='d065').t,/4 h au frais/);
assert.match(recipes.find(r=>r.id==='d072').p[2],/160 °C/);
assert.match(recipes.find(r=>r.id==='d073').p[1],/pas le temps de cuisson du riz dans l’eau/);
assert.match(recipes.find(r=>r.id==='d075').p[1],/temps et le feu indiqués sur le paquet/);
assert.match(recipes.find(r=>r.id==='d092').t,/20 min de repos.*10–12 min de cuisson.*préparation/);
assert.match(recipes.find(r=>r.id==='d093').p[1],/sans les monter en neige/);
assert.doesNotMatch(recipes.find(r=>r.id==='d093').p.join(' '),/2 heures|deux heures/);
for(const [id,n] of Object.entries({a068:'sel et poivre',a069:'sel',a077:'huile',a080:'sel et poivre',a082:'sel et poivre',a086:'sel et poivre'})){
  assert.deepEqual(recipes.find(r=>r.id===id).i.at(-1),{q:null,u:'',n,k:n});
  const before=fixture.recipes.find(r=>r.id===id).beforeSteps.join(' ');
  assert.match(before,id==='a077'?/poêle légèrement huilée/:id==='a069'?/la saler/:/sel.*poivre/);
}
const salmonTerrine=recipes.find(r=>r.id==='a093');
assert.equal(salmonTerrine.role,'terrine');
assert.equal(salmonTerrine.servings,2);
for(const count of [1,2,3,4,5,8]){
  assert.equal(context.ingredientTextForRecipe(salmonTerrine.i[0],salmonTerrine,count),'250 g saumon');
  assert.ok(context.recipeStepText(salmonTerrine.p[0],salmonTerrine,count).includes('10 cl de crème légère'));
  const output=context.recipeHTML(salmonTerrine,{people:count});
  assert.doesNotMatch(output,/data-people-delta/,'fixed yield must not gain an adjustable portion control');
}
assert.match(recipes.find(r=>r.id==='a084').p[1],/Rôtir la courge 20 minutes/);
assert.match(recipes.find(r=>r.id==='a084').p[2],/Poursuivre la cuisson 5 minutes/);
assert.match(recipes.find(r=>r.id==='a071').p[2],/airfryer.*190 °C.*notice.*préchauffage/);
assert.match(recipes.find(r=>r.id==='a085').p[0],/panier.*sans contact avec l’eau/);
assert.match(recipes.find(r=>r.id==='a085').p[2],/sans réchauffer le saumon/);
assert.match(editorial.a073.reviewNote,/répartition du beurre/);
assert.match(editorial.a092.reviewNote,/cuissons séparées/);
const corrected=fixture.recipes.filter(r=>r.status==='corrected').length;
console.log(`✓ Batches ${batchNumbers.join('/')}: ${fixture.recipes.length} individual review records, ${corrected} corrected, ${fixture.recipes.length-corrected} blocked with original content preserved; ${timerCount} manually checked timers`);
console.log(`✓ ${quantityChecks} ingredient checks at 1/2/3/4/5/8 people; split parmesan quantities, per-face timing and original cooking techniques`);
