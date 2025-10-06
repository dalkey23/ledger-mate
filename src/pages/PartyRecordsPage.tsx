import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRecordsByPartyId } from "@/features/records/records.repo";
import type { SavedRecord } from "@/features/records/types";
import type { PartyId } from "@/types/ids";
import { DataTable, type Column } from "@/components/DataTable";
import { getPartyById } from "@/features/parties/parties.repo";

const PartyRecordsPage: React.FC = () => {
  const { partyId } = useParams<{ partyId: PartyId }>();
  const [rows, setRows] = useState<SavedRecord[]>([]);
  const [partyName, setPartyName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    },
    {
      key: "입금(원)",
      label: "입금(원)",
      width: 140,
      align: "right",
    },
    {
      key: "비고",
      label: "비고",
      width: "20%",
      align: "left",
    },
  ];

  return (
    <div>
      <div>
        <h1>
          거래처 상세
        </h1>
        <p>
          Party ID: {partyName || partyId} · 건수 {rows.length}건
        </p>
      </div>

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
    </div>
  );
};

export default PartyRecordsPage;
