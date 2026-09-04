"use strict";

/*
 * Clair V8 Fondation — FOUNDATION.9 PRODUCTION HANDOVER PREPARED
 *
 * Objectifs :
 * - mise à jour atomique ;
 * - retour automatique vers la dernière version saine ;
 * - caches isolés par application + chemin GitHub Pages ;
 * - migration sûre du dernier cache sain foundation.5 ;
 * - aucune suppression ni modification des données personnelles.
 */

const APP_ID = "clair-repas";
const RELEASE = "8.0.0-foundation.15";
const FOUNDATION_LABEL = RELEASE.slice(RELEASE.lastIndexOf("-") + 1).toUpperCase();
const DATA_SCHEMA = 2;
const CLOUD_APP_ID = "clair-repas";
const CLOUD_ENABLED = true;
const CLOUD_DIRECT_SYNC_PROTOCOL = "clair-personal-sync/v1";
const CORE_REVISION = "sha256:4ebac027b5bb51414bbbc0684f44f4912b0b7146af47293d0b1c17058cd9a009";
const BOOT_GRACE_MS = 18000;

function fnv1a(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const SCOPE_PATH = new URL(self.registration.scope).pathname;
const SCOPE_ID = fnv1a(SCOPE_PATH);
const CLOUD_CONFIG_REVISION = fnv1a(
  `${CLOUD_APP_ID}\0${CLOUD_ENABLED}\0${CLOUD_DIRECT_SYNC_PROTOCOL}`
);
const CACHE_PREFIX = `clair-v8-${APP_ID}-${SCOPE_ID}-app-`;
const CURRENT_CACHE =
  `${CACHE_PREFIX}${RELEASE}-${CORE_REVISION.slice(7, 19)}-${CLOUD_CONFIG_REVISION}`;
const META_CACHE = `clair-v8-${APP_ID}-${SCOPE_ID}-meta`;
const META_URL = new URL("./__clair_v8_meta__", self.registration.scope).toString();
const STATUS_URL = new URL("./__clair_v8_status__", self.registration.scope).toString();

// Ancien espace de caches utilisé jusqu'à foundation.7. On le lit uniquement
// pour copier la dernière version saine vers le nouvel espace isolé.
const LEGACY_APP_PREFIX = "clair-repas-app-";
const LEGACY_META_CACHE = "clair-repas-v8-meta";
const LEGACY_META_URL = META_URL;

// Cache V7.5 historique : il reste admissible comme source de migration,
// mais jamais comme shell actif depuis l'activation du transfert Shopping V2.
const PRE_V8_STABLE_CACHES = ["clair-repas-v75-grands-chefs-20260816"];

const CORE_FILES = [
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
];
const CLOUD_ONLY_CORE_FILES = new Set([
  "./v8/vendor/supabase-js-2.111.0.js",
  "./v8/clair-cloud-sync.js"
]);
const LOCAL_SYNC_CORE_FILES = CORE_FILES.filter(
  path => !CLOUD_ONLY_CORE_FILES.has(path)
);
const FOUNDATION_CORE_FILES = LOCAL_SYNC_CORE_FILES.filter(
  path => path !== "./v8/clair-sync.js"
);
const PRE_SHOPPING_V2_CORE_FILES = CORE_FILES.filter(
  path => path !== "./shopping-v2-engine.js"
);
const PRE_SHOPPING_V2_LOCAL_SYNC_CORE_FILES = LOCAL_SYNC_CORE_FILES.filter(
  path => path !== "./shopping-v2-engine.js"
);
const PRE_SHOPPING_V2_FOUNDATION_CORE_FILES = FOUNDATION_CORE_FILES.filter(
  path => path !== "./shopping-v2-engine.js"
);
const CORE_DIGESTS = Object.freeze({
  "./": "sha256:b9e2008bfef162dc12018c56c783db26f273aed8004ef2fe4e0b987b98e54a11",
  "./index.html": "sha256:b9e2008bfef162dc12018c56c783db26f273aed8004ef2fe4e0b987b98e54a11",
  "./manifest.webmanifest": "sha256:49b30612587c379d6bb8c6d9ade4e299ff244b41f0bd03e2fcca0a5495834e2a",
  "./icon-192.png": "sha256:8d0d516fdcb7d76a40df62dc92d4f312a1557b9e105917026780e465c32fa9f8",
  "./icon-512.png": "sha256:334f3158730e33ad8232ea229a39f9193b45274f1a72b2f55467b1e625924f70",
  "./shopping-v2-engine.js": "sha256:43ff956d831627e4f8b27b1f63bc0ca817f4f30f4d33c75594964ee005335265",
  "./v8/clair-sync.js": "sha256:0599c8a11fcc775b6412440d872fce660d832d18f793fb4e87a5fbf7af7efb36",
  "./v8/vendor/supabase-js-2.111.0.js": "sha256:7396012594aa6d23bb373ebc25d1080bf3672fa847c3713f756520b40fd13453",
  "./v8/clair-foundation.js": "sha256:83786311d67be4be19af248b045735397ed988126b63bf9955c9cc5796d29ba2",
  "./v8/clair-cloud-sync.js": "sha256:6d05b667525082078ed76ae05f8166bcec52c6da05a44f9e27cedf8590b729c3",
  "./v8/version.json": "sha256:e748ea2ecfea92120e550e165dc7dc5557852bd3084fbfb1384eb64c431b10e2"
});

function appIndexUrl() {
  return new URL("./index.html", self.registration.scope).toString();
}

function appRootUrl() {
  return new URL("./", self.registration.scope).toString();
}

function isAppCache(name) {
  return Boolean(name && name.startsWith(CACHE_PREFIX));
}

async function cacheExists(cacheName) {
  if (!cacheName) return false;
  const names = await caches.keys();
  return names.includes(cacheName);
}

async function requiredCoreFiles(cacheName, cache) {
  if (cacheName === CURRENT_CACHE) return CORE_FILES;

  // Chaque génération de bootstrap conserve son propre ensemble atomique :
  // Foundation.8, Foundation.9 local, puis Foundation.9 avec transport cloud.
  try {
    const shell =
      (await cache.match(appIndexUrl())) ||
      (await cache.match(appRootUrl()));
    if (!shell) return FOUNDATION_CORE_FILES;
    const html = await shell.clone().text();
    const hasSync = html.includes("data-clair-v8-sync");
    const hasFoundation = html.includes("data-clair-v8-foundation");
    const hasCloud = html.includes("data-clair-v8-cloud-sync");
    const hasShoppingV2 = html.includes("shopping-v2-engine.js");
    if (!hasSync && !hasFoundation && !hasCloud) return [];
    const fullCoreFiles = hasShoppingV2 ? CORE_FILES : PRE_SHOPPING_V2_CORE_FILES;
    const localSyncCoreFiles = hasShoppingV2
      ? LOCAL_SYNC_CORE_FILES
      : PRE_SHOPPING_V2_LOCAL_SYNC_CORE_FILES;
    const foundationCoreFiles = hasShoppingV2
      ? FOUNDATION_CORE_FILES
      : PRE_SHOPPING_V2_FOUNDATION_CORE_FILES;
    if (hasCloud && hasSync && hasFoundation) return fullCoreFiles;
    if (hasCloud || (hasSync && !hasFoundation)) return null;
    if (hasSync) return localSyncCoreFiles;
    return foundationCoreFiles;
  } catch (_) {
    return CORE_FILES;
  }
}

async function cacheHasCore(cacheName, requiredFiles = null) {
  if (!cacheName) return false;
  try {
    if (!(await cacheExists(cacheName))) return false;
    const cache = await caches.open(cacheName);
    const files = requiredFiles || await requiredCoreFiles(cacheName, cache);
    if (!files) return false;
    for (const path of files) {
      const url = new URL(path, self.registration.scope).toString();
      if (!(await cache.match(url, { ignoreSearch: true }))) return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

// Les caches de release sont immuables par nom. Une validation positive peut
// donc être réutilisée pendant la vie du worker sans relire le gros shell à
// chaque requête d'asset.
const SHOPPING_V2_COMPATIBLE_CACHES = new Set();

async function cacheSupportsShoppingV2(cacheName) {
  if (SHOPPING_V2_COMPATIBLE_CACHES.has(cacheName)) return true;
  if (!cacheName || !(await cacheHasCore(cacheName))) return false;
  try {
    const cache = await caches.open(cacheName);
    const shellUrls = [appIndexUrl(), appRootUrl()];
    const engineTag = /<script\b[^>]*\bsrc=["']\.\/shopping-v2-engine\.js(?:[?#][^"']*)?["'][^>]*><\/script>/iu;
    for (const shellUrl of shellUrls) {
      const shell = await cache.match(shellUrl, { ignoreSearch: true });
      if (!shell) return false;
      const html = (await shell.clone().text()).replace(/<!--[\s\S]*?-->/gu, "");
      if (!engineTag.test(html)) return false;
      const senderStart = html.indexOf("function shoppingSendSelected(){");
      const senderEnd = html.indexOf("function bindShoppingInteractions()", senderStart);
      if (senderStart < 0 || senderEnd <= senderStart) return false;
      const sender = html.slice(senderStart, senderEnd);
      if (!sender.includes("const contract=shoppingContractV2();")) return false;
      if (sender.includes("shoppingContractV1()")) return false;
    }
    const engineUrl = new URL("./shopping-v2-engine.js", self.registration.scope).toString();
    const compatible = Boolean(await cache.match(engineUrl, { ignoreSearch: true }));
    if (compatible) SHOPPING_V2_COMPATIBLE_CACHES.add(cacheName);
    return compatible;
  } catch (_) {
    return false;
  }
}

async function readJsonState(cacheName, url) {
  try {
    if (!(await cacheExists(cacheName))) return {};
    const cache = await caches.open(cacheName);
    const response = await cache.match(url);
    if (!response) return {};
    const state = await response.json();
    return state && typeof state === "object" ? state : {};
  } catch (_) {
    return {};
  }
}

async function readState() {
  return readJsonState(META_CACHE, META_URL);
}

async function readLegacyState() {
  return readJsonState(LEGACY_META_CACHE, LEGACY_META_URL);
}

async function writeState(state) {
  const next = {
    ...state,
    app: APP_ID,
    dataSchema: DATA_SCHEMA,
    scopePath: SCOPE_PATH,
    scopeId: SCOPE_ID,
    updatedAt: new Date().toISOString()
  };

  const cache = await caches.open(META_CACHE);
  await cache.put(
    META_URL,
    new Response(JSON.stringify(next), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    })
  );
  return next;
}

async function copyCache(sourceName, targetName) {
  if (!sourceName || !targetName) return false;
  if (!(await cacheHasCore(sourceName))) return false;
  if (await cacheHasCore(targetName)) return true;

  await caches.delete(targetName);
  const source = await caches.open(sourceName);
  const target = await caches.open(targetName);

  try {
    const requests = await source.keys();
    for (const request of requests) {
      const response = await source.match(request);
      if (response) await target.put(request, response.clone());
    }

    if (!(await cacheHasCore(targetName))) {
      throw new Error("V8 migration: fallback cache invalid");
    }
    return true;
  } catch (error) {
    await caches.delete(targetName);
    throw error;
  }
}

function legacyReleaseFromCache(cacheName) {
  if (!cacheName || !cacheName.startsWith(LEGACY_APP_PREFIX)) return "legacy";
  return cacheName.slice(LEGACY_APP_PREFIX.length) || "legacy";
}

async function chooseLegacyHealthyCache(legacyState = {}) {
  const names = await caches.keys();
  const available = names.filter(name => name.startsWith(LEGACY_APP_PREFIX));
  const failed = legacyState.failedCache || null;

  const preferred = [
    legacyState.lastHealthyCache,
    legacyState.probation ? null : legacyState.activeCache,
    legacyState.previousCache
  ];

  for (const candidate of preferred) {
    if (!candidate || candidate === failed) continue;
    if (!available.includes(candidate)) continue;
    if (await cacheHasCore(candidate)) return candidate;
  }

  for (const candidate of available) {
    if (candidate === failed) continue;
    if (await cacheHasCore(candidate)) return candidate;
  }

  return null;
}

async function choosePreV8StableCache() {
  const names = await caches.keys();
  for (const candidate of PRE_V8_STABLE_CACHES) {
    if (!names.includes(candidate)) continue;
    if (await cacheHasCore(candidate)) return candidate;
  }
  return null;
}

async function migrateLegacyFallback() {
  let state = await readState();

  if (state.lastHealthyCache && (await cacheHasCore(state.lastHealthyCache))) {
    return state;
  }

  const legacyState = await readLegacyState();
  let migrationSource = await chooseLegacyHealthyCache(legacyState);
  let migrationKind = "v8-legacy";

  if (!migrationSource) {
    migrationSource = await choosePreV8StableCache();
    migrationKind = "v7.5-stable";
  }

  if (!migrationSource) return state;

  const migratedRelease =
    migrationKind === "v7.5-stable"
      ? "7.5-stable"
      : legacyReleaseFromCache(migrationSource);

  const migratedCache = `${CACHE_PREFIX}${migratedRelease}`;
  const copied = await copyCache(migrationSource, migratedCache);
  if (!copied) return state;

  state = await writeState({
    ...state,
    release:
      state.release ||
      (migrationKind === "v7.5-stable" ? "7.5" : legacyState.release || null),
    activeCache:
      state.activeCache && (await cacheHasCore(state.activeCache))
        ? state.activeCache
        : migratedCache,
    previousCache: state.previousCache || null,
    lastHealthyCache: migratedCache,
    failedCache: state.failedCache || null,
    probation: Boolean(state.probation),
    bootFailures: Number(state.bootFailures || 0),
    migratedFromLegacy: migrationSource,
    migratedFromKind: migrationKind,
    migratedAt: new Date().toISOString()
  });

  return state;
}

function syncTag() {
  return `<script src="./v8/clair-sync.js" data-clair-v8-sync data-clair-app="${APP_ID}" data-clair-release="${RELEASE}" data-clair-schema="${DATA_SCHEMA}" data-clair-core="${CORE_REVISION}"></script>`;
}

function foundationTag() {
  return `<script src="./v8/clair-foundation.js" data-clair-v8-foundation data-clair-app="${APP_ID}" data-clair-release="${RELEASE}" data-clair-schema="${DATA_SCHEMA}" data-clair-core="${CORE_REVISION}"></script>`;
}

function cloudSyncTag() {
  return `<script src="./v8/clair-cloud-sync.js" data-clair-v8-cloud-sync data-clair-app="${APP_ID}" data-clair-release="${RELEASE}" data-clair-schema="${DATA_SCHEMA}" data-clair-core="${CORE_REVISION}" data-clair-cloud-app="${CLOUD_APP_ID}" data-clair-cloud-enabled="${CLOUD_ENABLED}" data-clair-direct-sync="${CLOUD_DIRECT_SYNC_PROTOCOL}"></script>`;
}

function runtimeTags() {
  return `${syncTag()}\n${foundationTag()}\n${cloudSyncTag()}`;
}

function responseInit(response) {
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.delete("content-length");
  return {
    status: response.status,
    statusText: response.statusText,
    headers
  };
}

async function injectRuntime(response) {
  const text = await response.text();
  const hasSync = text.includes("data-clair-v8-sync");
  const hasFoundation = text.includes("data-clair-v8-foundation");
  const hasCloud = text.includes("data-clair-v8-cloud-sync");
  const markerCount = Number(hasSync) + Number(hasFoundation) + Number(hasCloud);
  if (markerCount > 0 && markerCount < 3) {
    throw new Error("V8 install: incomplete runtime bootstrap in HTML");
  }
  if (markerCount === 3) {
    return new Response(text, responseInit(response));
  }

  const tags = runtimeTags();
  const html = /<head(?:\s[^>]*)?>/i.test(text)
    ? text.replace(/<head(?:\s[^>]*)?>/i, match => `${match}\n${tags}`)
    : `${tags}\n${text}`;

  return new Response(html, responseInit(response));
}

async function validateVersionManifest(response) {
  const manifest = await response.clone().json();
  if (!manifest || manifest.foundationVersion !== RELEASE) {
    throw new Error(
      `V8 install: version.json mismatch (${manifest?.foundationVersion || "missing"} != ${RELEASE})`
    );
  }
  if (manifest.app !== APP_ID) {
    throw new Error(`V8 install: wrong app in version.json (${manifest.app || "missing"})`);
  }
  if (Number(manifest.dataSchema) !== DATA_SCHEMA) {
    throw new Error(`V8 install: wrong data schema in version.json (${manifest.dataSchema})`);
  }
}

function isTextCorePath(path) {
  return path === "./" || /\.(?:html|js|json|webmanifest|txt|text)$/i.test(path);
}

async function responseDigest(path, response) {
  let bytes = new Uint8Array(await response.clone().arrayBuffer());
  if (isTextCorePath(path)) {
    const normalized = new TextDecoder().decode(bytes).replace(/\r\n?/g, "\n");
    bytes = new TextEncoder().encode(normalized);
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

async function validateCoreDigest(path, response) {
  const expected = CORE_DIGESTS[path];
  if (!expected) throw new Error(`V8 install: missing digest for ${path}`);
  const actual = await responseDigest(path, response);
  if (actual !== expected) {
    throw new Error(`V8 install: digest mismatch for ${path}`);
  }
}

async function fetchRequired(path) {
  const url = new URL(path, self.registration.scope).toString();
  const response = await fetch(
    new Request(url, {
      cache: "no-store",
      credentials: "same-origin"
    })
  );

  if (!response.ok) {
    throw new Error(`V8 install: ${path} -> HTTP ${response.status}`);
  }

  await validateCoreDigest(path, response);

  if (path === "./v8/version.json") {
    await validateVersionManifest(response);
  }

  if (path === "./" || path === "./index.html") {
    return injectRuntime(response);
  }

  return response;
}

async function buildCandidateCache() {
  const state = await readState();
  if (state.failedCache === CURRENT_CACHE) {
    throw new Error("V8 install: candidate cache is quarantined after a failed boot");
  }
  if (await cacheHasCore(CURRENT_CACHE)) return;

  const referenced = new Set([
    state.activeCache,
    state.previousCache,
    state.lastHealthyCache
  ].filter(Boolean));
  if (referenced.has(CURRENT_CACHE)) {
    throw new Error("V8 install: refusing to replace a referenced cache");
  }

  await caches.delete(CURRENT_CACHE);
  const cache = await caches.open(CURRENT_CACHE);

  try {
    for (const path of CORE_FILES) {
      const response = await fetchRequired(path);
      const url = new URL(path, self.registration.scope).toString();
      await cache.put(url, response.clone());
    }

    if (!(await cacheHasCore(CURRENT_CACHE))) {
      throw new Error("V8 install: candidate cache invalid");
    }
  } catch (error) {
    await caches.delete(CURRENT_CACHE);
    throw error;
  }
}

async function choosePreviousCache(state = {}) {
  const names = await caches.keys();
  const available = names.filter(
    name => isAppCache(name) && name !== CURRENT_CACHE
  );

  const preferred = [
    state.lastHealthyCache,
    state.probation ? null : state.activeCache,
    state.previousCache
  ];

  for (const candidate of preferred) {
    if (!candidate || candidate === CURRENT_CACHE) continue;
    if (!available.includes(candidate)) continue;
    if (await cacheSupportsShoppingV2(candidate)) return candidate;
  }

  for (const candidate of available) {
    if (await cacheSupportsShoppingV2(candidate)) return candidate;
  }

  return null;
}

async function markCandidateActive() {
  const previousState = await readState();
  const previousCache = await choosePreviousCache(previousState);

  if (!(await cacheHasCore(CURRENT_CACHE))) {
    throw new Error("V8 activate: candidate cache invalid");
  }

  return writeState({
    ...previousState,
    release: RELEASE,
    activeCache: CURRENT_CACHE,
    previousCache,
    lastHealthyCache: previousState.lastHealthyCache || previousCache || null,
    failedCache: null,
    rollbackReason: null,
    probation: true,
    bootFailures: 0,
    // La probation commence réellement à la première navigation servie. Une
    // activation sans client ne doit pas faire expirer une version jamais testée.
    bootAttempted: false,
    bootStartedAt: 0,
    activatedAt: new Date().toISOString()
  });
}

async function rollbackIfNeeded(state, reason = "boot-failed") {
  let fallback = state?.previousCache || state?.lastHealthyCache || null;

  if (!fallback || fallback === CURRENT_CACHE || !(await cacheSupportsShoppingV2(fallback))) {
    fallback = await choosePreviousCache(state || {});
  }

  if (!fallback || fallback === CURRENT_CACHE || !(await cacheSupportsShoppingV2(fallback))) {
    return state;
  }

  return writeState({
    ...state,
    activeCache: fallback,
    previousCache: fallback,
    failedCache: CURRENT_CACHE,
    probation: false,
    bootAttempted: false,
    bootStartedAt: 0,
    rollbackReason: reason,
    rolledBackAt: new Date().toISOString()
  });
}

async function currentServingState() {
  let state = await readState();

  if (!state.activeCache || !(await cacheHasCore(state.activeCache))) {
    state = await rollbackIfNeeded(state, "invalid-active-cache");
  }

  if (
    state.probation &&
    state.bootAttempted &&
    state.bootStartedAt &&
    Date.now() - Number(state.bootStartedAt) > BOOT_GRACE_MS
  ) {
    state = await rollbackIfNeeded(state, "boot-watchdog-timeout");
  }

  return state;
}

async function startBootAttemptIfNeeded(state) {
  if (
    !state?.probation ||
    state.activeCache !== CURRENT_CACHE ||
    state.bootStartedAt
  ) return state;

  return writeState({
    ...state,
    bootAttempted: true,
    bootStartedAt: Date.now()
  });
}

async function startBootAttemptSafely(state) {
  try {
    return await startBootAttemptIfNeeded(state);
  } catch (_) {
    // Une panne du méta-cache ne doit ni casser la navigation, ni mélanger un
    // ancien HTML avec les assets du candidat. On conserve donc le même cache.
    return state;
  }
}

async function serveFromCache(cacheName, request) {
  if (!cacheName || !(await cacheExists(cacheName))) return null;

  const cache = await caches.open(cacheName);
  let response = await cache.match(request, { ignoreSearch: true });

  if (!response && request.mode === "navigate") {
    response =
      (await cache.match(appIndexUrl())) ||
      (await cache.match(appRootUrl()));
  }

  return response || null;
}

function isMainNavigation(url, request) {
  if (request.mode !== "navigate") return false;
  const scope = new URL(self.registration.scope);
  const base = scope.pathname.endsWith("/")
    ? scope.pathname
    : `${scope.pathname}/`;
  return url.pathname === base || url.pathname === `${base}index.html`;
}

async function cleanupCaches(state) {
  const keep = new Set(
    [
      META_CACHE,
      CURRENT_CACHE,
      state?.activeCache,
      state?.previousCache,
      state?.lastHealthyCache
    ].filter(Boolean)
  );

  const names = await caches.keys();
  await Promise.all(
    names
      .filter(name => isAppCache(name) && !keep.has(name))
      .map(name => caches.delete(name))
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function statusResponse() {
  const state = await readState();
  const cacheNames = await caches.keys();
  const currentHealthy = Boolean(
    state.activeCache === CURRENT_CACHE &&
    state.lastHealthyCache === CURRENT_CACHE &&
    state.probation === false &&
    (await cacheHasCore(CURRENT_CACHE))
  );
  const rolledBack = Boolean(
    state.failedCache === CURRENT_CACHE &&
    state.activeCache &&
    state.activeCache !== CURRENT_CACHE &&
    state.probation === false &&
    (await cacheHasCore(state.activeCache))
  );

  const title = currentHealthy
    ? `${FOUNDATION_LABEL} SAINE — mise à jour validée`
    : rolledBack
      ? "RETOUR AUTOMATIQUE — version précédente restaurée"
      : "MISE À JOUR EN COURS OU À VÉRIFIER";

  const result = currentHealthy ? "HEALTHY" : rolledBack ? "ROLLBACK" : "PENDING";
  const details = {
    release: RELEASE,
    coreRevision: CORE_REVISION,
    result,
    scopePath: SCOPE_PATH,
    scopeId: SCOPE_ID,
    activeCache: state.activeCache || null,
    previousCache: state.previousCache || null,
    lastHealthyCache: state.lastHealthyCache || null,
    failedCache: state.failedCache || null,
    rollbackReason: state.rollbackReason || null,
    probation: state.probation,
    bootAttempted: Boolean(state.bootAttempted),
    bootFailures: state.bootFailures,
    migratedFromLegacy: state.migratedFromLegacy || null,
    caches: cacheNames.filter(name => name === META_CACHE || isAppCache(name))
  };

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Clair V8 — statut ${escapeHtml(FOUNDATION_LABEL.toLowerCase())}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; background: #f5f7f9; color: #173042; }
  .card { max-width: 800px; margin: 40px auto; background: white; border-radius: 18px; padding: 28px; box-shadow: 0 10px 35px rgba(0,0,0,.08); }
  h1 { font-size: 24px; margin: 0 0 18px; }
  .lead { font-weight: 700; font-size: 18px; line-height: 1.45; }
  pre { white-space: pre-wrap; background: #eef3f6; padding: 18px; border-radius: 12px; overflow-wrap: anywhere; }
</style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p class="lead">${escapeHtml(
      currentHealthy
        ? "La fondation stable est active. Les caches sont désormais isolés par application et par chemin, avec une version saine précédente conservée comme secours."
        : rolledBack
          ? "La candidate a été refusée et Clair Repas sert automatiquement la dernière version saine."
          : "Le navigateur n’a pas encore terminé la validation de la nouvelle fondation."
    )}</p>
    <pre>${escapeHtml(JSON.stringify(details, null, 2))}</pre>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      await migrateLegacyFallback();
      await buildCandidateCache();
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      await migrateLegacyFallback();
      await markCandidateActive();
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", event => {
  const data = event.data || {};

  if (data.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (data.app && data.app !== APP_ID) return;

  const currentBootMessage =
    data.release === RELEASE && data.coreRevision === CORE_REVISION;

  if (data.type === "CLAIR_V8_BOOT_OK" && currentBootMessage) {
    event.waitUntil(
      (async () => {
        const state = await readState();
        if (state.activeCache !== CURRENT_CACHE) return;

        const healthy = await writeState({
          ...state,
          probation: false,
          bootFailures: 0,
          bootStartedAt: 0,
          lastHealthyCache: CURRENT_CACHE,
          healthyFingerprint: data.fingerprint || null,
          validatedAt: new Date().toISOString()
        });

        await cleanupCaches(healthy);
      })()
    );
    return;
  }

  if (data.type === "CLAIR_V8_BOOT_FAIL" && currentBootMessage) {
    event.waitUntil(
      (async () => {
        const state = await readState();

        const failed = await writeState({
          ...state,
          bootFailures: Number(state.bootFailures || 0) + 1,
          lastBootError: {
            reason: data.reason || "runtime-error",
            detail: data.detail || "",
            at: new Date().toISOString()
          }
        });

        const rolled = await rollbackIfNeeded(
          failed,
          data.reason || "runtime-error"
        );

        try {
          const client = event.source?.id
            ? await self.clients.get(event.source.id)
            : null;

          if (
            client &&
            "navigate" in client &&
            rolled?.activeCache &&
            rolled.activeCache !== CURRENT_CACHE
          ) {
            await client.navigate(client.url);
          }
        } catch (_) {}
      })()
    );
    return;
  }

  if (data.type === "CLAIR_V8_FORCE_ROLLBACK") {
    event.waitUntil(
      (async () => {
        const state = await readState();
        await rollbackIfNeeded(state, "manual-rollback");
      })()
    );
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.toString() === STATUS_URL) {
    event.respondWith(statusResponse());
    return;
  }

  if (isMainNavigation(url, request)) {
    event.respondWith(
      (async () => {
        const state = await currentServingState();
        const servingState = await startBootAttemptSafely(state);

        const cached = await cacheSupportsShoppingV2(servingState.activeCache)
          ? await serveFromCache(servingState.activeCache, request)
          : null;
        if (cached) return cached;

        const previous = await cacheSupportsShoppingV2(servingState.previousCache)
          ? await serveFromCache(servingState.previousCache, request)
          : null;
        if (previous) return previous;

        return fetch(request, { cache: "no-store" });
      })()
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request, { cache: "no-store" });
        } catch (_) {
          const state = await currentServingState();
          const servingState = await startBootAttemptSafely(state);
          if (!(await cacheSupportsShoppingV2(servingState.activeCache))) {
            return Response.error();
          }
          return (await serveFromCache(servingState.activeCache, request)) || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const state = await currentServingState();

      const cached = await cacheSupportsShoppingV2(state.activeCache)
        ? await serveFromCache(state.activeCache, request)
        : null;
      if (cached) return cached;

      try {
        return await fetch(request);
      } catch (_) {
        const previous = await cacheSupportsShoppingV2(state.previousCache)
          ? await serveFromCache(state.previousCache, request)
          : null;
        return previous || Response.error();
      }
    })()
  );
});
