import React from "react";
import "./UploadExcel.css";

export type Cell = string | number | boolean | Date | null | undefined;

type PreviewModalProps = {
    open: boolean;
    onClose: () => void;
    aoa: Cell[][];
    selectedAccount: string;
    onChangeAccount: (value: string) => void;
    accountOptions: string[];
};

const PreviewModal: React.FC<PreviewModalProps> = ({
    open,
    onClose,
    aoa,
    selectedAccount,
    onChangeAccount,
    accountOptions,
}) => {
    if (!open) return null;

    return (
        <div className="uex-backdrop" role="dialog" aria-modal="true">
            <div className="uex-modal">
                <div className="uex-modal__header">
                    <strong>미리보기</strong>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <label htmlFor="account-select" style={{ fontSize: 14 }}>
                            계좌
                        </label>
                        <select
                            id="account-select"
                            className="uex-select"
                            value={selectedAccount}
                            onChange={(e) => onChangeAccount(e.target.value)}
                        >
                            <option value="" disabled>
                                계좌 선택하기
                            </option>
                            {accountOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button onClick={onClose} className="uex-iconbtn" aria-label="닫기">
                        ✕
                    </button>
                </div>

                <div className="uex-tablewrap">
                    <div>
                        {aoa.map((row, rIdx) => (
                            <div key={rIdx} className="aoa-row">
                                {row.map((cell, cIdx) => (
                                    <div key={cIdx} className="aoa-cell">
                                        {cell === null || cell === undefined ? "" : String(cell)}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="uex-modal__footer">
                    <span>
                        총 {aoa.length} 행
                        {selectedAccount ? ` · 선택 계좌: ${selectedAccount}` : ""}
                    </span>
                    <div>
                        <button onClick={onClose} >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;
