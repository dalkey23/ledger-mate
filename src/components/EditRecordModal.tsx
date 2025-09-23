import React, { useEffect, useState } from "react";
import "./UploadExcel.css"; // 모달 스타일 재사용
import { getRecordById, updateRecord, type SavedRecord } from "../db/indexedDb";
import { useNavigate, useParams } from "react-router-dom";

const EditRecordModal: React.FC = () => {
  const { id } = useParams(); // /records/:id
  const rid = Number(id);
  const nav = useNavigate();

  const [data, setData] = useState<SavedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const rec = await getRecordById(rid);
        if (alive) {
          if (!rec) setErr("해당 레코드를 찾을 수 없습니다.");
          setData(rec ?? null);
        }
      } catch (e) {
        console.error(e);
        if (alive) setErr("불러오기 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [rid]);

  const close = () => nav(-1); // background 복귀

  const onSave = async () => {
    if (!data?.id) return;
    try {
      setSaving(true);
      await updateRecord(data.id, {
        거래처: data.거래처,
        비고: data.비고,
        구분: data.구분,
        // 필요 시 다른 필드도 추가
      });
      window.dispatchEvent(new CustomEvent("records:updated"));
      close();
    } catch (e) {
      console.error(e);
      alert("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="uex-backdrop" role="dialog" aria-modal="true" onClick={close}>
      <div className="uex-modal" onClick={(e) => e.stopPropagation()}>
        <div className="uex-modal__header">
          <strong>레코드 편집</strong>
          <button className="uex-iconbtn" aria-label="닫기" onClick={close}>✕</button>
        </div>

        <div className="uex-tablewrap" style={{ padding: 16 }}>
          {loading ? (
            <p>불러오는 중…</p>
          ) : err ? (
            <p style={{ color: "crimson" }}>{err}</p>
          ) : data ? (
            <form className="edit-form" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label>ID</label>
                  <div>{data.id}</div>
                </div>
                <div>
                  <label>계좌</label>
                  <div>{data.계좌 || "-"}</div>
                </div>
                <div>
                  <label>거래일시</label>
                  <div>{data.거래일시}</div>
                </div>
                <div>
                  <label>기재내용</label>
                  <div>{data.기재내용}</div>
                </div>

                <div>
                  <label>구분</label>
                  <select
                    className="uex-select"
                    value={data.구분}
                    onChange={(e) => setData((d) => d ? { ...d, 구분: e.target.value as any } : d)}
                  >
                    <option value="">(없음)</option>
                    <option value="비용">비용</option>
                    <option value="매출">매출</option>
                    <option value="확인요망">확인요망</option>
                  </select>
                </div>

                <div>
                  <label>거래처</label>
                  <input
                    className="uex-input"
                    value={data.거래처}
                    onChange={(e) => setData((d) => d ? { ...d, 거래처: e.target.value } : d)}
                    placeholder="거래처"
                  />
                </div>

                <div>
                  <label>비고</label>
                  <input
                    className="uex-input"
                    value={data.비고}
                    onChange={(e) => setData((d) => d ? { ...d, 비고: e.target.value } : d)}
                    placeholder="메모/비고"
                  />
                </div>
              </div>
            </form>
          ) : null}
        </div>

        <div className="uex-modal__footer">
          <div />
          <div className="uex-actions">
            <button className="uex-btn uex-btn--secondary" onClick={close}>취소</button>
            <button className="uex-btn uex-btn--primary" onClick={onSave} disabled={saving || !data}>
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRecordModal;
