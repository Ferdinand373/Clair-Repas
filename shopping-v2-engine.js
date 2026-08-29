(function clairShoppingV2Module(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  else root.ClairShoppingV2 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function clairShoppingV2Factory() {
  'use strict';

  const SCHEMA_VERSION = 2;
  const SOURCE = 'Clair Repas';
  const SOURCE_VERSION = '7.5';
  const RULES_VERSION = 'clair-repas-shopping-v2.0.1';
  const AISLES = Object.freeze([
    'Eau',
    'Épicerie',
    'Fruits et légumes',
    'Boucherie',
    'Charcuterie',
    'Poissonnerie',
    'Boulangerie',
    'Conserves',
    'Crèmerie',
    'Surgelés',
    'Boissons',
    'Hygiène',
    'Maison',
    'Divers'
  ]);
  const AISLE_ORDER = new Map(AISLES.map((aisle, index) => [aisle, index]));
  const FRACTIONS = Object.freeze({
    '⅛': 1 / 8,
    '¼': 1 / 4,
    '⅓': 1 / 3,
    '⅜': 3 / 8,
    '½': 1 / 2,
    '⅝': 5 / 8,
    '⅔': 2 / 3,
    '¾': 3 / 4,
    '⅞': 7 / 8
  });
  const ALLOWED_FORMS = new Set(['fresh', 'dried', 'canned', 'frozen', 'other']);
  const COOKED_GRAIN_FACTORS = Object.freeze({
    rice: 1 / 3,
    pasta: 0.43,
    quinoa: 1 / 3,
    bulgur: 0.4,
    semolina: 0.4
  });
  const CANNED_PACKAGE_SIZE_GRAMS = 400;
  const COMMON_PANTRY_PATTERN = /^(?:sel|poivre|sel et poivre|huile|huile neutre|huile d olive|eau)$/;
  const CHARCUTERIE_PATTERN = /\b(?:knacks?|jambons?|lardons?|lards?(?: fumes?)?|bacons?|chorizos?|guanciales?|cervelas|andouillettes?|saucissons?|boudins?|terrines?|rillettes?|foies? gras)\b/;
  const MEAT_PATTERN = /\b(?:viandes? hachees?|boeufs?|porcs?|veaux?|agneaux?|poulets?|dindes?|canards?|lapins?|steaks?|escalopes?|bavettes?|filets? mignons?|saucisses?|merguez|chipolatas?|chair a saucisse|foies? de (?:volaille|veau)|cailles?)\b/;
  const FISH_PATTERN = /\b(?:cabillauds?|saumons?|poissons?|fruits? de mer|sandres?|merlus?|rougets?|dorades?|daurades?|truites?|maquereaux?|sardines?|anchois|harengs?|moules?|palourdes?|homards?|crevettes?|gambas?|lieu(?:x)?|thons?|soles?|saint jacques|coquilles? saint jacques|calamars?|encornets?|huitres?|crabes?|langoustines?|morues?|lottes?|bars?|turbots?)\b/;
  const DAIRY_PATTERN = /\b(?:beurres?|cremes?|laits?|fromages?|yaourts?|oeufs?|parmesans?|mozzarellas?|fetas?|emmentals?|gruyeres?|mascarpones?|skyrs?|faisselles?|comtes?|ricottas?|cheddars?|tofus?|pecorinos?|reblochons?|beauforts?|camemberts?|chevres?|cancoillottes?|paneers?|petits? suisses?|tomm?es?)\b/;
  const BAKERY_PATTERN = /\b(?:pains?|baguettes?|brioches?|bagels?|muffins? anglais|wraps?|galettes? de sarrasin|feuilles? de brick|pates? filo)\b/;
  const DRINK_PATTERN = /\b(?:vins?|cidres?|bieres?|limonades?|sodas?|sirops?|cognacs?|portos?|armagnacs?|rhums?|rieslings?|vermouths?|champagnes?|cremants?|maderes?|calvados|grand marnier|cointreaus?)\b/;
  const PRODUCE_PATTERN = /\b(?:ails?|aubergines?|avocats?|carottes?|celeris?|champignons?|chou(?:x)?|concombres?|courgettes?|echalotes?|epinards?|haricots? verts?|navets?|oignons?|poireaux?|poivrons?|pommes? de terre|radis|salades?|laitues?|roquettes?|tomates?|citrons?|oranges?|pommes?|poires?|peches?|bananes?|fraises?|cerises?|pasteques?|grenades?|kakis?|mirabelles?|nectarines?|melons?|raisins?|brocolis?|petits pois|asperges?|betteraves?|endives?|fenouils?|framboises?|myrtilles?|rhubarbes?|abricots?|pruneaux?|prunes?|mangues?|morilles?|pak choi|pamplemousses?|ananas|kiwis?|blettes?|clementines?|figues?|artichauts?|fruits? rouges?|germes? de soja|basilic|coriandre|persil|ciboulette|ciboules?|menthe|aneth|estragon|cerfeuil|sauge|romarin|courges?|patates? douces?|panais|butternuts?|salsifis)\b/;
  const GROCERY_PATTERN = /\b(?:huiles?|vinaigres?|farines?|sarrasins?|sucres?|cassonades?|caramels?|riz|orges? perles?|semoules?|quinoas?|boulgours?|nouilles?|vermicelles?|lasagnes?|rigatonis?|cannellonis?|crozets?|tortellinis?|chapelures?|panko|paprikas?|currys?|cumins?|cardamomes?|badianes?|carvis?|pavots?|chias?|bouillons?|moutardes?|mayonnaises?|ketchups?|sauces? barbecue|worcestershire|tabascos?|raiforts?|concentres?|coulis|sels?|poivres?|epices?|herbes?|miels?|levures?|gelatines?|cacaos?|chocolats?|lentilles?|pois chiches?|haricots?|flageolets?|polenta|flocons? d avoine|mirin|sauce soja|olives?|pestos?|capres?|vanilles?|bouquets? garnis?|noix|graines? de sesame|sesames?|vinaigrettes?|amandes?|tortillas?|cornichons?|fonds?(?: blancs?)? de (?:veau|volaille|boeuf|legumes?)|fumets? de crustaces?|tahinis?|noisettes?|misos?|maizena|fecules?|garam masala|safrans?|piments?|ras el hanout|gnocchis?|falafels?|spatzles?|spaetzles?|ravioles?|chataignes?|baies? de genievre|clous? de girofle|harissas?|choucroutes?|pignons? de pin|zaatar)\b/;
  const EXTENDED_AISLE_RULES = Object.freeze([
    ['Boissons', /\b(?:expressos?|jus de grenade)\b/],
    ['Conserves', /\b(?:bisques? de crustaces?|gaspachos?)\b/],
    ['Boulangerie', /\b(?:crepes?|pate filo|genoises?|bouchees? feuilletees?|blinis?|biscuits? genoise|meringues?)\b/],
    ['Crèmerie', /\b(?:cancoillottes?|paneers?|petits? suisses?|tomes? fraiches?)\b/],
    ['Charcuterie', /\b(?:guanciales?|pancettas?|lards? fumes?|poitrines? fumees?|cervelas|gesiers? .*confits?|pieds? de cochon)\b/],
    ['Poissonnerie', /\b(?:sandres?|anguilles?|carapaces? de crustaces?|homards?|grenouilles?|ecrevisses?|merlus?|rougets?|saint pierre|palourdes?|poulpes?|quenelles? de brochet|ailes? de raie|surimis?)\b/],
    ['Boucherie', /\b(?:viandes? hachees?|blancs? de volaille|carcasses? et ailes? de volaille|diots?|entrecotes?|chevreuils?|canetons?|magrets?|gras double|os a moelle|pigeonneaux?|pintades?|poulardes?|supremes? de volaille)\b/],
    ['Épicerie', /\b(?:sauces?|biscuits? a la cuillere|pignons?|algues?|cacahuetes?|cafes?|camomilles?|fleurs? alimentaires?|cardamomes?|corn flakes|badianes?|verveine.*sechee|fleur d oranger|gelees?|carvis?|chias?|pavots?|sarrasins?|granolas?|lavandes?|marrons?|melilots?|foin alimentaire|tapiocas?|purees? de marrons?|quenelles? nature|raiforts?|reine des pres|speculoos|tabascos?|tilleuls?)\b/],
    ['Fruits et légumes', /\b(?:cerises?|pasteques?|fruits? de la passion|grenades?|kakis?|mirabelles?|nectarines?|oseilles?|potimarrons?|truffes?|verveines?)\b/]
  ]);
  const COOKED_PATTERN = /\bcuit(?:e?s?)?\b/;

  function normalizeSpaces(value) {
    return String(value == null ? '' : value).normalize('NFC').replace(/\s+/g, ' ').trim();
  }

  function normalizeSearchText(value) {
    return String(value == null ? '' : value)
      .toLocaleLowerCase('fr-FR')
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function canonicalText(value) {
    return normalizeSpaces(value)
      .toLocaleLowerCase('fr-FR')
      .replace(/[\u2018\u2019\u02bc']/g, '’');
  }

  function canonicalIdentityText(value) {
    return canonicalText(value)
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae');
  }

  function formOrDefault(form, fallback) {
    return form === 'other' ? fallback : form;
  }

  function stripContainerFormSuffix(value) {
    return normalizeSpaces(value).replace(
      /\s+en\s+(?:bo(?:i|î)tes?|conserves?|boc(?:al|aux))\b.*$/iu,
      ''
    );
  }

  function stripCanonicalFormSuffix(value) {
    return stripContainerFormSuffix(value).replace(
      /\s+(?:(?:très|tres)\s+)?(?:frais|fraîche?s?|fraiches?|secs?|sèche?s?|seches?|séché(?:e?s?)?|seche(?:e?s?)?|surgelé(?:e?s?)?|surgele(?:e?s?)?|congelé(?:e?s?)?|congele(?:e?s?)?|en poudre)$/iu,
      ''
    );
  }

  function pastaCanonicalFor(search) {
    const shapes = [
      [/\bspaghettis?\b/, 'spaghetti'],
      [/\bpennes?\b/, 'penne'],
      [/\btagliatelles?\b/, 'tagliatelles'],
      [/\bcoquillettes?\b/, 'coquillettes'],
      [/\bmacaronis?\b/, 'macaroni'],
      [/\bfusillis?\b/, 'fusilli'],
      [/\blinguines?\b/, 'linguine'],
      [/\borzos?\b/, 'orzo'],
      [/\btonnarellis?\b/, 'tonnarelli'],
      [/\bbucatinis?\b/, 'bucatini'],
      [/\btrofies?\b/, 'trofie'],
      [/\bpates? alphabet\b/, 'pâtes alphabet']
    ];
    return shapes.find(([pattern]) => pattern.test(search))?.[1] || 'pâtes';
  }

  function pastryCanonicalFor(sourceName, search) {
    let name = canonicalText(sourceName);
    if (/\bfeuilletees?\b/.test(search)) {
      name = name.replace(/\bpâtes?\s+feuilletées?\b/u, 'pâte feuilletée');
    } else if (/\bbrisees?\b/.test(search)) {
      name = name.replace(/\bpâtes?\s+brisées?\b/u, 'pâte brisée');
    } else if (/\bsablees?\b/.test(search)) {
      name = name.replace(/\bpâtes?\s+sablées?\b/u, 'pâte sablée');
    } else if (/\b(?:a pizza|pizza)\b/.test(search)) {
      name = name.replace(/\bpâtes?\s+(?:à|a)\s+pizza\b/u, 'pâte à pizza');
    } else if (/\b(?:a tarte|tarte)\b/.test(search)) {
      name = name.replace(/\bpâtes?\s+(?:à|a)\s+tarte\b/u, 'pâte à tarte');
    }
    return name;
  }

  function stripLeadingUnitName(value, unit) {
    const name = canonicalText(value);
    const normalizedUnit = normalizeUnit(unit);
    const rules = {
      tranche: 'tranches?',
      feuille: 'feuilles?',
      pavé: 'pavés?',
      gousse: 'gousses?',
      bouquet: 'bouquets?',
      botte: 'bottes?',
      branche: 'branches?'
    };
    const noun = rules[normalizedUnit];
    if (!noun) return name;
    const match = name.match(new RegExp(`^${noun}(?:\\s+(.+?))?\\s+(?:de\\s+|d[’'])(.+)$`, 'u'));
    if (!match) return name;
    if (!match[1]) return normalizeSpaces(match[2]);
    const qualifier = match[1]
      .replace(/épaisses?/gu, 'épaisse')
      .replace(/\bfines?\b/gu, 'fine')
      .replace(/\bgrandes?\b/gu, 'grande')
      .replace(/\bpetites?\b/gu, 'petite');
    return `${normalizeSpaces(match[2])} en ${normalizedUnit} ${qualifier}`;
  }

  function riceCanonicalFor(search) {
    if (/\barborio\b/.test(search)) return 'riz arborio';
    if (/\bbasmati\b/.test(search)) return 'riz basmati';
    if (/\bjasmin\b/.test(search)) return 'riz jasmin';
    if (/\blong\b/.test(search)) return 'riz long';
    if (/\b(?:a|pour) paella\b/.test(search)) return 'riz à paella';
    if (/\bthai\b/.test(search)) return 'riz thaï';
    if (/\bsauvage\b/.test(search)) return 'riz sauvage';
    if (/\bcomplet\b/.test(search)) return 'riz complet';
    if (/\brond\b/.test(search)) return 'riz rond';
    return 'riz';
  }

  function potatoCanonicalFor(search) {
    if (COOKED_PATTERN.test(search)) return 'pommes de terre';
    if (/\bfarineuses?\b/.test(search)) return 'pommes de terre farineuses';
    if (/\brattes?\b/.test(search) && /\ba chair ferme\b/.test(search)) return 'pommes de terre à chair ferme type ratte';
    if (/\brattes?\b/.test(search)) return 'pommes de terre ratte';
    if (/\ba chair ferme\b/.test(search)) return 'pommes de terre à chair ferme';
    if (/\bgrenailles?\b/.test(search)) return 'pommes de terre grenaille';
    if (/\b(?:a|pour) frites?\b/.test(search)) return 'pommes de terre à frites';
    return 'pommes de terre';
  }

  function produceVariantCanonical(base, search) {
    if (base === 'pommes de terre') return potatoCanonicalFor(search);
    if (base === 'citron') {
      if (/\bverts?\b/.test(search)) return 'citron vert';
      if (/\bnon traite(?:e)?s?\b/.test(search)) return 'citron non traité';
      return 'citron';
    }
    if (base === 'poivron') {
      const color = search.match(/\b(rouges?|verts?|jaunes?|oranges?)\b/)?.[1];
      if (/\bgrilles?\b/.test(search)) return 'poivron grillé';
      if (color) return `poivron ${color.replace(/s$/, '')}`;
    }
    if (base === 'oignon') {
      if (/\brouges?\b/.test(search)) return 'oignon rouge';
      if (/\bnouveaux?\b|\bnouvelles?\b/.test(search)) return 'oignon nouveau';
      if (/\bgrelots?\b/.test(search)) return 'oignon grelot';
      if (/\bpique(?:e?s?)?\b/.test(search)) return 'oignon piqué';
    }
    if (base === 'courgette') {
      if (/\brondes?\b/.test(search)) return 'courgette ronde';
      if (/\bgrillees?\b/.test(search)) return 'courgette grillée';
    }
    if (base === 'pomme') {
      if (/\bvertes?\b/.test(search)) return 'pomme verte';
      if (/\bacidulees?\b/.test(search)) return 'pomme acidulée';
    }
    if (base === 'orange') {
      if (/\bbio\b|\bnon traite(?:e)?s?\b/.test(search)) return 'orange bio';
    }
    if (base === 'poire') {
      if (/\bfermes?\b/.test(search)) return 'poire ferme';
      if (/\bmures?\b/.test(search)) return 'poire mûre';
    }
    if (base === 'banane' && /\bmures?\b/.test(search)) return 'banane mûre';
    return base;
  }

  function normalizeKnownCanonicalName(value) {
    const original = normalizeSpaces(value);
    if (original === 'moutarde de Dijon') return original;
    let name = canonicalText(original);
    if (/\bpour (?:les )?moules\b/u.test(name)) return name;
    if (/^(?:pâtes|tomates (?:concassées|pelées|entières|cerises)|pommes de terre|petits pois|pois chiches|haricots (?:verts|rouges|blancs)|lentilles|flocons d’?avoine|knacks|rillettes)(?:\b|$)/u.test(name)) {
      return name;
    }
    const replacements = [
      [/\bcourgettes\b/gu, 'courgette'], [/\bcitrons\b/gu, 'citron'], [/\boignons\b/gu, 'oignon'],
      [/\baubergines\b/gu, 'aubergine'], [/\bavocats\b/gu, 'avocat'], [/\bcarottes\b/gu, 'carotte'],
      [/\bconcombres\b/gu, 'concombre'], [/\béchalotes\b/gu, 'échalote'], [/\bpoireaux\b/gu, 'poireau'],
      [/\bpoivrons\b/gu, 'poivron'], [/\bbrocolis\b/gu, 'brocoli'], [/\bchampignons\b/gu, 'champignon'],
      [/\bharicot vert\b/gu, 'haricots verts'],
      [/\bchoux\b/gu, 'chou'], [/\bnavets\b/gu, 'navet'], [/\bradis\b/gu, 'radis'], [/\bsalades\b/gu, 'salade'],
      [/\btomates\b/gu, 'tomate'], [/\boranges\b/gu, 'orange'], [/\bpommes\b(?! de terre)/gu, 'pomme'],
      [/\bpoires\b/gu, 'poire'], [/\bpêches\b/gu, 'pêche'], [/\bpeches\b/gu, 'pêche'], [/\bbananes\b/gu, 'banane'], [/\bfraises\b/gu, 'fraise'],
      [/\bmelons\b/gu, 'melon'], [/\braisins\b/gu, 'raisin'], [/\bframboises\b/gu, 'framboise'],
      [/\bmyrtilles\b/gu, 'myrtille'], [/\basperges\b/gu, 'asperge'], [/\bbetteraves\b/gu, 'betterave'],
      [/\bendives\b/gu, 'endive'], [/\bfenouils\b/gu, 'fenouil'], [/\bporcs\b/gu, 'porc'],
      [/(^|[\s’'/-])(?:bœufs?|boeufs?)(?=$|[\s’'/-])/gu, '$1bœuf'], [/\bveaux\b/gu, 'veau'],
      [/\bagneaux\b/gu, 'agneau'], [/\bpoulets\b/gu, 'poulet'], [/\bdindes\b/gu, 'dinde'],
      [/\bcanards\b/gu, 'canard'], [/\blapins\b/gu, 'lapin'], [/\bsteaks\b/gu, 'steak'],
      [/\bescalopes\b/gu, 'escalope'], [/\bsaucisses\b/gu, 'saucisse'], [/\bchipolatas\b/gu, 'chipolata'],
      [/\bsaumons\b/gu, 'saumon'], [/\bcabillauds\b/gu, 'cabillaud'], [/\bsoles\b/gu, 'sole'],
      [/\bcrevettes\b/gu, 'crevette'], [/\bpoissons\b/gu, 'poisson'], [/\bdorades\b/gu, 'dorade'],
      [/\bdaurades\b/gu, 'daurade'], [/\btruites\b/gu, 'truite'], [/\bsardines\b/gu, 'sardine'],
      [/\bmoules\b/gu, 'moule'], [/\bgambas\b/gu, 'gambas'], [/\bcalamars\b/gu, 'calamar'],
      [/\bencornets\b/gu, 'encornet'], [/\bhuîtres\b/gu, 'huître'], [/\bcrabes\b/gu, 'crabe'],
      [/\blangoustines\b/gu, 'langoustine'], [/\bfromages\b/gu, 'fromage'], [/\byaourts\b/gu, 'yaourt'],
      [/(^|[\s’'/-])(?:œufs?|oeufs?)(?=$|[\s’'/-])/gu, '$1œuf'], [/\bbeurres\b/gu, 'beurre'],
      [/\bcrèmes\b/gu, 'crème'], [/\blaits\b/gu, 'lait'], [/\bparmesans\b/gu, 'parmesan'],
      [/\bmozzarellas\b/gu, 'mozzarella'], [/\bfetas\b/gu, 'feta'], [/\bfromages\b/gu, 'fromage'],
      [/\bvins\b/gu, 'vin'], [/\bcidres\b/gu, 'cidre'], [/\bbières\b/gu, 'bière'],
      [/\blimonades\b/gu, 'limonade'], [/\bsodas\b/gu, 'soda'], [/\bsirops\b/gu, 'sirop'],
      [/\bpains\b/gu, 'pain'], [/\bbaguettes\b/gu, 'baguette'], [/\bbrioches\b/gu, 'brioche'],
      [/\bjambons\b/gu, 'jambon'], [/\blardons\b/gu, 'lardon'], [/\bchorizos\b/gu, 'chorizo'],
      [/\bterrines\b/gu, 'terrine'], [/\bfarines\b/gu, 'farine'], [/\bsucres\b/gu, 'sucre'],
      [/\bglaces\b/gu, 'glace'], [/\bglacées\b/gu, 'glacée'], [/\bsorbets\b/gu, 'sorbet'],
      [/\bchapelures\b/gu, 'chapelure'], [/\bsemoules\b/gu, 'semoule'], [/\bquinoas\b/gu, 'quinoa'],
      [/\bboulgours\b/gu, 'boulgour'], [/\bnouilles\b/gu, 'nouilles'], [/\bhuiles\b/gu, 'huile'],
      [/\bvinaigres\b/gu, 'vinaigre'], [/\bbouillons\b/gu, 'bouillon'], [/\bmoutardes\b/gu, 'moutarde'],
      [/\bmayonnaises\b/gu, 'mayonnaise'], [/\bketchups\b/gu, 'ketchup'], [/\bmiels\b/gu, 'miel'],
      [/\blevures\b/gu, 'levure'], [/\bcacaos\b/gu, 'cacao'], [/\bchocolats\b/gu, 'chocolat']
    ];
    for (const [pattern, replacement] of replacements) name = name.replace(pattern, replacement);
    return name;
  }

  function finiteNumber(value) {
    if (value == null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function round(value, precision = 6) {
    const number = finiteNumber(value);
    if (number == null) return null;
    const factor = 10 ** precision;
    return Math.round((number + Number.EPSILON) * factor) / factor;
  }

  function parseQuantity(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const source = normalizeSpaces(value).replace(',', '.');
    if (!source) return null;
    if (Object.prototype.hasOwnProperty.call(FRACTIONS, source)) return FRACTIONS[source];

    const glyph = source.match(/^(\d+)?\s*([⅛¼⅓⅜½⅝⅔¾⅞])$/u);
    if (glyph) return Number(glyph[1] || 0) + FRACTIONS[glyph[2]];

    const mixedFraction = source.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixedFraction) {
      const denominator = Number(mixedFraction[3]);
      return denominator ? Number(mixedFraction[1]) + Number(mixedFraction[2]) / denominator : null;
    }

    const fraction = source.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (fraction) {
      const denominator = Number(fraction[2]);
      return denominator ? Number(fraction[1]) / denominator : null;
    }

    const number = Number(source);
    return Number.isFinite(number) ? number : null;
  }

  function qualifiedPackageFor(value, anchored = false) {
    const source = normalizeSpaces(value);
    const prefix = anchored ? '^' : '';
    const pattern = new RegExp(
      `${prefix}(?:petites?\\s+)?(bo(?:i|î)tes?|boc(?:al|aux))\\s+(?:de\\s+)?(\\d+(?:[.,]\\d+)?)\\s*(kg|g)(?:\\s+|$)`,
      'iu'
    );
    const match = source.match(pattern);
    if (!match) return null;
    const amount = Number(match[2].replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return {
      unit: /^boc/iu.test(match[1]) ? 'bocal' : 'boîte',
      packageCapacityGrams: round(amount * (match[3].toLocaleLowerCase('fr-FR') === 'kg' ? 1000 : 1)),
      matchedText: match[0],
      index: match.index || 0
    };
  }

  function normalizeUnit(value) {
    const raw = canonicalText(value)
      .replace(/[.]/g, '.')
      .replace(/\s+/g, ' ')
      .trim();
    const qualifiedPackage = qualifiedPackageFor(raw);
    if (qualifiedPackage) return qualifiedPackage.unit;
    const unit = normalizeSearchText(raw);
    if (!unit) return '';
    if (/^(?:kg|kilogramme|kilogrammes)$/.test(unit)) return 'kg';
    if (/^(?:g|gr|gramme|grammes)$/.test(unit)) return 'g';
    if (/^(?:ml|millilitre|millilitres)$/.test(unit)) return 'ml';
    if (/^(?:cl|centilitre|centilitres)$/.test(unit)) return 'cl';
    if (/^(?:l|litre|litres)$/.test(unit)) return 'l';
    if (/^(?:c a soupe|cuillere a soupe|cuilleres a soupe|cs)$/.test(unit)) return 'c. à soupe';
    if (/^(?:c a cafe|cuillere a cafe|cuilleres a cafe|cc)$/.test(unit)) return 'c. à café';
    if (/^feuilles?$/.test(unit)) return 'feuille';
    if (/^gousses?$/.test(unit)) return 'gousse';
    if (/^(?:(?:petite|petites|grande|grandes|grosse|grosses) )?boites?$/.test(unit)) return 'boîte';
    if (/^(?:petits? |grands? |gros )?bouquets?$/.test(unit)) {
      if (/^petit/.test(unit)) return 'petit bouquet';
      if (/^grand/.test(unit)) return 'grand bouquet';
      if (/^gros/.test(unit)) return 'gros bouquet';
      return 'bouquet';
    }
    if (/^conserves?$/.test(unit)) return 'boîte';
    if (/^paves?$/.test(unit)) return 'pavé';
    if (/^tranches?$/.test(unit)) return 'tranche';
    if (/^sachets?$/.test(unit)) return 'sachet';
    if (/^paquets?$/.test(unit)) return 'paquet';
    if (/^pots?$/.test(unit)) return 'pot';
    if (/^(?:bocal|bocaux)$/.test(unit)) return 'bocal';
    if (/^bouteilles?$/.test(unit)) return 'bouteille';
    if (/^flacons?$/.test(unit)) return 'flacon';
    if (/^tubes?$/.test(unit)) return 'tube';
    if (/^barquettes?$/.test(unit)) return 'barquette';
    if (/^(?:rouleau|rouleaux)$/.test(unit)) return 'rouleau';
    if (/^bottes?$/.test(unit)) return 'botte';
    if (/^branches?$/.test(unit)) return 'branche';
    if (/^briques?$/.test(unit)) return 'brique';
    if (/^doses?$/.test(unit)) return 'dose';
    if (/^gouttes?$/.test(unit)) return 'goutte';
    if (/^tetes?$/.test(unit)) return 'tête';
    if (/^pincees?$/.test(unit)) return 'pincée';
    if (/^unites?$/.test(unit)) return 'unité';
    return raw;
  }

  function inferUnitFromName(name, unit) {
    const normalized = normalizeUnit(unit);
    if (normalized) return normalized;
    const search = normalizeSearchText(name);
    if (/\bpaves? de saumon\b/.test(search)) return 'pavé';
    if (/\bgousses? d ail\b/.test(search)) return 'gousse';
    if (/\bfeuilles? (?:de )?(?:laurier|basilic|persil|sauge)\b/.test(search)) return 'feuille';
    if (/\btranches?\b/.test(search)) return 'tranche';
    return '';
  }

  function quantityDimension(unit) {
    const normalized = normalizeUnit(unit);
    if (normalized === 'g' || normalized === 'kg') return 'mass';
    if (['ml', 'cl', 'l', 'c. à soupe', 'c. à café'].includes(normalized)) return 'volume';
    if (normalized) return 'count';
    return 'count';
  }

  function toBaseQuantity(quantity, unit) {
    const q = finiteNumber(quantity);
    const normalized = normalizeUnit(unit);
    const dimension = quantityDimension(normalized);
    if (q == null) return { quantity: null, unit: normalized, dimension };
    if (normalized === 'kg') return { quantity: q * 1000, unit: 'g', dimension: 'mass' };
    if (normalized === 'l') return { quantity: q * 1000, unit: 'ml', dimension: 'volume' };
    if (normalized === 'cl') return { quantity: q * 10, unit: 'ml', dimension: 'volume' };
    if (normalized === 'c. à soupe') return { quantity: q * 15, unit: 'ml', dimension: 'volume' };
    if (normalized === 'c. à café') return { quantity: q * 5, unit: 'ml', dimension: 'volume' };
    return { quantity: q, unit: normalized, dimension };
  }

  function fixedYieldRecipe(recipe) {
    if (!recipe) return false;
    return recipe.fixedYield === true || recipe.role === 'terrine' || recipe.id === 'b406';
  }

  function scaleQuantity(quantity, recipe, peopleCount = 2) {
    const q = parseQuantity(quantity);
    if (q == null) return null;
    if (fixedYieldRecipe(recipe)) return q;
    const people = Math.max(1, Math.min(8, Math.round(Number(peopleCount) || 2)));
    const base = Math.max(1, Number(recipe && recipe.servings) || 2);
    return round(q * (people / base));
  }

  function detectForm(searchName, unit) {
    const normalizedUnit = normalizeUnit(unit);
    if (
      normalizedUnit === 'boîte' ||
      /\b(?:en boite|en conserve|boites? de|conserves?|concassees?|pelees?|passata|bocaux?)\b/.test(searchName)
    ) return 'canned';
    if (/\b(?:surgel(?:e|es|ee|ees)|congel(?:e|es|ee|ees))\b/.test(searchName)) return 'frozen';
    if (/\b(?:secs?|seche(?:e?s?)?|deshydrate(?:e?s?)?|en poudre|poudre)\b/.test(searchName)) return 'dried';
    if (/\b(?:frais|fraiche|fraiches)\b/.test(searchName)) return 'fresh';
    return 'other';
  }

  function ingredientProfile(input) {
    const item = typeof input === 'string' ? { n: input } : (input || {});
    const sourceName = normalizeSpaces(item.n || item.name || item.k || '');
    const rawLower = canonicalText(sourceName);
    const search = normalizeSearchText(sourceName);
    const compoundSource = /(?:\s+(?:et|ou)\s+|\s*[+/]\s*|,\s*)/u.test(rawLower);
    const rawUnit = item.u || item.unit;
    const unitSearch = normalizeSearchText(rawUnit);
    const normalizedUnit = inferUnitFromName(sourceName, rawUnit);
    const explicitPackageCapacity = finiteNumber(item.packageCapacityGrams == null ? item.packageSizeGrams : item.packageCapacityGrams);
    const packageCapacityGrams = explicitPackageCapacity ||
      qualifiedPackageFor(rawUnit)?.packageCapacityGrams ||
      qualifiedPackageFor(sourceName)?.packageCapacityGrams || null;
    let canonicalName = canonicalText(sourceName);
    let displayName = canonicalText(sourceName);
    let kind = 'other';
    let form = ALLOWED_FORMS.has(item.form) ? item.form : detectForm(search, normalizedUnit);
    let cookedKind = '';

    if (compoundSource) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      if (/\bpates? (?:brisees?|sablees?|feuilletees?)\b/.test(search)) {
        kind = 'pastry';
        form = formOrDefault(form, 'fresh');
      } else if (/(?:^|[\s’'/-])(?:pâtes|pates)(?:$|[\s’'/-])/u.test(rawLower) || /\b(?:spaghettis?|pennes?|tagliatelles?|coquillettes?|macaronis?|fusillis?|linguines?|orzos?|tonnarellis?|bucatinis?|trofies?|vermicelles?)\b/.test(search)) {
        kind = 'pasta';
        form = formOrDefault(form, 'dried');
      } else if (/\b(?:miel|sucres?|sirop)\b/.test(search)) {
        kind = 'grocery';
        form = formOrDefault(form, 'other');
      } else if (/\b(?:basilic|coriandre|persil|ciboulette|menthe|aneth|estragon)\b/.test(search) && !MEAT_PATTERN.test(search) && !FISH_PATTERN.test(search)) {
        kind = 'herb';
        form = formOrDefault(form, 'fresh');
      } else if (DRINK_PATTERN.test(search) && !MEAT_PATTERN.test(search) && !FISH_PATTERN.test(search)) {
        kind = 'drink';
        form = form === 'dried' && /\bsecs?\b/.test(search) ? 'other' : formOrDefault(form, 'other');
      } else {
        kind = 'composite';
        form = formOrDefault(form, 'other');
      }
    } else if (/\b(?:fecule|farine|semoule|polenta) de mais\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'dry-grocery';
      form = formOrDefault(form, 'dried');
    } else if (/\bsucre glace\b/.test(search)) {
      canonicalName = 'sucre glace';
      displayName = canonicalName;
      kind = 'dry-grocery';
      form = formOrDefault(form, 'dried');
    } else if (/\bsucre semoule\b/.test(search)) {
      canonicalName = 'sucre semoule';
      displayName = canonicalName;
      kind = 'dry-grocery';
      form = formOrDefault(form, 'dried');
    } else if (/\bsucre (?:roux|blanc|complet|vanille|de canne|muscovado)\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'dry-grocery';
      form = formOrDefault(form, 'dried');
    } else if (/\b(?:glace de viande|fond reduit)\b/.test(search)) {
      canonicalName = /fond reduit/.test(search) ? 'fond réduit' : 'glace de viande';
      displayName = canonicalName;
      kind = 'grocery';
      form = formOrDefault(form, 'other');
    } else if (/\b(?:glaces?|cremes? glacees?|sorbets?)\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'frozen-dessert';
      form = formOrDefault(form, 'frozen');
    } else if (/\b(?:graines? de coriandre|coriandre moulue)\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'spice';
      form = formOrDefault(form, 'dried');
    } else if (/^(?:graines? de )?sesame$/.test(search)) {
      canonicalName = 'sésame';
      displayName = canonicalName;
      kind = 'grocery';
      form = formOrDefault(form, 'other');
    } else if (/\b(?:nouilles?|vermicelles?|galettes?) de riz\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'dry-grocery';
      form = formOrDefault(form, 'dried');
    } else if (/\bsalades? de\b/.test(search)) {
      canonicalName = normalizeKnownCanonicalName(canonicalText(sourceName));
      displayName = canonicalName;
      kind = 'produce';
      form = formOrDefault(form, 'fresh');
    } else if (/\b(?:jus|zeste|compote|soupe) (?:de |d )?(?:citron|orange|pomme|poire|peche|tomate)s?\b/.test(search) || /\b(?:(?:citron|orange|pomme|poire|peche|tomate|cerise|ananas)s?|fruits?) confit(?:e?s?)?\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'grocery';
      form = formOrDefault(form, 'other');
    } else if (/\bsucre pour (?:les )?moules\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'dry-grocery';
      form = formOrDefault(form, 'dried');
    } else if (/\bsucres?\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'dry-grocery';
      form = formOrDefault(form, 'dried');
    } else if (/\bpuree (?:de )?pommes? de terre\b/.test(search)) {
      canonicalName = /\b(?:seche|seches|en poudre)\b/.test(search)
        ? 'purée de pommes de terre sèche'
        : 'purée de pommes de terre';
      displayName = canonicalName;
      kind = 'dry-grocery';
      form = formOrDefault(form, /\b(?:seche|seches|en poudre)\b/.test(search) ? 'dried' : 'other');
    } else if (/\bcremes? (?:legeres?|entieres?|epaisses?|liquides?)\b/.test(search)) {
      canonicalName = normalizeKnownCanonicalName(canonicalText(sourceName));
      displayName = canonicalName;
      kind = 'dairy';
      form = formOrDefault(form, 'fresh');
    } else if (/\bgingembre\b/.test(search)) {
      canonicalName = /\brape\b/.test(search) ? 'gingembre râpé' : 'gingembre';
      displayName = /\brape\b/.test(search)
        ? 'gingembre râpé'
        : form === 'dried'
          ? (/\b(?:en poudre|poudre)\b/.test(search) ? 'gingembre en poudre' : 'gingembre séché')
          : form === 'frozen'
            ? 'gingembre surgelé'
            : 'gingembre frais';
      kind = 'produce';
      form = formOrDefault(form, 'fresh');
    } else if (/(?:^|[\s’'/-])pâtés?(?:$|[\s’'/-])/u.test(rawLower) || /\b(?:terrine|rillettes?)\b/.test(search)) {
      canonicalName = /terrine/.test(search) ? 'terrine' : /rillettes?/.test(search) ? 'rillettes' : 'pâté';
      displayName = canonicalName;
      kind = 'charcuterie';
      form = formOrDefault(form, 'other');
    } else if (/\bpates? feuilletees?\b/.test(search)) {
      canonicalName = pastryCanonicalFor(sourceName, search);
      displayName = canonicalName;
      kind = 'pastry';
      form = formOrDefault(form, 'fresh');
    } else if (/\bpates? (?:brisees?|sablees?|a pizza|a tarte)\b/.test(search)) {
      canonicalName = pastryCanonicalFor(sourceName, search);
      displayName = canonicalName;
      kind = 'pastry';
      form = formOrDefault(form, 'fresh');
    } else if (/(?:^|[\s’'/-])(?:pâtes|pates)(?:$|[\s’'/-])/u.test(rawLower) || /\b(?:spaghettis?|pennes?|tagliatelles?|coquillettes?|macaronis?|fusillis?|linguines?|orzos?)\b/.test(search)) {
      canonicalName = pastaCanonicalFor(search);
      kind = 'pasta';
      form = formOrDefault(form, 'dried');
      displayName = form === 'fresh' ? `${canonicalName} fraîches` : form === 'frozen' ? `${canonicalName} surgelées` : form === 'canned' ? `${canonicalName} en conserve` : canonicalName;
      if (COOKED_PATTERN.test(search)) cookedKind = 'pasta';
    } else if (/\bmoutarde\b/.test(search)) {
      if (/\bdijon\b/.test(search)) canonicalName = 'moutarde de Dijon';
      else if (/\ba l ancienne\b/.test(search)) canonicalName = 'moutarde à l’ancienne';
      else canonicalName = normalizeKnownCanonicalName(canonicalText(sourceName));
      displayName = canonicalName;
      kind = 'condiment';
      form = formOrDefault(form, 'other');
    } else if (/\bmayonnaise\b/.test(search)) {
      canonicalName = /\bmaison\b/.test(search) ? 'mayonnaise maison' : 'mayonnaise';
      displayName = canonicalName;
      kind = 'condiment';
      form = formOrDefault(form, 'other');
    } else if (/\bketchup\b/.test(search)) {
      canonicalName = 'ketchup';
      displayName = canonicalName;
      kind = 'condiment';
      form = formOrDefault(form, 'other');
    } else if (/\b(?:pestos?|harissas?|raiforts?|sauces? barbecue|worcestershire|tabascos?)\b/.test(search)) {
      canonicalName = normalizeKnownCanonicalName(canonicalText(sourceName));
      displayName = canonicalName;
      kind = 'condiment';
      form = formOrDefault(form, 'other');
    } else if (/\bmiel\b/.test(search)) {
      canonicalName = 'miel';
      displayName = canonicalName;
      kind = 'condiment';
      form = formOrDefault(form, 'other');
    } else if (/\bconcentres? de tomates?\b/.test(search)) {
      canonicalName = 'concentré de tomate';
      displayName = canonicalName;
      kind = 'condiment';
      form = formOrDefault(form, 'other');
    } else if (/\b(?:sauce soja|mirin|vinaigrettes?|vinaigres?|huile d olive|huile neutre)\b/.test(search)) {
      if (/sauce soja/.test(search)) canonicalName = 'sauce soja';
      else if (/mirin/.test(search)) canonicalName = 'mirin';
      else if (/^vinaigrettes?$/.test(search)) canonicalName = 'vinaigrette';
      else if (/huile d olive/.test(search)) canonicalName = 'huile d’olive';
      else if (/huile neutre/.test(search)) canonicalName = 'huile neutre';
      else canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'condiment';
      form = formOrDefault(form, 'other');
    } else if (/\bcoulis\b/.test(search)) {
      canonicalName = /tomate/.test(search) ? 'coulis de tomate' : canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'grocery';
      form = formOrDefault(form, 'other');
    } else if (/\bfonds? de (?:veau|volaille|boeuf|legumes?)\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'grocery';
      form = formOrDefault(form, 'other');
    } else if (/\bbouillons?\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'grocery';
      form = formOrDefault(form, 'other');
    } else if (/\bglaces?\b/.test(search)) {
      canonicalName = 'glace';
      displayName = canonicalText(sourceName);
      kind = 'grocery';
      form = formOrDefault(form, 'frozen');
    } else if (/\bbasilic\b/.test(search)) {
      canonicalName = 'basilic';
      form = formOrDefault(form, 'fresh');
      displayName = form === 'dried' ? 'basilic séché' : form === 'frozen' ? 'basilic surgelé' : form === 'fresh' ? 'basilic frais' : 'basilic';
      kind = 'herb';
    } else if (/\bpersil\b/.test(search)) {
      canonicalName = 'persil';
      form = formOrDefault(form, 'fresh');
      displayName = form === 'dried' ? 'persil séché' : form === 'frozen' ? 'persil surgelé' : form === 'fresh' ? 'persil frais' : 'persil';
      kind = 'herb';
    } else if (/\b(?:coriandre|ciboulette|menthe|aneth|estragon|cerfeuil|sauge|romarin)\b/.test(search)) {
      canonicalName = search.match(/\b(coriandre|ciboulette|menthe|aneth|estragon|cerfeuil|sauge|romarin)\b/)[1];
      form = formOrDefault(form, 'fresh');
      const feminineHerb = /^(?:coriandre|ciboulette|menthe|sauge)$/.test(canonicalName);
      displayName = form === 'dried'
        ? `${canonicalName} ${feminineHerb ? 'séchée' : 'séché'}`
        : form === 'frozen'
          ? `${canonicalName} ${feminineHerb ? 'surgelée' : 'surgelé'}`
          : form === 'fresh'
            ? `${canonicalName} ${feminineHerb ? 'fraîche' : 'frais'}`
            : canonicalName;
      kind = 'herb';
    } else if (/\blaurier\b/.test(search)) {
      canonicalName = 'laurier';
      displayName = 'laurier';
      kind = 'herb';
      form = formOrDefault(form, 'dried');
    } else if (/\b(?:paprika|curry|cumin|curcuma|cannelle|muscade|origan|thym|cardamome|badiane|carvi|pavot|chia|epices?)\b/.test(search)) {
      canonicalName = canonicalText(sourceName).replace(/\s+(?:séché|séchée|en poudre)$/u, '');
      displayName = canonicalName;
      kind = 'spice';
      form = formOrDefault(form, 'dried');
    } else if (/\bknacks?\b/.test(search)) {
      canonicalName = 'knacks';
      displayName = 'knacks';
      kind = 'charcuterie';
      form = formOrDefault(form, 'other');
    } else if (/\b(?:jambons?|lardons?|chorizos?|bacons?|andouillettes?|saucissons?|boudins?)\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalText(sourceName);
      kind = 'charcuterie';
      form = formOrDefault(form, 'other');
    } else if (/\b(?:saucisses?|merguez|chipolatas?|chair a saucisse)\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalText(sourceName);
      kind = 'meat';
      form = formOrDefault(form, 'fresh');
    } else if (/\b(?:gousses? d ail|ail)\b/.test(search)) {
      canonicalName = /\bail noir\b/.test(search) ? 'ail noir' : 'ail';
      kind = 'produce';
      form = formOrDefault(form, 'fresh');
      displayName = canonicalName === 'ail noir'
        ? canonicalName
        : form === 'dried' ? (/\ben poudre\b/.test(search) ? 'ail en poudre' : 'ail séché') : form === 'frozen' ? 'ail surgelé' : 'ail';
    } else if (/\bthons?\b/.test(search)) {
      canonicalName = 'thon';
      kind = 'fish';
      form = formOrDefault(form, 'fresh');
      displayName = form === 'frozen' ? 'thon surgelé' : form === 'dried' ? 'thon séché' : form === 'fresh' ? 'thon frais' : 'thon';
    } else if (/(?:^|[\s’'/-])maïs(?:$|[\s’'/-])/u.test(rawLower) || /^mais(?:\s+(?:frais|doux|en boite|en conserve))?$/u.test(search)) {
      canonicalName = 'maïs';
      displayName = form === 'canned' ? 'maïs' : canonicalText(sourceName);
      kind = form === 'canned' ? 'canned-produce' : 'produce';
      form = formOrDefault(form, 'fresh');
    } else if (/\b(?:tomates? concassees?|tomates? pelees?|pulpe de tomates?|passata)\b/.test(search)) {
      canonicalName = search.includes('passata')
        ? 'passata'
        : /\bpelees?\b/.test(search)
          ? 'tomates pelées'
          : 'tomates concassées';
      displayName = canonicalName;
      kind = 'canned-produce';
      form = 'canned';
    } else if (/\btomates?\b/.test(search)) {
      const packageVariant = /\bpetites? boites?\b/.test(unitSearch)
        ? 'petite boîte'
        : /\b(?:grandes?|grosses?) boites?\b/.test(unitSearch)
          ? 'grande boîte'
          : '';
      canonicalName = packageVariant
        ? `tomates en ${packageVariant}`
        : /\bentieres?\b/.test(search)
          ? 'tomates entières'
          : /cerises?/.test(search)
            ? 'tomates cerises'
            : /\bsalades?\b/.test(search)
              ? 'tomate salade'
              : 'tomate';
      kind = 'produce';
      form = formOrDefault(form, 'fresh');
      displayName = packageVariant ? canonicalName : form === 'dried' ? 'tomates séchées' : form === 'frozen' ? 'tomates surgelées' : canonicalName;
    } else if (/\briz\b/.test(search)) {
      canonicalName = riceCanonicalFor(search);
      displayName = canonicalName;
      kind = 'rice';
      form = formOrDefault(form, 'dried');
      if (COOKED_PATTERN.test(search)) cookedKind = 'rice';
    } else if (/\bquinoa\b/.test(search)) {
      canonicalName = 'quinoa';
      displayName = 'quinoa';
      kind = 'quinoa';
      form = formOrDefault(form, 'dried');
      if (COOKED_PATTERN.test(search)) cookedKind = 'quinoa';
    } else if (/\bboulgour\b/.test(search)) {
      canonicalName = /\bfin\b/.test(search) ? 'boulgour fin' : 'boulgour';
      displayName = canonicalName;
      kind = 'bulgur';
      form = formOrDefault(form, 'dried');
      if (COOKED_PATTERN.test(search)) cookedKind = 'bulgur';
    } else if (/\bsemoule\b/.test(search)) {
      canonicalName = /\bfines?\b/.test(search) ? 'semoule fine' : /\bmoyennes?\b/.test(search) ? 'semoule moyenne' : 'semoule';
      displayName = canonicalName;
      kind = 'semolina';
      form = formOrDefault(form, 'dried');
      if (COOKED_PATTERN.test(search)) cookedKind = 'semolina';
    } else if (/\bpaves? de saumon\b/.test(search)) {
      canonicalName = 'saumon';
      displayName = 'saumon';
      kind = 'fish';
      form = formOrDefault(form, 'fresh');
    } else if (FISH_PATTERN.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalText(sourceName);
      kind = 'fish';
      form = formOrDefault(form, 'fresh');
    } else if (MEAT_PATTERN.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalText(sourceName);
      kind = 'meat';
      form = formOrDefault(form, 'fresh');
    } else if (BAKERY_PATTERN.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalText(sourceName);
      kind = 'bakery';
      form = formOrDefault(form, 'fresh');
    } else if (PRODUCE_PATTERN.test(search)) {
      const produceAliases = [
        [/\bcitrons?\b/, 'citron'], [/\boranges?\b/, 'orange'], [/\bpommes? de terre\b/, 'pommes de terre'],
        [/\bpommes?\b/, 'pomme'], [/\bpoires?\b/, 'poire'], [/\bbananes?\b/, 'banane'],
        [/\bmelons?\b/, 'melon'], [/\bavocats?\b/, 'avocat'], [/\bcarottes?\b/, 'carotte'],
        [/\bconcombres?\b/, 'concombre'], [/\bcourgettes?\b/, 'courgette'], [/\bechalotes?\b/, 'échalote'],
        [/\boignons?\b/, 'oignon'], [/\bpoireaux?\b/, 'poireau'], [/\bpoivrons?\b/, 'poivron'],
        [/\baubergines?\b/, 'aubergine'], [/\bbrocolis?\b/, 'brocoli']
      ];
      const alias = produceAliases.find(([pattern]) => pattern.test(search));
      canonicalName = alias ? produceVariantCanonical(alias[1], search) : canonicalText(sourceName);
      displayName = alias ? canonicalName : canonicalText(sourceName);
      kind = 'produce';
      form = formOrDefault(form, 'fresh');
    } else if (/\bfromages? frais\b/.test(search)) {
      canonicalName = 'fromage frais';
      displayName = canonicalName;
      kind = 'dairy';
      form = formOrDefault(form, 'fresh');
    } else if (DAIRY_PATTERN.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalText(sourceName);
      kind = 'dairy';
      form = formOrDefault(form, 'fresh');
    } else if (DRINK_PATTERN.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalName;
      kind = 'drink';
      form = form === 'dried' && /\bsecs?\b/.test(search) ? 'other' : formOrDefault(form, 'other');
    } else if (/\b(?:farines?|sucres?|chapelures?|panko|flocons? d avoine|polenta|lentilles?|pois chiches?|haricots? rouges?|haricots? blancs?|levures?|cacaos?|chocolats?|nouilles?)\b/.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalText(sourceName);
      kind = 'dry-grocery';
      form = COOKED_PATTERN.test(search) ? 'other' : formOrDefault(form, 'dried');
    } else if (GROCERY_PATTERN.test(search)) {
      canonicalName = canonicalText(sourceName);
      displayName = canonicalText(sourceName);
      kind = 'grocery';
      form = form === 'other' ? 'other' : form;
    }

    if (!canonicalName) canonicalName = normalizeSearchText(sourceName) || 'article';
    const semanticQualifier =
      /\bfromages? frais\b/.test(search) ||
      /\bcremes? fraiches?\b/.test(search) ||
      /\boeufs? (?:tres )?frais\b/.test(search) ||
      /\bpuree (?:de )?pommes? de terre\b/.test(search) ||
      (kind === 'drink' && /\bsecs?\b/.test(search));
    const canonicalBase = semanticQualifier ? stripContainerFormSuffix(canonicalName) : stripCanonicalFormSuffix(canonicalName);
    canonicalName = compoundSource ? canonicalText(canonicalBase) : normalizeKnownCanonicalName(canonicalBase);
    displayName = stripContainerFormSuffix(displayName);
    if (canonicalText(normalizeKnownCanonicalName(displayName)) === canonicalText(canonicalName)) {
      displayName = canonicalName;
    }
    if (!displayName) displayName = canonicalName;
    if (!ALLOWED_FORMS.has(form)) form = 'other';
    return {
      sourceName,
      searchName: search,
      canonicalName: normalizeSpaces(canonicalName),
      displayName: normalizeSpaces(displayName),
      form,
      kind,
      cookedKind,
      unit: normalizedUnit,
      packageCapacityGrams
    };
  }

  function fnv1a(value) {
    let hash = 0x811c9dc5;
    const text = String(value == null ? '' : value);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function productKeyFor(value, explicitForm) {
    const profile = typeof value === 'object' && value
      ? value
      : { canonicalName: normalizeSpaces(value), form: explicitForm || 'other' };
    const canonicalName = normalizeSpaces(profile.canonicalName || profile.name || value || 'article');
    const form = ALLOWED_FORMS.has(profile.form) ? profile.form : 'other';
    const identity = `${canonicalIdentityText(canonicalName)}|${form}`;
    const slug = normalizeSearchText(canonicalName).replace(/\s+/g, '-').slice(0, 56) || 'article';
    return `clair-repas:v2:${fnv1a(identity)}:${form}:${slug}`;
  }

  function legacyProductKeyFor(value) {
    const exact = normalizeSpaces(value).toLocaleLowerCase('fr-FR');
    return `clair-repas:${fnv1a(exact)}:${exact.slice(0, 72)}`;
  }

  function aisleFor(value, explicitForm, explicitUnit) {
    const profile = typeof value === 'object' && value && value.canonicalName
      ? value
      : ingredientProfile({ n: value, u: explicitUnit });
    const form = explicitForm || profile.form;
    const search = normalizeSearchText(`${profile.canonicalName || ''} ${profile.displayName || ''}`);

    if (form === 'canned') return 'Conserves';
    if (form === 'frozen') return 'Surgelés';
    if (/\beaux?\b/.test(search)) return 'Eau';
    for (const [aisle, pattern] of EXTENDED_AISLE_RULES) {
      if (pattern.test(search)) return aisle;
    }
    if (profile.kind === 'pastry' || profile.kind === 'bakery') return 'Boulangerie';
    if (profile.kind === 'charcuterie') return 'Charcuterie';
    if (profile.kind === 'meat') return 'Boucherie';
    if (profile.kind === 'fish') return 'Poissonnerie';
    if (profile.kind === 'dairy') return 'Crèmerie';
    if (profile.kind === 'drink') return 'Boissons';
    if (profile.kind === 'produce' && form === 'dried') return 'Épicerie';
    if (profile.kind === 'produce' || (profile.kind === 'herb' && form === 'fresh')) return 'Fruits et légumes';
    if (profile.kind === 'herb' || profile.kind === 'spice' || profile.kind === 'condiment') return 'Épicerie';
    if (['pasta', 'rice', 'quinoa', 'bulgur', 'semolina', 'dry-grocery', 'grocery'].includes(profile.kind)) return 'Épicerie';
    if (profile.kind === 'composite' && MEAT_PATTERN.test(search) && FISH_PATTERN.test(search)) {
      const fishIndex = search.search(FISH_PATTERN);
      const meatIndex = search.search(MEAT_PATTERN);
      return fishIndex >= 0 && (meatIndex < 0 || fishIndex <= meatIndex) ? 'Poissonnerie' : 'Boucherie';
    }
    if (BAKERY_PATTERN.test(search)) return 'Boulangerie';
    if (CHARCUTERIE_PATTERN.test(search)) return 'Charcuterie';
    if (MEAT_PATTERN.test(search)) return 'Boucherie';
    if (FISH_PATTERN.test(search)) return 'Poissonnerie';
    if (DAIRY_PATTERN.test(search)) return 'Crèmerie';
    if (DRINK_PATTERN.test(search)) return 'Boissons';
    if (PRODUCE_PATTERN.test(search)) return 'Fruits et légumes';
    if (GROCERY_PATTERN.test(search)) return 'Épicerie';
    return 'Divers';
  }

  function roundConvertedGrams(value) {
    const q = finiteNumber(value);
    if (q == null) return null;
    return Math.max(10, Math.round(q / 10) * 10);
  }

  function formatDecimal(value, maximumFractionDigits = 2) {
    const q = round(value, maximumFractionDigits);
    if (q == null) return '';
    return new Intl.NumberFormat('fr-FR', {
      useGrouping: false,
      maximumFractionDigits
    }).format(q);
  }

  function formatFraction(value) {
    const q = round(value);
    if (q == null) return '';
    const whole = Math.floor(q + 0.000001);
    const fraction = q - whole;
    const match = Object.entries(FRACTIONS).find(([, amount]) => Math.abs(fraction - amount) < 0.001);
    if (match) return `${whole || ''}${match[0]}`;
    return formatDecimal(q);
  }

  function pluralUnit(unit, quantity) {
    const q = Number(quantity);
    if (Math.abs(q) <= 1) return unit;
    const plurals = {
      feuille: 'feuilles',
      gousse: 'gousses',
      boîte: 'boîtes',
      pavé: 'pavés',
      tranche: 'tranches',
      sachet: 'sachets',
      paquet: 'paquets',
      pot: 'pots',
      bocal: 'bocaux',
      bouteille: 'bouteilles',
      flacon: 'flacons',
      tube: 'tubes',
      barquette: 'barquettes',
      rouleau: 'rouleaux',
      bouquet: 'bouquets',
      'petit bouquet': 'petits bouquets',
      'grand bouquet': 'grands bouquets',
      'gros bouquet': 'gros bouquets',
      botte: 'bottes',
      branche: 'branches',
      brique: 'briques',
      dose: 'doses',
      goutte: 'gouttes',
      tête: 'têtes',
      pincée: 'pincées',
      unité: 'unités'
    };
    return plurals[unit] || unit;
  }

  function pluralizeCountWord(value) {
    const word = canonicalText(value);
    if (!word || /\d/u.test(word)) return word;
    const irregular = {
      ail: 'ail',
      bœuf: 'bœufs',
      œuf: 'œufs',
      chou: 'choux',
      bijou: 'bijoux',
      caillou: 'cailloux',
      genou: 'genoux',
      hibou: 'hiboux',
      joujou: 'joujoux',
      pou: 'poux',
      bleu: 'bleus'
    };
    if (irregular[word]) return irregular[word];
    if (/[sxz]$/u.test(word)) return word;
    if (/(?:eau|au|eu)$/u.test(word)) return `${word}x`;
    if (/al$/u.test(word)) return `${word.slice(0, -2)}aux`;
    return `${word}s`;
  }

  function pluralizeCountName(value, quantity) {
    const name = normalizeSpaces(value);
    const q = finiteNumber(quantity);
    if (!name || q == null || Math.abs(q) <= 1) return name;
    const known = {
      'pomme de terre': 'pommes de terre',
      'pommes de terre': 'pommes de terre',
      'haricot vert': 'haricots verts',
      'haricots verts': 'haricots verts',
      'petit pois': 'petits pois',
      'petits pois': 'petits pois',
      'tomate cerise': 'tomates cerises',
      'tomates cerises': 'tomates cerises',
      'patate douce': 'patates douces',
      'filet mignon': 'filets mignons',
      'pain de mie': 'pains de mie',
      'muffin anglais': 'muffins anglais'
    };
    const canonical = canonicalText(name);
    if (known[canonical]) return known[canonical];
    const preposition = canonical.match(/^(.*?)(\s+(?:de|à|au|aux|en|avec|sans|par|pour|sur|sous|ou|et|non)\s+|\s+d’)(.+)$/u);
    if (preposition) {
      const head = preposition[1].split(/\s+/u).map(pluralizeCountWord).join(' ');
      return `${head}${preposition[2]}${preposition[3]}`;
    }
    return canonical.split(/\s+/u).map(pluralizeCountWord).join(' ');
  }

  function singularizeCountName(value, quantity) {
    const name = canonicalText(value);
    const q = finiteNumber(quantity);
    if (!name || q == null || Math.abs(q) > 1) return name;
    const replacements = [
      [/^pommes de terre\b/u, 'pomme de terre'],
      [/^cuisses\b/u, 'cuisse'],
      [/^branches\b/u, 'branche'],
      [/^tranches\b/u, 'tranche'],
      [/^feuilles\b/u, 'feuille'],
      [/^pavés\b/u, 'pavé'],
      [/^gousses\b/u, 'gousse'],
      [/^côtes\b/u, 'côte'],
      [/^escalopes\b/u, 'escalope'],
      [/^bouteilles\b/u, 'bouteille'],
      [/^saucisses\b/u, 'saucisse']
    ];
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(name)) return name.replace(pattern, replacement);
    }
    return name;
  }

  function nameStartsWithUnit(value, unit) {
    const name = canonicalText(value);
    const patterns = {
      tranche: /^tranches?\b/u,
      feuille: /^feuilles?\b/u,
      pavé: /^pavés?\b/u,
      gousse: /^gousses?\b/u,
      bouquet: /^bouquets?\b/u,
      botte: /^bottes?\b/u,
      branche: /^branches?\b/u
    };
    const pattern = patterns[normalizeUnit(unit)];
    return Boolean(pattern && pattern.test(name));
  }

  function deName(name) {
    const value = normalizeSpaces(name);
    if (/^(?:haricots?|harissa|harengs?|yaourts?)\b/iu.test(value)) return `de ${value}`;
    if (/^(?:herbes?|homards?|huiles?|hu[iî]tres?)\b/iu.test(value)) return `d’${value}`;
    return /^[aeiouàâäéèêëîïôöùûüœ]/iu.test(value) ? `d’${value}` : `de ${value}`;
  }

  function exactLabel(quantity, unit, name) {
    if (quantity == null) return normalizeSpaces(name);
    const q = unit === 'kg' || unit === 'g' || unit === 'ml' || unit === 'cl' || unit === 'l'
      ? formatDecimal(quantity)
      : formatFraction(quantity);
    if (!unit || unit === 'unité') {
      const countName = Math.abs(Number(quantity)) <= 1
        ? singularizeCountName(name, quantity)
        : pluralizeCountName(name, quantity);
      return `${q} ${countName}`.trim();
    }
    if (['g', 'kg', 'ml', 'cl', 'l', 'c. à soupe', 'c. à café', 'pincée'].includes(unit)) {
      return `${q} ${unit} ${deName(name)}`;
    }
    if (nameStartsWithUnit(name, unit)) return `${q} ${singularizeCountName(name, quantity)}`;
    return `${q} ${pluralUnit(unit, quantity)} ${deName(name)}`;
  }

  function convertedDryExactLabel(quantity, unit, model) {
    const q = ['g', 'kg'].includes(unit) ? formatDecimal(quantity) : formatFraction(quantity);
    const dryNames = {
      rice: 'riz sec',
      pasta: 'pâtes sèches',
      quinoa: 'quinoa sec',
      bulgur: 'boulgour sec',
      semolina: 'semoule sèche'
    };
    const dryName = dryNames[model.kind] || `${model.displayName} sec`;
    return `environ ${q} ${unit} ${deName(dryName)}`;
  }

  function purchaseLabel(quantity, unit, name) {
    if (quantity == null) return normalizeSpaces(name);
    const q = ['g', 'kg', 'ml', 'cl', 'l'].includes(unit) ? formatDecimal(quantity) : formatFraction(quantity);
    if (!unit || unit === 'unité') {
      const countName = Math.abs(Number(quantity)) <= 1
        ? singularizeCountName(name, quantity)
        : pluralizeCountName(name, quantity);
      return `${q} ${countName}`.trim();
    }
    if (unit === 'tête' && normalizeSearchText(name) === 'ail') return `${q} ${pluralUnit(unit, quantity)} d’ail`;
    if (unit === 'pavé' && normalizeSearchText(name) === 'saumon') return `${q} ${pluralUnit(unit, quantity)} de saumon`;
    if (['g', 'kg', 'ml', 'cl', 'l'].includes(unit)) return `${q} ${unit} ${deName(name)}`;
    if (nameStartsWithUnit(name, unit)) return `${q} ${singularizeCountName(name, quantity)}`;
    return `${q} ${pluralUnit(unit, quantity)} ${deName(name)}`;
  }

  function qualifiedPackageLabel(quantity, unit, capacityGrams, name) {
    return `${formatFraction(quantity)} ${pluralUnit(unit, quantity)} de ${formatDecimal(capacityGrams)} g ${deName(name)}`;
  }

  function humanExact(group) {
    const total = group.totalBase == null ? null : round(group.totalBase);
    if (group.dimension === 'mass') {
      if (total != null && total >= 1000) return { quantity: round(total / 1000), unit: 'kg' };
      return { quantity: total, unit: 'g' };
    }
    if (group.dimension === 'volume') {
      const units = new Set(group.contributions.map(entry => entry.unit));
      if (units.size === 1) {
        const unit = [...units][0];
        if (unit === 'l') return { quantity: round(total / 1000), unit };
        if (unit === 'cl') return { quantity: round(total / 10), unit };
        if (unit === 'c. à soupe') return { quantity: round(total / 15), unit };
        if (unit === 'c. à café') return { quantity: round(total / 5), unit };
      }
      if (total != null && total >= 1000) return { quantity: round(total / 1000), unit: 'l' };
      return { quantity: total, unit: 'ml' };
    }
    return { quantity: total, unit: group.unit || 'unité' };
  }

  function cannedPackageCountFor(model) {
    const exactQ = finiteNumber(model && model.exactQuantity);
    const exactUnit = normalizeUnit(model && model.exactUnit);
    if (model && model.dimension === 'mass') {
      const grams = finiteNumber(model.baseQuantity);
      const capacity = finiteNumber(model.packageCapacityGrams) || CANNED_PACKAGE_SIZE_GRAMS;
      return grams == null ? 1 : Math.max(1, Math.ceil(grams / capacity));
    }
    if (model && model.dimension === 'count' && exactQ != null) {
      const search = normalizeSearchText(model.canonicalName);
      const countIsDiscretePieces = /\b(?:escargots?|olives?|sardines?|anchois|câpres?)\b/u.test(canonicalText(model.canonicalName));
      const countIsPackages = ['boîte', 'bocal'].includes(exactUnit) || !countIsDiscretePieces;
      if (countIsPackages) return Math.max(1, Math.ceil(exactQ));
    }
    return 1;
  }

  function purchaseFor(model) {
    const search = normalizeSearchText(model.canonicalName);
    const exactQ = model.exactQuantity;
    const exactUnit = model.exactUnit;
    const baseQ = model.baseQuantity;
    let quantity = exactQ;
    let unit = exactUnit;
    let name = model.displayName;

    if (/^moutarde(?: |$)/.test(search) || /^mayonnaise(?: |$)/.test(search)) {
      quantity = 1;
      unit = 'pot';
    } else if (model.kind === 'grocery' && /\bmiel\b/.test(search) && /\bsirop\b/.test(search)) {
      quantity = 1;
      unit = 'pot';
    } else if (search === 'ketchup') {
      quantity = 1;
      unit = 'flacon';
    } else if (/^(?:pesto|harissa|raifort)(?: |$)/.test(search)) {
      quantity = 1;
      unit = 'pot';
    } else if (/^(?:sauce barbecue|(?:sauce )?worcestershire|tabasco)(?: |$)/.test(search)) {
      quantity = 1;
      unit = 'flacon';
    } else if (search === 'miel') {
      quantity = 1;
      unit = 'pot';
    } else if (search === 'concentre de tomate') {
      quantity = 1;
      unit = 'tube';
    } else if (/^(?:sauce soja|mirin|vinaigrette(?: |$)|vinaigre(?: |$)|huile d olive$|huile neutre$)/.test(search)) {
      quantity = 1;
      unit = 'bouteille';
    } else if (search === 'sesame') {
      quantity = 1;
      unit = 'sachet';
    } else if (model.kind === 'herb' && model.form === 'fresh') {
      quantity = 1;
      unit = search === 'basilic' ? 'pot' : 'bouquet';
    } else if (model.kind === 'herb' && model.form === 'dried') {
      quantity = 1;
      unit = search === 'laurier' ? 'sachet' : 'pot';
    } else if (model.kind === 'spice') {
      quantity = 1;
      unit = 'pot';
    } else if (search === 'knacks') {
      quantity = Math.max(1, Math.ceil((finiteNumber(exactQ) || 1) / 6));
      unit = 'paquet';
    } else if (search === 'ail' && exactUnit === 'gousse') {
      quantity = Math.max(1, Math.ceil((finiteNumber(exactQ) || 1) / 8));
      unit = 'tête';
      name = 'ail';
    } else if (model.form === 'canned') {
      quantity = cannedPackageCountFor(model);
      unit = 'boîte';
      name = search === 'tomate' ? 'tomates' : model.canonicalName;
    } else if (model.kind === 'drink') {
      if (model.dimension === 'volume') {
        const millilitres = finiteNumber(baseQ);
        quantity = Math.max(1, Math.ceil((millilitres || 1) / 750));
      } else {
        const count = finiteNumber(exactQ);
        quantity = count == null ? 1 : Math.max(1, Math.ceil(count));
      }
      unit = 'bouteille';
    } else if (model.kind === 'rice') {
      quantity = Math.max(1, Math.ceil((finiteNumber(baseQ) || 1) / 1000));
      unit = 'paquet';
      name = model.displayName;
    } else if (model.kind === 'pasta') {
      quantity = Math.max(1, Math.ceil((finiteNumber(baseQ) || 1) / 500));
      unit = 'paquet';
      name = model.displayName;
    } else if (['quinoa', 'bulgur', 'semolina'].includes(model.kind)) {
      quantity = Math.max(1, Math.ceil((finiteNumber(baseQ) || 1) / 500));
      unit = 'paquet';
    } else if (model.kind === 'dry-grocery' && /\b(?:farine|sucre|chapelure|panko|flocons? d avoine|polenta)\b/.test(search)) {
      const packageSize = /farine|sucre/.test(search) ? 1000 : /chapelure|panko/.test(search) ? 250 : 500;
      quantity = Math.max(1, Math.ceil((finiteNumber(baseQ) || 1) / packageSize));
      unit = 'paquet';
    } else if (model.kind === 'pastry' && /pate feuilletee/.test(search)) {
      quantity = model.dimension === 'mass'
        ? Math.max(1, Math.ceil((finiteNumber(baseQ) || 1) / 300))
        : Math.max(1, Math.ceil(finiteNumber(exactQ) || 1));
      unit = 'rouleau';
      name = model.displayName;
    } else if (search === 'pate' || model.kind === 'charcuterie' && /\bpate\b/.test(search)) {
      quantity = 1;
      unit = 'barquette';
      name = 'pâté';
    } else if (model.kind === 'produce' && model.dimension === 'count') {
      quantity = finiteNumber(exactQ) == null ? null : Math.max(1, Math.ceil(exactQ));
      unit = exactUnit === 'gousse' && quantity != null ? 'tête' : exactUnit || 'unité';
      if (exactUnit === 'gousse') name = 'ail';
    } else if ((model.kind === 'meat' || model.kind === 'fish') && model.dimension === 'mass') {
      quantity = exactQ;
      unit = exactUnit;
    } else if ((model.kind === 'meat' || model.kind === 'fish') && model.dimension === 'count') {
      quantity = finiteNumber(exactQ) == null ? null : Math.max(1, Math.ceil(exactQ));
      unit = exactUnit || 'unité';
    } else if (exactUnit === 'boîte') {
      quantity = Math.max(1, Math.ceil(finiteNumber(exactQ) || 1));
      unit = 'boîte';
    } else if (model.dimension === 'count' && finiteNumber(exactQ) != null) {
      quantity = Math.max(1, Math.ceil(exactQ));
      unit = exactUnit || 'unité';
    }

    const label = ['boîte', 'bocal'].includes(unit) && model.packageCapacityGrams
      ? qualifiedPackageLabel(quantity, unit, model.packageCapacityGrams, name)
      : purchaseLabel(quantity, unit, name);
    return {
      purchaseQuantity: round(quantity),
      purchaseUnit: unit || 'unité',
      purchaseLabel: label,
      purchasePackage: Boolean(model.packageCapacityGrams) || unit !== exactUnit || Math.abs(Number(quantity) - Number(exactQ)) > 0.000001
    };
  }

  function sourceScaledQuantity(item, recipe, source, peopleCount, options) {
    const rawQuantity = parseQuantity(item && item.q);
    if (rawQuantity == null) return null;
    const embeddedAlternative = normalizeSearchText(item && (item.n || item.name)).match(/\bou (\d+(?:[.,]\d+)?)\b/);
    if (embeddedAlternative && Number(embeddedAlternative[1].replace(',', '.')) === rawQuantity) return rawQuantity;
    if (source && source.fixedYield === true) return rawQuantity;
    let explicitScale = source && finiteNumber(source.scale);
    if (explicitScale == null && source) explicitScale = finiteNumber(source.quantityScale);
    if (explicitScale == null && typeof options.scaleForSource === 'function') {
      explicitScale = finiteNumber(options.scaleForSource(source, recipe));
    }
    if (explicitScale != null) return round(rawQuantity * explicitScale);
    return scaleQuantity(rawQuantity, recipe, peopleCount);
  }

  function contributionFor(item, recipe, sourceRecipeId, peopleCount, source, options) {
    const profile = ingredientProfile(item);
    const scaledQuantity = sourceScaledQuantity(item, recipe, source, peopleCount, options);
    const unit = profile.unit || (scaledQuantity != null ? 'unité' : '');
    const base = toBaseQuantity(scaledQuantity, unit);
    const sourceBaseQuantity = base.quantity;
    let baseQuantity = sourceBaseQuantity;
    let conversion = null;

    if (profile.cookedKind && base.dimension === 'mass' && sourceBaseQuantity != null) {
      const factor = COOKED_GRAIN_FACTORS[profile.cookedKind];
      baseQuantity = roundConvertedGrams(sourceBaseQuantity * factor);
      conversion = {
        kind: 'cooked-to-dry',
        factor: round(factor),
        fromQuantity: scaledQuantity,
        fromUnit: unit,
        toQuantity: baseQuantity,
        toUnit: 'g'
      };
    }

    const productKey = productKeyFor(profile);
    const quantityKind = scaledQuantity == null ? 'unspecified' : 'specified';
    const unitKey = `${base.dimension === 'count' ? (unit || 'unité') : base.dimension}|package:${profile.packageCapacityGrams || ''}`;
    return {
      item: { ...(item || {}) },
      sourceRecipeId,
      sourceRecipeName: normalizeSpaces(recipe && recipe.n),
      profile,
      productKey,
      unit,
      dimension: base.dimension,
      quantityKind,
      groupKey: `${productKey}\u241f${unitKey}\u241f${quantityKind}`,
      scaledQuantity,
      baseQuantity,
      sourceBaseQuantity,
      conversion,
      packageCapacityGrams: profile.packageCapacityGrams
    };
  }

  function availableIngredient(item, profile, source, options) {
    if (typeof options.isIngredientAvailable === 'function') {
      return Boolean(options.isIngredientAvailable(item, source, profile));
    }
    const availableItems = Array.isArray(source && source.availableItems) ? source.availableItems : [];
    if (!availableItems.length) return false;

    const visibleNameFor = value => {
      if (typeof value === 'string') return normalizeSpaces(value);
      if (!value || typeof value !== 'object') return normalizeSpaces(value);
      return normalizeSpaces(value.n || value.name || value.label || '');
    };
    const explicitFormFor = (value, visibleName) => {
      const structured = value && typeof value === 'object' ? value : {};
      if (ALLOWED_FORMS.has(structured.form) && structured.form !== 'other') return structured.form;
      const unit = structured.u || structured.unit || '';
      const detected = detectForm(normalizeSearchText(visibleName), unit);
      return detected === 'other' ? '' : detected;
    };

    const expectedProductKey = productKeyFor(profile);
    const expectedVisibleName = visibleNameFor(item) || profile.sourceName || profile.canonicalName;
    const expectedExplicitForm = explicitFormFor(item, expectedVisibleName);
    const expectedCanonical = canonicalIdentityText(profile.canonicalName);

    return availableItems.some(candidate => {
      const structured = candidate && typeof candidate === 'object' ? candidate : {};
      const visibleName = visibleNameFor(candidate);
      const suppliedProductKey = normalizeSpaces(
        structured.productKey || (/^clair-repas:v2:/u.test(String(structured.key || '')) ? structured.key : '')
      );

      // A V2 key carries the full canonical+form identity and is sufficient proof
      // only when no more specific visible label was supplied by the UI.
      if (!visibleName && suppliedProductKey) return suppliedProductKey === expectedProductKey;

      // UI objects commonly contain a generic `key` alongside a precise label.
      // Preserve the precise n/name/label; use key only as a last-resort name.
      const candidateName = visibleName || normalizeSpaces(structured.key || candidate);
      if (!candidateName) return false;
      const candidateInput = {
        ...structured,
        n: candidateName
      };
      const candidateProfile = ingredientProfile(candidateInput);
      if (canonicalIdentityText(candidateProfile.canonicalName) !== expectedCanonical) return false;

      const candidateExplicitForm = explicitFormFor(candidate, visibleName || '');
      // A generic pantry key is not evidence that an explicit fresh/dried/canned/
      // frozen requirement is already available. Conversely, an explicitly formed
      // pantry item must not silently satisfy a generic need.
      if (expectedExplicitForm || candidateExplicitForm) {
        return Boolean(
          expectedExplicitForm &&
          candidateExplicitForm &&
          expectedExplicitForm === candidateExplicitForm &&
          candidateProfile.form === profile.form
        );
      }
      return true;
    });
  }

  function aggregateContributions(contributions) {
    const groups = new Map();
    for (const contribution of contributions) {
      if (!groups.has(contribution.groupKey)) {
        groups.set(contribution.groupKey, {
          key: contribution.groupKey,
          profile: contribution.profile,
          productKey: contribution.productKey,
          dimension: contribution.dimension,
          unit: contribution.unit || 'unité',
          quantityKind: contribution.quantityKind,
          totalBase: contribution.baseQuantity,
          contributions: [contribution]
        });
        continue;
      }
      const group = groups.get(contribution.groupKey);
      group.contributions.push(contribution);
      const currentProfileKey = stableStringify({
        canonicalName: group.profile.canonicalName,
        displayName: group.profile.displayName,
        form: group.profile.form,
        kind: group.profile.kind
      });
      const candidateProfileKey = stableStringify({
        canonicalName: contribution.profile.canonicalName,
        displayName: contribution.profile.displayName,
        form: contribution.profile.form,
        kind: contribution.profile.kind
      });
      if (compareBinary(candidateProfileKey, currentProfileKey) < 0) group.profile = contribution.profile;
      if (group.totalBase != null && contribution.baseQuantity != null) group.totalBase += contribution.baseQuantity;
      else group.totalBase = null;
    }
    return [...groups.values()];
  }

  function modelFromGroup(group) {
    const profile = group.profile;
    const exact = humanExact(group);
    const sourceRecipeIds = [...new Set(group.contributions.map(entry => entry.sourceRecipeId).filter(Boolean))]
      .sort(compareBinary);
    const model = {
      groupKey: group.key,
      canonicalName: profile.canonicalName,
      displayName: profile.displayName,
      form: profile.form,
      kind: profile.kind,
      productKey: group.productKey,
      identity: `${canonicalIdentityText(profile.canonicalName)}|${profile.form}`,
      exactQuantity: exact.quantity,
      exactUnit: exact.unit || 'unité',
      exactLabel: exactLabel(exact.quantity, exact.unit || 'unité', profile.displayName),
      packageCapacityGrams: profile.packageCapacityGrams || null,
      baseQuantity: group.totalBase == null ? null : round(group.totalBase),
      baseUnit: group.dimension === 'mass' ? 'g' : group.dimension === 'volume' ? 'ml' : group.unit,
      dimension: group.dimension,
      sourceRecipeIds,
      sourceCount: sourceRecipeIds.length,
      contributions: group.contributions.map(entry => ({
        sourceRecipeId: entry.sourceRecipeId,
        sourceRecipeName: entry.sourceRecipeName,
        quantity: entry.scaledQuantity,
        unit: entry.unit || 'unité',
        label: exactLabel(entry.scaledQuantity, entry.unit || 'unité', entry.profile.sourceName),
        conversion: entry.conversion ? { ...entry.conversion } : null
      }))
    };
    const exactPackageUnit = normalizeUnit(model.exactUnit);
    if (profile.packageCapacityGrams && ['boîte', 'bocal'].includes(exactPackageUnit)) {
      model.exactUnit = `${exactPackageUnit} de ${formatDecimal(profile.packageCapacityGrams)} g`;
      model.exactLabel = qualifiedPackageLabel(
        model.exactQuantity,
        exactPackageUnit,
        profile.packageCapacityGrams,
        profile.displayName
      );
    }
    if (group.contributions.some(entry => entry.conversion)) {
      model.exactLabel = convertedDryExactLabel(exact.quantity, exact.unit || 'g', model);
    }
    return { ...model, ...purchaseFor(model) };
  }

  function pantryItem(model) {
    return COMMON_PANTRY_PATTERN.test(normalizeSearchText(model.canonicalName));
  }

  const SAFE_VINAIGRETTE_COMPONENTS = new Map([
    ['basilic', 'basilic'],
    ['persil', 'persil'],
    ['coriandre', 'coriandre'],
    ['ciboulette', 'ciboulette'],
    ['menthe', 'menthe'],
    ['aneth', 'aneth'],
    ['estragon', 'estragon'],
    ['cerfeuil', 'cerfeuil'],
    ['sauge', 'sauge'],
    ['romarin', 'romarin'],
    ['olive', 'olive'],
    ['olives', 'olives']
  ]);

  function splitPurchasableIngredient(item) {
    const source = item || {};
    if (parseQuantity(source.q) != null || normalizeUnit(source.u || source.unit)) return [source];
    const parts = normalizeSearchText(source.n || source.name || source.k).split(/\s+et\s+/u);
    if (parts.length !== 2) return [source];

    const dressingIndex = parts.findIndex(part => part === 'vinaigrette');
    if (dressingIndex < 0) return [source];
    const componentIndex = dressingIndex === 0 ? 1 : 0;
    const component = SAFE_VINAIGRETTE_COMPONENTS.get(parts[componentIndex]);
    if (!component) return [source];

    return parts.map((part, index) => {
      const name = index === dressingIndex ? 'vinaigrette' : component;
      return { ...source, q: null, u: '', n: name, k: name };
    });
  }

  function normalizeSources(input) {
    if (Array.isArray(input)) return input;
    if (input && Array.isArray(input.sources)) return input.sources;
    return [];
  }

  function buildDraft(input, options = {}) {
    const sources = normalizeSources(input);
    const peopleCount = options.peopleCount == null ? 2 : options.peopleCount;
    const contributions = [];

    sources.forEach((source, sourceIndex) => {
      const recipe = source && source.recipe ? source.recipe : source;
      if (!recipe || !Array.isArray(recipe.i)) return;
      const sourceRecipeId = normalizeSpaces(recipe.id || source.recipeId || `source-${sourceIndex + 1}`);
      for (const rawItem of recipe.i) {
        const expandedItems = splitPurchasableIngredient(rawItem);
        const rawProfile = ingredientProfile(rawItem);
        if (
          expandedItems.length > 1 &&
          availableIngredient(rawItem, rawProfile, source, options)
        ) continue;
        for (const item of expandedItems) {
          const profile = ingredientProfile(item);
          if (availableIngredient(item, profile, source, options)) continue;
          contributions.push(contributionFor(item, recipe, sourceRecipeId, peopleCount, source, options));
        }
      }
    });

    const models = aggregateContributions(contributions).map(modelFromGroup);
    models.sort((left, right) => {
      const leftAisle = aisleFor(left);
      const rightAisle = aisleFor(right);
      return (AISLE_ORDER.get(leftAisle) - AISLE_ORDER.get(rightAisle)) ||
        compareBinary(left.purchaseLabel, right.purchaseLabel) ||
        compareBinary(left.productKey, right.productKey);
    });

    return models.map((model, index) => {
      const aisle = aisleFor(model);
      const pantry = pantryItem(model);
      const firstItem = contributions
        .filter(entry => entry.groupKey === model.groupKey)
        .sort((left, right) => compareBinary(stableStringify(left.item), stableStringify(right.item)))[0]?.item || {};
      return {
        id: `shop-${index}-${fnv1a(`${model.productKey}|${model.dimension}|${model.exactUnit}`)}`,
        item: {
          ...firstItem,
          n: model.displayName,
          k: model.canonicalName,
          u: model.purchaseUnit,
          ...(model.packageCapacityGrams ? { packageCapacityGrams: model.packageCapacityGrams } : {})
        },
        q: model.purchaseQuantity,
        unit: model.purchaseUnit,
        identity: model.identity,
        sourceCount: model.sourceCount,
        purchasePackage: Boolean(model.purchasePackage),
        originalText: model.purchaseLabel,
        text: model.purchaseLabel,
        pantry,
        selected: !pantry,
        aisle,
        computedAisle: aisle,
        rulesVersion: RULES_VERSION,
        ...model
      };
    });
  }

  const EDITABLE_UNIT_ALIASES = Object.freeze([
    ['cuillères à soupe', 'c. à soupe'], ['cuillère à soupe', 'c. à soupe'],
    ['cuillères à café', 'c. à café'], ['cuillère à café', 'c. à café'],
    ['petites boîtes', 'boîte'], ['petites boites', 'boîte'],
    ['petite boîte', 'boîte'], ['petite boite', 'boîte'],
    ['petits bouquets', 'petit bouquet'], ['petit bouquet', 'petit bouquet'],
    ['grands bouquets', 'grand bouquet'], ['grand bouquet', 'grand bouquet'],
    ['gros bouquets', 'gros bouquet'], ['gros bouquet', 'gros bouquet'],
    ['c. à soupe', 'c. à soupe'], ['c à soupe', 'c. à soupe'],
    ['c. à café', 'c. à café'], ['c à café', 'c. à café'],
    ['bouteilles', 'bouteille'], ['barquettes', 'barquette'], ['bouquets', 'bouquet'],
    ['rouleaux', 'rouleau'], ['paquets', 'paquet'], ['sachets', 'sachet'],
    ['flacons', 'flacon'], ['gousses', 'gousse'], ['feuilles', 'feuille'],
    ['tranches', 'tranche'], ['boîtes', 'boîte'], ['boites', 'boîte'],
    ['bocaux', 'bocal'], ['pincées', 'pincée'], ['pincees', 'pincée'],
    ['pavés', 'pavé'], ['paves', 'pavé'], ['têtes', 'tête'], ['tetes', 'tête'],
    ['tubes', 'tube'], ['pots', 'pot'], ['unités', 'unité'], ['unites', 'unité'],
    ['bottes', 'botte'], ['branches', 'branche'], ['briques', 'brique'],
    ['doses', 'dose'], ['gouttes', 'goutte'],
    ['bouteille', 'bouteille'], ['barquette', 'barquette'], ['bouquet', 'bouquet'],
    ['rouleau', 'rouleau'], ['paquet', 'paquet'], ['sachet', 'sachet'],
    ['flacon', 'flacon'], ['gousse', 'gousse'], ['feuille', 'feuille'],
    ['tranche', 'tranche'], ['boîte', 'boîte'], ['boite', 'boîte'],
    ['bocal', 'bocal'], ['pincée', 'pincée'], ['pincee', 'pincée'],
    ['pavé', 'pavé'], ['pave', 'pavé'], ['tête', 'tête'], ['tete', 'tête'],
    ['tube', 'tube'], ['pot', 'pot'], ['unité', 'unité'], ['unite', 'unité'],
    ['botte', 'botte'], ['branche', 'branche'], ['brique', 'brique'],
    ['dose', 'dose'], ['goutte', 'goutte'],
    ['kg', 'kg'], ['ml', 'ml'], ['cl', 'cl'], ['g', 'g'], ['l', 'l']
  ].sort((left, right) => right[0].length - left[0].length));

  function parseEditedLine(input, fallback) {
    const entry = typeof input === 'object' && input ? input : null;
    const text = normalizeSpaces(entry ? entry.text : input);
    const originalText = normalizeSpaces(entry && entry.originalText);
    if (entry && text && text === originalText) {
      return {
        name: normalizeSpaces(entry.displayName || entry.item && entry.item.n || entry.identity),
        quantity: entry.purchaseQuantity == null ? entry.q : entry.purchaseQuantity,
        unit: normalizeUnit(entry.purchaseUnit || entry.unit || entry.item && entry.item.u),
        packageCapacityGrams: finiteNumber(entry.packageCapacityGrams)
      };
    }
    if (!text && fallback) return parseEditedLine(fallback);
    if (!text) return { name: '', quantity: null, unit: '' };

    const quantityMatch = text.match(/^(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?\s*[⅛¼⅓⅜½⅝⅔¾⅞]|[⅛¼⅓⅜½⅝⅔¾⅞]|\d+(?:[.,]\d+)?)/u);
    if (!quantityMatch) return { name: text, quantity: null, unit: '' };
    const quantity = parseQuantity(quantityMatch[1]);
    let rest = normalizeSpaces(text.slice(quantityMatch[0].length)).replace(/^[x×]\s*/iu, '');
    let unit = '';
    let packageCapacityGrams = null;
    const qualifiedPackage = qualifiedPackageFor(rest, true);
    if (qualifiedPackage) {
      unit = qualifiedPackage.unit;
      packageCapacityGrams = qualifiedPackage.packageCapacityGrams;
      rest = normalizeSpaces(rest.slice(qualifiedPackage.matchedText.length));
    } else {
      for (const [candidate, normalizedUnit] of EDITABLE_UNIT_ALIASES) {
        const pattern = new RegExp(`^${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}(?:\\s+|$)`, 'iu');
        const match = rest.match(pattern);
        if (!match) continue;
        unit = normalizedUnit;
        rest = normalizeSpaces(rest.slice(match[0].length));
        break;
      }
    }
    rest = rest.replace(/^(?:de\s+|d[’']\s*)/iu, '').trim();
    return { name: rest || normalizeSpaces(fallback && fallback.name), quantity, unit, packageCapacityGrams };
  }

  const ORIGINAL_DERIVED = Symbol('ClairShoppingV2.originalDerived');

  function createOriginalDerivedSnapshot(entry) {
    return Object.freeze({
      canonicalName: entry.canonicalName,
      displayName: entry.displayName,
      form: entry.form,
      kind: entry.kind,
      productKey: entry.productKey,
      identity: entry.identity,
      purchaseQuantity: entry.purchaseQuantity,
      purchaseUnit: entry.purchaseUnit,
      purchaseLabel: entry.purchaseLabel,
      purchasePackage: entry.purchasePackage,
      packageCapacityGrams: entry.packageCapacityGrams,
      computedAisle: entry.computedAisle,
      aisle: entry.aisle,
      aisleOverride: entry.aisleOverride === true,
      pantry: entry.pantry,
      item: Object.freeze({ ...(entry.item || {}) }),
      q: entry.q,
      unit: entry.unit
    });
  }

  function attachOriginalDerivedSnapshot(entry, snapshot) {
    if (!snapshot) return;
    Object.defineProperty(entry, ORIGINAL_DERIVED, {
      value: snapshot,
      enumerable: true,
      configurable: false,
      writable: false
    });
  }

  function restoreOriginalDerived(entry, snapshot, explicitAisle) {
    entry.canonicalName = snapshot.canonicalName;
    entry.displayName = snapshot.displayName;
    entry.form = snapshot.form;
    entry.kind = snapshot.kind;
    entry.productKey = snapshot.productKey;
    entry.identity = snapshot.identity;
    entry.purchaseQuantity = snapshot.purchaseQuantity;
    entry.purchaseUnit = snapshot.purchaseUnit;
    entry.purchaseLabel = snapshot.purchaseLabel;
    entry.purchasePackage = snapshot.purchasePackage;
    entry.packageCapacityGrams = snapshot.packageCapacityGrams;
    entry.computedAisle = snapshot.computedAisle;
    entry.aisle = snapshot.aisle;
    entry.aisleOverride = snapshot.aisleOverride;
    entry.pantry = snapshot.pantry;
    entry.item = { ...snapshot.item };
    entry.q = snapshot.q;
    entry.unit = snapshot.unit;
    entry.text = normalizeSpaces(entry.originalText || snapshot.purchaseLabel);
    entry.textOverride = false;
    if (explicitAisle) {
      entry.aisle = explicitAisle;
      entry.aisleOverride = true;
    }
  }

  function applyOverrides(entry, overrides = {}) {
    const next = {
      ...entry,
      item: entry && entry.item ? { ...entry.item } : {},
      sourceRecipeIds: Array.isArray(entry && entry.sourceRecipeIds) ? [...entry.sourceRecipeIds] : [],
      contributions: Array.isArray(entry && entry.contributions) ? entry.contributions.map(value => ({ ...value })) : []
    };
    if (Object.prototype.hasOwnProperty.call(overrides, 'selected')) next.selected = Boolean(overrides.selected);

    const hasTextOverride = Object.prototype.hasOwnProperty.call(overrides, 'text');
    const preservedAisleOverride = next.aisleOverride === true && AISLES.includes(next.aisle)
      ? next.aisle
      : '';
    const overrideText = hasTextOverride
      ? normalizeSpaces(overrides.text)
      : normalizeSpaces(next.text);
    const originalText = normalizeSpaces(next.originalText);
    let originalDerived = entry && entry[ORIGINAL_DERIVED];
    if (!originalDerived && hasTextOverride && overrideText !== originalText) {
      originalDerived = createOriginalDerivedSnapshot(entry || next);
    }
    attachOriginalDerivedSnapshot(next, originalDerived);

    if (hasTextOverride && originalDerived && overrideText === originalText) {
      restoreOriginalDerived(next, originalDerived, preservedAisleOverride);
    } else if (hasTextOverride && !overrideText) {
      next.text = '';
      next.purchaseLabel = '';
      next.purchaseQuantity = null;
      next.purchaseUnit = '';
      next.q = null;
      next.unit = '';
      next.textOverride = true;
    } else if (overrideText && overrideText !== originalText) {
      const parsed = parseEditedLine(overrideText, {
        name: next.displayName,
        quantity: next.purchaseQuantity,
        unit: next.purchaseUnit
      });
      const editedUnit = parsed.unit || (parsed.quantity == null ? '' : 'unité');
      const profile = ingredientProfile({
        n: parsed.name || next.displayName,
        u: editedUnit,
        packageCapacityGrams: parsed.packageCapacityGrams
      });
      next.text = overrideText;
      next.purchaseLabel = overrideText;
      next.purchaseQuantity = parsed.quantity;
      next.purchaseUnit = editedUnit;
      next.packageCapacityGrams = parsed.packageCapacityGrams || null;
      next.q = next.purchaseQuantity;
      next.unit = next.purchaseUnit;
      next.canonicalName = profile.canonicalName;
      next.displayName = profile.displayName;
      next.form = profile.form;
      next.kind = profile.kind;
      next.productKey = productKeyFor(profile);
      next.identity = `${canonicalIdentityText(profile.canonicalName)}|${profile.form}`;
      next.computedAisle = aisleFor(profile);
      next.aisle = preservedAisleOverride || next.computedAisle;
      next.aisleOverride = Boolean(preservedAisleOverride);
      next.pantry = pantryItem(next);
      next.item.n = next.displayName;
      next.item.k = next.canonicalName;
      next.item.u = next.purchaseUnit;
      if (next.packageCapacityGrams) next.item.packageCapacityGrams = next.packageCapacityGrams;
      else delete next.item.packageCapacityGrams;
      next.purchasePackage = true;
      next.textOverride = true;
    } else if (overrideText) {
      next.text = overrideText;
    }

    if (next.aisleOverride !== true) {
      const automaticProfile = next.canonicalName
        ? next
        : ingredientProfile({
            n: next.displayName || next.item?.n || next.purchaseLabel || next.text,
            u: next.exactUnit || next.unit || next.item?.u,
            form: next.form
          });
      next.computedAisle = aisleFor(automaticProfile);
      next.aisle = next.computedAisle;
      next.aisleOverride = false;
    }
    if (Object.prototype.hasOwnProperty.call(overrides, 'aisle') && AISLES.includes(overrides.aisle)) {
      next.aisle = overrides.aisle;
      next.aisleOverride = true;
    }
    return next;
  }

  function applyManualText(entry, text) {
    return applyOverrides(entry, { text });
  }

  function applyAisleOverride(entry, aisle) {
    return applyOverrides(entry, { aisle });
  }

  function effectiveDraftItem(entry) {
    const overrides = {
      text: entry && entry.text,
      selected: entry && entry.selected
    };
    if (entry && entry.aisleOverride === true) overrides.aisle = entry.aisle;
    return applyOverrides(entry, overrides);
  }

  function contractItemV2(entry) {
    const item = effectiveDraftItem(entry);
    return {
      selected: Boolean(item.selected),
      productKey: item.productKey,
      canonicalName: item.canonicalName,
      displayName: item.displayName,
      form: item.form,
      exactQuantity: item.exactQuantity,
      exactUnit: item.exactUnit,
      exactLabel: item.exactLabel,
      purchaseQuantity: item.purchaseQuantity,
      purchaseUnit: item.purchaseUnit || 'unité',
      purchaseLabel: item.purchaseLabel,
      aisle: AISLES.includes(item.aisle) ? item.aisle : item.computedAisle,
      sourceRecipeIds: [...new Set(item.sourceRecipeIds || [])].sort(compareBinary)
    };
  }

  function stableStringify(value) {
    if (value == null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const keys = Object.keys(value).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  function compareBinary(left, right) {
    const a = String(left);
    const b = String(right);
    return a < b ? -1 : a > b ? 1 : 0;
  }

  function fingerprintProjection(value, key = '') {
    if (value == null || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
      const projected = value.map(entry => fingerprintProjection(entry));
      if (key === 'items' || key === 'sourceRecipeIds') {
        return projected.sort((left, right) => compareBinary(stableStringify(left), stableStringify(right)));
      }
      return projected;
    }
    return Object.fromEntries(
      Object.keys(value).map(name => [name, fingerprintProjection(value[name], name)])
    );
  }

  function fingerprintForContent(value) {
    return `fnv1a:${fnv1a(stableStringify(fingerprintProjection(value)))}`;
  }

  function selectedItemsV2(input, options = {}) {
    const draft = contractInputItems(input, options);
    return draft
      .map(contractItemV2)
      .filter(item => (options.includeUnselected === true || item.selected) && normalizeSpaces(item.purchaseLabel));
  }

  function contractInputItems(input, options) {
    const items = Array.isArray(input) ? input : [];
    if (items.length && (items[0].recipe || Array.isArray(items[0].i))) return buildDraft(items, options);
    return items;
  }

  function buildContractV2(input, options = {}) {
    const items = selectedItemsV2(input, options);
    const sourceVersion = options.sourceVersion || SOURCE_VERSION;
    const rulesVersion = options.rulesVersion || RULES_VERSION;
    const fingerprintContent = { schemaVersion: SCHEMA_VERSION, source: SOURCE, sourceVersion, rulesVersion, items };
    return {
      schemaVersion: SCHEMA_VERSION,
      source: SOURCE,
      sourceVersion,
      rulesVersion,
      createdAt: options.createdAt || new Date().toISOString(),
      contentFingerprint: fingerprintForContent(fingerprintContent),
      items
    };
  }

  function buildContractV1(input, options = {}) {
    const draft = contractInputItems(input, options);
    const richItems = draft
      .map(effectiveDraftItem)
      .filter(item => (options.includeUnselected === true || item.selected) && normalizeSpaces(item.purchaseLabel || item.text));
    const items = richItems.map(item => ({
      selected: Boolean(item.selected),
      text: item.purchaseLabel,
      purchaseLabel: item.purchaseLabel,
      displayName: item.displayName,
      exactQuantity: item.purchaseQuantity,
      exactUnit: item.purchaseUnit || 'unité',
      aisle: AISLES.includes(item.aisle) ? item.aisle : item.computedAisle,
      productKey: legacyProductKeyFor(item.displayName)
    }));
    return {
      schemaVersion: 1,
      source: SOURCE,
      sourceVersion: options.sourceVersion || SOURCE_VERSION,
      createdAt: options.createdAt || new Date().toISOString(),
      contentFingerprint: `fnv1a:${fnv1a(JSON.stringify(items))}`,
      items
    };
  }

  return Object.freeze({
    SCHEMA_VERSION,
    SOURCE,
    SOURCE_VERSION,
    RULES_VERSION,
    CANNED_PACKAGE_SIZE_GRAMS,
    AISLES,
    FRACTIONS,
    buildDraft,
    buildModel: buildDraft,
    buildContractV2,
    contractV2: buildContractV2,
    buildContractV1,
    contractV1: buildContractV1,
    selectedItemsV2,
    scaleQuantity,
    parseQuantity,
    parseEditedLine,
    qualifiedPackageFor,
    pluralizeCountName,
    cannedPackageCountFor,
    normalizeUnit,
    normalizeSearchText,
    canonicalIdentityText,
    ingredientProfile,
    aisleFor,
    productKeyFor,
    legacyProductKeyFor,
    fnv1a,
    applyOverrides,
    applyManualText,
    applyAisleOverride,
    fingerprintForContent,
    stableStringify,
    compareBinary
  });
});
