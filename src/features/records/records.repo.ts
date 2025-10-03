import { openDB } from "@/db/indexedDb";
import type { SavedRecord } from "./types";

const STORE = "records";

export async function saveRecords(records: SavedRecord[]): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  let cnt = 0;
  await Promise.all(
    records.map(
      (rec) =>
        new Promise<void>((res, rej) => {
          const r = store.add(rec);
          r.onsuccess = () => { cnt++; res(); };
          r.onerror  = () => rej(r.error);
        }),
    ),
  );
  return cnt;
}

export async function getAllRecords(): Promise<SavedRecord[]> {
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  return new Promise((res, rej) => {
    const out: SavedRecord[] = [];
    const cur = store.openCursor();
    cur.onsuccess = () => {
      const c = cur.result;
      if (!c) return res(out);
      out.push(c.value as SavedRecord);
      c.continue();
    };
    cur.onerror = () => rej(cur.error);
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

export async function getRecordsByPartyId(partyId: string) {
  const db = await openDB();
  const idx = db.transaction(STORE, "readonly").objectStore(STORE).index("by_partyId");
  return new Promise<SavedRecord[]>((res, rej) => {
    const out: SavedRecord[] = [];
    const keyRange = IDBKeyRange.only(partyId);
    const req = idx.openCursor(keyRange);
    req.onsuccess = () => {
      const cur = req.result;
      if (!cur) return res(out);
      out.push(cur.value as SavedRecord);
      cur.continue();
    };
    req.onerror = () => rej(req.error);
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
