import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllRecords } from "../features/records/records.repo";
import { type SavedRecord } from "../features/records/types";
import { Container } from "../components/Container";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import styled from "@emotion/styled";

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

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-weight: 600;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tr = styled.tr`
  &:nth-of-type(even) {
    background: ${({ theme }) => theme.colors.bg};
  }
`;

const FooterTd = styled.td`
  padding: 12px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.surface};
  border-top: 2px solid ${({ theme }) => theme.colors.border};
`;

const ErrorBox = styled.div`
  color: ${({ theme }) => theme.colors.error};
`;

/* ============= types ============= */
type PartySummary = {
  party: string;
  payTotal: number;
  recvTotal: number;
  balance: number;
  count: number;
};

/* ============= component ============= */
const RecordsPage: React.FC = () => {
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
  }, [])

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
    return Array.from(map.values()).map((x) => ({
      ...x,
      balance: x.recvTotal - x.payTotal,
    })).sort((a, b) => b.balance - a.balance || a.party.localeCompare(b.party, "ko"));
  }, [rows]);

  const openParty = (party: string) => {
    navigate(`/parties/${toPartyPath(party)}`);
  };

  return (
    <Container>
      <Card>
        <Title>거래처별 요약</Title>
        {loading && <div>불러오는 중…</div>}
        {error && <ErrorBox>{error}</ErrorBox>}
        {!loading && !error && (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th style={{ textAlign: "center" }}>거래처</Th>
                  <Th style={{ textAlign: "center" }}>지급합계</Th>
                  <Th style={{ textAlign: "center" }}>입금합계</Th>
                  <Th style={{ textAlign: "center" }}>잔액</Th>
                  <Th style={{ textAlign: "center" }}>자세히</Th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <Tr key={row.party}>
                    <Td>{row.party}</Td>
                    <Td style={{ textAlign: "right" }}>{formatKRW(row.payTotal)}</Td>
                    <Td style={{ textAlign: "right" }}>{formatKRW(row.recvTotal)}</Td>
                    <Td style={{ textAlign: "right" }}>{formatKRW(row.balance)}</Td>
                    <Td style={{ textAlign: "center" }}>
                      <Button
                        variant="secondary"
                        onClick={() => openParty(row.party)}
                        aria-label={`${row.party} 자세히보기`}
                      >
                        자세히보기
                      </Button>
                    </Td>

                  </Tr>
                ))}
                {summary.length === 0 && (
                  <Tr>
                    <Td colSpan={4} style={{ textAlign: "center", color: "#888" }}>
                      표시할 데이터가 없습니다.
                    </Td>
                  </Tr>
                )}
              </tbody>

              {summary.length > 0 && (
                <tfoot>
                  <tr>
                    <FooterTd>총계</FooterTd>
                    <FooterTd style={{ textAlign: "right" }}>
                      {formatKRW(summary.reduce((s, r) => s + r.payTotal, 0))}
                    </FooterTd>
                    <FooterTd style={{ textAlign: "right" }}>
                      {formatKRW(summary.reduce((s, r) => s + r.recvTotal, 0))}
                    </FooterTd>
                    <FooterTd style={{ textAlign: "right" }}>
                      {formatKRW(summary.reduce((s, r) => s + r.balance, 0))}
                    </FooterTd>
                  </tr>
                </tfoot>
              )}
            </Table>
          </TableWrap>
        )}
      </Card>
    </Container>
  );
};

export default RecordsPage;
