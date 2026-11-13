// Minimal IndexedDB stand-in: transactions buffer writes and roll back on abort,
// with fault injection for quota, abort and read failures.
export class FakeIndexedDB {
  constructor() {
    this.databases_ = new Map();
    this.faults = {};
  }

  seed(name, records) {
    this.databases_.set(name, { worlds: new Map(Object.entries(records).map(([k, v]) => [k, structuredClone(v)])) });
  }

  records(name) {
    return this.databases_.get(name)?.worlds;
  }

  async databases() {
    return [...this.databases_.keys()].map(name => ({ name, version: 1 }));
  }

  open(name, version) {
    const request = {};
    setTimeout(() => {
      if (this.faults.open) {
        request.error = this.faults.open;
        request.onerror?.();
        return;
      }
      let stores = this.databases_.get(name);
      if (!stores) {
        stores = {};
        this.databases_.set(name, stores);
        const upgrade = {
          createObjectStore: storeName => { stores[storeName] = new Map(); }
        };
        request.result = upgrade;
        request.onupgradeneeded?.();
      }
      request.result = {
        transaction: (storeName, mode) => this.transaction(stores[storeName], mode),
        close() {}
      };
      request.onsuccess?.();
    }, 0);
    return request;
  }

  transaction(map, mode) {
    const tx = { error: null, writes: [], pending: 0, finished: false };
    const finish = (outcome, error) => {
      if (tx.finished) return;
      tx.finished = true;
      if (outcome === 'complete') {
        for (const [key, value] of tx.writes) map.set(key, value);
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
    const run = (execute) => {
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
    tx.objectStore = () => ({
      get: key => run(request => {
        if (this.faults.read) {
          request.error = this.faults.read;
          request.onerror?.();
          finish('abort', this.faults.read);
          return;
        }
        const queued = [...tx.writes].reverse().find(([k]) => k === key);
        request.result = structuredClone(queued ? queued[1] : map.get(key));
        request.onsuccess?.();
      }),
      put: (value, key) => run(request => {
        tx.writes.push([key, structuredClone(value)]);
        request.onsuccess?.();
      })
    });
    return tx;
  }
}
