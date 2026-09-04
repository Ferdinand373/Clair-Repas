#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

process.env.TZ = "Europe/Paris";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexHtml = readFileSync(resolve(ROOT, "index.html"), "utf8");
const personalSync = readFileSync(resolve(ROOT, "v8/clair-sync.js"), "utf8");
const cloudSync = readFileSync(resolve(ROOT, "v8/clair-cloud-sync.js"), "utf8");

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, "Missing marker: " + startMarker);
  assert.ok(end > start, "Missing marker after " + startMarker + ": " + endMarker);
  return source.slice(start, end);
}

const inlineScripts = [
  ...indexHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)
]
  .filter(([, attributes, body]) => !/\bsrc\s*=/.test(attributes) && body.trim())
  .map(([, , body]) => body);
const application = inlineScripts.find((source) => source.includes("const recipeLibrary="));
assert.ok(application, "Missing Clair Repas application script");

const todayKeySource = between(
  application,
  "const todayKey=",
  "const SEASON_TRANSITION_DAYS="
);
const dayMsSource = application.match(/const DAY_MS=[^;]+;/)?.[0];
const calendarDaySource = application.match(/const calendarDay=[^;]+;/)?.[0];
const planStateSource = application.match(
  /let plan=\[\];\s*let planDate=todayKey\(\);/
)?.[0];
assert.ok(dayMsSource, "Missing DAY_MS constant");
assert.ok(calendarDaySource, "Missing calendarDay helper");
assert.ok(planStateSource, "Missing stable planDate state");

const dateFunctionsSource = between(
  application,
  "function dateFor(index){",
  "function formatQty(q){"
);
const persistenceSource = between(
  application,
  "function saveState(){",
  "function renderHistory(){"
);
const loadSource = between(
  application,
  "function loadOrCreate(){",
  "let toastTimer=null;"
);
const restoreSource = between(
  application,
  "function refreshRestoredPlan(){",
  "function restoredBrowserSelectionValid(selection){"
);
const newPlanSource = between(
  application,
  "$('newPlan').onclick=()=>{",
  "$('days').onchange=()=>{"
);

assert.doesNotMatch(todayKeySource, /toISOString|Date\.UTC|toLocaleDateString/);
assert.doesNotMatch(persistenceSource, /toISOString|Date\.UTC/);
assert.match(loadSource, /planDate=.*saved\.date/);
assert.match(restoreSource, /planDate=.*saved\.date/);
assert.match(
  newPlanSource,
  /planDate=todayKey\(\);\s*plan=buildPlan\(count\)/,
  "A newly generated plan must start on the current civil date"
);

let nowIso = "2026-09-04T10:00:00+02:00";
class ClockDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [nowIso]));
  }
  static now() {
    return Date.parse(nowIso);
  }
}

const values = new Map();
const localStorage = {
  get length() {
    return values.size;
  },
  key(index) {
    return [...values.keys()][index] ?? null;
  },
  getItem(key) {
    return values.has(key) ? values.get(key) : null;
  },
  setItem(key, value) {
    values.set(key, String(value));
  },
  removeItem(key) {
    values.delete(key);
  }
};
const elements = {
  days: { value: "2" },
  mode: { value: "Tous" },
  timeAvailable: { value: "Tous" }
};
const normalizedDay = (item = {}) => ({
  mid: item.midId ? { id: item.midId } : null,
  eve: item.eveId ? { id: item.eveId } : null,
  midStarter: null,
  eveStarter: null,
  midDessert: null,
  eveDessert: null,
  midSauce: null,
  eveSauce: null,
  midSide: null,
  eveSide: null,
  midStatus: item.midStatus || "planned",
  eveStatus: item.eveStatus || "planned",
  midFormat: item.midFormat || "dish",
  eveFormat: item.eveFormat || "dish"
});
const context = {
  Date: ClockDate,
  Intl,
  localStorage,
  $: (id) => elements[id],
  isManualChoice: () => false,
  mealFormat: (day, type) => day?.[type + "Format"] || "dish",
  mealStatus: (day, type) => day?.[type + "Status"] || "planned",
  safeStoredJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  },
  renderHistory() {},
  loadSavedPlan: (savedPlan) => savedPlan.map(normalizedDay),
  ensureDays() {},
  buildPlan: () => [normalizedDay()],
  render() {}
};

vm.runInNewContext(
  [
    todayKeySource,
    dayMsSource,
    calendarDaySource,
    planStateSource,
    dateFunctionsSource,
    persistenceSource,
    loadSource,
    restoreSource,
    `globalThis.__planningDates = {
      todayKey,
      dateFor,
      dayLabel,
      formatDate,
      saveState,
      saveHistory,
      loadOrCreate,
      refreshRestoredPlan,
      getPlan: () => plan,
      getPlanDate: () => planDate,
      setPlanDate: (value) => { planDate = value; }
    };`
  ].join("\n"),
  context,
  { filename: "index.html:planning-date-contract", timeout: 3000 }
);
const planning = context.__planningDates;

function dayRecord(midId = null, eveId = null) {
  return {
    midId,
    eveId,
    midStatus: "planned",
    eveStatus: "planned",
    midFormat: "dish",
    eveFormat: "dish"
  };
}

function dateKey(date) {
  return planning.todayKey(date);
}

assert.equal(
  dateKey(new ClockDate("2026-09-03T22:30:00.000Z")),
  "2026-09-04",
  "Europe/Paris local day must not be serialized as the UTC day"
);

const savedSeptember3 = {
  date: "2026-09-03",
  days: 2,
  mode: "Tous",
  timeAvailable: "Tous",
  plan: [dayRecord(), dayRecord("n01", "s01")]
};
localStorage.setItem("crStateV13", JSON.stringify(savedSeptember3));
context.render = () => planning.saveState();
planning.loadOrCreate();

let persisted = JSON.parse(localStorage.getItem("crStateV13"));
assert.equal(persisted.date, "2026-09-03");
assert.equal(dateKey(planning.dateFor(1)), "2026-09-04");
assert.notEqual(dateKey(planning.dateFor(1)), "2026-09-05");
assert.equal(planning.dayLabel(0), "Hier");
assert.equal(planning.dayLabel(1), "Aujourd’hui");

planning.getPlan()[1].mid = { id: "n02" };
planning.saveState();
persisted = JSON.parse(localStorage.getItem("crStateV13"));
assert.equal(persisted.date, "2026-09-03");
assert.equal(persisted.plan[1].midId, "n02");

planning.saveHistory();
const history = JSON.parse(localStorage.getItem("crHistoryV13"));
assert.equal(history[0].date, "2026-09-03");

planning.setPlanDate("2026-09-04");
assert.deepEqual(
  [0, 1, 2].map((index) => dateKey(planning.dateFor(index))),
  ["2026-09-04", "2026-09-05", "2026-09-06"]
);

for (const [base, expected] of [
  ["2026-08-31", "2026-09-01"],
  ["2026-12-31", "2027-01-01"],
  ["2026-03-28", "2026-03-29"],
  ["2026-10-24", "2026-10-25"]
]) {
  planning.setPlanDate(base);
  assert.equal(dateKey(planning.dateFor(1)), expected, base + " + 1 civil day");
}

const restoredState = {
  ...savedSeptember3,
  date: "2026-10-24",
  plan: [dayRecord("n03"), dayRecord("n04")]
};
localStorage.setItem("crStateV13", JSON.stringify(restoredState));
context.render = () => {};
planning.refreshRestoredPlan();
assert.equal(planning.getPlanDate(), "2026-10-24");
planning.saveState();
assert.equal(JSON.parse(localStorage.getItem("crStateV13")).date, "2026-10-24");

const legacyState = { ...savedSeptember3 };
delete legacyState.date;
localStorage.setItem("crStateV13", JSON.stringify(legacyState));
context.render = () => planning.saveState();
planning.loadOrCreate();
assert.equal(JSON.parse(localStorage.getItem("crStateV13")).date, "2026-09-04");

for (const invalidDate of ["2026-02-31", "2026-13-01", "0000-01-01"]) {
  localStorage.setItem(
    "crStateV13",
    JSON.stringify({ ...savedSeptember3, date: invalidDate })
  );
  context.render = () => planning.saveState();
  planning.loadOrCreate();
  assert.equal(
    JSON.parse(localStorage.getItem("crStateV13")).date,
    "2026-09-04",
    invalidDate + " must fall back to the current valid civil date"
  );
}

localStorage.setItem(
  "crStateV13",
  JSON.stringify({ ...savedSeptember3, date: "2024-02-29" })
);
context.render = () => planning.saveState();
planning.loadOrCreate();
assert.equal(JSON.parse(localStorage.getItem("crStateV13")).date, "2024-02-29");
assert.equal(dateKey(planning.dateFor(1)), "2024-03-01");

const exactState = JSON.stringify(savedSeptember3);
values.clear();
localStorage.setItem("crStateV13", exactState);
const syncContext = {
  window: {},
  document: {
    currentScript: {
      dataset: {
        clairApp: "clair-repas",
        clairRelease: "8.0.0-foundation.15",
        clairSchema: "2",
        clairCore: "sha256:planning-date-test"
      }
    }
  },
  location: {
    href: "https://example.test/Clair-Repas/index.html",
    pathname: "/Clair-Repas/"
  },
  URL,
  localStorage
};
vm.runInNewContext(personalSync, syncContext, {
  filename: "v8/clair-sync.js:planning-date-roundtrip",
  timeout: 3000
});
const sync = syncContext.window.ClairSync;
assert.equal(sync.capture().values.crStateV13, exactState);
assert.equal(sync.restore({ crStateV13: exactState }), true);
assert.equal(localStorage.getItem("crStateV13"), exactState);
assert.match(cloudSync, /value:\s*present \? value : null/);

console.log(
  "✓ Planning civil dates: Europe/Paris, creation anchor, reload, edit, sync round-trip, calendar validity and DST boundaries"
);
