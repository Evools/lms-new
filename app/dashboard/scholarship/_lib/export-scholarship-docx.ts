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
  PageOrientation,
} from "docx";
import { StudentScholarshipRow } from "../_components/types";

interface ExportDocxParams {
  groupName: string;
  monthLabel: string;
  students: StudentScholarshipRow[];
  specialtyName?: string;
  curatorName?: string;
}

export async function exportScholarshipDocx({
  groupName,
  monthLabel,
  students,
  specialtyName,
  curatorName,
}: ExportDocxParams): Promise<void> {
  const solidBorder = {
    top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  };

  const excellentStudents = students.filter((s) => s.status === "EXCELLENT");
  const goodStudents = students.filter((s) => s.status === "GOOD");

  // Table header
  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: solidBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "№ п\\п", bold: true, size: 20, font: "Times New Roman" })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          borders: solidBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Ф.И.О. учащихся", bold: true, size: 20, font: "Times New Roman" })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          borders: solidBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Поименный номер", bold: true, size: 20, font: "Times New Roman" })],
            }),
          ],
        }),
      ],
    }),
  ];

  let counter = 1;

  // Category 1: на «5» (Отличники)
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          borders: solidBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "на «5»", bold: true, size: 20, font: "Times New Roman" })],
            }),
          ],
        }),
      ],
    })
  );

  if (excellentStudents.length === 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: solidBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "—", size: 20, font: "Times New Roman" })],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    excellentStudents.forEach((st) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: solidBorder,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: `${counter}.`, size: 20, font: "Times New Roman" })],
                }),
              ],
            }),
            new TableCell({
              borders: solidBorder,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: st.studentName, size: 20, font: "Times New Roman" })],
                }),
              ],
            }),
            new TableCell({
              borders: solidBorder,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: st.rollNumber || "", size: 20, font: "Times New Roman" })],
                }),
              ],
            }),
          ],
        })
      );
      counter++;
    });
  }

  // Category 2: на «5» и «4» (Ударники)
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          borders: solidBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "на «5» и «4»", bold: true, size: 20, font: "Times New Roman" })],
            }),
          ],
        }),
      ],
    })
  );

  if (goodStudents.length === 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: solidBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "—", size: 20, font: "Times New Roman" })],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    goodStudents.forEach((st) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: solidBorder,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: `${counter}.`, size: 20, font: "Times New Roman" })],
                }),
              ],
            }),
            new TableCell({
              borders: solidBorder,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: st.studentName, size: 20, font: "Times New Roman" })],
                }),
              ],
            }),
            new TableCell({
              borders: solidBorder,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: st.rollNumber || "", size: 20, font: "Times New Roman" })],
                }),
              ],
            }),
          ],
        })
      );
      counter++;
    });
  }

  const professionLine = specialtyName
    ? `«${specialtyName}» за ${monthLabel.toLowerCase()}`
    : `за ${monthLabel.toLowerCase()}`;

  const masterName = curatorName || "Вопольский В.В";

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: [
          // Document Header Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `Список учащихся группы «${groupName}» по профессии`,
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: professionLine,
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
          }),

          // Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),

          // Signatures Footer
          new Paragraph({
            spacing: { before: 800 },
            children: [
              new TextRun({
                text: "Мастер п/о _____________________       ",
                bold: true,
                size: 20,
                font: "Times New Roman",
              }),
              new TextRun({
                text: masterName,
                bold: true,
                size: 20,
                font: "Times New Roman",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Список_стипендии_${groupName}_${monthLabel.replace(/\s+/g, "_")}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
