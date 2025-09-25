import { openDB } from "../../db/indexedDb";
import type { Party } from "./types";

const STORE = "parties";

// 간단 정규화: 공백/특수문자/통화기호/점 등 제거 + 소문자.
// (주)/㈜/주식회사 제거 규칙 포함. 필요시 확장하세요.
export function normalizePartyName(s: string): string {
  const base = (s ?? "")
    .toLowerCase()
    .replace(/\s|[().·,/_\-|]|[₩₩$€¥]|원/g, "");
  return base
    .replace(/주식회사|㈜|\(주\)/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export async function getPartyByNameNorm(nameNorm: string): Promise<Party | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const os = tx.objectStore(STORE);
    const idx = os.index("by_nameNorm");
    const req = idx.get(nameNorm);
    req.onsuccess = () => resolve(req.result as Party | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function createParty(name: string, extras?: Partial<Omit<Party, "id" | "name" | "nameNorm" | "createdAt" | "updatedAt" | "freq">>): Promise<Party> {
  const db = await openDB();
  const nameNorm = normalizePartyName(name);
  const now = Date.now();
  const party: Party = {
    id: crypto.randomUUID(),
    name,
    nameNorm,
    aliases: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    freq: 0,
    ...(extras ?? {}),
  };

  // 중복 체크 (unique index 기준)
  const dup = await getPartyByNameNorm(nameNorm);
  if (dup) return dup;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const os = tx.objectStore(STORE);
    const addReq = os.add(party);
    addReq.onsuccess = () => resolve(party);
    addReq.onerror = () => reject(addReq.error);
  });
}

export async function incrementPartyFreq(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const os = tx.objectStore(STORE);
    const getReq = os.get(id);
    getReq.onsuccess = () => {
      const cur = getReq.result as Party | undefined;
      if (!cur) { resolve(); return; }
      const next: Party = { ...cur, freq: (cur.freq ?? 0) + 1, updatedAt: Date.now() };
      const putReq = os.put(next);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// 간단 검색: prefix 우선 > 포함, freq 내림차순 가중치.
// 대용량이면 서버/전처리 캐시 고려.
export async function searchParties(query: string, limit = 8): Promise<Party[]> {
  const db = await openDB();
  const qn = normalizePartyName(query);
  const out: Party[] = [];

  // by_nameNorm 인덱스 커서로 전수 스캔(수천 건까지는 충분)
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const os = tx.objectStore(STORE);
    const idx = os.index("by_nameNorm");
    const req = idx.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve();
      const p = cursor.value as Party;
      const n = p.nameNorm;
      if (!qn) {
        out.push(p);
      } else {
        const starts = n.startsWith(qn);
        const includes = !starts && n.includes(qn);
        if (starts || includes) out.push(p);
      }
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });

  // 정렬: prefix(0) < includes(1) → freq desc → createdAt desc
  const qnNonEmpty = qn.length > 0;
  const scored = out
    .map((p) => {
      const starts = qnNonEmpty && p.nameNorm.startsWith(qn);
      const includes = qnNonEmpty && !starts && p.nameNorm.includes(qn);
      const score = qnNonEmpty ? (starts ? 0 : includes ? 1 : 2) : 1;
      return { p, score };
    })
    .filter((x) => x.score < 2)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if ((b.p.freq ?? 0) !== (a.p.freq ?? 0)) return (b.p.freq ?? 0) - (a.p.freq ?? 0);
      return (b.p.createdAt ?? 0) - (a.p.createdAt ?? 0);
    })
    .slice(0, limit)
    .map((x) => x.p);

  // query 비어있을 때는 freq 상위부터
  if (!qnNonEmpty) {
    return out
      .sort((a, b) => (b.freq ?? 0) - (a.freq ?? 0))
      .slice(0, limit);
  }
  return scored;
}
