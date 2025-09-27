import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "@emotion/styled";
import { parseWorkbook, type Cell } from "../utils/excel";
import { saveRecords } from "../features/records/records.repo";
import { type SavedRecord } from "../features/records/types";
import PreviewPanel from "../components/PreviewPanel";
import { Container } from "../components/Container";
import { Card } from "../components/Card";

/* ===================== styled ===================== */

const Title = styled.h2`
  margin: 0 0 8px;
  font-size: 28px;
  letter-spacing: -0.01em;
`;

const Subtitle = styled.p`
  margin: 0 0 20px;
  color: ${({ theme }) => theme.colors.subText};
  line-height: 1.6;
`;

const UploadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FileLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  transition: opacity 0.2s ease, transform 0.02s ease;
  &:hover { opacity: 0.95; }
  &:active { transform: translateY(1px); }
`;

const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
`;


/* ===================== helpers ===================== */
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

/* ===================== component ===================== */
const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [aoa, setAoa] = useState<Cell[][] | null>(null);

  const accountOptions = ["우리 101", "우리 626961"];

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await parseWorkbook(f);
      setAoa(data);
    } catch (err) {
      console.error(err);
      alert("엑셀 파싱 중 오류가 발생했습니다.");
    }
    e.currentTarget.value = "";
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

    const dateIdx = findCol(headers, dateKeys);
    const descIdx = findCol(headers, descKeys);
    const outIdx  = findCol(headers, expenseKeys);
    const incIdx  = findCol(headers, incomeKeys);

    const records: SavedRecord[] = [];
    for (let abs = bodyFrom; abs < aoa.length; abs++) {
      if (!selectedChecks[abs]) continue;
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
      navigate("/records");
      setAoa(null);
    } catch (e) {
      console.error(e);
      alert("DB 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <Container>
      <Card>
        <Title>엑셀 파일 업로드</Title>
        <Subtitle>은행 거래내역 파일(.xlsx/.xls)을 업로드해 미리보기에서 선택 저장합니다.</Subtitle>
        <UploadRow>
          <FileLabel>
            파일 선택
            <HiddenFileInput
              type="file"
              accept=".xlsx,.xls"
              onChange={onFileChange}
            />
          </FileLabel>
        </UploadRow>
      </Card>
      {aoa && (
        <div style={{ marginTop: 16 }}>
          <Card>
            <Subtitle>미리보기</Subtitle>
            <PreviewPanel
              aoa={aoa}
              accountOptions={accountOptions}
              onConfirm={handleConfirm}
            />
          </Card>
        </div>
      )}
    </Container>
  );
};

export default UploadPage;
