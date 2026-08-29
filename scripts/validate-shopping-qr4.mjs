#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = resolve(ROOT, "index.html");
const LEGACY_INDEX_PATH = resolve(ROOT, "index-old.html");
const ENGINE_PATH = resolve(ROOT, "shopping-v2-engine.js");
const require = createRequire(import.meta.url);
const api = require(ENGINE_PATH);
const indexSource = readFileSync(INDEX_PATH, "utf8");
const legacyIndexSource = readFileSync(LEGACY_INDEX_PATH, "utf8");

function extractRealRecipeLibrary() {
  const inlineScripts = [...indexSource.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes, body]) => !/\bsrc\s*=/.test(attributes) && body.trim())
    .map(([, , body]) => body);
  assert.ok(inlineScripts.length > 0, "No inline application script found");
  const applicationSource = inlineScripts[0];
  const end = applicationSource.indexOf("$('libraryCount').textContent=");
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
    { filename: "index.html:shopping-qr4-recipe-corpus", timeout: 10000 }
  );
  assert.ok(Array.isArray(sandbox.__recipeLibrary), "Recipe corpus extraction failed");
  assert.equal(sandbox.__recipeLibrary.length, 1553, "Unexpected real recipe corpus size");
  return sandbox.__recipeLibrary;
}

const recipeLibrary = extractRealRecipeLibrary();

function ingredient(quantity, unit, name, key = name) {
  return { q: quantity, u: unit, n: name, k: key };
}

function syntheticSource(id, ingredients) {
  return { recipe: { id, n: id, servings: 2, i: ingredients }, availableItems: [] };
}

function realIngredient(recipeId, name) {
  const recipe = recipeLibrary.find(entry => entry.id === recipeId);
  assert.ok(recipe, `Missing real recipe ${recipeId}`);
  const item = (recipe.i || []).find(entry => entry.n === name);
  assert.ok(item, `Missing ${name} in ${recipeId}`);
  return { recipe, item };
}

function realIngredientSource(recipeId, name) {
  const { recipe, item } = realIngredient(recipeId, name);
  return {
    recipe: {
      id: recipe.id,
      n: recipe.n,
      servings: recipe.servings || 2,
      i: [structuredClone(item)]
    },
    availableItems: []
  };
}

function realRecipeSource(recipeId) {
  const recipe = recipeLibrary.find(entry => entry.id === recipeId);
  assert.ok(recipe, `Missing real recipe ${recipeId}`);
  return { recipe: structuredClone(recipe), availableItems: [] };
}

function draftFor(source) {
  return api.buildDraft([source], { peopleCount: 2 });
}

function oneItem(source) {
  const draft = draftFor(source);
  assert.equal(draft.length, 1, `Expected one item, received ${draft.length}`);
  return draft[0];
}

function rawText(item) {
  const quantity = Number(item.q) === 0.5 ? "½" : item.q == null ? "" : String(item.q).replace(".", ",");
  return [quantity, item.u, item.n]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function traceCase(sourceRecipeId, item) {
  const output = draftFor(syntheticSource(sourceRecipeId, [structuredClone(item)]));
  return {
    sourceRecipeId,
    rawText: rawText(item),
    rawQuantity: item.q,
    rawUnit: item.u,
    rawName: item.n,
    rawKey: item.k,
    outputs: output.map(entry => ({
      canonicalName: entry.canonicalName,
      displayName: entry.displayName,
      form: entry.form,
      kind: entry.kind,
      dimension: entry.dimension,
      exactQuantity: entry.exactQuantity,
      exactUnit: entry.exactUnit,
      exactLabel: entry.exactLabel,
      purchaseQuantity: entry.purchaseQuantity,
      purchaseUnit: entry.purchaseUnit,
      purchaseLabel: entry.purchaseLabel,
      computedAisle: entry.computedAisle,
      aisle: entry.aisle,
      aisleOverride: entry.aisleOverride === true,
      productKey: entry.productKey
    }))
  };
}

const saladRecipeId = "ge-pois-chiches-salade-pates-crudites";
const asianRecipeId = "ge-dinde-nouilles-legumes";
const tracedIngredients = [
  [saladRecipeId, realIngredient(saladRecipeId, "pois chiches").item],
  [saladRecipeId, realIngredient(saladRecipeId, "concombre").item],
  [saladRecipeId, realIngredient(saladRecipeId, "basilic et vinaigrette").item],
  [saladRecipeId, realIngredient(saladRecipeId, "menthe").item],
  [asianRecipeId, realIngredient(asianRecipeId, "sauce soja").item],
  [asianRecipeId, realIngredient(asianRecipeId, "graines de sésame").item]
];

function legacyFormatQuantity(value) {
  if (value == null) return "";
  const rounded = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(rounded)) return "";
  if (Math.abs(rounded - 0.5) < 0.025) return "½";
  if (Math.abs(rounded - Math.round(rounded)) < 0.01) return String(Math.round(rounded));
  return String(rounded).replace(".", ",");
}

function legacyIngredientText(item, quantity) {
  if (quantity == null) return item.n;
  return [legacyFormatQuantity(quantity), item.u, item.n].filter(Boolean).join(" ");
}

function extractLegacyShoppingRuntime() {
  const start = legacyIndexSource.indexOf("function shoppingExactIdentity(");
  const end = legacyIndexSource.indexOf("function shoppingContextText()", start);
  assert.ok(start >= 0 && end > start, "Missing complete legacy Shopping runtime boundary");
  const sandbox = {
    SHOPPING_AISLES: [
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
    ],
    SHOPPING_COMMON_PATTERN: /^(?:sel|poivre|sel et poivre|huile|huile neutre|huile d olive|eau)$/,
    normalizeSearchText: api.normalizeSearchText,
    assistantIngredientKey: api.normalizeSearchText,
    recipeHasFixedYield: () => false,
    peopleCount: () => 2,
    formatQty: legacyFormatQuantity,
    ingredientText: legacyIngredientText
  };
  vm.runInNewContext(
    legacyIndexSource.slice(start, end) +
      "\n;globalThis.__legacyShopping={" +
      "buildDraft:shoppingBuildDraft," +
      "aisle:shoppingAisle," +
      "productKey:shoppingProductKey," +
      "identity:shoppingExactIdentity};",
    sandbox,
    { filename: "index-old.html:pre-qr1-shopping-runtime", timeout: 1000 }
  );
  return sandbox.__legacyShopping;
}

const legacyRuntime = extractLegacyShoppingRuntime();

function legacyTraceCase(sourceRecipeId, item) {
  const draft = legacyRuntime.buildDraft({
    sources: [syntheticSource(sourceRecipeId, [structuredClone(item)])]
  });
  assert.equal(draft.length, 1, `${sourceRecipeId}/${item.n}: legacy runtime must emit one item`);
  const entry = draft[0];
  return {
    sourceRecipeId,
    rawText: rawText(item),
    rawQuantity: item.q,
    rawUnit: item.u,
    rawName: item.n,
    rawKey: item.k,
    canonicalName: entry.identity,
    displayName: entry.item.n,
    form: null,
    kind: null,
    dimension: null,
    exactQuantity: entry.q,
    exactUnit: entry.unit,
    exactLabel: entry.text,
    purchaseQuantity: entry.q,
    purchaseUnit: entry.unit,
    purchaseLabel: entry.text,
    computedAisle: legacyRuntime.aisle(entry.item.n),
    aisle: entry.aisle,
    aisleOverride: false,
    productKey: legacyRuntime.productKey(entry.item.n)
  };
}

const legacyTraces = tracedIngredients.map(([recipeId, item]) => legacyTraceCase(recipeId, item));
assert.deepEqual(
  legacyTraces.map(trace => [trace.purchaseLabel, trace.aisle]),
  [
    ["1 boîte pois chiches", "Épicerie"],
    ["½ concombre", "Fruits et légumes"],
    ["basilic et vinaigrette", "Fruits et légumes"],
    ["menthe", "Fruits et légumes"],
    ["1 bouteille de sauce soja", "Divers"],
    ["graines de sésame", "Divers"]
  ],
  "The extracted pre-QR1 runtime must reproduce the six observed user outputs"
);

const legacyAisleStart = legacyIndexSource.indexOf("function shoppingAisle(");
const legacyAisleEnd = legacyIndexSource.indexOf("function shoppingFNV(", legacyAisleStart);
const legacyPackageStart = legacyIndexSource.indexOf("function shoppingPurchasePackage(");
const legacyPackageEnd = legacyIndexSource.indexOf("function shoppingBuildDraft(", legacyPackageStart);
assert.ok(legacyAisleStart >= 0 && legacyAisleEnd > legacyAisleStart, "Missing legacy aisle boundary");
assert.ok(legacyPackageStart >= 0 && legacyPackageEnd > legacyPackageStart, "Missing legacy package boundary");
const legacyAisleSource = legacyIndexSource.slice(legacyAisleStart, legacyAisleEnd);
const legacyPackageSource = legacyIndexSource.slice(legacyPackageStart, legacyPackageEnd);
assert.match(legacyAisleSource, /^function shoppingAisle\(name\)/);
assert.doesNotMatch(legacyAisleSource, /sauce soja|sesame/);
assert.doesNotMatch(legacyPackageSource, /menthe|graines? de sesame/);
assert.match(indexSource, /SHOPPING_ENGINE\.buildDraft\(/);

console.log("QR4 diagnostic BEFORE: extracted pre-QR1 runtime reproduces the six observed user outputs.");
console.log(JSON.stringify(legacyTraces, null, 2));
console.log("QR4 diagnostic AFTER: fresh Shopping V2 trace for the same six raw ingredients.");
console.log(JSON.stringify(tracedIngredients.map(([recipeId, item]) => traceCase(recipeId, item)), null, 2));

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

await check("1. Canned chickpeas use Conserves", () => {
  const item = oneItem(realIngredientSource(saladRecipeId, "pois chiches"));
  assert.equal(item.form, "canned");
  assert.equal(item.exactQuantity, 1);
  assert.equal(item.exactUnit, "boîte");
  assert.equal(item.purchaseUnit, "boîte");
  assert.equal(item.aisle, "Conserves");
  return item.purchaseLabel;
});

await check("2. Dry chickpeas remain dried grocery", () => {
  const item = oneItem(syntheticSource("qr4-dry-chickpeas", [ingredient(200, "g", "pois chiches secs")]));
  assert.equal(item.form, "dried");
  assert.equal(item.exactQuantity, 200);
  assert.equal(item.exactUnit, "g");
  assert.equal(item.aisle, "Épicerie");
  return item.exactLabel;
});

await check("3. Half cucumber preserves exact and rounds purchase", () => {
  const item = oneItem(realIngredientSource(saladRecipeId, "concombre"));
  assert.equal(item.exactQuantity, 0.5);
  assert.equal(item.exactLabel, "½ concombre");
  assert.equal(item.purchaseQuantity, 1);
  assert.equal(item.purchaseLabel, "1 concombre");
  assert.equal(item.aisle, "Fruits et légumes");
  return `${item.exactLabel} => ${item.purchaseLabel}`;
});

await check("4. Half lemon preserves exact and rounds purchase", () => {
  const item = oneItem(syntheticSource("qr4-half-lemon", [ingredient(0.5, "", "citron", "citrons")]));
  assert.equal(item.exactQuantity, 0.5);
  assert.equal(item.exactLabel, "½ citron");
  assert.equal(item.purchaseQuantity, 1);
  assert.equal(item.purchaseLabel, "1 citron");
  assert.equal(item.aisle, "Fruits et légumes");
  return `${item.exactLabel} => ${item.purchaseLabel}`;
});

await check("5. Soy sauce uses a bottle in grocery", () => {
  const item = oneItem(realIngredientSource(asianRecipeId, "sauce soja"));
  assert.equal(item.purchaseQuantity, 1);
  assert.equal(item.purchaseUnit, "bouteille");
  assert.equal(item.purchaseLabel, "1 bouteille de sauce soja");
  assert.equal(item.aisle, "Épicerie");
  return item.purchaseLabel;
});

await check("6. Sesame seeds use a sachet in grocery", () => {
  const item = oneItem(realIngredientSource(asianRecipeId, "graines de sésame"));
  assert.equal(item.purchaseQuantity, 1);
  assert.equal(item.purchaseUnit, "sachet");
  assert.match(item.purchaseLabel, /^1 sachet de sésame$/u);
  assert.equal(item.aisle, "Épicerie");
  return item.purchaseLabel;
});

await check("7. Fresh mint uses a bouquet in produce", () => {
  const item = oneItem(realIngredientSource(saladRecipeId, "menthe"));
  const parsley = oneItem(syntheticSource("qr4-fresh-parsley", [ingredient(null, "", "persil")]));
  assert.equal(item.form, "fresh");
  assert.equal(item.purchaseQuantity, 1);
  assert.equal(item.purchaseUnit, "bouquet");
  assert.equal(item.aisle, "Fruits et légumes");
  assert.equal(parsley.form, "fresh");
  assert.equal(parsley.purchaseQuantity, 1);
  assert.equal(parsley.purchaseUnit, "bouquet");
  assert.equal(parsley.aisle, "Fruits et légumes");
  return `${item.purchaseLabel}; ${parsley.purchaseLabel}`;
});

await check("8. Fresh basil uses its existing produce package", () => {
  const item = oneItem(syntheticSource("qr4-fresh-basil", [ingredient(null, "", "basilic")]));
  assert.equal(item.form, "fresh");
  assert.equal(item.purchaseQuantity, 1);
  assert.equal(item.purchaseUnit, "pot");
  assert.equal(item.aisle, "Fruits et légumes");
  return item.purchaseLabel;
});

await check("9. Dried basil remains a grocery pot", () => {
  const item = oneItem(syntheticSource("qr4-dried-basil", [ingredient(1, "c. à café", "basilic séché")]));
  assert.equal(item.form, "dried");
  assert.equal(item.purchaseQuantity, 1);
  assert.equal(item.purchaseUnit, "pot");
  assert.equal(item.aisle, "Épicerie");
  return item.purchaseLabel;
});

await check("10. Real basil and vinaigrette compound is safely separated", () => {
  const draft = api.buildDraft(
    [realRecipeSource(saladRecipeId), realRecipeSource(asianRecipeId)],
    { peopleCount: 2 }
  );
  const reversedDraft = api.buildDraft(
    [realRecipeSource(asianRecipeId), realRecipeSource(saladRecipeId)],
    { peopleCount: 2 }
  );
  assert.equal(
    draft.some(item => item.canonicalName === "basilic et vinaigrette"),
    false,
    "The source compound must not survive in the real two-recipe draft"
  );
  const basil = draft.find(item => item.canonicalName === "basilic");
  const dressing = draft.find(item => item.canonicalName === "vinaigrette");
  assert.ok(basil, "Missing basil item");
  assert.ok(dressing, "Missing vinaigrette item");
  assert.equal(basil.purchaseUnit, "pot");
  assert.equal(basil.aisle, "Fruits et légumes");
  assert.equal(dressing.purchaseUnit, "bouteille");
  assert.equal(dressing.aisle, "Épicerie");
  assert.deepEqual(basil.sourceRecipeIds, [saladRecipeId]);
  assert.deepEqual(dressing.sourceRecipeIds, [saladRecipeId]);

  const contractOptions = {
    createdAt: "2026-08-29T08:00:00.000Z",
    sourceVersion: "7.5",
    rulesVersion: api.RULES_VERSION
  };
  const v2 = api.buildContractV2(draft, contractOptions);
  const reversedV2 = api.buildContractV2(reversedDraft, contractOptions);
  const v1 = api.buildContractV1(draft, contractOptions);
  const reversedV1 = api.buildContractV1(reversedDraft, contractOptions);
  assert.deepEqual(v2, reversedV2, "V2 contract and fingerprint must be source-order stable");
  assert.deepEqual(v1, reversedV1, "V1 compatibility contract must remain source-order stable");
  assert.match(v2.contentFingerprint, /^fnv1a:[a-f0-9]{8}$/);
  assert.equal(v1.schemaVersion, 1);
  const expectedV2Fields = [
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
  ];
  for (const name of ["basilic", "vinaigrette"]) {
    const contractItem = v2.items.find(item => item.canonicalName === name);
    assert.ok(contractItem, `Missing ${name} in V2 contract`);
    assert.deepEqual(Object.keys(contractItem), expectedV2Fields, `${name}: 13-field V2 surface`);
  }

  const compound = structuredClone(realIngredient(saladRecipeId, "basilic et vinaigrette").item);
  const availableWhole = syntheticSource("qr4-compound-available-whole", [structuredClone(compound)]);
  availableWhole.availableItems = [{ n: "basilic et vinaigrette" }];
  assert.equal(draftFor(availableWhole).length, 0, "The exact available compound must satisfy both parts");
  const availableBasil = syntheticSource("qr4-compound-available-basil", [structuredClone(compound)]);
  availableBasil.availableItems = [{ n: "basilic" }];
  const missingDressing = draftFor(availableBasil);
  assert.equal(missingDressing.length, 1);
  assert.equal(missingDressing[0].canonicalName, "vinaigrette");

  const plainDressing = oneItem(syntheticSource("qr4-plain-dressing", [ingredient(null, "", "vinaigrette")]));
  const qualifiedDressing = oneItem(
    syntheticSource("qr4-qualified-dressing", [ingredient(null, "", "vinaigrette moutardée")])
  );
  assert.equal(qualifiedDressing.canonicalName, "vinaigrette moutardée");
  assert.equal(qualifiedDressing.purchaseUnit, "bouteille");
  assert.notEqual(qualifiedDressing.productKey, plainDressing.productKey);
  return `${basil.purchaseLabel} + ${dressing.purchaseLabel} in the real two-recipe draft`;
});

await check("11. Sel et poivre is never split", () => {
  for (const name of [
    "sel et poivre",
    "huile et beurre",
    "fruits et légumes",
    "huile et herbes",
    "beurre ou huile"
  ]) {
    const draft = draftFor(syntheticSource(`qr4-unsplit-${api.fnv1a(name)}`, [ingredient(null, "", name)]));
    assert.equal(draft.length, 1, `${name} must remain one item`);
  }

  const compoundPattern = /(?:\s+(?:et|ou)\s+|\s*[+/]\s*|,\s*)/u;
  const safeSplitPattern = /^(?:(?:basilic|persil|coriandre|ciboulette|menthe|aneth|estragon|cerfeuil|sauge|romarin|olives?) et vinaigrette|vinaigrette et (?:basilic|persil|coriandre|ciboulette|menthe|aneth|estragon|cerfeuil|sauge|romarin|olives?))$/u;
  let compoundCount = 0;
  let splitCount = 0;
  for (const recipe of recipeLibrary) {
    for (const [itemIndex, item] of (recipe.i || []).entries()) {
      const rawName = String(item.n || item.k || "").normalize("NFC").toLocaleLowerCase("fr-FR");
      if (!compoundPattern.test(rawName)) continue;
      compoundCount += 1;
      const draft = draftFor(syntheticSource(`qr4-compound-${recipe.id}-${itemIndex}`, [structuredClone(item)]));
      if (draft.length === 1) continue;
      splitCount += 1;
      assert.equal(draft.length, 2, `${item.n}: only two semantic parts are allowed`);
      assert.match(api.normalizeSearchText(item.n || item.k), safeSplitPattern, `${item.n}: unsafe split`);
    }
  }
  assert.equal(compoundCount, 468, "Unexpected compoundSource corpus count");
  assert.equal(splitCount, 19, "Only the audited vinaigrette compounds may split");
  return `${compoundCount} compound occurrences; ${splitCount} safe splits; 0 unexpected`;
});

await check("12. Automatic legacy Divers cannot beat a certain V2 aisle", () => {
  const current = oneItem(realIngredientSource(asianRecipeId, "sauce soja"));
  const legacyAutomatic = {
    ...current,
    aisle: "Divers",
    computedAisle: "Divers",
    aisleOverride: false,
    rulesVersion: "legacy-automatic"
  };
  const normalized = api.applyOverrides(legacyAutomatic, {});
  assert.equal(normalized.computedAisle, "Épicerie");
  assert.equal(normalized.aisle, "Épicerie");
  assert.equal(normalized.aisleOverride, false);

  const legacyWithoutFlag = { ...legacyAutomatic };
  delete legacyWithoutFlag.aisleOverride;
  delete legacyWithoutFlag.computedAisle;
  const normalizedWithoutFlag = api.applyOverrides(legacyWithoutFlag, {});
  assert.equal(normalizedWithoutFlag.aisle, "Épicerie");
  assert.equal(normalizedWithoutFlag.aisleOverride, false);

  const explicit = api.applyAisleOverride(current, "Divers");
  const preserved = api.applyOverrides(explicit, {});
  assert.equal(preserved.aisle, "Divers", "An explicit user aisle must remain untouched");
  assert.equal(preserved.aisleOverride, true);
  return "automatic neutralized; explicit preserved";
});

for (const success of successes) console.log(`PASS ${success}`);
for (const failure of failures) console.error(`FAIL ${failure}`);

if (failures.length) {
  console.error(`QR4 ${successes.length}/12 PASS; ${failures.length}/12 FAIL`);
  process.exitCode = 1;
} else {
  console.log("QR4 12/12 PASS");
}
