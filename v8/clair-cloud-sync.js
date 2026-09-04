(() => {
  'use strict';

  const script = document.currentScript;
  const LOCAL_APP_ID = script?.dataset?.clairApp || 'clair';
  const RELEASE = script?.dataset?.clairRelease || '8.0.0-foundation.15';
  const DATA_SCHEMA = Number(script?.dataset?.clairSchema || 2);
  const LEGACY_DATA_SCHEMA = 1;
  const CORE_REVISION = script?.dataset?.clairCore || '';

  const CLOUD_PROTOCOL = 'clair-cloud-sync/v1';
  const META_PROTOCOL = 'clair-cloud-sync-meta/v1';
  const PERSONAL_SYNC_PROTOCOL = 'clair-personal-sync/v1';
  const CLOUD_APP_ID = String(script?.dataset?.clairCloudApp || '').trim();
  const CLOUD_ENABLED = script?.dataset?.clairCloudEnabled === 'true';
  const DIRECT_SYNC_PROTOCOL = String(
    script?.dataset?.clairDirectSync || ''
  ).trim();
  const INTEGRATION = 'clair-v8-foundation.9';
  const VALID_CLOUD_APP_ID = /^[a-z0-9](?:[a-z0-9-]{0,62})$/;
  const CLOUD_CONFIGURED = Boolean(
    VALID_CLOUD_APP_ID.test(CLOUD_APP_ID) &&
    DIRECT_SYNC_PROTOCOL === PERSONAL_SYNC_PROTOCOL
  );
  const BOOTSTRAP_GENERATION = 'bootstrap-v2';
  const META_STORAGE_KEY = CLOUD_CONFIGURED
    ? 'clair.v8.sync.meta.' + CLOUD_APP_ID + '.' + BOOTSTRAP_GENERATION
    : '';
  const DIRECT_SYNC_MARKER_KEY = CLOUD_CONFIGURED
    ? 'clair.v8.direct-sync.' + CLOUD_APP_ID + '.' + BOOTSTRAP_GENERATION
    : '';
  const DEVICE_KEY_STORAGE = 'clair.device.key.v1';
  const SUPABASE_URL = 'https://ryyewskgfgysfubesdsj.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_T9Dmg9VKTdMFdCuLVxD54w_7GeH3Q6S';
  const SUPABASE_JS_PATH = './v8/vendor/supabase-js-2.111.0.js';
  const LOCAL_SCAN_MS = 4000;
  const PERIODIC_SYNC_MS = 60000;
  const BOOT_WAIT_MS = 20000;
  const HANDOVER_SNAPSHOT_KIND = 'cloud-device-bootstrap-v2';
  const REMOTE_EXISTING_ACCOUNT = 'remote-existing-account';
  const LOCAL_NEW_ACCOUNT = 'local-new-account';
  const PERSONAL_DATA_RESTORED_EVENT = 'clair:personal-data-restored';

  const MISSING = Object.freeze({ missing: true });
  // Le planning est un snapshot ordonné : fusionner plan[] comme un ensemble
  // peut décaler les jours et dupliquer des repas.
  const ATOMIC_NEWEST_WINS_KEYS = new Set(['crStateV13']);

  function isReadableRemoteDataSchema(value) {
    return value === LEGACY_DATA_SCHEMA || value === DATA_SCHEMA;
  }

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function isPlainObject(value) {
    return Boolean(
      value &&
      Object.prototype.toString.call(value) === '[object Object]'
    );
  }

  function isJsonPlainObject(value) {
    if (!isPlainObject(value)) return false;
    try {
      const prototype = Object.getPrototypeOf(value);
      if (prototype === null) return true;
      if (Object.getPrototypeOf(prototype) !== null) return false;
      if (Object.getOwnPropertyDescriptor(prototype, 'toJSON')) return false;
      const constructor = Object.getOwnPropertyDescriptor(
        prototype,
        'constructor'
      );
      if (
        !constructor ||
        !own(constructor, 'value') ||
        typeof constructor.value !== 'function' ||
        Function.prototype.toString.call(constructor.value) !==
          Function.prototype.toString.call(Object)
      ) return false;
      const expectedNames = Object.getOwnPropertyNames(Object.prototype).sort();
      const prototypeNames = Object.getOwnPropertyNames(prototype).sort();
      return (
        expectedNames.length === prototypeNames.length &&
        expectedNames.every((name, index) => name === prototypeNames[index]) &&
        Object.getOwnPropertySymbols(prototype).length ===
          Object.getOwnPropertySymbols(Object.prototype).length
      );
    } catch (_) {
      return false;
    }
  }

  function isJsonArray(value) {
    if (!Array.isArray(value)) return false;
    try {
      const prototype = Object.getPrototypeOf(value);
      if (!prototype) return false;
      const objectPrototype = Object.getPrototypeOf(prototype);
      if (!objectPrototype || Object.getPrototypeOf(objectPrototype) !== null) {
        return false;
      }
      if (Object.getOwnPropertyDescriptor(prototype, 'toJSON')) return false;
      const constructor = Object.getOwnPropertyDescriptor(
        prototype,
        'constructor'
      );
      if (
        !constructor ||
        !own(constructor, 'value') ||
        typeof constructor.value !== 'function' ||
        Function.prototype.toString.call(constructor.value) !==
          Function.prototype.toString.call(Array)
      ) return false;
      const expectedNames = Object.getOwnPropertyNames(Array.prototype).sort();
      const prototypeNames = Object.getOwnPropertyNames(prototype).sort();
      return (
        expectedNames.length === prototypeNames.length &&
        expectedNames.every((name, index) => name === prototypeNames[index]) &&
        Object.getOwnPropertySymbols(prototype).length ===
          Object.getOwnPropertySymbols(Array.prototype).length
      );
    } catch (_) {
      return false;
    }
  }

  function isJsonValue(value, seen = new Set()) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
      return true;
    }
    if (typeof value === 'number') return Number.isFinite(value);
    const arrayValue = Array.isArray(value);
    if (arrayValue ? !isJsonArray(value) : !isJsonPlainObject(value)) return false;
    if (seen.has(value)) return false;

    seen.add(value);
    try {
      if (Object.getOwnPropertySymbols(value).length !== 0) return false;
      const names = Object.getOwnPropertyNames(value);
      if (arrayValue) {
        if (names.length !== value.length + 1 || !names.includes('length')) {
          return false;
        }
        for (let index = 0; index < value.length; index += 1) {
          const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
          if (!descriptor || !own(descriptor, 'value') || !descriptor.enumerable) {
            return false;
          }
          if (!isJsonValue(descriptor.value, seen)) return false;
        }
        return true;
      }

      for (const key of names) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !own(descriptor, 'value') || !descriptor.enumerable) {
          return false;
        }
        if (!isJsonValue(descriptor.value, seen)) return false;
      }
      return true;
    } catch (_) {
      return false;
    } finally {
      seen.delete(value);
    }
  }

  function copyJsonValue(value) {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
      const copy = [];
      Object.setPrototypeOf(copy, null);
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        Object.defineProperty(copy, String(index), {
          value: copyJsonValue(descriptor.value),
          enumerable: true,
          configurable: true,
          writable: true
        });
      }
      return copy;
    }
    const copy = Object.create(null);
    for (const key of Object.getOwnPropertyNames(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      Object.defineProperty(copy, key, {
        value: copyJsonValue(descriptor.value),
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    return copy;
  }

  function normalizeRemoteLocalStorageValue(value, key = 'unknown') {
    if (typeof value === 'string') return value;
    const supported =
      Array.isArray(value) ||
      isJsonPlainObject(value) ||
      (typeof value === 'number' && Number.isFinite(value)) ||
      typeof value === 'boolean';
    if (!supported || !isJsonValue(value)) {
      throw new Error('invalid-remote-payload:' + String(key));
    }
    try {
      const normalized = JSON.stringify(copyJsonValue(value));
      if (typeof normalized !== 'string') throw new Error('not-a-string');
      return normalized;
    } catch (_) {
      throw new Error('invalid-remote-payload:' + String(key));
    }
  }

  function stableJson(value) {
    if (Array.isArray(value)) {
      return '[' + value.map(stableJson).join(',') + ']';
    }
    if (isPlainObject(value)) {
      return '{' + Object.keys(value).sort().map((key) =>
        JSON.stringify(key) + ':' + stableJson(value[key])
      ).join(',') + '}';
    }
    return JSON.stringify(value);
  }

  function sameJson(left, right) {
    if (left === MISSING || right === MISSING) return left === right;
    return stableJson(left) === stableJson(right);
  }

  function cloneJson(value) {
    if (value === MISSING) return MISSING;
    if (Array.isArray(value)) return value.map(cloneJson);
    if (isPlainObject(value)) {
      const next = {};
      for (const key of Object.keys(value)) next[key] = cloneJson(value[key]);
      return next;
    }
    return value;
  }

  function mergeArrays(localValue, remoteValue, preferLocal) {
    const ordered = preferLocal
      ? [...localValue, ...remoteValue]
      : [...remoteValue, ...localValue];
    const seen = new Set();
    const result = [];
    for (const item of ordered) {
      const identity = stableJson(item);
      if (seen.has(identity)) continue;
      seen.add(identity);
      result.push(cloneJson(item));
    }
    return result;
  }

  function mergeJsonNode(
    baseValue,
    localValue,
    remoteValue,
    preferLocal,
    conflicts = [],
    path = []
  ) {
    if (sameJson(localValue, remoteValue)) return cloneJson(localValue);
    if (sameJson(localValue, baseValue)) return cloneJson(remoteValue);
    if (sameJson(remoteValue, baseValue)) return cloneJson(localValue);

    if (localValue === MISSING) {
      if (remoteValue === MISSING) return MISSING;
      if (baseValue === MISSING) return cloneJson(remoteValue);
      return sameJson(remoteValue, baseValue) ? MISSING : cloneJson(remoteValue);
    }

    if (remoteValue === MISSING) {
      if (baseValue === MISSING) return cloneJson(localValue);
      return sameJson(localValue, baseValue) ? MISSING : cloneJson(localValue);
    }

    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      return mergeArrays(localValue, remoteValue, preferLocal);
    }

    if (isPlainObject(localValue) && isPlainObject(remoteValue)) {
      const result = {};
      const keys = new Set([
        ...Object.keys(isPlainObject(baseValue) ? baseValue : {}),
        ...Object.keys(localValue),
        ...Object.keys(remoteValue)
      ]);
      for (const key of [...keys].sort()) {
        const baseChild =
          isPlainObject(baseValue) && own(baseValue, key)
            ? baseValue[key]
            : MISSING;
        const localChild = own(localValue, key) ? localValue[key] : MISSING;
        const remoteChild = own(remoteValue, key) ? remoteValue[key] : MISSING;
        const merged = mergeJsonNode(
          baseChild,
          localChild,
          remoteChild,
          preferLocal,
          conflicts,
          [...path, key]
        );
        if (merged !== MISSING) result[key] = merged;
      }
      return result;
    }

    conflicts.push({
      path: [...path],
      local: cloneJson(localValue),
      remote: cloneJson(remoteValue),
      resolved: preferLocal ? 'local' : 'remote'
    });
    return cloneJson(preferLocal ? localValue : remoteValue);
  }

  function parseJsonContainer(raw) {
    if (typeof raw !== 'string') return null;
    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) || isPlainObject(value) ? value : null;
    } catch (_) {
      return null;
    }
  }

  function sameJsonContainerStrings(leftRaw, rightRaw) {
    const left = parseJsonContainer(leftRaw);
    const right = parseJsonContainer(rightRaw);
    const bothArrays = Array.isArray(left) && Array.isArray(right);
    const bothObjects = isPlainObject(left) && isPlainObject(right);
    return (bothArrays || bothObjects) && sameJson(left, right);
  }

  function mergePersonalStrings(baseRaw, localRaw, remoteRaw, preferLocal) {
    const localValue = parseJsonContainer(localRaw);
    const remoteValue = parseJsonContainer(remoteRaw);
    const bothArrays = Array.isArray(localValue) && Array.isArray(remoteValue);
    const bothObjects =
      isPlainObject(localValue) && isPlainObject(remoteValue);
    if (!bothArrays && !bothObjects) {
      return {
        mergeable: false,
        value: preferLocal ? localRaw : remoteRaw,
        conflicts: []
      };
    }

    const parsedBase = parseJsonContainer(baseRaw);
    const compatibleBase =
      (bothArrays && Array.isArray(parsedBase)) ||
      (bothObjects && isPlainObject(parsedBase))
        ? parsedBase
        : MISSING;
    const conflicts = [];
    const merged = mergeJsonNode(
      compatibleBase,
      localValue,
      remoteValue,
      preferLocal,
      conflicts
    );
    return {
      mergeable: true,
      value: JSON.stringify(merged),
      conflicts
    };
  }

  async function fingerprint(value, cryptoApi = crypto) {
    const bytes = new TextEncoder().encode(String(value));
    if (cryptoApi?.subtle?.digest) {
      const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
      return 'sha256:' + Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }

    let hash = 0x811c9dc5;
    for (const byte of bytes) {
      hash ^= byte;
      hash = Math.imul(hash, 0x01000193);
    }
    return 'fnv1a:' + (hash >>> 0).toString(16).padStart(8, '0');
  }

  function cloudGateReason() {
    if (!CLOUD_CONFIGURED) {
      return CLOUD_APP_ID ? 'cloud-config-invalid' : 'cloud-app-missing';
    }
    if (!CLOUD_ENABLED) return 'production-not-enabled';
    return null;
  }

  function readDirectSyncMarker(storage) {
    if (!DIRECT_SYNC_MARKER_KEY) return { status: 'missing', marker: null };
    let raw;
    try {
      raw = storage.getItem(DIRECT_SYNC_MARKER_KEY);
    } catch (_) {
      return { status: 'unreadable', marker: null };
    }
    if (raw === null) return { status: 'missing', marker: null };
    try {
      const marker = JSON.parse(raw);
      return isPlainObject(marker)
        ? { status: 'valid', marker }
        : { status: 'invalid', marker: null };
    } catch (_) {
      return { status: 'invalid', marker: null };
    }
  }

  function writeDirectSyncMarker(storage, patch = {}) {
    if (!DIRECT_SYNC_MARKER_KEY) return false;
    const loaded = readDirectSyncMarker(storage);
    try {
      const existing = loaded.status === 'valid' ? loaded.marker : null;
      const device =
        storage.getItem(DEVICE_KEY_STORAGE) ||
        (isPlainObject(existing) ? existing.device : null) ||
        null;
      const marker = {
        enabled: CLOUD_ENABLED,
        healthy: false,
        lastSuccessfulSync: null,
        release: RELEASE,
        device,
        appId: CLOUD_APP_ID,
        localAppId: LOCAL_APP_ID,
        protocol: CLOUD_PROTOCOL,
        directSyncProtocol: DIRECT_SYNC_PROTOCOL,
        bootstrapGeneration: BOOTSTRAP_GENERATION,
        bootstrapMode: null,
        dataSchema: DATA_SCHEMA,
        coreRevision: CORE_REVISION,
        ...(isPlainObject(existing) ? existing : {}),
        ...patch,
        enabled: CLOUD_ENABLED,
        release: RELEASE,
        device,
        appId: CLOUD_APP_ID,
        localAppId: LOCAL_APP_ID,
        protocol: CLOUD_PROTOCOL,
        directSyncProtocol: DIRECT_SYNC_PROTOCOL,
        bootstrapGeneration: BOOTSTRAP_GENERATION,
        dataSchema: DATA_SCHEMA,
        coreRevision: CORE_REVISION
      };
      storage.setItem(DIRECT_SYNC_MARKER_KEY, JSON.stringify(marker));
      return true;
    } catch (_) {
      return false;
    }
  }

  function freshMetaRoot() {
    return {
      protocol: META_PROTOCOL,
      appId: CLOUD_APP_ID,
      accounts: {}
    };
  }

  function loadMetaRoot(storage) {
    let raw;
    try {
      raw = storage.getItem(META_STORAGE_KEY);
    } catch (_) {
      return { status: 'unreadable', root: null, raw: null };
    }
    if (raw === null) {
      return { status: 'missing', root: freshMetaRoot(), raw: null };
    }
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.protocol === META_PROTOCOL &&
        parsed.appId === CLOUD_APP_ID &&
        isPlainObject(parsed.accounts)
      ) return { status: 'valid', root: parsed, raw };
    } catch (_) {}
    return { status: 'invalid', root: null, raw };
  }

  function accountMeta(root, userId) {
    const current = root.accounts[userId];
    if (
      current &&
      current.userId === userId &&
      isPlainObject(current.keys)
    ) {
      if (!isPlainObject(current.conflicts)) current.conflicts = {};
      if (!isPlainObject(current.handover)) {
        current.handover = {
          completedAt:
            Object.keys(current.keys).length > 0 || current.lastSyncAt
              ? current.lastSyncAt || '1970-01-01T00:00:00.000Z'
              : null,
          preparedAt: null,
          snapshotFingerprint: null,
          mode: null
        };
      } else if (!own(current.handover, 'mode')) {
        current.handover.mode = null;
      }
      return current;
    }
    const next = {
      userId,
      keys: {},
      conflicts: {},
      lastSyncAt: null,
      handover: {
        completedAt: null,
        preparedAt: null,
        snapshotFingerprint: null,
        mode: null
      }
    };
    root.accounts[userId] = next;
    return next;
  }

  function writeMetaRoot(storage, root) {
    try {
      storage.setItem(META_STORAGE_KEY, JSON.stringify(root));
      return true;
    } catch (_) {
      return false;
    }
  }

  function randomDeviceKey(cryptoApi = crypto) {
    if (typeof cryptoApi?.randomUUID === 'function') {
      return cryptoApi.randomUUID();
    }
    return (
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2) +
      '-' +
      Math.random().toString(36).slice(2)
    );
  }

  function deviceKey(storage, cryptoApi = crypto) {
    try {
      const existing = storage.getItem(DEVICE_KEY_STORAGE);
      if (typeof existing === 'string' && existing.length >= 8) return existing;
      const created = randomDeviceKey(cryptoApi);
      storage.setItem(DEVICE_KEY_STORAGE, created);
      return created;
    } catch (_) {
      return randomDeviceKey(cryptoApi);
    }
  }

  function platformLabel(navigatorApi = navigator) {
    const userAgent = String(navigatorApi?.userAgent || '');
    if (/iPhone/i.test(userAgent)) return 'iPhone';
    if (/iPad/i.test(userAgent)) return 'iPad';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Macintosh|Mac OS X/i.test(userAgent)) return 'Mac';
    if (/Linux/i.test(userAgent)) return 'Linux';
    return 'Navigateur';
  }

  function browserLabel(navigatorApi = navigator) {
    const userAgent = String(navigatorApi?.userAgent || '');
    if (/Edg\//.test(userAgent)) return 'Edge';
    if (/CriOS|Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) {
      return 'Chrome';
    }
    if (/FxiOS|Firefox\//.test(userAgent)) return 'Firefox';
    if (
      /Safari\//.test(userAgent) &&
      !/Chrome\//.test(userAgent) &&
      !/CriOS/.test(userAgent)
    ) return 'Safari';
    return 'Web';
  }

  function deviceLabel(navigatorApi = navigator) {
    return platformLabel(navigatorApi) + ' • ' + browserLabel(navigatorApi);
  }

  function isPersonalKey(sync, key) {
    if (typeof key !== 'string' || !key) return false;
    try {
      return sync.valid({ [key]: '' }) === true;
    } catch (_) {
      return false;
    }
  }

  function normalizeRevision(value) {
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  }

  function rowTime(row) {
    const value = row?.deleted_at || row?.updated_at;
    const time = Date.parse(value || '');
    return Number.isFinite(time) ? time : 0;
  }

  function localTime(entry) {
    const time = Date.parse(entry?.localChangedAt || '');
    return Number.isFinite(time) ? time : 0;
  }

  function liveRemoteValue(row) {
    if (!row || row.deleted_at) return { present: false, value: null };
    const rawValue = row.payload?.value;
    const value = normalizeRemoteLocalStorageValue(
      rawValue,
      row.data_key || 'unknown'
    );
    return {
      present: true,
      value,
      legacyJsonContainer:
        Array.isArray(rawValue) || isJsonPlainObject(rawValue)
    };
  }

  class SyncConflictError extends Error {
    constructor() {
      super('remote-revision-conflict');
      this.name = 'SyncConflictError';
    }
  }

  function createSupabaseTransport(client) {
    const selectedColumns =
      'id,user_id,app_id,data_key,payload,schema_version,revision,' +
      'last_device_id,updated_at,deleted_at';

    function assertRemoteAllowed(appId = CLOUD_APP_ID) {
      const gate = cloudGateReason();
      if (gate) throw new Error(gate);
      if (appId !== CLOUD_APP_ID) throw new Error('forbidden-app-id');
    }

    return {
      async getAuthenticatedUser() {
        assertRemoteAllowed();
        const sessionResult = await client.auth.getSession();
        if (sessionResult.error || !sessionResult.data?.session?.user) return null;
        const userResult = await client.auth.getUser();
        if (userResult.error || !userResult.data?.user) return null;
        if (userResult.data.user.id !== sessionResult.data.session.user.id) {
          return null;
        }
        return userResult.data.user;
      },

      async registerDevice(record) {
        assertRemoteAllowed();
        const result = await client
          .from('clair_devices')
          .upsert(record, { onConflict: 'user_id,device_key' })
          .select('id,user_id,device_key,label,platform,last_seen_at')
          .single();
        if (result.error) throw result.error;
        return result.data;
      },

      async listData(query) {
        assertRemoteAllowed(query.app_id);
        const result = await client
          .from('clair_data')
          .select(selectedColumns)
          .eq('user_id', query.user_id)
          .eq('app_id', CLOUD_APP_ID);
        if (result.error) throw result.error;
        return result.data || [];
      },

      async getData(query) {
        assertRemoteAllowed(query.app_id);
        const result = await client
          .from('clair_data')
          .select(selectedColumns)
          .eq('user_id', query.user_id)
          .eq('app_id', CLOUD_APP_ID)
          .eq('data_key', query.data_key)
          .maybeSingle();
        if (result.error) throw result.error;
        return result.data || null;
      },

      async writeData(record, expectedRow) {
        assertRemoteAllowed(record.app_id);
        if (expectedRow) {
          // Le trigger BEFORE UPDATE `clair_data_bump_revision` porte la
          // révision serveur à old.revision + 1. Le filtre ci-dessous est le
          // compare-and-swap qui empêche une écriture sur une base périmée.
          const changes = {
            payload: record.payload,
            schema_version: record.schema_version,
            last_device_id: record.last_device_id,
            updated_at: record.updated_at,
            deleted_at: record.deleted_at
          };
          const result = await client
            .from('clair_data')
            .update(changes)
            .eq('user_id', record.user_id)
            .eq('app_id', CLOUD_APP_ID)
            .eq('data_key', record.data_key)
            .eq('revision', expectedRow.revision)
            .select(selectedColumns)
            .maybeSingle();
          if (result.error) throw result.error;
          if (!result.data) throw new SyncConflictError();
          return result.data;
        }

        const result = await client
          .from('clair_data')
          .insert({ ...record, revision: 1 })
          .select(selectedColumns)
          .single();
        if (result.error?.code === '23505') throw new SyncConflictError();
        if (result.error) throw result.error;
        return result.data;
      },

      subscribeAuth(callback) {
        assertRemoteAllowed();
        const subscription = client.auth.onAuthStateChange((_event, session) => {
          callback(Boolean(session?.user));
        });
        return () => subscription?.data?.subscription?.unsubscribe?.();
      }
    };
  }

  function loadSupabaseLibrary(hostWindow = window, hostDocument = document) {
    const pinnedSelector = 'script[data-clair-supabase-js="2.111.0"]';
    const pinnedScript = hostDocument.querySelector?.(pinnedSelector);
    if (
      pinnedScript?.dataset?.clairSupabaseReady === 'true' &&
      typeof hostWindow.supabase?.createClient === 'function'
    ) {
      return Promise.resolve(hostWindow.supabase);
    }

    return new Promise((resolve, reject) => {
      let existing = pinnedScript;
      if (existing?.dataset?.clairSupabaseFailed === 'true') {
        existing.remove?.();
        existing = null;
      }
      const libraryScript = existing || hostDocument.createElement('script');
      let settled = false;
      let timeoutId = null;

      const finish = (error) => {
        if (settled) return;
        settled = true;
        if (timeoutId !== null) clearTimeout(timeoutId);
        if (error) {
          libraryScript.dataset.clairSupabaseFailed = 'true';
          reject(error);
          return;
        }
        if (typeof hostWindow.supabase?.createClient !== 'function') {
          libraryScript.dataset.clairSupabaseFailed = 'true';
          reject(new Error('supabase-library-unavailable'));
          return;
        }
        libraryScript.dataset.clairSupabaseReady = 'true';
        resolve(hostWindow.supabase);
      };

      libraryScript.addEventListener('load', () => finish(), { once: true });
      libraryScript.addEventListener(
        'error',
        () => finish(new Error('supabase-library-load-failed')),
        { once: true }
      );

      if (!existing) {
        libraryScript.src = SUPABASE_JS_PATH;
        libraryScript.async = true;
        libraryScript.dataset.clairSupabaseJs = '2.111.0';
        hostDocument.head.appendChild(libraryScript);
      }

      timeoutId = setTimeout(
        () => finish(new Error('supabase-library-timeout')),
        15000
      );
    });
  }

  function createRuntime(options = {}) {
    const hostWindow = options.window || window;
    const hostDocument = options.document || document;
    const navigatorApi = options.navigator || navigator;
    const storage = options.storage || localStorage;
    const cryptoApi = options.crypto || crypto;
    const sync = options.sync || hostWindow.ClairSync;
    const now = options.now || (() => Date.now());
    const scheduleTimeout = options.setTimeout || setTimeout;
    const cancelTimeout = options.clearTimeout || clearTimeout;
    const scheduleInterval = options.setInterval || setInterval;
    const cancelInterval = options.clearInterval || clearInterval;
    const healthy =
      options.isHealthy ||
      (() => {
        try {
          const status = hostWindow.ClairV8?.getStatus?.();
          return Boolean(status?.bootResolved && !status?.fatalError);
        } catch (_) {
          return false;
        }
      });

    const state = {
      phase: 'idle',
      reason: null,
      appId: CLOUD_APP_ID || null,
      enabled: CLOUD_ENABLED,
      authenticated: false,
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
      metaPersisted: true,
      bootstrapMode: null,
      started: false
    };

    let stopped = false;
    let inFlight = null;
    let pendingTimer = null;
    let scanInterval = null;
    let periodicInterval = null;
    let lastObservedSignature = null;
    let lastObservedValues = null;
    const localChangeTimes = new Map();
    let transportPromise = null;
    let unsubscribeAuth = null;
    let authSubscriptionAttached = false;

    function isoNow() {
      return new Date(now()).toISOString();
    }

    function rememberLocalChange(key, changedAt = isoNow()) {
      localChangeTimes.set(key, changedAt);
      const loaded = loadMetaRoot(storage);
      if (loaded.status !== 'valid') return false;
      const candidates = Object.values(loaded.root.accounts).filter(
        (account) =>
          isPlainObject(account) &&
          isPlainObject(account.keys) &&
          isPlainObject(account.keys[key])
      );
      if (candidates.length !== 1) return false;
      candidates[0].keys[key].localChangedAt = changedAt;
      const persisted = writeMetaRoot(storage, loaded.root);
      state.metaPersisted = persisted;
      return persisted;
    }

    function applyKnownLocalChangeTimes(account, keys) {
      if (!isPlainObject(account?.keys)) return false;
      let changed = false;
      for (const key of keys) {
        const changedAt = localChangeTimes.get(key);
        const entry = account.keys[key];
        if (!changedAt || !isPlainObject(entry)) continue;
        if (entry.localChangedAt === changedAt) continue;
        entry.localChangedAt = changedAt;
        changed = true;
      }
      return changed;
    }

    function persistKnownLocalChangeTimes(userId, keys) {
      if (!keys.size) return true;
      const loaded = loadMetaRoot(storage);
      if (loaded.status !== 'valid') return false;
      const account = loaded.root.accounts[userId];
      if (!applyKnownLocalChangeTimes(account, keys)) return true;
      const persisted = writeMetaRoot(storage, loaded.root);
      state.metaPersisted = persisted;
      return persisted;
    }

    function setState(next) {
      Object.assign(state, next);
    }

    function snapshotSignature(values) {
      return stableJson(
        Object.fromEntries(
          Object.keys(values).sort().map((key) => [key, values[key]])
        )
      );
    }

    function captureLocal() {
      if (!sync || typeof sync.capture !== 'function') {
        throw new Error('clair-sync-unavailable');
      }
      if (
        sync.protocol !== PERSONAL_SYNC_PROTOCOL ||
        sync.app !== LOCAL_APP_ID ||
        sync.release !== RELEASE ||
        Number(sync.dataSchema) !== DATA_SCHEMA ||
        sync.coreRevision !== CORE_REVISION
      ) {
        throw new Error('clair-sync-runtime-mismatch');
      }
      const capture = sync.capture();
      if (!capture?.ok || !sync.valid(capture.values)) {
        throw new Error('personal-data-read-failed');
      }
      return capture.values;
    }

    function persistMeta(root) {
      const persisted = writeMetaRoot(storage, root);
      state.metaPersisted = persisted;
      if (!persisted) throw new Error('sync-meta-persistence-failed');
    }

    async function createVerifiedHandoverSnapshot(localValues) {
      const snapshotApi = hostWindow.ClairV8?.snapshot;
      const verifySnapshotApi = hostWindow.ClairV8?.verifySnapshot;
      if (
        typeof snapshotApi !== 'function' ||
        typeof verifySnapshotApi !== 'function'
      ) {
        throw new Error('handover-snapshot-unavailable');
      }

      const beforeValues = { ...localValues };
      const record = await snapshotApi.call(
        hostWindow.ClairV8,
        HANDOVER_SNAPSHOT_KIND
      );
      const identityVerified = await verifySnapshotApi.call(
        hostWindow.ClairV8,
        record,
        HANDOVER_SNAPSHOT_KIND
      );
      if (
        identityVerified !== true ||
        !record ||
        record.app !== LOCAL_APP_ID ||
        record.kind !== HANDOVER_SNAPSHOT_KIND ||
        record.release !== RELEASE ||
        Number(record.dataSchema) !== DATA_SCHEMA ||
        record.coreRevision !== CORE_REVISION ||
        record.scopePath !== sync.scopePath ||
        record.scopeId !== sync.scopeId ||
        !sync.valid(record.values) ||
        snapshotSignature(record.values) !== snapshotSignature(beforeValues) ||
        typeof record.fingerprint !== 'string' ||
        !record.fingerprint
      ) {
        throw new Error('handover-snapshot-verification-failed');
      }

      return {
        values: beforeValues,
        fingerprint: record.fingerprint,
        preparedAt: isoNow()
      };
    }

    async function prepareLocalNewAccountHandover(
      localValues,
      account,
      metaRoot
    ) {
      if (account.handover?.completedAt) return null;
      const snapshot = await createVerifiedHandoverSnapshot(localValues);
      account.handover = {
        completedAt: null,
        preparedAt: snapshot.preparedAt,
        snapshotFingerprint: snapshot.fingerprint,
        mode: LOCAL_NEW_ACCOUNT
      };
      persistMeta(metaRoot);
      if (
        !writeDirectSyncMarker(storage, {
          healthy: false,
          handoverPreparedAt: account.handover.preparedAt,
          handoverSnapshotFingerprint: snapshot.fingerprint,
          bootstrapMode: LOCAL_NEW_ACCOUNT,
          scopePath: sync.scopePath,
          scopeId: sync.scopeId
        })
      ) throw new Error('direct-sync-marker-persistence-failed');
      return snapshot;
    }

    function collectPersonalRemoteRows(remoteRows) {
      if (!Array.isArray(remoteRows)) throw new Error('remote-data-list-invalid');
      const personalRows = [];
      for (const row of remoteRows) {
        if (row?.app_id !== CLOUD_APP_ID || !isPersonalKey(sync, row.data_key)) {
          continue;
        }
        personalRows.push(row);
      }
      return personalRows;
    }

    function validatePersonalRemoteRows(personalRows, userId) {
      const remoteMap = new Map();
      const target = {};
      for (const row of personalRows) {
        const key = row.data_key;
        if (row.user_id !== userId) {
          throw new Error('remote-row-scope-mismatch:' + key);
        }
        if (remoteMap.has(key)) throw new Error('duplicate-remote-key:' + key);
        if (!isReadableRemoteDataSchema(row.schema_version)) {
          throw new Error('remote-schema-mismatch:' + key);
        }
        const remoteState = liveRemoteValue(row);
        remoteMap.set(key, row);
        if (remoteState.present) target[key] = remoteState.value;
      }
      if (!sync.valid(target)) throw new Error('invalid-remote-bootstrap-target');
      return { remoteMap, target };
    }

    async function resolveTransport() {
      const gate = cloudGateReason();
      if (gate) throw new Error(gate);
      if (options.transport) return options.transport;
      if (transportPromise) return transportPromise;
      transportPromise = (async () => {
        const namespace = await loadSupabaseLibrary(hostWindow, hostDocument);
        const client = namespace.createClient(
          SUPABASE_URL,
          SUPABASE_PUBLISHABLE_KEY,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: false
            }
          }
        );
        return createSupabaseTransport(client);
      })().catch((error) => {
        transportPromise = null;
        throw error;
      });
      return transportPromise;
    }

    function ensureAuthSubscription(transport) {
      if (authSubscriptionAttached) return;
      authSubscriptionAttached = true;
      unsubscribeAuth = transport.subscribeAuth?.((signedIn) => {
        if (signedIn) scheduleSync('auth-session', 100);
        else {
          setState({
            phase: 'local-only',
            reason: 'no-session',
            authenticated: false
          });
          writeDirectSyncMarker(storage, { healthy: false });
        }
      }) || null;
    }

    function samePersonalValue(left, right, key) {
      const leftPresent = own(left, key);
      const rightPresent = own(right, key);
      return (
        leftPresent === rightPresent &&
        (!leftPresent || left[key] === right[key])
      );
    }

    function noteConcurrentChanges(baseline, current, concurrentKeys) {
      const keys = new Set([
        ...Object.keys(baseline),
        ...Object.keys(current)
      ]);
      for (const key of keys) {
        if (samePersonalValue(baseline, current, key)) continue;
        concurrentKeys.add(key);
        if (!localChangeTimes.has(key)) localChangeTimes.set(key, isoNow());
      }
    }

    function changedPersonalKeys(beforeValues, afterValues, candidates = null) {
      const keys = candidates
        ? new Set(candidates)
        : new Set([
            ...Object.keys(beforeValues),
            ...Object.keys(afterValues)
          ]);
      return [...keys]
        .filter((key) => !samePersonalValue(beforeValues, afterValues, key))
        .sort();
    }

    function journalTargetValues(beforeValues, mutationJournal) {
      const target = { ...beforeValues };
      for (const [key, entry] of mutationJournal) {
        if (!own(entry, 'afterPresent')) continue;
        if (entry.afterPresent) target[key] = entry.afterValue;
        else delete target[key];
      }
      return target;
    }

    function appliedPersonalKeys(beforeValues, targetValues, finalValues, candidates = null) {
      return changedPersonalKeys(beforeValues, targetValues, candidates)
        .filter((key) => samePersonalValue(targetValues, finalValues, key));
    }

    function rolledBackPersonalKeys(beforeValues, targetValues, finalValues, candidates = null) {
      return changedPersonalKeys(beforeValues, targetValues, candidates)
        .filter((key) => samePersonalValue(beforeValues, finalValues, key));
    }

    function notifyPersonalDataRestored(changedKeys, reason, mode) {
      if (!changedKeys.length || typeof hostWindow.dispatchEvent !== 'function') {
        return false;
      }
      const EventConstructor = hostWindow.CustomEvent;
      if (typeof EventConstructor !== 'function') return false;
      try {
        hostWindow.dispatchEvent(new EventConstructor(
          PERSONAL_DATA_RESTORED_EVENT,
          {
            detail: Object.freeze({
              changedKeys: Object.freeze([...changedKeys]),
              source: 'cloud',
              reason,
              mode
            })
          }
        ));
        return true;
      } catch (_) {
        return false;
      }
    }

    async function applyLocalState(
      localValues,
      key,
      present,
      value,
      mutationJournal,
      concurrentKeys
    ) {
      const latest = { ...captureLocal() };
      noteConcurrentChanges(localValues, latest, concurrentKeys);
      if (!samePersonalValue(localValues, latest, key)) {
        throw new Error('local-key-changed-during-sync:' + key);
      }

      const target = { ...latest };
      if (present) target[key] = value;
      else delete target[key];
      if (!sync.valid(target)) throw new Error('invalid-local-restore');
      const journalEntry = mutationJournal.get(key) || {
        beforePresent: own(latest, key),
        beforeValue: own(latest, key) ? latest[key] : null
      };
      mutationJournal.set(key, journalEntry);

      let failure = null;
      try {
        if (sync.restore(target) !== true) {
          throw new Error('local-restore-failed');
        }
        const verified = sync.capture();
        if (
          !verified?.ok ||
          !sync.valid(verified.values) ||
          snapshotSignature(verified.values) !== snapshotSignature(target)
        ) throw new Error('local-restore-verification-failed');
      } catch (error) {
        failure = error;
      }

      if (failure) {
        let compensated = false;
        try {
          compensated = sync.restore(latest) === true;
          const restored = sync.capture();
          compensated = Boolean(
            compensated &&
            restored?.ok &&
            sync.valid(restored.values) &&
            snapshotSignature(restored.values) === snapshotSignature(latest)
          );
        } catch (_) {
          compensated = false;
        }
        if (!own(journalEntry, 'afterPresent')) mutationJournal.delete(key);
        if (!compensated) {
          throw new Error(
            'local-restore-compensation-failed:' +
              String(failure?.message || failure || 'unknown')
          );
        }
        throw failure;
      }

      journalEntry.afterPresent = present;
      journalEntry.afterValue = present ? value : null;
      return target;
    }

    function rollbackLocalMutations(mutationJournal) {
      try {
        if (!mutationJournal.size) return true;
        const current = { ...captureLocal() };
        const target = { ...current };
        let changed = false;
        for (const [key, entry] of [...mutationJournal.entries()].reverse()) {
          if (!own(entry, 'afterPresent')) continue;
          const after = entry.afterPresent
            ? { [key]: entry.afterValue }
            : {};
          if (!samePersonalValue(target, after, key)) continue;
          if (entry.beforePresent) target[key] = entry.beforeValue;
          else delete target[key];
          changed = true;
        }
        if (!changed) return true;
        if (!sync.valid(target) || sync.restore(target) !== true) return false;
        const verified = sync.capture();
        return Boolean(
          verified?.ok &&
          sync.valid(verified.values) &&
          snapshotSignature(verified.values) === snapshotSignature(target)
        );
      } catch (_) {
        return false;
      }
    }

    function notePostFailureConcurrentChanges(
      baseline,
      current,
      mutationJournal,
      concurrentKeys
    ) {
      const keys = new Set([
        ...Object.keys(baseline),
        ...Object.keys(current),
        ...mutationJournal.keys()
      ]);
      for (const key of keys) {
        const entry = mutationJournal.get(key);
        if (entry && own(entry, 'afterPresent')) {
          const expectedAfter = entry.afterPresent
            ? { [key]: entry.afterValue }
            : {};
          if (samePersonalValue(current, expectedAfter, key)) continue;
        }
        if (!samePersonalValue(baseline, current, key)) {
          concurrentKeys.add(key);
          if (!localChangeTimes.has(key)) localChangeTimes.set(key, isoNow());
        }
      }
    }

    function restoreHandoverSnapshot(snapshot, concurrentKeys) {
      if (!snapshot) return true;
      let current;
      try {
        current = { ...captureLocal() };
      } catch (_) {
        return false;
      }
      const target = { ...snapshot.values };
      for (const key of concurrentKeys) {
        if (own(current, key)) target[key] = current[key];
        else delete target[key];
      }
      if (!sync.valid(target)) return false;
      if (snapshotSignature(current) === snapshotSignature(target)) return true;
      try {
        if (sync.restore(target) !== true) return false;
        const verified = sync.capture();
        return Boolean(
          verified?.ok &&
          sync.valid(verified.values) &&
          snapshotSignature(verified.values) === snapshotSignature(target)
        );
      } catch (_) {
        return false;
      }
    }

    async function finalEntry(localValues, key, row, syncedAt) {
      const present = own(localValues, key);
      return {
        basePresent: present,
        baseValue: present ? localValues[key] : null,
        localFingerprint: present
          ? await fingerprint(localValues[key], cryptoApi)
          : null,
        remoteRevision: row ? normalizeRevision(row.revision) : null,
        remoteUpdatedAt: row?.updated_at || row?.deleted_at || null,
        lastSyncedAt: syncedAt,
        localChangedAt: null
      };
    }

    function rememberJsonConflict(
      account,
      key,
      merged,
      localValue,
      remoteValue,
      resolvedValue,
      syncedAt
    ) {
      if (!merged.mergeable || !merged.conflicts?.length) return;
      const history = Array.isArray(account.conflicts[key])
        ? account.conflicts[key]
        : [];
      history.push({
        at: syncedAt,
        kind: 'json-three-way',
        localValue,
        remoteValue,
        resolvedValue,
        details: merged.conflicts
      });
      account.conflicts[key] = history.slice(-3);
    }

    function rememberAtomicConflict(
      account,
      key,
      localValue,
      remoteValue,
      resolvedValue,
      resolved,
      syncedAt
    ) {
      const history = Array.isArray(account.conflicts[key])
        ? account.conflicts[key]
        : [];
      history.push({
        at: syncedAt,
        kind: 'atomic-newest-wins',
        localValue,
        remoteValue,
        resolvedValue,
        resolved
      });
      account.conflicts[key] = history.slice(-3);
    }

    async function uploadState(
      transport,
      user,
      device,
      key,
      present,
      value,
      expectedRow
    ) {
      const syncedAt = isoNow();
      return transport.writeData(
        {
          user_id: user.id,
          app_id: CLOUD_APP_ID,
          data_key: key,
          payload: {
            value: present ? value : null,
            source_device: device.label,
            synced_at: syncedAt,
            integration: INTEGRATION
          },
          schema_version: DATA_SCHEMA,
          last_device_id: device.id,
          updated_at: syncedAt,
          deleted_at: present ? null : syncedAt
        },
        expectedRow
      );
    }

    async function reconcileOnce(context) {
      let {
        key,
        row,
        localValues,
        account,
        metaRoot,
        transport,
        user,
        device,
        mutationJournal,
        concurrentKeys
      } = context;
      if (row && !isReadableRemoteDataSchema(row.schema_version)) {
        throw new Error('remote-schema-mismatch:' + key);
      }
      const handoverPending = !account.handover?.completedAt;
      const entry = !handoverPending && isPlainObject(account.keys[key])
        ? account.keys[key]
        : null;
      let localPresent = own(localValues, key);
      let localValue = localPresent ? localValues[key] : null;
      const remoteState = liveRemoteValue(row);
      const remotePresent = remoteState.present;
      const remoteValue = remoteState.value;
      const currentFingerprint = localPresent
        ? await fingerprint(localValue, cryptoApi)
        : null;
      const syncedAt = isoNow();

      if (!entry) {
        if (localPresent) {
          // Premier handover : la représentation locale est la référence,
          // y compris pour le JSON et face à un ancien tombstone distant.
          const remoteCompatible = remotePresent && (
            remoteValue === localValue ||
            (
              remoteState.legacyJsonContainer &&
              sameJsonContainerStrings(localValue, remoteValue)
            )
          );
          if (!remoteCompatible) {
            row = await uploadState(
              transport,
              user,
              device,
              key,
              true,
              localValue,
              row
            );
          }
        } else if (remotePresent) {
          localValues = await applyLocalState(
            localValues,
            key,
            true,
            remoteValue,
            mutationJournal,
            concurrentKeys
          );
          localPresent = true;
          localValue = remoteValue;
        }

        account.keys[key] = await finalEntry(
          localValues,
          key,
          row,
          syncedAt
        );
        return { localValues, row };
      }

      const localChanged =
        localPresent !== Boolean(entry.basePresent) ||
        (localPresent && currentFingerprint !== entry.localFingerprint);
      const remoteChanged =
        normalizeRevision(row?.revision) !==
        normalizeRevision(entry.remoteRevision);

      if (
        localChanged &&
        !entry.localChangedAt &&
        (
          localChangeTimes.has(key) ||
          !ATOMIC_NEWEST_WINS_KEYS.has(key)
        )
      ) {
        // Une divergence de planning découverte au redémarrage n'est pas une
        // édition « maintenant ». Sans horodatage réel, le distant révisé gagne.
        entry.localChangedAt = localChangeTimes.get(key) || syncedAt;
        account.keys[key] = entry;
        persistMeta(metaRoot);
      }

      if (!localChanged && !remoteChanged) {
        account.keys[key] = await finalEntry(
          localValues,
          key,
          row,
          syncedAt
        );
        return { localValues, row };
      }

      if (localChanged && !remoteChanged) {
        row = await uploadState(
          transport,
          user,
          device,
          key,
          localPresent,
          localValue,
          row
        );
        account.keys[key] = await finalEntry(
          localValues,
          key,
          row,
          syncedAt
        );
        return { localValues, row };
      }

      if (!localChanged && remoteChanged) {
        if (!row) {
          if (localPresent) {
            row = await uploadState(
              transport,
              user,
              device,
              key,
              true,
              localValue,
              null
            );
          }
        } else {
          localValues = await applyLocalState(
            localValues,
            key,
            remotePresent,
            remoteValue,
            mutationJournal,
            concurrentKeys
          );
        }
        account.keys[key] = await finalEntry(
          localValues,
          key,
          row,
          syncedAt
        );
        return { localValues, row };
      }

      if (!row) {
        if (localPresent) {
          row = await uploadState(
            transport,
            user,
            device,
            key,
            true,
            localValue,
            null
          );
        }
        account.keys[key] = await finalEntry(
          localValues,
          key,
          row,
          syncedAt
        );
        return { localValues, row };
      }

      const localChangedAt = localTime(entry);
      const remoteChangedAt = rowTime(row);
      const atomic = ATOMIC_NEWEST_WINS_KEYS.has(key);
      const preferLocal =
        localChangedAt > 0
          ? localChangedAt >= remoteChangedAt
          : !atomic;

      if (localPresent && remotePresent) {
        if (localValue !== remoteValue) {
          const merged = atomic
            ? {
                mergeable: false,
                value: preferLocal ? localValue : remoteValue,
                conflicts: []
              }
            : mergePersonalStrings(
                entry.basePresent ? entry.baseValue : null,
                localValue,
                remoteValue,
                preferLocal
              );
          const resolvedValue = merged.value;
          if (atomic) {
            rememberAtomicConflict(
              account,
              key,
              localValue,
              remoteValue,
              resolvedValue,
              preferLocal ? 'local' : 'remote',
              syncedAt
            );
          } else {
            rememberJsonConflict(
              account,
              key,
              merged,
              localValue,
              remoteValue,
              resolvedValue,
              syncedAt
            );
          }
          if (resolvedValue !== localValue) {
            localValues = await applyLocalState(
              localValues,
              key,
              true,
              resolvedValue,
              mutationJournal,
              concurrentKeys
            );
          }
          if (resolvedValue !== remoteValue) {
            row = await uploadState(
              transport,
              user,
              device,
              key,
              true,
              resolvedValue,
              row
            );
          }
        }
      } else if (!localPresent && remotePresent) {
        const localDeletionWins =
          localChangedAt > 0 && localChangedAt >= remoteChangedAt;
        if (localDeletionWins) {
          row = await uploadState(
            transport,
            user,
            device,
            key,
            false,
            null,
            row
          );
        } else {
          localValues = await applyLocalState(
            localValues,
            key,
            true,
            remoteValue,
            mutationJournal,
            concurrentKeys
          );
        }
      } else if (localPresent && !remotePresent) {
        const localModificationWins =
          localChangedAt > 0
            ? localChangedAt >= remoteChangedAt
            : !atomic;
        if (localModificationWins) {
          row = await uploadState(
            transport,
            user,
            device,
            key,
            true,
            localValue,
            row
          );
        } else {
          localValues = await applyLocalState(
            localValues,
            key,
            false,
            null,
            mutationJournal,
            concurrentKeys
          );
        }
      }

      account.keys[key] = await finalEntry(
        localValues,
        key,
        row,
        syncedAt
      );
      return { localValues, row };
    }

    async function reconcileKey(context) {
      let row = context.row;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          return await reconcileOnce({ ...context, row });
        } catch (error) {
          if (!(error instanceof SyncConflictError)) throw error;
          row = await context.transport.getData({
            user_id: context.user.id,
            app_id: CLOUD_APP_ID,
            data_key: context.key
          });
        }
      }
      throw new Error('remote-conflict-retry-exhausted');
    }

    async function performSync(reason) {
      state.lastAttemptAt = isoNow();
      const gate = cloudGateReason();
      if (gate) {
        setState({
          phase: 'local-only',
          reason: gate,
          authenticated: false,
          lastError: null
        });
        writeDirectSyncMarker(storage, { healthy: false });
        return { synced: false, reason: gate };
      }
      if (stopped || !healthy()) {
        setState({ phase: 'waiting-for-foundation', reason });
        return { synced: false, reason: 'foundation-not-healthy' };
      }
      if (navigatorApi?.onLine === false) {
        setState({ phase: 'local-only', reason: 'offline', lastError: null });
        return { synced: false, reason: 'offline' };
      }

      const localCapture = captureLocal();
      let localValues = { ...localCapture };
      const syncBeforeValues = { ...localValues };
      const mutationJournal = new Map();
      const concurrentKeys = new Set();
      const processedKeys = new Set();
      let handoverSnapshot = null;
      let remoteBootstrap = false;
      let remoteBootstrapMutationAttempted = false;
      let remoteBootstrapApplied = false;
      let remoteBootstrapTarget = null;
      let syncCommitted = false;
      let metaBefore = null;
      let metaExistedBefore = false;
      let metaBeforeKnown = false;
      let markerBefore = null;
      let markerExistedBefore = false;
      let markerBeforeKnown = false;
      let authenticatedUserId = null;

      try {
        const transport = await resolveTransport();
        ensureAuthSubscription(transport);
        const user = await transport.getAuthenticatedUser();
        if (!user?.id) {
          setState({
            phase: 'local-only',
            reason: 'no-session',
            authenticated: false,
            lastError: null
          });
          writeDirectSyncMarker(storage, { healthy: false });
          return { synced: false, reason: 'no-session' };
        }
        authenticatedUserId = user.id;

        setState({
          phase: 'syncing',
          reason,
          authenticated: true,
          lastError: null
        });

        const loadedMeta = loadMetaRoot(storage);
        const loadedMarker = readDirectSyncMarker(storage);
        if (
          loadedMeta.status === 'unreadable' ||
          loadedMeta.status === 'invalid' ||
          (loadedMeta.status === 'missing' &&
            (loadedMarker.status === 'unreadable' ||
              loadedMarker.status === 'invalid' ||
              Boolean(
                loadedMarker.marker?.lastSuccessfulSync ||
                loadedMarker.marker?.handoverSnapshotFingerprint
              )))
        ) {
          throw new Error('sync-meta-recovery-required');
        }
        metaBefore = loadedMeta.raw;
        metaExistedBefore = loadedMeta.status === 'valid';
        metaBeforeKnown = true;
        markerBefore = storage.getItem(DIRECT_SYNC_MARKER_KEY);
        markerExistedBefore = markerBefore !== null;
        markerBeforeKnown = true;
        const metaRoot = loadedMeta.root;
        const account = accountMeta(metaRoot, user.id);

        const remoteRows = await transport.listData({
          user_id: user.id,
          app_id: CLOUD_APP_ID
        });
        const personalRemoteRows = collectPersonalRemoteRows(remoteRows);
        const bootstrapPending = !account.handover?.completedAt;
        const resumingLocalNewAccount = Boolean(
          bootstrapPending &&
          account.handover?.mode === LOCAL_NEW_ACCOUNT &&
          account.handover?.preparedAt
        );

        if (
          bootstrapPending &&
          !resumingLocalNewAccount &&
          personalRemoteRows.length > 0
        ) {
          remoteBootstrap = true;
          handoverSnapshot = await createVerifiedHandoverSnapshot(localValues);

          // La présence d'une seule ligne personnelle (active ou tombstone)
          // fait du compte distant la référence. Toute la collection est
          // validée et normalisée avant la première mutation locale.
          const validated = validatePersonalRemoteRows(
            personalRemoteRows,
            user.id
          );
          const remoteMap = validated.remoteMap;
          const target = validated.target;
          remoteBootstrapTarget = target;

          const latestBeforeRestore = { ...captureLocal() };
          if (
            snapshotSignature(latestBeforeRestore) !==
            snapshotSignature(handoverSnapshot.values)
          ) {
            noteConcurrentChanges(
              handoverSnapshot.values,
              latestBeforeRestore,
              concurrentKeys
            );
            throw new Error('local-data-changed-during-bootstrap');
          }

          remoteBootstrapMutationAttempted = true;
          if (sync.restore(target) !== true) {
            throw new Error('remote-bootstrap-restore-failed');
          }
          const verified = sync.capture();
          if (
            !verified?.ok ||
            !sync.valid(verified.values) ||
            snapshotSignature(verified.values) !== snapshotSignature(target)
          ) throw new Error('remote-bootstrap-verification-failed');
          remoteBootstrapApplied = true;

          const completedAt = isoNow();
          account.keys = {};
          account.conflicts = {};
          for (const [key, row] of [...remoteMap.entries()].sort(
            ([left], [right]) => left.localeCompare(right)
          )) {
            account.keys[key] = await finalEntry(
              target,
              key,
              row,
              completedAt
            );
          }
          account.lastSyncAt = completedAt;
          account.handover = {
            completedAt,
            preparedAt: handoverSnapshot.preparedAt,
            snapshotFingerprint: handoverSnapshot.fingerprint,
            mode: REMOTE_EXISTING_ACCOUNT
          };

          const finalLocalValues = { ...captureLocal() };
          noteConcurrentChanges(target, finalLocalValues, concurrentKeys);
          applyKnownLocalChangeTimes(account, concurrentKeys);
          persistMeta(metaRoot);
          if (
            !writeDirectSyncMarker(storage, {
              healthy: true,
              lastSuccessfulSync: completedAt,
              handoverPreparedAt: handoverSnapshot.preparedAt,
              handoverSnapshotFingerprint: handoverSnapshot.fingerprint,
              bootstrapMode: REMOTE_EXISTING_ACCOUNT,
              scopePath: sync.scopePath,
              scopeId: sync.scopeId
            })
          ) throw new Error('direct-sync-marker-persistence-failed-after-bootstrap');

          syncCommitted = true;
          lastObservedSignature = snapshotSignature(finalLocalValues);
          lastObservedValues = { ...finalLocalValues };
          setState({
            phase: 'synced',
            reason,
            authenticated: true,
            lastSuccessAt: completedAt,
            lastError: null,
            bootstrapMode: REMOTE_EXISTING_ACCOUNT
          });
          notifyPersonalDataRestored(
            appliedPersonalKeys(
              syncBeforeValues,
              remoteBootstrapTarget,
              finalLocalValues
            ),
            reason,
            'bootstrap'
          );
          if (concurrentKeys.size) {
            scheduleSync('concurrent-local-change', 250);
          }
          return {
            synced: true,
            reason,
            keyCount: remoteMap.size,
            bootstrapMode: REMOTE_EXISTING_ACCOUNT
          };
        }

        const validated = validatePersonalRemoteRows(
          personalRemoteRows,
          user.id
        );
        const remoteMap = validated.remoteMap;
        if (bootstrapPending) {
          handoverSnapshot = await prepareLocalNewAccountHandover(
            localValues,
            account,
            metaRoot
          );
        }

        const keyValue = deviceKey(storage, cryptoApi);
        const label = deviceLabel(navigatorApi);
        const device = await transport.registerDevice({
          user_id: user.id,
          device_key: keyValue,
          label,
          platform: platformLabel(navigatorApi),
          app_version: RELEASE,
          last_seen_at: isoNow(),
          updated_at: isoNow()
        });
        if (!device?.id) throw new Error('device-registration-failed');
        device.label = device.label || label;

        const keys = new Set([
          ...Object.keys(localValues),
          ...remoteMap.keys(),
          ...Object.keys(account.keys)
        ]);

        for (const key of [...keys].sort()) {
          if (!isPersonalKey(sync, key)) continue;
          const result = await reconcileKey({
            key,
            row: remoteMap.get(key) || null,
            localValues,
            account,
            metaRoot,
            transport,
            user,
            device,
            mutationJournal,
            concurrentKeys
          });
          localValues = result.localValues;
          if (result.row) remoteMap.set(key, result.row);
          else remoteMap.delete(key);
          processedKeys.add(key);
          persistMeta(metaRoot);
        }

        const finalLocalValues = { ...captureLocal() };
        noteConcurrentChanges(localValues, finalLocalValues, concurrentKeys);
        localValues = finalLocalValues;
        applyKnownLocalChangeTimes(account, concurrentKeys);
        account.lastSyncAt = isoNow();
        if (!account.handover.completedAt) {
          account.handover.completedAt = account.lastSyncAt;
          account.handover.mode = LOCAL_NEW_ACCOUNT;
        }
        persistMeta(metaRoot);
        syncCommitted = true;
        for (const key of processedKeys) {
          if (!concurrentKeys.has(key)) localChangeTimes.delete(key);
        }
        lastObservedSignature = snapshotSignature(localValues);
        lastObservedValues = { ...localValues };
        const journalTarget = journalTargetValues(
          syncBeforeValues,
          mutationJournal
        );
        notifyPersonalDataRestored(
          appliedPersonalKeys(
            syncBeforeValues,
            journalTarget,
            localValues,
            mutationJournal.keys()
          ),
          reason,
          'reconciliation'
        );
        if (
          !writeDirectSyncMarker(storage, {
            healthy: true,
            lastSuccessfulSync: account.lastSyncAt,
            handoverPreparedAt: account.handover.preparedAt,
            handoverSnapshotFingerprint:
              account.handover.snapshotFingerprint || null,
            bootstrapMode: account.handover.mode || null,
            scopePath: sync.scopePath,
            scopeId: sync.scopeId
          })
        ) throw new Error('direct-sync-marker-persistence-failed-after-commit');
        setState({
          phase: 'synced',
          reason,
          authenticated: true,
          lastSuccessAt: account.lastSyncAt,
          lastError: null,
          bootstrapMode: account.handover.mode || null
        });
        if (concurrentKeys.size) {
          scheduleSync('concurrent-local-change', 250);
        }
        return {
          synced: true,
          reason,
          keyCount: keys.size,
          bootstrapMode: account.handover.mode || null
        };
      } catch (error) {
        if (syncCommitted) {
          writeDirectSyncMarker(storage, { healthy: false });
          throw error;
        }
        if (remoteBootstrap) {
          if (remoteBootstrapApplied && remoteBootstrapTarget) {
            try {
              noteConcurrentChanges(
                remoteBootstrapTarget,
                { ...captureLocal() },
                concurrentKeys
              );
            } catch (_) {}
          }
          const beforeImageRollbackSucceeded =
            !remoteBootstrapMutationAttempted ||
            restoreHandoverSnapshot(handoverSnapshot, concurrentKeys);
          try {
            if (metaBeforeKnown) {
              if (metaExistedBefore) storage.setItem(META_STORAGE_KEY, metaBefore);
              else storage.removeItem(META_STORAGE_KEY);
            }
            if (markerBeforeKnown) {
              if (markerExistedBefore) {
                storage.setItem(DIRECT_SYNC_MARKER_KEY, markerBefore);
              } else {
                storage.removeItem(DIRECT_SYNC_MARKER_KEY);
              }
            }
          } catch (_) {}
          persistKnownLocalChangeTimes(authenticatedUserId, concurrentKeys);
          if (concurrentKeys.size) {
            scheduleSync('concurrent-local-change', 250);
          }
          if (
            remoteBootstrapApplied &&
            beforeImageRollbackSucceeded &&
            handoverSnapshot &&
            remoteBootstrapTarget
          ) {
            let finalAfterRollback = null;
            try { finalAfterRollback = { ...captureLocal() }; } catch (_) {}
            if (finalAfterRollback) {
              notifyPersonalDataRestored(
                rolledBackPersonalKeys(
                  handoverSnapshot.values,
                  remoteBootstrapTarget,
                  finalAfterRollback
                ),
                reason,
                'rollback'
              );
            }
          }
          if (!beforeImageRollbackSucceeded) {
            throw new Error(
              'local-rollback-failed-after-bootstrap-error:' +
                String(error?.message || error || 'unknown')
            );
          }
          throw error;
        }
        const journalRollbackSucceeded = rollbackLocalMutations(mutationJournal);
        let currentAfterJournal = null;
        try {
          currentAfterJournal = { ...captureLocal() };
        } catch (_) {}
        if (currentAfterJournal) {
          if (journalRollbackSucceeded) {
            noteConcurrentChanges(
              syncBeforeValues,
              currentAfterJournal,
              concurrentKeys
            );
          } else {
            notePostFailureConcurrentChanges(
              syncBeforeValues,
              currentAfterJournal,
              mutationJournal,
              concurrentKeys
            );
          }
        }
        if (handoverSnapshot && journalRollbackSucceeded) {
          try {
            noteConcurrentChanges(
              handoverSnapshot.values,
              { ...captureLocal() },
              concurrentKeys
            );
          } catch (_) {}
        }
        const needsBeforeImageRestore =
          Boolean(handoverSnapshot) || !journalRollbackSucceeded;
        const beforeImageRollbackSucceeded = needsBeforeImageRestore
          ? restoreHandoverSnapshot(
              handoverSnapshot || { values: syncBeforeValues },
              concurrentKeys
            )
          : true;
        if (!handoverSnapshot && metaBeforeKnown) {
          try {
            if (metaExistedBefore) storage.setItem(META_STORAGE_KEY, metaBefore);
            else storage.removeItem(META_STORAGE_KEY);
          } catch (_) {}
        }
        persistKnownLocalChangeTimes(authenticatedUserId, concurrentKeys);
        writeDirectSyncMarker(storage, {
          healthy: false,
          handoverSnapshotFingerprint:
            handoverSnapshot?.fingerprint || null
        });
        if (concurrentKeys.size) {
          scheduleSync('concurrent-local-change', 250);
        }
        if (beforeImageRollbackSucceeded) {
          let finalAfterRollback = null;
          try { finalAfterRollback = { ...captureLocal() }; } catch (_) {}
          if (finalAfterRollback) {
            const journalTarget = journalTargetValues(
              syncBeforeValues,
              mutationJournal
            );
            notifyPersonalDataRestored(
              rolledBackPersonalKeys(
                syncBeforeValues,
                journalTarget,
                finalAfterRollback,
                mutationJournal.keys()
              ),
              reason,
              'rollback'
            );
          }
        }
        if (!beforeImageRollbackSucceeded) {
          throw new Error(
            'local-rollback-failed-after-sync-error:' +
              String(error?.message || error || 'unknown')
          );
        }
        throw error;
      }
    }

    function syncNow(reason = 'manual') {
      if (inFlight) return inFlight;
      inFlight = performSync(reason)
        .catch((error) => {
          setState({
            phase: 'local-only',
            reason,
            lastError: String(error?.message || error || 'sync-failed')
          });
          return { synced: false, reason: 'error', error: state.lastError };
        })
        .finally(() => {
          inFlight = null;
        });
      return inFlight;
    }

    function scheduleSync(reason, delay = 250) {
      if (stopped) return;
      if (pendingTimer !== null) cancelTimeout(pendingTimer);
      pendingTimer = scheduleTimeout(() => {
        pendingTimer = null;
        void syncNow(reason);
      }, Math.max(0, delay));
    }

    function markDirty(key, reason = 'local-change', delay = 500) {
      if (cloudGateReason()) return false;
      if (!isPersonalKey(sync, key)) return false;
      rememberLocalChange(key);
      scheduleSync(reason, delay);
      return true;
    }

    function scanLocal(initial = false) {
      try {
        const values = captureLocal();
        const signature = snapshotSignature(values);
        if (!initial && lastObservedValues !== null) {
          const keys = new Set([
            ...Object.keys(lastObservedValues),
            ...Object.keys(values)
          ]);
          for (const key of keys) {
            if (lastObservedValues[key] !== values[key]) {
              rememberLocalChange(key);
            }
          }
          if (signature !== lastObservedSignature) {
            scheduleSync('local-change', 500);
          }
        }
        lastObservedSignature = signature;
        lastObservedValues = { ...values };
      } catch (_) {}
    }

    function attachTriggers() {
      const onOnline = () => {
        scanLocal(false);
        scheduleSync('online', 150);
      };
      const onStorage = (event) => {
        if (!event?.key || isPersonalKey(sync, event.key)) {
          if (event?.key) markDirty(event.key, 'storage', 300);
          else scheduleSync('storage', 300);
        }
      };
      const onVisibility = () => {
        if (!hostDocument.hidden) {
          scanLocal(false);
          scheduleSync('foreground', 150);
        }
      };
      const onResume = () => {
        scanLocal(false);
        scheduleSync('resume', 150);
      };

      hostWindow.addEventListener?.('online', onOnline);
      hostWindow.addEventListener?.('storage', onStorage);
      hostWindow.addEventListener?.('pageshow', onResume);
      hostWindow.addEventListener?.('focus', onResume);
      hostDocument.addEventListener?.('visibilitychange', onVisibility);
      scanInterval = scheduleInterval(() => scanLocal(false), LOCAL_SCAN_MS);
      periodicInterval = scheduleInterval(() => {
        if (!hostDocument.hidden) {
          scanLocal(false);
          scheduleSync('periodic', 0);
        }
      }, PERIODIC_SYNC_MS);

      return () => {
        hostWindow.removeEventListener?.('online', onOnline);
        hostWindow.removeEventListener?.('storage', onStorage);
        hostWindow.removeEventListener?.('pageshow', onResume);
        hostWindow.removeEventListener?.('focus', onResume);
        hostDocument.removeEventListener?.('visibilitychange', onVisibility);
      };
    }

    let detachTriggers = null;

    async function waitForHealthyFoundation() {
      const startedAt = now();
      while (!stopped && now() - startedAt < BOOT_WAIT_MS) {
        if (healthy()) return true;
        try {
          const status = hostWindow.ClairV8?.getStatus?.();
          if (status?.fatalError) return false;
        } catch (_) {}
        await new Promise((resolve) => scheduleTimeout(resolve, 180));
      }
      return false;
    }

    async function start() {
      if (state.started) return;
      state.started = true;
      const gate = cloudGateReason();
      if (gate) {
        setState({
          phase: 'local-only',
          reason: gate,
          authenticated: false,
          lastError: null
        });
        writeDirectSyncMarker(storage, { healthy: false });
        return;
      }
      writeDirectSyncMarker(storage, { healthy: false });
      const ready = await waitForHealthyFoundation();
      if (!ready || stopped) {
        setState({ phase: 'local-only', reason: 'foundation-unavailable' });
        return;
      }
      scanLocal(true);
      detachTriggers = attachTriggers();
      void resolveTransport()
        .then(ensureAuthSubscription)
        .catch(() => {
          // Les déclencheurs restent actifs et retenteront sans bloquer l'app.
        });
      scheduleSync('startup', 0);
    }

    function stop() {
      stopped = true;
      if (pendingTimer !== null) cancelTimeout(pendingTimer);
      if (scanInterval !== null) cancelInterval(scanInterval);
      if (periodicInterval !== null) cancelInterval(periodicInterval);
      detachTriggers?.();
      unsubscribeAuth?.();
      setState({ phase: 'stopped', reason: 'stopped' });
    }

    return Object.freeze({
      protocol: CLOUD_PROTOCOL,
      appId: CLOUD_APP_ID,
      enabled: CLOUD_ENABLED,
      supabaseVersion: '2.111.0',
      syncNow,
      markDirty,
      start,
      stop,
      getStatus() {
        return { ...state };
      }
    });
  }

  const testMode = script?.dataset?.clairCloudTest === 'true';
  if (testMode) {
    window.ClairCloudSyncTest = Object.freeze({
      createRuntime,
      createSupabaseTransport,
      loadSupabaseLibrary,
      mergePersonalStrings,
      normalizeRemoteLocalStorageValue,
      fingerprint,
      constants: Object.freeze({
        CLOUD_APP_ID,
        CLOUD_ENABLED,
        CLOUD_CONFIGURED,
        BOOTSTRAP_GENERATION,
        META_STORAGE_KEY,
        DIRECT_SYNC_MARKER_KEY,
        DEVICE_KEY_STORAGE,
        PERSONAL_SYNC_PROTOCOL,
        INTEGRATION,
        SUPABASE_JS_PATH,
        DATA_SCHEMA,
        LEGACY_DATA_SCHEMA,
        REMOTE_EXISTING_ACCOUNT,
        LOCAL_NEW_ACCOUNT,
        PERSONAL_DATA_RESTORED_EVENT
      })
    });
    return;
  }

  const runtime = createRuntime();
  window.ClairCloudSync = runtime;
  void runtime.start();
})();
