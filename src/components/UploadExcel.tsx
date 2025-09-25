import React, { useState } from 'react';
import { parseWorkbook, type Cell } from '../utils/excel';
import { saveRecords  } from "../features/records/records.repo";
import { type SavedRecord } from "../features/records/types"
import PreviewModal from './PreviewModal';
import "./UploadExcel.css";

const norm = (s: unknown) => String(s ?? "").replace(/\s|[().·]|원/g, "").toLowerCase();
const parseNum = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[,\s₩원]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const findCol = (headers: any[], keys: string[]) =>
  headers.findIndex((h) => keys.some((k) => norm(h).includes(norm(k))));
const dateKeys = ["거래일시", "거래일자", "일시", "거래시간"];
const descKeys = ["기재내용", "내용"];
const expenseKeys = ["지급", "출금", "지출"];
const incomeKeys = ["입금", "수입"];

const UploadExcel: React.FC = () => {

  const [aoa, setAoa] = useState<Cell[][] | null>(null);
  const [open, setOpen] = useState(false);

  const accountOptions = [
    "우리 101",
    "우리 626961"
  ];

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await parseWorkbook(f);
      setAoa(data);
      setOpen(true);
    } catch (err) {
      console.error(err);
      alert("엑셀 파싱 중 오류가 발생했습니다.");
    }
    e.currentTarget.value = '';
  };
  const handleConfirm = async (payload: {
    startRow: number;             // 1-based
    selectedAccount: string;
    selectedChecks: boolean[];    // aoa 전체 길이 기준
    parties: string[];            // aoa 전체 길이 기준
  }) => {
    if (!aoa) return;
    const { startRow, selectedAccount, selectedChecks, parties } = payload;

    const headerIdx = Math.max(1, startRow) - 1;
    const headers = aoa[headerIdx] ?? [];
    const bodyFrom = headerIdx + 1;

    // 필요한 열 인덱스 찾기
    const dateIdx = findCol(headers, dateKeys);
    const descIdx = findCol(headers, descKeys);
    const outIdx  = findCol(headers, expenseKeys);
    const incIdx  = findCol(headers, incomeKeys);

    // 선택된 행만 레코드로 변환
    const records: SavedRecord[] = [];
    for (let abs = bodyFrom; abs < aoa.length; abs++) {
      if (!selectedChecks[abs]) continue; // 미선택은 스킵
      const row = aoa[abs] ?? [];

      const out = outIdx >= 0 ? parseNum(row[outIdx]) : 0;
      const inc = incIdx >= 0 ? parseNum(row[incIdx]) : 0;

      const kind =
        out > 0 && inc === 0 ? "비용" :
        inc > 0 && out === 0 ? "매출" :
        inc > 0 && out > 0   ? "확인요망" :
        "" as const;

      records.push({
        계좌: selectedAccount || "",
        거래일시: String(dateIdx >= 0 ? row[dateIdx] ?? "" : ""),
        기재내용: String(descIdx >= 0 ? row[descIdx] ?? "" : ""),
        "지급(원)": out,
        "입금(원)": inc,
        구분: kind,
        거래처: (parties[abs] ?? "미확인거래처") || "미확인거래처",
        비고: "",
      });
    }

    if (records.length === 0) {
      alert("선택된 행이 없습니다.");
      return;
    }

    try {
      const saved = await saveRecords(records);
      alert(`${saved}건 저장 완료`);
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert("DB 저장 중 오류가 발생했습니다.");
    }
  };


  return (
    <div>
      <h2>엑셀 파일 업로드</h2>
      <div>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onFileChange}
        />
      </div>
      {aoa && (
        <PreviewModal
          open={open}
          aoa={aoa}
          accountOptions={accountOptions}
          onClose={() => setOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}

export default UploadExcel;