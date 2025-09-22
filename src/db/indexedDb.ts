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


