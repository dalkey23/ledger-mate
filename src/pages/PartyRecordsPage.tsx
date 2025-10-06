import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRecordsByPartyId } from "@/features/records/records.repo";
import type { SavedRecord } from "@/features/records/types";
import type { PartyId } from "@/types/ids";
import { DataTable, type Column } from "@/components/DataTable";
import { getPartyById } from "@/features/parties/parties.repo";
import Modal from "@/components/Modal";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@components/Container";
import styled from "@emotion/styled";

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

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR");
}

const PartyRecordsPage: React.FC = () => {
  const { partyId } = useParams<{ partyId: PartyId }>();
  const [rows, setRows] = useState<SavedRecord[]>([]);
  const [partyName, setPartyName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  useEffect(() => {
    if (!partyId) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [pParty, pRecords] = await Promise.allSettled([
          getPartyById(partyId as PartyId),
          getRecordsByPartyId(partyId as PartyId),
        ]);

        if (!alive) return;

        if (pRecords.status === "fulfilled") {
          setRows(pRecords.value);
        } else {
          console.error(pRecords.reason);
          setError("거래처 데이터를 불러오지 못했습니다.");
        }

        if (pParty.status === "fulfilled") {
          const p = pParty.value;
          setPartyName(p?.name ?? (p as any)?.name ?? String(partyId));
        } else {
          setPartyName(String(partyId));
        }
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setError("거래처 데이터를 불러오지 못했습니다.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [partyId]);


  const columns: Column<SavedRecord>[] = [
    {
      key: "거래일시",
      label: "거래일시",
      width: 180,
      align: "left",
    },
    {
      key: "기재내용",
      label: "기재내용",
      width: "40%",
      align: "left",
    },
    {
      key: "지급(원)",
      label: "지급(원)",
      width: 140,
      align: "right",
      render: (v) => formatKRW(Number(v || 0)),
    },
    {
      key: "입금(원)",
      label: "입금(원)",
      width: 140,
      align: "right",
      render: (v) => formatKRW(Number(v || 0)),
    },
    {
      key: "비고",
      label: "비고",
      width: "20%",
      align: "left",
    },
  ];

  return (
    <Container>
      <Card>
        <HeaderRow>
        <Title>
          거래처 상세
        </Title>

        <Button onClick={() => setBulkModalOpen(true)}>
          거래처 수정
        </Button>
      </HeaderRow>
        <p>
          Party ID: {partyName || partyId} · 건수 {rows.length}건
        </p>

      {loading && <div>불러오는 중…</div>}
      {error && <div>{error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div>
          이 거래처에 해당하는 내역이 없습니다.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <DataTable<SavedRecord>
          columns={columns}
          rows={rows}
          rowKey={(r) => String(r.id ?? Math.random())}
          stickyHeader
          minWidth={800}
          zebra
        />
      )}

      <Modal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="거래처 일괄 수정"
      >
        <div className="text-sm text-zinc-600">
          (다음 단계) 체크박스 있는 목록과 거래처 검색 UI를 여기에 넣을 예정입니다.
          <br />
          지금은 모달 띄우기까지만 연결했습니다.
        </div>

        <div>
          <Button>수정</Button>
          <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>
            닫기
          </Button>
        </div>
      </Modal>
      </Card>
    </Container>


  );
};

export default PartyRecordsPage;
