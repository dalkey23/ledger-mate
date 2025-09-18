import React, {useState} from 'react';
import { parseWorkbook, type Cell } from '../utils/excel';

const UploadExcel = () :any =>{

  
  const [aoa, setAoa] = useState<Cell[][] | null>(null);

    const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
        e
      ) => {
        const f = e.target.files?.[0];
        if (!f) return;
       try {
      const data = await parseWorkbook(f); 
      setAoa(data);
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
      <div className="aoa-box">
        {aoa ? (
          aoa.map((row, rIdx) => (
            <div key={rIdx} className="aoa-row">
              {row.map((cell, cIdx) => (
                <div key={cIdx} className="aoa-cell">
                  {cell === null || cell === undefined ? "" : String(cell)}
                </div>
              ))}
            </div>
          ))
        ) : (
          <p >엑셀을 업로드하세요</p>
        )}
      </div>
        </div>
    )
}

export default UploadExcel;