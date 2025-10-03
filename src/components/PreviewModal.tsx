import React, { useEffect, useMemo, useRef, useState } from "react";
import "./UploadExcel.css";

// 🔹 파티 레포 import
import { searchParties, createParty, incrementPartyFreq } from "../features/parties/parties.repo";
import type { Party } from "../features/parties/types";

export type Cell = string | number | boolean | Date | null | undefined;

type Props = {
  open: boolean;
  aoa: Cell[][];
  accountOptions: string[];
  onClose: () => void;
  onConfirm: (payload: {
    startRow: number;
    selectedAccount: string;
    selectedChecks: boolean[];
    parties: string[];
  }) => void;
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const norm = (s: unknown) =>
  String(s ?? "").replace(/\s|[().·]|원/g, "").toLowerCase();

const findCol = (headers: any[], keys: string[]) =>
  headers.findIndex((h) => keys.some((k) => norm(h).includes(norm(k))));

const parseNum = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[,\s₩원]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const expenseKeys = ["지급", "출금", "지출"];
const incomeKeys = ["입금", "수입"];
const descKeys = ["기재내용"]; // ✅ “기재내용” 열 탐지용

const normalize = (s: unknown) => String(s ?? "").trim();

const DEFAULT_VISIBLE_KEYS = ["거래일시", "기재내용", "지급", "입금"];

const DEFAULT_HIDE_PATTERNS = [
  /^no\.?/i,
  /적요/i,
  /거래후\s*잔액/i,
  /취급점/i,
  /메모/i,
  /(수표|어음|증권)/i,
];

/** ─────────────────────────────────────────────
 * PartyPicker: DB 검색/추가 가능한 콤보박스
 * ────────────────────────────────────────────*/
const PartyPicker: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [q, setQ] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Party[]>([]);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부 value 변경 반영
  useEffect(() => setQ(value ?? ""), [value]);

  // 바깥 클릭 닫기
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 디바운스 검색
  useEffect(() => {
    let alive = true;
    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchParties(q, 8);
        if (!alive) return;
        setList(res);
      } finally {
        if (alive) setLoading(false);
      }
    }, 180);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [q]);

  const hasExactOption = useMemo(
    () => list.some((p) => p.name === q),
    [list, q]
  );

  const commitExisting = async (p: Party) => {
    await incrementPartyFreq(p.id).catch(() => {});
    onChange(p.name);
    setQ(p.name);
    setOpen(false);
  };

  const commitNew = async () => {
    if (!q.trim()) return;
    const created = await createParty(q.trim()).catch(() => undefined);
    if (created) {
      onChange(created.name);
      setQ(created.name);
    } else {
      onChange(q.trim());
    }
    setOpen(false);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = async (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, (list.length || 0) + (hasExactOption ? 0 : 1) - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active < list.length) {
        commitExisting(list[active]);
      } else {
        await commitNew();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        className="uex-input"
        value={q}
        placeholder={placeholder ?? "거래처"}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && (
        <div
          role="listbox"
          className="uex-dropdown"
          style={{
            position: "absolute",
            insetInlineStart: 0,
            top: "calc(100% + 4px)",
            minWidth: 200,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            maxHeight: 280,
            overflowY: "auto",
            zIndex: 20,
          }}
        >
          {loading && (
            <div className="uex-item" style={{ padding: "8px 10px", color: "#6b7280" }}>
              검색 중…
            </div>
          )}

          {!loading && list.map((p, i) => (
            <div
              key={p.id}
              role="option"
              aria-selected={active === i}
              className="uex-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commitExisting(p)}
              onMouseEnter={() => setActive(i)}
              style={{
                padding: "8px 10px",
                background: active === i ? "#f3f4f6" : "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
              title={p.name}
            >
              {p.name}
            </div>
          ))}

          {/* 새 항목 추가 */}
          {!loading && q.trim() && !hasExactOption && (
            <div
              role="option"
              aria-selected={active === list.length}
              className="uex-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitNew}
              onMouseEnter={() => setActive(list.length)}
              style={{
                padding: "8px 10px",
                background: active === list.length ? "#f3f4f6" : "#fff",
                cursor: "pointer",
              }}
            >
              새 거래처 추가: “{q.trim()}”
            </div>
          )}

          {!loading && !q.trim() && list.length === 0 && (
            <div className="uex-item" style={{ padding: "8px 10px", color: "#6b7280" }}>
              최근 항목이 없어요.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** ✅ 거래처 후보 추출 규칙
 *  기본: 첫 토큰 → 토큰 내 괄호 '(' 또는 '（' 앞까지만
 *  (1) 결과가 "주식회사"면 → 기재내용 원문 전체 반환
 *  (2) 결과가 "기업|신한|농협|국민|카카|토뱅|하나"로 시작하면
 *      → 원문에서 해당 접두어(+구분자) 제거 후 다시 첫 토큰(+괄호 컷)
 */
function extractPartyFromMemo(memo: unknown): string {
  const raw = String(memo ?? "").trim();
  if (!raw) return "미확인거래처";

  // 1) 1차: 첫 토큰
  const firstTokenRaw = (raw.split(/\s+/)[0] ?? "").trim();
  let first = firstTokenRaw;

  // 1-1) 토큰 내 괄호 컷
  const cutIdxA = first.indexOf("(");
  const cutIdxB = first.indexOf("（");
  const cutIdx =
    cutIdxA < 0 ? cutIdxB : cutIdxB < 0 ? cutIdxA : Math.min(cutIdxA, cutIdxB);
  if (cutIdx >= 0) first = first.slice(0, cutIdx).trim();

  // (1) "주식회사"면 원문 전체
  if (first === "주식회사") {
    return raw;
  }

  // (2) 은행/플랫폼 접두어 제거 후 다시 계산
  const prefixRe = /^(기업|신한|농협|국민|카카|토뱅|하나|금고)[\s\-_/|·]*/; // 시작부 접두어 + 공백/구분자
  if (prefixRe.test(first)) {
    const stripped = raw.replace(prefixRe, "").trim();
    if (!stripped) return "미확인거래처";

    // 접두어 제거된 원문에서 다시 첫 토큰 추출
    let t = (stripped.split(/\s+/)[0] ?? "").trim();
    const sA = t.indexOf("(");
    const sB = t.indexOf("（");
    const sCut =
      sA < 0 ? sB : sB < 0 ? sA : Math.min(sA, sB);
    if (sCut >= 0) t = t.slice(0, sCut).trim();
    return t || "미확인거래처";
  }

  return first || "미확인거래처";
}

// 이름 정규화 키(완전일치 판단 보조용) - 필요시 사용
const toSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "").replace(/[^\p{Script=Hangul}a-z0-9]/giu, "");

const PreviewModal: React.FC<Props> = ({
  open,
  aoa,
  accountOptions,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  const [startRowStr, setStartRowStr] = useState<string>("4");
  const startRow = useMemo(() => {
    const raw = Number(startRowStr.replace(/[^\d]/g, ""));
    const num = Number.isFinite(raw) && raw > 0 ? raw : 1;
    return clamp(num, 1, Math.max(aoa.length, 1));
  }, [startRowStr, aoa.length]);

  const [selectedAccount, setSelectedAccount] = useState<string>("");

  const [checks, setChecks] = useState<boolean[]>(() =>
    new Array(aoa.length).fill(false)
  );

  const [parties, setParties] = useState<string[]>(
    () => new Array(aoa.length).fill("미확인거래처")
  );

  const headerAbs = clamp(startRow, 1, Math.max(aoa.length, 1)) - 1;
  const headerCells = aoa[headerAbs] ?? [];
  const bodyFromAbs = Math.min(headerAbs + 1, aoa.length);
  const bodyView = useMemo(() => aoa.slice(bodyFromAbs), [aoa, bodyFromAbs]);

  const [visibleCols, setVisibleCols] = useState<boolean[]>([]);
  useEffect(() => {
    const next = headerCells.map((h) => {
      const name = normalize(h);
      const isHide = DEFAULT_HIDE_PATTERNS.some((re) => re.test(name));
      const isShow = DEFAULT_VISIBLE_KEYS.some((k) => name.includes(k));
      if (isHide) return false;
      if (isShow) return true;
      return false;
    });
    setVisibleCols(next);
  }, [headerAbs, headerCells.length]);

  const visibleIdxs = useMemo(
    () => visibleCols.map((v, i) => (v ? i : -1)).filter((i) => i >= 0),
    [visibleCols]
  );

  const allChecked = useMemo(() => {
    if (bodyView.length === 0) return false;
    for (let i = bodyFromAbs; i < aoa.length; i++) if (!checks[i]) return false;
    return true;
  }, [checks, bodyFromAbs, aoa.length, bodyView.length]);

  const toggleRow = (absIdx: number) => {
    setChecks((prev) => {
      const next = [...prev];
      next[absIdx] = !next[absIdx];
      return next;
    });
  };

  const toggleAllInView = (checked: boolean) => {
    setChecks((prev) => {
      const next = [...prev];
      for (let i = bodyFromAbs; i < aoa.length; i++) next[i] = checked;
      return next;
    });
  };

  const expenseIdx = findCol(headerCells, expenseKeys);
  const incomeIdx = findCol(headerCells, incomeKeys);
  const descIdx = findCol(headerCells, descKeys); // ✅ “기재내용” 인덱스
  const insertAfterVisible = (() => {
    const visIncomePos = visibleIdxs.indexOf(incomeIdx);
    if (visIncomePos !== -1) return visIncomePos;
    const visExpensePos = visibleIdxs.indexOf(expenseIdx);
    if (visExpensePos !== -1) return visExpensePos;
    return visibleIdxs.length - 1;
  })();

  // ✅ 초기에 "기재내용"에서 파싱한 거래처를 자동 프리필
  useEffect(() => {
    if (descIdx < 0) return; // 기재내용 열이 없으면 스킵
    setParties((prev) => {
      const next = [...prev];
      for (let rIdx = 0; rIdx < bodyView.length; rIdx++) {
        const absIndex = bodyFromAbs + rIdx;
        const current = next[absIndex];
        // 이미 사용자가 수정한 값은 건드리지 않음
        const isDefault = !current || current === "미확인거래처";
        if (isDefault) {
          const memo = aoa[absIndex]?.[descIdx];
          const candidate = extractPartyFromMemo(memo);
          next[absIndex] = candidate || "미확인거래처";
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descIdx, bodyFromAbs, bodyView.length]); // body 범위가 바뀔 때마다 한 번

  // ✅ 확인 시 DB 없는 거래처를 생성
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      // 선택된 행들에서 거래처 수집
      const picked = new Set<string>();
      for (let i = bodyFromAbs; i < aoa.length; i++) {
        if (!checks[i]) continue;
        const name = (parties[i] ?? "").trim();
        if (!name || name === "미확인거래처") continue;
        picked.add(name);
      }

      // 존재 확인 후 없으면 생성
      for (const name of picked) {
        try {
          const list = await searchParties(name, 5);
          const exact = list.find((p) => p.name === name);
          if (!exact) {
            await createParty(name);
          }
        } catch {
          // 검색/생성 에러는 개별 행에 영향을 최소화(무시하고 진행)
        }
      }

      onConfirm({
        startRow,
        selectedAccount,
        selectedChecks: checks,
        parties,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const [showColPicker, setShowColPicker] = useState(false);
  const setAllCols = (val: boolean) =>
    setVisibleCols(new Array(headerCells.length).fill(val));

  return (
    <div className="uex-backdrop" role="dialog" aria-modal="true">
      <div className="uex-modal">
        <div className="uex-modal__header" style={{ gap: 12, alignItems: "center" }}>
          <strong>미리보기</strong>

          <label style={{ fontSize: 14 }}>시작 행</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={startRowStr}
            onChange={(e) => setStartRowStr(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => {
              if (startRowStr === "") setStartRowStr("1");
            }}
            className="uex-input"
            style={{ width: 96 }}
            placeholder="1"
          />

          <label htmlFor="account-select" style={{ fontSize: 14 }}>계좌</label>
          <select
            id="account-select"
            className="uex-select"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="" disabled>계좌 선택하기</option>
            {accountOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <button
            type="button"
            className="uex-btn uex-btn--secondary"
            onClick={() => setShowColPicker((v) => !v)}
            style={{ marginLeft: "auto" }}
          >
            열 선택
          </button>

          <button onClick={onClose} className="uex-iconbtn" aria-label="닫기">✕</button>
        </div>

        {showColPicker && (
          <div style={{ padding: "8px 16px", borderBottom: "1px solid #f3f4f6", display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="uex-btn uex-btn--secondary" onClick={() => setAllCols(true)}>모두 보이기</button>
              <button className="uex-btn uex-btn--secondary" onClick={() => setAllCols(false)}>모두 숨기기</button>
              <button
                className="uex-btn uex-btn--secondary"
                onClick={() => {
                  const next = headerCells.map((h) => {
                    const name = normalize(h);
                    const isHide = DEFAULT_HIDE_PATTERNS.some((re) => re.test(name));
                    const isShow = DEFAULT_VISIBLE_KEYS.some((k) => name.includes(k));
                    if (isHide) return false;
                    if (isShow) return true;
                    return false;
                  });
                  setVisibleCols(next);
                }}
              >
                기본값 적용
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {headerCells.map((h, i) => (
                <label key={i} className="uex-checklabel" style={{ border: "1px solid #e5e7eb", padding: "4px 8px", borderRadius: 6 }}>
                  <input
                    type="checkbox"
                    checked={!!visibleCols[i]}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setVisibleCols((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      });
                    }}
                  />
                  {String(h ?? "") || `열 ${i + 1}`}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="uex-tablewrap">
          <div
            className="aoa-row"
            style={{ position: "sticky", top: 0, background: "#f9fafb", zIndex: 1, fontWeight: 600 }}
          >
            <div className="aoa-cell" style={{ width: 60 }}>
              <label className="uex-checklabel">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleAllInView(e.target.checked)}
                />
              </label>
            </div>

            {visibleIdxs.map((i, idx) => (
              <React.Fragment key={i}>
                <div className="aoa-cell">
                  {headerCells[i] == null ? "" : String(headerCells[i])}
                </div>
                {idx === insertAfterVisible && <div className="aoa-cell">구분</div>}
                {idx === insertAfterVisible && <div className="aoa-cell">거래처</div>}
              </React.Fragment>
            ))}

            {visibleIdxs.length === 0 && (
              <>
                <div className="aoa-cell">구분</div>
                <div className="aoa-cell">거래처</div>
              </>
            )}
          </div>

          <div>
            {bodyView.map((row, rIdx) => {
              const absIndex = bodyFromAbs + rIdx;

              const out = expenseIdx >= 0 ? parseNum(row[expenseIdx]) : 0;
              const inc = incomeIdx >= 0 ? parseNum(row[incomeIdx]) : 0;
              const kind =
                out > 0 && inc === 0 ? "비용" :
                inc > 0 && out === 0 ? "매출" :
                inc > 0 && out > 0 ? "확인요망" :
                "";

              return (
                <div key={absIndex} className="aoa-row">
                  <div className="aoa-cell" style={{ width: 60 }}>
                    <input
                      type="checkbox"
                      checked={!!checks[absIndex]}
                      onChange={() => toggleRow(absIndex)}
                    />
                  </div>

                  {visibleIdxs.map((i, idx) => (
                    <React.Fragment key={i}>
                      <div className="aoa-cell">
                        {row[i] == null ? "" : String(row[i])}
                      </div>
                      {idx === insertAfterVisible && (
                        <div className="aoa-cell">{kind}</div>
                      )}
                      {idx === insertAfterVisible && (
                        <div className="aoa-cell">
                          <PartyPicker
                            value={parties[absIndex] ?? "미확인거래처"}
                            onChange={(v) => {
                              const nv = v || "미확인거래처";
                              setParties((prev) => {
                                const next = [...prev];
                                next[absIndex] = nv;
                                return next;
                              });
                            }}
                            placeholder="거래처"
                          />
                        </div>
                      )}
                    </React.Fragment>
                  ))}

                  {visibleIdxs.length === 0 && (
                    <>
                      <div className="aoa-cell">{kind}</div>
                      <div className="aoa-cell">
                        <PartyPicker
                          value={parties[absIndex] ?? "미확인거래처"}
                          onChange={(v) => {
                            const nv = v || "미확인거래처";
                            setParties((prev) => {
                              const next = [...prev];
                              next[absIndex] = nv;
                              return next;
                            });
                          }}
                          placeholder="거래처"
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="uex-modal__footer">
          <span>
            총 {aoa.length} 행 · 표시 {bodyView.length} 행
            {selectedAccount ? ` · ${selectedAccount}` : ""}
          </span>
          <div className="uex-actions">
            <button onClick={onClose} className="uex-btn uex-btn--secondary" disabled={submitting}>
              닫기
            </button>
            <button onClick={handleConfirm} className="uex-btn uex-btn--primary" disabled={submitting}>
              {submitting ? "처리 중…" : "확인"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
