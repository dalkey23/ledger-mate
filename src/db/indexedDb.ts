export type Kind = "비용" | "매출" | "확인요망" | "" | "-";

export type SavedRecord = {
  id?: number;                 
  계좌: string;                 
  거래일시: string;
  기재내용: string;
  "지급(원)": number;
  "입금(원)": number;
  구분: Kind;
  거래처: string;
  비고: string;                 
};

const DB_NAME = "upload-db";
const STORE = "records";
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        os.createIndex("by_date", "거래일시", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRecords(records: SavedRecord[]): Promise<number> {
  if (records.length === 0) return 0;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const os = tx.objectStore(STORE);
    records.forEach((r) => os.add(r));
    tx.oncomplete = () => resolve(records.length);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllRecords(): Promise<SavedRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const os = tx.objectStore(STORE);
    const req = os.getAll();
    req.onsuccess = () => resolve(req.result as SavedRecord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAllRecords(): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const os = tx.objectStore(STORE);
      const countReq = os.count();
      countReq.onsuccess = () => {
        const total = countReq.result || 0;
        const clearReq = os.clear();
        clearReq.onsuccess = () => resolve(total);
        clearReq.onerror = () => reject(clearReq.error);
      };
      countReq.onerror = () => reject(countReq.error);
    });
  }

  export async function getRecordById(id: number): Promise<SavedRecord | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const os = tx.objectStore(STORE);
      const req = os.get(id);
      req.onsuccess = () => resolve(req.result as SavedRecord | undefined);
      req.onerror = () => reject(req.error);
    });
  }
  
  export async function updateRecord(id: number, patch: Partial<SavedRecord>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const os = tx.objectStore(STORE);
      const getReq = os.get(id);
      getReq.onsuccess = () => {
        const cur = getReq.result as SavedRecord | undefined;
        if (!cur) { reject(new Error("record not found")); return; }
        const next: SavedRecord = { ...cur, ...patch, id: cur.id };
        const putReq = os.put(next);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }


