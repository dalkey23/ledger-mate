import React, { useState } from 'react';
import { parseWorkbook, type Cell } from '../utils/excel';
import PreviewModal from './PreviewModal';
import "./UploadExcel.css";

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
  const handleConfirm = (payload: { startRow: number; selectedAccount: string; selectedChecks: boolean[]; }) => {
    const { startRow, selectedAccount, selectedChecks } = payload;
    console.log("확정:", { startRow, selectedAccount, selectedIndices: selectedChecks.map((v, i) => v ? i : null).filter(v => v !== null) });
    setOpen(false);
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