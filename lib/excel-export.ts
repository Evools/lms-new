import * as XLSX from "xlsx";

export interface ExcelSheetData {
  name: string;
  data: (string | number | boolean | null | undefined)[][];
  colWidths?: number[];
}

/**
 * Calculates adaptive column widths based on cell content length
 */
function calculateColWidths(
  data: (string | number | boolean | null | undefined)[][],
  customWidths?: number[]
): { wch: number }[] {
  if (!data || data.length === 0) return [];

  const maxCols = Math.max(...data.map((row) => (row ? row.length : 0)));
  const widths: number[] = new Array(maxCols).fill(10);

  data.forEach((row) => {
    if (!Array.isArray(row)) return;
    row.forEach((cell, colIdx) => {
      if (cell !== null && cell !== undefined) {
        const text = String(cell);
        // Add extra padding for Cyrillic/wide chars and clarity
        const len = Math.ceil(text.length * 1.1) + 3;
        if (len > widths[colIdx]) {
          widths[colIdx] = Math.min(len, 60); // Cap at 60 characters
        }
      }
    });
  });

  if (customWidths) {
    customWidths.forEach((w, idx) => {
      if (idx < widths.length && w > 0) {
        widths[idx] = w;
      }
    });
  }

  return widths.map((w) => ({ wch: Math.max(w, 10) }));
}

/**
 * Downloads a single sheet as a standard .xlsx workbook
 */
export function exportToExcel(
  data: (string | number | boolean | null | undefined)[][],
  filename: string,
  sheetName: string = "Данные",
  customColWidths?: number[]
): void {
  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  const sanitizedSheetName = sheetName.replace(/[:\\/?*\[\]]/g, "_").slice(0, 31) || "Данные";

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = calculateColWidths(data, customColWidths);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizedSheetName);

  try {
    XLSX.writeFile(wb, cleanFilename, { bookType: "xlsx" });
  } catch {
    // Fallback using Blob & ObjectURL
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Downloads multiple sheets in a single .xlsx workbook
 */
export function exportMultiSheetExcel(
  sheets: ExcelSheetData[],
  filename: string
): void {
  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet, idx) => {
    const ws = XLSX.utils.aoa_to_sheet(sheet.data);
    ws["!cols"] = calculateColWidths(sheet.data, sheet.colWidths);
    const safeName = (sheet.name || `Лист ${idx + 1}`)
      .replace(/[:\\/?*\[\]]/g, "_")
      .slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  try {
    XLSX.writeFile(wb, cleanFilename, { bookType: "xlsx" });
  } catch {
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
