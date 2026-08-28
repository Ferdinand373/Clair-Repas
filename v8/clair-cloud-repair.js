(() => {
  'use strict';

  const host = typeof window !== 'undefined' ? window : globalThis;
  const APP_ID = 'clair-repas';
  const RELEASE = '8.0.0-foundation.15';
  const PRODUCT_VERSION = '7.5';
  const BOOTSTRAP_GENERATION = 'bootstrap-v2';
  const DATA_SCHEMA = 2;
  const LEGACY_DATA_SCHEMA = 1;
  const EXPECTED_LOCAL_FAVORITES = 3;
  const INTEGRATION = 'clair-foundation15-cloud-repair';
  const REMOTE_TABLE = 'clair_data';
  const REMOTE_COLUMNS =
    'id,user_id,app_id,data_key,payload,schema_version,revision,' +
    'deleted_at,updated_at,last_device_id';
  const VERSION_PATH = './v8/version.json';
  const SUPABASE_URL = 'https://ryyewskgfgysfubesdsj.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_T9Dmg9VKTdMFdCuLVxD54w_7GeH3Q6S';
  const BACKUP_PREFIX = 'clair.repair.cloud.before.';
  const BACKUP_FORMAT = 'clair-repas-cloud-backup/v1';
  const FIRST_CONFIRMATION =
    'Le cloud actuel va être remplacé par les données personnelles présentes sur cet ordinateur.';
  const SECOND_CONFIRMATION =
    'Seconde confirmation : réparer maintenant le cloud Clair Repas depuis cet ordinateur ?';

  const ALLOWED_KEYS = Object.freeze([
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
  const ALLOWED_KEY_SET = new Set(ALLOWED_KEYS);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

  class RepairError extends Error {
    constructor(code, message, details = null) {
      super(message);
      this.name = 'RepairError';
      this.code = code;
      this.details = details;
    }
  }

  class CasConflictError extends RepairError {
    constructor(message = 'La révision distante attendue a changé.') {
      super('cas-conflict', message);
      this.name = 'CasConflictError';
    }
  }

  function isPlainObject(value) {
    if (Object.prototype.toString.call(value) !== '[object Object]') return false;
    const prototype = Object.getPrototypeOf(value);
    if (prototype === null) return true;
    return (
      Object.getPrototypeOf(prototype) === null &&
      typeof prototype.constructor === 'function' &&
      prototype.constructor.name === 'Object'
    );
  }

  function isStandardArray(value) {
    if (!Array.isArray(value)) return false;
    return Array.isArray(Object.getPrototypeOf(value));
  }

  function copyJson(value, seen = new Set()) {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    ) return value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new RepairError('invalid-json', 'Nombre JSON non fini.');
      }
      return value;
    }
    if (typeof value !== 'object' || seen.has(value)) {
      throw new RepairError('invalid-json', 'Valeur JSON distante invalide.');
    }
    seen.add(value);
    try {
      if (Array.isArray(value)) {
        if (!isStandardArray(value)) {
          throw new RepairError('invalid-json', 'Prototype de tableau distant invalide.');
        }
        return value.map((entry) => copyJson(entry, seen));
      }
      if (!isPlainObject(value)) {
        throw new RepairError('invalid-json', 'Objet JSON distant non standard.');
      }
      const result = {};
      for (const [key, entry] of Object.entries(value)) {
        Object.defineProperty(result, key, {
          value: copyJson(entry, seen),
          enumerable: true,
          configurable: true,
          writable: true
        });
      }
      return result;
    } finally {
      seen.delete(value);
    }
  }

  function cloneValue(value) {
    if (value === undefined) return undefined;
    return copyJson(value);
  }

  function stableJson(value) {
    if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
    if (isPlainObject(value)) {
      return (
        '{' +
        Object.keys(value)
          .sort()
          .map((key) => JSON.stringify(key) + ':' + stableJson(value[key]))
          .join(',') +
        '}'
      );
    }
    return JSON.stringify(value);
  }

  function normalizeRevision(value, key = 'inconnue') {
    const revision = Number(value);
    if (!Number.isSafeInteger(revision) || revision < 1) {
      throw new RepairError(
        'invalid-revision',
        'Révision distante invalide pour ' + key + '.'
      );
    }
    return revision;
  }

  function normalizeRemoteLocalStorageValue(value, key) {
    if (typeof value === 'string') return value;
    const supported =
      Array.isArray(value) ||
      isPlainObject(value) ||
      (typeof value === 'number' && Number.isFinite(value)) ||
      typeof value === 'boolean';
    if (!supported) {
      throw new RepairError(
        'invalid-remote-payload',
        'payload.value distant invalide pour ' + key + '.'
      );
    }
    try {
      const serialized = JSON.stringify(copyJson(value));
      if (typeof serialized !== 'string') throw new Error('not-a-string');
      return serialized;
    } catch (error) {
      if (error instanceof RepairError) throw error;
      throw new RepairError(
        'invalid-remote-payload',
        'payload.value distant invalide pour ' + key + '.'
      );
    }
  }

  function normalizeRemoteRow(raw, userId) {
    if (!isPlainObject(raw)) {
      throw new RepairError('invalid-remote-row', 'Ligne cloud invalide.');
    }
    if (raw.user_id !== userId || raw.app_id !== APP_ID) {
      throw new RepairError(
        'remote-scope-violation',
        "Une ligne d'un autre utilisateur ou d'une autre application a été renvoyée."
      );
    }
    if (!ALLOWED_KEY_SET.has(raw.data_key)) {
      throw new RepairError(
        'forbidden-remote-key',
        'Clé cloud hors frontière personnelle : ' + String(raw.data_key) + '.'
      );
    }
    const schemaVersion = Number(raw.schema_version);
    if (schemaVersion !== LEGACY_DATA_SCHEMA && schemaVersion !== DATA_SCHEMA) {
      throw new RepairError(
        'invalid-schema-version',
        'schema_version distant non pris en charge pour ' + raw.data_key + '.'
      );
    }
    const payload = cloneValue(raw.payload);
    if (!isPlainObject(payload)) {
      throw new RepairError(
        'invalid-remote-payload',
        'Payload distant invalide pour ' + raw.data_key + '.'
      );
    }
    if (!raw.deleted_at && !own(payload, 'value')) {
      throw new RepairError(
        'invalid-remote-payload',
        'payload.value distant absent pour ' + raw.data_key + '.'
      );
    }
    return {
      id: raw.id ?? null,
      user_id: raw.user_id,
      app_id: raw.app_id,
      data_key: raw.data_key,
      payload,
      schema_version: schemaVersion,
      revision: normalizeRevision(raw.revision, raw.data_key),
      deleted_at: raw.deleted_at ?? null,
      updated_at: raw.updated_at ?? null,
      last_device_id: raw.last_device_id ?? null
    };
  }

  function normalizeRemoteRows(rawRows, userId) {
    if (!Array.isArray(rawRows)) {
      throw new RepairError('invalid-remote-list', 'La liste cloud est invalide.');
    }
    const rows = [];
    const keys = new Set();
    for (const raw of rawRows) {
      // Vérifier la frontière avant de copier le payload : une clé technique
      // inconnue n'est jamais capturée comme donnée personnelle par l'outil.
      if (!isPlainObject(raw)) {
        throw new RepairError('invalid-remote-row', 'Ligne cloud invalide.');
      }
      if (raw.user_id !== userId || raw.app_id !== APP_ID) {
        throw new RepairError(
          'remote-scope-violation',
          "Une ligne d'un autre utilisateur ou d'une autre application a été renvoyée."
        );
      }
      if (!ALLOWED_KEY_SET.has(raw.data_key)) {
        throw new RepairError(
          'forbidden-remote-key',
          'Clé cloud hors frontière personnelle : ' + String(raw.data_key) + '.'
        );
      }
      if (keys.has(raw.data_key)) {
        throw new RepairError(
          'duplicate-remote-key',
          'Plusieurs lignes cloud existent pour ' + raw.data_key + '.'
        );
      }
      keys.add(raw.data_key);
      rows.push(normalizeRemoteRow(raw, userId));
    }
    return rows.sort((left, right) => left.data_key.localeCompare(right.data_key));
  }

  function canonicalRows(rows) {
    return stableJson(
      rows
        .map((row) => ({
          id: row.id,
          user_id: row.user_id,
          app_id: row.app_id,
          data_key: row.data_key,
          payload: row.payload,
          schema_version: row.schema_version,
          revision: row.revision,
          deleted_at: row.deleted_at,
          updated_at: row.updated_at,
          last_device_id: row.last_device_id
        }))
        .sort((left, right) => left.data_key.localeCompare(right.data_key))
    );
  }

  function captureAllowedLocal(storage) {
    const values = {};
    for (const key of ALLOWED_KEYS) {
      const value = storage.getItem(key);
      if (value !== null) values[key] = value;
    }
    return values;
  }

  function validateLocalFavorites(localValues) {
    if (!own(localValues, 'crFavMeals')) {
      return {
        ok: false,
        count: null,
        reason: "crFavMeals local n'existe pas."
      };
    }
    let favorites;
    try {
      favorites = JSON.parse(localValues.crFavMeals);
    } catch (_) {
      return {
        ok: false,
        count: null,
        reason: "crFavMeals local n'est pas un tableau JSON valide."
      };
    }
    if (!Array.isArray(favorites)) {
      return {
        ok: false,
        count: null,
        reason: "crFavMeals local n'est pas un tableau JSON valide."
      };
    }
    if (favorites.length !== EXPECTED_LOCAL_FAVORITES) {
      return {
        ok: false,
        count: favorites.length,
        reason:
          'Le nombre de favoris locaux doit être exactement ' +
          EXPECTED_LOCAL_FAVORITES +
          '.'
      };
    }
    return { ok: true, count: EXPECTED_LOCAL_FAVORITES, reason: null };
  }

  function remoteLiveValue(row) {
    if (!row || row.deleted_at) return { present: false, value: null };
    return {
      present: true,
      value: normalizeRemoteLocalStorageValue(row.payload.value, row.data_key)
    };
  }

  function remoteFavoriteCount(row) {
    const live = remoteLiveValue(row);
    if (!live.present) return 0;
    try {
      const parsed = JSON.parse(live.value);
      return Array.isArray(parsed) ? parsed.length : null;
    } catch (_) {
      return null;
    }
  }

  function buildPreview(localValues, rows) {
    const remoteMap = new Map(rows.map((row) => [row.data_key, row]));
    const entries = [];
    for (const key of ALLOWED_KEYS) {
      const localPresent = own(localValues, key);
      const remote = remoteMap.get(key) || null;
      const remoteState = !remote
        ? 'absent'
        : remote.deleted_at
          ? 'tombstone'
          : 'actif';
      let action = 'preserve-absent';
      let difference = 'identique';
      let targetRevision = null;
      if (localPresent && remote) {
        const remoteValue = remoteLiveValue(remote);
        action = 'update';
        difference =
          remoteValue.present &&
          remoteValue.value === localValues[key] &&
          remote.schema_version === DATA_SCHEMA
            ? 'normaliser-révision'
            : remote.deleted_at
              ? 'réactiver'
              : 'remplacer';
        targetRevision = remote.revision + 1;
      } else if (localPresent) {
        action = 'insert';
        difference = 'créer';
        targetRevision = 1;
      } else if (remote && !remote.deleted_at) {
        action = 'tombstone';
        difference = 'supprimer';
        targetRevision = remote.revision + 1;
      } else if (remote) {
        action = 'preserve-tombstone';
        difference = 'suppression-conservée';
        targetRevision = remote.revision;
      }
      entries.push({
        key,
        localPresent,
        localValue: localPresent ? localValues[key] : null,
        remote,
        remoteState,
        remoteSchemaVersion: remote?.schema_version ?? null,
        remoteRevision: remote?.revision ?? null,
        action,
        difference,
        targetRevision
      });
    }
    return entries;
  }

  function expectedVersionError(version) {
    if (!isPlainObject(version)) return 'v8/version.json est invalide.';
    if (version.foundationVersion !== RELEASE) {
      return 'Foundation doit être exactement ' + RELEASE + '.';
    }
    if (String(version.productVersion) !== PRODUCT_VERSION) {
      return 'Le produit doit être exactement ' + PRODUCT_VERSION + '.';
    }
    if (version.cloudEnabled !== false) {
      return 'cloudEnabled doit rester strictement false.';
    }
    if (version.cloudAppId !== APP_ID) {
      return 'cloudAppId doit être exactement ' + APP_ID + '.';
    }
    if (version.bootstrapGeneration !== BOOTSTRAP_GENERATION) {
      return 'bootstrapGeneration doit être exactement ' + BOOTSTRAP_GENERATION + '.';
    }
    return null;
  }

  function assertExpectedVersion(version) {
    const message = expectedVersionError(version);
    if (message) throw new RepairError('tool-blocked', message);
    return version;
  }

  function backupFilename(timestamp) {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) {
      throw new RepairError('invalid-clock', "L'horloge locale est invalide.");
    }
    const iso = date.toISOString();
    const stamp = iso.slice(0, 10) + '-' + iso.slice(11, 19).replace(/:/g, '');
    return 'clair-repas-cloud-backup-' + stamp + '.json';
  }

  function createBackup(userId, rows, timestamp) {
    return {
      format: BACKUP_FORMAT,
      created_at: timestamp,
      user_id: userId,
      app_id: APP_ID,
      foundation_version: RELEASE,
      product_version: PRODUCT_VERSION,
      bootstrap_generation: BOOTSTRAP_GENERATION,
      rows: rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        app_id: row.app_id,
        data_key: row.data_key,
        payload: cloneValue(row.payload),
        schema_version: row.schema_version,
        revision: row.revision,
        deleted_at: row.deleted_at,
        updated_at: row.updated_at,
        last_device_id: row.last_device_id
      }))
    };
  }

  function platformLabel(navigatorApi) {
    const userAgent = String(navigatorApi?.userAgent || '');
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/iPhone/i.test(userAgent)) return 'iPhone';
    if (/iPad/i.test(userAgent)) return 'iPad';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/Macintosh|Mac OS X/i.test(userAgent)) return 'Mac';
    if (/Linux/i.test(userAgent)) return 'Linux';
    return String(navigatorApi?.platform || 'Ordinateur').trim() || 'Ordinateur';
  }

  function browserLabel(navigatorApi) {
    const userAgent = String(navigatorApi?.userAgent || '');
    if (/Edg\//.test(userAgent)) return 'Edge';
    if (/Firefox\//.test(userAgent)) return 'Firefox';
    if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) return 'Chrome';
    if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
    return 'Navigateur';
  }

  function realDeviceLabel(navigatorApi = host.navigator) {
    return platformLabel(navigatorApi) + ' • ' + browserLabel(navigatorApi);
  }

  function assertWriteRecord(record, userId) {
    if (
      !isPlainObject(record) ||
      record.user_id !== userId ||
      record.app_id !== APP_ID ||
      !ALLOWED_KEY_SET.has(record.data_key)
    ) {
      throw new RepairError('forbidden-write-scope', 'Écriture hors périmètre refusée.');
    }
    if (record.schema_version !== DATA_SCHEMA) {
      throw new RepairError(
        'forbidden-write-schema',
        'Toute écriture doit utiliser schema_version = 2.'
      );
    }
    if (!isPlainObject(record.payload) || !own(record.payload, 'value')) {
      throw new RepairError('invalid-write-payload', "Payload d'écriture invalide.");
    }
  }

  function createSupabaseTransport(client) {
    if (!client || !client.auth || typeof client.from !== 'function') {
      throw new RepairError('invalid-client', 'Client Supabase public indisponible.');
    }
    let authenticatedUserId = null;

    return Object.freeze({
      async getAuthenticatedUser() {
        const sessionResult = await client.auth.getSession();
        if (sessionResult?.error || !sessionResult?.data?.session?.user?.id) {
          throw new RepairError('auth-required', 'Session Supabase absente ou invalide.');
        }
        const userResult = await client.auth.getUser();
        if (userResult?.error || !userResult?.data?.user?.id) {
          throw new RepairError('auth-required', 'Utilisateur Supabase non vérifié.');
        }
        if (userResult.data.user.id !== sessionResult.data.session.user.id) {
          throw new RepairError(
            'auth-mismatch',
            "L'utilisateur vérifié ne correspond pas à la session."
          );
        }
        authenticatedUserId = userResult.data.user.id;
        return { id: userResult.data.user.id };
      },

      async listRows({ user_id, app_id }) {
        if (
          !authenticatedUserId ||
          user_id !== authenticatedUserId ||
          app_id !== APP_ID
        ) {
          throw new RepairError('forbidden-read-scope', 'Lecture cloud hors périmètre refusée.');
        }
        const result = await client
          .from(REMOTE_TABLE)
          .select(REMOTE_COLUMNS)
          .eq('user_id', user_id)
          .eq('app_id', APP_ID);
        if (result.error) throw result.error;
        return result.data || [];
      },

      async writeRow(record, expectedRow) {
        if (!authenticatedUserId || record?.user_id !== authenticatedUserId) {
          throw new RepairError('forbidden-write-scope', 'Écriture cloud hors identité refusée.');
        }
        assertWriteRecord(record, authenticatedUserId);
        if (
          expectedRow &&
          (expectedRow.user_id !== record.user_id ||
            expectedRow.app_id !== record.app_id ||
            expectedRow.data_key !== record.data_key)
        ) {
          throw new RepairError('forbidden-write-scope', 'Avant-image CAS hors périmètre.');
        }
        if (expectedRow) {
          const changes = {
            payload: record.payload,
            schema_version: DATA_SCHEMA,
            deleted_at: record.deleted_at,
            updated_at: record.updated_at,
            last_device_id: record.last_device_id
          };
          const result = await client
            .from(REMOTE_TABLE)
            .update(changes)
            .eq('user_id', record.user_id)
            .eq('app_id', APP_ID)
            .eq('data_key', record.data_key)
            .eq('revision', expectedRow.revision)
            .select(REMOTE_COLUMNS)
            .maybeSingle();
          if (result.error) throw result.error;
          if (!result.data) throw new CasConflictError();
          return result.data;
        }

        const result = await client
          .from(REMOTE_TABLE)
          .insert({ ...record, revision: 1 })
          .select(REMOTE_COLUMNS)
          .single();
        if (result.error) {
          if (String(result.error.code || '') === '23505') throw new CasConflictError();
          throw result.error;
        }
        if (!result.data) {
          throw new RepairError('insert-empty', "L'insertion n'a renvoyé aucune ligne.");
        }
        return result.data;
      }
    });
  }

  function rowIdentity(row) {
    return row.user_id + '\u0000' + row.app_id + '\u0000' + row.data_key;
  }

  class MemoryTransport {
    constructor(options = {}) {
      this.user = { id: options.userId || 'memory-user' };
      this.rows = (options.rows || []).map((row) => cloneValue(row));
      this.listCount = 0;
      this.writeAttempts = [];
      this.successfulWrites = [];
      this.options = options;
      this.repairAttemptCount = 0;
      this.rollbackAttemptCount = 0;
      this.authCount = 0;
    }

    async getAuthenticatedUser() {
      this.authCount += 1;
      if (this.options.authUserId === null) {
        throw new RepairError('auth-required', 'Session mémoire absente.');
      }
      if (
        this.options.sessionUserId &&
        this.options.verifiedUserId &&
        this.options.sessionUserId !== this.options.verifiedUserId
      ) {
        throw new RepairError('auth-mismatch', 'Session mémoire incohérente.');
      }
      return { id: this.options.verifiedUserId || this.user.id };
    }

    async listRows({ user_id, app_id }) {
      this.listCount += 1;
      if (typeof this.options.onList === 'function') {
        await this.options.onList({
          transport: this,
          count: this.listCount,
          user_id,
          app_id
        });
      }
      return this.rows
        .filter((row) => row.user_id === user_id && row.app_id === app_id)
        .map((row) => cloneValue(row));
    }

    forceMutate(dataKey, patch, userId = this.user.id, appId = APP_ID) {
      const index = this.rows.findIndex(
        (row) =>
          row.user_id === userId && row.app_id === appId && row.data_key === dataKey
      );
      if (index < 0) throw new Error('memory-row-not-found:' + dataKey);
      this.rows[index] = { ...this.rows[index], ...cloneValue(patch) };
    }

    async writeRow(record, expectedRow, context = {}) {
      assertWriteRecord(record, record.user_id);
      const phase = context.phase || 'repair';
      if (phase === 'rollback') this.rollbackAttemptCount += 1;
      else this.repairAttemptCount += 1;
      const phaseAttempt =
        phase === 'rollback' ? this.rollbackAttemptCount : this.repairAttemptCount;
      this.writeAttempts.push({
        phase,
        record: cloneValue(record),
        expectedRevision: expectedRow?.revision ?? null
      });

      if (typeof this.options.onBeforeWrite === 'function') {
        await this.options.onBeforeWrite({
          transport: this,
          phase,
          phaseAttempt,
          record: cloneValue(record),
          expectedRow: expectedRow ? cloneValue(expectedRow) : null
        });
      }
      if (
        (phase === 'repair' && this.options.failRepairAt === phaseAttempt) ||
        (phase === 'rollback' && this.options.failRollbackAt === phaseAttempt)
      ) {
        throw new Error('memory-injected-' + phase + '-failure');
      }

      const identity = rowIdentity(record);
      const index = this.rows.findIndex((row) => rowIdentity(row) === identity);
      const current = index >= 0 ? this.rows[index] : null;
      if (expectedRow) {
        if (!current || Number(current.revision) !== Number(expectedRow.revision)) {
          throw new CasConflictError();
        }
      } else if (current) {
        throw new CasConflictError('Une ligne est apparue avant INSERT.');
      }

      const next = {
        id: current?.id || 'memory-' + record.data_key,
        user_id: record.user_id,
        app_id: record.app_id,
        data_key: record.data_key,
        payload: cloneValue(record.payload),
        schema_version: DATA_SCHEMA,
        revision: current ? Number(current.revision) + 1 : 1,
        deleted_at: record.deleted_at ?? null,
        updated_at: record.updated_at ?? null,
        last_device_id: record.last_device_id ?? null
      };
      if (index >= 0) this.rows[index] = next;
      else this.rows.push(next);
      this.successfulWrites.push({ phase, row: cloneValue(next) });
      return cloneValue(next);
    }
  }

  function operationRecord(entry, userId, timestamp, deviceLabel) {
    const tombstone = entry.action === 'tombstone';
    const remote = entry.remote;
    return {
      user_id: userId,
      app_id: APP_ID,
      data_key: entry.key,
      payload: {
        value: tombstone ? null : entry.localValue,
        source_device: deviceLabel,
        synced_at: timestamp,
        integration: INTEGRATION
      },
      schema_version: DATA_SCHEMA,
      deleted_at: tombstone ? timestamp : null,
      updated_at: timestamp,
      last_device_id: remote?.last_device_id ?? null
    };
  }

  function comparableWrittenRow(row) {
    return stableJson({
      user_id: row.user_id,
      app_id: row.app_id,
      data_key: row.data_key,
      payload: row.payload,
      schema_version: row.schema_version,
      revision: row.revision,
      deleted_at: row.deleted_at,
      last_device_id: row.last_device_id
    });
  }

  function rowMatchesTarget(row, record, targetRevision) {
    return Boolean(
      row &&
        row.user_id === record.user_id &&
        row.app_id === record.app_id &&
        row.data_key === record.data_key &&
        row.schema_version === DATA_SCHEMA &&
        row.revision === targetRevision &&
        row.deleted_at === record.deleted_at &&
        row.last_device_id === (record.last_device_id ?? null) &&
        stableJson(row.payload) === stableJson(record.payload)
    );
  }

  function validateWriteResult(raw, expectedRow, record, userId) {
    const row = normalizeRemoteRow(raw, userId);
    const expectedRevision = expectedRow ? expectedRow.revision + 1 : 1;
    if (
      row.data_key !== record.data_key ||
      row.schema_version !== DATA_SCHEMA ||
      row.revision !== expectedRevision ||
      row.deleted_at !== record.deleted_at ||
      stableJson(row.payload) !== stableJson(record.payload)
    ) {
      throw new RepairError(
        'unexpected-write-result',
        "Le résultat d'écriture ne correspond pas à la cible CAS."
      );
    }
    return row;
  }

  function verifyFinalCloud(localValues, rows, writtenKeys) {
    const map = new Map(rows.map((row) => [row.data_key, row]));
    if (map.size !== rows.length) {
      throw new RepairError('final-duplicate', 'Le cloud final contient des doublons.');
    }
    for (const key of ALLOWED_KEYS) {
      const localPresent = own(localValues, key);
      const row = map.get(key) || null;
      if (localPresent) {
        if (!row || row.deleted_at) {
          throw new RepairError('final-mismatch', key + " n'est pas actif dans le cloud final.");
        }
        if (row.schema_version !== DATA_SCHEMA) {
          throw new RepairError('final-schema', key + " n'est pas en schema_version 2.");
        }
        if (remoteLiveValue(row).value !== localValues[key]) {
          throw new RepairError('final-mismatch', key + ' diffère de la valeur locale exacte.');
        }
      } else if (row && !row.deleted_at) {
        throw new RepairError('final-mismatch', key + ' devrait être absent ou tombstone.');
      }
      if (writtenKeys.has(key) && row?.schema_version !== DATA_SCHEMA) {
        throw new RepairError('final-schema', 'Une ligne écrite ne respecte pas le schéma 2.');
      }
    }
    if (rows.some((row) => !ALLOWED_KEY_SET.has(row.data_key))) {
      throw new RepairError('final-technical-key', 'Une clé technique apparaît dans le cloud final.');
    }
    const favoriteRow = map.get('crFavMeals');
    if (remoteFavoriteCount(favoriteRow) !== EXPECTED_LOCAL_FAVORITES) {
      throw new RepairError(
        'final-favorites',
        'Le cloud final ne contient pas exactement ' + EXPECTED_LOCAL_FAVORITES + ' favoris.'
      );
    }
    return true;
  }

  class CloudRepairEngine {
    constructor(options) {
      if (!options?.storage || !options?.transport || !options?.versionProvider) {
        throw new RepairError('invalid-engine', "Configuration de l'outil incomplète.");
      }
      this.storage = options.storage;
      this.transport = options.transport;
      this.versionProvider = options.versionProvider;
      this.now = options.now || (() => new Date().toISOString());
      this.deviceLabel = String(options.deviceLabel || realDeviceLabel()).trim();
      if (!this.deviceLabel) this.deviceLabel = 'Ordinateur • Navigateur';
      this.currentAnalysis = null;
    }

    async assertVersion() {
      return assertExpectedVersion(await this.versionProvider());
    }

    async readRows(userId) {
      const raw = await this.transport.listRows({ user_id: userId, app_id: APP_ID });
      return normalizeRemoteRows(raw, userId);
    }

    async analyze() {
      const version = await this.assertVersion();
      const user = await this.transport.getAuthenticatedUser();
      if (!user?.id) throw new RepairError('auth-required', 'Utilisateur authentifié absent.');
      const localValues = captureAllowedLocal(this.storage);
      const rows = await this.readRows(user.id);
      const preview = buildPreview(localValues, rows);
      const localFavorites = validateLocalFavorites(localValues);
      const remoteMap = new Map(rows.map((row) => [row.data_key, row]));
      const cloudFavorites = remoteFavoriteCount(remoteMap.get('crFavMeals'));
      const generatedAt = this.now();
      const analysis = {
        version: cloneValue(version),
        user: { id: user.id },
        generatedAt,
        localValues: { ...localValues },
        localKeyCount: Object.keys(localValues).length,
        cloudRowCount: rows.length,
        localFavoriteCount: localFavorites.count,
        cloudFavoriteCount: cloudFavorites,
        favoriteLock: localFavorites,
        preview,
        remoteRows: rows,
        remoteSnapshot: canonicalRows(rows),
        repairAllowed: false,
        backup: null,
        backupKey: null,
        backupJson: null,
        backupFilename: null
      };

      if (!localFavorites.ok) {
        this.currentAnalysis = analysis;
        return analysis;
      }

      const backup = createBackup(user.id, rows, generatedAt);
      const backupJson = JSON.stringify(backup, null, 2);
      const backupKey = BACKUP_PREFIX + generatedAt;
      try {
        this.storage.setItem(backupKey, backupJson);
      } catch (_) {
        throw new RepairError(
          'backup-storage-failed',
          'La sauvegarde cloud locale n’a pas pu être conservée.'
        );
      }
      if (this.storage.getItem(backupKey) !== backupJson) {
        throw new RepairError(
          'backup-verification-failed',
          'La sauvegarde cloud locale ne peut pas être vérifiée.'
        );
      }
      analysis.backup = backup;
      analysis.backupKey = backupKey;
      analysis.backupJson = backupJson;
      analysis.backupFilename = backupFilename(generatedAt);
      analysis.repairAllowed = true;
      this.currentAnalysis = analysis;
      return analysis;
    }

    async rollbackApplied(applied, analysis) {
      let complete = true;
      const failures = [];
      for (const change of [...applied].reverse()) {
        try {
          const rows = await this.readRows(analysis.user.id);
          const current = rows.find((row) => row.data_key === change.key) || null;
          if (!current) throw new Error('rollback-current-row-missing');
          if (change.written) {
            if (comparableWrittenRow(current) !== comparableWrittenRow(change.written)) {
              throw new Error('rollback-current-row-changed');
            }
          } else if (!rowMatchesTarget(current, change.targetRecord, change.targetRevision)) {
            throw new Error('rollback-written-row-unverifiable');
          }
          const timestamp = this.now();
          const record = change.before
            ? {
                user_id: analysis.user.id,
                app_id: APP_ID,
                data_key: change.key,
                payload: cloneValue(change.before.payload),
                // Le garde-fou RLS interdit toute nouvelle écriture en schéma 1.
                schema_version: DATA_SCHEMA,
                deleted_at: change.before.deleted_at,
                updated_at: timestamp,
                last_device_id: change.before.last_device_id
              }
            : {
                user_id: analysis.user.id,
                app_id: APP_ID,
                data_key: change.key,
                payload: {
                  value: null,
                  source_device: this.deviceLabel,
                  synced_at: timestamp,
                  integration: INTEGRATION + '-rollback'
                },
                schema_version: DATA_SCHEMA,
                deleted_at: timestamp,
                updated_at: timestamp,
                last_device_id: current.last_device_id
              };
          const raw = await this.transport.writeRow(record, current, { phase: 'rollback' });
          validateWriteResult(raw, current, record, analysis.user.id);
        } catch (error) {
          complete = false;
          failures.push({ key: change.key, message: String(error?.message || error) });
        }
      }
      return { complete, failures };
    }

    async repair(options = {}) {
      const analysis = options.analysis || this.currentAnalysis;
      const confirm = options.confirm;
      if (!analysis || analysis !== this.currentAnalysis || !analysis.repairAllowed) {
        throw new RepairError('analysis-required', 'Une nouvelle analyse réussie est obligatoire.');
      }
      if (!analysis.backupJson || this.storage.getItem(analysis.backupKey) !== analysis.backupJson) {
        throw new RepairError('backup-required', 'La sauvegarde vérifiée est obligatoire.');
      }
      if (typeof confirm !== 'function') {
        throw new RepairError('confirmation-required', 'La double confirmation est obligatoire.');
      }
      if (!(await Promise.resolve(confirm(FIRST_CONFIRMATION)))) {
        return { status: 'cancelled', writes: 0 };
      }
      if (!(await Promise.resolve(confirm(SECOND_CONFIRMATION)))) {
        return { status: 'cancelled', writes: 0 };
      }

      await this.assertVersion();
      const currentUser = await this.transport.getAuthenticatedUser();
      if (!currentUser?.id || currentUser.id !== analysis.user.id) {
        throw new RepairError(
          'auth-mismatch',
          "L'utilisateur authentifié a changé depuis l'analyse."
        );
      }
      const currentRows = await this.readRows(analysis.user.id);
      if (canonicalRows(currentRows) !== analysis.remoteSnapshot) {
        this.currentAnalysis = null;
        return {
          status: 'cloud-changed',
          title: 'LE CLOUD A CHANGÉ',
          message: 'Nouvelle analyse obligatoire.',
          writes: 0
        };
      }

      const operations = analysis.preview.filter((entry) =>
        ['update', 'insert', 'tombstone'].includes(entry.action)
      );
      const applied = [];
      try {
        for (const entry of operations) {
          const timestamp = this.now();
          const record = operationRecord(
            entry,
            analysis.user.id,
            timestamp,
            this.deviceLabel
          );
          const expected = entry.remote;
          let raw;
          try {
            raw = await this.transport.writeRow(record, expected, { phase: 'repair' });
          } catch (error) {
            // Un refus CAS garantit que notre écriture n'a pas eu lieu. Pour
            // toute autre erreur (réponse réseau perdue après commit, par
            // exemple), relire afin de détecter une écriture effectivement
            // appliquée avant de décider s'il faut compenser.
            if (!(error instanceof CasConflictError)) {
              try {
                const probeRows = await this.readRows(analysis.user.id);
                const current =
                  probeRows.find((row) => row.data_key === entry.key) || null;
                const targetRevision = expected ? expected.revision + 1 : 1;
                const stillOriginal = expected
                  ? current &&
                    comparableWrittenRow(current) === comparableWrittenRow(expected)
                  : !current;
                if (rowMatchesTarget(current, record, targetRevision)) {
                  applied.push({ key: entry.key, before: expected, written: current });
                } else if (!stillOriginal) {
                  applied.push({
                    key: entry.key,
                    before: expected,
                    written: null,
                    targetRecord: record,
                    targetRevision
                  });
                }
              } catch (_) {
                applied.push({
                  key: entry.key,
                  before: expected,
                  written: null,
                  targetRecord: record,
                  targetRevision: expected ? expected.revision + 1 : 1
                });
              }
            }
            throw error;
          }
          try {
            const written = validateWriteResult(
              raw,
              expected,
              record,
              analysis.user.id
            );
            applied.push({ key: entry.key, before: expected, written });
          } catch (error) {
            // L'appel d'écriture a répondu : conserver l'opération comme
            // potentiellement appliquée afin que le rollback la vérifie puis
            // la compense au lieu de l'oublier.
            applied.push({
              key: entry.key,
              before: expected,
              written: null,
              targetRecord: record,
              targetRevision: expected ? expected.revision + 1 : 1
            });
            throw error;
          }
        }

        const finalRows = await this.readRows(analysis.user.id);
        verifyFinalCloud(
          analysis.localValues,
          finalRows,
          new Set(applied.map((entry) => entry.key))
        );
        await this.assertVersion();
        this.currentAnalysis = null;
        return {
          status: 'success',
          writes: applied.length,
          lines: [
            'RÉPARATION CLOUD RÉUSSIE',
            EXPECTED_LOCAL_FAVORITES + ' FAVORIS CONFIRMÉS',
            'FOUNDATION.15 TOUJOURS VERROUILLÉE'
          ]
        };
      } catch (error) {
        this.currentAnalysis = null;
        if (applied.length === 0) {
          return {
            status: error instanceof CasConflictError ? 'cas-refused' : 'failed',
            writes: 0,
            error
          };
        }
        const rollback = await this.rollbackApplied(applied, analysis);
        return {
          status: rollback.complete ? 'rollback-complete' : 'rollback-incomplete',
          writes: applied.length,
          error,
          rollback,
          title: rollback.complete
            ? 'ROLLBACK EFFECTUÉ'
            : 'ROLLBACK INCOMPLET — INTERVENTION MANUELLE REQUISE'
        };
      }
    }
  }

  async function loadVersionFromSameOrigin() {
    const url = new URL(VERSION_PATH, host.location.href);
    if (url.origin !== host.location.origin) {
      throw new RepairError('origin-mismatch', "L'outil doit rester sur le même origin.");
    }
    const response = await host.fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!response.ok) {
      throw new RepairError('version-unavailable', 'v8/version.json est indisponible.');
    }
    return response.json();
  }

  function createLiveEngine() {
    if (!host.supabase || typeof host.supabase.createClient !== 'function') {
      throw new RepairError('supabase-library-unavailable', 'Bibliothèque Supabase indisponible.');
    }
    if (!SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
      throw new RepairError('publishable-key-required', 'Clé publishable Supabase obligatoire.');
    }
    const client = host.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
    return new CloudRepairEngine({
      storage: host.localStorage,
      transport: createSupabaseTransport(client),
      versionProvider: loadVersionFromSameOrigin,
      deviceLabel: realDeviceLabel(host.navigator)
    });
  }

  function setText(element, text) {
    if (element) element.textContent = text;
  }

  function renderPreview(elements, analysis) {
    setText(elements.localCount, String(analysis.localKeyCount));
    setText(elements.cloudCount, String(analysis.cloudRowCount));
    setText(
      elements.localFavorites,
      analysis.localFavoriteCount === null ? 'invalide' : String(analysis.localFavoriteCount)
    );
    setText(
      elements.cloudFavorites,
      analysis.cloudFavoriteCount === null ? 'invalide' : String(analysis.cloudFavoriteCount)
    );
    elements.previewRows.replaceChildren();
    for (const entry of analysis.preview) {
      const row = host.document.createElement('tr');
      for (const value of [
        entry.key,
        entry.localPresent ? 'présente' : 'absente',
        entry.remoteState,
        entry.remoteSchemaVersion ?? '—',
        entry.remoteRevision ?? '—',
        entry.difference,
        entry.action,
        entry.targetRevision ?? '—'
      ]) {
        const cell = host.document.createElement('td');
        cell.textContent = String(value);
        row.appendChild(cell);
      }
      elements.previewRows.appendChild(row);
    }
  }

  function showResult(elements, kind, lines) {
    elements.result.dataset.kind = kind;
    elements.result.replaceChildren();
    for (const line of lines) {
      const paragraph = host.document.createElement('p');
      paragraph.textContent = line;
      elements.result.appendChild(paragraph);
    }
  }

  function installDownload(elements, analysis) {
    elements.downloadButton.disabled = false;
    elements.downloadButton.onclick = () => {
      const blob = new Blob([analysis.backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = host.document.createElement('a');
      anchor.href = url;
      anchor.download = analysis.backupFilename;
      anchor.click();
      URL.revokeObjectURL(url);
    };
  }

  function bootBrowserUi() {
    const root = host.document?.querySelector?.('[data-clair-cloud-repair-tool]');
    if (!root) return;
    const byId = (id) => host.document.getElementById(id);
    const elements = {
      analyzeButton: byId('analyzeButton'),
      repairButton: byId('repairButton'),
      downloadButton: byId('downloadButton'),
      status: byId('analysisStatus'),
      localCount: byId('localKeyCount'),
      cloudCount: byId('cloudRowCount'),
      localFavorites: byId('localFavoriteCount'),
      cloudFavorites: byId('cloudFavoriteCount'),
      previewRows: byId('previewRows'),
      result: byId('repairResult')
    };
    let engine = null;
    let analysis = null;

    elements.repairButton.disabled = true;
    elements.downloadButton.disabled = true;

    elements.analyzeButton.addEventListener('click', async () => {
      elements.analyzeButton.disabled = true;
      elements.repairButton.disabled = true;
      elements.downloadButton.disabled = true;
      showResult(elements, 'neutral', []);
      setText(elements.status, 'Analyse locale et cloud en cours…');
      try {
        engine = createLiveEngine();
        analysis = await engine.analyze();
        renderPreview(elements, analysis);
        if (!analysis.favoriteLock.ok) {
          setText(
            elements.status,
            'RÉPARATION INTERDITE — La copie locale de référence n’est pas celle attendue. ' +
              analysis.favoriteLock.reason
          );
          showResult(elements, 'error', [
            'RÉPARATION INTERDITE',
            'La copie locale de référence n’est pas celle attendue.'
          ]);
          return;
        }
        installDownload(elements, analysis);
        elements.repairButton.disabled = false;
        setText(
          elements.status,
          'Analyse réussie. Sauvegarde cloud créée et prévisualisation complète affichée.'
        );
      } catch (error) {
        analysis = null;
        setText(elements.status, 'OUTIL BLOQUÉ — ' + String(error?.message || error));
        showResult(elements, 'error', ['OUTIL BLOQUÉ', String(error?.message || error)]);
      } finally {
        elements.analyzeButton.disabled = false;
      }
    });

    elements.repairButton.addEventListener('click', async () => {
      if (!engine || !analysis) return;
      elements.repairButton.disabled = true;
      elements.analyzeButton.disabled = true;
      setText(elements.status, 'Contrôle de concurrence puis réparation…');
      try {
        const result = await engine.repair({
          analysis,
          confirm: (message) => host.confirm(message)
        });
        if (result.status === 'success') {
          showResult(elements, 'success', result.lines);
          setText(elements.status, 'Réparation et vérification terminées.');
        } else if (result.status === 'cloud-changed') {
          showResult(elements, 'error', [result.title, result.message]);
          setText(elements.status, result.title + ' — ' + result.message);
        } else if (result.status === 'rollback-complete') {
          showResult(elements, 'error', [result.title]);
          setText(elements.status, result.title);
        } else if (result.status === 'rollback-incomplete') {
          showResult(elements, 'error', [result.title]);
          setText(elements.status, result.title);
        } else if (result.status === 'cancelled') {
          showResult(elements, 'neutral', ['Réparation annulée.']);
          setText(elements.status, 'Réparation annulée avant toute écriture.');
          elements.repairButton.disabled = false;
        } else {
          showResult(elements, 'error', [
            result.status === 'cas-refused' ? 'CAS REFUSÉ' : 'RÉPARATION ÉCHOUÉE',
            String(result.error?.message || result.error || '')
          ]);
          setText(elements.status, 'Réparation interrompue sans succès déclaré.');
        }
      } catch (error) {
        showResult(elements, 'error', ['OUTIL BLOQUÉ', String(error?.message || error)]);
        setText(elements.status, 'OUTIL BLOQUÉ — ' + String(error?.message || error));
      } finally {
        elements.analyzeButton.disabled = false;
      }
    });
  }

  host.ClairCloudRepair = Object.freeze({
    CloudRepairEngine,
    MemoryTransport,
    RepairError,
    CasConflictError,
    createSupabaseTransport,
    captureAllowedLocal,
    normalizeRemoteLocalStorageValue,
    normalizeRemoteRows,
    buildPreview,
    validateLocalFavorites,
    verifyFinalCloud,
    expectedVersionError,
    realDeviceLabel,
    constants: Object.freeze({
      APP_ID,
      RELEASE,
      PRODUCT_VERSION,
      BOOTSTRAP_GENERATION,
      DATA_SCHEMA,
      LEGACY_DATA_SCHEMA,
      EXPECTED_LOCAL_FAVORITES,
      INTEGRATION,
      REMOTE_TABLE,
      REMOTE_COLUMNS,
      VERSION_PATH,
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      BACKUP_PREFIX,
      BACKUP_FORMAT,
      FIRST_CONFIRMATION,
      SECOND_CONFIRMATION,
      ALLOWED_KEYS
    })
  });

  if (host.document) {
    if (host.document.readyState === 'loading') {
      host.document.addEventListener('DOMContentLoaded', bootBrowserUi, { once: true });
    } else {
      bootBrowserUi();
    }
  }
})();
