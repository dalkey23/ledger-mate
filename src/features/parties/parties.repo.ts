// features/parties/parties.repo.ts
import { openDB } from "../../db/indexedDb";
import type { Party } from "./types";
import type { PartyId } from "../../types/ids";
import { makePartyId } from "../../utils/id";

const STORE = "parties";

/** 간단 정규화: 공백/특수문자/통화기호/점 등 제거 + 소문자.
 *  '(주)'/㈜/주식회사 제거 규칙 포함. 필요시 확장하세요.
 */
export function normalizePartyName(s: string): string {
  const base = (s ?? "")
    .toLowerCase()
    .replace(/\s|[().·,/_\-|]|[₩$€¥]|원/g, ""); // 불필요 문자 제거
  return base
    .replace(/주식회사|㈜|\(주\)/g, "") // 법인 접두사 제거
    .replace(/\s+/g, "")
    .trim();
}

/** ID로 단건 조회 */
export async function getPartyById(id: PartyId): Promise<Party | null> {
  const db = await openDB();
  return new Promise<Party | null>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const os = tx.objectStore(STORE);
      const req = os.get(id);
      req.onsuccess = () => resolve((req.result as Party) ?? null);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

/** nameNorm 인덱스로 단건 조회 (인덱스는 고유) */
export async function getPartyByNameNorm(nameNorm: string): Promise<Party | null> {
  const key = (nameNorm ?? "").trim();
  if (!key) return null;

  const db = await openDB();
  return new Promise<Party | null>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const os = tx.objectStore(STORE);
      const idx = os.index("by_nameNorm");
      const req = idx.get(key);
      req.onsuccess = () => resolve((req.result as Party) ?? null);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

/** 새 거래처 생성 (nameNorm 고유 인덱스로 중복 방지) */
export async function createParty(
  name: string,
  extras?: Partial<Omit<Party, "id" | "name" | "nameNorm" | "createdAt" | "updatedAt" | "freq">>
): Promise<Party> {
  const db = await openDB();
  const nameTrim = (name ?? "").trim();
  if (!nameTrim) throw new Error("createParty: name이 비어있습니다.");

  const nameNorm = normalizePartyName(nameTrim);

  // 중복 체크 (unique index 기준)
  const dup = await getPartyByNameNorm(nameNorm);
  if (dup) return dup;

  const now = Date.now();
  const party: Party = {
    id: makePartyId(),          // ✅ "p_…" 문자열 ID
    name: nameTrim,
    nameNorm,
    aliases: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    freq: 0,
    ...(extras ?? {}),
  };

  await new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      const os = tx.objectStore(STORE);
      const addReq = os.add(party);
      addReq.onsuccess = () => resolve();
      addReq.onerror = () => reject(addReq.error);
    } catch (e) {
      reject(e);
    }
  });

  return party;
}

/** 사용 빈도 증가 (자동완성/추천 가중치) */
export async function incrementPartyFreq(id: PartyId, delta = 1): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      const os = tx.objectStore(STORE);
      const getReq = os.get(id);
      getReq.onsuccess = () => {
        const cur = getReq.result as Party | undefined;
        if (!cur) return resolve();
        const next: Party = {
          ...cur,
          freq: (cur.freq ?? 0) + delta,
          updatedAt: Date.now(),
        };
        const putReq = os.put(next);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    } catch (e) {
      reject(e);
    }
  });
}

/** 간단 검색: prefix 우선 → 포함, 그 뒤 freq desc → createdAt desc */
export async function searchParties(query: string, limit = 8): Promise<Party[]> {
  const db = await openDB();
  const qn = normalizePartyName(query);
  const out: Party[] = [];

  // by_nameNorm 인덱스 커서로 전수 스캔(수천 건까지는 충분)
  await new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const os = tx.objectStore(STORE);
      const idx = os.index("by_nameNorm");
      const req = idx.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve();
        const p = cursor.value as Party;
        if (!qn) {
          out.push(p);
        } else {
          const n = p.nameNorm;
          const starts = n.startsWith(qn);
          const includes = !starts && n.includes(qn);
          if (starts || includes) out.push(p);
        }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });

  const hasQuery = qn.length > 0;

  if (!hasQuery) {
    // 질의 비어있을 때: freq 상위부터
    return out.sort((a, b) => (b.freq ?? 0) - (a.freq ?? 0)).slice(0, limit);
  }

  // 질의 있을 때: prefix 우선 → 포함 → freq desc → createdAt desc
  return out
    .map((p) => ({
      p,
      score: p.nameNorm.startsWith(qn) ? 0 : p.nameNorm.includes(qn) ? 1 : 2,
    }))
    .filter((x) => x.score < 2)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if ((b.p.freq ?? 0) !== (a.p.freq ?? 0)) return (b.p.freq ?? 0) - (a.p.freq ?? 0);
      return (b.p.createdAt ?? 0) - (a.p.createdAt ?? 0);
    })
    .slice(0, limit)
    .map((x) => x.p);
}
