
export const DB_NAME = "upload-db";   
export const DB_VERSION = 2;          

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (ev) => {
      const db = req.result;
      const tx = req.transaction!;
      const oldVersion = (ev as IDBVersionChangeEvent).oldVersion ?? 0;

      let recordsStore: IDBObjectStore;
      if (!db.objectStoreNames.contains("records")) {
        recordsStore = db.createObjectStore("records", {
          keyPath: "id",
          autoIncrement: true,
        });
        recordsStore.createIndex("by_date", "거래일시", { unique: false });
      } else {
        recordsStore = tx.objectStore("records");
        if (!recordsStore.indexNames.contains("by_date")) {
          recordsStore.createIndex("by_date", "거래일시", { unique: false });
        }
      }

      if (oldVersion < 2) {
        let parties: IDBObjectStore;
        if (!db.objectStoreNames.contains("parties")) {
          parties = db.createObjectStore("parties", { keyPath: "id" });
        } else {
          parties = tx.objectStore("parties");
        }
        const ensure = (
          name: string,
          keyPath: string | string[],
          opt?: IDBIndexParameters
        ) => {
          if (!parties.indexNames.contains(name)) {
            parties.createIndex(name, keyPath, opt);
          }
        };
        ensure("by_nameNorm", "nameNorm", { unique: true });
        ensure("by_createdAt", "createdAt");
        ensure("by_freq", "freq");
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => {
      console.warn(
        "[IndexedDB] Upgrade blocked. Close other tabs running this app."
      );
    };
  });
}
