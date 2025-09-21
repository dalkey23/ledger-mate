import React, { useState } from 'react';
import { parseWorkbook, type Cell } from '../utils/excel';
import PreviewModal from './PreviewModal';
import "./UploadExcel.css";

const UploadExcel = (): any => {


  const [aoa, setAoa] = useState<Cell[][] | null>(null);
  const [open, setOpen] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<string>("");
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
          onClose={() => setOpen(false)}
          aoa={aoa}
          selectedAccount={selectedAccount}
          onChangeAccount={setSelectedAccount}
          accountOptions={accountOptions}
        />
      )}
    </div>
  )
}

export default UploadExcel;