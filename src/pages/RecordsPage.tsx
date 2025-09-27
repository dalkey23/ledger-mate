import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";;
import { getAllRecords } from "../features/records/records.repo";
import { type SavedRecord } from "../features/records/types";

/** 통화 표시 (KRW) */
function formatKRW(n: number) {
  return n.toLocaleString("ko-KR");
}

/** 라우트 파라미터로 쓰기 위해 거래처명을 인코딩 */
function toPartyPath(party: string) {
  return encodeURIComponent(party || "(미지정)");
}

/** 공백/미지정 거래처를 통합 표기 */
function normalizeParty(party?: string) {
  const name = (party ?? "").trim();
  return name.length ? name : "(미지정)";
}

type PartySummary = {
  party: string;
  payTotal: number;   // 지급합계
  recvTotal: number;  // 입금합계
  balance: number;    // 잔액 = 입금 - 지급
  count: number;      // 건수(내부 체크용, 화면에는 안씀)
};

const RecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 1) IndexedDB에서 원본 로드 */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllRecords();
        setRows(data);
      } catch (e) {
        console.error(e);
        setError("데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /** 2) 거래처 기준 그룹화 & 집계 */
  const summary = useMemo<PartySummary[]>(() => {
    const map = new Map<string, PartySummary>();

    for (const r of rows) {
      const party = normalizeParty(r.거래처);
      const pay = Number(r["지급(원)"] || 0);
      const recv = Number(r["입금(원)"] || 0);

      if (!map.has(party)) {
        map.set(party, { party, payTotal: 0, recvTotal: 0, balance: 0, count: 0 });
      }
      const agg = map.get(party)!;
      agg.payTotal += isFinite(pay) ? pay : 0;
      agg.recvTotal += isFinite(recv) ? recv : 0;
      agg.count += 1;
    }

    // 잔액 계산 & 정렬(기본: 잔액 내림차순)
    const list = Array.from(map.values()).map((x) => ({
      ...x,
      balance: x.recvTotal - x.payTotal,
    }));
    list.sort((a, b) => b.balance - a.balance || a.party.localeCompare(b.party, "ko"));
    return list;
  }, [rows]);

  /** 3) 클릭 시 상세 페이지로 전환 */
  const openParty = (party: string) => {
    navigate(`/parties/${toPartyPath(party)}`);
  };

  return (
    <div>
  <h1>거래처별 요약</h1>

  {loading && <div>불러오는 중…</div>}
  {error && <div>{error}</div>}

  {!loading && !error && (
    <div>
      <table>
        <thead>
          <tr>
            <th>거래처</th>
            <th>지급합계</th>
            <th>입금합계</th>
            <th>잔액 / 자세히</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row) => (
            <tr key={row.party}>
              <td>{row.party}</td>
              <td>{formatKRW(row.payTotal)}</td>
              <td>{formatKRW(row.recvTotal)}</td>

              {/* 잔액 옆에 '자세히보기' 버튼 */}
              <td>
                <span>{formatKRW(row.balance)}</span>
                <button
                  type="button"
                  onClick={() => openParty(row.party)}
                  aria-label={`${row.party} 자세히보기`}
                >
                  자세히보기
                </button>
              </td>
            </tr>
          ))}
          {summary.length === 0 && (
            <tr>
              <td colSpan={4}>표시할 데이터가 없습니다.</td>
            </tr>
          )}
        </tbody>

        {summary.length > 0 && (
          <tfoot>
            <tr>
              <td>총계</td>
              <td>{formatKRW(summary.reduce((s, r) => s + r.payTotal, 0))}</td>
              <td>{formatKRW(summary.reduce((s, r) => s + r.recvTotal, 0))}</td>
              <td>{formatKRW(summary.reduce((s, r) => s + r.balance, 0))}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )}
</div>
  );
};

export default RecordsPage;
