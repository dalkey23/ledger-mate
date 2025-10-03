import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllRecords, deleteAllRecords } from "@features/records/records.repo";
import { type SavedRecord } from "@features/records/types";
import { Container } from "@components/Container";
import { Card } from "@components/Card";
import { Button } from "@components/Button";
import styled from "@emotion/styled";
import { DataTable, type Column } from "@/components/DataTable";
import { getPartiesMap } from "@/features/parties/parties.repo";
import { type PartyId } from "@/types/ids";

/* ============= utils ============= */
function formatKRW(n: number) {
  return n.toLocaleString("ko-KR");
}
function toPartyPath(party: string) {
  return encodeURIComponent(party || "(미지정)");
}
function normalizeParty(party?: string) {
  const name = (party ?? "").trim();
  return name.length ? name : "(미지정)";
}


/* ============= styled ============= */
const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 20px;
  color: ${({ theme }) => theme.colors.text};
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
`;

const ErrorBox = styled.div`
  color: ${({ theme }) => theme.colors.error};
`;


/* ============= types ============= */
type PartySummary = {
  partyId: PartyId;
  displayName: string;
  payTotal: number;
  recvTotal: number;
  balance: number;
  count: number;
};


/* ============= component ============= */
const RecordsByPartyPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const [partiesMap, setPartiesMap] = useState<Map<PartyId, { id: PartyId; name: string }>>(new Map());
  useEffect(() => {
    getPartiesMap().then(setPartiesMap).catch(() => setPartiesMap(new Map()));
  }, []);

  const summary = useMemo<PartySummary[]>(() => {
    const map = new Map<string, PartySummary>();
    for (const r of rows) {
      const key = r.partyId ?? "__none__";
      const pay = Number(r["지급(원)"] || 0);
      const recv = Number(r["입금(원)"] || 0);
      const displayName =
        (r.partyId && partiesMap.get(r.partyId)?.name) ||
        (r.거래처?.trim() || "(미지정)");

      const curr = map.get(key) ?? {
        partyId: r.partyId ?? null,
        displayName,
        payTotal: 0,
        recvTotal: 0,
        balance: 0,
        count: 0,
      };
      curr.payTotal += Number.isFinite(pay) ? pay : 0;
      curr.recvTotal += Number.isFinite(recv) ? recv : 0;
      curr.count += 1;
      map.set(key, curr);
    }
    return Array.from(map.values())
      .map((x) => ({ ...x, balance: x.recvTotal - x.payTotal }))
      .sort((a, b) => b.balance - a.balance || a.displayName.localeCompare(b.displayName, "ko"));
  }, [rows, partiesMap]);


  const openParty = (partyId: PartyId | null) => {
    if (!partyId) return;
    navigate(`/records/parties/${partyId}`);
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllRecords();
      navigate("/");
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  /* ===== DataTable 구성 ===== */
  type Row = PartySummary;

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "displayName", label: "거래처", width: "1fr" },
      {
        key: "payTotal",
        label: "지급합계",
        width: 160,
        align: "right",
        render: (v) => formatKRW(Number(v || 0)),
      },
      {
        key: "recvTotal",
        label: "입금합계",
        width: 160,
        align: "right",
        render: (v) => formatKRW(Number(v || 0)),
      },
      {
        key: "balance",
        label: "잔액",
        width: 160,
        align: "right",
        render: (v) => formatKRW(Number(v || 0)),
      },
      {
        key: "__detail__",
        label: "자세히",
        width: 120,
        align: "center",
        render: (_v, row) => (
          <Button
            variant="secondary"
            onClick={() => openParty(row.partyId)}
          >
            자세히보기
          </Button>
        ),
      },
    ],
    []
  );

  const tableRows: Row[] = summary;

  return (
    <Container>
      <Card>
        <HeaderRow>
          <Title>거래처별 요약</Title>
          <Button onClick={handleDeleteAll}>전체 삭제</Button>
        </HeaderRow>

        {loading && <div>불러오는 중…</div>}
        {error && <ErrorBox>{error}</ErrorBox>}

        {!loading && !error && summary.length === 0 && (
          <Card>
            <div style={{ textAlign: "center", color: "#888", padding: 24 }}>
              표시할 데이터가 없습니다.
            </div>
          </Card>
        )}

        {!loading && !error && summary.length > 0 && (
          <DataTable<Row>
            columns={columns}
            rows={tableRows}
            rowKey={(r) => r.partyId}
            stickyHeader
            minWidth={800}
            zebra
          />
        )}
      </Card>
    </Container>
  );
};

export default RecordsByPartyPage;
