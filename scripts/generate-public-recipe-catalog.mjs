#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

export const CATALOG_APP_ID = "clair-repas";
export const CATALOG_CONTRACT_VERSION = 1;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SOURCE = resolve(ROOT, "index.html");
const DEFAULT_TARGET = resolve(ROOT, "clair-repas-catalog.v1.json");
const RECIPE_LIBRARY_MARKER = "const recipeLibrary=";
const DOM_BOUNDARY_MARKER = "$('libraryCount').textContent=";
const HELPER_START_MARKER = "function recipeText(";
const HELPER_END_MARKER = "function inferFamily(";

function fail(message) {
  throw new Error(message);
}

function applicationScript(indexHtml) {
  if (typeof indexHtml !== "string" || !indexHtml.length) {
    fail("The Clair Repas production source is empty");
  }

  const candidates = [
    ...indexHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)
  ]
    .filter(([, attributes, body]) => !/\bsrc\s*=/.test(attributes) && body.trim())
    .map(([, , body]) => body)
    .filter((body) => body.includes(RECIPE_LIBRARY_MARKER));

  if (candidates.length !== 1) {
    fail(
      "Expected exactly one inline Clair Repas recipe script, found " +
        candidates.length
    );
  }
  return candidates[0];
}

function recipeProbeSource(indexHtml) {
  const source = applicationScript(indexHtml);
  const domBoundary = source.indexOf(DOM_BOUNDARY_MARKER);
  const helperStart = source.indexOf(HELPER_START_MARKER);
  const helperEnd = source.indexOf(HELPER_END_MARKER, helperStart);

  if (domBoundary < 0) fail("Missing recipe-data DOM boundary");
  if (helperStart < 0 || helperEnd <= helperStart) {
    fail("Missing recipeText helper boundary");
  }
  if (source.indexOf(RECIPE_LIBRARY_MARKER) > domBoundary) {
    fail("Recipe library is declared after the safe data boundary");
  }

  return (
    source.slice(0, domBoundary) +
    "\n" +
    source.slice(helperStart, helperEnd) +
    "\n;globalThis.__clairPublicCatalogRows = recipeLibrary.map(" +
    "recipe => [recipe && recipe.id, recipe && recipe.n]);"
  );
}

export function extractRecipeCatalogRows(indexHtml, filename = "index.html") {
  const sandbox = { window: Object.create(null) };
  vm.runInNewContext(recipeProbeSource(indexHtml), sandbox, {
    filename: filename + ":public-recipe-catalog",
    timeout: 15000
  });

  const rawRows = sandbox.__clairPublicCatalogRows;
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    fail("The Clair Repas recipe library is empty or unavailable");
  }

  const seen = new Set();
  const rows = Array.from(rawRows, (rawRow, index) => {
    if (!Array.isArray(rawRow) || rawRow.length !== 2) {
      fail("Invalid recipe entry at index " + index);
    }
    const [id, name] = rawRow;
    if (typeof id !== "string" || !id.trim()) {
      fail("Recipe at index " + index + " has an empty or invalid id");
    }
    if (typeof name !== "string" || !name.trim()) {
      fail("Recipe " + id + " has an empty or invalid public name");
    }
    if (seen.has(id)) fail("Duplicate recipe id: " + id);
    seen.add(id);
    return { id, name };
  });

  rows.sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  );
  return rows;
}

export function buildPublicRecipeCatalog(indexHtml, filename = "index.html") {
  const rows = extractRecipeCatalogRows(indexHtml, filename);
  const recipes = Object.fromEntries(rows.map(({ id, name }) => [id, name]));
  const catalogHash = createHash("sha256")
    .update(JSON.stringify(recipes), "utf8")
    .digest("hex");

  return {
    appId: CATALOG_APP_ID,
    contractVersion: CATALOG_CONTRACT_VERSION,
    catalogVersion: "sha256:" + catalogHash,
    recipes
  };
}

export function serializePublicRecipeCatalog(catalog) {
  return JSON.stringify(catalog, null, 2) + "\n";
}

async function writeAtomically(targetPath, content) {
  let current = null;
  try {
    current = await readFile(targetPath, "utf8");
  } catch (error) {
    if (!error || error.code !== "ENOENT") throw error;
  }
  if (current === content) return false;

  const temporaryPath = resolve(
    dirname(targetPath),
    "." + basename(targetPath) + "." + process.pid + ".tmp"
  );
  try {
    await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
    await rename(temporaryPath, targetPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
  return true;
}

export async function generatePublicRecipeCatalog({
  sourcePath = DEFAULT_SOURCE,
  targetPath = DEFAULT_TARGET,
  check = false
} = {}) {
  const indexHtml = await readFile(sourcePath, "utf8");
  const catalog = buildPublicRecipeCatalog(indexHtml, sourcePath);
  const serialized = serializePublicRecipeCatalog(catalog);

  if (check) {
    let current;
    try {
      current = await readFile(targetPath, "utf8");
    } catch (error) {
      if (error && error.code === "ENOENT") {
        fail("Missing generated catalog: " + targetPath);
      }
      throw error;
    }
    if (current !== serialized) {
      fail(
        "Generated catalog is stale; run node scripts/generate-public-recipe-catalog.mjs"
      );
    }
    return { catalog, changed: false, checked: true, targetPath };
  }

  const changed = await writeAtomically(targetPath, serialized);
  return { catalog, changed, checked: false, targetPath };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== "--check") || args.length > 1) {
    fail("Usage: node scripts/generate-public-recipe-catalog.mjs [--check]");
  }
  const result = await generatePublicRecipeCatalog({
    check: args.includes("--check")
  });
  const count = Object.keys(result.catalog.recipes).length;
  const action = result.checked
    ? "validated"
    : result.changed
      ? "generated"
      : "already current";
  console.log(
    "Public recipe catalog " +
      action +
      ": " +
      count +
      " recipes, " +
      result.catalog.catalogVersion
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  });
}
