import React, { useState } from 'react';
import { parseWorkbook, type Cell } from '../utils/excel';
import "./UploadExcel.css";

const UploadExcel = (): any => {


  const [aoa, setAoa] = useState<Cell[][] | null>(null);
  const [open, setOpen] = useState(false);

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
      {open && aoa && (
        <div className="uex-backdrop" role="dialog" aria-modal="true">
          <div className="uex-modal">
            <div className="uex-modal__header">
              <strong>미리보기</strong>
              <button
                onClick={() => setOpen(false)}
                className="uex-iconbtn"
                aria-label="닫기"
              >
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
              <span>총 {aoa.length} 행</span>
              <div className="uex-actions">
                <button
                  onClick={() => setOpen(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadExcel;