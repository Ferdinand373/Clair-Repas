#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(ROOT, 'v8/clair-cloud-repair.js'), 'utf8');
const html = readFileSync(resolve(ROOT, 'repair-cloud-from-local.html'), 'utf8');
const serviceWorker = readFileSync(resolve(ROOT, 'sw.js'), 'utf8');
const indexHtml = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
const versionFile = JSON.parse(readFileSync(resolve(ROOT, 'v8/version.json'), 'utf8'));

const context = { console };
context.globalThis = context;
vm.runInNewContext(source, context, {
  filename: 'v8/clair-cloud-repair.js',
  timeout: 3000
});
const api = context.ClairCloudRepair;
assert.ok(api, 'ClairCloudRepair API was not exported');

const {
  CloudRepairEngine,
  MemoryTransport,
  createSupabaseTransport,
  normalizeRemoteLocalStorageValue,
  constants
} = api;
const USER_ID = 'user-phase-3';
const OTHER_USER_ID = 'other-user';
const VERSION = Object.freeze({
  foundationVersion: '8.0.0-foundation.15',
  productVersion: '7.5',
  cloudAppId: 'clair-repas',
  cloudEnabled: false,
  bootstrapGeneration: 'bootstrap-v2'
});

const successes = [];
const failures = [];

async function check(name, callback) {
  try {
    await callback();
    successes.push(name);
  } catch (error) {
    failures.push(name + '\n' + (error?.stack || error));
  }
}

class TestStorage {
  constructor(entries = {}) {
    this.values = new Map(
      Object.entries(entries).map(([key, value]) => [key, String(value)])
    );
    this.reads = [];
    this.writes = [];
    this.removals = [];
  }

  getItem(key) {
    this.reads.push(key);
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.writes.push([key, String(value)]);
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.removals.push(key);
    this.values.delete(key);
  }
}

function clone(value) {
  return structuredClone(value);
}

function clock(start = '2026-08-28T12:00:00.000Z') {
  let tick = 0;
  const startTime = Date.parse(start);
  return () => new Date(startTime + tick++ * 1000).toISOString();
}

function localValues(favoriteCount = constants.EXPECTED_LOCAL_FAVORITES, extras = {}) {
  return {
    crFavMeals: JSON.stringify(
      Array.from({ length: favoriteCount }, (_, index) => 'local-favorite-' + (index + 1))
    ),
    ...extras
  };
}

function remoteRow(key, value, options = {}) {
  const deletedAt = options.deletedAt ?? null;
  return {
    id: options.id || 'row-' + key + '-' + (options.userId || USER_ID),
    user_id: options.userId || USER_ID,
    app_id: options.appId || 'clair-repas',
    data_key: key,
    payload: options.payload || {
      value,
      source_device: 'Ancien appareil',
      synced_at: '2026-08-20T10:00:00.000Z',
      integration: 'legacy'
    },
    schema_version: options.schemaVersion ?? 2,
    revision: options.revision ?? 7,
    deleted_at: deletedAt,
    updated_at: options.updatedAt || '2026-08-20T10:00:00.000Z',
    last_device_id: options.lastDeviceId ?? 'device-before'
  };
}

function makeHarness(options = {}) {
  const storage = new TestStorage(options.local || localValues());
  const transport = new MemoryTransport({
    userId: USER_ID,
    rows: options.rows || [],
    onList: options.onList,
    onBeforeWrite: options.onBeforeWrite,
    failRepairAt: options.failRepairAt,
    failRollbackAt: options.failRollbackAt,
    sessionUserId: options.sessionUserId,
    verifiedUserId: options.verifiedUserId,
    authUserId: options.authUserId
  });
  const suppliedVersion = options.version || VERSION;
  let versionCalls = 0;
  const versionProvider = async () => {
    versionCalls += 1;
    return clone(
      typeof suppliedVersion === 'function'
        ? suppliedVersion(versionCalls)
        : suppliedVersion
    );
  };
  const engine = new CloudRepairEngine({
    storage,
    transport,
    versionProvider,
    now: options.now || clock(),
    deviceLabel: 'Windows • Edge'
  });
  return { storage, transport, engine, get versionCalls() { return versionCalls; } };
}

async function analyzeAndRepair(harness, confirmations = [true, true]) {
  const analysis = await harness.engine.analyze();
  let confirmationIndex = 0;
  const messages = [];
  const result = await harness.engine.repair({
    analysis,
    confirm(message) {
      messages.push(message);
      return confirmations[confirmationIndex++];
    }
  });
  return { analysis, result, messages };
}

function scopedRows(transport, userId = USER_ID, appId = 'clair-repas') {
  return transport.rows.filter(
    (row) => row.user_id === userId && row.app_id === appId
  );
}

function rowFor(transport, key, userId = USER_ID, appId = 'clair-repas') {
  return scopedRows(transport, userId, appId).find((row) => row.data_key === key) || null;
}

await check('1. local 3 favoris / cloud 2 favoris legacy', async () => {
  const harness = makeHarness({
    rows: [
      remoteRow('crFavMeals', ['cloud-1', 'cloud-2'], {
        schemaVersion: 1,
        revision: 12
      })
    ]
  });
  const { analysis, result } = await analyzeAndRepair(harness);
  assert.equal(analysis.localFavoriteCount, 3);
  assert.equal(analysis.cloudFavoriteCount, 2);
  assert.equal(result.status, 'success');
  assert.ok(result.lines.includes('3 FAVORIS CONFIRMÉS'));
  assert.equal(JSON.parse(rowFor(harness.transport, 'crFavMeals').payload.value).length, 3);
});

await check('2. refus local 1 favori', async () => {
  const harness = makeHarness({ local: localValues(1) });
  const analysis = await harness.engine.analyze();
  assert.equal(analysis.repairAllowed, false);
  assert.equal(analysis.localFavoriteCount, 1);
  assert.equal(harness.transport.writeAttempts.length, 0);
  assert.equal(harness.storage.writes.length, 0);
  await assert.rejects(
    harness.engine.repair({ analysis, confirm: () => true }),
    /nouvelle analyse réussie/i
  );
});

await check('3. refus local 2 favoris', async () => {
  const harness = makeHarness({ local: localValues(2) });
  const analysis = await harness.engine.analyze();
  assert.equal(analysis.repairAllowed, false);
  assert.equal(analysis.localFavoriteCount, 2);
  assert.equal(harness.transport.writeAttempts.length, 0);
});

await check('4. refus local 4 favoris', async () => {
  const harness = makeHarness({ local: localValues(4) });
  const analysis = await harness.engine.analyze();
  assert.equal(analysis.repairAllowed, false);
  assert.equal(analysis.localFavoriteCount, 4);
  assert.equal(harness.transport.writeAttempts.length, 0);
});

await check('4a. refus local crFavMeals absent', async () => {
  const harness = makeHarness({ local: { crDays: '7' } });
  const analysis = await harness.engine.analyze();
  assert.equal(analysis.repairAllowed, false);
  assert.equal(analysis.localFavoriteCount, null);
  assert.equal(harness.transport.writeAttempts.length, 0);
  assert.equal(harness.storage.writes.length, 0);
});

await check('4b. refus local crFavMeals invalide', async () => {
  for (const crFavMeals of ['{invalide', '{"not":"array"}', 'null']) {
    const local = { crFavMeals };
    const harness = makeHarness({ local });
    const analysis = await harness.engine.analyze();
    assert.equal(analysis.repairAllowed, false);
    assert.equal(harness.transport.writeAttempts.length, 0);
    assert.equal(harness.storage.writes.length, 0);
  }
});

await check('4c. le nombre de favoris cloud ne décide jamais de l’autorisation', async () => {
  for (const cloudFavoriteCount of [0, 1, 2, 3, 4, 7]) {
    const cloudFavorites = Array.from(
      { length: cloudFavoriteCount },
      (_, index) => 'cloud-favorite-' + (index + 1)
    );
    const harness = makeHarness({
      rows: [remoteRow('crFavMeals', cloudFavorites, { schemaVersion: 1 })]
    });
    const analysis = await harness.engine.analyze();
    assert.equal(analysis.localFavoriteCount, constants.EXPECTED_LOCAL_FAVORITES);
    assert.equal(analysis.cloudFavoriteCount, cloudFavoriteCount);
    assert.equal(analysis.repairAllowed, true);
    assert.equal(harness.transport.writeAttempts.length, 0);
  }
});

await check('5. lecture schema 1 JSON natif', async () => {
  const native = [{ id: 'legacy' }, true, 4];
  assert.equal(
    normalizeRemoteLocalStorageValue(native, 'crHistoryV13'),
    JSON.stringify(native)
  );
  const harness = makeHarness({
    local: localValues(constants.EXPECTED_LOCAL_FAVORITES, { crHistoryV13: '[{"id":"local"}]' }),
    rows: [
      remoteRow('crFavMeals', ['cloud-1', 'cloud-2'], { schemaVersion: 1 }),
      remoteRow('crHistoryV13', native, { schemaVersion: 1 })
    ]
  });
  const analysis = await harness.engine.analyze();
  assert.equal(
    analysis.preview.find((entry) => entry.key === 'crHistoryV13').remoteSchemaVersion,
    1
  );
});

await check('6. lecture schema 2 Foundation string exacte', async () => {
  const exact = ' [ "cloud-1", "cloud-2" ] ';
  assert.equal(normalizeRemoteLocalStorageValue(exact, 'crFavMeals'), exact);
  const harness = makeHarness({ rows: [remoteRow('crFavMeals', exact)] });
  const analysis = await harness.engine.analyze();
  assert.equal(analysis.cloudFavoriteCount, 2);
  assert.equal(analysis.remoteRows[0].payload.value, exact);
});

await check('7. ligne locale présente / distante présente', async () => {
  const harness = makeHarness({
    rows: [remoteRow('crFavMeals', '["old-1","old-2"]', { revision: 19 })]
  });
  const analysis = await harness.engine.analyze();
  const entry = analysis.preview.find((item) => item.key === 'crFavMeals');
  assert.equal(entry.action, 'update');
  assert.equal(entry.targetRevision, 20);
});

await check('8. ligne locale présente / distante absente', async () => {
  const harness = makeHarness({ rows: [] });
  const analysis = await harness.engine.analyze();
  const entry = analysis.preview.find((item) => item.key === 'crFavMeals');
  assert.equal(entry.action, 'insert');
  assert.equal(entry.targetRevision, 1);
  const result = await harness.engine.repair({ analysis, confirm: () => true });
  assert.equal(result.status, 'success');
  assert.equal(rowFor(harness.transport, 'crFavMeals').revision, 1);
});

await check('9. locale absente / distante active donne un tombstone', async () => {
  const harness = makeHarness({
    rows: [
      remoteRow('crFavMeals', '["cloud-1","cloud-2"]'),
      remoteRow('crDays', '14', { revision: 4 })
    ]
  });
  const analysis = await harness.engine.analyze();
  const entry = analysis.preview.find((item) => item.key === 'crDays');
  assert.equal(entry.action, 'tombstone');
  assert.equal(entry.targetRevision, 5);
  const result = await harness.engine.repair({ analysis, confirm: () => true });
  assert.equal(result.status, 'success');
  assert.ok(rowFor(harness.transport, 'crDays').deleted_at);
  assert.equal(rowFor(harness.transport, 'crDays').payload.value, null);
});

await check('10. tombstone distant conservé sans réécriture', async () => {
  const tombstone = remoteRow('crDays', null, {
    revision: 8,
    deletedAt: '2026-08-21T08:00:00.000Z'
  });
  const harness = makeHarness({
    rows: [remoteRow('crFavMeals', '["cloud-1","cloud-2"]'), tombstone]
  });
  const analysis = await harness.engine.analyze();
  const entry = analysis.preview.find((item) => item.key === 'crDays');
  assert.equal(entry.action, 'preserve-tombstone');
  const result = await harness.engine.repair({ analysis, confirm: () => true });
  assert.equal(result.status, 'success');
  assert.equal(rowFor(harness.transport, 'crDays').revision, 8);
  assert.equal(
    harness.transport.writeAttempts.some((write) => write.record.data_key === 'crDays'),
    false
  );
});

await check('11. CAS réussi avec révision distante attendue', async () => {
  const harness = makeHarness({
    rows: [remoteRow('crFavMeals', '["before-1","before-2"]', { revision: 31 })]
  });
  const { result, messages } = await analyzeAndRepair(harness);
  assert.equal(result.status, 'success');
  assert.equal(rowFor(harness.transport, 'crFavMeals').revision, 32);
  assert.equal(harness.transport.writeAttempts[0].expectedRevision, 31);
  assert.deepEqual(messages, [constants.FIRST_CONFIRMATION, constants.SECOND_CONFIRMATION]);
  assert.equal(harness.transport.writeAttempts[0].record.schema_version, 2);
  assert.equal(
    harness.transport.writeAttempts[0].record.payload.integration,
    'clair-foundation15-cloud-repair'
  );
  assert.equal(
    harness.transport.writeAttempts[0].record.payload.source_device,
    'Windows • Edge'
  );
});

await check('12. CAS refusé sans écriture réussie', async () => {
  const harness = makeHarness({
    rows: [remoteRow('crFavMeals', '["before-1","before-2"]', { revision: 5 })],
    onBeforeWrite({ transport, phase, phaseAttempt }) {
      if (phase === 'repair' && phaseAttempt === 1) {
        transport.forceMutate('crFavMeals', { revision: 6 });
      }
    }
  });
  const { result } = await analyzeAndRepair(harness);
  assert.equal(result.status, 'cas-refused');
  assert.equal(result.writes, 0);
  assert.equal(harness.transport.successfulWrites.length, 0);
});

await check('13. changement cloud avant première écriture donne zéro écriture', async () => {
  const harness = makeHarness({
    rows: [remoteRow('crFavMeals', '["before-1","before-2"]', { revision: 9 })],
    onList({ transport, count }) {
      if (count === 2) {
        transport.forceMutate('crFavMeals', {
          revision: 10,
          payload: { value: '["concurrent"]' }
        });
      }
    }
  });
  const { result } = await analyzeAndRepair(harness);
  assert.equal(result.status, 'cloud-changed');
  assert.equal(result.title, 'LE CLOUD A CHANGÉ');
  assert.equal(result.writes, 0);
  assert.equal(harness.transport.writeAttempts.length, 0);
});

await check('14. échec après première écriture déclenche un rollback sûr', async () => {
  const beforeFavorites = remoteRow('crFavMeals', ['legacy-1', 'legacy-2'], {
    schemaVersion: 1,
    revision: 14,
    lastDeviceId: 'legacy-device'
  });
  const beforeRecent = remoteRow('crRecentRecipesV25', '["remote"]', { revision: 20 });
  const harness = makeHarness({
    local: localValues(constants.EXPECTED_LOCAL_FAVORITES, { crRecentRecipesV25: '["local"]' }),
    rows: [beforeFavorites, beforeRecent],
    failRepairAt: 2
  });
  const { result } = await analyzeAndRepair(harness);
  assert.equal(result.status, 'rollback-complete');
  assert.equal(result.title, 'ROLLBACK EFFECTUÉ');
  const restored = rowFor(harness.transport, 'crFavMeals');
  assert.equal(JSON.stringify(restored.payload), JSON.stringify(beforeFavorites.payload));
  assert.equal(restored.last_device_id, 'legacy-device');
  assert.equal(restored.deleted_at, beforeFavorites.deleted_at);
  assert.equal(restored.schema_version, 2, 'RLS forbids writing schema 1 during rollback');
  assert.equal(restored.revision, 16, 'rollback must create a new revision');
  assert.ok(harness.storage.writes[0][0].startsWith(constants.BACKUP_PREFIX));
});

await check('15. échec rollback produit l’alerte manuelle', async () => {
  const harness = makeHarness({
    local: localValues(constants.EXPECTED_LOCAL_FAVORITES, { crRecentRecipesV25: '["local"]' }),
    rows: [
      remoteRow('crFavMeals', '["remote-1","remote-2"]'),
      remoteRow('crRecentRecipesV25', '["remote"]')
    ],
    failRepairAt: 2,
    failRollbackAt: 1
  });
  const { result } = await analyzeAndRepair(harness);
  assert.equal(result.status, 'rollback-incomplete');
  assert.equal(
    result.title,
    'ROLLBACK INCOMPLET — INTERVENTION MANUELLE REQUISE'
  );
  assert.equal(result.rollback.complete, false);
  assert.equal(result.rollback.failures.length, 1);
});

await check('16. sauvegarde JSON complète et téléchargeable', async () => {
  const rows = [
    remoteRow('crFavMeals', ['legacy-1', 'legacy-2'], { schemaVersion: 1 }),
    remoteRow('crDays', '14', {
      schemaVersion: 2,
      revision: 44,
      deletedAt: '2026-08-22T00:00:00.000Z'
    })
  ];
  const harness = makeHarness({ rows });
  const analysis = await harness.engine.analyze();
  assert.equal(analysis.backup.format, 'clair-repas-cloud-backup/v1');
  assert.equal(analysis.backup.user_id, USER_ID);
  assert.equal(analysis.backup.app_id, 'clair-repas');
  assert.equal(analysis.backup.rows.length, 2);
  for (const row of analysis.backup.rows) {
    for (const field of [
      'user_id',
      'app_id',
      'data_key',
      'payload',
      'schema_version',
      'revision',
      'deleted_at',
      'updated_at',
      'last_device_id'
    ]) assert.ok(Object.hasOwn(row, field), field + ' missing from backup');
  }
  assert.match(analysis.backupKey, /^clair\.repair\.cloud\.before\./);
  assert.equal(
    analysis.backupFilename,
    'clair-repas-cloud-backup-2026-08-28-120000.json'
  );
  assert.equal(
    JSON.stringify(JSON.parse(analysis.backupJson)),
    JSON.stringify(analysis.backup)
  );
});

await check('17. exclusion stricte des clés techniques et futures', async () => {
  const harness = makeHarness({
    local: {
      ...localValues(),
      crHealthProbeV73: 'secret-health',
      crRecipeIdMigrationV39: 'technical-migration',
      crWelcomeV7: 'technical-welcome',
      crFutureUnknown: 'future'
    }
  });
  const analysis = await harness.engine.analyze();
  for (const key of [
    'crHealthProbeV73',
    'crRecipeIdMigrationV39',
    'crWelcomeV7',
    'crFutureUnknown'
  ]) {
    assert.equal(harness.storage.reads.includes(key), false, key + ' was read');
    assert.equal(Object.hasOwn(analysis.localValues, key), false, key + ' was captured');
    assert.equal(analysis.preview.some((entry) => entry.key === key), false);
  }
  const remoteTechnical = makeHarness({
    rows: [
      remoteRow('crFavMeals', '["one","two"]'),
      remoteRow('crHealthProbeV73', 'forbidden')
    ]
  });
  await assert.rejects(remoteTechnical.engine.analyze(), /hors frontière personnelle/i);
  assert.equal(remoteTechnical.transport.writeAttempts.length, 0);
});

await check('18. exactement 16 clés autorisées', () => {
  assert.equal(constants.ALLOWED_KEYS.length, 16);
  assert.equal(new Set(constants.ALLOWED_KEYS).size, 16);
  assert.deepEqual(Array.from(constants.ALLOWED_KEYS), [
    'crFavMeals',
    'crRecentRecipesV25',
    'crRecipeReactionsV3',
    'crRecipeLearningV3',
    'crRecipeNotesV31',
    'crPeople',
    'crDays',
    'crMode',
    'crTimeAvailable',
    'crMealContext',
    'crMealUsageV19',
    'crCourseUsageV37',
    'crBrowserDiscoveryV35',
    'crBrowserDecksV35',
    'crStateV13',
    'crHistoryV13'
  ]);
});

await check('19. mauvaise version Foundation bloque tout avant authentification', async () => {
  for (const patch of [
    { foundationVersion: '8.0.0-foundation.14' },
    { productVersion: '8.0' },
    { cloudAppId: 'autre-app' },
    { bootstrapGeneration: 'bootstrap-v1' }
  ]) {
    const harness = makeHarness({ version: { ...VERSION, ...patch } });
    await assert.rejects(harness.engine.analyze(), /doit être exactement|Foundation/i);
    assert.equal(harness.transport.authCount, 0);
    assert.equal(harness.transport.listCount, 0);
    assert.equal(harness.transport.writeAttempts.length, 0);
  }
});

await check('20. cloudEnabled=true bloque totalement l’outil', async () => {
  const harness = makeHarness({ version: { ...VERSION, cloudEnabled: true } });
  await assert.rejects(harness.engine.analyze(), /cloudEnabled doit rester strictement false/);
  assert.equal(harness.transport.authCount, 0);
  assert.equal(harness.transport.listCount, 0);
  assert.equal(harness.storage.writes.length, 0);
});

await check('21. autre utilisateur et autre application ne sont jamais touchés', async () => {
  const otherUser = remoteRow('crFavMeals', '["other-user"]', {
    userId: OTHER_USER_ID,
    revision: 71
  });
  const otherApp = remoteRow('crFavMeals', '["other-app"]', {
    appId: 'clair-courses',
    revision: 82
  });
  const harness = makeHarness({
    rows: [
      remoteRow('crFavMeals', '["before-1","before-2"]'),
      otherUser,
      otherApp
    ]
  });
  const beforeOtherUser = clone(otherUser);
  const beforeOtherApp = clone(otherApp);
  const { result } = await analyzeAndRepair(harness);
  assert.equal(result.status, 'success');
  assert.equal(
    JSON.stringify(rowFor(harness.transport, 'crFavMeals', OTHER_USER_ID)),
    JSON.stringify(beforeOtherUser)
  );
  assert.equal(
    JSON.stringify(rowFor(harness.transport, 'crFavMeals', USER_ID, 'clair-courses')),
    JSON.stringify(beforeOtherApp)
  );
  assert.ok(
    harness.transport.writeAttempts.every(
      (write) =>
        write.record.user_id === USER_ID && write.record.app_id === 'clair-repas'
    )
  );
});

await check('22. l’outil n’est ni injecté ni remplacé par le service worker', () => {
  assert.doesNotMatch(html, /serviceWorker\s*\.\s*register/i);
  assert.doesNotMatch(source, /serviceWorker\s*\.\s*register/i);
  assert.doesNotMatch(indexHtml, /repair-cloud-from-local\.html/i);
  assert.match(
    html,
    /<script src="\.\/v8\/vendor\/supabase-js-2\.111\.0\.js"><\/script>\s*<script src="\.\/v8\/clair-cloud-repair\.js"><\/script>/
  );
  assert.match(serviceWorker, /const CLOUD_REPAIR_URL = new URL\(/);
  assert.match(
    serviceWorker,
    /if \(isCloudRepairNavigation\(url, request\)\) \{\s*event\.respondWith\(fetch\(request, \{ cache: "no-store" \}\)\);\s*return;\s*\}/
  );
  const repairBranch = serviceWorker.indexOf('if (isCloudRepairNavigation(url, request))');
  const mainBranch = serviceWorker.indexOf('if (isMainNavigation(url, request))');
  assert.ok(repairBranch > 0 && repairBranch < mainBranch);
  const branchBody = serviceWorker.slice(
    repairBranch,
    serviceWorker.indexOf('if (isMainNavigation', repairBranch)
  );
  assert.doesNotMatch(branchBody, /serveFromCache|injectRuntime|appIndexUrl/);

  const functionMatch = serviceWorker.match(
    /function isCloudRepairNavigation\(url, request\) \{[\s\S]*?\n\}/
  );
  assert.ok(functionMatch, 'Missing repair navigation matcher');
  const swContext = {
    URL,
    CLOUD_REPAIR_URL: 'https://example.test/Clair-Repas/repair-cloud-from-local.html'
  };
  vm.runInNewContext(
    functionMatch[0] +
      ';matchesExact=isCloudRepairNavigation(new URL(CLOUD_REPAIR_URL),{mode:"navigate"});' +
      'matchesQuery=isCloudRepairNavigation(new URL(CLOUD_REPAIR_URL+"?v=1"),{mode:"navigate"});' +
      'matchesMain=isCloudRepairNavigation(new URL("https://example.test/Clair-Repas/index.html"),{mode:"navigate"});',
    swContext
  );
  assert.equal(swContext.matchesExact, true);
  assert.equal(swContext.matchesQuery, true);
  assert.equal(swContext.matchesMain, false);
});

await check('23. les deux confirmations sont obligatoires', async () => {
  for (const confirmations of [[false], [true, false]]) {
    const harness = makeHarness({
      rows: [remoteRow('crFavMeals', '["before-1","before-2"]')]
    });
    const { result, messages } = await analyzeAndRepair(harness, confirmations);
    assert.equal(result.status, 'cancelled');
    assert.equal(harness.transport.writeAttempts.length, 0);
    assert.equal(messages.length, confirmations.length);
  }
});

await check('24. getSession puis getUser et identité correspondante', async () => {
  const calls = [];
  const client = {
    auth: {
      async getSession() {
        calls.push('getSession');
        return { data: { session: { user: { id: USER_ID } } }, error: null };
      },
      async getUser() {
        calls.push('getUser');
        return { data: { user: { id: USER_ID } }, error: null };
      }
    },
    from() {
      throw new Error('not-needed');
    }
  };
  const transport = createSupabaseTransport(client);
  assert.equal((await transport.getAuthenticatedUser()).id, USER_ID);
  assert.deepEqual(calls, ['getSession', 'getUser']);

  client.auth.getUser = async () => ({
    data: { user: { id: OTHER_USER_ID } },
    error: null
  });
  await assert.rejects(transport.getAuthenticatedUser(), /ne correspond pas à la session/);
});

await check('25. transport Supabase mocké applique CAS et INSERT stricts', async () => {
  const calls = [];
  const expected = remoteRow('crFavMeals', '["before-1","before-2"]', { revision: 40 });
  const record = {
    user_id: USER_ID,
    app_id: 'clair-repas',
    data_key: 'crFavMeals',
    payload: {
      value: '["local-favorite-1","local-favorite-2"]',
      source_device: 'Windows • Edge',
      synced_at: '2026-08-28T12:00:01.000Z',
      integration: 'clair-foundation15-cloud-repair'
    },
    schema_version: 2,
    deleted_at: null,
    updated_at: '2026-08-28T12:00:01.000Z',
    last_device_id: 'device-before'
  };
  function updateBuilder() {
    const state = { filters: [] };
    calls.push(state);
    return {
      update(changes) {
        state.action = 'update';
        state.changes = clone(changes);
        return this;
      },
      insert(inserted) {
        state.action = 'insert';
        state.inserted = clone(inserted);
        return this;
      },
      eq(column, value) {
        state.filters.push([column, value]);
        return this;
      },
      select(columns) {
        state.columns = columns;
        return this;
      },
      async maybeSingle() {
        return {
          data: { ...record, id: expected.id, revision: 41 },
          error: null
        };
      },
      async single() {
        return {
          data: { ...record, id: 'inserted-row', revision: 1 },
          error: null
        };
      }
    };
  }
  const client = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: USER_ID } } }, error: null }),
      getUser: async () => ({ data: { user: { id: USER_ID } }, error: null })
    },
    from(table) {
      assert.equal(table, 'clair_data');
      return updateBuilder();
    }
  };
  const transport = createSupabaseTransport(client);
  await transport.getAuthenticatedUser();
  await transport.writeRow(record, expected);
  assert.equal(calls[0].action, 'update');
  assert.deepEqual(calls[0].filters, [
    ['user_id', USER_ID],
    ['app_id', 'clair-repas'],
    ['data_key', 'crFavMeals'],
    ['revision', 40]
  ]);
  assert.equal(calls[0].changes.schema_version, 2);
  assert.equal(Object.hasOwn(calls[0].changes, 'revision'), false);

  await transport.writeRow({ ...record, data_key: 'crDays' }, null);
  assert.equal(calls[1].action, 'insert');
  assert.equal(calls[1].inserted.revision, 1);
  assert.equal(calls[1].inserted.schema_version, 2);
});

await check('26. aucune donnée locale personnelle n’est modifiée', async () => {
  const local = {
    ...localValues(constants.EXPECTED_LOCAL_FAVORITES, { crDays: '11' }),
    crHealthProbeV73: 'do-not-touch',
    unrelated: 'sentinel'
  };
  const harness = makeHarness({
    local,
    rows: [
      remoteRow('crFavMeals', '["remote-1","remote-2"]'),
      remoteRow('crDays', '4')
    ]
  });
  const before = Object.fromEntries(harness.storage.values);
  const { result } = await analyzeAndRepair(harness);
  assert.equal(result.status, 'success');
  for (const [key, value] of Object.entries(before)) {
    assert.equal(harness.storage.values.get(key), value, key + ' changed locally');
  }
  assert.deepEqual(harness.storage.removals, []);
  assert.ok(
    harness.storage.writes.every(([key]) => key.startsWith('clair.repair.cloud.before.'))
  );
});

await check('27. chaque écriture réelle ou compensatoire reste en schema_version 2', async () => {
  const harness = makeHarness({
    local: localValues(constants.EXPECTED_LOCAL_FAVORITES, { crRecentRecipesV25: '["local"]' }),
    rows: [
      remoteRow('crFavMeals', ['legacy-1', 'legacy-2'], { schemaVersion: 1 }),
      remoteRow('crRecentRecipesV25', ['legacy-recent'], { schemaVersion: 1 })
    ],
    failRepairAt: 2
  });
  const { result } = await analyzeAndRepair(harness);
  assert.equal(result.status, 'rollback-complete');
  assert.ok(
    harness.transport.writeAttempts.every((attempt) => attempt.record.schema_version === 2)
  );
});

await check('28. double contrôle Foundation après écriture déclenche le rollback', async () => {
  const harness = makeHarness({
    rows: [remoteRow('crFavMeals', '["remote-1","remote-2"]', { revision: 3 })],
    version(call) {
      return call >= 3
        ? { ...VERSION, cloudEnabled: true }
        : VERSION;
    }
  });
  const { result } = await analyzeAndRepair(harness);
  assert.equal(result.status, 'rollback-complete');
  assert.equal(rowFor(harness.transport, 'crFavMeals').revision, 5);
});

await check('29. configuration statique publique et interface verrouillée', () => {
  assert.equal(constants.EXPECTED_LOCAL_FAVORITES, 3);
  assert.match(constants.SUPABASE_PUBLISHABLE_KEY, /^sb_publishable_/);
  assert.doesNotMatch(source, /service[_-]?role/i);
  assert.doesNotMatch(source, /sb_secret_/i);
  assert.match(html, />ANALYSER LOCAL ET CLOUD<\/button>/);
  assert.match(html, /id="repairButton"[^>]*disabled[^>]*>RÉPARER LE CLOUD DEPUIS CET ORDINATEUR/);
  assert.match(html, /id="downloadButton"[^>]*disabled/);
  assert.match(html, /verrou des 3 favoris locaux/);
  assert.match(source, /integration:\s*INTEGRATION/);
  assert.match(source, /source_device:\s*deviceLabel/);
  assert.match(source, /schema_version:\s*DATA_SCHEMA/);
  assert.match(source, /getSession\(\)[\s\S]*getUser\(\)/);
  assert.doesNotMatch(source, /user[_-]?id\s*=\s*['"][0-9a-f]{8}-/i);
});

await check('30. la configuration Foundation.15 du dépôt reste verrouillée', () => {
  assert.equal(versionFile.foundationVersion, '8.0.0-foundation.15');
  assert.equal(versionFile.productVersion, '7.5');
  assert.equal(versionFile.cloudEnabled, false);
  assert.equal(versionFile.cloudAppId, 'clair-repas');
  assert.equal(versionFile.bootstrapGeneration, 'bootstrap-v2');
});

if (failures.length) {
  console.error('\n' + failures.join('\n\n'));
  console.error(`\nCloud repair validation failed: ${failures.length}/${successes.length + failures.length}`);
  process.exitCode = 1;
} else {
  console.log(`Cloud repair validation: ${successes.length} tests passed`);
  for (const name of successes) console.log('✓ ' + name);
}
