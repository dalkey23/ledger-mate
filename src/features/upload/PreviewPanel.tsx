import React, { useEffect, useMemo, useRef, useState } from "react";

import { searchParties, createParty, incrementPartyFreq } from "@features/parties/parties.repo";
import type { Party } from "@features/parties/types";
import { Button } from "@components/Button";
import { DataTable, type Column } from "@components/DataTable";
import * as S from "./PreviewPanel.styles";

export type Cell = string | number | boolean | Date | null | undefined;

type Props = {
  aoa: Cell[][];
  accountOptions: string[];
  onConfirm: (payload: {
    startRow: number;
    selectedAccount: string;
    selectedChecks: boolean[];
    parties: string[];
  }) => void;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const norm = (s: unknown) => String(s ?? "").replace(/\s|[().·]|원/g, "").toLowerCase();

const findCol = (headers: any[], keys: string[]) =>
  headers.findIndex((h) => keys.some((k) => norm(h).includes(norm(k))));

const parseNum = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[,\s₩원]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const expenseKeys = ["지급", "출금", "지출"];
const incomeKeys = ["입금", "수입"];
const descKeys = ["기재내용"];

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

  useEffect(() => setQ(value ?? ""), [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

  const hasExactOption = useMemo(() => list.some((p) => p.name === q), [list, q]);

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
        <div role="listbox">
          {loading && <div>검색 중…</div>}

          {!loading &&
            list.map((p, i) => (
              <div
                key={p.id}
                role="option"
                aria-selected={active === i}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitExisting(p)}
                onMouseEnter={() => setActive(i)}
                title={p.name}
              >
                {p.name}
              </div>
            ))}

          {!loading && q.trim() && !hasExactOption && (
            <div
              role="option"
              aria-selected={active === list.length}
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitNew}
              onMouseEnter={() => setActive(list.length)}
            >
              새 거래처 추가: “{q.trim()}”
            </div>
          )}

          {!loading && !q.trim() && list.length === 0 && <div>최근 항목이 없어요.</div>}
        </div>
      )}
    </div>
  );
};

function extractPartyFromMemo(memo: unknown): string {
  const raw = String(memo ?? "").trim();
  if (!raw) return "미확인거래처";

  const firstTokenRaw = (raw.split(/\s+/)[0] ?? "").trim();
  let first = firstTokenRaw;

  const cutIdxA = first.indexOf("(");
  const cutIdxB = first.indexOf("（");
  const cutIdx = cutIdxA < 0 ? cutIdxB : cutIdxB < 0 ? cutIdxA : Math.min(cutIdxA, cutIdxB);
  if (cutIdx >= 0) first = first.slice(0, cutIdx).trim();

  if (first === "주식회사") {
    return raw;
  }

  const prefixRe = /^(기업|신한|농협|국민|카카|토뱅|하나|금고)[\s\-_/|·]*/;
  if (prefixRe.test(first)) {
    const stripped = raw.replace(prefixRe, "").trim();
    if (!stripped) return "미확인거래처";
    let t = (stripped.split(/\s+/)[0] ?? "").trim();
    const sA = t.indexOf("(");
    const sB = t.indexOf("（");
    const sCut = sA < 0 ? sB : sB < 0 ? sA : Math.min(sA, sB);
    if (sCut >= 0) t = t.slice(0, sCut).trim();
    return t || "미확인거래처";
  }

  return first || "미확인거래처";
}

const PreviewPanel: React.FC<Props> = ({ aoa, accountOptions, onConfirm }) => {
  const [startRowStr, setStartRowStr] = useState<string>("4");
  const startRow = useMemo(() => {
    const raw = Number(startRowStr.replace(/[^\d]/g, ""));
    const num = Number.isFinite(raw) && raw > 0 ? raw : 1;
    return clamp(num, 1, Math.max(aoa.length, 1));
  }, [startRowStr, aoa.length]);

  const [selectedAccount, setSelectedAccount] = useState<string>("");

  const [checks, setChecks] = useState<boolean[]>(() => new Array(aoa.length).fill(false));
  const [parties, setParties] = useState<string[]>(() => new Array(aoa.length).fill("미확인거래처"));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const descIdx = findCol(headerCells, descKeys);
  const insertAfterVisible = (() => {
    const visIncomePos = visibleIdxs.indexOf(incomeIdx);
    if (visIncomePos !== -1) return visIncomePos;
    const visExpensePos = visibleIdxs.indexOf(expenseIdx);
    if (visExpensePos !== -1) return visExpensePos;
    return visibleIdxs.length - 1;
  })();

  useEffect(() => {
    if (descIdx < 0) return;
    setParties((prev) => {
      const next = [...prev];
      for (let rIdx = 0; rIdx < bodyView.length; rIdx++) {
        const absIndex = bodyFromAbs + rIdx;
        const current = next[absIndex];
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
  }, [descIdx, bodyFromAbs, bodyView.length]);

  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const picked = new Set<string>();
      for (let i = bodyFromAbs; i < aoa.length; i++) {
        if (!checks[i]) continue;
        const name = (parties[i] ?? "").trim();
        if (!name || name === "미확인거래처") continue;
        picked.add(name);
      }

      // 존재하지 않는 거래처 자동 생성
      for (const name of picked) {
        try {
          const list = await searchParties(name, 5);
          const exact = list.find((p) => p.name === name);
          if (!exact) await createParty(name);
        } catch {
          // ignore
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
  const setAllCols = (val: boolean) => setVisibleCols(new Array(headerCells.length).fill(val));

  // ===== DataTable 컬럼/행 구성 =====
  const isMoneyCol = (colAbsIdx: number) => colAbsIdx === expenseIdx || colAbsIdx === incomeIdx;

  const columns: Column<Record<string, any>>[] = useMemo(() => {
    const cols: Column<Record<string, any>>[] = [];

    // 선택 체크박스
    cols.push({
      key: "__select__",
      label: (
        <label>
          <input type="checkbox" checked={allChecked} onChange={(e) => toggleAllInView(e.target.checked)} />
        </label>
      ),
      width: 48,
      align: "center",
      render: () => null, // 개별 로우 렌더에서 처리
    });

    // 가시 열
    visibleIdxs.forEach((absIdx, visIdx) => {
      const label = headerCells[absIdx] == null ? "" : String(headerCells[absIdx]);
      cols.push({
        key: `col_${absIdx}`,
        label,
        width: isMoneyCol(absIdx) ? 140 : absIdx === descIdx ? "1fr" : 160,
        align: isMoneyCol(absIdx) ? "right" : "left",
        titleAccessor: (v: any) => (typeof v === "string" ? v : String(v ?? "")),
      });

      // 지정 위치 뒤에 '구분', '거래처'
      if (visIdx === insertAfterVisible) {
        cols.push({ key: "__kind__", label: "구분", width: 100, align: "center" });
        cols.push({ key: "__party__", label: "거래처", width: 220 });
      }
    });

    // 보이는 열이 없을 때도 '구분' + '거래처'는 표기
    if (visibleIdxs.length === 0) {
      cols.push({ key: "__kind__", label: "구분", width: 100, align: "center" });
      cols.push({ key: "__party__", label: "거래처", width: 220 });
    }

    return cols;

  }, [allChecked, headerCells, visibleIdxs, insertAfterVisible, expenseIdx, incomeIdx, descIdx]);

  const tableRows = useMemo(() => {
    return bodyView.map((row, rIdx) => {
      const absIndex = bodyFromAbs + rIdx;
      const out = expenseIdx >= 0 ? parseNum(row[expenseIdx]) : 0;
      const inc = incomeIdx >= 0 ? parseNum(row[incomeIdx]) : 0;
      const kind =
        out > 0 && inc === 0 ? "비용" : inc > 0 && out === 0 ? "매출" : inc > 0 && out > 0 ? "확인요망" : "";

      const obj: Record<string, any> = {
        __abs__: absIndex,
        __kind__: kind,
        __party__: parties[absIndex] ?? "미확인거래처",
      };

      visibleIdxs.forEach((absIdx) => {
        const raw = row[absIdx];
        obj[`col_${absIdx}`] = isMoneyCol(absIdx)
          ? Number(parseNum(raw)).toLocaleString("ko-KR")
          : raw == null
          ? ""
          : String(raw);
      });

      return obj;
    });

  }, [bodyView, bodyFromAbs, expenseIdx, incomeIdx, visibleIdxs, parties]);

  return (
    <S.Section>
      <S.HeaderRow>
        <label>시작 행</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={startRowStr}
          onChange={(e) => setStartRowStr(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={() => {
            if (startRowStr === "") setStartRowStr("1");
          }}
          placeholder="1"
        />
        <label htmlFor="account-select">계좌</label>
        <select id="account-select" value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
          <option value="" disabled>
            계좌 선택하기
          </option>
          {accountOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <Button variant="secondary" onClick={() => setShowColPicker((v) => !v)}>
          열 선택
        </Button>
      </S.HeaderRow>

      {showColPicker && (
        <S.ColPicker>
          <div>
            <Button onClick={() => setAllCols(true)}>모두 보이기</Button>
            <Button onClick={() => setAllCols(false)}>모두 숨기기</Button>
            <Button
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
            </Button>
          </div>
          <div>
            {headerCells.map((h, i) => (
              <label key={i}>
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
        </S.ColPicker>
      )}

      {/* 실제 테이블 렌더링 */}
      <DataTable<Record<string, any>>
        columns={columns.map((c) => {
          if (c.key === "__select__") {
            return {
              ...c,
              render: (_v, row) => {
                const absIndex = row.__abs__ as number;
                return <input type="checkbox" checked={!!checks[absIndex]} onChange={() => toggleRow(absIndex)} />;
              },
            };
          }
          if (c.key === "__party__") {
            return {
              ...c,
              render: (_v, row) => {
                const absIndex = row.__abs__ as number;
                return (
                  <PartyPicker
                    value={parties[absIndex] ?? "ми확인거래처".replace("ми", "미")}
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
                );
              },
            };
          }
          return c;
        })}
        rows={tableRows}
        rowKey={(r) => r.__abs__}
        stickyHeader
        minWidth={Math.max(880, 160 * Math.max(visibleIdxs.length, 2) + 48)}
        zebra={false}
      />

      <S.Footer>
        <span>
          총 {aoa.length} 행 · 표시 {bodyView.length} 행
          {selectedAccount ? ` · ${selectedAccount}` : ""}
        </span>
        <Button variant="primary" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "처리 중…" : "저장하기"}
        </Button>
      </S.Footer>
    </S.Section>
  );
};

export default PreviewPanel;
