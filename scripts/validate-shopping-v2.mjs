#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE_PATH = resolve(ROOT, "shopping-v2-engine.js");
const INDEX_PATH = resolve(ROOT, "index.html");
const V1_FIXTURE_PATH = resolve(ROOT, "scripts", "shopping-contract-v1.fixture.json");
const V2_FIXTURE_PATH = resolve(ROOT, "scripts", "shopping-contract-v2.fixture.json");
const FIXED_CREATED_AT = "2026-08-29T08:00:00.000Z";
const SOURCE_VERSION = "7.5";
const EXPECTED_SANITIZED_INDEX_SHA256 = "c012fd0aff2850e5dd5773bca207fea4582ef8dee2a958734085e9f26f6b98fa";
const EXPECTED_QR3_TRANSPORT_SUFFIX_SHA256 = "2f1cba6cfba67518077ac184732451c00f247bfebaf7516951aa15b6637db3d9";
const EXPECTED_PROTECTED_SHA256 = Object.freeze({
  "v8/clair-cloud-sync.js": "6d05b667525082078ed76ae05f8166bcec52c6da05a44f9e27cedf8590b729c3",
  "v8/clair-sync.js": "0599c8a11fcc775b6412440d872fce660d832d18f793fb4e87a5fbf7af7efb36",
  "v8/clair-foundation.js": "83786311d67be4be19af248b045735397ed988126b63bf9955c9cc5796d29ba2",
  "v8/version.json": "e748ea2ecfea92120e550e165dc7dc5557852bd3084fbfb1384eb64c431b10e2"
});

const require = createRequire(import.meta.url);
const engineSource = readFileSync(ENGINE_PATH, "utf8");
const indexSource = readFileSync(INDEX_PATH, "utf8");
const version = JSON.parse(readFileSync(resolve(ROOT, "v8", "version.json"), "utf8"));
const v1Fixture = JSON.parse(readFileSync(V1_FIXTURE_PATH, "utf8"));
const v2Fixture = JSON.parse(readFileSync(V2_FIXTURE_PATH, "utf8"));
const api = require(ENGINE_PATH);

const buildDraft = api.buildDraft;
const buildContractV2 = api.buildContractV2 || api.contractV2;
const buildContractV1 = api.buildContractV1 || api.contractV1;
const applyManualText = api.applyManualText || ((entry, text) => api.applyOverrides(entry, { text }));
const applyAisleOverride = api.applyAisleOverride || ((entry, aisle) => api.applyOverrides(entry, { aisle }));

const successes = [];
const failures = [];

async function check(name, callback) {
  try {
    const detail = await callback();
    successes.push(detail ? `${name} — ${detail}` : name);
  } catch (error) {
    failures.push(`${name}: ${error?.stack || error}`);
  }
}

function ingredient(q, unit, name, key = name) {
  return { q, u: unit, n: name, k: key };
}

function recipe(id, ingredients, servings = 2, extra = {}) {
  return { id, n: id, servings, i: ingredients, ...extra };
}

function source(id, ingredients, servings = 2, extra = {}) {
  return { recipe: recipe(id, ingredients, servings, extra), availableItems: [] };
}

function draftFor(sources, peopleCount = 2) {
  return buildDraft(sources, { peopleCount });
}

function oneItem(sources, peopleCount = 2) {
  const draft = draftFor(sources, peopleCount);
  assert.equal(draft.length, 1, `Expected one shopping item, received ${draft.length}`);
  return draft[0];
}

function contractV2(draft, createdAt = FIXED_CREATED_AT) {
  return buildContractV2(draft, {
    createdAt,
    sourceVersion: SOURCE_VERSION,
    rulesVersion: api.RULES_VERSION
  });
}

function contractV1(draft, createdAt = FIXED_CREATED_AT) {
  return buildContractV1(draft, { createdAt, sourceVersion: SOURCE_VERSION });
}

function approx(actual, expected, epsilon = 0.011, message = "quantity") {
  assert.ok(Number.isFinite(Number(actual)), `${message} must be numeric`);
  assert.ok(
    Math.abs(Number(actual) - expected) <= epsilon,
    `${message}: expected ${expected}, received ${actual}`
  );
}

function assertPurchase(item, { quantity, units, aisle, form }) {
  if (quantity != null) approx(item.purchaseQuantity, quantity, 0.011, "purchaseQuantity");
  if (units) {
    const allowed = Array.isArray(units) ? units : [units];
    assert.ok(allowed.includes(item.purchaseUnit), `Unexpected purchaseUnit ${item.purchaseUnit}`);
  }
  if (aisle) assert.equal(item.aisle, aisle);
  if (form) assert.equal(item.form, form);
  assert.equal(typeof item.purchaseLabel, "string");
  assert.ok(item.purchaseLabel.trim(), "purchaseLabel must not be empty");
}

function itemSignature(item) {
  return [item.productKey, item.form, item.exactUnit, item.purchaseUnit].join("|");
}

function extractFunction(sourceText, functionName) {
  const start = sourceText.indexOf(`function ${functionName}(`);
  assert.notEqual(start, -1, `Missing function ${functionName}`);
  const open = sourceText.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = open; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return sourceText.slice(start, index + 1);
    }
  }
  throw new Error(`Unterminated function ${functionName}`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function replaceSingle(sourceText, pattern, marker) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matches = sourceText.match(new RegExp(pattern.source, flags)) || [];
  assert.equal(matches.length, 1, `${marker} must have exactly one boundary (${matches.length} found)`);
  return sourceText.replace(pattern, `/* ${marker} */\n`);
}

function sanitizeQr1Index(sourceText) {
  let sanitized = sourceText.replace(
    /^<script src="\.\/shopping-v2-engine\.js"><\/script>\r?\n/m,
    ""
  );
  sanitized = replaceSingle(
    sanitized,
    /const (?:SHOPPING_AISLES|SHOPPING_ENGINE)=[\s\S]*?(?=function shoppingContextText\(\))/,
    "QR1_ENGINE_BLOCK"
  );
  sanitized = replaceSingle(
    sanitized,
    /function shoppingSyncDraftFromScreen\(\)\{[\s\S]*?(?=async function shoppingCopySelected\(\))/,
    "QR1_DRAFT_CONTRACT_BLOCK"
  );
  sanitized = replaceSingle(
    sanitized,
    /function shoppingSendSelected\(\)\{[\s\S]*?(?=function bindShoppingInteractions\(\))/,
    "QR1_SENDER_BLOCK"
  );
  if (/function shopKey\(x\)\{/.test(sanitized)) {
    sanitized = replaceSingle(
      sanitized,
      /function shopKey\(x\)\{[\s\S]*?(?=let toastTimer=null;)/,
      "QR1_DEAD_BLOCK"
    );
  } else {
    const anchors = sanitized.match(/let toastTimer=null;/g) || [];
    assert.equal(anchors.length, 1, `QR1_DEAD_BLOCK anchor must be unique (${anchors.length} found)`);
    sanitized = sanitized.replace(/(?=let toastTimer=null;)/, "/* QR1_DEAD_BLOCK */\n");
  }
  return sanitized.replace(/\r\n/g, "\n");
}

function extractRealRecipeLibrary() {
  const inlineScripts = [...indexSource.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes, body]) => !/\bsrc\s*=/.test(attributes) && body.trim())
    .map(([, , body]) => body);
  assert.ok(inlineScripts.length > 0, "No inline application script found");
  const applicationSource = inlineScripts[0];
  const domMarker = "$('libraryCount').textContent=";
  const end = applicationSource.indexOf(domMarker);
  const helperStart = applicationSource.indexOf("function recipeText(");
  const helperEnd = applicationSource.indexOf("function inferFamily(");
  assert.ok(end > 0, "Recipe corpus DOM marker missing");
  assert.ok(helperStart > 0 && helperEnd > helperStart, "Recipe corpus helper markers missing");
  const sandbox = { window: {} };
  vm.runInNewContext(
    applicationSource.slice(0, end) +
      "\n" +
      applicationSource.slice(helperStart, helperEnd) +
      "\n;globalThis.__recipeLibrary=recipeLibrary;",
    sandbox,
    { filename: "index.html:shopping-v2-recipe-corpus", timeout: 10000 }
  );
  assert.ok(Array.isArray(sandbox.__recipeLibrary), "Recipe corpus extraction failed");
  return sandbox.__recipeLibrary;
}

const realRecipeLibrary = extractRealRecipeLibrary();

function realIngredientFromCorpus(recipeId, ingredientName) {
  const recipeEntry = realRecipeLibrary.find((entry) => entry.id === recipeId);
  assert.ok(recipeEntry, `Missing real recipe ${recipeId}`);
  const ingredientEntry = (recipeEntry.i || []).find((entry) => entry.n === ingredientName);
  assert.ok(ingredientEntry, `Missing real ingredient ${ingredientName} in ${recipeId}`);
  return { recipeEntry, ingredientEntry };
}

function realIngredientSource(recipeId, ingredientName, sourceId = recipeId) {
  const { recipeEntry, ingredientEntry } = realIngredientFromCorpus(recipeId, ingredientName);
  return {
    recipe: {
      id: sourceId,
      n: recipeEntry.n,
      servings: recipeEntry.servings || 2,
      i: [structuredClone(ingredientEntry)]
    },
    availableItems: []
  };
}

function legacyShoppingAisle(name) {
  const raw = String(name || "").normalize("NFC").toLocaleLowerCase("fr-FR").trim();
  const has = word => new RegExp(`(^|[\\s’'/-])${word}($|[\\s’'/-])`, "u").test(raw);
  if (
    has("pâtes") ||
    /(^|[\s’'/-])(?:spaghetti|spaghettis|penne|tagliatelles|coquillettes|macaroni|fusilli|linguine|orzo)($|[\s’'/-])/u.test(raw)
  ) return "Épicerie";
  if (has("pâte") && /(brisée|feuilletée|sablée|à pizza|a pizza|à tarte|a tarte)/u.test(raw)) {
    return "Boulangerie";
  }
  if (has("pâté") || has("terrine") || has("rillettes") || has("rillette")) return "Charcuterie";

  const normalized = api.normalizeSearchText(raw);
  const rules = [
    ["Eau", /\b(?:eau|eaux|eau gazeuse|eau petillante)\b/],
    ["Conserves", /\b(?:tomates? concassees?|tomates? pelees?|pulpe de tomates?|passata)\b/],
    ["Conserves", /\b(?:boites?|conserves?|thon en boite|mais en boite)\b/],
    ["Charcuterie", /\b(?:jambons?|lardons?|bacons?|chorizos?|andouillettes?|saucissons?|boudins?)\b/],
    ["Poissonnerie", /\b(?:cabillauds?|saumons?|poissons?|dorades?|daurades?|truites?|maquereaux?|sardines?|moules?|crevettes?|gambas?|lieu(?:x)?|thons? frais?|saint jacques|coquilles? saint jacques|calamars?|encornets?|huitres?|crabes?|langoustines?)\b/],
    ["Boucherie", /\b(?:boeufs?|porcs?|veaux?|agneaux?|poulets?|dindes?|canards?|lapins?|steaks?|escalopes?|bavettes?|filets? mignons?|saucisses?|merguez|chair a saucisse)\b/],
    ["Crèmerie", /\b(?:beurres?|cremes?|laits?|fromages?|yaourts?|oeufs?|parmesans?|mozzarellas?|fetas?|emmentals?|gruyeres?|mascarpones?|skyrs?|faisselles?)\b/],
    ["Boulangerie", /\b(?:pains?|baguettes?|brioches?|muffins? anglais|pate brisee|pate feuilletee)\b/],
    ["Surgelés", /\b(?:surgeles?|glaces?)\b/],
    ["Boissons", /\b(?:vins?|cidres?|bieres?|limonades?|sodas?|sirops?|cognacs?|portos?|armagnacs?|rhums?)\b/],
    ["Épicerie", /\b(?:basilic|coriandre|persil|ciboulette|menthe|aneth)\b.*\b(?:sec|seche|seches|deshydrate|poudre)\b/],
    ["Fruits et légumes", /\b(?:ails?|aubergines?|avocats?|carottes?|celeris?|champignons?|chou(?:x)?|concombres?|courgettes?|echalotes?|epinards?|haricots? verts?|navets?|oignons?|poireaux?|poivrons?|pommes? de terre|radis|salades?|tomates?|citrons?|oranges?|pommes?|poires?|bananes?|fraises?|melons?|raisins?|brocolis?|petits pois|asperges?|betteraves?|endives?|fenouils?|framboises?|myrtilles?|rhubarbes?|basilic|coriandre|persil|ciboulette|menthe|aneth)\b/],
    ["Épicerie", /\b(?:huiles?|vinaigres?|farines?|sucres?|riz|semoules?|quinoas?|boulgours?|nouilles?|chapelures?|panko|paprikas?|currys?|cumins?|bouillons?|moutardes?|mayonnaises?|ketchups?|concentres?|coulis|sels?|poivres?|epices?|herbes?|miels?|levures?|cacaos?|chocolats?|lentilles?|pois chiches?|haricots? rouges?|haricots? blancs?|polenta|flocons? d avoine)\b/]
  ];
  return rules.find(([, pattern]) => pattern.test(normalized))?.[0] || "Divers";
}

await check("CommonJS and global API contract", () => {
  assert.equal(typeof api, "object");
  for (const name of ["buildDraft", "fingerprintForContent", "normalizeUnit", "aisleFor", "productKeyFor"]) {
    assert.equal(typeof api[name], "function", `Missing ${name}`);
  }
  for (const name of [
    "selectedItemsV2",
    "contractV2",
    "contractV1",
    "applyManualText",
    "applyAisleOverride"
  ]) {
    assert.equal(typeof api[name], "function", `Missing compatibility alias ${name}`);
  }
  assert.equal(typeof buildContractV1, "function");
  assert.equal(typeof buildContractV2, "function");
  assert.equal(typeof applyManualText, "function");
  assert.equal(typeof applyAisleOverride, "function");
  assert.equal(typeof api.RULES_VERSION, "string");
  assert.ok(api.RULES_VERSION.length > 0);
  assert.deepEqual(api.AISLES, [
    "Eau",
    "Épicerie",
    "Fruits et légumes",
    "Boucherie",
    "Charcuterie",
    "Poissonnerie",
    "Boulangerie",
    "Conserves",
    "Crèmerie",
    "Surgelés",
    "Boissons",
    "Hygiène",
    "Maison",
    "Divers"
  ]);

  const sandbox = { console, structuredClone };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(engineSource, sandbox, { filename: "shopping-v2-engine.js" });
  assert.equal(typeof sandbox.ClairShoppingV2?.buildDraft, "function");
  return "UMD + CommonJS";
});

await check("V2 contract structure", () => {
  const item = oneItem([source("structure", [ingredient(2, "c. à soupe", "moutarde")])]);
  const contract = contractV2([item]);
  assert.deepEqual(Object.keys(contract), [
    "schemaVersion",
    "source",
    "sourceVersion",
    "rulesVersion",
    "createdAt",
    "contentFingerprint",
    "items"
  ]);
  assert.equal(contract.schemaVersion, 2);
  assert.equal(contract.source, "Clair Repas");
  assert.equal(contract.sourceVersion, "7.5");
  assert.equal(contract.rulesVersion, api.RULES_VERSION);
  assert.equal(contract.createdAt, FIXED_CREATED_AT);
  assert.match(contract.contentFingerprint, /^fnv1a:[a-f0-9]{8}$/);
  assert.deepEqual(Object.keys(contract.items[0]), [
    "selected",
    "productKey",
    "canonicalName",
    "displayName",
    "form",
    "exactQuantity",
    "exactUnit",
    "exactLabel",
    "purchaseQuantity",
    "purchaseUnit",
    "purchaseLabel",
    "aisle",
    "sourceRecipeIds"
  ]);
  assert.deepEqual(api.selectedItemsV2([item]), contract.items);
  return "13 item fields";
});

await check("V1 compatibility structure", () => {
  const draft = draftFor([source("legacy", [ingredient(2, "c. à soupe", "moutarde")])]);
  const contract = contractV1(draft);
  assert.deepEqual(Object.keys(contract), [
    "schemaVersion",
    "source",
    "sourceVersion",
    "createdAt",
    "contentFingerprint",
    "items"
  ]);
  assert.equal(contract.schemaVersion, 1);
  assert.deepEqual(Object.keys(contract.items[0]), [
    "selected",
    "text",
    "purchaseLabel",
    "displayName",
    "exactQuantity",
    "exactUnit",
    "aisle",
    "productKey"
  ]);
  assert.equal(contract.items[0].exactQuantity, 1);
  assert.equal(contract.items[0].exactUnit, "pot");
  assert.equal(contract.items[0].text, "1 pot de moutarde");
  assert.match(contract.items[0].productKey, /^clair-repas:[a-f0-9]{8}:/);
  assert.doesNotMatch(contract.items[0].productKey, /^clair-repas:v2:/);
  return "legacy field surface preserved";
});

await check("Recognized glyph and textual fractions", () => {
  const expected = new Map([
    ["⅛", 1 / 8],
    ["¼", 1 / 4],
    ["⅓", 1 / 3],
    ["½", 1 / 2],
    ["⅔", 2 / 3],
    ["¾", 3 / 4],
    ["1/2", 1 / 2],
    ["1 1/2", 1.5]
  ]);
  for (const [value, quantity] of expected) approx(api.parseQuantity(value), quantity, 0.000001, value);
  assert.deepEqual(api.parseEditedLine("1/2 citron"), { name: "citron", quantity: 0.5, unit: "", packageCapacityGrams: null });
  return `${expected.size} forms`;
});

const businessCases = [
  {
    name: "01 mustard tablespoons",
    sources: [source("mustard-tbsp", [ingredient(2, "c. à soupe", "moutarde")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["pot", "pots"], aisle: "Épicerie" });
      assert.doesNotMatch(item.purchaseLabel, /c\.\s*à\s*soupe/i);
      assert.ok(Number(item.exactQuantity) > 0);
    }
  },
  {
    name: "02 mustard mixed spoons",
    sources: [
      source("mustard-tsp", [ingredient(1, "c. à café", "moutarde")]),
      source("mustard-tbsp-2", [ingredient(2, "c. à soupe", "moutarde")])
    ],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["pot", "pots"], aisle: "Épicerie" });
      approx(item.exactQuantity, 35, 0.011, "mustard exact millilitres");
      assert.equal(item.exactUnit, "ml");
      assert.deepEqual(item.sourceRecipeIds, ["mustard-tbsp-2", "mustard-tsp"]);
    }
  },
  {
    name: "03 two fresh basil leaves",
    sources: [source("basil-2", [ingredient(2, "feuilles", "basilic")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["pot", "pots"], aisle: "Fruits et légumes", form: "fresh" });
    }
  },
  {
    name: "04 twelve fresh basil leaves",
    sources: [source("basil-12", [ingredient(12, "feuilles", "basilic")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["pot", "pots"], aisle: "Fruits et légumes", form: "fresh" });
    }
  },
  {
    name: "05 dried basil",
    sources: [source("basil-dried", [ingredient(1, "c. à café", "basilic séché")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["pot", "pots"], aisle: "Épicerie", form: "dried" });
    }
  },
  {
    name: "06 fresh parsley",
    sources: [source("parsley", [ingredient(1, "bouquet", "persil frais")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["bouquet", "bouquets"], aisle: "Fruits et légumes", form: "fresh" });
    }
  },
  {
    name: "07 four knacks",
    sources: [source("knacks", [ingredient(4, "", "knacks")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["paquet", "paquets"], aisle: "Charcuterie" });
      assert.notEqual(item.aisle, "Boucherie");
      assert.notEqual(item.aisle, "Divers");
    }
  },
  {
    name: "08 sliced pork by weight",
    sources: [source("pork", [ingredient(350, "g", "porc émincé")])],
    verify(item) {
      assertPurchase(item, { quantity: 350, units: "g", aisle: "Boucherie" });
    }
  },
  {
    name: "09 salmon steaks",
    sources: [source("salmon", [ingredient(2, "", "pavés de saumon")])],
    verify(item) {
      assertPurchase(item, { quantity: 2, units: ["pavé", "pavés", "unité", "unités"], aisle: "Poissonnerie", form: "fresh" });
    }
  },
  {
    name: "10 canned tuna",
    sources: [source("tuna", [ingredient(1, "boîte", "thon")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["boîte", "boîtes"], aisle: "Conserves", form: "canned" });
      assert.notEqual(item.aisle, "Poissonnerie");
    }
  },
  {
    name: "11 cooked rice",
    sources: [source("rice", [ingredient(180, "g", "riz cuit")])],
    verify(item) {
      approx(item.exactQuantity, 60, 0.011, "dry rice exact quantity");
      assert.equal(item.exactUnit, "g");
      assertPurchase(item, { quantity: 1, units: ["paquet", "paquets"], aisle: "Épicerie", form: "dried" });
    }
  },
  {
    name: "12 cooked pasta",
    sources: [source("pasta-cooked", [ingredient(180, "g", "pâtes cuites")])],
    verify(item) {
      approx(item.exactQuantity, 80, 0.011, "dry pasta exact quantity");
      assert.equal(item.exactUnit, "g");
      assertPurchase(item, { quantity: 1, units: ["paquet", "paquets"], aisle: "Épicerie", form: "dried" });
    }
  },
  {
    name: "13 half lemon",
    sources: [source("lemon", [ingredient(0.5, "", "citron")])],
    verify(item) {
      approx(item.exactQuantity, 0.5, 0.011, "lemon exact quantity");
      assertPurchase(item, { quantity: 1, units: ["citron", "citrons", "unité", "unités"], aisle: "Fruits et légumes", form: "fresh" });
    }
  },
  {
    name: "14 garlic cloves",
    sources: [source("garlic", [ingredient(2, "", "gousses d’ail")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["tête", "têtes"], aisle: "Fruits et légumes", form: "fresh" });
    }
  },
  {
    name: "15 bay leaf",
    sources: [source("bay", [ingredient(1, "", "feuille de laurier")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["sachet", "sachets", "pot", "pots"], aisle: "Épicerie", form: "dried" });
    }
  },
  {
    name: "16 white wine",
    sources: [source("wine", [ingredient(15, "cl", "vin blanc")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["bouteille", "bouteilles"], aisle: "Boissons" });
    }
  },
  {
    name: "17 small can of corn",
    sources: [source("corn", [ingredient(1, "petite boîte", "maïs")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["boîte", "boîtes", "petite boîte", "petites boîtes"], aisle: "Conserves", form: "canned" });
    }
  },
  {
    name: "18 dry pasta",
    sources: [source("pasta", [ingredient(250, "g", "pâtes")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["paquet", "paquets"], aisle: "Épicerie", form: "dried" });
    }
  },
  {
    name: "19 puff pastry",
    sources: [source("pastry", [ingredient(1, "", "pâte feuilletée")])],
    verify(item) {
      assertPurchase(item, { quantity: 1, units: ["rouleau", "rouleaux"], aisle: "Boulangerie" });
    }
  },
  {
    name: "20 pate",
    sources: [source("pate", [ingredient(200, "g", "pâté")])],
    verify(item) {
      assert.equal(item.aisle, "Charcuterie");
      assert.ok(
        (item.purchaseUnit === "g" && Number(item.purchaseQuantity) === 200) ||
          (["barquette", "barquettes"].includes(item.purchaseUnit) && Number(item.purchaseQuantity) === 1),
        `Unexpected pâté purchase ${item.purchaseQuantity} ${item.purchaseUnit}`
      );
    }
  }
];

const requiredAisleMatrix = Object.freeze([
  ["Basilic frais", "fresh", "feuilles", "Fruits et légumes"],
  ["Basilic séché", "dried", "c. à café", "Épicerie"],
  ["Persil frais", "fresh", "bouquet", "Fruits et légumes"],
  ["Moutarde", undefined, undefined, "Épicerie"],
  ["Mayonnaise", undefined, undefined, "Épicerie"],
  ["Ketchup", undefined, undefined, "Épicerie"],
  ["Knacks", undefined, undefined, "Charcuterie"],
  ["Jambon", undefined, undefined, "Charcuterie"],
  ["Lardons", undefined, undefined, "Charcuterie"],
  ["Chorizo", undefined, undefined, "Charcuterie"],
  ["Porc", undefined, undefined, "Boucherie"],
  ["Bœuf", undefined, undefined, "Boucherie"],
  ["Poulet", undefined, undefined, "Boucherie"],
  ["Agneau", undefined, undefined, "Boucherie"],
  ["Veau", undefined, undefined, "Boucherie"],
  ["Saumon", "fresh", undefined, "Poissonnerie"],
  ["Cabillaud", "fresh", undefined, "Poissonnerie"],
  ["Sole", "fresh", undefined, "Poissonnerie"],
  ["Crevettes fraîches", "fresh", undefined, "Poissonnerie"],
  ["Thon", "canned", "boîte", "Conserves"],
  ["Œufs", undefined, undefined, "Crèmerie"],
  ["Lait", undefined, undefined, "Crèmerie"],
  ["Beurre", undefined, undefined, "Crèmerie"],
  ["Fromage", undefined, undefined, "Crèmerie"],
  ["Pâtes alimentaires", "dried", undefined, "Épicerie"],
  ["Pâte feuilletée", undefined, undefined, "Boulangerie"],
  ["Pâté", undefined, undefined, "Charcuterie"]
]);

const aisleCases = (aisle, names) => names.map(name => [name, aisle]);
const legacyAisleRegressionMatrix = Object.freeze([
  ...aisleCases("Eau", [
    "eau", "eaux", "eau gazeuse", "eaux gazeuses", "eau pétillante", "eaux pétillantes"
  ]),
  ...aisleCases("Conserves", [
    "tomate concassée", "tomates concassées", "tomate pelée", "tomates pelées",
    "pulpe de tomate", "pulpe de tomates", "passata", "boîte de thon", "boîtes de thon",
    "conserve de maïs", "conserves de maïs", "thon en boîte", "maïs en boîte"
  ]),
  ...aisleCases("Charcuterie", [
    "pâté", "pâtés", "terrine", "terrines", "rillette", "rillettes", "knack", "knacks",
    "jambon", "jambons", "lardon", "lardons", "bacon", "bacons", "chorizo", "chorizos",
    "andouillette", "andouillettes", "saucisson", "saucissons", "boudin", "boudins"
  ]),
  ...aisleCases("Poissonnerie", [
    "cabillaud", "cabillauds", "saumon", "saumons", "poisson", "poissons",
    "dorade", "dorades", "daurade", "daurades", "truite", "truites",
    "maquereau", "maquereaux", "sardine", "sardines", "moule", "moules",
    "crevette fraîche", "crevettes fraîches", "gamba", "gambas", "lieu", "lieux",
    "thon frais", "thons frais", "Saint-Jacques", "coquille Saint-Jacques",
    "coquilles Saint-Jacques", "calamar", "calamars", "encornet", "encornets",
    "huître", "huîtres", "crabe", "crabes", "langoustine", "langoustines"
  ]),
  ...aisleCases("Boucherie", [
    "bœuf", "bœufs", "porc", "porcs", "veau", "veaux", "agneau", "agneaux",
    "poulet", "poulets", "dinde", "dindes", "canard", "canards", "lapin", "lapins",
    "steak", "steaks", "escalope", "escalopes", "bavette", "bavettes",
    "filet mignon", "filets mignons", "saucisse", "saucisses", "merguez",
    "chair à saucisse", "chairs à saucisse", "chipolata", "chipolatas"
  ]),
  ...aisleCases("Crèmerie", [
    "beurre", "beurres", "crème", "crèmes", "lait", "laits", "fromage", "fromages",
    "yaourt", "yaourts", "œuf", "œufs", "parmesan", "parmesans",
    "mozzarella", "mozzarellas", "feta", "fetas", "emmental", "emmentals",
    "gruyère", "gruyères", "mascarpone", "mascarpones", "skyr", "skyrs",
    "faisselle", "faisselles"
  ]),
  ...aisleCases("Boulangerie", [
    "pain", "pains", "baguette", "baguettes", "brioche", "brioches",
    "muffin anglais", "muffins anglais", "pâte brisée", "pâtes brisées",
    "pâte feuilletée", "pâtes feuilletées", "pâte sablée", "pâtes sablées",
    "pâte à pizza", "pâtes à pizza", "pâte à tarte", "pâtes à tarte"
  ]),
  ...aisleCases("Surgelés", ["produit surgelé", "produits surgelés", "glace", "glaces"]),
  ...aisleCases("Boissons", [
    "vin", "vins", "cidre", "cidres", "bière", "bières", "limonade", "limonades",
    "soda", "sodas", "sirop", "sirops", "cognac", "cognacs", "porto", "portos",
    "armagnac", "armagnacs", "rhum", "rhums"
  ]),
  ...aisleCases("Fruits et légumes", [
    "ail", "ails", "aubergine", "aubergines", "avocat", "avocats", "carotte", "carottes",
    "céleri", "céleris", "champignon", "champignons", "chou", "choux",
    "concombre", "concombres", "courgette", "courgettes", "échalote", "échalotes",
    "épinard", "épinards", "haricot vert", "haricots verts", "navet", "navets",
    "oignon", "oignons", "poireau", "poireaux", "poivron", "poivrons",
    "pomme de terre", "pommes de terre", "radis", "salade", "salades", "tomate", "tomates",
    "citron", "citrons", "orange", "oranges", "pomme", "pommes", "poire", "poires",
    "banane", "bananes", "fraise", "fraises", "melon", "melons", "raisin", "raisins",
    "brocoli", "brocolis", "petits pois", "asperge", "asperges", "betterave", "betteraves",
    "endive", "endives", "fenouil", "fenouils", "framboise", "framboises",
    "myrtille", "myrtilles", "rhubarbe", "rhubarbes", "basilic frais", "coriandre fraîche",
    "persil frais", "ciboulette fraîche", "menthe fraîche", "aneth frais"
  ]),
  ...aisleCases("Épicerie", [
    "basilic sec", "basilic séché", "coriandre sèche", "persil sec", "ciboulette séchée",
    "menthe sèche", "aneth séché", "huile", "huiles", "huile d’olive", "huile neutre",
    "vinaigre", "vinaigres", "sauce soja", "mirin", "farine", "farines", "sucre", "sucres",
    "riz", "semoule", "semoules", "quinoa", "quinoas", "boulgour", "boulgours",
    "nouille", "nouilles", "chapelure", "chapelures", "panko", "paprika", "paprikas",
    "curry", "currys", "cumin", "cumins", "bouillon", "bouillons", "moutarde", "moutardes",
    "mayonnaise", "mayonnaises", "ketchup", "ketchups", "concentré de tomate",
    "concentrés de tomate", "coulis de tomate", "sel", "sels", "poivre", "poivres",
    "épice", "épices", "herbe séchée", "herbes séchées", "miel", "miels", "levure", "levures",
    "cacao", "cacaos", "chocolat", "chocolats", "lentille", "lentilles",
    "pois chiches", "haricot rouge", "haricots rouges", "haricot blanc", "haricots blancs",
    "polenta", "flocon d’avoine", "flocons d’avoine", "pâtes", "spaghetti", "spaghettis",
    "penne", "pennes", "tagliatelle", "tagliatelles", "coquillette", "coquillettes",
    "macaroni", "macaronis", "fusilli", "fusillis", "linguine", "linguines", "orzo", "orzos"
  ])
]);

const legacyPackageMatrix = Object.freeze([
  { name: "miel", q: 1, unit: "c. à soupe", quantity: 1, purchaseUnit: "pot" },
  { name: "moutarde", q: 1, unit: "c. à soupe", quantity: 1, purchaseUnit: "pot" },
  { name: "mayonnaise", q: 1, unit: "c. à soupe", quantity: 1, purchaseUnit: "pot" },
  { name: "ketchup", q: 1, unit: "c. à soupe", quantity: 1, purchaseUnit: "flacon" },
  { name: "concentré de tomate", q: 1, unit: "c. à soupe", quantity: 1, purchaseUnit: "tube" },
  ...["sauce soja", "mirin", "vinaigre", "huile d’olive", "huile neutre"].map(name => ({
    name, q: 15, unit: "ml", quantity: 1, purchaseUnit: "bouteille"
  })),
  ...["paprika", "curry", "cumin", "curcuma", "cannelle", "muscade", "épices"].map(name => ({
    name, q: 1, unit: "c. à café", quantity: 1, purchaseUnit: "pot"
  })),
  { name: "riz", q: 1200, unit: "g", quantity: 2, purchaseUnit: "paquet" },
  ...["pâtes", "spaghetti", "spaghettis", "penne", "tagliatelles", "coquillettes", "macaroni", "fusilli", "linguine", "orzo"].map(name => ({
    name, q: 600, unit: "g", quantity: 2, purchaseUnit: "paquet"
  })),
  ...["semoule", "quinoa", "boulgour", "polenta", "flocons d’avoine"].map(name => ({
    name, q: 600, unit: "g", quantity: 2, purchaseUnit: "paquet"
  })),
  ...["farine", "sucre"].map(name => ({
    name, q: 1200, unit: "g", quantity: 2, purchaseUnit: "paquet"
  })),
  ...["chapelure", "panko"].map(name => ({
    name, q: 300, unit: "g", quantity: 2, purchaseUnit: "paquet"
  }))
]);

for (const businessCase of businessCases) {
  await check(`Business ${businessCase.name}`, () => {
    const before = structuredClone(businessCase.sources);
    const item = oneItem(businessCase.sources);
    businessCase.verify(item);
    assert.deepEqual(businessCase.sources, before, "Source recipes must remain immutable");
    assert.ok(item.productKey.startsWith("clair-repas:"));
    assert.ok(item.exactLabel);
    return `${item.exactLabel} => ${item.purchaseLabel}`;
  });
}

await check("Real corpus package quantities use visible n instead of a generic k shortcut", () => {
  const pastrySource = realIngredientSource("v75-chef-bocuse-03", "pâte feuilletée");
  const pastryIngredient = pastrySource.recipe.i[0];
  assert.equal(pastryIngredient.n, "pâte feuilletée");
  assert.equal(pastryIngredient.k, "pâte feuilletée");
  assert.equal(pastryIngredient.q, 500);
  assert.equal(pastryIngredient.u, "g");
  assert.equal(pastrySource.recipe.servings, 6);
  const pastry = oneItem([pastrySource]);
  approx(pastry.exactQuantity, 500 / 3, 0.01, "scaled pastry exact quantity");
  assert.equal(pastry.exactUnit, "g");
  assert.equal(pastry.purchaseQuantity, 1, "166.67 g pastry needs one realistic purchase package");
  assert.equal(pastry.purchaseUnit, "rouleau");
  assert.doesNotMatch(pastry.purchaseLabel, /\b167\s+rouleaux\b/iu);
  assert.match(pastry.purchaseLabel, /^1 rouleau de pâte feuilletée$/iu);

  const pizzaSource = realIngredientSource("v75-chef-piege-06", "pâte à pizza de 300 g");
  const pizza = oneItem([pizzaSource]);
  assert.match(pizza.canonicalName, /pâte à pizza/iu);
  assert.match(pizza.displayName, /pâte à pizza/iu);
  assert.doesNotMatch(`${pizza.canonicalName} ${pizza.displayName} ${pizza.purchaseLabel}`, /\bpâté\b/iu);
  const pate = oneItem([source("real-pate-control", [ingredient(200, "g", "pâté")])]);
  assert.notEqual(pizza.productKey, pate.productKey, "pizza dough must never share pâté identity");

  const syrupSugarSource = realIngredientSource("theme-bistrot-plus-27", "sucre pour sirop");
  const syrupSugar = oneItem([syrupSugarSource]);
  approx(syrupSugar.exactQuantity, 60, 0.01, "scaled syrup sugar exact quantity");
  assert.equal(syrupSugar.exactUnit, "g");
  assert.equal(syrupSugar.aisle, "Épicerie");
  assert.notEqual(syrupSugar.purchaseUnit, "bouteille");
  assert.doesNotMatch(syrupSugar.purchaseLabel, /bouteille/iu);
  assert.match(syrupSugar.displayName, /sucre pour sirop/iu);

  const dryMashSource = realIngredientSource("c421", "purée de pommes de terre sèche");
  const dryMash = oneItem([dryMashSource]);
  assert.equal(dryMash.form, "dried");
  assert.equal(dryMash.aisle, "Épicerie");
  for (const field of ["canonicalName", "displayName", "exactLabel", "purchaseLabel"]) {
    assert.match(dryMash[field], /purée de pommes de terre sèche/iu, `dry potato mash: ${field}`);
  }
  const driedPotatoes = oneItem([source("dried-potatoes-control", [ingredient(350, "g", "pommes de terre sèches")])]);
  assert.notEqual(dryMash.productKey, driedPotatoes.productKey, "dry mash must remain a prepared product identity");
  return "pastry mass + pizza/pâté + syrup sugar + dry potato mash";
});

await check("Real corpus generic k values never erase incompatible visible n identities", () => {
  const pairs = [
    ["rice variety",
      ["veg-l1-07", "riz long", "riz"],
      ["veg-final-58", "riz jasmin", "riz jasmin"]],
    ["pastry dimensions",
      ["veg-l1-01", "disques de pâte feuilletée de 22 cm", "pâte feuilletée"],
      ["veg-l1-10", "disque de pâte feuilletée de 24 cm", "pâte feuilletée"]],
    ["pastry rectangular",
      ["bourgeois-08", "pâte feuilletée rectangulaire", undefined],
      ["bourgeois-21", "pâte feuilletée", undefined]],
    ["pastry pure butter",
      ["v75-chef-pic-05", "pâte feuilletée pur beurre", "pâte feuilletée pur beurre"],
      ["bourgeois-21", "pâte feuilletée", undefined]],
    ["shortcrust rectangular",
      ["t409", "pâte brisée rectangulaire", "pâte brisée rectangulaire"],
      ["veg-final-43", "pâte brisée", "pâte brisée"]],
    ["shortcrust diameter",
      ["v39-quiche-lorraine", "pâte brisée de 24 cm", "pâtes brisées de 24 cm"],
      ["veg-final-43", "pâte brisée", "pâte brisée"]],
    ["cheese cut",
      ["veg-l1-01", "comté râpé", "comté"],
      ["veg-l1-11", "comté", "comté"]],
    ["explicit untreated citrus",
      ["theme-cuisine-regionale-26", "citron non traité", "citron non traité"],
      ["n03", "citron", "citrons"]],
    ["cooked/raw salsify",
      ["veg-l1-14", "salsifis cuits égouttés", "salsifis"],
      ["v75-chef-piege-04", "salsifis", "salsifis"]],
    ["composite coriander seasoning",
      ["veg-l1-04", "coriandre fraîche, sel", "assaisonnement"],
      ["n35", "coriandre", "coriandre"]],
    ["squash variety",
      ["veg-l1-12", "petite courge butternut", "courge"],
      ["q401", "courge", "courge"]],
    ["corn on cob",
      ["v31n-bowl-quinoa-courge-pois-chiches", "épis de maïs", "épis de maïs"],
      ["v31e-riz-croustillant-saumon", "maïs", "maïs"]],
    ["mustard style",
      ["theme-famille-dimanche-11", "moutarde de Dijon", "moutarde de Dijon"],
      ["n09", "moutarde", "moutarde"]],
    ["mustard regional style",
      ["v31n-tacos-boeuf", "moutarde douce allemande", "moutarde douce allemande"],
      ["v31n-tacos-filet-mignon", "moutarde douce", "moutarde douce"]],
    ["cream style",
      ["veg-l1-05", "crème légère", "crème"],
      ["n07", "crème", "crème"]],
    ["fresh cream style",
      ["v39-blanquette-veau", "crème fraîche", "crème fraîche"],
      ["n07", "crème", "crème"]],
    ["whole liquid cream style",
      ["v75-chef-bocuse-04", "crème liquide entière", "crème liquide entière"],
      ["v39-quiche-lorraine", "crème entière", "crème entière"]],
    ["bread style",
      ["veg-l1-03", "tranches de pain de campagne", "pain"],
      ["v31n-papillote-fenouil-falafels", "pain", "pain"]],
    ["potato variety",
      ["veg-l1-15", "pommes de terre grenaille", "pommes de terre"],
      ["n01", "pommes de terre", "pommes de terre"]],
    ["potato ratte type",
      ["v75-chef-robuchon-01", "pommes de terre à chair ferme type ratte", "pommes de terre à chair ferme type ratte"],
      ["theme-bistrot-plus-12", "pommes de terre à chair ferme", "pommes de terre à chair ferme"]]
  ];

  for (const [label, leftSpec, rightSpec] of pairs) {
    const [leftRecipeId, leftName, leftKey] = leftSpec;
    const [rightRecipeId, rightName, rightKey] = rightSpec;
    assert.equal(realIngredientFromCorpus(leftRecipeId, leftName).ingredientEntry.k, leftKey, `${label}: left real k`);
    assert.equal(realIngredientFromCorpus(rightRecipeId, rightName).ingredientEntry.k, rightKey, `${label}: right real k`);
    const leftSource = realIngredientSource(leftRecipeId, leftName, `real-pair-${api.fnv1a(label)}-left`);
    const rightSource = realIngredientSource(rightRecipeId, rightName, `real-pair-${api.fnv1a(label)}-right`);
    const leftOnly = oneItem([leftSource]);
    const rightOnly = oneItem([rightSource]);
    assert.notEqual(leftOnly.productKey, rightOnly.productKey, `${label}: visible n needs distinct productKeys`);
    const forward = draftFor([leftSource, rightSource]);
    const reverse = draftFor([rightSource, leftSource]);
    assert.equal(forward.length, 2, `${label}: incompatible real lines must not merge`);
    assert.equal(reverse.length, 2, `${label}: reversed incompatible real lines must not merge`);
    assert.equal(new Set(forward.map((item) => item.productKey)).size, 2, `${label}: unique keys`);
    for (const standalone of [leftOnly, rightOnly]) {
      const combined = forward.find((item) => item.productKey === standalone.productKey);
      assert.ok(combined, `${label}: stable standalone key in combined draft`);
      if (standalone.exactQuantity == null) assert.equal(combined.exactQuantity, null, `${label}: unspecified quantity`);
      else approx(combined.exactQuantity, standalone.exactQuantity, 0.001, `${label}: quantity not fused`);
      assert.equal(combined.exactUnit, standalone.exactUnit, `${label}: exactUnit`);
    }
    assert.deepEqual(contractV2(forward), contractV2(reverse), `${label}: V2 order/fingerprint`);
    assert.deepEqual(contractV1(forward), contractV1(reverse), `${label}: V1 order/fingerprint`);
  }

  const sesameSeedsSource = realIngredientSource("veg-l1-17", "graines de sésame", "real-sesame-seeds");
  const sesameGenericSource = realIngredientSource("veg-final-22", "sésame", "real-sesame-generic");
  assert.equal(sesameSeedsSource.recipe.i[0].k, "sésame");
  assert.equal(sesameGenericSource.recipe.i[0].k, "sésame");
  const sesameSeeds = oneItem([sesameSeedsSource]);
  const sesameGeneric = oneItem([sesameGenericSource]);
  assert.equal(sesameSeeds.productKey, sesameGeneric.productKey, "seed wording and generic sesame are compatible lines");
  assert.equal(sesameSeeds.aisle, sesameGeneric.aisle, "compatible sesame keys require one coherent aisle");
  assert.notEqual(sesameSeeds.aisle, "Divers", "sesame aisle must be classified");
  const sesameForward = draftFor([sesameSeedsSource, sesameGenericSource]);
  const sesameReverse = draftFor([sesameGenericSource, sesameSeedsSource]);
  assert.equal(sesameForward.length, 1, "compatible sesame lines must group");
  assert.deepEqual(contractV2(sesameForward), contractV2(sesameReverse), "sesame V2 order/fingerprint");
  assert.deepEqual(contractV1(sesameForward), contractV1(sesameReverse), "sesame V1 order/fingerprint");
  const sesameOil = oneItem([realIngredientSource("q405", "huile de sésame", "real-sesame-oil")]);
  assert.notEqual(sesameForward[0].productKey, sesameOil.productKey, "sesame seeds and sesame oil must stay distinct");
  return `${pairs.length} real n/k incompatible pairs + coherent sesame aliases`;
});

await check("Real alternative composites keep one deterministic shopping policy", () => {
  const cases = [
    ["beer", "theme-cuisine-regionale-15", "bière blonde ou ambrée", "Boissons", /bière blonde ou ambrée/iu],
    ["cider-wine", "v74-reg-18", "cidre brut ou vin blanc", "Boissons", /cidre brut ou vin blanc/iu],
    ["riesling-wine", "v74-reg-01", "riesling ou vin blanc sec", "Boissons", /riesling ou vin blanc sec/iu],
    ["champagne-cremant", "v75-chef-bocuse-04", "champagne ou crémant brut", "Boissons", /champagne ou crémant brut/iu],
    ["wine-beer", "bistrot-ext-25", "vin rouge léger ou bière ambrée", "Boissons", /vin rouge léger ou bière ambrée/iu],
    ["orange-liqueur", "v74-bis-07", "Grand Marnier ou Cointreau", "Boissons", /Grand Marnier ou Cointreau/iu],
    ["fresh-herbs", "v75-chef-troisgros-05", "coriandre ou persil", "Fruits et légumes", /coriandre ou persil/iu],
    ["unspecified-herbs", "veg-final-58", "basilic ou coriandre", "Fruits et légumes", /basilic ou coriandre/iu],
    ["spoon-herbs", "veg-l1-02", "aneth et persil hachés", "Fruits et légumes", /aneth et persil/iu],
    ["honey-maple", "veg-l1-17", "miel ou sirop d’érable", "Épicerie", /miel ou sirop d[’']érable/iu],
    ["salmon-cuts", "v75-chef-troisgros-01", "pavés de saumon très fins ou 4 escalopes", "Poissonnerie", /saumon très fins ou 4 escalopes/iu]
  ];
  const sources = [];
  for (const [label, recipeId, ingredientName, expectedAisle, visiblePattern] of cases) {
    const compositeSource = realIngredientSource(recipeId, ingredientName, `real-composite-${label}`);
    const ingredientEntry = compositeSource.recipe.i[0];
    assert.equal(ingredientEntry.n, ingredientName, `${label}: real n`);
    const item = oneItem([compositeSource]);
    assert.equal(item.aisle, expectedAisle, `${label}: aisle`);
    for (const field of ["displayName", "exactLabel", "purchaseLabel"]) {
      assert.match(item[field], visiblePattern, `${label}: ${field} preserves the alternatives`);
      assert.doesNotMatch(item[field], /\b(?:tranches de tranches|feuilles de feuilles|pavés de pavés)\b/iu, `${label}: ${field}`);
    }
    if (expectedAisle === "Boissons") {
      assert.equal(item.purchaseQuantity, 1, `${label}: measured drink needs one bottle`);
      assert.equal(item.purchaseUnit, "bouteille", `${label}: drink package`);
    } else if (label === "honey-maple") {
      assert.equal(item.purchaseQuantity, 1, "honey/maple alternative needs one pot");
      assert.equal(item.purchaseUnit, "pot", "honey/maple package");
    } else if (label === "fresh-herbs" || label === "unspecified-herbs" || label === "spoon-herbs") {
      assert.equal(item.purchaseQuantity, 1, "fresh herb alternative quantity");
      assert.match(item.purchaseUnit, /(?:bouquet|pot)/iu, "fresh herb package");
    } else if (label === "salmon-cuts") {
      assert.equal(item.exactQuantity, 4, "salmon alternative count");
      assert.equal(item.purchaseQuantity, 4, "salmon alternative purchase count");
    }
    sources.push(compositeSource);
  }

  const forward = draftFor(sources);
  const reverse = draftFor([...sources].reverse());
  assert.equal(forward.length, cases.length, "unrelated composites must not merge");
  assert.equal(new Set(forward.map((item) => item.productKey)).size, cases.length, "composites need unique productKeys");
  assert.deepEqual(contractV2(forward), contractV2(reverse), "composites V2 order/fingerprint");
  assert.deepEqual(contractV1(forward), contractV1(reverse), "composites V1 order/fingerprint");
  return `${cases.length} real composite policies`;
});

await check("Herbs sauces condiments and seeds use realistic purchase containers", () => {
  const herbCases = [
    ["sauge", 8, "feuilles"],
    ["estragon", 2, "c. à soupe"],
    ["cerfeuil", 2, "c. à soupe"],
    ["romarin", 2, "c. à soupe"]
  ];
  for (const [name, quantity, unit] of herbCases) {
    const item = oneItem([
      source(`container-herb-${api.fnv1a(name)}`, [ingredient(quantity, unit, name)])
    ]);
    assert.equal(item.form, "fresh", `${name}: form`);
    assert.equal(item.aisle, "Fruits et légumes", `${name}: aisle`);
    assert.equal(item.purchaseQuantity, 1, `${name}: purchaseQuantity`);
    assert.match(item.purchaseUnit, /^(?:pot|bouquet)$/u, `${name}: purchaseUnit`);
    assert.doesNotMatch(item.purchaseLabel, /(?:feuilles?|c\.\s*à\s*soupe)/iu, `${name}: purchase label must use a container`);
  }

  const condimentCases = [
    ["sauce barbecue", ["flacon", "bouteille"]],
    ["sauce Worcestershire", ["flacon", "bouteille"]],
    ["Tabasco", ["flacon", "bouteille"]],
    ["raifort doux", ["pot"]],
    ["pesto", ["pot"]],
    ["harissa douce", ["pot"]]
  ];
  for (const [name, allowedUnits] of condimentCases) {
    const item = oneItem([
      source(`container-condiment-${api.fnv1a(name)}`, [ingredient(2, "c. à soupe", name)])
    ]);
    assert.equal(item.aisle, "Épicerie", `${name}: aisle`);
    assert.equal(item.purchaseQuantity, 1, `${name}: purchaseQuantity`);
    assert.ok(allowedUnits.includes(item.purchaseUnit), `${name}: purchaseUnit ${item.purchaseUnit}`);
    assert.doesNotMatch(item.purchaseLabel, /c\.\s*à\s*soupe/iu, `${name}: purchase label must use a container`);
  }

  const seedCases = ["graines de carvi", "graines de pavot", "graines de chia"];
  for (const name of seedCases) {
    const item = oneItem([
      source(`container-seed-${api.fnv1a(name)}`, [ingredient(1, "c. à café", name)])
    ]);
    assert.equal(item.aisle, "Épicerie", `${name}: aisle`);
    assert.equal(item.purchaseQuantity, 1, `${name}: purchaseQuantity`);
    assert.equal(item.purchaseUnit, "pot", `${name}: purchaseUnit`);
    assert.doesNotMatch(item.purchaseLabel, /c\.\s*à\s*café/iu, `${name}: purchase label must use a pot`);
  }
  return `${herbCases.length} herbs + ${condimentCases.length} condiments + ${seedCases.length} seeds`;
});

await check("French de and elision grammar stays correct for aspirated h and vowels", () => {
  const deCases = [
    ["yaourt grec", 200, "g", "200 g de yaourt grec", "200 g de yaourt grec"],
    ["yaourt nature", 200, "g", "200 g de yaourt nature", "200 g de yaourt nature"],
    ["harissa douce", 2, "c. à soupe", "2 c. à soupe de harissa douce", "1 pot de harissa douce"]
  ];
  for (const [name, quantity, unit, expectedExact, expectedPurchase] of deCases) {
    const item = oneItem([
      source(`grammar-de-${api.fnv1a(name)}`, [ingredient(quantity, unit, name)])
    ]);
    assert.equal(item.exactLabel, expectedExact, `${name}: exactLabel`);
    assert.equal(item.purchaseLabel, expectedPurchase, `${name}: purchaseLabel`);
    for (const field of ["exactLabel", "purchaseLabel"]) {
      assert.doesNotMatch(item[field], /\bd[’'](?:yaourts?|harissa)\b/iu, `${name}: invalid elision in ${field}`);
    }
  }

  const elisionCases = [
    ["huile d’olive", 2, "c. à soupe", /d[’']huile d[’']olive/iu],
    ["ail", 2, "gousses", /d[’']ail/iu],
    ["oignon", 200, "g", /d[’']oignon/iu],
    ["eau", 20, "cl", /d[’']eau/iu]
  ];
  for (const [name, quantity, unit, expectedElision] of elisionCases) {
    const item = oneItem([
      source(`grammar-elision-${api.fnv1a(name)}`, [ingredient(quantity, unit, name)])
    ]);
    assert.match(item.exactLabel, expectedElision, `${name}: exactLabel elision`);
    assert.match(item.purchaseLabel, expectedElision, `${name}: purchaseLabel elision`);
  }
  return `${deCases.length} de-cases + ${elisionCases.length} vowel elisions`;
});

await check("Slice and crumb wording keeps French noun order without duplicated units", () => {
  const cases = [
    ["veg-l1-03", "tranches de pain de campagne", "4 tranches de pain de campagne", /tranches de pain de campagne/iu],
    ["apero-03", "mie de pain blanc", "45 g de mie de pain blanc", /mie de pain blanc/iu],
    ["theme-cuisine-regionale-14", "tranches de pain d’épices", "2 tranches de pain d’épices", /tranches de pain d[’']épices/iu],
    ["theme-bistrot-plus-13", "tranches de foie de veau de 150 g", "2 tranches de foie de veau de 150 g", /tranches de foie de veau de 150 g/iu]
  ];
  const corrupted = /\b(?:tranches? de tranches?|feuilles? de feuilles?|pavés? de pavés?|(?:pain(?: de campagne| d[’']épices)?|foie de veau) en tranches? de|en (?:tranches?|feuilles?|pavés?) de)\b/iu;
  for (const [recipeId, ingredientName, expectedExactLabel, orderedPattern] of cases) {
    const item = oneItem([realIngredientSource(recipeId, ingredientName, `word-order-${recipeId}`)]);
    assert.equal(item.exactLabel, expectedExactLabel, `${ingredientName}: exactLabel`);
    for (const field of ["originalText", "text", "exactLabel", "purchaseLabel"]) {
      assert.doesNotMatch(item[field], corrupted, `${ingredientName}: ${field} corrupted`);
    }
    assert.match(item.exactLabel, orderedPattern, `${ingredientName}: French noun order`);
  }
  return `${cases.length} real slice/crumb labels`;
});

await check("Quantity one uses targeted singular product and container labels", () => {
  const cases = [
    ["branche de céleri", "branches de céleri", "1 branche de céleri"],
    ["pomme de terre", "pommes de terre", "1 pomme de terre"],
    ["cuisse de poulet", "cuisses de poulet", "1 cuisse de poulet"],
    ["tranche de pain de campagne", "tranches de pain de campagne", "1 tranche de pain de campagne"],
    ["feuille de sauge", "feuilles de sauge", "1 feuille de sauge fraîche"],
    ["pavé de saumon", "pavés de saumon", "1 pavé de saumon"],
    ["gousse d’ail", "gousses d’ail", "1 gousse d’ail"]
  ];
  for (const [visibleName, genericKey, expectedExactLabel] of cases) {
    const item = oneItem([
      source(`singular-${api.fnv1a(visibleName)}`, [ingredient(1, "", visibleName, genericKey)])
    ]);
    assert.equal(item.exactQuantity, 1, `${visibleName}: exactQuantity`);
    assert.equal(item.exactLabel, expectedExactLabel, `${visibleName}: singular exactLabel`);
    assert.doesNotMatch(
      item.exactLabel,
      /^1\s+(?:branches|pommes de terre|cuisses|tranches|feuilles|pavés|gousses)\b/iu,
      `${visibleName}: plural after quantity one`
    );
  }
  return `${cases.length} targeted singular labels`;
});

await check("Mandatory aisle matrix", () => {
  for (const [name, form, unit, expectedAisle] of requiredAisleMatrix) {
    assert.equal(api.aisleFor(name, form, unit), expectedAisle, name);
  }
  return `${requiredAisleMatrix.length} required classifications`;
});

await check("Obvious named foods never fall back to Divers", () => {
  const groups = [
    ["Épicerie", [
      "olives", "pesto", "câpres", "vanille", "bouquet garni", "noix", "graines de sésame",
      "vinaigrette", "amandes", "tortillas", "cornichons", "fond de veau", "tahini",
      "noisettes", "miso", "maïzena", "épices"
    ]],
    ["Crèmerie", ["comté", "ricotta", "cheddar"]],
    ["Fruits et légumes", ["courge", "ciboule", "patate douce", "panais"]],
    ["Poissonnerie", ["morue", "lotte", "bar", "turbot"]],
    ["Boucherie", ["foie de volaille"]]
  ];
  const nonDiversOnly = [
    "tofu ferme", "gnocchi", "gnocchis", "falafels", "sésame", "gélatine", "wraps", "spätzle",
    "abricots", "galettes de sarrasin", "pruneaux dénoyautés", "ravioles", "cerfeuil",
    "châtaignes cuites", "feuilles de brick", "feuilles de sauge", "fruits rouges", "madère",
    "mangue", "morilles séchées", "pak-choï", "pamplemousse", "ananas", "baies de genièvre",
    "calvados", "caramel", "cassonade", "clous de girofle", "feuilles de lasagnes",
    "filets d’anchois", "fond blanc de volaille", "fumet de crustacés", "harissa douce", "kiwis",
    "orge perlé", "pecorino romano", "petite laitue", "prunes", "romarin", "blettes",
    "bûche de chèvre", "champagne brut", "choucroute cuite", "clémentines", "figues",
    "filets de hareng doux", "foie gras cru", "reblochon", "rigatoni", "artichauts violets",
    "beaufort", "camembert", "cailles", "cannelloni", "crozets", "flageolets cuits",
    "germes de soja", "pignons de pin", "roquette", "tortellini", "vermicelles", "zaatar"
  ];
  let count = 0;
  for (const [expectedAisle, names] of groups) {
    for (const name of names) {
      const directAisle = api.aisleFor(name);
      assert.notEqual(directAisle, "Divers", `${name}: direct aisle must not be Divers`);
      assert.equal(directAisle, expectedAisle, `${name}: direct aisle`);
      const item = oneItem([
        source(`obvious-aisle-${api.fnv1a(name)}`, [ingredient(100, "g", name)])
      ]);
      assert.notEqual(item.aisle, "Divers", `${name}: draft aisle must not be Divers`);
      assert.equal(item.aisle, expectedAisle, `${name}: draft aisle`);
      count += 1;
    }
  }
  for (const name of nonDiversOnly) {
    const directAisle = api.aisleFor(name);
    assert.notEqual(directAisle, "Divers", `${name}: direct aisle must not be Divers`);
    const item = oneItem([
      source(`extended-non-divers-${api.fnv1a(name)}`, [ingredient(100, "g", name)])
    ]);
    assert.notEqual(item.aisle, "Divers", `${name}: draft aisle must not be Divers`);
  }
  return `${count} exact aisles + ${nonDiversOnly.length} extended non-Divers foods`;
});

await check("All 109 previously-Divers real foods have an explicit coherent aisle", () => {
  const groups = [
    ["Épicerie", [
      "sauce légère", "biscuits à la cuillère", "pignons", "sauce César", "algues séchées",
      "algues séchées alimentaires", "cacahuètes grillées", "café moulu très fin",
      "camomille ou 1 c. à café de fleurs alimentaires", "cardamome verte", "corn flakes nature",
      "étoiles de badiane", "feuilles de verveine fraîche ou séchée alimentaire", "fleur d’oranger",
      "gelée de groseille", "gousses de cardamome", "graines de carvi", "graines de chia",
      "graines de pavot", "graines de sarrasin", "granola", "lavande alimentaire", "marrons cuits",
      "mélilot séché ou foin alimentaire facultatif", "perles de tapioca", "purée de marrons non sucrée",
      "quenelles nature", "raifort doux", "reine-des-prés séchée alimentaire, facultatif",
      "sarrasin décortiqué", "sauce barbecue", "sauce Worcestershire", "spéculoos", "Tabasco",
      "Tabasco facultatif", "tilleul séché alimentaire"
    ]],
    ["Fruits et légumes", [
      "cerises", "pastèque", "cerises dénoyautées", "fruits de la passion", "grenade", "kakis",
      "mirabelles", "nectarines", "oseille fraîche", "potimarron",
      "truffe noire fraîche ou brisures de truffe", "truffe noire ou brisures de truffe", "verveine"
    ]],
    ["Boucherie", [
      "viande hachée", "blanc de volaille", "carcasses et ailes de volaille", "diots de Savoie",
      "entrecôtes", "filet ou rôti de chevreuil", "filets de caneton ou magrets",
      "gras-double cuit en plaques", "gras-double déjà cuit", "os à moelle",
      "os à moelle coupés dans la longueur", "pigeonneaux prêts à cuire", "pintade d’environ 1,4 kg",
      "poularde d’environ 1,6 kg", "poularde découpée en 8 morceaux", "suprêmes de volaille"
    ]],
    ["Poissonnerie", [
      "filets de sandre avec peau", "anguille préparée en tronçons", "carapaces de crustacés",
      "chair de homard cuite", "cuisses de grenouilles parées", "écrevisses cuites ou queues d’écrevisses",
      "filet de sandre sans arêtes", "filets de merlu", "filets de rouget", "filets de rouget avec peau",
      "filets de Saint-Pierre", "homards cuits de 500 à 600 g", "homards cuits de 600 à 700 g",
      "homards de 500 à 600 g", "palourdes", "poulpe cuit", "quenelles de brochet",
      "portions d’aile de raie de 180 g", "surimi"
    ]],
    ["Charcuterie", [
      "guanciale ou pancetta", "lard fumé", "tranches de poitrine fumée", "cervelas",
      "gésiers de volaille confits", "pieds de cochon cuits et désossés", "poitrine fumée"
    ]],
    ["Crèmerie", [
      "cancoillotte", "paneer", "petits-suisses", "tome fraîche de Cantal", "tome fraîche de l’Aubrac"
    ]],
    ["Boulangerie", [
      "crêpes fines", "feuilles de pâte filo", "bagels", "crêpes non sucrées",
      "génoise ronde ou rectangulaire", "grandes bouchées feuilletées", "mini-blinis",
      "petit biscuit génoise facultatif", "petites meringues ou 1 grand disque de meringue"
    ]],
    ["Conserves", ["bisque de crustacés", "gaspacho"]],
    ["Boissons", ["expressos refroidis", "jus de grenade"]]
  ];
  const names = groups.flatMap(([, entries]) => entries);
  assert.equal(names.length, 109, "the formerly-Divers matrix must contain exactly 109 real names");
  assert.equal(new Set(names).size, 109, "the formerly-Divers matrix must not contain duplicates");
  for (const [expectedAisle, entries] of groups) {
    for (const name of entries) {
      assert.equal(api.aisleFor(name), expectedAisle, `${name}: direct aisle`);
      const item = oneItem([
        source(`formerly-divers-${api.fnv1a(name)}`, [ingredient(100, "g", name)])
      ]);
      assert.equal(item.aisle, expectedAisle, `${name}: draft aisle`);
    }
  }
  return `${names.length} real foods across ${groups.length} explicit aisles`;
});

await check("Complete pre-QR1 aisle rule matrix and broad plurals", () => {
  const mismatches = [];
  for (const [name, expectedAisle] of legacyAisleRegressionMatrix) {
    const actualAisle = api.aisleFor(name);
    if (actualAisle !== expectedAisle) mismatches.push({ name, expectedAisle, actualAisle });
  }
  assert.equal(mismatches.length, 0, `Aisle mismatches: ${JSON.stringify(mismatches)}`);
  return `${legacyAisleRegressionMatrix.length} named aisle cases`;
});

await check("Complete pre-QR1 purchase package matrix", () => {
  const mismatches = [];
  for (const expected of legacyPackageMatrix) {
    const item = oneItem([
      source(`legacy-package-${api.fnv1a(expected.name)}`, [ingredient(expected.q, expected.unit, expected.name)])
    ]);
    if (
      item.aisle !== "Épicerie" ||
      Math.abs(Number(item.purchaseQuantity) - expected.quantity) > 0.011 ||
      item.purchaseUnit !== expected.purchaseUnit ||
      item.purchasePackage !== true
    ) {
      mismatches.push({
        name: expected.name,
        expected: ["Épicerie", expected.quantity, expected.purchaseUnit, true],
        actual: [item.aisle, item.purchaseQuantity, item.purchaseUnit, item.purchasePackage]
      });
    }
  }
  assert.equal(mismatches.length, 0, `Package mismatches: ${JSON.stringify(mismatches)}`);
  return `${legacyPackageMatrix.length} active package rules`;
});

await check("Cooked-to-dry rules cover all five grains and number variants", () => {
  const cases = [
    ["riz cuit", "riz", 1 / 3, 60],
    ["riz cuits", "riz", 1 / 3, 60],
    ["pâtes cuite", "pâtes", 0.43, 80],
    ["pâtes cuites", "pâtes", 0.43, 80],
    ["quinoa cuit", "quinoa", 1 / 3, 60],
    ["quinoa cuits", "quinoa", 1 / 3, 60],
    ["boulgour cuit", "boulgour", 0.4, 70],
    ["boulgour cuits", "boulgour", 0.4, 70],
    ["semoule cuite", "semoule", 0.4, 70],
    ["semoule cuites", "semoule", 0.4, 70]
  ];
  for (const [name, canonicalName, factor, expectedDryGrams] of cases) {
    const item = oneItem([source(`cooked-${api.fnv1a(name)}`, [ingredient(180, "g", name)])]);
    assert.equal(item.canonicalName, canonicalName, `${name}: canonicalName`);
    assert.equal(item.form, "dried", `${name}: form`);
    approx(item.exactQuantity, expectedDryGrams, 0.011, `${name}: exact dry grams`);
    assert.equal(item.exactUnit, "g", `${name}: exactUnit`);
    assert.match(item.exactLabel, /^environ /, `${name}: exactLabel`);
    approx(item.purchaseQuantity, 1, 0.011, `${name}: purchaseQuantity`);
    assert.equal(item.purchaseUnit, "paquet", `${name}: purchaseUnit`);
    assert.equal(item.aisle, "Épicerie", `${name}: aisle`);
    assert.equal(item.contributions.length, 1, `${name}: contributions`);
    assert.equal(item.contributions[0].quantity, 180, `${name}: culinary quantity`);
    approx(item.contributions[0].conversion?.factor, factor, 0.000001, `${name}: conversion factor`);
    approx(item.contributions[0].conversion?.toQuantity, expectedDryGrams, 0.011, `${name}: conversion result`);
  }
  return `${cases.length} cooked singular/plural variants`;
});

await check("Cooked potatoes keep their weight and produce identity", () => {
  const item = oneItem([source("cooked-potatoes", [ingredient(650, "g", "pommes de terre cuites")])]);
  assert.equal(item.canonicalName, "pommes de terre");
  assert.equal(item.displayName, "pommes de terre");
  approx(item.exactQuantity, 650);
  assert.equal(item.exactUnit, "g");
  approx(item.purchaseQuantity, 650);
  assert.equal(item.purchaseUnit, "g");
  assert.equal(item.aisle, "Fruits et légumes");
});

await check("Singular and plural product identities merge", () => {
  const cases = [
    ["courgette", "courgettes", "courgette", "", 1, 2],
    ["citron", "citrons", "citron", "", 0.5, 0.5],
    ["saumon", "saumons", "saumon", "g", 100, 150],
    ["fromage", "fromages", "fromage", "g", 100, 50],
    ["pain", "pains", "pain", "", 1, 2]
  ];
  for (const [singular, plural, canonicalName, unit, firstQuantity, secondQuantity] of cases) {
    const singularProfile = api.ingredientProfile({ n: singular, u: unit });
    const pluralProfile = api.ingredientProfile({ n: plural, u: unit });
    assert.equal(singularProfile.canonicalName, canonicalName, `${singular}: canonicalName`);
    assert.equal(pluralProfile.canonicalName, canonicalName, `${plural}: canonicalName`);
    assert.equal(api.productKeyFor(singularProfile), api.productKeyFor(pluralProfile), `${singular}/${plural}: productKey`);
    const draft = draftFor([
      source(`${canonicalName}-singular`, [ingredient(firstQuantity, unit, singular)]),
      source(`${canonicalName}-plural`, [ingredient(secondQuantity, unit, plural)])
    ]);
    assert.equal(draft.length, 1, `${singular}/${plural} must merge`);
    assert.equal(draft[0].canonicalName, canonicalName);
    assert.equal(draft[0].sourceRecipeIds.length, 2);
  }
  const forms = draftFor([
    source("basil-fresh-plural-guard", [ingredient(4, "feuilles", "basilic")]),
    source("basil-dried-plural-guard", [ingredient(1, "c. à café", "basilic séché")])
  ]);
  assert.equal(forms.length, 2, "Different forms must remain separate");
  return `${cases.length} singular/plural merge families + form guard`;
});

await check("Alias grouping and fingerprints are independent of source order", () => {
  const cases = [
    ["jambon", "jambons", "jambon", "g", 100, 150],
    ["saumon", "saumons", "saumon", "g", 100, 150],
    ["fromage", "fromages", "fromage", "g", 100, 50],
    ["courgette", "courgettes", "courgette", "", 1, 2]
  ];
  const stableFields = [
    "canonicalName", "displayName", "form", "productKey", "exactQuantity", "exactUnit",
    "exactLabel", "purchaseQuantity", "purchaseUnit", "purchaseLabel", "aisle"
  ];
  for (const [singular, plural, expectedCanonical, unit, singularQuantity, pluralQuantity] of cases) {
    const singularSource = source(`${expectedCanonical}-alias-singular`, [
      ingredient(singularQuantity, unit, singular)
    ]);
    const pluralSource = source(`${expectedCanonical}-alias-plural`, [
      ingredient(pluralQuantity, unit, plural)
    ]);
    const forward = draftFor([singularSource, pluralSource]);
    const reverse = draftFor([pluralSource, singularSource]);
    assert.equal(forward.length, 1, `${singular}/${plural}: forward merge`);
    assert.equal(reverse.length, 1, `${singular}/${plural}: reverse merge`);
    assert.equal(forward[0].canonicalName, expectedCanonical, `${singular}/${plural}: canonicalName`);
    for (const field of stableFields) {
      assert.deepEqual(forward[0][field], reverse[0][field], `${singular}/${plural}: ${field}`);
    }
    assert.deepEqual(forward[0].sourceRecipeIds, reverse[0].sourceRecipeIds);
    assert.equal(contractV2(forward).contentFingerprint, contractV2(reverse).contentFingerprint);
    assert.equal(contractV1(forward).contentFingerprint, contractV1(reverse).contentFingerprint);
  }
  return `${cases.length} alias families × both orders`;
});

await check("Count labels pluralize at 2 and 4 independently of alias order", () => {
  const cases = [
    ["carotte", "carottes", "carotte", "carottes"],
    ["saucisse", "saucisses", "saucisse", "saucisses"],
    ["œuf", "œufs", "œuf", "œufs"],
    ["citron", "citrons", "citron", "citrons"],
    ["poireau", "poireaux", "poireau", "poireaux"],
    ["chou", "choux", "chou", "choux"],
    ["pomme de terre", "pommes de terre", "pommes de terre", "pommes de terre"]
  ];
  for (const [singular, plural, canonicalName, expectedPlural] of cases) {
    for (const total of [2, 4]) {
      const each = total / 2;
      const singularSource = source(`label-${api.fnv1a(canonicalName)}-${total}-singular`, [
        ingredient(each, "", singular)
      ]);
      const pluralSource = source(`label-${api.fnv1a(canonicalName)}-${total}-plural`, [
        ingredient(each, "", plural)
      ]);
      const forward = draftFor([singularSource, pluralSource]);
      const reverse = draftFor([pluralSource, singularSource]);
      assert.equal(forward.length, 1, `${singular}/${plural} q${total}: forward merge`);
      assert.equal(reverse.length, 1, `${singular}/${plural} q${total}: reverse merge`);
      const expectedLabel = `${total} ${expectedPlural}`;
      assert.equal(forward[0].canonicalName, canonicalName, `${singular}: canonicalName`);
      assert.equal(forward[0].exactLabel, expectedLabel, `${singular} q${total}: exactLabel`);
      assert.equal(forward[0].purchaseLabel, expectedLabel, `${singular} q${total}: purchaseLabel`);
      assert.equal(reverse[0].exactLabel, expectedLabel, `${plural} q${total}: reverse exactLabel`);
      assert.equal(reverse[0].purchaseLabel, expectedLabel, `${plural} q${total}: reverse purchaseLabel`);
      assert.equal(forward[0].productKey, reverse[0].productKey, `${singular}/${plural}: productKey`);
      assert.equal(contractV2(forward).contentFingerprint, contractV2(reverse).contentFingerprint);
      assert.equal(contractV1(forward).contentFingerprint, contractV1(reverse).contentFingerprint);
    }
  }
  for (const [name, expectedPlural] of [["radis", "radis"], ["noix", "noix"], ["riz", "riz"]]) {
    const item = oneItem([source(`unchanged-plural-${name}`, [ingredient(2, "", name)])]);
    assert.equal(item.exactLabel, `2 ${expectedPlural}`, `${name}: terminal s/x/z must stay unchanged`);
    assert.doesNotMatch(item.exactLabel, new RegExp(`${expectedPlural}s\\b`, "iu"));
  }
  return `${cases.length} alias families × q2/q4 + terminal s/x/z`;
});

await check("Count-label grammar preserves connectors and embedded numbers", () => {
  const cases = [
    ["cailles en crapaudine", "2 cailles en crapaudine"],
    ["écrevisses ou queues", "2 écrevisses ou queues"],
    ["sole préparée par le poissonnier", "2 soles préparées par le poissonnier"],
    ["crêpes non sucrées", "2 crêpes non sucrées"],
    ["petites meringues ou 1 grand disque", "2 petites meringues ou 1 grand disque"]
  ];
  for (const [name, expectedLabel] of cases) {
    const recipeId = `grammar-${api.fnv1a(name)}`;
    const first = oneItem([source(recipeId, [ingredient(2, "", name)])]);
    const second = oneItem([source(recipeId, [ingredient(2, "", name)])]);
    assert.equal(first.exactLabel, expectedLabel, `${name}: exactLabel`);
    assert.equal(first.purchaseLabel, expectedLabel, `${name}: purchaseLabel`);
    assert.doesNotMatch(first.exactLabel, /\b(?:ens|ous|pars|nons|1s)\b/iu, `${name}: malformed exact grammar`);
    assert.doesNotMatch(first.purchaseLabel, /\b(?:ens|ous|pars|nons|1s)\b/iu, `${name}: malformed purchase grammar`);
    assert.equal(second.exactLabel, first.exactLabel, `${name}: deterministic exactLabel`);
    assert.equal(second.purchaseLabel, first.purchaseLabel, `${name}: deterministic purchaseLabel`);
    assert.equal(second.productKey, first.productKey, `${name}: deterministic productKey`);
    assert.equal(contractV2([second]).contentFingerprint, contractV2([first]).contentFingerprint);
    assert.equal(contractV2([first]).items[0].purchaseLabel, expectedLabel);
    assert.equal(contractV1([first]).items[0].purchaseLabel, expectedLabel);
  }
  return `${cases.length} connector/number grammar cases`;
});

await check("Drink counts preserve bottles while measured volume rounds to one", () => {
  const cases = [
    { id: "four-beers", q: 4, unit: "", name: "bières", exact: 4, purchase: 4, label: "4 bouteilles de bière" },
    { id: "two-wine-bottles", q: 2, unit: "bouteilles", name: "vin", exact: 2, purchase: 2, label: "2 bouteilles de vin" },
    { id: "measured-white-wine", q: 15, unit: "cl", name: "vin blanc", exact: 15, purchase: 1, label: "1 bouteille de vin blanc" }
  ];
  for (const expected of cases) {
    const item = oneItem([source(expected.id, [ingredient(expected.q, expected.unit, expected.name)])]);
    approx(item.exactQuantity, expected.exact, 0.011, `${expected.id}: exactQuantity`);
    approx(item.purchaseQuantity, expected.purchase, 0.011, `${expected.id}: purchaseQuantity`);
    assert.equal(item.purchaseUnit, "bouteille", `${expected.id}: purchaseUnit`);
    assert.equal(item.purchaseLabel, expected.label, `${expected.id}: purchaseLabel`);
    assert.equal(item.aisle, "Boissons", `${expected.id}: aisle`);
    assert.equal(contractV2([item]).items[0].purchaseQuantity, expected.purchase);
    assert.equal(contractV1([item]).items[0].exactQuantity, expected.purchase);
  }
  return `${cases.length} drink count/volume cases`;
});

await check("Unlabelled canned counts preserve every requested can", () => {
  const cases = [
    { id: "two-canned-tuna", q: 2, name: "thons en conserve", canonicalName: "thon", label: "2 boîtes de thon" },
    { id: "three-canned-corn", q: 3, name: "maïs en conserve", canonicalName: "maïs", label: "3 boîtes de maïs" },
    { id: "two-crushed-tomatoes", q: 2, name: "tomates concassées", canonicalName: "tomates concassées", label: "2 boîtes de tomates concassées" }
  ];
  for (const expected of cases) {
    const item = oneItem([source(expected.id, [ingredient(expected.q, "", expected.name)])]);
    assert.equal(item.form, "canned", `${expected.id}: form`);
    assert.equal(item.canonicalName, expected.canonicalName, `${expected.id}: canonicalName`);
    approx(item.exactQuantity, expected.q, 0.011, `${expected.id}: exactQuantity`);
    approx(item.purchaseQuantity, expected.q, 0.011, `${expected.id}: purchaseQuantity`);
    assert.equal(item.purchaseUnit, "boîte", `${expected.id}: purchaseUnit`);
    assert.equal(item.purchaseLabel, expected.label, `${expected.id}: purchaseLabel`);
    assert.equal(item.aisle, "Conserves", `${expected.id}: aisle`);
    const v2 = contractV2([item]).items[0];
    const v1 = contractV1([item]).items[0];
    assert.equal(v2.purchaseQuantity, expected.q, `${expected.id}: V2 purchaseQuantity`);
    assert.equal(v1.exactQuantity, expected.q, `${expected.id}: V1 exactQuantity`);
  }
  return `${cases.length} unlabelled canned count cases`;
});

await check("Named canned foods preserve form identity labels and parse round-trip", () => {
  const cases = [
    { id: "canned-tomatoes", name: "tomates en boîte", canonicalName: "tomate", label: "2 boîtes de tomates" },
    { id: "canned-green-beans", name: "haricots verts en boîte", canonicalName: "haricots verts", label: "2 boîtes de haricots verts" },
    { id: "canned-chickpeas", name: "pois chiches en boîte", canonicalName: "pois chiches", label: "2 boîtes de pois chiches" },
    { id: "canned-beef", name: "bœuf en conserve", canonicalName: "bœuf", label: "2 boîtes de bœuf" },
    { id: "canned-salmon", name: "saumon en boîte", canonicalName: "saumon", label: "2 boîtes de saumon" }
  ];
  const stableFields = [
    "canonicalName", "displayName", "form", "productKey", "purchaseQuantity",
    "purchaseUnit", "purchaseLabel", "aisle", "exactQuantity", "exactUnit", "exactLabel"
  ];
  for (const expected of cases) {
    const item = oneItem([source(expected.id, [ingredient(2, "", expected.name)])]);
    assert.equal(item.form, "canned", `${expected.name}: form must stay canned`);
    assert.notEqual(item.form, "fresh", `${expected.name}: canned must never be forced fresh`);
    assert.notEqual(item.form, "dried", `${expected.name}: canned must never be forced dried`);
    assert.equal(item.canonicalName, expected.canonicalName, `${expected.name}: canonical base`);
    assert.equal(item.aisle, "Conserves", `${expected.name}: aisle`);
    assert.equal(item.purchaseQuantity, 2, `${expected.name}: purchaseQuantity`);
    assert.equal(item.purchaseUnit, "boîte", `${expected.name}: purchaseUnit`);
    assert.equal(item.purchaseLabel, expected.label, `${expected.name}: purchaseLabel`);
    assert.doesNotMatch(item.purchaseLabel, /\bens?\s+boîtes?\b/iu, `${expected.name}: malformed plural`);
    assert.doesNotMatch(item.purchaseLabel, /boîtes?.*\ben\s+boîte\b/iu, `${expected.name}: duplicated canned form`);

    const parsed = api.parseEditedLine(item.purchaseLabel);
    assert.equal(parsed.quantity, 2, `${expected.name}: parsed quantity`);
    assert.equal(parsed.unit, "boîte", `${expected.name}: parsed unit`);
    assert.ok(parsed.name, `${expected.name}: parsed name`);
    const roundTripped = applyManualText(item, item.purchaseLabel);
    for (const field of stableFields) {
      assert.deepEqual(roundTripped[field], item[field], `${expected.name}: round-trip ${field}`);
    }
    assert.deepEqual(contractV2([roundTripped]), contractV2([item]));
    assert.deepEqual(contractV1([roundTripped]), contractV1([item]));
  }
  return `${cases.length} canned identity/label/parse cases`;
});

await check("Canned package policy separates exact need from one-time purchase calculation", () => {
  const tomatoCases = [
    { id: "crushed-tomatoes-400", grams: 400, cans: 1, label: "1 boîte de tomates concassées" },
    { id: "crushed-tomatoes-800", grams: 800, cans: 2, label: "2 boîtes de tomates concassées" }
  ];
  for (const expected of tomatoCases) {
    const recipeEntry = recipe(expected.id, [ingredient(expected.grams, "g", "tomate concassée")]);
    const before = structuredClone(recipeEntry);
    const sources = [{ recipe: recipeEntry, availableItems: [] }];
    const draft = buildDraft(sources, { peopleCount: 2 });
    assert.equal(draft.length, 1, `${expected.id}: draft size`);
    const item = draft[0];
    assert.equal(item.form, "canned", `${expected.id}: form`);
    assert.equal(item.aisle, "Conserves", `${expected.id}: aisle`);
    assert.equal(item.exactQuantity, expected.grams, `${expected.id}: exactQuantity`);
    assert.equal(item.exactUnit, "g", `${expected.id}: exactUnit`);
    assert.equal(item.purchaseQuantity, expected.cans, `${expected.id}: purchaseQuantity`);
    assert.equal(item.purchaseUnit, "boîte", `${expected.id}: purchaseUnit`);
    assert.equal(item.purchaseLabel, expected.label, `${expected.id}: purchaseLabel`);
    assert.equal(item.contributions.length, 1, `${expected.id}: contributions`);
    assert.equal(item.contributions[0].quantity, expected.grams, `${expected.id}: contribution quantity`);

    const fromDraft = buildContractV2(draft, {
      createdAt: FIXED_CREATED_AT,
      sourceVersion: SOURCE_VERSION,
      rulesVersion: api.RULES_VERSION
    });
    const directlyFromSources = buildContractV2(sources, {
      peopleCount: 2,
      createdAt: FIXED_CREATED_AT,
      sourceVersion: SOURCE_VERSION,
      rulesVersion: api.RULES_VERSION
    });
    assert.deepEqual(directlyFromSources, fromDraft, `${expected.id}: purchase must be calculated exactly once`);
    assert.equal(fromDraft.items[0].exactQuantity, expected.grams);
    assert.equal(fromDraft.items[0].exactUnit, "g");
    assert.equal(fromDraft.items[0].purchaseQuantity, expected.cans);
    assert.equal(contractV1(draft).items[0].exactQuantity, expected.cans);
    assert.deepEqual(recipeEntry, before, `${expected.id}: source recipe mutation`);
  }

  const snailsRecipe = recipe("canned-snails-24", [ingredient(24, "", "escargots en conserve")]);
  const snails = oneItem([{ recipe: snailsRecipe, availableItems: [] }]);
  assert.equal(snails.form, "canned");
  assert.equal(snails.aisle, "Conserves");
  assert.equal(snails.exactQuantity, 24);
  assert.equal(snails.exactUnit, "unité");
  assert.match(snails.exactLabel, /^24 escargots$/u);
  assert.equal(snails.purchaseQuantity, 1, "24 escargots must not become 24 or 12 cans");
  assert.equal(snails.purchaseUnit, "boîte");
  assert.match(snails.purchaseLabel, /^1 boîte d[’']escargots$/u);
  const snailsV2 = contractV2([snails]).items[0];
  assert.equal(snailsV2.exactQuantity, 24);
  assert.equal(snailsV2.purchaseQuantity, 1);
  assert.equal(contractV1([snails]).items[0].exactQuantity, 1);

  assert.equal(api.CANNED_PACKAGE_SIZE_GRAMS, 400, "The canned package mass policy must be explicit");
  assert.equal(typeof api.cannedPackageCountFor, "function", "The canned package policy must be reusable");
  return `${tomatoCases.length} tomato weights + 24-count snail guard`;
});

await check("Fresh canned frozen and dried forms stay separate on one canonical base", () => {
  const pairs = [
    ["tomate fraîche", "tomates en boîte", "tomate", "fresh", "canned"],
    ["haricot vert frais", "haricots verts en boîte", "haricots verts", "fresh", "canned"],
    ["pois chiches secs", "pois chiches en boîte", "pois chiches", "dried", "canned"],
    ["bœuf frais", "bœuf en conserve", "bœuf", "fresh", "canned"],
    ["saumon frais", "saumon en boîte", "saumon", "fresh", "canned"]
  ];
  for (const [firstName, secondName, canonicalName, firstForm, secondForm] of pairs) {
    const firstProfile = api.ingredientProfile({ n: firstName });
    const secondProfile = api.ingredientProfile({ n: secondName });
    assert.equal(firstProfile.canonicalName, canonicalName, `${firstName}: canonicalName`);
    assert.equal(secondProfile.canonicalName, canonicalName, `${secondName}: canonicalName`);
    assert.equal(firstProfile.form, firstForm, `${firstName}: form`);
    assert.equal(secondProfile.form, secondForm, `${secondName}: form`);
    assert.notEqual(api.productKeyFor(firstProfile), api.productKeyFor(secondProfile), `${canonicalName}: form productKeys`);
    const firstSource = source(`form-first-${api.fnv1a(firstName)}`, [ingredient(1, "", firstName)]);
    const secondSource = source(`form-second-${api.fnv1a(secondName)}`, [ingredient(1, "", secondName)]);
    const forward = draftFor([firstSource, secondSource]);
    const reverse = draftFor([secondSource, firstSource]);
    assert.equal(forward.length, 2, `${canonicalName}: forms must not merge`);
    assert.equal(reverse.length, 2, `${canonicalName}: reversed forms must not merge`);
    assert.deepEqual(new Set(forward.map(item => item.canonicalName)), new Set([canonicalName]));
    assert.deepEqual(new Set(forward.map(item => item.form)), new Set([firstForm, secondForm]));
    assert.equal(contractV2(forward).contentFingerprint, contractV2(reverse).contentFingerprint);
  }

  const preservedForms = [
    ["saumon surgelé", "frozen", "Surgelés"],
    ["beurre surgelé", "frozen", "Surgelés"],
    ["lait en poudre", "dried", "Crèmerie"]
  ];
  for (const [name, form, aisle] of preservedForms) {
    const item = oneItem([source(`preserved-form-${api.fnv1a(name)}`, [ingredient(2, "", name)])]);
    assert.equal(item.form, form, `${name}: form`);
    assert.equal(item.aisle, aisle, `${name}: aisle`);
  }
  return `${pairs.length} separated form pairs + ${preservedForms.length} meat/fish/dairy guards`;
});

await check("Detected forms are never overwritten by category defaults", () => {
  const cases = [
    ["pâtes fraîches", "pâtes", "fresh", "Épicerie"],
    ["pâtes surgelées", "pâtes", "frozen", "Surgelés"],
    ["basilic en boîte", "basilic", "canned", "Conserves"],
    ["jambon surgelé", "jambon", "frozen", "Surgelés"],
    ["ail en poudre", "ail", "dried", "Épicerie"],
    ["ail séché", "ail", "dried", "Épicerie"],
    ["tomate en boîte", "tomate", "canned", "Conserves"],
    ["tomate séchée", "tomate", "dried", "Épicerie"],
    ["saumon séché", "saumon", "dried", "Poissonnerie"],
    ["bœuf en conserve", "bœuf", "canned", "Conserves"],
    ["bœuf séché", "bœuf", "dried", "Boucherie"],
    ["haricots verts en boîte", "haricots verts", "canned", "Conserves"],
    ["champignons séchés", "champignon", "dried", "Épicerie"],
    ["lait en poudre", "lait", "dried", "Crèmerie"],
    ["beurre surgelé", "beurre", "frozen", "Surgelés"],
    ["lentilles en boîte", "lentilles", "canned", "Conserves"],
    ["lentilles surgelées", "lentilles", "frozen", "Surgelés"]
  ];
  for (const [name, canonicalName, form, aisle] of cases) {
    const profile = api.ingredientProfile({ n: name });
    assert.equal(profile.canonicalName, canonicalName, `${name}: canonicalName`);
    assert.equal(profile.form, form, `${name}: detected form`);
    const item = oneItem([source(`form-matrix-${api.fnv1a(name)}`, [ingredient(2, "", name)])]);
    assert.equal(item.canonicalName, canonicalName, `${name}: draft canonicalName`);
    assert.equal(item.form, form, `${name}: draft form`);
    assert.equal(item.aisle, aisle, `${name}: aisle`);
    assert.equal(item.productKey, api.productKeyFor(profile), `${name}: productKey`);
    if (form === "canned") {
      assert.equal(item.purchaseUnit, "boîte", `${name}: canned purchaseUnit`);
      assert.ok(Number.isInteger(item.purchaseQuantity) && item.purchaseQuantity >= 1, `${name}: canned purchaseQuantity`);
    }
  }
  return `${cases.length} category/form combinations`;
});

await check("Dried fresh frozen and powdered qualifiers stay explicit in labels", () => {
  const driedTomatoes = oneItem([
    source("qualified-dried-tomatoes", [ingredient(200, "g", "tomates séchées")])
  ]);
  assert.equal(driedTomatoes.form, "dried");
  for (const field of ["displayName", "exactLabel", "purchaseLabel"]) {
    assert.match(driedTomatoes[field], /séch/iu, `tomates séchées: ${field} must retain the dried qualifier`);
  }

  const freshPasta = oneItem([
    source("qualified-fresh-pasta", [ingredient(250, "g", "pâtes fraîches")])
  ]);
  const frozenPasta = oneItem([
    source("qualified-frozen-pasta", [ingredient(250, "g", "pâtes surgelées")])
  ]);
  assert.equal(freshPasta.form, "fresh");
  assert.equal(frozenPasta.form, "frozen");
  assert.match(freshPasta.purchaseLabel, /fraîch/iu, "fresh pasta purchaseLabel must be explicit");
  assert.match(frozenPasta.purchaseLabel, /surgel/iu, "frozen pasta purchaseLabel must be explicit");
  assert.notEqual(freshPasta.purchaseLabel, frozenPasta.purchaseLabel);
  assert.notEqual(freshPasta.productKey, frozenPasta.productKey);

  const powderedGarlic = oneItem([
    source("qualified-powdered-garlic", [ingredient(2, "c. à café", "ail en poudre")])
  ]);
  assert.equal(powderedGarlic.form, "dried");
  for (const field of ["displayName", "exactLabel", "purchaseLabel"]) {
    assert.match(powderedGarlic[field], /poudre/iu, `ail en poudre: ${field} must retain the powdered qualifier`);
    assert.doesNotMatch(powderedGarlic[field], /\bails\b/iu, `ail en poudre: ${field} must never invent “ails”`);
  }
  return "tomatoes dried + pasta fresh/frozen + garlic powdered";
});

await check("Very fresh fish never leaves a truncated adjective in its identity", () => {
  const item = oneItem([
    source("very-fresh-salmon", [ingredient(200, "g", "saumon très frais")])
  ]);
  assert.equal(item.canonicalName, "saumon");
  assert.equal(item.form, "fresh");
  for (const field of ["canonicalName", "displayName", "exactLabel", "purchaseLabel"]) {
    assert.notEqual(item[field].trim(), "saumon très", `${field} must not be the truncated “saumon très”`);
    assert.doesNotMatch(item[field], /saumon très\s*$/iu, `${field} must not end on the orphan qualifier “très”`);
  }
  return `${item.exactLabel} => ${item.purchaseLabel}`;
});

await check("Qualified canned capacity survives inside the fixed V2 item surface", () => {
  const item = oneItem([
    source("qualified-chickpeas-can", [ingredient(1, "boîte de 400 g", "pois chiches")])
  ]);
  assert.equal(item.form, "canned");
  assert.equal(item.packageCapacityGrams, 400);
  assert.equal(item.exactUnit, "boîte de 400 g");
  assert.equal(item.exactLabel, "1 boîte de 400 g de pois chiches");

  const v2Item = contractV2([item]).items[0];
  assert.deepEqual(Object.keys(v2Item), [
    "selected",
    "productKey",
    "canonicalName",
    "displayName",
    "form",
    "exactQuantity",
    "exactUnit",
    "exactLabel",
    "purchaseQuantity",
    "purchaseUnit",
    "purchaseLabel",
    "aisle",
    "sourceRecipeIds"
  ]);
  assert.equal(Object.keys(v2Item).length, 13);
  assert.equal(v2Item.exactUnit, "boîte de 400 g");
  assert.equal(v2Item.exactLabel, "1 boîte de 400 g de pois chiches");
  assert.equal(v2Item.purchaseLabel, "1 boîte de 400 g de pois chiches");
  assert.equal("packageCapacityGrams" in v2Item, false, "capacity must remain encoded without extending the 13-field contract");
  return "400 g capacity encoded; 13 V2 fields";
});

await check("Explicit organic fruit needs and candied fruits stay separate from generic fresh produce", () => {
  const orangeSources = [
    source("required-orange-aliases", [
      ingredient(1, "", "orange bio"),
      ingredient(1, "", "orange non traitée")
    ]),
    source("generic-orange-aliases", [
      ingredient(1, "", "orange fraîche"),
      ingredient(1, "", "orange")
    ]),
    source("candied-orange", [ingredient(1, "", "orange confite")])
  ];
  const orangeDraft = draftFor(orangeSources);
  const orangeReverse = draftFor([...orangeSources].reverse());
  assert.equal(orangeDraft.length, 3, "bio/non-treated, generic fresh and candied orange need three identities");
  assert.equal(orangeReverse.length, 3, "orange identities must not depend on source order");

  const organicKey = oneItem([source("organic-orange-single", [ingredient(1, "", "orange bio")])]).productKey;
  const untreatedKey = oneItem([source("untreated-orange-single", [ingredient(1, "", "orange non traitée")])]).productKey;
  const freshKey = oneItem([source("fresh-orange-single", [ingredient(1, "", "orange fraîche")])]).productKey;
  const genericKey = oneItem([source("generic-orange-single", [ingredient(1, "", "orange")])]).productKey;
  assert.equal(organicKey, untreatedKey, "bio and non-treated oranges are compatible explicit-needs aliases");
  assert.equal(freshKey, genericKey, "fresh and generic oranges remain compatible");
  assert.notEqual(organicKey, genericKey, "explicit organic need must not merge into generic orange");

  const requiredOrange = orangeDraft.find((item) => item.productKey === organicKey);
  const freshOrange = orangeDraft.find((item) => item.productKey === genericKey);
  const candiedOrange = orangeDraft.find((item) => /confit/iu.test(item.displayName));
  assert.ok(requiredOrange, "bio/non-treated orange item");
  assert.ok(freshOrange, "fresh orange item");
  assert.ok(candiedOrange, "candied orange item");
  assert.match(requiredOrange.displayName, /(?:bio|non trait)/iu, "explicit need remains visible");
  assert.notEqual(candiedOrange.form, "fresh");
  assert.notEqual(candiedOrange.productKey, freshOrange.productKey);
  assert.notEqual(candiedOrange.productKey, requiredOrange.productKey);
  for (const field of ["displayName", "exactLabel", "purchaseLabel"]) {
    assert.match(candiedOrange[field], /confit/iu, `orange confite: ${field}`);
  }
  assert.deepEqual(contractV2(orangeDraft), contractV2(orangeReverse), "orange V2 order/fingerprint invariance");
  assert.deepEqual(contractV1(orangeDraft), contractV1(orangeReverse), "orange V1 order/fingerprint invariance");

  for (const [freshName, candiedName] of [
    ["citron frais", "citron confit"],
    ["cerise fraîche", "cerises confites"],
    ["ananas frais", "ananas confit"]
  ]) {
    const pair = draftFor([
      source(`fresh-fruit-${api.fnv1a(freshName)}`, [ingredient(1, "", freshName)]),
      source(`candied-fruit-${api.fnv1a(candiedName)}`, [ingredient(1, "", candiedName)])
    ]);
    assert.equal(pair.length, 2, `${freshName}/${candiedName}: distinct draft items`);
    const fresh = pair.find((item) => item.form === "fresh");
    const candied = pair.find((item) => /confit/iu.test(item.displayName));
    assert.ok(fresh, `${freshName}: fresh item`);
    assert.ok(candied, `${candiedName}: candied item`);
    assert.notEqual(candied.form, "fresh", `${candiedName}: transformed form`);
    assert.notEqual(candied.productKey, fresh.productKey, `${candiedName}: distinct productKey`);
    assert.match(candied.exactLabel, /confit/iu, `${candiedName}: exactLabel`);
    assert.match(candied.purchaseLabel, /confit/iu, `${candiedName}: purchaseLabel`);
  }
  return "explicit orange need + generic orange + 4 candied fruit guards";
});

await check("Ligatures and apostrophes share one order-invariant identity", () => {
  const cases = [
    ["boeuf", "bœuf", "bœuf", "g", 100, 150],
    ["oeuf", "œuf", "œuf", "", 1, 2],
    ["huile d'olive", "huile d’olive", "huile d’olive", "c. à soupe", 1, 2]
  ];
  const stableFields = [
    "canonicalName", "displayName", "form", "productKey", "exactQuantity", "exactUnit",
    "exactLabel", "purchaseQuantity", "purchaseUnit", "purchaseLabel", "aisle"
  ];
  for (const [asciiName, typographicName, canonicalName, unit, firstQuantity, secondQuantity] of cases) {
    const asciiProfile = api.ingredientProfile({ n: asciiName, u: unit });
    const typographicProfile = api.ingredientProfile({ n: typographicName, u: unit });
    assert.equal(asciiProfile.canonicalName, canonicalName, `${asciiName}: canonicalName`);
    assert.equal(typographicProfile.canonicalName, canonicalName, `${typographicName}: canonicalName`);
    assert.equal(api.productKeyFor(asciiProfile), api.productKeyFor(typographicProfile), `${asciiName}/${typographicName}: productKey`);

    const asciiSource = source(`identity-ascii-${api.fnv1a(canonicalName)}`, [
      ingredient(firstQuantity, unit, asciiName)
    ]);
    const typographicSource = source(`identity-typographic-${api.fnv1a(canonicalName)}`, [
      ingredient(secondQuantity, unit, typographicName)
    ]);
    const forward = draftFor([asciiSource, typographicSource]);
    const reverse = draftFor([typographicSource, asciiSource]);
    assert.equal(forward.length, 1, `${asciiName}/${typographicName}: forward merge`);
    assert.equal(reverse.length, 1, `${asciiName}/${typographicName}: reverse merge`);
    for (const field of stableFields) {
      assert.deepEqual(forward[0][field], reverse[0][field], `${asciiName}/${typographicName}: ${field}`);
    }
    assert.equal(forward[0].canonicalName, canonicalName);
    assert.deepEqual(forward[0].sourceRecipeIds, reverse[0].sourceRecipeIds);
    assert.equal(contractV2(forward).contentFingerprint, contractV2(reverse).contentFingerprint);
    assert.equal(contractV1(forward).contentFingerprint, contractV1(reverse).contentFingerprint);
  }
  return `${cases.length} orthographic alias families × both orders`;
});

await check("Pâte and pâté always keep separate identities", () => {
  const plainPaste = api.ingredientProfile({ n: "pâte", u: "g" });
  const charcuterie = api.ingredientProfile({ n: "pâté", u: "g" });
  assert.equal(plainPaste.canonicalName, "pâte");
  assert.equal(charcuterie.canonicalName, "pâté");
  assert.notEqual(plainPaste.kind, "pasta");
  assert.equal(charcuterie.kind, "charcuterie");
  assert.notEqual(api.productKeyFor(plainPaste), api.productKeyFor(charcuterie));
  const draft = draftFor([
    source("plain-paste", [ingredient(100, "g", "pâte")]),
    source("charcuterie-pate", [ingredient(100, "g", "pâté")])
  ]);
  assert.equal(draft.length, 2);
  assert.equal(new Set(draft.map(item => item.productKey)).size, 2);
  assert.deepEqual(new Set(draft.map(item => item.canonicalName)), new Set(["pâte", "pâté"]));
});

await check("Non-pasta paste homonyms remain distinct", () => {
  const names = ["pâte de curry", "pâte à tartiner", "pâte de pistache", "pâte miso", "pâte d’amande"];
  const items = names.map(name => oneItem([
    source(`paste-${api.fnv1a(name)}`, [ingredient(100, "g", name)])
  ]));
  for (const [index, item] of items.entries()) {
    assert.notEqual(item.canonicalName, "pâtes", `${names[index]}: canonicalName`);
    assert.notEqual(item.kind, "pasta", `${names[index]}: kind`);
    assert.notEqual(item.purchaseUnit, "paquet", `${names[index]}: purchaseUnit`);
    assert.doesNotMatch(item.purchaseLabel, /paquet de pâtes/i, `${names[index]}: purchaseLabel`);
  }
  assert.equal(new Set(items.map(item => item.productKey)).size, names.length, "Paste homonym productKeys");
  return `${names.length} non-pasta homonyms`;
});

await check("Maïs and glace substrings never over-merge unrelated foods", () => {
  for (const [name, expectedCanonicalPrefix] of [
    ["poires mûres mais fermes", "poire"],
    ["pêches mûres mais encore fermes", "pêche"]
  ]) {
    const profile = api.ingredientProfile({ n: name });
    assert.ok(profile.canonicalName.startsWith(expectedCanonicalPrefix), `${name}: canonicalName must preserve its fruit identity`);
    assert.notEqual(profile.canonicalName, "maïs", `${name}: conjunction must not become corn`);
    assert.notEqual(api.productKeyFor(profile), api.productKeyFor(api.ingredientProfile({ n: "maïs" })), `${name}: productKey must remain distinct from corn`);
    assert.equal(api.aisleFor(profile), "Fruits et légumes", `${name}: aisle`);
  }

  const cornStarch = oneItem([source("corn-starch", [ingredient(100, "g", "fécule de maïs")])]);
  const freshCorn = oneItem([source("fresh-corn", [ingredient(2, "", "maïs frais")])]);
  assert.equal(cornStarch.canonicalName, "fécule de maïs");
  assert.equal(cornStarch.aisle, "Épicerie");
  assert.equal(freshCorn.canonicalName, "maïs");
  assert.equal(freshCorn.form, "fresh");
  assert.equal(freshCorn.aisle, "Fruits et légumes");
  assert.notEqual(cornStarch.productKey, freshCorn.productKey);
  assert.equal(draftFor([
    source("corn-starch-group", [ingredient(100, "g", "fécule de maïs")]),
    source("fresh-corn-group", [ingredient(2, "", "maïs frais")])
  ]).length, 2);

  const frozenDessert = oneItem([source("frozen-dessert", [ingredient(500, "ml", "crème glacée vanille")])]);
  const icingSugar = oneItem([source("icing-sugar", [ingredient(100, "g", "sucre glace")])]);
  const meatGlaze = oneItem([source("meat-glaze", [ingredient(10, "cl", "glace de viande")])]);
  const reducedStock = oneItem([source("reduced-stock", [ingredient(10, "cl", "fond réduit")])]);
  assert.equal(frozenDessert.form, "frozen");
  assert.equal(frozenDessert.aisle, "Surgelés");
  for (const item of [icingSugar, meatGlaze, reducedStock]) {
    assert.notEqual(item.form, "frozen", `${item.displayName}: non-dessert form`);
    assert.notEqual(item.aisle, "Surgelés", `${item.displayName}: non-dessert aisle`);
  }
  assert.equal(icingSugar.aisle, "Épicerie");
  assert.equal(meatGlaze.aisle, "Épicerie");
  assert.equal(reducedStock.aisle, "Épicerie");
  assert.equal(new Set([frozenDessert, icingSugar, meatGlaze, reducedStock].map(item => item.productKey)).size, 4);
  return "conjunction/corn + starch/fresh + 4 glace meanings";
});

await check("Compound foods and lexical substrings never silently over-merge", () => {
  const compoundCases = [
    ["paprika et cumin", ["paprika", "cumin"]],
    ["olives et vinaigrette", ["olives", "vinaigrette"]],
    ["menthe et persil", ["menthe", "persil"]]
  ];
  for (const [compoundName, individualNames] of compoundCases) {
    const compoundProfile = api.ingredientProfile({ n: compoundName });
    assert.equal(compoundProfile.canonicalName, compoundName, `${compoundName}: phrase-preserving canonicalName`);
    const profiles = [compoundProfile, ...individualNames.map(name => api.ingredientProfile({ n: name }))];
    assert.equal(new Set(profiles.map(profile => api.productKeyFor(profile))).size, profiles.length, `${compoundName}: productKeys`);
    const draft = draftFor([
      source(`compound-${api.fnv1a(compoundName)}`, [ingredient(1, "c. à café", compoundName)]),
      ...individualNames.map(name => source(`individual-${api.fnv1a(name)}`, [ingredient(1, "c. à café", name)]))
    ]);
    assert.equal(draft.length, profiles.length, `${compoundName}: no silent merge`);
  }

  const corianderCases = ["graines de coriandre", "coriandre moulue"];
  const freshCoriander = api.ingredientProfile({ n: "coriandre fraîche" });
  assert.equal(freshCoriander.form, "fresh");
  for (const name of corianderCases) {
    const profile = api.ingredientProfile({ n: name });
    assert.equal(profile.canonicalName, name, `${name}: canonicalName`);
    assert.equal(profile.form, "dried", `${name}: dried spice form`);
    assert.equal(api.aisleFor(profile), "Épicerie", `${name}: aisle`);
    assert.notEqual(api.productKeyFor(profile), api.productKeyFor(freshCoriander), `${name}: fresh coriander key`);
  }

  const sugarForMoulds = oneItem([source("sugar-for-moulds", [ingredient(100, "g", "sucre pour les moules")])]);
  assert.equal(sugarForMoulds.canonicalName, "sucre pour les moules");
  assert.equal(sugarForMoulds.kind, "dry-grocery");
  assert.equal(sugarForMoulds.aisle, "Épicerie");
  assert.notEqual(sugarForMoulds.kind, "fish");

  const semolinaSugar = oneItem([source("semolina-sugar", [ingredient(100, "g", "sucre semoule")])]);
  const semolina = oneItem([source("semolina-grain", [ingredient(100, "g", "semoule")])]);
  assert.equal(semolinaSugar.canonicalName, "sucre semoule");
  assert.equal(semolina.canonicalName, "semoule");
  assert.notEqual(semolinaSugar.productKey, semolina.productKey);
  assert.equal(draftFor([
    source("semolina-sugar-group", [ingredient(100, "g", "sucre semoule")]),
    source("semolina-grain-group", [ingredient(100, "g", "semoule")])
  ]).length, 2);

  const riceNames = ["riz", "nouilles de riz", "vermicelles de riz", "galettes de riz"];
  const riceItems = riceNames.map(name => oneItem([
    source(`rice-shape-${api.fnv1a(name)}`, [ingredient(100, "g", name)])
  ]));
  assert.deepEqual(riceItems.map(item => item.canonicalName), riceNames);
  assert.equal(new Set(riceItems.map(item => item.productKey)).size, riceNames.length);
  assert.ok(riceItems.every(item => item.aisle === "Épicerie"));
  assert.equal(draftFor(riceNames.map(name =>
    source(`rice-shape-group-${api.fnv1a(name)}`, [ingredient(100, "g", name)]))).length, riceNames.length);

  const derivedProduceCases = [
    ["jus de citron", "citron frais", "citron"],
    ["zeste de citron", "citron frais", "citron"],
    ["citron confit", "citron frais", "citron"],
    ["compote de pomme", "pomme fraîche", "pomme"],
    ["soupe de tomate", "tomate fraîche", "tomate"]
  ];
  for (const [derivedName, freshName, freshCanonical] of derivedProduceCases) {
    const derivedProfile = api.ingredientProfile({ n: derivedName });
    const freshProfile = api.ingredientProfile({ n: freshName });
    assert.equal(derivedProfile.canonicalName, derivedName, `${derivedName}: canonicalName`);
    assert.equal(freshProfile.canonicalName, freshCanonical, `${freshName}: canonicalName`);
    assert.notEqual(api.productKeyFor(derivedProfile), api.productKeyFor(freshProfile), `${derivedName}: productKey`);
    const draft = draftFor([
      source(`derived-${api.fnv1a(derivedName)}`, [ingredient(1, "", derivedName)]),
      source(`fresh-${api.fnv1a(freshName)}`, [ingredient(1, "", freshName)])
    ]);
    assert.equal(draft.length, 2, `${derivedName}: must remain separate from ${freshName}`);
  }
  return `${compoundCases.length} compounds + coriander + sugar/semolina + rice forms + ${derivedProduceCases.length} derivatives`;
});

await check("Qualified profiles never become source-order-dependent", () => {
  const incompatiblePairs = [
    ["crème", "crème légère"],
    ["sucre", "sucre roux"]
  ];
  for (const [baseName, qualifiedName] of incompatiblePairs) {
    const baseProfile = api.ingredientProfile({ n: baseName, u: "g" });
    const qualifiedProfile = api.ingredientProfile({ n: qualifiedName, u: "g" });
    assert.equal(baseProfile.canonicalName, baseName, `${baseName}: canonicalName`);
    assert.equal(qualifiedProfile.canonicalName, qualifiedName, `${qualifiedName}: canonicalName`);
    assert.notEqual(api.productKeyFor(baseProfile), api.productKeyFor(qualifiedProfile), `${baseName}/${qualifiedName}: productKey`);
    const baseSource = source(`profile-base-${api.fnv1a(baseName)}`, [ingredient(100, "g", baseName)]);
    const qualifiedSource = source(`profile-qualified-${api.fnv1a(qualifiedName)}`, [ingredient(100, "g", qualifiedName)]);
    const forward = draftFor([baseSource, qualifiedSource]);
    const reverse = draftFor([qualifiedSource, baseSource]);
    assert.equal(forward.length, 2, `${baseName}/${qualifiedName}: incompatible profiles must not merge`);
    assert.equal(reverse.length, 2, `${baseName}/${qualifiedName}: reversed incompatible profiles must not merge`);
    assert.deepEqual(contractV2(forward), contractV2(reverse), `${baseName}/${qualifiedName}: V2 order`);
    assert.deepEqual(contractV1(forward), contractV1(reverse), `${baseName}/${qualifiedName}: V1 order`);
  }

  const ginger = source("profile-ginger", [ingredient(20, "g", "gingembre")]);
  const gratedGinger = source("profile-grated-ginger", [ingredient(20, "g", "gingembre râpé")]);
  const gingerForward = draftFor([ginger, gratedGinger]);
  const gingerReverse = draftFor([gratedGinger, ginger]);
  assert.ok([1, 2].includes(gingerForward.length), "Ginger compatibility policy must be explicit");
  assert.equal(gingerReverse.length, gingerForward.length, "Ginger policy must not depend on source order");
  if (gingerForward.length === 1) {
    for (const field of ["canonicalName", "displayName", "productKey", "exactLabel", "purchaseLabel", "aisle"]) {
      assert.deepEqual(gingerForward[0][field], gingerReverse[0][field], `ginger merged representative: ${field}`);
    }
  } else {
    assert.equal(new Set(gingerForward.map(item => item.productKey)).size, 2, "Separated ginger variants need distinct keys");
  }
  assert.deepEqual(contractV2(gingerForward), contractV2(gingerReverse), "Ginger V2 order");
  assert.deepEqual(contractV1(gingerForward), contractV1(gingerReverse), "Ginger V1 order");
  return `${incompatiblePairs.length} incompatible pairs + deterministic ginger policy`;
});

await check("Fresh ginger keeps its qualifier and stays distinct from dried forms", () => {
  const freshSource = source("ginger-form-fresh", [ingredient(2, "cm", "gingembre frais")]);
  const powderedSource = source("ginger-form-powdered", [ingredient(1, "c. à café", "gingembre en poudre")]);
  const driedSource = source("ginger-form-dried", [ingredient(10, "g", "gingembre séché")]);

  const freshOnly = oneItem([freshSource]);
  const powderedOnly = oneItem([powderedSource]);
  const driedOnly = oneItem([driedSource]);
  assert.equal(freshOnly.form, "fresh");
  for (const field of ["displayName", "exactLabel", "purchaseLabel"]) {
    assert.match(freshOnly[field], /frais/iu, `gingembre frais: ${field} must retain “frais”`);
  }
  assert.equal(powderedOnly.form, "dried");
  assert.equal(driedOnly.form, "dried");
  assert.notEqual(freshOnly.productKey, powderedOnly.productKey, "fresh/powdered ginger productKey");
  assert.notEqual(freshOnly.productKey, driedOnly.productKey, "fresh/dried ginger productKey");

  const forward = draftFor([freshSource, powderedSource, driedSource]);
  const reverse = draftFor([driedSource, powderedSource, freshSource]);
  const forwardV2 = contractV2(forward);
  const reverseV2 = contractV2(reverse);
  const forwardV1 = contractV1(forward);
  const reverseV1 = contractV1(reverse);
  assert.deepEqual(forwardV2, reverseV2, "V2 contract must be independent of ginger source order");
  assert.deepEqual(forwardV1, reverseV1, "V1 contract must be independent of ginger source order");
  assert.equal(forwardV2.contentFingerprint, reverseV2.contentFingerprint, "V2 fingerprint order invariance");
  assert.equal(forwardV1.contentFingerprint, reverseV1.contentFingerprint, "V1 fingerprint order invariance");
  const freshCombined = forward.find((item) => item.form === "fresh");
  assert.ok(freshCombined, "combined draft fresh ginger");
  assert.equal(freshCombined.productKey, freshOnly.productKey);
  for (const field of ["displayName", "exactLabel", "purchaseLabel"]) {
    assert.match(freshCombined[field], /frais/iu, `combined gingembre frais: ${field}`);
  }
  return `${freshOnly.exactLabel}; ${forwardV2.contentFingerprint}`;
});

await check("Dry-tasting beverages keep “sec” without becoming dried food", () => {
  const cases = ["vin blanc sec", "riesling sec", "vermouth sec"];
  const keys = new Set();
  for (const name of cases) {
    const item = oneItem([
      source(`dry-beverage-${api.fnv1a(name)}`, [ingredient(15, "cl", name)])
    ]);
    assert.notEqual(item.form, "dried", `${name}: beverage must not use the dried-food form`);
    assert.equal(item.aisle, "Boissons", `${name}: aisle`);
    for (const field of ["canonicalName", "displayName", "exactLabel", "purchaseLabel"]) {
      assert.match(item[field], /sec/iu, `${name}: ${field} must retain “sec”`);
    }
    keys.add(item.productKey);
  }
  assert.equal(keys.size, cases.length, "named dry beverages need distinct identities");
  return `${cases.length} dry beverage identities`;
});

await check("Cooked pulses never inherit cooked-to-dry grain conversion", () => {
  const cases = [
    ["lentilles cuites", "lentilles sèches"],
    ["haricots cuits", "haricots secs"],
    ["pois chiches cuits", "pois chiches secs"]
  ];
  for (const [cookedName, driedName] of cases) {
    const cooked = oneItem([
      source(`cooked-pulse-${api.fnv1a(cookedName)}`, [ingredient(200, "g", cookedName)])
    ]);
    const dried = oneItem([
      source(`dried-pulse-${api.fnv1a(driedName)}`, [ingredient(200, "g", driedName)])
    ]);
    assert.notEqual(cooked.form, "dried", `${cookedName}: form`);
    assert.equal(dried.form, "dried", `${driedName}: form`);
    approx(cooked.exactQuantity, 200, 0.001, `${cookedName}: exact quantity must not be converted`);
    assert.equal(cooked.exactUnit, "g", `${cookedName}: exact unit`);
    assert.doesNotMatch(cooked.exactLabel, /^environ\b/iu, `${cookedName}: no cooked-to-dry estimate`);
    for (const field of ["displayName", "exactLabel", "purchaseLabel"]) {
      assert.match(cooked[field], /cuit/iu, `${cookedName}: ${field} must retain cooked state`);
    }
    assert.notEqual(cooked.productKey, dried.productKey, `${cookedName}/${driedName}: productKey`);
    assert.notEqual(cooked.exactLabel, dried.exactLabel, `${cookedName}/${driedName}: exactLabel`);
    assert.notEqual(cooked.aisle, "Divers", `${cookedName}: coherent aisle`);
    assert.notEqual(dried.aisle, "Divers", `${driedName}: coherent aisle`);
  }
  return `${cases.length} cooked/dried pulse pairs`;
});

await check("Named product variants never over-group and exact duplicates still add", () => {
  const families = [
    ["garlic", ["ail", "ail noir"]],
    ["cheese", ["fromage", "fromage frais"]],
    ["lemon", ["citron", "citron vert"]],
    ["pepper", ["poivron rouge", "poivron vert"]],
    ["mustard", ["moutarde douce", "moutarde forte", "moutarde de Dijon", "moutarde à l’ancienne"]],
    ["rice", ["riz arborio", "riz basmati", "riz à paella"]],
    ["pasta", ["spaghetti", "orzo", "tagliatelles", "pâtes"]],
    ["potato", [
      "pommes de terre farineuses", "pommes de terre à chair ferme", "pommes de terre frites",
      "pommes de terre ratte", "pommes de terre grenaille"
    ]],
    ["semolina", ["semoule fine", "semoule moyenne"]],
    ["onion", ["oignon rouge", "oignon nouveau"]],
    ["cooked-state", ["jambon cru", "jambon cuit"]],
    ["grilled-state", ["poivron frais", "poivron grillé"]],
    ["grilled-zucchini", ["courgette fraîche", "courgette grillée"]],
    ["homemade", ["mayonnaise", "mayonnaise maison"]],
    ["liquid", ["crème", "crème liquide"]],
    ["cut-shape", ["parmesan râpé", "parmesan en morceaux"]],
    ["maturity", ["banane verte", "banane mûre"]],
    ["salad-composites", ["salade César", "salade niçoise", "salade de fruits"]],
    ["bread-style", ["pain", "pain de campagne"]]
  ];

  for (const [family, names] of families) {
    const quantities = names.map((_, index) => 100 + (index * 50));
    const sources = names.map((name, index) => source(
      `variant-${family}-${index}`,
      [ingredient(quantities[index], "g", name)]
    ));
    const forward = draftFor(sources);
    const reverse = draftFor([...sources].reverse());
    assert.equal(forward.length, names.length, `${family}: every named variant needs its own item`);
    assert.equal(reverse.length, names.length, `${family}: reversed variants need their own items`);
    assert.equal(new Set(forward.map((item) => item.productKey)).size, names.length, `${family}: distinct productKeys`);

    for (let index = 0; index < names.length; index += 1) {
      const standalone = oneItem([sources[index]]);
      const grouped = forward.find((item) => item.productKey === standalone.productKey);
      assert.ok(grouped, `${family}/${names[index]}: grouped item by stable productKey`);
      approx(grouped.exactQuantity, quantities[index], 0.001, `${family}/${names[index]}: exactQuantity`);
      assert.equal(grouped.exactUnit, "g", `${family}/${names[index]}: exactUnit`);
    }

    const forwardV2 = contractV2(forward);
    const reverseV2 = contractV2(reverse);
    const forwardV1 = contractV1(forward);
    const reverseV1 = contractV1(reverse);
    assert.deepEqual(forwardV2, reverseV2, `${family}: V2 order invariance`);
    assert.deepEqual(forwardV1, reverseV1, `${family}: V1 order invariance`);
    assert.equal(forwardV2.contentFingerprint, reverseV2.contentFingerprint, `${family}: V2 fingerprint`);
    assert.equal(forwardV1.contentFingerprint, reverseV1.contentFingerprint, `${family}: V1 fingerprint`);

    const exactDuplicate = draftFor([
      source(`duplicate-${family}-a`, [ingredient(40, "g", names[0])]),
      source(`duplicate-${family}-b`, [ingredient(60, "g", names[0])])
    ]);
    assert.equal(exactDuplicate.length, 1, `${family}: identical products must still group`);
    approx(exactDuplicate[0].exactQuantity, 100, 0.001, `${family}: identical quantities must add`);
    assert.equal(exactDuplicate[0].productKey, oneItem([sources[0]]).productKey, `${family}: duplicate productKey`);
  }
  return `${families.length} variant families + exact-duplicate accumulation`;
});

await check("Packaging dimensions stay distinct while compatible minor-size aliases merge", () => {
  const packagingSources = [
    source("packaging-small-can", [ingredient(1, "petite boîte", "tomates")]),
    source("packaging-large-can", [ingredient(1, "grande boîte", "tomates")]),
    source("packaging-whole-can", [ingredient(1, "boîte", "tomates entières en boîte")]),
    source("packaging-diced-can", [ingredient(1, "boîte", "tomates concassées en boîte")])
  ];
  const packagingForward = draftFor(packagingSources);
  const packagingReverse = draftFor([...packagingSources].reverse());
  assert.equal(packagingForward.length, 4, "small/large and whole/diced canned tomatoes need distinct items");
  assert.equal(new Set(packagingForward.map((item) => item.productKey)).size, 4, "packaging variants need distinct productKeys");
  assert.deepEqual(contractV2(packagingForward), contractV2(packagingReverse), "packaging V2 order/fingerprint invariance");
  assert.deepEqual(contractV1(packagingForward), contractV1(packagingReverse), "packaging V1 order/fingerprint invariance");
  for (const qualifier of ["petite", "grande", "entière", "concassée"]) {
    const item = packagingForward.find((entry) => new RegExp(qualifier, "iu").test(`${entry.displayName} ${entry.exactLabel} ${entry.purchaseLabel}`));
    assert.ok(item, `packaging qualifier ${qualifier} must remain visible`);
  }

  const compatibleFamilies = [
    ["courgette", "courgettes", "petite courgette", "petites courgettes"],
    ["tomate", "tomates", "petite tomate", "petites tomates"]
  ];
  for (let familyIndex = 0; familyIndex < compatibleFamilies.length; familyIndex += 1) {
    const names = compatibleFamilies[familyIndex];
    const sources = names.map((name, index) => source(
      `minor-size-${familyIndex}-${index}`,
      [ingredient(index + 1, "", name)]
    ));
    const forward = draftFor(sources);
    const reverse = draftFor([...sources].reverse());
    assert.equal(forward.length, 1, `${names[0]}: singular/plural and minor sizes must stay compatible`);
    assert.equal(reverse.length, 1, `${names[0]}: compatible aliases reversed`);
    approx(forward[0].exactQuantity, 10, 0.001, `${names[0]}: compatible quantities add`);
    assert.deepEqual(contractV2(forward), contractV2(reverse), `${names[0]}: V2 alias order/fingerprint`);
    assert.deepEqual(contractV1(forward), contractV1(reverse), `${names[0]}: V1 alias order/fingerprint`);
  }
  return "4 packaging variants + 8 compatible product aliases";
});

await check("Grouping same product and source provenance", () => {
  const draft = draftFor([
    source("same-b", [ingredient(100, "g", "porc émincé")]),
    source("same-a", [ingredient(250, "g", "porc émincé")])
  ]);
  assert.equal(draft.length, 1);
  approx(draft[0].exactQuantity, 350);
  assert.deepEqual(draft[0].sourceRecipeIds, ["same-a", "same-b"]);
});

await check("Grouping grams and kilograms", () => {
  const item = oneItem([
    source("grams", [ingredient(500, "g", "porc émincé")]),
    source("kilograms", [ingredient(1, "kg", "porc émincé")])
  ]);
  assert.ok(
    (item.exactUnit === "g" && Number(item.exactQuantity) === 1500) ||
      (item.exactUnit === "kg" && Number(item.exactQuantity) === 1.5),
    `${item.exactQuantity} ${item.exactUnit}`
  );
});

await check("Grouping millilitres and centilitres", () => {
  const item = oneItem([
    source("millilitres", [ingredient(500, "ml", "lait")]),
    source("centilitres", [ingredient(25, "cl", "lait")])
  ]);
  assert.ok(
    (item.exactUnit === "ml" && Number(item.exactQuantity) === 750) ||
      (item.exactUnit === "cl" && Number(item.exactQuantity) === 75),
    `${item.exactQuantity} ${item.exactUnit}`
  );
});

await check("Grouping compatible spoons", () => {
  const item = oneItem([
    source("spoon-tsp", [ingredient(1, "c. à café", "moutarde")]),
    source("spoon-tbsp", [ingredient(2, "c. à soupe", "moutarde")])
  ]);
  approx(item.exactQuantity, 35);
  assert.equal(item.exactUnit, "ml");
  assert.equal(item.purchaseQuantity, 1);
});

await check("Incompatible units never merge", () => {
  const draft = draftFor([
    source("weight", [ingredient(200, "g", "tofu")]),
    source("pieces", [ingredient(2, "tranches", "tofu")])
  ]);
  assert.equal(draft.length, 2);
  assert.equal(new Set(draft.map(itemSignature)).size, 2);
});

await check("Fresh and dried herbs never merge", () => {
  const draft = draftFor([
    source("herb-fresh", [ingredient(4, "feuilles", "basilic")]),
    source("herb-dried", [ingredient(1, "c. à café", "basilic séché")])
  ]);
  assert.equal(draft.length, 2);
  assert.deepEqual(new Set(draft.map(item => item.form)), new Set(["fresh", "dried"]));
  assert.equal(new Set(draft.map(item => item.productKey)).size, 2);
});

await check("Fresh and canned fish never merge", () => {
  const draft = draftFor([
    source("tuna-fresh", [ingredient(200, "g", "thon frais")]),
    source("tuna-can", [ingredient(1, "boîte", "thon")])
  ]);
  assert.equal(draft.length, 2);
  assert.deepEqual(new Set(draft.map(item => item.form)), new Set(["fresh", "canned"]));
  assert.equal(new Set(draft.map(item => item.productKey)).size, 2);
});

await check("availableItems satisfies only the same explicit ingredient form", () => {
  const draftWithAvailable = (neededName, availableItems, id) => {
    const neededSource = source(id, [ingredient(1, "", neededName)]);
    neededSource.availableItems = structuredClone(availableItems);
    const before = structuredClone(neededSource);
    const draft = draftFor([neededSource]);
    assert.deepEqual(neededSource, before, `${id}: source and availableItems stay immutable`);
    return draft;
  };

  const crossFormCases = [
    ["basilic frais", ["basilic séché"]],
    ["basilic séché", ["basilic frais"]],
    ["basilic frais", [{ key: "basilic" }]],
    ["basilic séché", [{ key: "basilic" }]],
    ["basilic frais", [{ key: "basilic", label: "basilic séché" }]],
    ["basilic séché", [{ key: "basilic", label: "basilic frais" }]],
    ["thon en boîte", ["thon frais"]],
    ["thon frais", ["thon en boîte"]],
    ["thon en boîte", [{ key: "thon" }]],
    ["thon frais", [{ key: "thon" }]],
    ["thon en boîte", [{ key: "thon", n: "thon frais" }]],
    ["thon frais", [{ key: "thon", name: "thon en boîte" }]]
  ];
  for (let index = 0; index < crossFormCases.length; index += 1) {
    const [neededName, availableItems] = crossFormCases[index];
    const draft = draftWithAvailable(neededName, availableItems, `available-cross-form-${index}`);
    assert.equal(draft.length, 1, `${neededName}: incompatible/generic availability must not remove explicit need`);
    assert.equal(draft[0].form, api.ingredientProfile({ n: neededName }).form, `${neededName}: required form`);
  }

  const sameFormCases = [
    ["basilic frais", ["basilic frais"]],
    ["basilic séché", [{ n: "basilic séché" }]],
    ["basilic séché", [{ key: "basilic", label: "basilic séché" }]],
    ["basilic frais", [{ key: "basilic", label: "basilic frais" }]],
    ["thon en boîte", [{ name: "thon en boîte" }]],
    ["thon frais", [{ label: "thon frais" }]],
    ["thon en boîte", [{ key: "thon", n: "thon en boîte" }]],
    ["thon frais", [{ key: "thon", name: "thon frais" }]]
  ];
  for (let index = 0; index < sameFormCases.length; index += 1) {
    const [neededName, availableItems] = sameFormCases[index];
    const draft = draftWithAvailable(neededName, availableItems, `available-same-form-${index}`);
    assert.equal(draft.length, 0, `${neededName}: identical explicit form must satisfy the need`);
  }
  return `${crossFormCases.length} cross/generic guards + ${sameFormCases.length} exact form matches`;
});

await check("Pasta pastry and pate homonyms stay distinct", () => {
  const draft = draftFor([
    source("homonym-pasta", [ingredient(250, "g", "pâtes")]),
    source("homonym-pastry", [ingredient(1, "", "pâte feuilletée")]),
    source("homonym-pate", [ingredient(200, "g", "pâté")])
  ]);
  assert.equal(draft.length, 3);
  assert.equal(new Set(draft.map(item => item.productKey)).size, 3);
  assert.deepEqual(new Set(draft.map(item => item.aisle)), new Set(["Épicerie", "Boulangerie", "Charcuterie"]));
});

await check("Two halves make one whole item", () => {
  const item = oneItem([
    source("half-a", [ingredient(0.5, "", "citron")]),
    source("half-b", [ingredient(0.5, "", "citron")])
  ]);
  approx(item.exactQuantity, 1);
  approx(item.purchaseQuantity, 1);
});

await check("Recipe servings scale once", () => {
  const item = oneItem([source("servings", [ingredient(100, "g", "porc émincé")], 2)], 4);
  approx(item.exactQuantity, 200);
  approx(item.purchaseQuantity, 200);
});

await check("Manual article override is explicit and isolated", () => {
  const original = oneItem([source("manual-text", [ingredient(2, "c. à soupe", "moutarde")])]);
  const edited = applyManualText(original, "2 pots de moutarde forte");
  assert.notStrictEqual(edited, original);
  assert.equal(original.purchaseQuantity, 1);
  assert.match(edited.purchaseLabel, /^2 pots? de moutarde forte$/i);
  approx(edited.purchaseQuantity, 2);
  assert.equal(edited.exactQuantity, original.exactQuantity);
  assert.equal(edited.exactUnit, original.exactUnit);
});

await check("Manual text edit recomputes purchase identity without losing recipe truth", () => {
  const original = oneItem([source("manual-reidentity", [ingredient(2, "c. à soupe", "moutarde")])]);
  const edited = applyManualText(original, "1 boîte de thon");
  assert.notStrictEqual(edited, original);
  assert.equal(original.canonicalName, "moutarde");
  assert.equal(edited.canonicalName, "thon");
  assert.equal(edited.displayName, "thon");
  assert.equal(edited.form, "canned");
  assert.equal(edited.computedAisle, "Conserves");
  assert.equal(edited.aisle, "Conserves");
  assert.equal(edited.aisleOverride, false);
  assert.equal(edited.productKey, api.productKeyFor("thon", "canned"));
  assert.notEqual(edited.productKey, original.productKey);
  for (const field of ["exactQuantity", "exactUnit", "exactLabel", "baseQuantity", "baseUnit"]) {
    assert.deepEqual(edited[field], original[field], `${field} must preserve recipe truth`);
  }
  assert.deepEqual(edited.sourceRecipeIds, original.sourceRecipeIds);
  assert.deepEqual(edited.contributions, original.contributions);

  const v2 = contractV2([edited]);
  assert.equal(v2.items.length, 1);
  assert.equal(v2.items[0].canonicalName, "thon");
  assert.equal(v2.items[0].form, "canned");
  assert.equal(v2.items[0].productKey, edited.productKey);
  assert.equal(v2.items[0].aisle, "Conserves");
  assert.equal(v2.items[0].exactQuantity, original.exactQuantity);
  assert.equal(v2.items[0].exactUnit, original.exactUnit);
  assert.deepEqual(v2.items[0].sourceRecipeIds, original.sourceRecipeIds);

  const v1 = contractV1([edited]);
  assert.equal(v1.items.length, 1);
  assert.equal(v1.items[0].displayName, "thon");
  assert.equal(v1.items[0].aisle, "Conserves");
  assert.equal(v1.items[0].productKey, api.legacyProductKeyFor("thon"));

  const withExplicitAisle = applyAisleOverride(original, "Maison");
  assert.equal(withExplicitAisle.aisleOverride, true);
  const editedWithExplicitAisle = applyManualText(withExplicitAisle, "1 boîte de thon");
  assert.equal(editedWithExplicitAisle.computedAisle, "Conserves");
  assert.equal(editedWithExplicitAisle.aisle, "Maison");
  assert.equal(editedWithExplicitAisle.aisleOverride, true);
  assert.equal(contractV2([editedWithExplicitAisle]).items[0].aisle, "Maison");
  assert.equal(contractV1([editedWithExplicitAisle]).items[0].aisle, "Maison");
});

await check("Manual text round-trip restores the original draft and contracts", () => {
  const original = oneItem([source("manual-round-trip", [ingredient(2, "c. à soupe", "moutarde")])]);
  const originalSnapshot = structuredClone(original);
  const edited = applyManualText(original, "1 boîte de thon");
  assert.equal(edited.canonicalName, "thon");
  assert.equal(edited.form, "canned");

  const reverted = applyManualText(edited, original.originalText);
  const draftFields = [
    "canonicalName", "displayName", "form", "kind", "productKey", "identity",
    "purchaseQuantity", "purchaseUnit", "purchaseLabel", "purchasePackage",
    "aisle", "computedAisle", "text", "q", "unit", "pantry", "selected"
  ];
  for (const field of draftFields) {
    assert.deepEqual(reverted[field], original[field], `${field} must return to the original draft`);
  }
  assert.deepEqual(reverted.item, original.item);
  assert.equal(reverted.originalText, original.originalText);
  assert.equal(Boolean(reverted.textOverride), false);
  assert.equal(Boolean(reverted.aisleOverride), false);
  for (const field of [
    "exactQuantity", "exactUnit", "exactLabel", "baseQuantity", "baseUnit",
    "sourceRecipeIds", "sourceCount", "contributions"
  ]) {
    assert.deepEqual(reverted[field], original[field], `${field} must preserve recipe truth`);
  }
  assert.deepEqual(contractV2([reverted]), contractV2([original]));
  assert.deepEqual(contractV1([reverted]), contractV1([original]));
  assert.deepEqual(original, originalSnapshot, "Round-trip must not mutate the original draft");

  const originalWithAisleOverride = applyAisleOverride(original, "Maison");
  const editedWithAisleOverride = applyManualText(originalWithAisleOverride, "1 boîte de thon");
  assert.equal(editedWithAisleOverride.computedAisle, "Conserves");
  assert.equal(editedWithAisleOverride.aisle, "Maison");
  const revertedWithAisleOverride = applyManualText(editedWithAisleOverride, original.originalText);
  for (const field of draftFields) {
    assert.deepEqual(
      revertedWithAisleOverride[field],
      originalWithAisleOverride[field],
      `${field} must return to the explicitly overridden original draft`
    );
  }
  assert.equal(revertedWithAisleOverride.computedAisle, "Épicerie");
  assert.equal(revertedWithAisleOverride.aisle, "Maison");
  assert.equal(revertedWithAisleOverride.aisleOverride, true);
  assert.equal(Boolean(revertedWithAisleOverride.textOverride), false);
  assert.deepEqual(revertedWithAisleOverride.sourceRecipeIds, original.sourceRecipeIds);
  assert.deepEqual(revertedWithAisleOverride.contributions, original.contributions);
  assert.deepEqual(contractV2([revertedWithAisleOverride]), contractV2([originalWithAisleOverride]));
  assert.deepEqual(contractV1([revertedWithAisleOverride]), contractV1([originalWithAisleOverride]));
});

await check("Empty manual text removes the derived article from V1 and V2", () => {
  const original = oneItem([source("manual-empty", [ingredient(2, "c. à soupe", "moutarde")])]);
  const emptied = applyManualText(original, "");
  assert.equal(emptied.text, "");
  assert.equal(api.selectedItemsV2([emptied]).length, 0);
  assert.equal(contractV2([emptied]).items.length, 0);
  assert.equal(contractV1([emptied]).items.length, 0);
  const copiedText = api.selectedItemsV2([emptied]).map(item => item.purchaseLabel).join("\n");
  assert.equal(copiedText, "");
  assert.notEqual(original.text, "");
});

await check("Edited-line irregular plurals round-trip through both contracts", () => {
  const original = oneItem([source("manual-plural-roundtrip", [ingredient(1, "pot", "moutarde")])]);
  const cases = [
    ["2 bocaux d’olives", "olives", "bocal"],
    ["2 rouleaux de pâte feuilletée", "pâte feuilletée", "rouleau"],
    ["2 petites boîtes de maïs", "maïs", "boîte"],
    ["2 têtes d’ail", "ail", "tête"],
    ["2 pavés de saumon", "saumon", "pavé"],
    ["2 bouquets de persil", "persil", "bouquet"]
  ];
  for (const [text, expectedName, expectedUnit] of cases) {
    const parsed = api.parseEditedLine(text);
    assert.equal(parsed.quantity, 2, `${text}: parsed quantity`);
    assert.equal(parsed.name, expectedName, `${text}: parsed name`);
    assert.equal(parsed.unit, expectedUnit, `${text}: parsed unit`);
    const edited = applyManualText(original, text);
    assert.equal(edited.purchaseQuantity, 2, `${text}: purchaseQuantity`);
    assert.equal(edited.purchaseUnit, expectedUnit, `${text}: purchaseUnit`);
    assert.equal(edited.purchaseLabel, text, `${text}: purchaseLabel`);
    assert.equal(contractV2([edited]).items[0].purchaseUnit, expectedUnit, `${text}: V2 unit`);
    assert.equal(contractV1([edited]).items[0].exactUnit, expectedUnit, `${text}: V1 unit`);
  }
  return `${cases.length} edited plural forms`;
});

await check("Qualified package units and irregular container nouns remain parseable", () => {
  const grammarCases = [
    ["petit bouquet", "petits bouquets", "fleurs", "2 petits bouquets de fleurs"],
    ["gros bouquet", "gros bouquets", "fleurs", "2 gros bouquets de fleurs"],
    ["botte", "bottes", "fleurs", "2 bottes de fleurs"],
    ["branche", "branches", "fleurs", "2 branches de fleurs"],
    ["brique", "briques", "boisson végétale", "2 briques de boisson végétale"],
    ["dose", "doses", "colorant", "2 doses de colorant"],
    ["goutte", "gouttes", "arôme", "2 gouttes d’arôme"]
  ];
  for (const [unit, pluralUnitText, name, expectedLabel] of grammarCases) {
    assert.equal(api.normalizeUnit(unit), unit, `${unit}: singular normalization`);
    assert.equal(api.normalizeUnit(pluralUnitText), unit, `${pluralUnitText}: plural normalization`);
    const parsed = api.parseEditedLine(expectedLabel);
    assert.equal(parsed.quantity, 2, `${expectedLabel}: quantity`);
    assert.equal(parsed.unit, unit, `${expectedLabel}: unit`);
    assert.equal(parsed.name, name, `${expectedLabel}: name`);
    const item = oneItem([source(`container-${api.fnv1a(unit)}`, [ingredient(2, unit, name)])]);
    assert.equal(item.exactLabel, expectedLabel, `${unit}: exactLabel`);
    assert.equal(item.purchaseLabel, expectedLabel, `${unit}: purchaseLabel`);
  }

  const qualifiedCases = [
    ["boîte de 400 g", 400, "2 boîtes de 400 g de thon"],
    ["boîtes de 100 g", 100, "2 boîtes de 100 g de thon"]
  ];
  for (const [unitText, capacityGrams, editedLine] of qualifiedCases) {
    const profile = api.ingredientProfile({ n: "thon", u: unitText });
    assert.equal(profile.form, "canned", `${unitText}: form`);
    assert.equal(profile.unit, "boîte", `${unitText}: normalized unit`);
    assert.equal(
      profile.packageCapacityGrams ?? profile.packageSizeGrams,
      capacityGrams,
      `${unitText}: exploitable capacity`
    );
    assert.equal(api.aisleFor(profile), "Conserves", `${unitText}: aisle`);
    const parsed = api.parseEditedLine(editedLine);
    assert.equal(parsed.quantity, 2, `${unitText}: parsed quantity`);
    assert.equal(parsed.unit, "boîte", `${unitText}: parsed unit`);
    assert.equal(parsed.packageCapacityGrams ?? parsed.packageSizeGrams, capacityGrams, `${unitText}: parsed capacity`);
    assert.equal(parsed.name, "thon", `${unitText}: parsed name`);
  }
  return `${grammarCases.length} container nouns + ${qualifiedCases.length} qualified boxes`;
});

await check("Unspecified generic quantities stay unspecified", () => {
  const genericNames = ["sel", "poivre", "produit mystère", "bœuf", "courgette"];
  for (const name of genericNames) {
    const item = oneItem([source(`unspecified-${api.fnv1a(name)}`, [ingredient(null, "", name)])]);
    assert.equal(item.exactQuantity, null, `${name}: exactQuantity`);
    assert.equal(item.purchaseQuantity, null, `${name}: purchaseQuantity`);
    assert.doesNotMatch(item.purchaseLabel, /^1(?:\s+unité)?\b/i, `${name}: artificial unit`);
    const v1 = buildContractV1([item], {
      createdAt: FIXED_CREATED_AT,
      sourceVersion: SOURCE_VERSION,
      includeUnselected: true
    });
    assert.equal(v1.items.length, 1, `${name}: V1 item`);
    assert.equal(v1.items[0].exactQuantity, null, `${name}: V1 exactQuantity`);
  }
  for (const [name, expectedUnit] of [["moutarde", "pot"], ["miel", "pot"], ["paprika", "pot"]]) {
    const item = oneItem([source(`unspecified-container-${name}`, [ingredient(null, "", name)])]);
    assert.equal(item.purchaseQuantity, 1, `${name}: explicit container quantity`);
    assert.equal(item.purchaseUnit, expectedUnit, `${name}: explicit container unit`);
  }
  return `${genericNames.length} generic cases + 3 explicit containers`;
});

await check("Manual selection controls both contracts", () => {
  const draft = draftFor([
    source("selected-mustard", [ingredient(2, "c. à soupe", "moutarde")]),
    source("selected-basil", [ingredient(4, "feuilles", "basilic")])
  ]);
  assert.equal(draft.length, 2);
  const deselected = api.applyOverrides(draft[0], { selected: false });
  const selected = api.applyOverrides(draft[1], { selected: true });
  assert.equal(contractV1([deselected, selected]).items.length, 1);
  assert.equal(contractV2([deselected, selected]).items.length, 1);
  assert.equal(contractV2([deselected, selected], FIXED_CREATED_AT).items[0].selected, true);
});

await check("Manual aisle override is authoritative and validated", () => {
  const original = oneItem([source("manual-aisle", [ingredient(1, "", "produit mystère")])]);
  const edited = applyAisleOverride(original, "Épicerie");
  assert.notStrictEqual(edited, original);
  assert.equal(edited.aisle, "Épicerie");
  assert.equal(original.aisle, "Divers");
  const invalid = applyAisleOverride(original, "Rayon inventé");
  assert.equal(invalid.aisle, "Divers");
  assert.notEqual(invalid.aisle, "Rayon inventé");
});

await check("Fingerprint is stable for identical content", () => {
  const draftA = draftFor([
    source("fingerprint-b", [ingredient(2, "c. à soupe", "moutarde")]),
    source("fingerprint-a", [ingredient(4, "feuilles", "basilic")])
  ]);
  const draftB = draftFor([
    source("fingerprint-a", [ingredient(4, "feuilles", "basilic")]),
    source("fingerprint-b", [ingredient(2, "c. à soupe", "moutarde")])
  ]);
  const first = contractV2(draftA, "2026-08-29T08:00:00.000Z");
  const second = contractV2(draftB, "2030-01-01T00:00:00.000Z");
  assert.equal(first.contentFingerprint, second.contentFingerprint);
  assert.match(first.contentFingerprint, /^fnv1a:[a-f0-9]{8}$/);
  const changed = contractV2(
    draftFor([
      source("fingerprint-a", [ingredient(5, "feuilles", "basilic")]),
      source("fingerprint-b", [ingredient(2, "c. à soupe", "moutarde")])
    ])
  );
  assert.notEqual(first.contentFingerprint, changed.contentFingerprint);
});

await check("Fingerprint ordering is binary and accent-stable", () => {
  const sources = [
    source("Éclair-à-l’ail", [ingredient(2, "", "échalotes")]),
    source("Zèbre-été", [ingredient(100, "g", "pâté")]),
    source("À-table", [ingredient(1, "c. à soupe", "moutarde à l’ancienne")])
  ];
  const first = contractV2(draftFor(sources), "2026-08-29T08:00:00.000Z");
  const reversed = contractV2(draftFor([...sources].reverse()), "2030-01-01T00:00:00.000Z");
  assert.equal(first.contentFingerprint, reversed.contentFingerprint);
  assert.deepEqual(
    [...first.items].map(item => item.productKey).sort(),
    [...reversed.items].map(item => item.productKey).sort()
  );

  const projectionSource = extractFunction(engineSource, "fingerprintProjection");
  assert.doesNotMatch(projectionSource, /localeCompare|Intl\./, "Fingerprint projection must not be locale-sensitive");
  assert.match(projectionSource, /\.sort\(/, "Fingerprint projection must sort unordered arrays");
  assert.ok(
    /(?:<|>)/.test(projectionSource) || /\.sort\(\s*(?:binary|compareBinary|binaryCompare)/i.test(projectionSource),
    "Fingerprint projection must use an explicit binary comparator"
  );
  return first.contentFingerprint;
});

await check("V1 representative fixture", () => {
  const actual = contractV1(
    draftFor([
      source("fixture-mustard", [ingredient(2, "c. à soupe", "moutarde")]),
      source("fixture-basil", [ingredient(4, "feuilles", "basilic")])
    ])
  );
  assert.deepEqual(actual, v1Fixture);
  for (const item of actual.items) {
    assert.match(item.productKey, /^clair-repas:[a-f0-9]{8}:/);
    assert.doesNotMatch(item.productKey, /^clair-repas:v2:/);
  }
  return actual.contentFingerprint;
});

const v2FixtureSources = Object.freeze({
  representative: [
    source("fixture-mustard", [ingredient(2, "c. à soupe", "moutarde")]),
    source("fixture-basil", [ingredient(4, "feuilles", "basilic")])
  ],
  mustard: [source("fixture-mustard", [ingredient(2, "c. à soupe", "moutarde")])],
  freshBasil: [source("fixture-basil-fresh", [ingredient(4, "feuilles", "basilic")])],
  driedBasil: [source("fixture-basil-dried", [ingredient(1, "c. à café", "basilic séché")])],
  knacks: [source("fixture-knacks", [ingredient(4, "", "knacks")])],
  cookedRice: [source("fixture-rice", [ingredient(180, "g", "riz cuit")])],
  salmon: [source("fixture-salmon", [ingredient(2, "", "pavés de saumon")])],
  cannedTuna: [source("fixture-tuna", [ingredient(1, "boîte", "thon")])]
});

for (const [name, sources] of Object.entries(v2FixtureSources)) {
  await check(`V2 reference fixture ${name}`, () => {
    assert.ok(v2Fixture.contracts?.[name], `Missing fixture ${name}`);
    const actual = contractV2(draftFor(sources));
    assert.deepEqual(actual, v2Fixture.contracts[name]);
    return actual.contentFingerprint;
  });
}

await check("Full real recipe corpus at 2 and 4 people", () => {
  const recipes = realRecipeLibrary;
  assert.equal(recipes.length, 1553, "Unexpected real recipe corpus size");

  let draftItemCount = 0;
  let contractCount = 0;
  let legacyDiversCount = 0;
  let engineDiversCount = 0;
  let legacyMatchedCount = 0;
  const legacyMatchedDivers = [];
  const assertFiniteOrNull = (value, label) => {
    if (value == null) return;
    assert.ok(Number.isFinite(Number(value)), `${label} must be finite, received ${value}`);
  };

  for (const recipeEntry of recipes) {
    const recipeId = String(recipeEntry?.id || "sans-identifiant");
    const before = JSON.stringify(recipeEntry);
    for (const ingredientEntry of recipeEntry.i || []) {
      const ingredientName = ingredientEntry?.n || ingredientEntry?.k || "";
      const legacyAisle = legacyShoppingAisle(ingredientName);
      const engineAisle = api.aisleFor(api.ingredientProfile(ingredientEntry));
      if (legacyAisle === "Divers") legacyDiversCount += 1;
      else {
        legacyMatchedCount += 1;
        if (engineAisle === "Divers") {
          legacyMatchedDivers.push({ recipeId, ingredientName, legacyAisle });
        }
      }
      if (engineAisle === "Divers") engineDiversCount += 1;
    }
    for (const peopleCount of [2, 4]) {
      let draft;
      let v1;
      let v2;
      try {
        draft = buildDraft([{ recipe: recipeEntry, availableItems: [] }], { peopleCount });
        v1 = buildContractV1(draft, { createdAt: FIXED_CREATED_AT, sourceVersion: SOURCE_VERSION });
        v2 = buildContractV2(draft, {
          createdAt: FIXED_CREATED_AT,
          sourceVersion: SOURCE_VERSION,
          rulesVersion: api.RULES_VERSION
        });
      } catch (error) {
        error.message = `${recipeId} @ ${peopleCount} people: ${error.message}`;
        throw error;
      }

      assert.ok(Array.isArray(draft), `${recipeId} @ ${peopleCount}: draft must be an array`);
      draftItemCount += draft.length;
      for (const [itemIndex, item] of draft.entries()) {
        const label = `${recipeId} @ ${peopleCount} item ${itemIndex}`;
        assert.equal(typeof item.selected, "boolean", `${label}: selected`);
        assert.match(item.productKey, /^clair-repas:v2:[a-f0-9]{8}:/, `${label}: productKey`);
        for (const field of [
          "canonicalName",
          "displayName",
          "form",
          "exactLabel",
          "purchaseLabel",
          "aisle"
        ]) {
          assert.equal(typeof item[field], "string", `${label}: ${field}`);
          assert.ok(item[field].trim(), `${label}: ${field} must not be empty`);
        }
        for (const field of ["originalText", "text", "exactLabel", "purchaseLabel"]) {
          assert.doesNotMatch(
            String(item[field] || ""),
            /\b(?:tranches? de tranches?|feuilles? de feuilles?|pavés? de pavés?|(?:pain(?: de campagne| d[’']épices)?|foie de veau) en tranches? de|en (?:tranches?|feuilles?|pavés?) de)\b/iu,
            `${label}: corrupted unit/order in ${field}`
          );
          assert.doesNotMatch(
            String(item[field] || ""),
            /\bd[’'](?:yaourts?|harissa)\b/iu,
            `${label}: invalid de/elision grammar in ${field}`
          );
        }
        if (Number(item.exactQuantity) === 1) {
          assert.doesNotMatch(
            item.exactLabel,
            /^1\s+(?:branches|pommes de terre|cuisses|tranches|feuilles|pavés|gousses)\b/iu,
            `${label}: targeted product must be singular after quantity one`
          );
        }
        assert.ok(api.AISLES.includes(item.aisle), `${label}: forbidden aisle ${item.aisle}`);
        assertFiniteOrNull(item.q, `${label}: q`);
        assertFiniteOrNull(item.exactQuantity, `${label}: exactQuantity`);
        assertFiniteOrNull(item.purchaseQuantity, `${label}: purchaseQuantity`);
        assert.ok(Array.isArray(item.sourceRecipeIds), `${label}: sourceRecipeIds`);
        assert.ok(item.sourceRecipeIds.includes(recipeId), `${label}: recipe provenance missing`);
      }

      for (const [contract, schemaVersion] of [[v1, 1], [v2, 2]]) {
        const label = `${recipeId} @ ${peopleCount} V${schemaVersion}`;
        assert.equal(contract.schemaVersion, schemaVersion, `${label}: schemaVersion`);
        assert.equal(contract.source, "Clair Repas", `${label}: source`);
        assert.equal(contract.sourceVersion, SOURCE_VERSION, `${label}: sourceVersion`);
        assert.equal(contract.createdAt, FIXED_CREATED_AT, `${label}: createdAt`);
        assert.match(contract.contentFingerprint, /^fnv1a:[a-f0-9]{8}$/, `${label}: fingerprint`);
        assert.ok(Array.isArray(contract.items), `${label}: items`);
        for (const [itemIndex, item] of contract.items.entries()) {
          const itemLabel = `${label} item ${itemIndex}`;
          assert.equal(item.selected, true, `${itemLabel}: selected`);
          assert.ok(api.AISLES.includes(item.aisle), `${itemLabel}: forbidden aisle ${item.aisle}`);
          assertFiniteOrNull(item.exactQuantity, `${itemLabel}: exactQuantity`);
          if (schemaVersion === 2) {
            assert.match(item.productKey, /^clair-repas:v2:[a-f0-9]{8}:/, `${itemLabel}: productKey`);
            assertFiniteOrNull(item.purchaseQuantity, `${itemLabel}: purchaseQuantity`);
            assert.ok(Array.isArray(item.sourceRecipeIds), `${itemLabel}: sourceRecipeIds`);
          } else {
            assert.match(item.productKey, /^clair-repas:[a-f0-9]{8}:/, `${itemLabel}: legacy productKey`);
            assert.doesNotMatch(item.productKey, /^clair-repas:v2:/, `${itemLabel}: V1 key must remain legacy`);
          }
        }
        contractCount += 1;
      }
    }
    assert.equal(JSON.stringify(recipeEntry), before, `${recipeId}: engine mutated the recipe`);
  }

  assert.equal(
    legacyMatchedDivers.length,
    0,
    `Active legacy aisle matches sent to Divers (${legacyMatchedDivers.length}): ${JSON.stringify(legacyMatchedDivers.slice(0, 40))}; Divers legacy ${legacyDiversCount}, engine ${engineDiversCount}`
  );

  return `${recipes.length} recipes × 2; ${draftItemCount} draft items; ${contractCount} contracts; Divers legacy ${legacyDiversCount}, engine ${engineDiversCount}; ${legacyMatchedCount} legacy matches guarded`;
});

await check("Engine purity and absence of external effects", () => {
  assert.doesNotMatch(engineSource, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.doesNotMatch(engineSource, /\b(?:localStorage|sessionStorage|indexedDB|caches)\b/);
  assert.doesNotMatch(engineSource, /supabase/i);
  assert.doesNotMatch(engineSource, /\b(?:document|navigator)\b/);

  let externalAccesses = 0;
  const throwing = new Proxy({}, {
    get() {
      externalAccesses += 1;
      throw new Error("external-effect-access");
    }
  });
  const sandbox = {
    console,
    structuredClone,
    fetch: throwing,
    XMLHttpRequest: throwing,
    localStorage: throwing,
    sessionStorage: throwing,
    document: throwing,
    navigator: throwing
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(engineSource, sandbox, { filename: "shopping-v2-engine.purity.js" });
  const isolated = sandbox.ClairShoppingV2;
  const isolatedDraft = isolated.buildDraft([
    source("pure", [ingredient(2, "c. à soupe", "moutarde")])
  ], { peopleCount: 2 });
  isolated.buildContractV2(isolatedDraft, { createdAt: FIXED_CREATED_AT, sourceVersion: "7.5" });
  assert.equal(externalAccesses, 0);
  return "0 storage/network accesses";
});

await check("Index activates V2 transport and keeps V1 compatibility", () => {
  assert.match(indexSource, /<script\b[^>]*src=["']\.\/shopping-v2-engine\.js["'][^>]*><\/script>/i);
  assert.match(indexSource, /\bClairShoppingV2\b/);
  assert.doesNotMatch(indexSource, /\bshoppingIngredientAvailable\b/);
  const draftSource = extractFunction(indexSource, "shoppingBuildDraft");
  assert.match(draftSource, /SHOPPING_ENGINE\.(?:buildDraft|buildModel)\(/);
  assert.match(draftSource, /\.\.\.source\b/);
  assert.doesNotMatch(draftSource, /availableItems\s*:\s*\[\s*\]/);

  const forwardedAvailableItems = Object.freeze([
    Object.freeze({ key: "basilic", label: "basilic séché" })
  ]);
  let forwardedSources;
  let forwardedOptions;
  const draftSandbox = {
    context: {
      sources: [{
        recipe: { id: "integration-available-items", n: "Integration", i: [] },
        availableItems: forwardedAvailableItems
      }]
    },
    SHOPPING_ENGINE: {
      buildDraft(sources, options) {
        forwardedSources = sources;
        forwardedOptions = options;
        return [];
      }
    },
    recipeHasFixedYield() {
      return false;
    },
    peopleCount() {
      return 4;
    }
  };
  vm.runInNewContext(`${draftSource}; shoppingBuildDraft(context);`, draftSandbox, {
    filename: "shopping-build-draft.integration.js"
  });
  assert.strictEqual(forwardedSources[0].availableItems, forwardedAvailableItems);
  assert.equal(forwardedOptions.peopleCount, 4);

  const sendSource = extractFunction(indexSource, "shoppingSendSelected");
  const v1Source = extractFunction(indexSource, "shoppingContractV1");
  const v2Source = extractFunction(indexSource, "shoppingContractV2");
  const futureContractSource = extractFunction(indexSource, "shoppingContract");
  assert.match(sendSource, /const contract=shoppingContractV2\(\);/);
  assert.doesNotMatch(sendSource, /\bshoppingContractV1\(\)/);
  assert.doesNotMatch(sendSource, /\bshoppingContract\(\)/);
  assert.doesNotMatch(sendSource, /\.(?:map|filter|reduce)\(|\b(?:buildDraft|selectedItemsV2)\b/);
  assert.match(v1Source, /SHOPPING_ENGINE\.(?:buildContractV1|contractV1)\(/);
  assert.doesNotMatch(v1Source, /(?:buildContractV2|contractV2|shoppingContractV2)/);
  assert.match(v2Source, /SHOPPING_ENGINE\.(?:buildContractV2|contractV2)\(/);
  assert.match(futureContractSource, /shoppingContractV2\(\)/);
  assert.equal(typeof api.buildContractV2, "function");
  assert.match(indexSource, /#mcjson=\$\{encodeURIComponent\(JSON\.stringify\(contract\)\)\}/);

  const transportMarker = "  if(!contract.items.length)";
  const transportStart = sendSource.indexOf(transportMarker);
  assert.notEqual(transportStart, -1, "Active transport boundary missing");
  const transportSuffix = sendSource.slice(transportStart).replace(/\r\n/g, "\n");
  assert.equal(
    sha256(transportSuffix),
    EXPECTED_QR3_TRANSPORT_SUFFIX_SHA256,
    "QR3 may change the active payload builder, not the transport"
  );

  const activeDraft = draftFor([
    source("active-mustard", [ingredient(2, "c. à soupe", "moutarde")]),
    source("active-basil", [ingredient(4, "feuilles", "basilic")])
  ]);
  let builtContract;
  let v2BuildCalls = 0;
  let openedUrl = "";
  let openedTarget = "";
  const openedWindow = { opener: {} };
  const senderSandbox = {
    SHOPPING_ENGINE: {
      buildContractV2(input, options) {
        v2BuildCalls += 1;
        builtContract = buildContractV2(input, { ...options, createdAt: FIXED_CREATED_AT });
        return builtContract;
      }
    },
    shoppingDraft: activeDraft,
    shoppingSyncDraftFromScreen() {},
    CR_APP_VERSION: SOURCE_VERSION,
    location: { href: "https://repas.example/app#local-state" },
    CLAIR_COURSES_IMPORT_URL: "https://courses.example/import.html",
    window: {
      open(url, target) {
        openedUrl = url;
        openedTarget = target;
        return openedWindow;
      }
    },
    shoppingSetStatus() {},
    encodeURIComponent,
    JSON
  };
  vm.runInNewContext(
    `${v2Source}; ${sendSource}; shoppingSendSelected();`,
    senderSandbox,
    { filename: "shopping-v2-active-transfer.integration.js" }
  );

  assert.equal(v2BuildCalls, 1, "Active sender must build the V2 contract exactly once");
  assert.equal(openedTarget, "_blank");
  assert.equal(openedWindow.opener, null);
  const opened = new URL(openedUrl);
  assert.equal(opened.searchParams.get("source"), "clair-repas");
  assert.equal(opened.searchParams.get("return"), "https://repas.example/app");
  assert.ok(opened.hash.startsWith("#mcjson="));
  const sentContract = JSON.parse(decodeURIComponent(opened.hash.slice("#mcjson=".length)));
  assert.equal(JSON.stringify(sentContract), JSON.stringify(builtContract));
  assert.deepEqual(Object.keys(sentContract), [
    "schemaVersion",
    "source",
    "sourceVersion",
    "rulesVersion",
    "createdAt",
    "contentFingerprint",
    "items"
  ]);
  assert.equal(sentContract.schemaVersion, 2);
  assert.equal(sentContract.source, "Clair Repas");
  assert.equal(sentContract.sourceVersion, "7.5");
  assert.equal(sentContract.rulesVersion, api.RULES_VERSION);
  assert.equal(sentContract.createdAt, FIXED_CREATED_AT);
  assert.match(sentContract.contentFingerprint, /^fnv1a:[a-f0-9]{8}$/);
  assert.equal(
    sentContract.contentFingerprint,
    api.fingerprintForContent({
      schemaVersion: sentContract.schemaVersion,
      source: sentContract.source,
      sourceVersion: sentContract.sourceVersion,
      rulesVersion: sentContract.rulesVersion,
      items: sentContract.items
    })
  );
  assert.deepEqual(Object.keys(sentContract.items[0]), [
    "selected",
    "productKey",
    "canonicalName",
    "displayName",
    "form",
    "exactQuantity",
    "exactUnit",
    "exactLabel",
    "purchaseQuantity",
    "purchaseUnit",
    "purchaseLabel",
    "aisle",
    "sourceRecipeIds"
  ]);
  assert.ok(sentContract.items.every(item => Object.hasOwn(item, "exactQuantity")));
  return `active schema V${sentContract.schemaVersion} #mcjson + immutable transport ${EXPECTED_QR3_TRANSPORT_SUFFIX_SHA256}`;
});

await check("Index changes stay inside the QR1 boundary", () => {
  const actual = sha256(sanitizeQr1Index(indexSource));
  assert.equal(actual, EXPECTED_SANITIZED_INDEX_SHA256);
  return `sanitized SHA-256 ${actual}`;
});

await check("Recipes UI favorites menus sync and Foundation stay unchanged", () => {
  for (const [relativePath, expected] of Object.entries(EXPECTED_PROTECTED_SHA256)) {
    const actual = sha256(readFileSync(resolve(ROOT, ...relativePath.split("/"))));
    assert.equal(actual, expected, `${relativePath} differs from origin/main`);
  }
  return `${Object.keys(EXPECTED_PROTECTED_SHA256).length} protected files + sanitized index`;
});

await check("Foundation and cloud invariants", () => {
  assert.equal(version.foundationVersion, "8.0.0-foundation.15");
  assert.equal(version.productVersion, "7.5");
  assert.equal(version.cloudEnabled, true);
  assert.equal(version.bootstrapGeneration, "bootstrap-v2");
  assert.equal(version.channel, "production-sync-enabled");
  assert.equal(version.dataSchema, 2);
  return "Foundation.15 / V7.5 unchanged";
});

if (failures.length) {
  console.error(`Shopping V2 validation failed (${successes.length}/${successes.length + failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Shopping V2 validation passed (${successes.length}/${successes.length})`);
  for (const success of successes) console.log(`- ${success}`);
}
