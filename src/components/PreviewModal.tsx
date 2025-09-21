import React, { useEffect, useMemo, useState } from "react";
import "./UploadExcel.css";

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
    const insertAfterVisible = (() => {
        const visIncomePos = visibleIdxs.indexOf(incomeIdx);
        if (visIncomePos !== -1) return visIncomePos;
        const visExpensePos = visibleIdxs.indexOf(expenseIdx);
        if (visExpensePos !== -1) return visExpensePos;
        return visibleIdxs.length - 1;
    })();

    const handleConfirm = () => {
        onConfirm({
            startRow,
            selectedAccount,
            selectedChecks: checks,
            parties,
        });
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
                                                    <input
                                                        className="uex-input"
                                                        value={parties[absIndex] ?? "미확인거래처"}
                                                        onChange={(e) => {
                                                            const v = e.target.value || "미확인거래처";
                                                            setParties((prev) => {
                                                                const next = [...prev];
                                                                next[absIndex] = v;
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
                                                <input
                                                    className="uex-input"
                                                    value={parties[absIndex] ?? "미확인거래처"}
                                                    onChange={(e) => {
                                                        const v = e.target.value || "미확인거래처";
                                                        setParties((prev) => {
                                                            const next = [...prev];
                                                            next[absIndex] = v;
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
                        <button onClick={onClose} className="uex-btn uex-btn--secondary">
                            닫기
                        </button>
                        <button onClick={handleConfirm} className="uex-btn uex-btn--primary">
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;
