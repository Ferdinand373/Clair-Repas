#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(ROOT, "repair-local-production.html"), "utf8");
const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attributes, body]) => !/\bsrc\s*=/.test(attributes) && body.trim())
  .map(([, , body]) => body);
assert.equal(inlineScripts.length, 1, "Expected one inline repair script");
const source = inlineScripts[0];

const USER_ID = "production-user";
const AUTH_KEY = "sb-ryyewskgfgysfubesdsj-auth-token";
const BACKUP_PREFIX = "clair.repair.production.before.";
const ALLOWED_KEYS = [
  "crDays",
  "crFavMeals",
  "crHistoryV13",
  "crMealUsageV19",
  "crRecentRecipesV25",
  "crRecipeLearningV3",
  "crRecipeNotesV31",
  "crStateV13"
];
const VERSION = Object.freeze({
  foundationVersion: "8.0.0-foundation.12",
  productVersion: "7.5",
  cloudAppId: "clair-repas",
  cloudEnabled: false
});
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

class FakeStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries).map(([key, value]) => [key, String(value)]));
    this.failOnceKey = null;
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
    if (this.failOnceKey === key) {
      this.failOnceKey = null;
      throw new Error("injected-local-write-failure:" + key);
    }
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.dataset = {};
    this.children = [];
    this.listeners = new Map();
    this.disabled = false;
    this.textContent = "";
    this.className = "";
    this.checkIcon = { textContent: "" };
    this.checkLabel = { textContent: "" };
  }

  addEventListener(type, callback) {
    this.listeners.set(type, callback);
  }

  append(...children) {
    this.children.push(...children);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  querySelector(selector) {
    if (selector === ".check-icon") return this.checkIcon;
    if (selector === "span:last-child") return this.checkLabel;
    return null;
  }

  scrollIntoView() {}

  async trigger(type) {
    const callback = this.listeners.get(type);
    assert.equal(typeof callback, "function", this.id + " has no " + type + " listener");
    return callback({ type, currentTarget: this });
  }
}

function authSession() {
  return {
    access_token: "access-token-valid",
    refresh_token: "refresh-token-valid",
    expires_at: 1999999999,
    user: { id: USER_ID }
  };
}

function makeRows(values) {
  return ALLOWED_KEYS.map((key, index) => ({
    user_id: USER_ID,
    app_id: "clair-repas",
    data_key: key,
    payload: { value: structuredClone(values[key]) },
    deleted_at: null,
    revision: 100 + index
  }));
}

function crEntries(storage) {
  return [...storage.values]
    .filter(([key]) => /^cr[A-Za-z0-9_.-]+$/.test(key))
    .sort((left, right) => left[0].localeCompare(right[0]));
}

function backupEntries(storage) {
  return [...storage.values].filter(([key]) => key.startsWith(BACKUP_PREFIX));
}

function createHarness({
  rows,
  localValues = {},
  failOnceKey = null,
  cloneRemoteRows = true
}) {
  const initialEntries = {
    [AUTH_KEY]: JSON.stringify(authSession()),
    "technical.sentinel": "unchanged",
    ...localValues
  };
  const storage = new FakeStorage(initialEntries);
  storage.failOnceKey = failOnceKey;
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    },
    createElement(tag) {
      return new FakeElement(tag);
    }
  };
  const networkCalls = [];
  const queryCalls = [];
  let clientOptions = null;

  async function fetchMock(input, init) {
    if (input === "./v8/version.json") {
      return new Response(JSON.stringify(VERSION), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
    const request = input instanceof Request ? input : new Request(input, init);
    networkCalls.push({ method: request.method, url: request.url });
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }

  const client = {
    auth: {
      async getSession() {
        return { data: { session: structuredClone(authSession()) }, error: null };
      },
      async getUser() {
        return { data: { user: { id: USER_ID } }, error: null };
      }
    },
    from(table) {
      assert.equal(table, "clair_data");
      const call = { table, action: null, columns: null, filters: [] };
      queryCalls.push(call);
      const builder = {
        select(columns) {
          call.action = "select";
          call.columns = columns;
          return this;
        },
        eq(column, value) {
          call.filters.push(["eq", column, value]);
          return this;
        },
        async in(column, values) {
          call.filters.push(["in", column, [...values]]);
          assert.equal(call.action, "select", "clair_data must remain SELECT-only");
          return {
            data: cloneRemoteRows ? structuredClone(rows) : rows,
            error: null
          };
        }
      };
      return new Proxy(builder, {
        get(target, property, receiver) {
          if (Reflect.has(target, property)) return Reflect.get(target, property, receiver);
          throw new Error("Forbidden clair_data builder operation: " + String(property));
        }
      });
    }
  };

  const hostWindow = {
    localStorage: storage,
    location: {
      origin: "https://ferdinand373.github.io",
      pathname: "/Clair-Repas/repair-local-production.html"
    },
    fetch: fetchMock,
    confirm: () => true,
    supabase: {
      createClient(url, publishableKey, options) {
        assert.equal(url, "https://ryyewskgfgysfubesdsj.supabase.co");
        assert.match(publishableKey, /^sb_publishable_/);
        clientOptions = options;
        return client;
      }
    }
  };

  vm.runInNewContext(
    source,
    {
      window: hostWindow,
      document,
      Request,
      Response,
      URL,
      structuredClone,
      console
    },
    { filename: "repair-local-production.html:inline.js", timeout: 3000 }
  );

  return {
    storage,
    elements,
    networkCalls,
    queryCalls,
    rows,
    get clientOptions() {
      return clientOptions;
    },
    async analyze() {
      return elements.get("analyzeButton").trigger("click");
    },
    async repair() {
      return elements.get("repairButton").trigger("click");
    }
  };
}

function legacyValues() {
  return {
    crDays: "14",
    crFavMeals: ["favorite-1"],
    crHistoryV13: [{ id: "history-1", at: 1720000000000 }],
    crMealUsageV19: { "meal-1": { count: 2 } },
    crRecentRecipesV25: ["recipe-1", "recipe-2"],
    crRecipeLearningV3: { version: 3, choices: [] },
    crRecipeNotesV31: { "recipe-1": "À refaire" },
    crStateV13: { week: 2, filters: { quick: true } }
  };
}

function foundationStringValues() {
  return {
    crDays: " 14 ",
    crFavMeals: ' [ "favorite-1" ] ',
    crHistoryV13: '[\n  { "id": "history-1" }\n]',
    crMealUsageV19: '{ "meal-1": { "count": 2 } }',
    crRecentRecipesV25: '[ "recipe-1", "recipe-2" ]',
    crRecipeLearningV3: '{ "version": 3, "choices": [] }',
    crRecipeNotesV31: '{ "recipe-1": "À refaire" }',
    crStateV13: '{ "week": 2, "filters": { "quick": true } }'
  };
}

function oldLocalValues() {
  return {
    crDays: "1",
    crFavMeals: "[]",
    crHistoryV13: "[]",
    crMealUsageV19: "{}",
    crRecentRecipesV25: "[]",
    crRecipeLearningV3: "{}",
    crRecipeNotesV31: "{}",
    crStateV13: "{}",
    crUnrelated: "must-stay-identical"
  };
}

await check("Analysis is read-only and clair_data POST stays blocked", async () => {
  const rows = makeRows(legacyValues());
  const localValues = oldLocalValues();
  const harness = createHarness({ rows, localValues });
  const before = crEntries(harness.storage);

  assert.deepEqual(crEntries(harness.storage), before, "Initialization changed personal data");
  assert.equal(backupEntries(harness.storage).length, 0);
  assert.equal(harness.queryCalls.length, 0, "No analysis may start without a click");
  await harness.analyze();

  assert.deepEqual(crEntries(harness.storage), before, "Analysis changed personal data");
  assert.equal(backupEntries(harness.storage).length, 0);
  assert.equal(harness.queryCalls.length, 1);
  assert.equal(harness.queryCalls[0].action, "select");
  assert.deepEqual(
    harness.queryCalls[0].filters.slice(0, 2),
    [["eq", "user_id", USER_ID], ["eq", "app_id", "clair-repas"]]
  );
  assert.equal(harness.clientOptions.auth.persistSession, true);
  assert.equal(harness.clientOptions.auth.autoRefreshToken, false);
  assert.equal(harness.clientOptions.auth.storageKey, AUTH_KEY);

  const guardedFetch = harness.clientOptions.global.fetch;
  const networkCount = harness.networkCalls.length;
  await assert.rejects(
    guardedFetch("https://ryyewskgfgysfubesdsj.supabase.co/rest/v1/clair_data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    }),
    /Opération distante non autorisée/
  );
  assert.equal(harness.networkCalls.length, networkCount, "Blocked POST reached the network");
  const response = await guardedFetch(
    "https://ryyewskgfgysfubesdsj.supabase.co/rest/v1/clair_data?select=data_key",
    { method: "GET" }
  );
  assert.equal(response.ok, true);
  assert.equal(harness.networkCalls.at(-1).method, "GET");
});

await check("Legacy native production data repairs all 8 keys with one favorite", async () => {
  const values = legacyValues();
  const rows = makeRows(values);
  const remoteBefore = structuredClone(rows);
  const localValues = oldLocalValues();
  const beforeEntries = Object.fromEntries(Object.entries(localValues));
  const harness = createHarness({ rows, localValues });

  await harness.repair();

  for (const key of ALLOWED_KEYS) {
    const expected = typeof values[key] === "string" ? values[key] : JSON.stringify(values[key]);
    assert.equal(harness.storage.getItem(key), expected, key + " was not normalized");
    assert.equal(typeof harness.storage.getItem(key), "string");
  }
  assert.equal(JSON.parse(harness.storage.getItem("crFavMeals")).length, 1);
  assert.equal(harness.storage.getItem("crUnrelated"), "must-stay-identical");
  assert.deepEqual(rows, remoteBefore, "Remote rows or revisions changed");
  assert.ok(harness.queryCalls.length >= 1);
  assert.ok(harness.queryCalls.every((call) => call.action === "select"));
  assert.equal(harness.networkCalls.length, 0, "Repair performed an unexpected network request");
  assert.equal(harness.storage.getItem(AUTH_KEY), JSON.stringify(authSession()));
  assert.equal(harness.storage.getItem("technical.sentinel"), "unchanged");

  const backups = backupEntries(harness.storage);
  assert.equal(backups.length, 1);
  const backup = JSON.parse(backups[0][1]);
  assert.deepEqual(backup.values, beforeEntries);
  assert.equal(harness.elements.get("resultPanel").className, "card result visible success");
});

await check("Foundation JSON strings retain their exact representation per key", async () => {
  const values = foundationStringValues();
  const rows = makeRows(values);
  const remoteBefore = structuredClone(rows);
  const harness = createHarness({ rows, localValues: oldLocalValues() });

  await harness.repair();

  for (const key of ALLOWED_KEYS) {
    assert.equal(harness.storage.getItem(key), values[key], key + " string changed");
  }
  assert.deepEqual(rows, remoteBefore);
  assert.ok(harness.queryCalls.every((call) => call.action === "select"));
  assert.equal(harness.networkCalls.length, 0);
});

await check("crDays accepts a finite native number and rejects non-finite values", async () => {
  const finiteValues = legacyValues();
  finiteValues.crDays = 21.5;
  const finiteHarness = createHarness({
    rows: makeRows(finiteValues),
    localValues: oldLocalValues()
  });
  await finiteHarness.repair();
  assert.equal(finiteHarness.storage.getItem("crDays"), "21.5");
  assert.ok(finiteHarness.queryCalls.every((call) => call.action === "select"));

  const invalidValues = legacyValues();
  invalidValues.crDays = Number.POSITIVE_INFINITY;
  const invalidHarness = createHarness({
    rows: makeRows(invalidValues),
    localValues: oldLocalValues()
  });
  const before = crEntries(invalidHarness.storage);
  await invalidHarness.analyze();
  assert.deepEqual(crEntries(invalidHarness.storage), before);
  assert.equal(backupEntries(invalidHarness.storage).length, 0);
  assert.match(invalidHarness.elements.get("analysisStatus").textContent, /crDays/);
});

await check("Per-key type mismatch rejects analysis without local writes", async () => {
  const values = legacyValues();
  values.crFavMeals = { invalid: "object-instead-of-array" };
  const rows = makeRows(values);
  const localValues = oldLocalValues();
  const harness = createHarness({ rows, localValues });
  const before = crEntries(harness.storage);

  await harness.analyze();

  assert.deepEqual(crEntries(harness.storage), before);
  assert.equal(backupEntries(harness.storage).length, 0);
  assert.equal(harness.elements.get("repairButton").disabled, true);
  assert.match(harness.elements.get("analysisStatus").textContent, /type JSON invalide/);
  assert.equal(harness.networkCalls.length, 0);
});

await check("Non-plain native objects and inherited toJSON are rejected", async () => {
  const rows = makeRows(legacyValues());
  const customPrototype = Object.create(null);
  customPrototype.toJSON = () => null;
  const nonPlainValue = Object.create(customPrototype);
  nonPlainValue.version = 3;
  rows.find((row) => row.data_key === "crRecipeLearningV3").payload.value = nonPlainValue;
  const harness = createHarness({
    rows,
    localValues: oldLocalValues(),
    cloneRemoteRows: false
  });
  const before = crEntries(harness.storage);

  await harness.analyze();

  assert.deepEqual(crEntries(harness.storage), before);
  assert.equal(backupEntries(harness.storage).length, 0);
  assert.match(harness.elements.get("analysisStatus").textContent, /type JSON invalide/);

  const arrayRows = makeRows(legacyValues());
  const customArrayPrototype = Object.create(Array.prototype);
  customArrayPrototype.toJSON = () => null;
  const nonPlainArray = ["safe-looking"];
  Object.setPrototypeOf(nonPlainArray, customArrayPrototype);
  arrayRows.find((row) => row.data_key === "crHistoryV13").payload.value = nonPlainArray;
  const arrayHarness = createHarness({
    rows: arrayRows,
    localValues: oldLocalValues(),
    cloneRemoteRows: false
  });
  const arrayBefore = crEntries(arrayHarness.storage);
  await arrayHarness.analyze();
  assert.deepEqual(crEntries(arrayHarness.storage), arrayBefore);
  assert.equal(backupEntries(arrayHarness.storage).length, 0);
  assert.match(arrayHarness.elements.get("analysisStatus").textContent, /type JSON invalide/);
});

await check("Exactly one favorite means exactly one array entry", async () => {
  const values = legacyValues();
  values.crFavMeals = ["favorite-1", "favorite-1"];
  const harness = createHarness({
    rows: makeRows(values),
    localValues: oldLocalValues()
  });
  const before = crEntries(harness.storage);

  await harness.analyze();

  assert.deepEqual(crEntries(harness.storage), before);
  assert.equal(backupEntries(harness.storage).length, 0);
  assert.match(harness.elements.get("analysisStatus").textContent, /exactement 1 favori/);
});

await check("A partial local repair failure rolls back the complete before-image", async () => {
  const rows = makeRows(legacyValues());
  const remoteBefore = structuredClone(rows);
  const localValues = oldLocalValues();
  delete localValues.crHistoryV13;
  const harness = createHarness({
    rows,
    localValues,
    failOnceKey: "crRecentRecipesV25"
  });
  const before = crEntries(harness.storage);

  await harness.repair();

  assert.deepEqual(crEntries(harness.storage), before);
  assert.deepEqual(rows, remoteBefore);
  assert.equal(backupEntries(harness.storage).length, 1, "Verified backup must be retained");
  assert.equal(harness.storage.getItem("technical.sentinel"), "unchanged");
  assert.equal(harness.storage.getItem(AUTH_KEY), JSON.stringify(authSession()));
  assert.equal(harness.elements.get("resultPanel").className, "card result visible error");
  assert.ok(harness.queryCalls.every((call) => call.action === "select"));
  assert.equal(harness.networkCalls.length, 0);
});

if (failures.length > 0) {
  console.error(failures.map((failure) => "✗ " + failure).join("\n\n"));
  process.exitCode = 1;
} else {
  console.log(successes.map((success) => "✓ " + success).join("\n"));
  console.log("\n" + successes.length + " repair tool validation groups passed.");
}
