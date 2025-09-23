import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getRecordById, type SavedRecord } from "../db/indexedDb";

const RecordDetailPage: React.FC = () => {
  const { id } = useParams();
  const rid = Number(id);
  const [data, setData] = useState<SavedRecord | null>(null);

  useEffect(() => {
    (async () => {
      const rec = await getRecordById(rid);
      setData(rec ?? null);
    })();
  }, [rid]);

  if (!data) return <div style={{ padding: 16 }}>데이터가 없습니다.</div>;

  return (
    <div style={{ padding: 16, display: "grid", gap: 8 }}>
      <h2 style={{ margin: 0 }}>레코드 상세</h2>
      <div>ID: {data.id}</div>
      <div>계좌: {data.계좌}</div>
      <div>거래일시: {data.거래일시}</div>
      <div>기재내용: {data.기재내용}</div>
      <div>지급(원): {data["지급(원)"].toLocaleString()}</div>
      <div>입금(원): {data["입금(원)"].toLocaleString()}</div>
      <div>구분: {data.구분}</div>
      <div>거래처: {data.거래처}</div>
      <div>비고: {data.비고}</div>

      <Link to={-1 as unknown as string}>← 돌아가기</Link>
    </div>
  );
};

export default RecordDetailPage;
