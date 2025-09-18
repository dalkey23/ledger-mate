import * as XLSX from "xlsx";

export type Cell = string | number | boolean | Date | null | undefined;


export async function parseWorkbook(file: File): Promise<Cell[][]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];

  const ws = wb.Sheets[firstSheetName];

  const aoa = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  }) as Cell[][];
  return aoa;
}
