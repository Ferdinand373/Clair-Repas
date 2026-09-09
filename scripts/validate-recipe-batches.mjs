import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {recipeSource} from './recipe-source.mjs';
import {recipeHash} from './validate-recipe-editorial.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {code,recipes,editorial}=recipeSource(readFileSync(resolve(root,'index.html'),'utf8'));
const batchNumbers=['02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
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
  a080:[[22],[],[]],a082:[[],[],[]],a084:[[],[20],[5]],a085:[[15],[],[]],a086:[[],[],[]],a093:[[],[],[30],[]],
  d094:[[],[],[12]],d095:[[],[],[20]],d096:[[],[],[30]],d097:[[],[],[35]],d098:[[],[],[],[50],[30]],d100:[[],[],[28]],
  'theme-bistrot-brasserie-17':[[],[10],[],[40],[],[1]],
  'theme-bistrot-brasserie-18':[[5],[],[],[],[1],[1],[3],[]],
  'theme-bistrot-brasserie-19':[[],[],[],[10],[35],[5],[]],
  'theme-cuisine-regionale-23':[[],[],[],[30],[30]],'theme-cuisine-regionale-24':[[],[],[40],[20]],
  'theme-famille-dimanche-18':[[],[],[],[40],[]],
  'theme-petits-gourmands-18':[[],[7],[],[]],'theme-petits-gourmands-19':[[],[],[],[22]],'theme-petits-gourmands-20':[[],[],[24],[15]],
  'theme-bistrot-plus-21':[[],[2],[3],[25],[5],[1],[]],
  'theme-bistrot-plus-22':[[2],[],[5],[],[1],[]],
  'theme-bistrot-plus-23':[[],[],[],[],[40],[],[]],
  'theme-bistrot-plus-25':[[],[25],[2],[1],[]],
  'theme-bistrot-plus-26':[[],[1],[],[],[4],[4]],
  a094:[[],[],[]],a095:[[9],[],[]],a096:[[],[],[]],a098:[[],[],[]],
  t402:[[],[],[65],[]],t403:[[8],[],[70],[]],t404:[[],[],[55],[]],t405:[[],[],[70],[]],t406:[[],[],[75],[]],
  t407:[[30],[],[75],[]],t408:[[4],[3],[],[40],[]],t411:[[15],[],[50],[]],t412:[[],[],[50],[]],
  t413:[[15],[8],[],[40]],t416:[[4],[110],[],[]],t417:[[4],[5],[55],[],[]],
  'theme-bistrot-brasserie-02':[[],[22],[10],[],[]],
  'theme-bistrot-brasserie-05':[[],[25],[1],[20],[],[6]],
  'theme-cuisine-regionale-01':[[],[1],[3],[],[25],[3]],
  'theme-cuisine-regionale-02':[[],[8],[],[],[]],
  'theme-cuisine-regionale-03':[[],[],[],[10],[5]],
  'theme-famille-dimanche-02':[[],[7],[20],[],[2]],
  'theme-famille-dimanche-03':[[],[8],[7],[],[]],
  'theme-famille-dimanche-04':[[],[15],[],[],[35],[10]],
  'theme-petits-gourmands-01':[[],[3],[25],[],[2]],
  'theme-petits-gourmands-02':[[],[5],[15],[],[]],
  'theme-bistrot-plus-02':[[],[25],[],[],[],[30]],
  'theme-bistrot-plus-04':[[],[40],[10],[],[],[]],
  'theme-bistrot-plus-05':[[],[],[6],[9],[],[]],
  'theme-bistrot-plus-07':[[],[],[],[],[30],[10]],
  'v74-reg-05':[[30],[],[],[],[],[10]],
  'v74-reg-28':[[],[],[],[],[10],[40],[10]],
  'v74-reg-30':[[],[],[],[45],[20]],
  'v74-bis-08':[[1],[3],[],[35],[5],[],[1],[],[]],
  'v74-bis-09':[[],[],[],[],[45],[30]],
  'v75-chef-constant-06':[[10],[],[3],[3],[]],
  'v75-chef-loiseau-06':[[3],[],[],[],[]],
  'bistrot-ext-35':[[10],[],[]],
  'bistrot-ext-36':[[2],[1],[],[]],
  'bistrot-ext-38':[[],[4],[],[],[16]],
  'bourgeois-32':[[],[],[],[],[],[14]],
  'bourgeois-36':[[],[],[1],[],[],[12]],
  'v31n-donburi-dinde':[[],[],[40],[8],[5]],
  'v31n-orzo-poisson-blanc':[[],[5],[30],[5]],
  'v31n-orzo-tofu':[[],[10],[5],[],[18]],
  'v31n-brochettes-tabboule-poisson-blanc':[[],[5],[7],[3],[]],
  'v75-chef-constant-05':[[],[8],[],[]],
  'v75-chef-piege-02':[[],[5],[],[],[]],
  'bistrot-ext-01':[[],[20],[],[],[]],
  'bistrot-ext-05':[[],[3],[5],[10],[],[120]],
  'bistrot-ext-06':[[],[],[],[],[30]],
  'bistrot-ext-08':[[20],[10],[],[],[],[5],[5]]
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
  a093:['saumon','œufs','crème légère','citron','aneth'],
  d094:['flocons d’avoine','farine','beurre','sucre','œuf','chocolat noir'],
  d095:['myrtilles','farine','sucre','œuf','lait','beurre','levure chimique'],
  d096:['bananes','œufs','farine','sucre','beurre','noix','levure chimique'],
  d097:['farine','miel','lait','œuf','épices à pain d’épices','levure chimique'],
  d098:['farine','sucre','œufs','lait entier','pruneaux','beurre','vanille','sel'],
  d100:['rhubarbe','fraises','farine','beurre','sucre','poudre d’amande'],
  'theme-bistrot-brasserie-17':['jaunes d’œufs','sucre','crème liquide entière','gousse de vanille','cassonade'],
  'theme-bistrot-brasserie-18':['œufs','lait','sucre','gousse de vanille','amandes effilées','sucre pour caramel'],
  'theme-bistrot-brasserie-19':['pommes','pâte feuilletée','sucre','beurre','sel'],
  'theme-cuisine-regionale-23':['riz rond','sucre','lait entier','cannelle','sel'],
  'theme-cuisine-regionale-24':['pâte brisée','mirabelles','poudre d’amandes','sucre','sucre de finition'],
  'theme-famille-dimanche-18':['œufs','lait entier','sucre','vanille'],
  'theme-petits-gourmands-18':['semoule fine','lait entier','sucre','vanille'],
  'theme-petits-gourmands-19':['bananes','yaourt nature','œufs','farine','sucre','levure chimique','huile neutre'],
  'theme-petits-gourmands-20':['chocolat noir pâtissier','beurre','œufs','sucre','farine'],
  'theme-bistrot-plus-21':['eau','beurre','farine','œufs','glace vanille','chocolat noir','crème liquide','sel'],
  'theme-bistrot-plus-22':['riz rond','lait entier','sucre','gousse de vanille','sucre pour caramel','beurre demi-sel','crème liquide'],
  'theme-bistrot-plus-23':['sucre pour caramel','lait entier','œufs','sucre','vanille'],
  'theme-bistrot-plus-25':['poires fermes','sucre','eau','vanille','chocolat noir','crème liquide','glace vanille','amandes effilées'],
  'theme-bistrot-plus-26':['brioche légèrement rassise','œufs','lait','sucre','vanille','beurre pour la poêle','sucre pour caramel','beurre demi-sel','crème liquide'],
  a094:['truite fumée','fromage frais','citron','aneth','tranches de pain','poivrer'],
  a095:['avocats','œufs','moutarde','fromage blanc','citron','poivrer'],
  a096:['petites tomates','thon en boîte','fromage blanc','citron','ciboulette','saler'],
  a098:['endives','jambon cru','fromage frais','pomme','ciboulette'],
  t402:['échine de porc','foie de volaille','poitrine fumée','œufs','cognac','échalote','quatre-épices','sel','poivre'],
  t403:['échine','poitrine de porc','foie de volaille','noisettes','œufs','porto','échalote','sel','poivre'],
  t404:['blancs de poulet','chair à saucisse','œufs','crème liquide','échalote','persil','ciboulette','sel','poivre'],
  t405:['magret de canard','gorge de porc','foie de volaille','œufs','porto rouge','échalote','thym','sel','poivre'],
  t406:['chair de lapin désossée','poitrine de porc','foie de volaille','œufs','vin blanc sec','échalotes','thym','sel','poivre'],
  t407:['chair de lapin désossée','poitrine de porc','pruneaux','œufs','armagnac','échalotes','thym','sel','poivre'],
  t408:['foies de volaille','beurre','œufs','crème liquide','échalote','cognac','sel','poivre'],
  t411:['filets de poisson blanc','œufs','crème liquide','citron','ciboulette','persil','sel','poivre'],
  t412:['saumon frais','noix de Saint-Jacques','œufs','crème liquide','citron','aneth','sel','poivre'],
  t413:['courgettes','œufs','crème liquide','parmesan','basilic','ail','huile d’olive','sel','poivre'],
  t416:['lapin en morceaux','graisse de canard','vin blanc sec','échalote','moutarde à l’ancienne','thym','sel','poivre'],
  t417:['cuisses de poulet désossées','graisse de canard','bouillon','citron','échalote','thym','sel','poivre'],
  'theme-bistrot-brasserie-02':['poireaux','moutarde','vinaigre de vin','huile','échalote','persil','saler.*poivrer'],
  'theme-bistrot-brasserie-05':['oignons','beurre','farine','bouillon de bœuf','vin blanc sec','tranches de baguette','comté râpé','saler.*poivr|poivrer.*saler'],
  'theme-cuisine-regionale-01':['d’eau','beurre','farine','œufs','comté','sel','poivre'],
  'theme-cuisine-regionale-02':['salade','gésiers','magret fumé','tomate','noix','moutarde','vinaigre','huile de noix','poivre.*Salez'],
  'theme-cuisine-regionale-03':['pain','beurre demi-sel','ail','persil','poivre'],
  'theme-famille-dimanche-02':['poireaux','pommes de terre','oignon','beurre','bouillon de légumes','crème liquide','sel.*poivre','eau chaude facultative'],
  'theme-famille-dimanche-03':['carottes','haricots verts','petits pois','pommes de terre','mayonnaise','moutarde','persil','poivre.*sel'],
  'theme-famille-dimanche-04':['pâte brisée','poireaux','œufs','crème liquide','emmental','beurre','muscade','saler.*poivre','salade'],
  'theme-petits-gourmands-01':['carottes','patate douce','oignon','bouillon de légumes','crème liquide','huile d’olive','saler','eau facultative'],
  'theme-petits-gourmands-02':['tomates concassées','carotte','oignon','bouillon de légumes','petites pâtes alphabet ou vermicelles','huile d’olive','basilic','saler'],
  'theme-bistrot-plus-02':['filets de hareng doux','pommes de terre à chair ferme','oignon rouge','carotte','huile de tournesol','vinaigre de vin','moutarde','persil','poivre','salée'],
  'theme-bistrot-plus-04':['artichaut','moutarde','vinaigre','huile','échalote','ciboulette','sel.*poivre'],
  'theme-bistrot-plus-05':['salade','tranches de baguette','bûche de chèvre','lardons fumés','cerneaux de noix','moutarde','vinaigre','huile','miel','poivre'],
  'theme-bistrot-plus-07':['museau de bœuf déjà cuit','échalotes','cornichons','moutarde','vinaigre de vin','huile','persil haché','sel.*poivre','pain de campagne'],
  'v74-reg-05':['faisselle','échalotes','ail','ciboulette','persil','vinaigre de vin','huile de noix ou d’olive','saler.*poivrer','pain de campagne','radis'],
  'v74-reg-28':['pâte brisée','fromage de chèvre','œufs','sucre','farine','vanille','sel'],
  'v74-reg-30':['pâte','pommes','œufs','crème fraîche','sucre','poudre d’amandes','calvados','vanille'],
  'v74-bis-08':['d’eau','beurre','farine','œufs','amandes effilées','lait','jaunes','sucre','maïzena','praliné','beurre mou','sucre glace'],
  'v74-bis-09':['pâte sablée','poires','beurre mou','sucre','poudre d’amandes','œufs','farine','rhum','amandes effilées'],
  'v75-chef-constant-06':['brioche','œufs','lait','sucre','beurre','pruneaux','jus d’orange','cannelle','crème fraîche facultative'],
  'v75-chef-loiseau-06':['chocolat','corn flakes','beurre','orange confite','orange bio','fleur de sel'],
  'bistrot-ext-35':['glace café','expressos froids','crème liquide entière','sucre glace','chocolat noir râpé'],
  'bistrot-ext-36':['glace vanille','chocolat','crème liquide','crème entière','sucre glace','amandes effilées'],
  'bistrot-ext-38':['beurre','farine','lait','œufs','sucre','Grand Marnier','orange','sucre pour les moules'],
  'bourgeois-32':['chocolat','beurre','farine','lait','œufs','sucre','beurre prévu pour les moules','sucre pour les moules'],
  'bourgeois-36':['crêpes','œufs','sucre','oranges','fécule de maïs','lait','beurre','Grand Marnier'],
  'v31n-donburi-dinde':['rôti de porc','pruneaux','carottes','pommes de terre','oignon','bouillon','miel','thym'],
  'v31n-orzo-poisson-blanc':['lentilles vertes','lard fumé','carottes','oignon','poireau','bouillon','laurier','moutarde'],
  'v31n-orzo-tofu':['chou-fleur','jambon','farine','beurre','lait','fromage','moutarde','muscade'],
  'v31n-brochettes-tabboule-poisson-blanc':['poulet','riz','œufs','oignon','bouillon','soja','miel','ciboule'],
  'v75-chef-constant-05':['gésiers','frisée','noix','échalote','moutarde','vinaigre','huile de noix','pain','poivr.*sel'],
  'v75-chef-piege-02':['langoustines','beurre','jus de citron','câpres','pains briochés','ciboulette','huile neutre'],
  'bistrot-ext-01':['os','pain','échalote','persil','vinaigre','huile','fleur de sel','poivre'],
  'bistrot-ext-05':['champignons','vin blanc','d’eau','huile d’olive','citron','concentré de tomate','graines de coriandre','laurier','oignon','Saler.*poivrer'],
  'bistrot-ext-06':['cervelas','oignon rouge','cornichons','moutarde à l’ancienne','vinaigre','huile neutre','persil haché','Poivrer'],
  'bistrot-ext-08':['pieds de cochon déjà cuits','œufs de la sauce','moutarde','huile','vinaigre','câpres','cornichons','persil.*ciboulette','chapelure','œuf pour panure','farine','huile','Saler.*poivrer']
};
assert.equal(fixture.recipes.length,707);
let quantityChecks=0,timerCount=0;
for(const record of fixture.recipes){
  const recipe=recipes.find(r=>r.id===record.id);
  assert.equal(recipeHash(recipe),record.reviewedHash,record.id+' approved content');
  const protectedRecipe={...recipe};delete protectedRecipe.p;delete protectedRecipe.t;
  assert.equal(recipeHash(protectedRecipe),record.protectedRecipeSha256,record.id+' identity, ingredients and servings');
  if(record.status==='unchanged')assert.equal(record.reviewedHash,record.sourceHash,record.id+' satisfactory preparation was not rewritten');
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
    for(const [ingredientIndex,ingredient] of recipe.i.entries()){
      const quantity=ingredient.q==null?null:context.recipeHasFixedYield(recipe)?ingredient.q:ingredient.q*count/(recipe.servings||2);
      const text=context.ingredientText(ingredient,quantity,count);
      assert.equal(context.ingredientTextForRecipe(ingredient,recipe,count),text);
      const optional=editorial[record.id].optionalIngredients?.includes(ingredientIndex)&&!/facultati(?:f|ve)/i.test(ingredient.n)?' (facultatif)':'';
      assert.ok(output.includes('>'+text+optional+'</li>'),record.id+' '+count+' people ingredient '+ingredient.n);
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
  assert.doesNotMatch(output,/data-delta=/,'fixed yield must not gain an adjustable portion control');
}
assert.match(recipes.find(r=>r.id==='a084').p[1],/Rôtir la courge 20 minutes/);
assert.match(recipes.find(r=>r.id==='a084').p[2],/Poursuivre la cuisson 5 minutes/);
assert.match(recipes.find(r=>r.id==='a071').p[2],/airfryer.*190 °C.*notice.*préchauffage/);
assert.match(recipes.find(r=>r.id==='a085').p[0],/panier.*sans contact avec l’eau/);
assert.match(recipes.find(r=>r.id==='a085').p[2],/sans réchauffer le saumon/);
assert.match(editorial.a073.reviewNote,/répartition du beurre/);
assert.match(editorial.a092.reviewNote,/cuissons séparées/);
assert.match(editorial['gn2-filet-mignon-basquaise-riz'].reviewNote,/Ne pas servir crue une sauce ayant touché la viande crue/);
assert.match(editorial['gn2-saucisses-riz-espagnol'].reviewNote,/Ne pas servir crue une sauce ayant touché des saucisses crues/);
assert.match(editorial['gn-cotes-porc-legumes-racines'].reviewNote,/récipient.*partage.*10 cl/);
assert.match(editorial['gn2-cotes-porc-cidre-ecrase'].reviewNote,/20 cl.*trois déglaçages/);
assert.match(editorial['gn2-poisson-blanc-riz-espagnol'].reviewNote,/deux poivrons distincts/);
const brasserieIsland=recipes.find(r=>r.id==='theme-bistrot-brasserie-18');
for(const [count,cream,whites] of [[1,'20','15'],[2,'40','30'],[3,'60','45'],[4,'80','60'],[5,'100','75'],[8,'160','120']]){
  assert.ok(context.recipeStepText(brasserieIsland.p[1],brasserieIsland,count).includes(cream+' g de sucre'));
  assert.ok(context.recipeStepText(brasserieIsland.p[3],brasserieIsland,count).includes(whites+' g de sucre'));
  assert.ok(context.recipeStepText(brasserieIsland.p[7],brasserieIsland,count).includes(whites+' g de sucre pour caramel'));
}
const far=recipes.find(r=>r.id==='d098');
assert.equal(far.servings,2);assert.equal(far.i[2].q,3);assert.equal(far.i[3].q,50);assert.equal(far.i[4].q,180);
assert.deepEqual(far.i.at(-1),{q:1,u:'pincée',n:'sel',k:'sel'});
assert.match(fixture.recipes.find(r=>r.id==='d098').beforeSteps.join(' '),/une pincée de sel/);
assert.ok(context.recipeStepText(far.p[1],far,3).includes('1½ pincée'));
assert.match(far.p[3],/45 à 50 minutes à 180 °C/);
assert.match(recipes.find(r=>r.id==='d094').p[0],/sans le faire fondre/);
assert.match(recipes.find(r=>r.id==='d100').p[0],/fruits crus.*sans les précuire/);
const teurgoule=recipes.find(r=>r.id==='theme-cuisine-regionale-23');
assert.match(teurgoule.p[0],/riz rond cru/);assert.match(teurgoule.p[0],/lait entier froid/);
assert.match(teurgoule.p[1],/sans remuer/);assert.match(teurgoule.p[3],/conditionnelle/);
const profiteroles=recipes.find(r=>r.id==='theme-bistrot-plus-21');
assert.match(profiteroles.p[3],/vingt premières minutes/);assert.match(profiteroles.p[4],/four éteint/);
assert.match(recipes.find(r=>r.id==='theme-petits-gourmands-20').p[2],/175 °C/);
assert.match(recipes.find(r=>r.id==='theme-bistrot-plus-22').p[2],/incluses dans le temps total, pas ajoutées/);
assert.deepEqual(editorial['theme-cuisine-regionale-24'].optionalIngredients,[4]);
assert.match(editorial.d099.reviewNote,/œuf.*hors du feu.*Ne pas supposer/);
assert.match(editorial['theme-cuisine-regionale-25'].reviewNote,/220 g.*200 g.*20 g/);
assert.match(editorial['theme-bistrot-plus-27'].reviewNote,/eau.*30 cl.*beurre/);
for(const [id,n] of Object.entries({a094:'poivre',a095:'poivre',a096:'sel'})){
  assert.deepEqual(recipes.find(r=>r.id===id).i.at(-1),{q:null,u:'',n,k:n});
  assert.match(fixture.recipes.find(r=>r.id===id).beforeSteps.join(' '),id==='a096'?/saler légèrement/:/poivrer/i);
}
for(const count of [1,2,3,4,5,8]){
  for(const [id,step,grams] of [['t402',0,'100'],['t404',0,'120'],['t405',0,'120'],['t406',0,'120']]){
    const recipe=recipes.find(r=>r.id===id);
    assert.equal(recipe.role,'terrine');
    assert.ok(context.recipeStepText(recipe.p[step],recipe,count).includes(grams+' g'),'fixed-yield meat portion '+id);
    assert.doesNotMatch(context.recipeHTML(recipe,{people:count}),/data-delta=/);
  }
  for(const [id,step,text] of [['t403',0,'35 g de noisettes'],['t408',0,'20 g de beurre'],['t408',2,'100 g de beurre restant'],['t416',0,'100 g de graisse'],['t417',0,'80 g de graisse']]){
    const recipe=recipes.find(r=>r.id===id);
    assert.ok(context.recipeStepText(recipe.p[step],recipe,count).includes(text),id+' source split stays fixed');
  }
}
for(const id of ['t402','t403','t404','t405','t406','t408','t417'])assert.match(recipes.find(r=>r.id===id).p.join(' '),/74 °C/);
for(const id of ['t407','t411','t412','t413','t416'])assert.match(recipes.find(r=>r.id===id).p.join(' '),/71 °C/);
assert.match(recipes.find(r=>r.id==='t408').p[1],/stade intermédiaire/);
assert.match(recipes.find(r=>r.id==='t411').p[1],/le jus n’est pas utilisé/);
assert.match(recipes.find(r=>r.id==='t413').p[3],/sans bain-marie ajouté/);
assert.match(recipes.find(r=>r.id==='t416').p[2],/Il peut rester de cette réserve/);
assert.match(editorial.t401.reviewNote,/foie de porc.*durée-température/);
assert.match(editorial.t409.reviewNote,/70 °C.*durée de maintien/);
assert.match(editorial.t410.reviewNote,/poids.*force.*40 cl/);
assert.match(editorial.a097.reviewNote,/version actuelle.*sauté.*quatre portions/);
assert.equal(recipes.find(r=>r.id==='a097').servings,4);
assert.match(editorial['theme-bistrot-brasserie-01'].reviewNote,/quatre œufs.*deux moitiés/);
const batch17=JSON.parse(readFileSync(resolve(root,'scripts/recipe-editorial-batch-17.fixture.json'),'utf8')).recipes;
assert.equal(batch17.length,50);
let reservedQuantityChecks=0;
for(const record of batch17){
  assert.equal(record.status,'blocked');
  const recipe=recipes.find(r=>r.id===record.id);
  assert.equal(recipe.servings||2,2);
  assert.match(editorial[record.id].times.total,/annoncées, non vérifiées/);
  for(const count of [1,2,3,4,5,8]){
    const output=context.recipeHTML(recipe,{people:count,dayIndex:1,mealType:'eve'});
    assert.ok(output.includes('À vérifier'));
    for(const ingredient of recipe.i){
      const qty=ingredient.q==null?null:ingredient.q*count/2;
      assert.ok(output.includes('>'+context.ingredientText(ingredient,qty,count)+'</li>'),record.id+' reserved recipe ingredient at '+count);
      reservedQuantityChecks++;
    }
    const attached=[...output.matchAll(/data-step-index="(\d+)" data-timer-minutes="(\d+)"/g)].map(([,step,min])=>[+step,+min]);
    // The sourceHash assertion above proves these preparation strings are unchanged.
    assert.deepEqual(attached,recipe.p.flatMap((step,index)=>Array.from(context.stepTimerDurations(step),min=>[index,min])),record.id+' original timers stay attached to their steps');
    assert.doesNotMatch(output,/\{\{|undefined|NaN/);
  }
}
assert.match(editorial['gn2-crevettes-gingembre-sesame'].reviewNote,/poisson nacré.*crevettes/);
assert.match(editorial['gn2-filet-mignon-airfryer-boulgour'].reviewNote,/origan.*récipient.*panier perforé/);
assert.match(editorial['gn2-saucisses-grillade-persillee'].reviewNote,/seule gousse.*crue.*rôtie/);
assert.match(editorial['gn2-saumon-grillade-persillee'].reviewNote,/demi-citron.*quartier.*feuille de cuisson/);
assert.match(editorial['gn2-dinde-airfryer-boulgour'].reviewNote,/matière grasse.*pas listée/);
assert.deepEqual(Array.from(context.stepTimerDurations(recipes.find(r=>r.id==='gn2-cotes-porc-airfryer-boulgour').p[1])),[2,18]);
assert.deepEqual(Array.from(context.stepTimerDurations(recipes.find(r=>r.id==='gn2-poisson-blanc-airfryer-boulgour').p[2])),[4]);
assert.match(editorial['gn2-cotes-porc-airfryer-boulgour'].times.cook,/2 min après grillade/);
const batch18=JSON.parse(readFileSync(resolve(root,'scripts/recipe-editorial-batch-18.fixture.json'),'utf8')).recipes;
assert.equal(batch18.length,30);
assert.equal(batch18.filter(r=>r.status==='corrected').length,14);
const sourceRestored18={
  'theme-famille-dimanche-02':[['eau chaude'],/un peu d’eau chaude/],
  'theme-famille-dimanche-04':[['salade'],/avec une salade/],
  'theme-petits-gourmands-01':[['eau'],/un peu d’eau si nécessaire/],
  'theme-bistrot-plus-02':[['sel'],/eau froide salée/],
  'theme-bistrot-plus-07':[['pain de campagne'],/Accompagnez de pain de campagne/],
  'v74-reg-05':[['pain de campagne','radis'],/pain de campagne grillé et quelques radis/]
};
for(const [id,[names,proof]] of Object.entries(sourceRestored18)){
  assert.deepEqual(recipes.find(r=>r.id===id).i.slice(-names.length),names.map(n=>({q:null,u:'',n,k:n})));
  assert.match(batch18.find(r=>r.id===id).beforeSteps.join(' '),proof);
}
for(const id of ['theme-famille-dimanche-02','theme-petits-gourmands-01'])assert.deepEqual(editorial[id].optionalIngredients,[7]);
assert.equal(editorial['theme-famille-dimanche-04'].optionalIngredients,undefined,'the source salad is not silently made optional');
for(const [count,inside,top,tart] of [[1,'25','10','10'],[2,'50','20','20'],[3,'75','30','30'],[4,'100','40','40'],[5,'125','50','50'],[8,'200','80','80']]){
  const gougeres=recipes.find(r=>r.id==='theme-cuisine-regionale-01');
  assert.ok(context.recipeStepText(gougeres.p[3],gougeres,count).includes(inside+' g de comté'));
  assert.ok(context.recipeStepText(gougeres.p[4],gougeres,count).includes(top+' g de comté'));
  const pie=recipes.find(r=>r.id==='theme-famille-dimanche-04');
  assert.equal(pie.servings,4);
  for(const step of [3,4])assert.ok(context.recipeStepText(pie.p[step],pie,count).includes(tart+' g'));
}
const landaise=recipes.find(r=>r.id==='theme-cuisine-regionale-02');
const oldLandaise=batch18.find(r=>r.id===landaise.id).beforeSteps;
for(const step of [0,2,3,4])assert.equal(landaise.p[step],oldLandaise[step]);
assert.deepEqual(Array.from(context.stepTimerDurations(oldLandaise[1])),[]);
assert.deepEqual(Array.from(context.stepTimerDurations(landaise.p[1])),[8]);
assert.match(recipes.find(r=>r.id==='theme-famille-dimanche-02').p[1],/beurre.*7 minutes.*sans coloration/);
assert.match(recipes.find(r=>r.id==='theme-petits-gourmands-01').p[1],/huile d’olive.*3 minutes.*sans coloration/);
assert.match(recipes.find(r=>r.id==='theme-petits-gourmands-02').p[3],/indications de leur paquet/);
assert.deepEqual(Array.from(context.stepTimerDurations(recipes.find(r=>r.id==='theme-petits-gourmands-02').p[3])),[]);
assert.match(editorial['v75-chef-bocuse-01'].reviewNote,/foie gras cru.*foie gras cuit.*composition différente/);
assert.match(editorial['theme-bistrot-plus-06'].reviewNote,/foie de porc.*durée-température/);
assert.match(editorial['v74-reg-03'].reviewNote,/gélatine.*poids.*force.*volume final/);
const batch19=JSON.parse(readFileSync(resolve(root,'scripts/recipe-editorial-batch-19.fixture.json'),'utf8')).recipes;
for(const [id,step,perPerson] of [['bistrot-ext-35',2,2],['bistrot-ext-36',3,3]]){
  const recipe=recipes.find(r=>r.id===id);
  for(const count of [1,2,3,4,5,8])assert.ok(context.recipeStepText(recipe.p[step],recipe,count).includes((count*perPerson)+' boules de glace'),'scoop unit is visible in the action');
}
assert.equal(batch19.length,31);
assert.equal(batch19.filter(r=>r.status==='corrected').length,11);
for(const [count,cheeseSugar,whiteSugar] of [[1,'15','5'],[2,'30','10'],[3,'45','15'],[4,'60','20'],[5,'75','25'],[8,'120','40']]){
  const cake=recipes.find(r=>r.id==='v74-reg-28');
  assert.ok(context.recipeStepText(cake.p[1],cake,count).includes(cheeseSugar+' g de sucre'));
  assert.ok(context.recipeStepText(cake.p[2],cake,count).includes(whiteSugar+' g de sucre'));
  const brioche=recipes.find(r=>r.id==='v75-chef-constant-06');
  for(const step of [1,2])assert.ok(context.recipeStepText(brioche.p[step],brioche,count).includes(context.formatQty(count*5)+' g de sucre'));
  const souffle=recipes.find(r=>r.id==='bistrot-ext-38');
  assert.ok(context.recipeStepText(souffle.p[0],souffle,count).includes(context.formatQty(count*2.5)+' g de beurre'));
  assert.ok(context.recipeStepText(souffle.p[1],souffle,count).includes(context.formatQty(count*5)+' g de beurre'));
  const crepes=recipes.find(r=>r.id==='bourgeois-36');
  assert.equal(context.recipeStepText(crepes.p[0],crepes,count).split('('+context.formatQty(count/4)+')').length-1,2,'source oranges split into cream and service');
  const paris=recipes.find(r=>r.id==='v74-bis-08');
  assert.ok(context.recipeStepText(paris.p[0],paris,count).includes(context.formatQty(50*count/8)+' g de beurre'));
  assert.ok(context.recipeStepText(paris.p[7],paris,count).includes(context.formatQty(120*count/8)+' g de beurre mou'));
}
assert.deepEqual(recipes.find(r=>r.id==='v75-chef-constant-06').i.at(-1),{q:null,u:'',n:'crème fraîche',k:'crème fraîche'});
assert.match(batch19.find(r=>r.id==='v75-chef-constant-06').beforeSteps.join(' '),/si souhaité, une cuillerée de crème fraîche/);
for(const [id,indices] of [['v75-chef-constant-06',[8]],['v74-reg-30',[6]],['v74-bis-09',[7]],['bourgeois-36',[7]]])assert.deepEqual(editorial[id].optionalIngredients,indices);
assert.match(recipes.find(r=>r.id==='v74-bis-08').p[3],/vingt-cinq/);
assert.deepEqual(Array.from(context.stepTimerDurations(recipes.find(r=>r.id==='v74-bis-08').p[3])),[35]);
for(const id of ['v74-reg-30','v74-bis-09','v74-bis-08'])assert.match(editorial[id].times.total,/annoncées au total, dont/);
assert.match(editorial['v75-chef-piege-05'].reviewNote,/œufs entiers.*crème anglaise.*blancs montés/);
assert.match(editorial['v75-chef-lignac-06'].reviewNote,/crème vanillée.*absente/);
assert.match(editorial['bourgeois-35'].reviewNote,/feuilles de gélatine.*poids.*force/);
assert.match(recipes.find(r=>r.id==='bourgeois-32').p[2],/Ne pas ajouter ici le sucre réservé aux blancs/);
const batch20=JSON.parse(readFileSync(resolve(root,'scripts/recipe-editorial-batch-20.fixture.json'),'utf8')).recipes;
assert.equal(batch20.length,30);
assert.equal(batch20.filter(r=>r.status==='corrected').length,2);
const roast20=recipes.find(r=>r.id==='v31n-donburi-dinde'),lentils20=recipes.find(r=>r.id==='v31n-orzo-poisson-blanc');
assert.equal(roast20.n,'Rôti de porc aux pruneaux, carottes glacées');
assert.equal(lentils20.n,'Lentilles au lard fumé et carottes');
for(const count of [1,2,3,4,5,8]){
  assert.ok(context.recipeStepText(roast20.p[1],roast20,count).includes(context.formatQty(10*count)+' cl de bouillon'));
  assert.ok(context.recipeStepText(roast20.p[3],roast20,count).includes(context.formatQty(count/2)+' c. à café de miel'));
  assert.ok(context.recipeStepText(lentils20.p[2],lentils20,count).includes(context.formatQty(count*40)+' cl de bouillon'));
  assert.match(context.recipeStepText(roast20.p[2],roast20,count),/40 minutes à 190 °C/);
}
assert.match(roast20.p[4],/63 °C.*reposer 5 minutes/);
assert.match(lentils20.p[2],/à découvert.*indications des lentilles/);
assert.match(lentils20.p[3],/Retirer le laurier/);
assert.match(editorial['gn2-saumon-estragon-petits-pois'].reviewNote,/citron.*absent.*six minutes.*petits pois/);
assert.match(editorial['gn2-saucisses-toscane-haricots'].reviewNote,/rôties.*aucun procédé/);
assert.match(editorial['v31n-donburi-crevettes'].reviewNote,/eau des pâtes.*jamais utilisée/);
assert.match(editorial['v31n-donburi-boulettes'].reviewNote,/carottes dans la purée/);
const batch21=JSON.parse(readFileSync(resolve(root,'scripts/recipe-editorial-batch-21.fixture.json'),'utf8')).recipes;
assert.equal(batch21.length,30);
assert.equal(batch21.filter(r=>r.status==='corrected').length,1);
const gratin21=recipes.find(r=>r.id==='v31n-orzo-tofu');
assert.equal(gratin21.n,'Gratin de chou-fleur au jambon et béchamel légère');
assert.equal(gratin21.m,'Four');
for(const count of [1,2,3,4,5,8]){
  const sauce=context.recipeStepText(gratin21.p[2],gratin21,count),assembly=context.recipeStepText(gratin21.p[3],gratin21,count);
  assert.ok(sauce.includes(context.formatQty(20*count)+' g de beurre'));
  assert.ok(sauce.includes(context.formatQty(20*count)+' g de farine'));
  assert.ok(sauce.includes(context.formatQty(22.5*count)+' cl de lait'));
  assert.ok(sauce.includes(context.formatQty(count/2)+' c. à café de moutarde'));
  assert.ok(assembly.includes(context.formatQty(45*count)+' g de fromage'));
  assert.match(context.recipeStepText(gratin21.p[4],gratin21,count),/18 minutes à 200 °C/);
  assert.match(context.recipeStepText(gratin21.p[0],gratin21,count),/environ 3 cm/);
}
assert.match(gratin21.p[1],/panier vapeur.*Couvrir.*10 minutes/);
assert.match(gratin21.p[2],/Pendant cette cuisson.*beurre.*farine.*lait.*5 minutes/);
assert.doesNotMatch(gratin21.p.join(' '),/huile|sel|graisser/);
assert.deepEqual(Array.from(context.stepTimerDurations(recipes.find(r=>r.id==='v31n-couscous-minute-boeuf').p[1])),[],'two minutes less than the packet is not a two-minute cooking timer');
assert.match(editorial['v31n-couscous-minute-poulet'].reviewNote,/10 cl.*140 g.*liquide/);
assert.match(editorial['v31n-nouilles-wok-poisson-blanc'].reviewNote,/moitié de l’oignon.*aucun emploi/);
assert.match(editorial['v31n-tacos-filet-mignon'].reviewNote,/oignon.*jamais utilisé/);
assert.match(editorial['v31n-tacos-crevettes'].reviewNote,/citron.*partagé.*quantités/);
const batch22=JSON.parse(readFileSync(resolve(root,'scripts/recipe-editorial-batch-22.fixture.json'),'utf8')).recipes;
assert.equal(batch22.length,30);
assert.equal(batch22.filter(r=>r.status==='corrected').length,1);
const oyakodon22=recipes.find(r=>r.id==='v31n-brochettes-tabboule-poisson-blanc');
assert.equal(oyakodon22.n,'Oyakodon poulet-œuf');
assert.equal(oyakodon22.m,'Poêle');
for(const count of [1,2,3,4,5,8]){
  const stock=context.recipeStepText(oyakodon22.p[1],oyakodon22,count);
  assert.ok(stock.includes(context.formatQty(9*count)+' cl de bouillon'));
  assert.ok(stock.includes(context.formatQty(count)+' c. à soupe de sauce soja'));
  assert.ok(stock.includes(context.formatQty(count/2)+' c. à café de miel'));
  assert.match(context.recipeStepText(oyakodon22.p[4],oyakodon22,count),/bols selon le nombre de personnes/);
  assert.match(context.recipeStepText(oyakodon22.p[2],oyakodon22,count),/74 °C/);
  assert.match(context.recipeStepText(oyakodon22.p[3],oyakodon22,count),/71 °C/);
}
assert.match(oyakodon22.p[0],/selon les indications de son paquet/);
assert.match(oyakodon22.p[1],/sans être sauté/);
assert.match(oyakodon22.p[2],/bouillon frémissant.*Couvrir/);
assert.doesNotMatch(oyakodon22.p.join(' '),/huile|beurre|deux bols/);
assert.deepEqual(Array.from(context.stepTimerDurations(recipes.find(r=>r.id==='v31n-brochettes-tabboule-tofu').p[0])),[]);
assert.match(editorial['v31n-brochettes-tabboule-boeuf'].reviewNote,/marinade.*poulet cru.*réutilisée/);
assert.match(editorial['v31n-croustillant-coleslaw-poulet'].reviewNote,/8 cl.*fixe.*poids égoutté/);
assert.match(editorial['v31n-papillote-fenouil-dinde'].reviewNote,/paprika.*manque/);
assert.match(editorial['v31n-papillote-fenouil-falafels'].reviewNote,/poche.*directement.*ne pas ajouter une saisie/);
assert.match(editorial['v31n-tacos-tofu'].reviewNote,/ciboulette.*jamais utilisée.*quatre œufs/);
const batch23=JSON.parse(readFileSync(resolve(root,'scripts/recipe-editorial-batch-23.fixture.json'),'utf8')).recipes;
assert.equal(batch23.length,31);
assert.equal(batch23.filter(r=>r.status==='corrected').length,5);
assert.equal(batch23.filter(r=>r.status==='unchanged').length,1);
assert.equal(batch23.filter(r=>r.status==='blocked').length,25);
const prawns23=recipes.find(r=>r.id==='v75-chef-piege-02'),feet23=recipes.find(r=>r.id==='bistrot-ext-08');
const mushrooms23=recipes.find(r=>r.id==='bistrot-ext-05'),cervelas23=recipes.find(r=>r.id==='bistrot-ext-06');
for(const count of [1,2,3,4,5,8]){
  assert.ok(context.recipeStepText(feet23.p[2],feet23,count).includes(context.formatQty(3*count)+' cl d’huile'));
  assert.ok(context.recipeStepText(feet23.p[5],feet23,count).includes(context.formatQty(count/2)+' c. à soupe d’huile'));
  assert.ok(context.recipeStepText(feet23.p[1],feet23,count).includes('('+context.formatQty(count/2)+')'));
  assert.ok(context.recipeStepText(feet23.p[4],feet23,count).includes('('+context.formatQty(count/4)+')'));
  assert.ok(context.recipeStepText(mushrooms23.p[2],mushrooms23,count).includes(context.formatQty(count*2.5)+' cl d’eau'));
  assert.ok(context.recipeStepText(cervelas23.p[2],cervelas23,count).includes(context.formatQty(count*1.25)+' c. à soupe d’huile'));
  assert.match(context.recipeStepText(prawns23.p[2],prawns23,count),/45 à 60 secondes/);
  assert.match(context.recipeStepText(prawns23.p[3],prawns23,count),/45 à 60 secondes/);
}
assert.match(prawns23.p[1],/panier vapeur.*Couvrir.*4 à 5 minutes/);
for(const index of [2,3])assert.deepEqual(Array.from(context.stepTimerDurations(prawns23.p[index])),[],'mixed 45 seconds–1 minute source stays a seconds range, never a false one-minute timer');
assert.match(prawns23.p[4],/sans devenir noir.*Retirer aussitôt du feu.*citron.*câpres/);
assert.match(feet23.p[6],/74 °C/);
assert.match(feet23.p[1],/œufs de la sauce entiers.*fraction d’œuf.*jaune et blanc compris/);
assert.equal(feet23.i[3].q,12);assert.equal(feet23.i[11].q,2);
assert.match(cervelas23.t,/20–30 min de repos \+ préparation/);
assert.match(mushrooms23.p[4],/jus.*moitié de ce volume.*tout le jus/);
const gesiers23=recipes.find(r=>r.id==='v75-chef-constant-05');
assert.deepEqual(gesiers23.i.at(-1),{q:null,u:'',n:'sel et poivre',k:'sel et poivre'});
assert.match(batch23.find(r=>r.id===gesiers23.id).beforeSteps.join(' '),/Poivrez généreusement.*Goûtez avant de saler/);
assert.match(editorial['bourgeois-03'].reviewNote,/cinq minutes.*Tox Info Suisse.*vingt minutes/);
assert.match(editorial['v75-chef-troisgros-05'].reviewNote,/cuillère d’huile.*taille de cuillère.*citron.*moitié/);
const marrow23=batch23.find(r=>r.id==='bistrot-ext-01');
assert.equal(marrow23.reviewedHash,marrow23.sourceHash,'all culinary fields of satisfactory recipe remain unchanged');
assert.deepEqual(recipes.find(r=>r.id===marrow23.id).collections,['bistrot-brasserie','aperitifs-petites-assiettes']);
const corrected=fixture.recipes.filter(r=>r.status==='corrected').length;
const unchanged=fixture.recipes.filter(r=>r.status==='unchanged').length;
console.log(`✓ Batches ${batchNumbers.join('/')}: ${fixture.recipes.length} individual review records, ${corrected} corrected, ${unchanged} unchanged, ${fixture.recipes.length-corrected-unchanged} blocked with original content preserved; ${timerCount} manually checked timers`);
console.log(`✓ ${quantityChecks} ingredient checks at 1/2/3/4/5/8 people; split parmesan quantities, per-face timing and original cooking techniques`);
console.log(`✓ Batch 17: ${reservedQuantityChecks} ingredient renders at 1/2/3/4/5/8 people; all 50 reservations visible, original methods and timer attachments preserved`);
