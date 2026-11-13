// Minimal IndexedDB stand-in: transactions buffer writes and roll back on abort,
// with fault injection for quota, abort and read failures.
export class FakeIndexedDB {
  constructor() {
    this.databases_ = new Map();
    this.faults = {};
  }

  seed(name, records) {
    this.databases_.set(name, {
      version: 1,
      stores: { worlds: new Map(Object.entries(records).map(([k, v]) => [k, structuredClone(v)])) }
    });
  }

  records(name, storeName = 'worlds') {
    return this.databases_.get(name)?.stores[storeName];
  }

  async databases() {
    return [...this.databases_].map(([name, database]) => ({ name, version: database.version }));
  }

  open(name, version) {
    const request = {};
    setTimeout(() => {
      if (this.faults.open) {
        request.error = this.faults.open;
        request.onerror?.();
        return;
      }
      let database = this.databases_.get(name);
      if (!database) {
        database = { version: 0, stores: {} };
        this.databases_.set(name, database);
      }
      const requestedVersion = version ?? Math.max(database.version, 1);
      if (requestedVersion > database.version) {
        const upgradeDatabase = this.databaseHandle(database);
        let aborted = false;
        request.result = upgradeDatabase;
        request.transaction = { abort: () => { aborted = true; } };
        request.onupgradeneeded?.();
        if (aborted) {
          request.error = new Error('Database upgrade aborted.');
          request.onerror?.();
          return;
        }
        database.version = requestedVersion;
      }
      request.result = this.databaseHandle(database);
      request.onsuccess?.();
    }, 0);
    return request;
  }

  databaseHandle(database) {
    return {
      objectStoreNames: {
        contains: name => Object.hasOwn(database.stores, name)
      },
      createObjectStore: name => {
        database.stores[name] = new Map();
        return {};
      },
      transaction: (storeNames, mode) => {
        const names = Array.isArray(storeNames) ? storeNames : [storeNames];
        return this.transaction(names.map(storeName => database.stores[storeName]), mode, names);
      },
      close() {}
    };
  }

  transaction(maps, mode, storeNames) {
    const tx = { error: null, writes: [], pending: 0, finished: false };
    const finish = (outcome, error) => {
      if (tx.finished) return;
      tx.finished = true;
      if (outcome === 'complete') {
        for (const [map, key, value, deleted] of tx.writes) {
          if (deleted) map.delete(key);
          else map.set(key, value);
        }
        tx.oncomplete?.();
      } else {
        tx.error = error ?? tx.error;
        tx.onabort?.();
      }
    };
    const settle = () => setTimeout(() => {
      if (tx.finished || tx.pending > 0) return;
      const fault = mode === 'readwrite' && tx.writes.length ? this.faults.commit : null;
      if (fault) finish('abort', fault);
      else finish('complete');
    }, 0);
    const run = execute => {
      const request = {};
      tx.pending++;
      setTimeout(() => {
        tx.pending--;
        if (tx.finished) return;
        execute(request);
        settle();
      }, 0);
      return request;
    };
    tx.abort = () => finish('abort');
    tx.objectStore = storeName => {
      const map = maps[storeNames.indexOf(storeName)];
      const get = key => run(request => {
        if (this.faults.read) {
          request.error = this.faults.read;
          request.onerror?.();
          finish('abort', this.faults.read);
          return;
        }
        const queued = [...tx.writes].reverse().find(([target, itemKey]) => target === map && itemKey === key);
        const write = queued && !queued[3] ? queued[2] : undefined;
        request.result = structuredClone(queued ? write : map.get(key));
        request.onsuccess?.();
      });
      return {
        get,
        getAll: () => run(request => {
          request.result = [...map.values()].map(value => structuredClone(value));
          request.onsuccess?.();
        }),
        getAllKeys: () => run(request => {
          request.result = [...map.keys()];
          request.onsuccess?.();
        }),
        put: (value, key) => run(request => {
          tx.writes.push([map, key, structuredClone(value), false]);
          request.onsuccess?.();
        }),
        delete: key => run(request => {
          tx.writes.push([map, key, undefined, true]);
          request.onsuccess?.();
        })
      };
    };
    return tx;
  }
}
