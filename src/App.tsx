import React, { useEffect, useState } from "react";
import "./App.css";
import UploadExcel from "./components/UploadExcel";
import { getAllRecords, deleteAllRecords, type SavedRecord } from "./db/indexedDb";

function App() {
  const [rows, setRows] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllRecords();
      const sorted = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      setRows(sorted);
    } catch (e) {
      console.error(e);
      setError("저장된 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("정말 전체 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      setLoading(true);
      await deleteAllRecords();
      await load();
    } catch (e) {
      console.error(e);
      alert("전체 삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="app">

     
      <UploadExcel />

      <section className="app__placeholder" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>저장된 내역</h2>
          <button onClick={load} disabled={loading}>
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
          <button onClick={handleDeleteAll} disabled={loading || rows.length === 0}>
              전체삭제
            </button>
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {rows.length === 0 ? (
          <p>저장된 데이터가 없습니다.</p>
        ) : (
          <div>
            <table>
            <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={th}>ID</th>
                  <th style={th}>계좌</th>
                  <th style={th}>거래일시</th>
                  <th style={th}>기재내용</th>
                  <th style={th}>지급(원)</th>
                  <th style={th}>입금(원)</th>
                  <th style={th}>구분</th>
                  <th style={th}>거래처</th>
                  <th style={th}>비고</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id ?? `${r.거래일시}-${r.기재내용}`}>
                    <td style={td}>{r.id}</td>
                    <td style={td}>{r.계좌}</td>
                    <td style={td}>{r.거래일시}</td>
                    <td style={td}>{r.기재내용}</td>
                    <td style={td} align="right">{r["지급(원)"].toLocaleString()}</td>
                    <td style={td} align="right">{r["입금(원)"].toLocaleString()}</td>
                    <td style={td}>{r.구분}</td>
                    <td style={td}>{r.거래처}</td>
                    <td style={td}>{r.비고}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #f5f5f5",
  verticalAlign: "top",
};

export default App;
