#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildPublicRecipeCatalog,
  CATALOG_APP_ID,
  CATALOG_CONTRACT_VERSION,
  extractRecipeCatalogRows,
  serializePublicRecipeCatalog
} from "./generate-public-recipe-catalog.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = resolve(ROOT, "index.html");
const CATALOG_PATH = resolve(ROOT, "clair-repas-catalog.v1.json");
const LIBRARY_DECLARATION =
  "const recipeLibrary=[...dishLibrary,...starters,...desserts,...standaloneLibrary];";
const PERSONAL_DATA_MARKERS = [
  "crFavMeals",
  "crRecentRecipesV25",
  "crRecipeReactionsV3",
  "crRecipeLearningV3",
  "crRecipeNotesV31",
  "crPeople",
  "crDays",
  "crStateV13",
  "crHistoryV13",
  "supabaseUrl",
  "supabaseKey"
];

function injectAfterLibraryDeclaration(source, statement) {
  const first = source.indexOf(LIBRARY_DECLARATION);
  assert.ok(first >= 0, "Missing recipeLibrary declaration in production source");
  assert.equal(
    source.indexOf(LIBRARY_DECLARATION, first + LIBRARY_DECLARATION.length),
    -1,
    "Ambiguous recipeLibrary declaration"
  );
  return source.replace(
    LIBRARY_DECLARATION,
    LIBRARY_DECLARATION + "\n" + statement
  );
}

const indexHtml = await readFile(INDEX_PATH, "utf8");
const catalogText = await readFile(CATALOG_PATH, "utf8");
const catalog = JSON.parse(catalogText);
const rows = extractRecipeCatalogRows(indexHtml, INDEX_PATH);
const expected = buildPublicRecipeCatalog(indexHtml, INDEX_PATH);

assert.deepEqual(Object.keys(catalog), [
  "appId",
  "contractVersion",
  "catalogVersion",
  "recipes"
]);
assert.equal(catalog.appId, CATALOG_APP_ID);
assert.equal(catalog.contractVersion, CATALOG_CONTRACT_VERSION);
assert.match(catalog.catalogVersion, /^sha256:[0-9a-f]{64}$/);
assert.ok(
  catalog.recipes &&
    typeof catalog.recipes === "object" &&
    !Array.isArray(catalog.recipes),
  "recipes must be an object"
);
assert.equal(Object.keys(catalog.recipes).length, rows.length);
assert.deepEqual(catalog, expected);
assert.equal(catalogText, serializePublicRecipeCatalog(expected));
assert.deepEqual(
  Object.keys(catalog.recipes),
  rows.map(({ id }) => id),
  "Recipe ids must be sorted deterministically"
);
for (const { id, name } of rows) {
  assert.equal(catalog.recipes[id], name, "Name mismatch for " + id);
  assert.ok(name.trim(), "Empty public name for " + id);
}
for (const marker of PERSONAL_DATA_MARKERS) {
  assert.equal(
    catalogText.includes('"' + marker + '"'),
    false,
    "Personal or Supabase marker leaked into public catalog: " + marker
  );
}

const repeated = buildPublicRecipeCatalog(indexHtml, INDEX_PATH);
assert.equal(
  serializePublicRecipeCatalog(repeated),
  serializePublicRecipeCatalog(expected),
  "Generation is not deterministic"
);

const addedId = "catalog-validation-added-recipe";
const addedName = "Recette ajoutée simulée";
const addedSource = injectAfterLibraryDeclaration(
  indexHtml,
  "recipeLibrary.push({id:" +
    JSON.stringify(addedId) +
    ",n:" +
    JSON.stringify(addedName) +
    "});"
);
const addedCatalog = buildPublicRecipeCatalog(addedSource, "index.html:add-simulation");
assert.equal(addedCatalog.recipes[addedId], addedName);
assert.equal(Object.keys(addedCatalog.recipes).length, rows.length + 1);
assert.notEqual(addedCatalog.catalogVersion, catalog.catalogVersion);

const renamedId = rows[0].id;
const renamedName = "Nom renommé simulé";
const renamedSource = injectAfterLibraryDeclaration(
  indexHtml,
  "recipeLibrary.find(recipe=>recipe.id===" +
    JSON.stringify(renamedId) +
    ").n=" +
    JSON.stringify(renamedName) +
    ";"
);
const renamedCatalog = buildPublicRecipeCatalog(
  renamedSource,
  "index.html:rename-simulation"
);
assert.equal(renamedCatalog.recipes[renamedId], renamedName);
assert.notEqual(renamedCatalog.catalogVersion, catalog.catalogVersion);

const duplicateSource = injectAfterLibraryDeclaration(
  indexHtml,
  "recipeLibrary.push({id:" +
    JSON.stringify(renamedId) +
    ",n:\"Doublon simulé\"});"
);
assert.throws(
  () => buildPublicRecipeCatalog(duplicateSource, "index.html:duplicate-simulation"),
  /Duplicate recipe id:/
);

const invalidIdSource = injectAfterLibraryDeclaration(
  indexHtml,
  'recipeLibrary.push({id:"",n:"Identifiant vide simulé"});'
);
assert.throws(
  () => buildPublicRecipeCatalog(invalidIdSource, "index.html:empty-id-simulation"),
  /empty or invalid id/
);

const invalidNameSource = injectAfterLibraryDeclaration(
  indexHtml,
  'recipeLibrary.push({id:"catalog-validation-empty-name",n:"  "});'
);
assert.throws(
  () => buildPublicRecipeCatalog(invalidNameSource, "index.html:empty-name-simulation"),
  /empty or invalid public name/
);

console.log(
  "✓ Public recipe catalog: " +
    rows.length +
    " recipes; schema, source parity, simulations and determinism validated"
);
