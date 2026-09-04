#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { TextDecoder, TextEncoder } from "node:util";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTION_V75_INDEX_BLOB = "f46fd65fe649635be392b65760ea90f8dbaf7fd1";
const CLAIR_REPAS_PERSONAL_KEYS = Object.freeze([
  "crFavMeals",
  "crRecentRecipesV25",
  "crRecipeReactionsV3",
  "crRecipeLearningV3",
  "crRecipeNotesV31",
  "crPeople",
  "crDays",
  "crMode",
  "crTimeAvailable",
  "crMealContext",
  "crMealUsageV19",
  "crCourseUsageV37",
  "crBrowserDiscoveryV35",
  "crBrowserDecksV35",
  "crStateV13",
  "crHistoryV13"
]);
const CLAIR_REPAS_TECHNICAL_KEYS = Object.freeze([
  "crHealthProbeV73",
  "crRecipeIdMigrationV39",
  "crWelcomeV7",
  "crFutureTechnicalFlag"
]);
const DISABLED_CLOUD_CONFIG_REVISION = "91499ba9";
const ENABLED_CLOUD_CONFIG_REVISION = "876ade08";
const decoder = new TextDecoder("utf-8", { fatal: true });
const successes = [];
const failures = [];

function rooted(relativePath) {
  const fullPath = resolve(ROOT, relativePath);
  assert.ok(
    fullPath === ROOT || fullPath.startsWith(ROOT + sep),
    "Path escapes repository root: " + relativePath
  );
  return fullPath;
}

function readUtf8(relativePath) {
  return decoder.decode(readFileSync(rooted(relativePath)));
}

function escapeRegExp(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function stringConstant(source, name) {
  const pattern = new RegExp(
    "\\bconst\\s+" + escapeRegExp(name) + "\\s*=\\s*([\"'])(.*?)\\1\\s*;"
  );
  const match = source.match(pattern);
  assert.ok(match, "Missing string constant " + name);
  return match[2];
}

function numberConstant(source, name) {
  const pattern = new RegExp(
    "\\bconst\\s+" + escapeRegExp(name) + "\\s*=\\s*(\\d+)\\s*;"
  );
  const match = source.match(pattern);
  assert.ok(match, "Missing numeric constant " + name);
  return Number(match[1]);
}

function booleanConstant(source, name) {
  const pattern = new RegExp(
    "\\bconst\\s+" + escapeRegExp(name) + "\\s*=\\s*(true|false)\\s*;"
  );
  const match = source.match(pattern);
  assert.ok(match, "Missing boolean constant " + name);
  return match[1] === "true";
}

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, "Missing marker: " + startMarker);
  assert.ok(end > start, "Missing marker after " + startMarker + ": " + endMarker);
  return source.slice(start, end);
}

function coreAssetPath(asset) {
  assert.match(asset, /^\.\/(?:[^?#\\]*)$/, "Unsafe core asset path: " + asset);
  const relativePath = asset.slice(2);
  assert.ok(!relativePath.split("/").includes(".."), "Unsafe core asset path: " + asset);
  return relativePath || "index.html";
}

function normalizedCoreContent(relativePath, content = readFileSync(rooted(relativePath))) {
  if (/\.(?:html|js|json|webmanifest|txt|text)$/i.test(relativePath)) {
    return Buffer.from(decoder.decode(content).replace(/\r\n?/g, "\n"), "utf8");
  }
  return content;
}

function assetDigest(asset) {
  const content = normalizedCoreContent(coreAssetPath(asset));
  return "sha256:" + createHash("sha256").update(content).digest("hex");
}

function coreDigest(coreFiles) {
  const hash = createHash("sha256");
  for (const asset of coreFiles) {
    const relativePath = coreAssetPath(asset);
    const content = normalizedCoreContent(relativePath);
    hash.update(asset);
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }
  return "sha256:" + hash.digest("hex");
}

function gitBlobSha(content) {
  const header = Buffer.from("blob " + content.length + "\0", "utf8");
  return createHash("sha1").update(header).update(content).digest("hex");
}

function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

async function check(name, callback) {
  try {
    const detail = await callback();
    successes.push(detail ? name + " — " + detail : name);
  } catch (error) {
    failures.push(name + ": " + (error && error.message ? error.message : String(error)));
  }
}

const indexHtml = readUtf8("index.html");
const serviceWorker = readUtf8("sw.js");
const shoppingEngine = readUtf8("shopping-v2-engine.js");
const personalSync = readUtf8("v8/clair-sync.js");
const foundation = readUtf8("v8/clair-foundation.js");
const cloudSync = readUtf8("v8/clair-cloud-sync.js");
const supabaseVendor = readUtf8("v8/vendor/supabase-js-2.111.0.js");
const repairTool = readUtf8("repair-local-production.html");
const manifest = JSON.parse(readUtf8("manifest.webmanifest"));
const versionText = readUtf8("v8/version.json");
const version = JSON.parse(versionText);
const refreshMarker = readUtf8("refresh.text");

const scriptMatches = [
  ...indexHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)
];
const inlineScripts = scriptMatches
  .filter(([, attributes, body]) => !/\bsrc\s*=/.test(attributes) && body.trim())
  .map(([, , body]) => body);
const repairInlineScripts = [
  ...repairTool.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)
]
  .filter(([, attributes, body]) => !/\bsrc\s*=/.test(attributes) && body.trim())
  .map(([, , body]) => body);

const coreMatch = serviceWorker.match(/const CORE_FILES\s*=\s*(\[[\s\S]*?\]);/);
assert.ok(coreMatch, "Missing CORE_FILES declaration");
const coreFiles = JSON.parse(coreMatch[1]);
const digestMatch = serviceWorker.match(
  /const CORE_DIGESTS\s*=\s*Object\.freeze\((\{[\s\S]*?\})\);/
);
assert.ok(digestMatch, "Missing CORE_DIGESTS declaration");
const coreDigests = JSON.parse(digestMatch[1]);

await check("Required repository files", () => {
  const required = [
    "index.html",
    "sw.js",
    "manifest.webmanifest",
    "icon-192.png",
    "icon-512.png",
    "shopping-v2-engine.js",
    "v8/clair-sync.js",
    "v8/clair-cloud-sync.js",
    "v8/vendor/supabase-js-2.111.0.js",
    "v8/vendor/supabase-js-2.111.0.LICENSE",
    "v8/clair-foundation.js",
    "v8/version.json",
    "repair-local-production.html",
    "scripts/validate-planning-dates.mjs",
    "scripts/validate-shopping-qr4.mjs",
    "scripts/validate-shopping-v2.mjs",
    "scripts/shopping-contract-v1.fixture.json",
    "scripts/shopping-contract-v2.fixture.json"
  ];
  for (const relativePath of required) {
    assert.ok(existsSync(rooted(relativePath)), "Missing " + relativePath);
  }
  return required.length + " files";
});

await check("UTF-8 and merge-conflict safety", () => {
  const textFiles = [
    "index.html",
    "sw.js",
    "manifest.webmanifest",
    "refresh.text",
    "shopping-v2-engine.js",
    "v8/clair-sync.js",
    "v8/clair-cloud-sync.js",
    "v8/vendor/supabase-js-2.111.0.js",
    "v8/vendor/supabase-js-2.111.0.LICENSE",
    "v8/clair-foundation.js",
    "v8/version.json",
    "repair-local-production.html",
    "scripts/validate-planning-dates.mjs",
    "scripts/validate-shopping-qr4.mjs",
    "scripts/validate-shopping-v2.mjs",
    "scripts/shopping-contract-v1.fixture.json",
    "scripts/shopping-contract-v2.fixture.json"
  ];
  for (const relativePath of textFiles) {
    const text = readUtf8(relativePath);
    assert.doesNotMatch(
      text,
      /^(?:<<<<<<<|=======|>>>>>>>)(?: .*)?$/m,
      "Merge-conflict marker in " + relativePath
    );
  }
  return textFiles.length + " text files";
});

await check("JavaScript syntax", () => {
  new vm.Script(serviceWorker, { filename: "sw.js" });
  new vm.Script(shoppingEngine, { filename: "shopping-v2-engine.js" });
  new vm.Script(personalSync, { filename: "v8/clair-sync.js" });
  new vm.Script(foundation, { filename: "v8/clair-foundation.js" });
  new vm.Script(cloudSync, { filename: "v8/clair-cloud-sync.js" });
  new vm.Script(supabaseVendor, {
    filename: "v8/vendor/supabase-js-2.111.0.js"
  });
  assert.ok(inlineScripts.length > 0, "No inline application script found");
  inlineScripts.forEach((source, index) => {
    new vm.Script(source, { filename: "index.html:inline-" + (index + 1) + ".js" });
  });
  assert.equal(repairInlineScripts.length, 1, "Unexpected repair tool inline scripts");
  repairInlineScripts.forEach((source, index) => {
    new vm.Script(source, {
      filename: "repair-local-production.html:inline-" + (index + 1) + ".js"
    });
  });
  return inlineScripts.length + repairInlineScripts.length + 6 + " scripts";
});

await check("Release metadata consistency", () => {
  const appId = stringConstant(serviceWorker, "APP_ID");
  const release = stringConstant(serviceWorker, "RELEASE");
  const schema = numberConstant(serviceWorker, "DATA_SCHEMA");
  const cloudAppId = stringConstant(serviceWorker, "CLOUD_APP_ID");
  const cloudEnabled = booleanConstant(serviceWorker, "CLOUD_ENABLED");
  const directSyncProtocol = stringConstant(
    serviceWorker,
    "CLOUD_DIRECT_SYNC_PROTOCOL"
  );
  const syncRelease = personalSync.match(/clairRelease\s*\|\|\s*(["'])(.*?)\1/);
  const syncSchema = personalSync.match(/clairSchema\s*\|\|\s*(\d+)/);
  const foundationRelease = foundation.match(/clairRelease\s*\|\|\s*(["'])(.*?)\1/);
  const foundationSchema = foundation.match(/clairSchema\s*\|\|\s*(\d+)/);
  const cloudRelease = cloudSync.match(/clairRelease\s*\|\|\s*(["'])(.*?)\1/);
  const cloudSchema = cloudSync.match(/clairSchema\s*\|\|\s*(\d+)/);
  const productVersion = stringConstant(indexHtml, "CR_APP_VERSION");
  const productSchema = numberConstant(indexHtml, "CR_DATA_SCHEMA_VERSION");
  const markerVersion = refreshMarker.match(/Clair Repas V(\d+(?:\.\d+){1,2})/i);

  assert.ok(syncRelease, "Missing personal Sync release fallback");
  assert.ok(syncSchema, "Missing personal Sync schema fallback");
  assert.ok(foundationRelease, "Missing Foundation release fallback");
  assert.ok(foundationSchema, "Missing Foundation schema fallback");
  assert.ok(cloudRelease, "Missing Cloud Sync release fallback");
  assert.ok(cloudSchema, "Missing Cloud Sync schema fallback");
  assert.ok(markerVersion, "Missing product version in refresh.text");
  assert.equal(version.app, appId);
  assert.equal(version.foundationVersion, release);
  assert.equal(syncRelease[2], release);
  assert.equal(foundationRelease[2], release);
  assert.equal(cloudRelease[2], release);
  assert.equal(version.dataSchema, schema);
  assert.equal(Number(syncSchema[1]), schema);
  assert.equal(Number(foundationSchema[1]), schema);
  assert.equal(Number(cloudSchema[1]), schema);
  assert.equal(productSchema, schema);
  assert.equal(version.productVersion, productVersion);
  assert.equal(markerVersion[1], productVersion);
  assert.match(version.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(cloudAppId, "clair-repas");
  assert.equal(cloudEnabled, true);
  assert.equal(version.cloudAppId, cloudAppId);
  assert.equal(version.cloudEnabled, cloudEnabled);
  assert.equal(version.channel, "production-sync-enabled");
  assert.equal(version.bootstrapGeneration, "bootstrap-v2");
  assert.equal(
    stringConstant(cloudSync, "BOOTSTRAP_GENERATION"),
    version.bootstrapGeneration
  );
  assert.equal(
    stringConstant(cloudSync, "REMOTE_EXISTING_ACCOUNT"),
    "remote-existing-account"
  );
  assert.equal(
    stringConstant(cloudSync, "LOCAL_NEW_ACCOUNT"),
    "local-new-account"
  );
  assert.equal(directSyncProtocol, "clair-personal-sync/v1");
  const cloudConfigRevision = fnv1a(
    cloudAppId + "\0" + cloudEnabled + "\0" + directSyncProtocol
  );
  const disabledCloudConfigRevision = fnv1a(
    cloudAppId + "\0false\0" + directSyncProtocol
  );
  assert.equal(cloudConfigRevision, ENABLED_CLOUD_CONFIG_REVISION);
  assert.equal(disabledCloudConfigRevision, DISABLED_CLOUD_CONFIG_REVISION);
  assert.notEqual(cloudConfigRevision, disabledCloudConfigRevision);
  assert.equal((serviceWorker.match(/data-clair-core="\$\{CORE_REVISION\}"/g) || []).length, 3);
  assert.match(personalSync, /protocol:\s*'clair-personal-sync\/v1'/);
  assert.match(cloudSync, /const CLOUD_PROTOCOL = 'clair-cloud-sync\/v1'/);
  assert.match(
    cloudSync,
    /const CLOUD_APP_ID = String\(script\?\.dataset\?\.clairCloudApp \|\| ''\)\.trim\(\)/
  );
  assert.match(
    cloudSync,
    /const CLOUD_ENABLED = script\?\.dataset\?\.clairCloudEnabled === 'true'/
  );
  assert.match(cloudSync, /const DIRECT_SYNC_PROTOCOL = String\(/);
  const forbiddenTestAppId = /clair-repas-v8[-]test/i;
  for (const [label, content] of Object.entries({
    indexHtml,
    serviceWorker,
    shoppingEngine,
    personalSync,
    foundation,
    cloudSync,
    repairTool,
    versionText,
    refreshMarker
  })) {
    assert.doesNotMatch(content, forbiddenTestAppId, label + " references a test app id");
  }
  const retiredDiagnosticMarker = ["Outil diagnostic : 593cecce", "diag1"].join("-");
  assert.equal(repairTool.includes(retiredDiagnosticMarker), false);
  assert.match(
    serviceWorker,
    /data-clair-cloud-app="\$\{CLOUD_APP_ID\}"/
  );
  assert.match(
    serviceWorker,
    /data-clair-cloud-enabled="\$\{CLOUD_ENABLED\}"/
  );
  assert.match(
    serviceWorker,
    /data-clair-direct-sync="\$\{CLOUD_DIRECT_SYNC_PROTOCOL\}"/
  );
  assert.match(
    serviceWorker,
    /const CLOUD_CONFIG_REVISION = fnv1a\([\s\S]*?CLOUD_APP_ID[\s\S]*?CLOUD_ENABLED[\s\S]*?CLOUD_DIRECT_SYNC_PROTOCOL[\s\S]*?\);/
  );
  assert.match(serviceWorker, /CURRENT_CACHE[^;]*CLOUD_CONFIG_REVISION/s);
  assert.equal(stringConstant(cloudSync, "INTEGRATION"), "clair-v8-foundation.9");
  assert.equal(
    stringConstant(cloudSync, "SUPABASE_JS_PATH"),
    "./v8/vendor/supabase-js-2.111.0.js"
  );
  assert.match(stringConstant(cloudSync, "SUPABASE_PUBLISHABLE_KEY"), /^sb_publishable_/);
  assert.doesNotMatch(cloudSync, /service_role|sb_secret_/i);
  assert.match(supabaseVendor, /realtime-js\/2\.111\.0/);
  assert.equal(
    assetDigest("./v8/vendor/supabase-js-2.111.0.js"),
    "sha256:7396012594aa6d23bb373ebc25d1080bf3672fa847c3713f756520b40fd13453",
    "Vendored Supabase bundle must remain the exact pinned 2.111.0 artifact"
  );
  assert.match(foundation, /coreRevision:\s*CORE_REVISION/);
  assert.match(
    serviceWorker,
    /data\.release === RELEASE && data\.coreRevision === CORE_REVISION/
  );
  return release + " / product " + productVersion + " / cloud " + cloudConfigRevision;
});

await check("Production V7.5 application shell identity", () => {
  const canonicalIndex = normalizedCoreContent("index.html");
  assert.equal(
    gitBlobSha(canonicalIndex),
    PRODUCTION_V75_INDEX_BLOB,
    "index.html must remain the validated V7.5 application shell"
  );
  assert.doesNotMatch(indexHtml, /data-clair-v8-(?:sync|foundation|cloud-sync)/);
  const uiBridge = between(
    indexHtml,
    "/* CLAIR_IPHONE_UI_STABILITY_START */",
    "/* CLAIR_IPHONE_UI_STABILITY_END */"
  );
  const restoreKeysMatch = uiBridge.match(
    /const PERSONAL_RESTORE_KEYS=new Set\((\[[\s\S]*?\])\);/
  );
  assert.ok(restoreKeysMatch, "Missing personal restore UI boundary");
  assert.deepEqual(
    [...vm.runInNewContext(restoreKeysMatch[1])],
    [...CLAIR_REPAS_PERSONAL_KEYS]
  );
  assert.match(uiBridge, /clair:personal-data-restored/);
  assert.match(uiBridge, /render\(\{persist:false,refreshPersonalUi:false\}\)/);
  assert.doesNotMatch(uiBridge, /localStorage\.(?:setItem|removeItem|clear)\s*\(/);
  assert.doesNotMatch(uiBridge, /location\.reload\s*\(/);
  assert.match(cloudSync, /const PERSONAL_DATA_RESTORED_EVENT = 'clair:personal-data-restored'/);
  return "index.html blob " + PRODUCTION_V75_INDEX_BLOB.slice(0, 12);
});

await check("Shopping V2 engine wiring", () => {
  const engineTags = [
    ...indexHtml.matchAll(/<script\b([^>]*)src=["']\.\/shopping-v2-engine\.js["']([^>]*)><\/script>/gi)
  ];
  assert.equal(engineTags.length, 1, "shopping-v2-engine.js must be loaded exactly once");
  const enginePosition = indexHtml.indexOf('<script src="./shopping-v2-engine.js"></script>');
  const applicationPosition = indexHtml.indexOf("<script>", enginePosition + 1);
  assert.ok(enginePosition >= 0, "Missing canonical Shopping V2 script tag");
  assert.ok(
    applicationPosition > enginePosition,
    "Shopping V2 engine must load before the inline application"
  );
  assert.match(indexHtml, /const SHOPPING_ENGINE=globalThis\.ClairShoppingV2;/);
  assert.match(indexHtml, /SHOPPING_ENGINE\.(?:buildDraft|buildModel)\(/);
  assert.match(indexHtml, /SHOPPING_ENGINE\.(?:buildContractV1|contractV1)\(/);
  assert.match(indexHtml, /SHOPPING_ENGINE\.(?:buildContractV2|contractV2)\(/);

  const sandbox = {};
  vm.runInNewContext(shoppingEngine, sandbox, {
    filename: "shopping-v2-engine.js:api",
    timeout: 1000
  });
  const api = sandbox.ClairShoppingV2;
  assert.ok(api && typeof api === "object", "Missing ClairShoppingV2 global API");
  assert.equal(api.SCHEMA_VERSION, 2);
  assert.equal(api.SOURCE, "Clair Repas");
  assert.equal(api.SOURCE_VERSION, "7.5");
  assert.match(api.RULES_VERSION, /^clair-repas-shopping-v2\./);
  for (const method of [
    "buildDraft",
    "buildContractV1",
    "buildContractV2",
    "selectedItemsV2",
    "applyManualText",
    "applyAisleOverride"
  ]) {
    assert.equal(typeof api[method], "function", "Missing Shopping V2 API method " + method);
  }
  assert.doesNotMatch(shoppingEngine, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  assert.doesNotMatch(
    shoppingEngine,
    /\b(?:localStorage|sessionStorage|indexedDB|caches|supabase)\b/i
  );
  return api.RULES_VERSION;
});

await check("PWA manifest and icons", () => {
  assert.equal(manifest.name, "Clair Repas");
  assert.equal(manifest.short_name, "Clair Repas");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.match(indexHtml, /<link\s+rel=["']manifest["']\s+href=["']\.\/manifest\.webmanifest["']/i);

  const themeMatch = indexHtml.match(
    /<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/i
  );
  assert.ok(themeMatch, "Missing HTML theme-color");
  assert.equal(themeMatch[1].toLowerCase(), String(manifest.theme_color).toLowerCase());
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "Missing PWA icons");

  const dimensions = new Set();
  for (const icon of manifest.icons) {
    assert.equal(icon.type, "image/png");
    const iconPath = coreAssetPath(icon.src);
    const bytes = readFileSync(rooted(iconPath));
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR");
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    const actual = width + "x" + height;
    assert.ok(String(icon.sizes).split(/\s+/).includes(actual), iconPath + " is " + actual);
    dimensions.add(actual);
  }
  assert.ok(dimensions.has("192x192"), "Missing 192x192 icon");
  assert.ok(dimensions.has("512x512"), "Missing 512x512 icon");
  return [...dimensions].sort().join(", ");
});

await check("Precache completeness and immutable revision", () => {
  assert.ok(Array.isArray(coreFiles) && coreFiles.length > 0, "CORE_FILES must be non-empty");
  assert.equal(new Set(coreFiles).size, coreFiles.length, "Duplicate CORE_FILES entries");
  for (const expected of [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./icon-192.png",
    "./icon-512.png",
    "./shopping-v2-engine.js",
    "./v8/clair-sync.js",
    "./v8/vendor/supabase-js-2.111.0.js",
    "./v8/clair-foundation.js",
    "./v8/clair-cloud-sync.js",
    "./v8/version.json"
  ]) {
    assert.ok(coreFiles.includes(expected), "CORE_FILES omits " + expected);
  }
  for (const asset of coreFiles) {
    assert.ok(existsSync(rooted(coreAssetPath(asset))), "Missing core asset " + asset);
    assert.equal(coreDigests[asset], assetDigest(asset), "Digest mismatch for " + asset);
  }
  assert.deepEqual(Object.keys(coreDigests).sort(), [...coreFiles].sort());
  assert.equal(
    normalizedCoreContent("sample.txt", Buffer.from("a\r\nb\rc\n", "utf8")).toString("utf8"),
    "a\nb\nc\n"
  );

  const revision = stringConstant(serviceWorker, "CORE_REVISION");
  assert.match(revision, /^sha256:[a-f0-9]{64}$/);
  assert.equal(revision, coreDigest(coreFiles));
  assert.match(
    serviceWorker,
    /const CURRENT_CACHE\s*=\s*[^;]*CORE_REVISION/,
    "Cache identity must include CORE_REVISION"
  );
  assert.match(
    serviceWorker,
    /const FOUNDATION_CORE_FILES\s*=\s*LOCAL_SYNC_CORE_FILES\.filter/,
    "Foundation.8 fallback must retain its historical core set"
  );
  assert.match(
    serviceWorker,
    /const PRE_SHOPPING_V2_CORE_FILES\s*=\s*CORE_FILES\.filter/,
    "Pre-QR1 fallbacks must retain their historical core set"
  );
  assert.match(
    serviceWorker,
    /const fullCoreFiles = hasShoppingV2 \? CORE_FILES : PRE_SHOPPING_V2_CORE_FILES/,
    "Cloud fallbacks must retain the complete cloud runtime"
  );
  assert.match(
    serviceWorker,
    /PRE_SHOPPING_V2_LOCAL_SYNC_CORE_FILES/,
    "Local-Sync fallbacks must retain clair-sync.js"
  );
  assert.match(
    serviceWorker,
    /const PRE_V8_STABLE_CACHES\s*=\s*\[/,
    "The production V7.5 cache must remain an eligible migration source"
  );
  assert.match(
    serviceWorker,
    /async function cacheSupportsShoppingV2\(cacheName\)/,
    "Shopping V2 fallback compatibility guard is required"
  );
  assert.match(
    serviceWorker,
    /async function choosePreviousCache[\s\S]*?cacheSupportsShoppingV2\(candidate\)/,
    "Rollback selection must reject pre-QR1 shopping shells"
  );
  assert.match(
    serviceWorker,
    /const cached = await cacheSupportsShoppingV2\(servingState\.activeCache\)/,
    "Main navigation must not serve a pre-QR1 shopping shell"
  );
  assert.match(
    serviceWorker,
    /if \(!\(await cacheSupportsShoppingV2\(servingState\.activeCache\)\)\) \{\s*return Response\.error\(\);/,
    "Secondary offline navigation must not serve a shell without the active V2 sender"
  );
  assert.match(
    serviceWorker,
    /const cached = await cacheSupportsShoppingV2\(state\.activeCache\)[\s\S]*?const previous = await cacheSupportsShoppingV2\(state\.previousCache\)/,
    "Asset fallback must not mix a current shell with pre-V2 transport resources"
  );
  return coreFiles.length + " URLs, " + revision.slice(0, 19);
});

await check("Service-worker registration and full-cache validation", async () => {
  const handlers = new Map();
  const fakeSelf = {
    registration: { scope: "https://example.test/app/" },
    location: { origin: "https://example.test" },
    addEventListener(type, handler) {
      handlers.set(type, handler);
    }
  };
  vm.runInNewContext(
    serviceWorker,
    {
      self: fakeSelf,
      URL,
      Headers,
      Response,
      Request,
      Set,
      Date,
      console,
      crypto: webcrypto,
      TextDecoder,
      TextEncoder
    },
    { filename: "sw.js:registration-smoke", timeout: 1000 }
  );
  assert.deepEqual([...handlers.keys()].sort(), ["activate", "fetch", "install", "message"]);

  let cacheNames = ["legacy"];
  let missingAsset = null;
  let currentCacheName = null;
  let metaCacheName = null;
  let metaUrl = null;
  let metaState = {};
  let networkFetch = async () => new Response("network", { status: 200 });
  const v2Bootstrap =
    '<script src="./shopping-v2-engine.js"></script>' +
    '<script data-clair-v8-sync></script>' +
    '<script data-clair-v8-foundation></script>' +
    '<script data-clair-v8-cloud-sync></script>' +
    '<script>function shoppingSendSelected(){const contract=shoppingContractV2();}' +
    'function bindShoppingInteractions(){}</script>';
  const v1Bootstrap =
    '<script src="./shopping-v2-engine.js"></script>' +
    '<script data-clair-v8-sync></script>' +
    '<script data-clair-v8-foundation></script>' +
    '<script data-clair-v8-cloud-sync></script>' +
    '<script>function shoppingSendSelected(){const contract=shoppingContractV1();}' +
    'function bindShoppingInteractions(){}</script>';
  const cacheContext = {
    self: fakeSelf,
    URL,
    Headers,
    Response,
    Request,
    Set,
    Date,
    console,
    crypto: webcrypto,
    TextDecoder,
    TextEncoder,
    fetch(...args) {
      return networkFetch(...args);
    },
    caches: {
      async keys() {
        return cacheNames;
      },
      async open(cacheName) {
        return {
          async match(request) {
            const url = String(request);
            if (cacheName === metaCacheName && url === metaUrl) {
              return new Response(JSON.stringify(metaState), {
                headers: { "content-type": "application/json" }
              });
            }
            if (missingAsset && url.includes(missingAsset)) return null;
            if (url === "[object Object]") return null;
            if (url.endsWith("/index.html") || url.endsWith("/app/")) {
              if (cacheName === currentCacheName) return new Response(indexHtml);
              const bootstrap = cacheName === "shopping-v2-old" || cacheName.endsWith("-qr3")
                ? v2Bootstrap
                : cacheName.endsWith("-qr1b")
                  ? v1Bootstrap
                  : cacheName.endsWith("-mixed-shell")
                    ? url.endsWith("/index.html")
                      ? v2Bootstrap
                      : "<script data-clair-v8-foundation></script>"
                    : cacheName.endsWith("-comment-only")
                      ? '<!-- <script src="./shopping-v2-engine.js"></script>' +
                        '<script>function shoppingSendSelected(){const contract=shoppingContractV2();}' +
                        'function bindShoppingInteractions(){}</script> -->' +
                        '<script data-clair-v8-sync></script>' +
                        '<script data-clair-v8-foundation></script>' +
                        '<script data-clair-v8-cloud-sync></script>'
                : cacheName === "pre-v8"
                ? ""
                : cacheName === "legacy"
                ? "<script data-clair-v8-foundation></script>"
                : cacheName === "local-sync"
                  ? "<script data-clair-v8-sync></script><script data-clair-v8-foundation></script>"
                  : "<script data-clair-v8-sync></script><script data-clair-v8-foundation></script><script data-clair-v8-cloud-sync></script>";
              return new Response("<head>" + bootstrap + "</head>");
            }
            return new Response("asset");
          },
          async put(request, response) {
            if (cacheName === metaCacheName && String(request) === metaUrl) {
              metaState = await response.clone().json();
            }
          }
        };
      }
    }
  };
  vm.runInNewContext(
    serviceWorker +
      "\n;globalThis.__cacheHasCore = cacheHasCore;" +
      "\n;globalThis.__cacheSupportsShoppingV2 = cacheSupportsShoppingV2;" +
      "\n;globalThis.__cachePrefix = CACHE_PREFIX;" +
      "\n;globalThis.__choosePreviousCache = choosePreviousCache;" +
      "\n;globalThis.__currentCache = CURRENT_CACHE;" +
      "\n;globalThis.__metaCache = META_CACHE;" +
      "\n;globalThis.__metaUrl = META_URL;" +
      "\n;globalThis.__cloudConfigRevision = CLOUD_CONFIG_REVISION;" +
      "\n;globalThis.__validateCoreDigest = validateCoreDigest;",
    cacheContext,
    { filename: "sw.js:cache-smoke", timeout: 1000 }
  );
  assert.equal(
    cacheContext.__cloudConfigRevision,
    ENABLED_CLOUD_CONFIG_REVISION
  );
  assert.ok(cacheContext.__currentCache.endsWith("-" + ENABLED_CLOUD_CONFIG_REVISION));
  currentCacheName = cacheContext.__currentCache;
  metaCacheName = cacheContext.__metaCache;
  metaUrl = cacheContext.__metaUrl;
  assert.notEqual(
    cacheContext.__currentCache,
    cacheContext.__currentCache.replace(
      ENABLED_CLOUD_CONFIG_REVISION,
      DISABLED_CLOUD_CONFIG_REVISION
    )
  );
  const completeCacheNames = [
    cacheContext.__currentCache,
    "legacy",
    "local-sync",
    "old-cloud",
    "shopping-v2-old",
    "pre-v8"
  ];
  cacheNames = completeCacheNames;
  assert.equal(await cacheContext.__cacheHasCore(cacheContext.__currentCache), true);
  assert.equal(await cacheContext.__cacheHasCore("legacy"), true);
  assert.equal(await cacheContext.__cacheHasCore("local-sync"), true);
  assert.equal(await cacheContext.__cacheHasCore("old-cloud"), true);
  assert.equal(await cacheContext.__cacheHasCore("shopping-v2-old"), true);
  assert.equal(await cacheContext.__cacheHasCore("pre-v8"), true);
  assert.equal(await cacheContext.__cacheSupportsShoppingV2(cacheContext.__currentCache), true);
  assert.equal(await cacheContext.__cacheSupportsShoppingV2("shopping-v2-old"), true);
  assert.equal(await cacheContext.__cacheSupportsShoppingV2("old-cloud"), false);
  assert.equal(await cacheContext.__cacheSupportsShoppingV2("local-sync"), false);
  assert.equal(await cacheContext.__cacheSupportsShoppingV2("legacy"), false);
  assert.equal(await cacheContext.__cacheSupportsShoppingV2("pre-v8"), false);
  const preQr1Fallback = `${cacheContext.__cachePrefix}pre-qr1`;
  const qr1bFallback = `${cacheContext.__cachePrefix}qr1b`;
  const qr3Fallback = `${cacheContext.__cachePrefix}qr3`;
  const mixedShellFallback = `${cacheContext.__cachePrefix}mixed-shell`;
  const commentOnlyFallback = `${cacheContext.__cachePrefix}comment-only`;
  cacheNames = [preQr1Fallback, qr1bFallback, qr3Fallback, mixedShellFallback, commentOnlyFallback];
  assert.equal(
    await cacheContext.__cacheSupportsShoppingV2(qr1bFallback),
    false,
    "A shell with the V2 engine but the active V1 sender must be rejected"
  );
  assert.equal(
    await cacheContext.__cacheSupportsShoppingV2(mixedShellFallback),
    false,
    "Both cached entry shells must expose the active V2 sender"
  );
  assert.equal(
    await cacheContext.__cacheSupportsShoppingV2(commentOnlyFallback),
    false,
    "Commented Shopping V2 markup must not qualify a fallback shell"
  );
  assert.equal(
    await cacheContext.__choosePreviousCache({
      lastHealthyCache: qr1bFallback,
      previousCache: qr3Fallback,
      probation: true
    }),
    qr3Fallback,
    "Rollback must skip a preferred active-V1 shell and choose the active-V2 fallback"
  );
  cacheNames = [preQr1Fallback, qr1bFallback, mixedShellFallback, commentOnlyFallback];
  assert.equal(
    await cacheContext.__choosePreviousCache({ lastHealthyCache: qr1bFallback }),
    null,
    "No shell without the active V2 sender may be selected as a Shopping fallback"
  );

  const fetchHandler = handlers.get("fetch");
  assert.equal(typeof fetchHandler, "function", "Fetch handler must be registered");
  async function offlineSecondaryNavigation(activeCache) {
    cacheNames = [metaCacheName, activeCache];
    metaState = { activeCache, probation: false, bootAttempted: false };
    networkFetch = async () => {
      throw new Error("offline");
    };
    let responsePromise = null;
    fetchHandler({
      request: { method: "GET", mode: "navigate", url: "https://example.test/app/secondary" },
      respondWith(value) {
        responsePromise = Promise.resolve(value);
      }
    });
    assert.ok(responsePromise, "Offline navigation must call respondWith");
    return responsePromise;
  }
  const rejectedV1Navigation = await offlineSecondaryNavigation(qr1bFallback);
  assert.equal(
    rejectedV1Navigation.type,
    "error",
    "Secondary offline navigation must reject the cached active-V1 sender"
  );
  const acceptedV2Navigation = await offlineSecondaryNavigation(qr3Fallback);
  assert.match(
    await acceptedV2Navigation.text(),
    /const contract=shoppingContractV2\(\);/,
    "Secondary offline navigation may serve a verified active-V2 shell"
  );

  async function offlineAssetRequest(activeCache) {
    cacheNames = [metaCacheName, activeCache];
    metaState = { activeCache, previousCache: null, probation: false, bootAttempted: false };
    networkFetch = async () => {
      throw new Error("offline");
    };
    let responsePromise = null;
    const assetUrl = "https://example.test/app/shopping-v2-engine.js";
    fetchHandler({
      request: {
        method: "GET",
        mode: "cors",
        url: assetUrl,
        toString() {
          return assetUrl;
        }
      },
      respondWith(value) {
        responsePromise = Promise.resolve(value);
      }
    });
    assert.ok(responsePromise, "Asset request must call respondWith");
    return responsePromise;
  }
  const rejectedV1Asset = await offlineAssetRequest(qr1bFallback);
  assert.equal(
    rejectedV1Asset.type,
    "error",
    "Offline assets must not be read from a cache whose active sender is V1"
  );
  const acceptedV2Asset = await offlineAssetRequest(qr3Fallback);
  assert.equal(
    await acceptedV2Asset.text(),
    "asset",
    "Offline assets may be read from a verified active-V2 cache"
  );
  cacheNames = completeCacheNames;
  missingAsset = "shopping-v2-engine.js";
  assert.equal(
    await cacheContext.__cacheHasCore(cacheContext.__currentCache),
    false,
    "The current cache must include the Shopping V2 engine"
  );
  assert.equal(
    await cacheContext.__cacheHasCore("old-cloud"),
    true,
    "A healthy pre-QR1 cloud cache must remain a structurally valid migration source"
  );
  assert.equal(
    await cacheContext.__cacheHasCore("local-sync"),
    true,
    "A healthy pre-QR1 local-sync cache must remain a structurally valid migration source"
  );
  assert.equal(
    await cacheContext.__cacheHasCore("legacy"),
    true,
    "A healthy pre-QR1 Foundation cache must remain a structurally valid migration source"
  );
  assert.equal(
    await cacheContext.__cacheHasCore("shopping-v2-old"),
    false,
    "A cache whose shell references Shopping V2 must include the engine"
  );
  missingAsset = "clair-cloud-sync.js";
  assert.equal(await cacheContext.__cacheHasCore(cacheContext.__currentCache), false);
  assert.equal(await cacheContext.__cacheHasCore("legacy"), true);
  assert.equal(await cacheContext.__cacheHasCore("local-sync"), true);
  missingAsset = "supabase-js-2.111.0.js";
  assert.equal(await cacheContext.__cacheHasCore(cacheContext.__currentCache), false);
  assert.equal(await cacheContext.__cacheHasCore("legacy"), true);
  assert.equal(await cacheContext.__cacheHasCore("local-sync"), true);
  missingAsset = "clair-sync.js";
  assert.equal(await cacheContext.__cacheHasCore(cacheContext.__currentCache), false);
  assert.equal(
    await cacheContext.__cacheHasCore("legacy"),
    true,
    "Foundation.8 fallback must remain valid without clair-sync.js"
  );
  assert.equal(
    await cacheContext.__cacheHasCore("local-sync"),
    false,
    "Post-Sync fallback must require clair-sync.js"
  );
  missingAsset = "manifest.webmanifest";
  assert.equal(await cacheContext.__cacheHasCore(cacheContext.__currentCache), false);
  assert.equal(await cacheContext.__cacheHasCore("legacy"), false);
  assert.equal(await cacheContext.__cacheHasCore("local-sync"), false);
  assert.equal(
    await cacheContext.__cacheHasCore("pre-v8"),
    true,
    "The pre-V8 production shell remains a structurally valid migration source"
  );

  const manifestResponse = new Response(readFileSync(rooted("manifest.webmanifest")));
  await cacheContext.__validateCoreDigest("./manifest.webmanifest", manifestResponse);
  await assert.rejects(
    () =>
      cacheContext.__validateCoreDigest(
        "./manifest.webmanifest",
        new Response(
          Buffer.concat([
            readFileSync(rooted("manifest.webmanifest")),
            Buffer.from(" ", "utf8")
          ])
        )
      ),
    /digest mismatch/
  );
  const fetchRequiredSource = between(
    serviceWorker,
    "function isTextCorePath(path) {",
    "\nasync function buildCandidateCache"
  );
  const fetchContext = {
    self: fakeSelf,
    URL,
    Request,
    Response,
    TextDecoder,
    TextEncoder,
    crypto: webcrypto,
    CORE_DIGESTS: coreDigests,
    fetch: async () =>
      new Response(
        Buffer.concat([
          readFileSync(rooted("manifest.webmanifest")),
          Buffer.from(" ", "utf8")
        ]),
        { status: 200 }
      )
  };
  vm.runInNewContext(
    fetchRequiredSource + "\n;globalThis.__fetchRequired = fetchRequired;",
    fetchContext,
    { filename: "sw.js:fetch-required-smoke", timeout: 1000 }
  );
  await assert.rejects(
    () => fetchContext.__fetchRequired("./manifest.webmanifest"),
    /digest mismatch/
  );

  const injectionSource = between(
    serviceWorker,
    "function syncTag() {",
    "\nasync function validateVersionManifest"
  );
  const injectionContext = {
    APP_ID: stringConstant(serviceWorker, "APP_ID"),
    RELEASE: stringConstant(serviceWorker, "RELEASE"),
    DATA_SCHEMA: numberConstant(serviceWorker, "DATA_SCHEMA"),
    CORE_REVISION: stringConstant(serviceWorker, "CORE_REVISION"),
    CLOUD_APP_ID: stringConstant(serviceWorker, "CLOUD_APP_ID"),
    CLOUD_ENABLED: booleanConstant(serviceWorker, "CLOUD_ENABLED"),
    CLOUD_DIRECT_SYNC_PROTOCOL: stringConstant(
      serviceWorker,
      "CLOUD_DIRECT_SYNC_PROTOCOL"
    ),
    Headers,
    Response
  };
  vm.runInNewContext(
    injectionSource + "\n;globalThis.__injectRuntime = injectRuntime;",
    injectionContext,
    { filename: "sw.js:runtime-injection-smoke", timeout: 1000 }
  );
  const injectedResponse = await injectionContext.__injectRuntime(
    new Response("<!doctype html><html><head><title>App</title></head><body></body></html>")
  );
  const injectedHtml = await injectedResponse.text();
  const syncPosition = injectedHtml.indexOf("data-clair-v8-sync");
  const foundationPosition = injectedHtml.indexOf("data-clair-v8-foundation");
  const cloudPosition = injectedHtml.indexOf("data-clair-v8-cloud-sync");
  assert.ok(
    syncPosition >= 0 &&
      foundationPosition > syncPosition &&
      cloudPosition > foundationPosition
  );
  assert.equal((injectedHtml.match(/data-clair-v8-sync/g) || []).length, 1);
  assert.equal((injectedHtml.match(/data-clair-v8-foundation/g) || []).length, 1);
  assert.equal((injectedHtml.match(/data-clair-v8-cloud-sync/g) || []).length, 1);
  assert.equal((injectedHtml.match(/data-clair-app="clair-repas"/g) || []).length, 3);
  assert.equal((injectedHtml.match(/data-clair-cloud-app="clair-repas"/g) || []).length, 1);
  assert.equal((injectedHtml.match(/data-clair-cloud-enabled="true"/g) || []).length, 1);
  assert.equal(
    (injectedHtml.match(/data-clair-direct-sync="clair-personal-sync\/v1"/g) || []).length,
    1
  );
  await assert.rejects(
    () =>
      injectionContext.__injectRuntime(
        new Response("<head><script data-clair-v8-foundation></script></head>")
      ),
    /incomplete runtime bootstrap/
  );

  const markCandidateSource = between(
    serviceWorker,
    "async function markCandidateActive() {",
    "\nasync function rollbackIfNeeded"
  );
  assert.match(markCandidateSource, /bootAttempted:\s*false/);
  assert.match(markCandidateSource, /bootStartedAt:\s*0/);

  const startAttemptSource = between(
    serviceWorker,
    "async function startBootAttemptIfNeeded(state) {",
    "\nasync function startBootAttemptSafely"
  );
  const attemptContext = {
    CURRENT_CACHE: "candidate",
    Date,
    writeState: async (state) => state
  };
  vm.runInNewContext(
    startAttemptSource +
      "\n;globalThis.__startBootAttemptIfNeeded = startBootAttemptIfNeeded;",
    attemptContext,
    { filename: "sw.js:boot-attempt-smoke", timeout: 1000 }
  );
  const untouched = { probation: false, activeCache: "candidate", bootStartedAt: 0 };
  assert.equal(await attemptContext.__startBootAttemptIfNeeded(untouched), untouched);
  const attempted = await attemptContext.__startBootAttemptIfNeeded({
    probation: true,
    activeCache: "candidate",
    bootAttempted: false,
    bootStartedAt: 0
  });
  assert.equal(attempted.bootAttempted, true);
  assert.ok(Number.isFinite(attempted.bootStartedAt) && attempted.bootStartedAt > 0);
  const safeAttemptSource = between(
    serviceWorker,
    "async function startBootAttemptSafely(state) {",
    "\nasync function serveFromCache"
  );
  const failedMetaContext = {
    CURRENT_CACHE: "candidate",
    Date,
    writeState: async () => {
      throw new Error("meta-cache unavailable");
    }
  };
  vm.runInNewContext(
    startAttemptSource +
      safeAttemptSource +
      "\n;globalThis.__startBootAttemptSafely = startBootAttemptSafely;",
    failedMetaContext,
    { filename: "sw.js:meta-cache-failure-smoke", timeout: 1000 }
  );
  const candidateState = {
    probation: true,
    activeCache: "candidate",
    previousCache: "previous",
    bootStartedAt: 0
  };
  const afterMetaFailure = await failedMetaContext.__startBootAttemptSafely(candidateState);
  assert.equal(afterMetaFailure, candidateState);
  assert.equal(afterMetaFailure.activeCache, "candidate");
  const mainNavigationSource = between(
    serviceWorker,
    "if (isMainNavigation(url, request)) {",
    "\n  if (request.mode === \"navigate\")"
  );
  assert.match(mainNavigationSource, /startBootAttemptSafely\(state\)/);
  assert.doesNotMatch(serviceWorker, /CLAIR_V8_BOOT_START/);

  const buildCandidateSource = between(
    serviceWorker,
    "async function buildCandidateCache() {",
    "\nasync function choosePreviousCache"
  );
  assert.ok(
    buildCandidateSource.indexOf("state.failedCache === CURRENT_CACHE") <
      buildCandidateSource.indexOf("cacheHasCore(CURRENT_CACHE)"),
    "Failed-cache quarantine must run before candidate reuse"
  );
  const quarantineContext = {
    CURRENT_CACHE: "candidate",
    readState: async () => ({ failedCache: "candidate" })
  };
  vm.runInNewContext(
    buildCandidateSource + "\n;globalThis.__buildCandidateCache = buildCandidateCache;",
    quarantineContext,
    { filename: "sw.js:failed-cache-smoke", timeout: 1000 }
  );
  await assert.rejects(
    () => quarantineContext.__buildCandidateCache(),
    /quarantined after a failed boot/
  );

  return "4 handlers; digest, watchdog and quarantine paths";
});

await check("Literal DOM references", () => {
  const declared = new Set(
    [...indexHtml.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map((match) => match[2])
  );
  const references = [
    ...indexHtml.matchAll(/\$\(\s*(["'])(.*?)\1\s*\)/g)
  ].map((match) => match[2]);
  const missing = [...new Set(references.filter((id) => !declared.has(id)))];
  assert.deepEqual(missing, []);
  return declared.size + " IDs / " + references.length + " references";
});

await check("Direct personal sync isolation", async () => {
  assert.doesNotMatch(foundation, /\blocalStorage\b/);
  assert.doesNotMatch(foundation, /personalKeyPolicies|function readPersonalData/);
  assert.match(personalSync, /\blocalStorage\b/);
  assert.match(cloudSync, /sync\.capture\(\)/);
  assert.match(cloudSync, /sync\.restore\(target\)/);
  assert.match(cloudSync, /sync\.valid\(\{ \[key\]: '' \}\)/);
  assert.doesNotMatch(cloudSync, /personalKeyPolicies|function readPersonalData/);
  assert.doesNotMatch(cloudSync, /app_id:\s*['"]clair-repas['"]/);
  assert.match(foundation, /const personalSync = resolvePersonalSync\(\)/);
  const allowlistSource = between(
    personalSync,
    "const CLAIR_REPAS_PERSONAL_KEYS = Object.freeze([",
    "\n  ]);"
  );
  const configuredPersonalKeys = [
    ...allowlistSource.matchAll(/'([^']+)'/g)
  ].map((match) => match[1]);
  assert.deepEqual(configuredPersonalKeys, CLAIR_REPAS_PERSONAL_KEYS);
  assert.equal(new Set(configuredPersonalKeys).size, 16);
  assert.match(personalSync, /'clair-repas': \(key\) => clairRepasPersonalKeySet\.has\(key\)/);
  const readySource = between(
    foundation,
    "function clairRepasReady() {",
    "\n  const appConfig ="
  );
  const readyContext = {
    window: { __CLAIR_REPAS_HEALTH: { ok: false } },
    document: { readyState: "complete" }
  };
  vm.runInNewContext(
    readySource + "\n;globalThis.__clairRepasReady = clairRepasReady;",
    readyContext,
    { filename: "v8/clair-foundation.js:health-smoke", timeout: 1000 }
  );
  assert.equal(readyContext.__clairRepasReady(), false);
  readyContext.window.__CLAIR_REPAS_HEALTH = { ok: true };
  assert.equal(readyContext.__clairRepasReady(), true);
  readyContext.document.readyState = "loading";
  assert.equal(readyContext.__clairRepasReady(), false);

  const personalBefore = Object.fromEntries(
    CLAIR_REPAS_PERSONAL_KEYS.map((key, index) => [key, "old-personal-" + index])
  );
  const technicalBefore = Object.fromEntries([
    ...CLAIR_REPAS_TECHNICAL_KEYS.map((key, index) => [key, "technical-" + index]),
    ["unrelated", "keep"]
  ]);
  const values = new Map([
    ...Object.entries(personalBefore),
    ...Object.entries(technicalBefore)
  ]);
  let operation = 0;
  let failAt = 2;
  let readFailuresRemaining = 0;
  const localStorage = {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      if (readFailuresRemaining > 0 && /^cr/.test(key)) {
        readFailuresRemaining -= 1;
        throw new Error("injected read failure");
      }
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      operation += 1;
      if (operation === failAt) throw new Error("injected write failure");
      values.set(key, String(value));
    },
    removeItem(key) {
      operation += 1;
      if (operation === failAt) throw new Error("injected remove failure");
      values.delete(key);
    }
  };
  const context = {
    window: {},
    document: {
      currentScript: {
        dataset: {
          clairApp: "clair-repas",
          clairRelease: stringConstant(serviceWorker, "RELEASE"),
          clairSchema: String(numberConstant(serviceWorker, "DATA_SCHEMA")),
          clairCore: stringConstant(serviceWorker, "CORE_REVISION")
        }
      }
    },
    location: { href: "https://example.test/app/index.html", pathname: "/app/" },
    URL,
    localStorage,
  };
  vm.runInNewContext(
    personalSync,
    context,
    { filename: "v8/clair-sync.js:storage-smoke", timeout: 1000 }
  );
  const syncApi = context.window.ClairSync;
  assert.ok(syncApi, "ClairSync API was not published");
  assert.equal(syncApi.protocol, "clair-personal-sync/v1");
  assert.deepEqual(
    Object.fromEntries(Object.entries(syncApi.capture().values)),
    personalBefore
  );
  assert.deepEqual(
    Array.from(syncApi.listPersonalKeys()),
    [...CLAIR_REPAS_PERSONAL_KEYS].sort()
  );
  for (const key of CLAIR_REPAS_PERSONAL_KEYS) {
    assert.equal(syncApi.valid({ [key]: "allowed" }), true, key + " must be allowed");
  }
  for (const key of CLAIR_REPAS_TECHNICAL_KEYS) {
    assert.equal(syncApi.valid({ [key]: "forbidden" }), false, key + " must be ignored");
    assert.equal(Object.hasOwn(syncApi.capture().values, key), false);
  }

  const resolverSource = between(
    foundation,
    "function resolvePersonalSync() {",
    "\n  const personalSync ="
  );
  const resolverContext = {
    window: { ClairSync: syncApi },
    APP_ID: syncApi.app,
    RELEASE: syncApi.release,
    CORE_REVISION: syncApi.coreRevision,
    DATA_SCHEMA: syncApi.dataSchema,
    SCOPE_PATH: syncApi.scopePath,
    SCOPE_ID: syncApi.scopeId
  };
  vm.runInNewContext(
    resolverSource + "\n;globalThis.__resolvePersonalSync = resolvePersonalSync;",
    resolverContext,
    { filename: "v8/clair-foundation.js:sync-contract-smoke", timeout: 1000 }
  );
  assert.equal(resolverContext.__resolvePersonalSync(), syncApi);
  resolverContext.window.ClairSync = { ...syncApi, coreRevision: "sha256:tampered" };
  assert.equal(resolverContext.__resolvePersonalSync(), null);

  const restoredPersonalValues = {
    crFavMeals: '["favorite-new"]',
    crRecentRecipesV25: '["recipe-new"]'
  };
  const fullBeforeFailedRestore = Object.fromEntries(values);
  assert.equal(syncApi.restore(restoredPersonalValues), false);
  assert.deepEqual(Object.fromEntries(values), fullBeforeFailedRestore);

  operation = 0;
  failAt = Number.POSITIVE_INFINITY;
  assert.equal(syncApi.restore(restoredPersonalValues), true);
  assert.deepEqual(Object.fromEntries(values), {
    ...restoredPersonalValues,
    ...technicalBefore
  });
  const beforeRejectedRestore = Object.fromEntries(values);
  assert.equal(syncApi.restore(new Map([["crFavMeals", "map-value"]])), false);
  assert.equal(syncApi.restore({ crFavMeals: 42 }), false);
  for (const key of CLAIR_REPAS_TECHNICAL_KEYS) {
    assert.equal(syncApi.restore({ [key]: "must-not-write" }), false);
  }
  assert.deepEqual(Object.fromEntries(values), beforeRejectedRestore);

  readFailuresRemaining = 1;
  const failedCapture = syncApi.capture();
  assert.equal(failedCapture.ok, false);
  assert.equal(Object.keys(failedCapture.values).length, 0);

  const failBootSource = between(
    foundation,
    "async function failBoot(reason, detail = '') {",
    "\n  window.addEventListener('error'"
  );
  let restoreCalls = 0;
  let snapshotCalls = 0;
  let postedFailure = null;
  const failBootContext = {
    prebootCapture: { ok: false },
    prebootData: {},
    restorePersonalData: () => {
      restoreCalls += 1;
      return true;
    },
    putSnapshot: async () => {
      snapshotCalls += 1;
    },
    post: (_type, payload) => {
      postedFailure = payload;
    }
  };
  vm.runInNewContext(
    "let bootResolved = false; let fatalError = null;\n" +
      failBootSource +
      "\n;globalThis.__failBoot = failBoot;",
    failBootContext,
    { filename: "v8/clair-foundation.js:capture-failure-smoke", timeout: 1000 }
  );
  await failBootContext.__failBoot("runtime-error", "test");
  assert.equal(restoreCalls, 0);
  assert.equal(snapshotCalls, 0);
  assert.equal(postedFailure.personalDataCaptured, false);

  const quotaValues = new Map([
    ["crFavMeals", "a".repeat(4000)],
    ["crRecentRecipesV25", "b".repeat(1000)]
  ]);
  const quotaLimit = 6000;
  const quotaStorage = {
    get length() {
      return quotaValues.size;
    },
    key(index) {
      return [...quotaValues.keys()][index] ?? null;
    },
    getItem(key) {
      return quotaValues.has(key) ? quotaValues.get(key) : null;
    },
    setItem(key, value) {
      const next = new Map(quotaValues);
      next.set(key, String(value));
      const size = [...next.values()].reduce((sum, item) => sum + item.length, 0);
      if (size > quotaLimit) throw new Error("quota exceeded");
      quotaValues.set(key, String(value));
    },
    removeItem(key) {
      quotaValues.delete(key);
    }
  };
  const quotaContext = {
    window: {},
    document: context.document,
    location: context.location,
    URL,
    localStorage: quotaStorage,
  };
  vm.runInNewContext(
    personalSync,
    quotaContext,
    { filename: "v8/clair-sync.js:quota-smoke", timeout: 1000 }
  );
  assert.equal(
    quotaContext.window.ClairSync.restore({
      crFavMeals: "a".repeat(1000),
      crRecipeLearningV3: "c".repeat(4000),
      crRecipeNotesV31: "d".repeat(1000)
    }),
    false
  );
  assert.deepEqual(Object.fromEntries(quotaValues), {
    crFavMeals: "a".repeat(4000),
    crRecentRecipesV25: "b".repeat(1000)
  });
  return "16-key allowlist; technical keys isolated; rollback preserves the before-image";
});

await check("Compatible newest snapshot selection", () => {
  const publicSnapshotSource = between(
    foundation,
    "async snapshot(kind = 'manual') {",
    "async restoreLatest() {"
  );
  assert.match(publicSnapshotSource, /await putSnapshot\(kind\)/);
  assert.match(publicSnapshotSource, /verifyCurrentSnapshot\(written, kind\)/);
  const hashSource = between(foundation, "function fnv1a(text) {", "function appScopePath() {");
  const snapshotSource = between(
    foundation,
    "function compatibleSnapshot(record) {",
    "function post(type, extra = {}) {"
  );
  assert.match(snapshotSource, /await getSnapshot\(kind\)/);
  assert.match(snapshotSource, /record\.coreRevision !== CORE_REVISION/);
  assert.match(snapshotSource, /persisted\.fingerprint === record\.fingerprint/);
  const context = {
    APP_ID: "clair-repas",
    DATA_SCHEMA: 2,
    SCOPE_PATH: "/app/",
    SCOPE_ID: "scope-id",
    validPersonalData(values) {
      return (
        Object.prototype.toString.call(values) === "[object Object]" &&
        Object.entries(values).every(
          ([key, value]) =>
            CLAIR_REPAS_PERSONAL_KEYS.includes(key) && typeof value === "string"
        )
      );
    }
  };
  vm.runInNewContext(
    hashSource +
      snapshotSource +
      "\n;globalThis.__fnv1a = fnv1a;" +
      "\n;globalThis.__latestCompatibleSnapshot = latestCompatibleSnapshot;",
    context,
    { filename: "v8/clair-foundation.js:snapshot-smoke", timeout: 1000 }
  );

  const makeSnapshot = (capturedAt, overrides = {}) => {
    const values = overrides.values || { crDays: capturedAt };
    return {
      app: "clair-repas",
      dataSchema: 2,
      scopePath: "/app/",
      scopeId: "scope-id",
      capturedAt,
      values,
      fingerprint: "fnv1a:" + context.__fnv1a(JSON.stringify(values)),
      ...overrides
    };
  };
  const oldHealthy = makeSnapshot("2026-08-20T10:00:00.000Z");
  const newPreboot = makeSnapshot("2026-08-21T10:00:00.000Z");
  const incompatible = makeSnapshot("2026-08-22T10:00:00.000Z", { dataSchema: 1 });
  assert.equal(
    context.__latestCompatibleSnapshot([oldHealthy, incompatible, newPreboot]),
    newPreboot
  );
  assert.equal(
    context.__latestCompatibleSnapshot([
      { ...newPreboot, fingerprint: "fnv1a:tampered" },
      oldHealthy
    ]),
    oldHealthy
  );
  const cyclic = makeSnapshot("2026-08-22T11:00:00.000Z");
  cyclic.values.self = cyclic.values;
  const withBigInt = {
    ...makeSnapshot("2026-08-22T12:00:00.000Z"),
    values: { crDays: 1n }
  };
  const withMap = makeSnapshot("2026-08-22T13:00:00.000Z", {
    values: new Map([["crDays", "map-value"]])
  });
  const withNonString = makeSnapshot("2026-08-22T14:00:00.000Z", {
    values: { crDays: 42 }
  });
  assert.equal(
    context.__latestCompatibleSnapshot([
      cyclic,
      withBigInt,
      withMap,
      withNonString,
      newPreboot
    ]),
    newPreboot
  );
  return "newest valid snapshot wins; malformed records skipped";
});

await check("Recipe-library integrity", () => {
  const code = inlineScripts[0];
  const domMarker = "$('libraryCount').textContent=";
  const end = code.indexOf(domMarker);
  const helperStart = code.indexOf("function recipeText(");
  const helperEnd = code.indexOf("function inferFamily(");
  assert.ok(end > 0, "Recipe validation DOM marker missing");
  assert.ok(helperStart > 0 && helperEnd > helperStart, "Recipe helper markers missing");
  const sandbox = { window: {} };
  const probe =
    code.slice(0, end) +
    "\n" +
    code.slice(helperStart, helperEnd) +
    "\n;globalThis.__report = v73RecipeDiagnostics();";
  vm.runInNewContext(probe, sandbox, {
    filename: "index.html:recipe-data",
    timeout: 10000
  });
  const report = sandbox.__report;
  assert.ok(report.count > 0, "No recipes");
  assert.equal(report.count, report.indexCount);
  assert.equal(report.duplicates.length, 0);
  assert.equal(report.invalid.length, 0);
  return report.count + " unique valid recipes";
});

if (failures.length) {
  console.error("\nStatic PWA validation failed:");
  failures.forEach((failure) => console.error("  - " + failure));
  console.error("\n" + successes.length + " checks passed, " + failures.length + " failed.");
  process.exitCode = 1;
} else {
  successes.forEach((success) => console.log("✓ " + success));
  console.log("\n" + successes.length + " validation groups passed.");
}
