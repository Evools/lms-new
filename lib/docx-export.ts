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
} from "docx";

export interface DocxStudentResult {
  studentName: string;
  hasSubmitted: boolean;
  score: number;
  maxScore: number;
  percent: number;
}

export interface DocxTestStatementData {
  testTitle: string;
  groupName: string;
  subjectName: string;
  specialtyName?: string;
  teacherName?: string;
  academicYear?: string;
  students: DocxStudentResult[];
}

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function getGradeWord(percent: number, hasSubmitted: boolean): string {
  if (!hasSubmitted) return "не сдавал";
  if (percent >= 85) return "5 (отлично)";
  if (percent >= 70) return "4 (хорошо)";
  if (percent >= 50) return "3 (удовл.)";
  return "2 (неуд.)";
}

export async function exportAcademicStatementDocx(data: DocxTestStatementData): Promise<void> {
  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, "0");
  const monthName = MONTHS_GENITIVE[now.getMonth()];
  const yearStr = String(now.getFullYear());

  const specialtyText = data.specialtyName && data.specialtyName.trim()
    ? data.specialtyName
    : "______________________________";
  const teacherText = data.teacherName && data.teacherName.trim()
    ? data.teacherName
    : "______________________________";
  const groupText = data.groupName || "_____________";
  const academicYearText = data.academicYear || `${yearStr}-${Number(yearStr) + 1}`;

  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  };

  const cellMargins = {
    top: 100,
    bottom: 100,
    left: 140,
    right: 140,
  };

  // Header row
  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 700, type: WidthType.DXA },
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "№ п/п", bold: true, size: 20, font: "Times New Roman" }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 4200, type: WidthType.DXA },
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Фамилия, имя, отчество",
                  bold: true,
                  size: 20,
                  font: "Times New Roman",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "№ билета или тест (задание, устный опрос)",
                  bold: true,
                  size: 18,
                  font: "Times New Roman",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          margins: cellMargins,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Оценка", bold: true, size: 20, font: "Times New Roman" }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  // Student rows
  data.students.forEach((student, index) => {
    const gradeText = getGradeWord(student.percent, student.hasSubmitted);

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 700, type: WidthType.DXA },
            margins: cellMargins,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: String(index + 1),
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 4200, type: WidthType.DXA },
            margins: cellMargins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: student.studentName,
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3000, type: WidthType.DXA },
            margins: cellMargins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Тест: ${data.testTitle}`,
                    size: 18,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1800, type: WidthType.DXA },
            margins: cellMargins,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: gradeText,
                    bold: student.hasSubmitted && student.percent >= 50,
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // ~20mm
              bottom: 1134,
              left: 1417, // ~25mm
              right: 850, // ~15mm
            },
          },
        },
        children: [
          // 1. Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: "ВЕДОМОСТЬ",
                bold: true,
                size: 28, // 14pt
                font: "Times New Roman",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "сдачи зачетов по окончании теоретического курса обучения",
                size: 24, // 12pt
                font: "Times New Roman",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `за I-полугодие ${academicYearText} учебного года`,
                size: 24,
                font: "Times New Roman",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `учащихся группы ${groupText}`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
          }),

          // 2. Metadata Block
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Специальность: ", font: "Times New Roman", size: 24 }),
              new TextRun({ text: specialtyText, bold: true, font: "Times New Roman", size: 24 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Предмет: ", font: "Times New Roman", size: 24 }),
              new TextRun({ text: data.subjectName, bold: true, font: "Times New Roman", size: 24 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Ф.И.О.: ", font: "Times New Roman", size: 24 }),
              new TextRun({ text: teacherText, font: "Times New Roman", size: 24 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `Дата сдачи «${dayStr}» ${monthName} ${yearStr}г.`,
                font: "Times New Roman",
                size: 24,
              }),
            ],
          }),

          // 3. Statement Table
          new Table({
            borders: tableBorders,
            width: { size: 9700, type: WidthType.DXA },
            rows: tableRows,
          }),

          // 4. Footer & Signature
          new Paragraph({
            spacing: { before: 300, after: 40 },
            children: [
              new TextRun({
                text: "Преподаватель       ____________________________________________",
                font: "Times New Roman",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 0 },
            indent: { left: 2400 },
            children: [
              new TextRun({
                text: "(Ф.И.О. и подпись)",
                font: "Times New Roman",
                size: 18,
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanTitle = data.testTitle.replace(/[\s\/:*?"<>|]+/g, "_");
  const cleanGroup = data.groupName.replace(/[\s\/:*?"<>|]+/g, "_");
  const filename = `Ведомость_${cleanTitle}_${cleanGroup}.docx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
