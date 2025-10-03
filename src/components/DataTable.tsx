import React from "react";
import styled from "@emotion/styled";


export type Column<T> = {
  key: keyof T | string;
  label: React.ReactNode;
  width?: number | string;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  align?: "left" | "right" | "center";
  titleAccessor?: (value: any, row: T) => string;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T, index: number) => React.Key;
  stickyHeader?: boolean;
  minWidth?: number;
  zebra?: boolean;
};

const TableWrap = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  overflow: auto; /* 가로/세로 스크롤 모두 지원 */
  margin-bottom: 16px;
`;

const Table = styled.table<{ $minWidth?: number }>`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: ${({ $minWidth }) => ($minWidth ? `${$minWidth}px` : "720px")};
`;

const THead = styled.thead<{ $sticky?: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  font-weight: 600;
  font-size: 14px;

  ${({ $sticky }) =>
    $sticky
      ? `
  position: sticky;
  top: 0;
  z-index: 1;
  `
      : ""}
`;

const TR = styled.tr`
  /* nothing */
`;

const baseCell = `
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TH = styled.th<{ $align?: "left" | "right" | "center" }>`
  ${baseCell}
  text-align: ${({ $align }) => $align ?? "left"};
  background: ${({ theme }) => theme.colors.surface};
  --border: ${({ theme }) => theme.colors.border};
  position: relative; /* sticky 대비 */
`;

const TD = styled.td<{ $align?: "left" | "right" | "center" }>`
  ${baseCell}
  text-align: ${({ $align }) => $align ?? "left"};
  --border: ${({ theme }) => theme.colors.border};
`;

const TBody = styled.tbody<{ $zebra?: boolean }>`
  font-size: 14px;

  ${({ $zebra, theme }) =>
    $zebra
      ? `
  tr:nth-of-type(even) td {
    background: ${theme.colors.bg};
  }`
      : `
  td {
    background: ${theme.colors.bg};
  }`}
`;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  stickyHeader = true,
  minWidth = 720,
  zebra = true,
}: DataTableProps<T>) {
  return (
    <TableWrap>
      <Table $minWidth={minWidth}>
        <colgroup>
          {columns.map((c, idx) => {
            const width =
              typeof c.width === "number"
                ? `${c.width}px`
                : typeof c.width === "string"
                ? c.width
                : "auto";
            return <col key={String(c.key) + idx} style={{ width }} />;
          })}
        </colgroup>

        <THead $sticky={stickyHeader}>
          <TR>
            {columns.map((c, idx) => (
              <TH key={String(c.key) + idx} $align={c.align}>
                {c.label}
              </TH>
            ))}
          </TR>
        </THead>

        <TBody $zebra={zebra}>
          {rows.map((row, rIdx) => (
            <TR key={rowKey ? rowKey(row, rIdx) : rIdx}>
              {columns.map((c, cIdx) => {
                const v = (row as any)[c.key as any];
                const content = c.render ? c.render(v, row, rIdx) : v;
                const title =
                  c.titleAccessor ? c.titleAccessor(v, row) : typeof v === "string" ? v : undefined;
                return (
                  <TD key={String(c.key) + cIdx} $align={c.align} title={title}>
                    {content}
                  </TD>
                );
              })}
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrap>
  );
}
