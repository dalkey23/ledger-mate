export const DB_NAME = "upload-db";
export const DB_VERSION = 3; 

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (ev) => {
      const db = req.result;
      const tx = req.transaction!;
      const oldVersion = (ev as IDBVersionChangeEvent).oldVersion ?? 0;

      let records: IDBObjectStore;
      if (!db.objectStoreNames.contains("records")) {
        records = db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
      } else {
        records = tx.objectStore("records");
      }
      ensureIndex(records, "by_date", "거래일시");
      ensureIndex(records, "by_partyId", "partyId"); 

      if (oldVersion < 2 && !db.objectStoreNames.contains("parties")) {
        const parties = db.createObjectStore("parties", { keyPath: "id" });
        ensureIndex(parties, "by_nameNorm", "nameNorm", { unique: true });
        ensureIndex(parties, "by_createdAt", "createdAt");
        ensureIndex(parties, "by_freq", "freq");
      } else if (db.objectStoreNames.contains("parties")) {
        const parties = tx.objectStore("parties");
        ensureIndex(parties, "by_nameNorm", "nameNorm", { unique: true });
        ensureIndex(parties, "by_createdAt", "createdAt");
        ensureIndex(parties, "by_freq", "freq");
      }

    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => {
      console.warn("[IndexedDB] Upgrade blocked. Close other tabs running this app.");
    };
  });
}

function ensureIndex(
  store: IDBObjectStore,
  name: string,
  keyPath: string | string[],
  options?: IDBIndexParameters
) {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath as any, options);
  }
}
