import { format } from "date-fns";

type CsvCell = string | number | null | undefined;

export const downloadCsv = (
  filenamePrefix: string,
  headers: string[],
  rows: CsvCell[][]
): void => {
  const escape = (c: CsvCell) =>
    `"${String(c ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((r) => r.map(escape).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
