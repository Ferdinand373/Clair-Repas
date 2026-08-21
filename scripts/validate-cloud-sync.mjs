#!/usr/bin/env node

import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TextEncoder } from "node:util";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(resolve(ROOT, "v8/clair-cloud-sync.js"), "utf8");
const RELEASE = "8.0.0-foundation.11";
const DATA_SCHEMA = 2;
const CORE_REVISION = "sha256:test-core-revision";
const PRODUCTION_APP_ID = "clair-repas";
const TEST_APP_ID = "clair-repas-v8-test";
const PERSONAL_SYNC_PROTOCOL = "clair-personal-sync/v1";
const successes = [];
const failures = [];

async function check(name, callback) {
  try {
    await callback();
    successes.push(name);
  } catch (error) {
    failures.push(name + ": " + (error?.stack || error));
  }
}

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
    this.hidden = false;
  }

  addEventListener(type, callback) {
    const callbacks = this.listeners.get(type) || new Set();
    callbacks.add(callback);
    this.listeners.set(type, callbacks);
  }

  removeEventListener(type, callback) {
    this.listeners.get(type)?.delete(callback);
  }

  dispatch(type, event = {}) {
    for (const callback of this.listeners.get(type) || []) callback(event);
  }
}

class FakeStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

class FakeSync {
  constructor(values = {}) {
    this.values = { ...values };
    this.restoreCalls = [];
    this.failRestore = false;
    this.failRestoreAt = null;
    this.mutateThenFailAt = null;
    this.mutateThenThrowAt = null;
    this.throwBeforeRestoreAt = null;
    this.restoreAttempts = 0;
    this.protocol = "clair-personal-sync/v1";
    this.app = "clair-repas";
    this.release = RELEASE;
    this.dataSchema = DATA_SCHEMA;
    this.coreRevision = CORE_REVISION;
    this.scopePath = "/";
    this.scopeId = "scope-test";
  }

  capture() {
    return { ok: true, values: { ...this.values } };
  }

  valid(values) {
    return (
      Object.prototype.toString.call(values) === "[object Object]" &&
      Object.entries(values).every(
        ([key, value]) =>
          /^cr[A-Za-z0-9_.-]+$/.test(key) &&
          key !== "crHealthProbeV73" &&
          typeof value === "string"
      )
    );
  }

  restore(values) {
    this.restoreAttempts += 1;
    if (this.restoreAttempts === this.throwBeforeRestoreAt) {
      throw new Error("restore-threw-before-mutation");
    }
    this.restoreCalls.push({ ...values });
    if (this.restoreCalls.length === this.mutateThenFailAt) {
      this.values = { ...values };
      return false;
    }
    if (this.restoreCalls.length === this.mutateThenThrowAt) {
      this.values = { ...values };
      throw new Error("restore-mutated-then-threw");
    }
    if (
      this.failRestore ||
      this.restoreCalls.length === this.failRestoreAt ||
      !this.valid(values)
    ) return false;
    this.values = { ...values };
    return true;
  }
}

class MemoryTransport {
  constructor({ user = { id: "user-test" }, rows = [] } = {}) {
    this.user = user;
    this.rows = new Map(rows.map((row) => [row.data_key, structuredClone(row)]));
    this.authCalls = 0;
    this.registerCalls = [];
    this.listCalls = [];
    this.getCalls = [];
    this.writeCalls = [];
    this.failAt = null;
    this.onList = null;
  }

  maybeFail(operation) {
    if (this.failAt === operation) throw new Error("network-" + operation);
  }

  async getAuthenticatedUser() {
    this.authCalls += 1;
    this.maybeFail("auth");
    return this.user;
  }

  async registerDevice(record) {
    this.maybeFail("device");
    this.registerCalls.push(structuredClone(record));
    return { id: "device-row-test", ...structuredClone(record) };
  }

  async listData(query) {
    this.maybeFail("list");
    this.listCalls.push(structuredClone(query));
    if (this.onList) await this.onList();
    return [...this.rows.values()]
      .filter(
        (row) => row.user_id === query.user_id && row.app_id === query.app_id
      )
      .map((row) => structuredClone(row));
  }

  async getData(query) {
    this.maybeFail("get");
    this.getCalls.push(structuredClone(query));
    const row = this.rows.get(query.data_key);
    return row && row.user_id === query.user_id && row.app_id === query.app_id
      ? structuredClone(row)
      : null;
  }

  async writeData(record, expectedRow) {
    this.maybeFail("write");
    this.writeCalls.push({
      record: structuredClone(record),
      expectedRevision: expectedRow?.revision ?? null
    });
    const current = this.rows.get(record.data_key) || null;
    if (expectedRow) {
      if (!current || String(current.revision) !== String(expectedRow.revision)) {
        throw new Error("unexpected-test-revision-conflict");
      }
    } else if (current) {
      throw new Error("unexpected-test-insert-conflict");
    }
    const next = {
      id: current?.id || "row-" + record.data_key,
      created_at: current?.created_at || record.updated_at,
      ...structuredClone(record),
      revision: current ? Number(current.revision) + 1 : 1
    };
    this.rows.set(record.data_key, next);
    return structuredClone(next);
  }

  subscribeAuth() {
    return () => {};
  }

  putRemote(key, value, options = {}) {
    const current = this.rows.get(key);
    const updatedAt = options.updatedAt || "2026-08-21T12:00:00.000Z";
    const deletedAt = options.deletedAt || null;
    this.rows.set(key, {
      id: current?.id || "row-" + key,
      user_id: this.user?.id || "user-test",
      app_id: PRODUCTION_APP_ID,
      data_key: key,
      payload: {
        value: deletedAt ? null : value,
        source_device: "Autre appareil",
        synced_at: updatedAt,
        integration: "clair-v8-foundation.9"
      },
      schema_version: DATA_SCHEMA,
      revision: options.revision ?? (current ? Number(current.revision) + 1 : 1),
      last_device_id: "remote-device",
      created_at: current?.created_at || updatedAt,
      updated_at: updatedAt,
      deleted_at: deletedAt
    });
  }
}

function loadTestApi(dataset = {}) {
  const scriptElement = {
    dataset: {
    clairApp: "clair-repas",
    clairRelease: RELEASE,
    clairSchema: String(DATA_SCHEMA),
    clairCore: CORE_REVISION,
      clairCloudApp: PRODUCTION_APP_ID,
      clairCloudEnabled: "true",
      clairDirectSync: PERSONAL_SYNC_PROTOCOL,
      clairCloudTest: "true",
      ...dataset
    }
  };
  const moduleWindow = {};
  vm.runInNewContext(
    source,
    {
      window: moduleWindow,
      document: { currentScript: scriptElement },
      navigator: { onLine: true, userAgent: "Test Browser", platform: "Test" },
      localStorage: new FakeStorage(),
      crypto: webcrypto,
      TextEncoder,
      Date,
      Math,
      Map,
      Set,
      URL,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval
    },
    { filename: "v8/clair-cloud-sync.js:test-mode", timeout: 2000 }
  );
  return moduleWindow.ClairCloudSyncTest;
}

const api = loadTestApi();
assert.ok(api, "Cloud Sync test API was not exposed");

function makeHarness({
  values = {},
  transport = new MemoryTransport(),
  storage,
  runtimeApi = api
} = {}) {
  const sync = new FakeSync(values);
  const technicalStorage = storage || new FakeStorage();
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeEventTarget();
  const snapshots = [];
  windowTarget.ClairV8 = {
    async snapshot(kind) {
      const record = {
        id: "clair-repas:" + kind,
        app: "clair-repas",
        release: RELEASE,
        coreRevision: CORE_REVISION,
        dataSchema: DATA_SCHEMA,
        scopePath: sync.scopePath,
        scopeId: sync.scopeId,
        kind,
        capturedAt: new Date(currentTime).toISOString(),
        values: { ...sync.values },
        fingerprint: "fnv1a:snapshot-" + String(snapshots.length + 1)
      };
      snapshots.push(structuredClone(record));
      return record;
    },
    async verifySnapshot(record, kind) {
      const persisted = snapshots.at(-1);
      return Boolean(
        persisted &&
        record &&
        record.id === "clair-repas:" + kind &&
        record.app === "clair-repas" &&
        record.kind === kind &&
        record.release === RELEASE &&
        record.coreRevision === CORE_REVISION &&
        Number(record.dataSchema) === DATA_SCHEMA &&
        record.scopePath === sync.scopePath &&
        record.scopeId === sync.scopeId &&
        record.capturedAt === persisted.capturedAt &&
        record.fingerprint === persisted.fingerprint
      );
    }
  };
  let currentTime = Date.parse("2026-08-21T10:00:00.000Z");
  const runtime = runtimeApi.createRuntime({
    window: windowTarget,
    document: documentTarget,
    navigator: {
      onLine: true,
      userAgent: "Mozilla/5.0 (Windows) Chrome/140.0",
      platform: "Win32"
    },
    storage: technicalStorage,
    crypto: webcrypto,
    sync,
    transport,
    isHealthy: () => true,
    now: () => currentTime
  });
  return {
    runtime,
    sync,
    storage: technicalStorage,
    transport,
    windowTarget,
    documentTarget,
    snapshots,
    advance(milliseconds = 1000) {
      currentTime += milliseconds;
      return new Date(currentTime).toISOString();
    },
    future(milliseconds) {
      return new Date(currentTime + milliseconds).toISOString();
    }
  };
}

function assertOnlyProductionApp(transport) {
  const ids = [
    ...transport.listCalls.map((call) => call.app_id),
    ...transport.getCalls.map((call) => call.app_id),
    ...transport.writeCalls.map((call) => call.record.app_id)
  ];
  assert.ok(ids.length > 0, "Expected at least one clair_data operation");
  assert.ok(ids.every((appId) => appId === PRODUCTION_APP_ID));
  assert.ok(ids.every((appId) => appId !== TEST_APP_ID));
}

await check("Cloud bootstrap fails closed before every remote side effect", async () => {
  const cases = [
    {
      dataset: { clairCloudApp: undefined },
      reason: "cloud-app-missing"
    },
    {
      dataset: { clairCloudApp: "Clair-Repas" },
      reason: "cloud-config-invalid"
    },
    {
      dataset: { clairDirectSync: undefined },
      reason: "cloud-config-invalid"
    },
    {
      dataset: { clairCloudEnabled: "false" },
      reason: "production-not-enabled"
    },
    {
      dataset: { clairCloudEnabled: "TRUE" },
      reason: "production-not-enabled"
    },
    {
      dataset: { clairCloudEnabled: "1" },
      reason: "production-not-enabled"
    }
  ];

  for (const testCase of cases) {
    const runtimeApi = loadTestApi(testCase.dataset);
    const transport = new MemoryTransport();
    const harness = makeHarness({
      values: { crSafe: "local" },
      transport,
      runtimeApi
    });
    await harness.runtime.start();
    const result = await harness.runtime.syncNow("fail-closed");
    assert.equal(result.synced, false);
    assert.equal(result.reason, testCase.reason);
    assert.equal(transport.authCalls, 0);
    assert.equal(transport.registerCalls.length, 0);
    assert.equal(transport.listCalls.length, 0);
    assert.equal(transport.writeCalls.length, 0);
    assert.equal(harness.snapshots.length, 0);
    assert.deepEqual(harness.sync.values, { crSafe: "local" });
    harness.runtime.stop();
  }

  const disabledApi = loadTestApi({ clairCloudEnabled: "false" });
  const disabledHarness = makeHarness({ runtimeApi: disabledApi });
  await disabledHarness.runtime.start();
  const marker = JSON.parse(
    disabledHarness.storage.getItem(
      disabledApi.constants.DIRECT_SYNC_MARKER_KEY
    )
  );
  assert.equal(marker.enabled, false);
  assert.equal(marker.healthy, false);
  assert.equal(marker.lastSuccessfulSync, null);
  assert.equal(marker.release, RELEASE);
  assert.equal(marker.device, null);
  disabledHarness.runtime.stop();
});

await check("Pinned SDK loader replaces a loaded-but-unavailable script", async () => {
  const scripts = [];
  let appendCount = 0;
  class FakeScript {
    constructor() {
      this.dataset = {};
      this.listeners = new Map();
      this.removed = false;
    }

    addEventListener(type, callback) {
      this.listeners.set(type, callback);
    }

    emit(type) {
      this.listeners.get(type)?.();
    }

    remove() {
      this.removed = true;
      const index = scripts.indexOf(this);
      if (index >= 0) scripts.splice(index, 1);
    }
  }
  const document = {
    querySelector(selector) {
      assert.equal(selector, 'script[data-clair-supabase-js="2.111.0"]');
      return scripts.find(
        (script) => script.dataset.clairSupabaseJs === "2.111.0"
      ) || null;
    },
    createElement(tag) {
      assert.equal(tag, "script");
      return new FakeScript();
    },
    head: {
      appendChild(script) {
        appendCount += 1;
        scripts.push(script);
      }
    }
  };
  const hostWindow = {};
  const first = api.loadSupabaseLibrary(hostWindow, document);
  const firstScript = scripts[0];
  firstScript.emit("load");
  await assert.rejects(first, /supabase-library-unavailable/);
  assert.equal(firstScript.dataset.clairSupabaseFailed, "true");

  const second = api.loadSupabaseLibrary(hostWindow, document);
  const secondScript = scripts[0];
  assert.notEqual(secondScript, firstScript);
  assert.equal(firstScript.removed, true);
  assert.equal(appendCount, 2);
  hostWindow.supabase = { createClient() {} };
  secondScript.emit("load");
  assert.equal(await second, hostWindow.supabase);
  assert.equal(secondScript.dataset.clairSupabaseReady, "true");
});

await check("Supabase adapter reuses auth and hard-locks clair_data to production", async () => {
  let getUserCalls = 0;
  let fromCalls = 0;
  const signedOutClient = {
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async getUser() {
        getUserCalls += 1;
        return { data: { user: null }, error: null };
      }
    },
    from() {
      fromCalls += 1;
      throw new Error("anonymous-table-access");
    }
  };
  const signedOut = api.createSupabaseTransport(signedOutClient);
  assert.equal(await signedOut.getAuthenticatedUser(), null);
  assert.equal(getUserCalls, 0);
  assert.equal(fromCalls, 0);

  const operations = [];
  const user = { id: "user-test" };
  function createBuilder(table) {
    const operation = {
      table,
      action: null,
      filters: [],
      record: null,
      columns: null
    };
    operations.push(operation);
    const builder = {
      select(columns) {
        operation.action ||= "select";
        operation.columns = columns;
        return builder;
      },
      upsert(record) {
        operation.action = "upsert";
        operation.record = structuredClone(record);
        return builder;
      },
      insert(record) {
        operation.action = "insert";
        operation.record = structuredClone(record);
        return builder;
      },
      update(record) {
        operation.action = "update";
        operation.record = structuredClone(record);
        return builder;
      },
      eq(key, value) {
        operation.filters.push([key, value]);
        return builder;
      },
      single() {
        return Promise.resolve(result());
      },
      maybeSingle() {
        return Promise.resolve(result());
      },
      then(resolve, reject) {
        return Promise.resolve(result()).then(resolve, reject);
      }
    };
    function result() {
      if (table === "clair_devices") {
        return { data: { id: "device-db", ...operation.record }, error: null };
      }
      if (operation.action === "insert") {
        return {
          data: { id: "row-db", revision: 1, ...operation.record },
          error: null
        };
      }
      if (operation.action === "update") {
        const expected = operation.filters.find(([key]) => key === "revision")?.[1];
        return {
          data: {
            id: "row-db",
            revision: Number(expected) + 1,
            ...operation.record
          },
          error: null
        };
      }
      return { data: operation.action === "select" ? [] : null, error: null };
    }
    return builder;
  }
  const signedInClient = {
    auth: {
      async getSession() {
        return { data: { session: { user } }, error: null };
      },
      async getUser() {
        return { data: { user }, error: null };
      },
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe() {} } } };
      }
    },
    from(table) {
      return createBuilder(table);
    }
  };
  const signedIn = api.createSupabaseTransport(signedInClient);
  assert.equal((await signedIn.getAuthenticatedUser()).id, user.id);
  await signedIn.registerDevice({ user_id: user.id, device_key: "device-key" });
  await signedIn.listData({ user_id: user.id, app_id: PRODUCTION_APP_ID });
  await signedIn.getData({
    user_id: user.id,
    app_id: PRODUCTION_APP_ID,
    data_key: "crAdapter"
  });
  await signedIn.writeData(
    {
      user_id: user.id,
      app_id: PRODUCTION_APP_ID,
      data_key: "crAdapter",
      payload: { value: "x" },
      schema_version: DATA_SCHEMA,
      last_device_id: "device-db",
      updated_at: "2026-08-21T10:00:00.000Z",
      deleted_at: null
    },
    null
  );
  await signedIn.writeData(
    {
      user_id: user.id,
      app_id: PRODUCTION_APP_ID,
      data_key: "crAdapter",
      payload: { value: "updated" },
      schema_version: DATA_SCHEMA,
      last_device_id: "device-db",
      updated_at: "2026-08-21T10:01:00.000Z",
      deleted_at: null
    },
    { revision: 7 }
  );
  const beforeForbidden = operations.length;
  await assert.rejects(
    () => signedIn.listData({ user_id: user.id, app_id: TEST_APP_ID }),
    /forbidden-app-id/
  );
  await assert.rejects(
    () =>
      signedIn.writeData(
        { user_id: user.id, app_id: TEST_APP_ID, data_key: "crForbidden" },
        null
      ),
    /forbidden-app-id/
  );
  assert.equal(operations.length, beforeForbidden);
  const dataOperations = operations.filter((operation) => operation.table === "clair_data");
  assert.ok(dataOperations.length >= 4);
  for (const operation of dataOperations) {
    const appFilter = operation.filters.find(([key]) => key === "app_id");
    if (operation.action === "insert") {
      assert.equal(operation.record.app_id, PRODUCTION_APP_ID);
    } else {
      assert.deepEqual(appFilter, ["app_id", PRODUCTION_APP_ID]);
    }
  }
  const update = dataOperations.find((operation) => operation.action === "update");
  assert.ok(update);
  assert.deepEqual(
    update.filters.find(([key]) => key === "revision"),
    ["revision", 7]
  );
  assert.equal(Object.hasOwn(update.record, "revision"), false);
});

await check("No session stays local and performs no anonymous write", async () => {
  const transport = new MemoryTransport({ user: null });
  const harness = makeHarness({ values: { crLocal: "safe" }, transport });
  const result = await harness.runtime.syncNow("test-no-session");
  assert.equal(result.reason, "no-session");
  assert.deepEqual(harness.sync.values, { crLocal: "safe" });
  assert.equal(transport.registerCalls.length, 0);
  assert.equal(transport.listCalls.length, 0);
  assert.equal(transport.writeCalls.length, 0);
  assert.equal(harness.snapshots.length, 0);
});

await check("Local upload uses the raw value and production app_id", async () => {
  const harness = makeHarness({ values: { crPrefs: '{"mode":"local"}' } });
  const result = await harness.runtime.syncNow("test-upload");
  assert.equal(result.synced, true, JSON.stringify(result));
  const row = harness.transport.rows.get("crPrefs");
  assert.equal(row.payload.value, '{"mode":"local"}');
  assert.equal(row.payload.integration, "clair-v8-foundation.9");
  assert.equal(row.payload.source_device, "Windows • Chrome");
  assert.equal(row.deleted_at, null);
  assert.equal(harness.transport.registerCalls.length, 1);
  assert.equal(harness.snapshots.length, 1);
  assert.equal(harness.snapshots[0].kind, "cloud-production-handover");
  const marker = JSON.parse(
    harness.storage.getItem(api.constants.DIRECT_SYNC_MARKER_KEY)
  );
  assert.equal(marker.enabled, true);
  assert.equal(marker.healthy, true);
  assert.ok(marker.lastSuccessfulSync);
  assert.equal(marker.release, RELEASE);
  assert.equal(marker.appId, PRODUCTION_APP_ID);
  assert.equal(marker.localAppId, "clair-repas");
  assert.equal(marker.protocol, "clair-cloud-sync/v1");
  assert.equal(marker.directSyncProtocol, PERSONAL_SYNC_PROTOCOL);
  assert.equal(marker.dataSchema, DATA_SCHEMA);
  assert.equal(marker.coreRevision, CORE_REVISION);
  assert.equal(marker.scopePath, harness.sync.scopePath);
  assert.equal(marker.scopeId, harness.sync.scopeId);
  assert.ok(marker.device);
  assertOnlyProductionApp(harness.transport);
});

await check("Remote-only data downloads without format conversion", async () => {
  const transport = new MemoryTransport();
  transport.putRemote("crRemote", '["a","b"]');
  const harness = makeHarness({ transport });
  const result = await harness.runtime.syncNow("test-download");
  assert.equal(result.synced, true, JSON.stringify(result));
  assert.equal(harness.sync.values.crRemote, '["a","b"]');
  assert.equal(harness.sync.restoreCalls.length, 1);
  assertOnlyProductionApp(transport);
});

await check("A local edit during network I/O is never overwritten", async () => {
  const harness = makeHarness({
    values: { crA: "base-a", crB: "base-b" }
  });
  await harness.runtime.syncNow("seed-concurrency");
  harness.transport.putRemote("crA", "remote-a", {
    updatedAt: harness.advance(1000)
  });
  harness.transport.onList = async () => {
    harness.transport.onList = null;
    harness.sync.values.crB = "user-edit-during-network-await";
  };
  const result = await harness.runtime.syncNow("concurrent-local-edit");
  assert.equal(result.synced, true, JSON.stringify(result));
  assert.equal(harness.sync.values.crA, "remote-a");
  assert.equal(
    harness.sync.values.crB,
    "user-edit-during-network-await"
  );
  assert.equal(
    harness.transport.rows.get("crB").payload.value,
    "user-edit-during-network-await"
  );
});

await check("Deletion sends a tombstone and recreation clears it", async () => {
  const harness = makeHarness({ values: { crDraft: "first" } });
  await harness.runtime.syncNow("seed");
  delete harness.sync.values.crDraft;
  harness.advance(2000);
  await harness.runtime.syncNow("delete");
  const tombstone = harness.transport.rows.get("crDraft");
  assert.ok(tombstone.deleted_at);
  assert.equal(tombstone.payload.value, null);
  harness.sync.values.crDraft = "reborn";
  harness.advance(2000);
  await harness.runtime.syncNow("recreate");
  const recreated = harness.transport.rows.get("crDraft");
  assert.equal(recreated.deleted_at, null);
  assert.equal(recreated.payload.value, "reborn");
  assert.ok(Number(recreated.revision) > Number(tombstone.revision));
  assertOnlyProductionApp(harness.transport);
});

await check("First connection never lets old cloud data erase local data", async () => {
  const transport = new MemoryTransport();
  transport.putRemote("crImportant", null, {
    deletedAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  });
  transport.putRemote("crScalar", "old-cloud", {
    updatedAt: "2025-01-01T00:00:00.000Z"
  });
  transport.putRemote("crJson", '{"remote":1,"shared":"cloud"}', {
    updatedAt: "2025-01-01T00:00:00.000Z"
  });
  transport.putRemote("crRemoteOnly", "cloud-only", {
    updatedAt: "2025-01-01T00:00:00.000Z"
  });
  const harness = makeHarness({
    values: {
      crImportant: "local-safe",
      crScalar: "local-new",
      crJson: '{"local":1,"shared":"local"}'
    },
    transport
  });
  const order = [];
  const snapshot = harness.windowTarget.ClairV8.snapshot.bind(
    harness.windowTarget.ClairV8
  );
  harness.windowTarget.ClairV8.snapshot = async (...args) => {
    order.push("snapshot");
    return snapshot(...args);
  };
  const registerDevice = transport.registerDevice.bind(transport);
  transport.registerDevice = async (...args) => {
    order.push("device-write");
    return registerDevice(...args);
  };
  await harness.runtime.syncNow("first-connection");
  assert.deepEqual(harness.sync.values, {
    crImportant: "local-safe",
    crScalar: "local-new",
    crJson: '{"local":1,"shared":"local"}',
    crRemoteOnly: "cloud-only"
  });
  assert.deepEqual(order.slice(0, 2), ["snapshot", "device-write"]);
  assert.equal(transport.rows.get("crImportant").deleted_at, null);
  assert.equal(transport.rows.get("crImportant").payload.value, "local-safe");
  assert.equal(transport.rows.get("crScalar").payload.value, "local-new");
  assert.equal(
    transport.rows.get("crJson").payload.value,
    '{"local":1,"shared":"local"}'
  );
  const meta = JSON.parse(
    harness.storage.getItem(api.constants.META_STORAGE_KEY)
  );
  assert.ok(meta.accounts["user-test"].handover.completedAt);
  assert.equal(
    meta.accounts["user-test"].handover.snapshotFingerprint,
    harness.snapshots[0].fingerprint
  );
});

await check("An interrupted handover resumes with local-first semantics", async () => {
  const transport = new MemoryTransport();
  transport.putRemote("crImportant", null, {
    deletedAt: "2026-08-21T09:00:00.000Z",
    updatedAt: "2026-08-21T09:00:00.000Z",
    revision: 2
  });
  const storage = new FakeStorage({
    [api.constants.META_STORAGE_KEY]: JSON.stringify({
      protocol: "clair-cloud-sync-meta/v1",
      appId: PRODUCTION_APP_ID,
      accounts: {
        "user-test": {
          userId: "user-test",
          keys: {
            crImportant: {
              basePresent: true,
              baseValue: "local-safe",
              localFingerprint: "sha256:old",
              remoteRevision: "1",
              remoteUpdatedAt: "2026-08-21T08:00:00.000Z",
              lastSyncedAt: "2026-08-21T08:00:00.000Z",
              localChangedAt: null
            }
          },
          conflicts: {},
          lastSyncAt: null,
          handover: {
            completedAt: null,
            preparedAt: "2026-08-21T08:00:00.000Z",
            snapshotFingerprint: "fnv1a:interrupted"
          }
        }
      }
    })
  });
  const harness = makeHarness({
    values: { crImportant: "local-safe" },
    transport,
    storage
  });
  const result = await harness.runtime.syncNow("resume-interrupted-handover");
  assert.equal(result.synced, true, JSON.stringify(result));
  assert.equal(harness.sync.values.crImportant, "local-safe");
  assert.equal(transport.rows.get("crImportant").deleted_at, null);
  assert.equal(transport.rows.get("crImportant").payload.value, "local-safe");
  const meta = JSON.parse(storage.getItem(api.constants.META_STORAGE_KEY));
  assert.ok(meta.accounts["user-test"].handover.completedAt);
});

await check("Missing metadata after a completed sync fails closed", async () => {
  const harness = makeHarness({ values: { crImportant: "base-local" } });
  const seeded = await harness.runtime.syncNow("seed-before-meta-loss");
  assert.equal(seeded.synced, true, JSON.stringify(seeded));
  harness.transport.putRemote("crImportant", "newer-cloud", {
    updatedAt: harness.advance(5000)
  });
  harness.storage.removeItem(api.constants.META_STORAGE_KEY);
  const writesBefore = harness.transport.writeCalls.length;
  const snapshotsBefore = harness.snapshots.length;

  const result = await harness.runtime.syncNow("meta-loss");
  assert.equal(result.reason, "error");
  assert.match(result.error, /sync-meta-recovery-required/);
  assert.equal(harness.sync.values.crImportant, "base-local");
  assert.equal(
    harness.transport.rows.get("crImportant").payload.value,
    "newer-cloud"
  );
  assert.equal(harness.transport.writeCalls.length, writesBefore);
  assert.equal(harness.snapshots.length, snapshotsBefore);
});

await check("A transient metadata read failure never deletes its before-image", async () => {
  const harness = makeHarness({ values: { crSafe: "base-local" } });
  const seeded = await harness.runtime.syncNow("seed-before-meta-read-failure");
  assert.equal(seeded.synced, true, JSON.stringify(seeded));
  const metaBefore = harness.storage.getItem(api.constants.META_STORAGE_KEY);
  const baseGetItem = harness.storage.getItem.bind(harness.storage);
  let failOnce = true;
  harness.storage.getItem = (key) => {
    if (key === api.constants.META_STORAGE_KEY && failOnce) {
      failOnce = false;
      throw new Error("transient-meta-read-failure");
    }
    return baseGetItem(key);
  };
  const listCallsBefore = harness.transport.listCalls.length;

  const result = await harness.runtime.syncNow("meta-read-failure");
  assert.equal(result.reason, "error");
  assert.match(result.error, /sync-meta-recovery-required/);
  assert.equal(
    harness.storage.getItem(api.constants.META_STORAGE_KEY),
    metaBefore
  );
  assert.equal(harness.transport.listCalls.length, listCallsBefore);
  assert.deepEqual(harness.sync.values, { crSafe: "base-local" });
});

await check("Handover requires a verified durable snapshot and marker", async () => {
  const forged = makeHarness({ values: { crSafe: "local" } });
  forged.windowTarget.ClairV8.snapshot = async () => ({
    id: "wrong:cloud-production-handover",
    app: "wrong-app",
    kind: "wrong-kind",
    release: "wrong-release",
    coreRevision: "wrong-core",
    dataSchema: 999,
    scopePath: "/wrong/",
    scopeId: "wrong-scope",
    capturedAt: "2026-08-21T10:00:00.000Z",
    values: { crSafe: "local" },
    fingerprint: "fnv1a:forged"
  });
  forged.windowTarget.ClairV8.verifySnapshot = async () => false;
  const forgedResult = await forged.runtime.syncNow("forged-snapshot");
  assert.equal(forgedResult.reason, "error");
  assert.match(forgedResult.error, /handover-snapshot-verification-failed/);
  assert.equal(forged.transport.registerCalls.length, 0);
  assert.equal(forged.transport.writeCalls.length, 0);

  const markerStorage = new FakeStorage();
  const baseSetItem = markerStorage.setItem.bind(markerStorage);
  markerStorage.setItem = (key, value) => {
    if (key === api.constants.DIRECT_SYNC_MARKER_KEY) {
      throw new Error("marker-quota");
    }
    baseSetItem(key, value);
  };
  const missingMarker = makeHarness({
    values: { crSafe: "local" },
    storage: markerStorage
  });
  const markerResult = await missingMarker.runtime.syncNow("marker-failure");
  assert.equal(markerResult.reason, "error");
  assert.match(markerResult.error, /direct-sync-marker-persistence-failed/);
  assert.equal(missingMarker.transport.registerCalls.length, 0);
  assert.equal(missingMarker.transport.writeCalls.length, 0);
  assert.equal(markerStorage.getItem(api.constants.META_STORAGE_KEY), null);
});

await check("Concurrent JSON objects and arrays merge non-destructively", async () => {
  const harness = makeHarness({
    values: {
      crObject: '{"base":1}',
      crArray: '["base"]',
      crLeaf: '{"note":"base"}'
    }
  });
  await harness.runtime.syncNow("seed");
  harness.sync.values.crObject = '{"base":1,"local":2}';
  harness.sync.values.crArray = '["base","local"]';
  harness.sync.values.crLeaf = '{"note":"local"}';
  harness.advance(1000);
  harness.transport.putRemote("crObject", '{"base":1,"remote":3}', {
    updatedAt: harness.advance(1000)
  });
  harness.transport.putRemote("crArray", '["base","remote"]', {
    updatedAt: harness.advance(1000)
  });
  harness.transport.putRemote("crLeaf", '{"note":"remote"}', {
    updatedAt: harness.advance(1000)
  });
  await harness.runtime.syncNow("json-conflict");
  assert.deepEqual(JSON.parse(harness.sync.values.crObject), {
    base: 1,
    local: 2,
    remote: 3
  });
  assert.deepEqual(
    new Set(JSON.parse(harness.sync.values.crArray)),
    new Set(["base", "local", "remote"])
  );
  assert.equal(
    harness.transport.rows.get("crObject").payload.value,
    harness.sync.values.crObject
  );
  assert.equal(JSON.parse(harness.sync.values.crLeaf).note, "local");
  const meta = JSON.parse(
    harness.storage.getItem(api.constants.META_STORAGE_KEY)
  );
  const archived = meta.accounts["user-test"].conflicts.crLeaf.at(-1);
  assert.equal(archived.localValue, '{"note":"local"}');
  assert.equal(archived.remoteValue, '{"note":"remote"}');
  assert.deepEqual(archived.details[0].path, ["note"]);
});

await check("Newest scalar and newest delete win after a shared base", async () => {
  const harness = makeHarness({
    values: { crScalar: "base", crDeleteVsEdit: "base" }
  });
  await harness.runtime.syncNow("seed");
  harness.sync.values.crScalar = "local-edit";
  harness.sync.values.crDeleteVsEdit = "local-edit";
  harness.advance(1000);
  const remoteTime = harness.future(5000);
  harness.transport.putRemote("crScalar", "remote-newest", {
    updatedAt: remoteTime
  });
  harness.transport.putRemote("crDeleteVsEdit", null, {
    updatedAt: remoteTime,
    deletedAt: remoteTime
  });
  await harness.runtime.syncNow("scalar-conflict");
  assert.equal(harness.sync.values.crScalar, "remote-newest");
  assert.equal(Object.hasOwn(harness.sync.values, "crDeleteVsEdit"), false);
});

await check("Failed production handover restores the snapshot and retries safely", async () => {
  const transport = new MemoryTransport();
  const before = { crA: "local-a", crB: '{"local":true}' };
  const harness = makeHarness({ values: before, transport });
  const originalWrite = transport.writeData.bind(transport);
  let writes = 0;
  let failSecondWrite = true;
  transport.writeData = async (...args) => {
    writes += 1;
    if (failSecondWrite && writes === 2) {
      harness.sync.values.crB = '{"user":"concurrent"}';
      throw new Error("handover-write-failed");
    }
    return originalWrite(...args);
  };
  const failed = await harness.runtime.syncNow("handover-failure");
  assert.equal(failed.reason, "error");
  assert.deepEqual(harness.sync.values, {
    crA: "local-a",
    crB: '{"user":"concurrent"}'
  });
  assert.equal(harness.snapshots.length, 1);
  const failedMarker = JSON.parse(
    harness.storage.getItem(api.constants.DIRECT_SYNC_MARKER_KEY)
  );
  assert.equal(failedMarker.healthy, false);
  assert.equal(
    failedMarker.handoverSnapshotFingerprint,
    harness.snapshots[0].fingerprint
  );

  failSecondWrite = false;
  writes = 0;
  const retried = await harness.runtime.syncNow("handover-retry");
  assert.equal(retried.synced, true, JSON.stringify(retried));
  assert.deepEqual(harness.sync.values, {
    crA: "local-a",
    crB: '{"user":"concurrent"}'
  });
  assert.equal(transport.rows.get("crA").payload.value, "local-a");
  assert.equal(
    transport.rows.get("crB").payload.value,
    '{"user":"concurrent"}'
  );
  const healthyMarker = JSON.parse(
    harness.storage.getItem(api.constants.DIRECT_SYNC_MARKER_KEY)
  );
  assert.equal(healthyMarker.healthy, true);
  assert.ok(healthyMarker.lastSuccessfulSync);
});

await check("Network and local restore failures preserve the local before-image", async () => {
  const missingSnapshotTransport = new MemoryTransport();
  const missingSnapshot = makeHarness({
    values: { crKeep: "snapshot-required" },
    transport: missingSnapshotTransport
  });
  missingSnapshot.windowTarget.ClairV8.snapshot = async () => null;
  const missingSnapshotResult = await missingSnapshot.runtime.syncNow(
    "snapshot-unavailable"
  );
  assert.equal(missingSnapshotResult.reason, "error");
  assert.equal(missingSnapshotTransport.registerCalls.length, 0);
  assert.equal(missingSnapshotTransport.listCalls.length, 0);
  assert.equal(missingSnapshotTransport.writeCalls.length, 0);
  assert.deepEqual(missingSnapshot.sync.values, {
    crKeep: "snapshot-required"
  });

  const offlineTransport = new MemoryTransport();
  offlineTransport.failAt = "list";
  const offline = makeHarness({
    values: { crKeep: "untouched" },
    transport: offlineTransport
  });
  const offlineResult = await offline.runtime.syncNow("network-error");
  assert.equal(offlineResult.reason, "error");
  assert.deepEqual(offline.sync.values, { crKeep: "untouched" });

  const remoteTransport = new MemoryTransport();
  remoteTransport.putRemote("crIncoming", "cloud-value");
  const failedRestore = makeHarness({
    values: { crKeep: "untouched" },
    transport: remoteTransport
  });
  failedRestore.sync.failRestore = true;
  const restoreResult = await failedRestore.runtime.syncNow("restore-error");
  assert.equal(restoreResult.reason, "error");
  assert.deepEqual(failedRestore.sync.values, { crKeep: "untouched" });

  const partialTransport = new MemoryTransport();
  partialTransport.putRemote("crA", "remote-a");
  partialTransport.putRemote("crB", "remote-b");
  const partial = makeHarness({
    values: { crKeep: "before-image" },
    transport: partialTransport
  });
  partial.sync.failRestoreAt = 2;
  const partialResult = await partial.runtime.syncNow("partial-restore-error");
  assert.equal(partialResult.reason, "error");
  assert.deepEqual(partial.sync.values, { crKeep: "before-image" });
  assert.ok(partial.sync.restoreCalls.length >= 3);

  for (const mode of ["mutateThenFailAt", "mutateThenThrowAt"]) {
    const mutatingTransport = new MemoryTransport();
    mutatingTransport.putRemote("crIncoming", "cloud-mutating-failure");
    const mutating = makeHarness({
      values: { crKeep: "before-mutating-failure" },
      transport: mutatingTransport
    });
    mutating.sync[mode] = 1;
    const result = await mutating.runtime.syncNow(mode);
    assert.equal(result.reason, "error");
    assert.deepEqual(mutating.sync.values, {
      crKeep: "before-mutating-failure"
    });
  }
});

await check("A thrown rollback still restores the complete before-image", async () => {
  const harness = makeHarness({
    values: { crA: "base-a", crB: "base-b" }
  });
  const seeded = await harness.runtime.syncNow("seed-before-rollback-throw");
  assert.equal(seeded.synced, true, JSON.stringify(seeded));
  const metaBefore = harness.storage.getItem(api.constants.META_STORAGE_KEY);
  const remoteAt = harness.advance(5000);
  harness.transport.putRemote("crA", null, {
    deletedAt: remoteAt,
    updatedAt: remoteAt
  });
  harness.transport.putRemote("crB", "remote-b", { updatedAt: remoteAt });
  const originalValid = harness.sync.valid.bind(harness.sync);
  harness.sync.valid = (values) =>
    originalValid(values) && values.crB !== "remote-b";
  harness.sync.throwBeforeRestoreAt = 2;

  const result = await harness.runtime.syncNow("rollback-throws");
  assert.equal(result.reason, "error");
  assert.deepEqual(harness.sync.values, {
    crA: "base-a",
    crB: "base-b"
  });
  assert.equal(
    harness.storage.getItem(api.constants.META_STORAGE_KEY),
    metaBefore
  );
});

await check("Technical metadata remains outside personal and cloud data", async () => {
  const harness = makeHarness({ values: { crOnly: "personal" } });
  await harness.runtime.syncNow("metadata-isolation");
  const metaKey = api.constants.META_STORAGE_KEY;
  const markerKey = api.constants.DIRECT_SYNC_MARKER_KEY;
  assert.equal(metaKey, "clair.v8.sync.meta.clair-repas");
  assert.equal(markerKey, "clair.v8.direct-sync.clair-repas");
  assert.equal(harness.sync.valid({ [metaKey]: "x" }), false);
  assert.equal(harness.sync.valid({ [markerKey]: "x" }), false);
  assert.ok(harness.storage.getItem(metaKey));
  assert.ok(harness.storage.getItem(markerKey));
  assert.equal(harness.transport.rows.has(metaKey), false);
  assert.equal(harness.transport.rows.has(markerKey), false);
  assert.ok([...harness.transport.rows.keys()].every((key) => key.startsWith("cr")));
  assertOnlyProductionApp(harness.transport);
});

await check("Metadata quota failure is reported without losing local data", async () => {
  const storage = new FakeStorage();
  const baseSetItem = storage.setItem.bind(storage);
  storage.setItem = (key, value) => {
    if (key === api.constants.META_STORAGE_KEY) {
      throw new Error("metadata-quota");
    }
    baseSetItem(key, value);
  };
  const harness = makeHarness({
    values: { crQuotaSafe: "local-before" },
    storage
  });
  const result = await harness.runtime.syncNow("metadata-quota");
  assert.equal(result.reason, "error");
  assert.match(result.error, /sync-meta-persistence-failed/);
  assert.deepEqual(harness.sync.values, { crQuotaSafe: "local-before" });
  assert.equal(harness.runtime.getStatus().metaPersisted, false);
});

await check("A transient metadata failure preserves the original edit time", async () => {
  const storage = new FakeStorage();
  const baseSetItem = storage.setItem.bind(storage);
  let metaWrites = 0;
  let failMetaAt = Number.POSITIVE_INFINITY;
  storage.setItem = (key, value) => {
    if (key === api.constants.META_STORAGE_KEY) {
      metaWrites += 1;
      if (metaWrites === failMetaAt) throw new Error("one-shot-meta-failure");
    }
    baseSetItem(key, value);
  };
  const harness = makeHarness({
    values: { crTimed: "base" },
    storage
  });
  await harness.runtime.syncNow("seed-timestamp");
  harness.advance(1000);
  harness.sync.values.crTimed = "older-local-edit";
  assert.equal(harness.runtime.markDirty("crTimed"), true);
  harness.transport.putRemote("crTimed", "newer-remote-edit", {
    updatedAt: harness.future(1000)
  });
  metaWrites = 0;
  failMetaAt = 2;
  const failed = await harness.runtime.syncNow("one-shot-meta-failure");
  assert.equal(failed.reason, "error");
  assert.equal(harness.sync.values.crTimed, "older-local-edit");

  failMetaAt = Number.POSITIVE_INFINITY;
  harness.advance(10000);
  const retried = await harness.runtime.syncNow("retry-after-meta-failure");
  assert.equal(retried.synced, true, JSON.stringify(retried));
  assert.equal(harness.sync.values.crTimed, "newer-remote-edit");
  harness.runtime.stop();
});

await check("Startup, local, foreground, online and periodic triggers stay asynchronous", async () => {
  const sync = new FakeSync({ crTrigger: "one" });
  const transport = new MemoryTransport();
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeEventTarget();
  const timers = new Map();
  const intervals = new Map();
  let nextTimer = 1;
  const runtime = api.createRuntime({
    window: windowTarget,
    document: documentTarget,
    navigator: { onLine: true, userAgent: "Windows Chrome", platform: "Win32" },
    storage: new FakeStorage(),
    crypto: webcrypto,
    sync,
    transport,
    isHealthy: () => true,
    now: () => Date.parse("2026-08-21T10:00:00.000Z"),
    setTimeout(callback, delay) {
      const id = nextTimer++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    setInterval(callback, delay) {
      const id = nextTimer++;
      intervals.set(id, { callback, delay });
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    }
  });
  await runtime.start();
  assert.ok(windowTarget.listeners.get("online")?.size);
  assert.ok(windowTarget.listeners.get("storage")?.size);
  assert.ok(documentTarget.listeners.get("visibilitychange")?.size);
  assert.deepEqual(
    [...intervals.values()].map((entry) => entry.delay).sort((a, b) => a - b),
    [4000, 60000]
  );
  assert.ok([...timers.values()].some((entry) => entry.delay === 0));

  windowTarget.dispatch("online");
  assert.ok([...timers.values()].some((entry) => entry.delay === 150));
  documentTarget.dispatch("visibilitychange");
  assert.ok([...timers.values()].some((entry) => entry.delay === 150));
  sync.values.crTrigger = "two";
  [...intervals.values()].find((entry) => entry.delay === 4000).callback();
  assert.ok([...timers.values()].some((entry) => entry.delay === 500));
  [...intervals.values()].find((entry) => entry.delay === 60000).callback();
  assert.ok([...timers.values()].some((entry) => entry.delay === 0));

  runtime.stop();
  assert.equal(intervals.size, 0);
  assert.equal(windowTarget.listeners.get("online")?.size || 0, 0);
  assert.equal(documentTarget.listeners.get("visibilitychange")?.size || 0, 0);
});

if (failures.length) {
  console.error("\nCloud Sync validation failed:");
  failures.forEach((failure) => console.error("  - " + failure));
  console.error("\n" + successes.length + " checks passed, " + failures.length + " failed.");
  process.exitCode = 1;
} else {
  successes.forEach((success) => console.log("✓ " + success));
  console.log("\n" + successes.length + " Cloud Sync validation groups passed.");
}
