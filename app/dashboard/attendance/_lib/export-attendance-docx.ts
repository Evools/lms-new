import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";
import { StudentPeriodStatsDTO, AttendancePeriodStatsDTO } from "../actions";

export interface AttendanceDocxOptions {
  groupName: string;
  startDate: string;
  endDate: string;
  periodLabel: string;
  subjectName: string;
  teacherName?: string | null;
  curatorName?: string | null;
  monitorName?: string | null;
  stats: AttendancePeriodStatsDTO;
  students: StudentPeriodStatsDTO[];
}

function formatDateRu(ymdStr: string): string {
  if (!ymdStr) return "—";
  const parts = ymdStr.split("-").map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return ymdStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function exportAttendanceDocx(options: AttendanceDocxOptions): Promise<void> {
  const {
    groupName,
    startDate,
    endDate,
    periodLabel,
    subjectName,
    teacherName,
    curatorName,
    monitorName,
    stats,
    students,
  } = options;

  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  };

  const cellMargins = {
    top: 80,
    bottom: 80,
    left: 100,
    right: 100,
  };

  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 500, type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "№", bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 3600, type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: "Ф.И.О. учащегося", bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 900, type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Всего пар", bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 800, type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Был", bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 1000, type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Н/Б (неув)", bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 900, type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Опоздал", bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 900, type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Уважит.", bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 1000, type: WidthType.DXA },
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "% Посещ.", bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
    ],
  });

  // Student rows
  const studentRows = students.map((st, idx) => {
    return new TableRow({
      children: [
        new TableCell({
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(idx + 1), size: 18, font: "Calibri" })],
            }),
          ],
        }),
        new TableCell({
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({ text: st.studentName, size: 18, font: "Calibri" }),
                ...(st.isMonitor
                  ? [new TextRun({ text: " (староста)", italics: true, size: 16, color: "666666", font: "Calibri" })]
                  : []),
              ],
            }),
          ],
        }),
        new TableCell({
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(st.totalLessons), size: 18, font: "Calibri" })],
            }),
          ],
        }),
        new TableCell({
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(st.presentCount), size: 18, bold: true, font: "Calibri" })],
            }),
          ],
        }),
        new TableCell({
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: String(st.absentCount),
                  size: 18,
                  bold: st.absentCount > 0,
                  color: st.absentCount > 0 ? "B91C1C" : "000000",
                  font: "Calibri",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(st.lateCount), size: 18, font: "Calibri" })],
            }),
          ],
        }),
        new TableCell({
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(st.excusedCount), size: 18, font: "Calibri" })],
            }),
          ],
        }),
        new TableCell({
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `${st.attendanceRate}%`, bold: true, size: 18, font: "Calibri" })],
            }),
          ],
        }),
      ],
    });
  });

  // Footer / Total Row
  const totalRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "ИТОГО ПО ГРУППЕ:", bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(stats.totalLessons), bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(stats.totalPresent), bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(stats.totalAbsent), bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(stats.totalLate), bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(stats.totalExcused), bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: "F3F4F6", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `${stats.groupAttendanceRate}%`, bold: true, size: 18, font: "Calibri" })],
          }),
        ],
      }),
    ],
  });

  const mainTable = new Table({
    width: { size: 9600, type: WidthType.DXA },
    borders: tableBorders,
    rows: [headerRow, ...studentRows, totalRow],
  });

  // Signatures table (2 columns: Master & Vice Director)
  const signaturesTable = new Table({
    width: { size: 9600, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 4800, type: WidthType.DXA },
            margins: { top: 120, bottom: 60, left: 60, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Мастер (куратор) группы:", bold: true, size: 18, font: "Calibri" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: curatorName || "Вопольский В. В.", size: 18, font: "Calibri" }),
                ],
              }),
              new Paragraph({ spacing: { before: 180 }, children: [new TextRun({ text: "____________________", size: 18 })] }),
              new Paragraph({ children: [new TextRun({ text: "(роспись)", italics: true, size: 14, color: "666666" })] }),
            ],
          }),
          new TableCell({
            width: { size: 4800, type: WidthType.DXA },
            margins: { top: 120, bottom: 60, left: 120, right: 60 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Зам. директора по УВР:", bold: true, size: 18, font: "Calibri" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Бейшенова К. Ж.", size: 18, font: "Calibri" }),
                ],
              }),
              new Paragraph({ spacing: { before: 180 }, children: [new TextRun({ text: "____________________", size: 18 })] }),
              new Paragraph({ children: [new TextRun({ text: "(роспись)", italics: true, size: 14, color: "666666" })] }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 500,    // ~9mm compact margin
              bottom: 500,
              left: 570,   // ~10mm
              right: 570,
            },
          },
        },
        children: [
          // Subheader
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ • УЧЕБНАЯ ЧАСТЬ",
                size: 15,
                bold: true,
                color: "555555",
                font: "Calibri",
              }),
            ],
          }),
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 80 },
            children: [
              new TextRun({
                text: "СВОДНАЯ ВЕДОМОСТЬ ПОСЕЩАЕМОСТИ ЗАНЯТИЙ",
                size: 21,
                bold: true,
                font: "Calibri",
              }),
            ],
          }),
          // Group & Subject info
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "Учебная группа: ", font: "Calibri", size: 17 }),
              new TextRun({ text: `Группа ${groupName}`, bold: true, font: "Calibri", size: 17 }),
              new TextRun({ text: "   |   Дисциплина: ", font: "Calibri", size: 17 }),
              new TextRun({ text: subjectName, bold: true, font: "Calibri", size: 17 }),
              ...(teacherName ? [new TextRun({ text: ` (${teacherName})`, font: "Calibri", size: 16, italics: true })] : []),
            ],
          }),
          // Period info
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `Период: ${formatDateRu(startDate)} — ${formatDateRu(endDate)} (${periodLabel})`,
                size: 16,
                color: "444444",
                font: "Calibri",
              }),
            ],
          }),

          // Main Attendance Table
          mainTable,

          // Space before signatures
          new Paragraph({ spacing: { before: 140 } }),

          // Signatures Block
          signaturesTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Ведомость_посещаемости_${groupName}_${startDate}_${endDate}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

