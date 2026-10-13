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
  TextDirection,
  VerticalAlign,
} from "docx";
import { StudentScholarshipRow } from "../_components/types";

interface ExportDocxParams {
  groupName: string;
  monthLabel: string;
  selectedMonth?: string;
  students: StudentScholarshipRow[];
  subjects?: string[];
  specialtyName?: string;
  curatorName?: string;
}

function getAcademicYearAndMonthText(monthKeyOrLabel: string): {
  monthName: string;
  academicYear: string;
} {
  let y = new Date().getFullYear();
  let m = new Date().getMonth() + 1;

  if (monthKeyOrLabel && monthKeyOrLabel.includes("-")) {
    const parts = monthKeyOrLabel.split("-");
    y = parseInt(parts[0], 10) || y;
    m = parseInt(parts[1], 10) || m;
  }

  const monthsRu = [
    "январь",
    "февраль",
    "март",
    "апрель",
    "май",
    "июнь",
    "июль",
    "август",
    "сентябрь",
    "октябрь",
    "ноябрь",
    "декабрь",
  ];

  const monthName = monthsRu[m - 1] || "сентябрь";
  const academicYear = m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  return { monthName, academicYear };
}

export async function exportScholarshipDocx({
  groupName,
  monthLabel,
  selectedMonth,
  students,
  subjects = [],
  specialtyName,
  curatorName,
}: ExportDocxParams): Promise<void> {
  const solidBorder = {
    top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  };

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  const excellentStudents = students.filter((s) => s.status === "EXCELLENT");
  const goodStudents = students.filter((s) => s.status === "GOOD");

  const professionName = specialtyName || "Разработчик Веб и мультимедийных приложений";
  const masterName = curatorName || "Вопольский В.В";
  const { monthName, academicYear } = getAcademicYearAndMonthText(selectedMonth || monthLabel);

  // ==========================================
  // SECTION 1: СПИСОК УЧАЩИХСЯ НА СТИПЕНДИЮ
  // ==========================================
  const page1TableRows: TableRow[] = [
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
  page1TableRows.push(
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
    page1TableRows.push(
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
      page1TableRows.push(
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
  page1TableRows.push(
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
    page1TableRows.push(
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
      page1TableRows.push(
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

  const professionLine = `«${professionName}» за ${monthLabel.toLowerCase()}`;

  // ==========================================
  // SECTION 2: ТАБЕЛЬ УЧЕТА УСПЕВАЕМОСТИ УЧАЩИХСЯ
  // ==========================================
  const activeSubjects = subjects.length > 0 ? subjects : ["Кыргызский яз", "Русский Яз", "Геометрия", "Английский язык", "Биология", "Охрана труда", "Основы программ", "ДПМ", "ЧИО"];
  const numSubjects = activeSubjects.length;

  const colIndexWidth = 600; // dxa
  const colNameWidth = 3400; // dxa
  const remainingTableWidth = 5900; // dxa
  const colSubjWidth = Math.max(450, Math.floor(remainingTableWidth / numSubjects));

  // Page 2 Table Header
  const page2HeaderCells: TableCell[] = [
    new TableCell({
      width: { size: colIndexWidth, type: WidthType.DXA },
      borders: solidBorder,
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "№",
              bold: true,
              size: 18,
              font: "Times New Roman",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "п/п",
              bold: true,
              size: 18,
              font: "Times New Roman",
            }),
          ],
        }),
      ],
    }),
    new TableCell({
      width: { size: colNameWidth, type: WidthType.DXA },
      borders: solidBorder,
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Ф.И.О. учащихся",
              bold: true,
              size: 20,
              font: "Times New Roman",
            }),
          ],
        }),
      ],
    }),
  ];

  activeSubjects.forEach((subj) => {
    page2HeaderCells.push(
      new TableCell({
        width: { size: colSubjWidth, type: WidthType.DXA },
        borders: solidBorder,
        textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
        verticalAlign: VerticalAlign.BOTTOM,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: subj,
                bold: true,
                size: 17,
                font: "Times New Roman",
              }),
            ],
          }),
        ],
      })
    );
  });

  const page2TableRows: TableRow[] = [
    new TableRow({
      children: page2HeaderCells,
    }),
  ];

  // Page 2 Student Data Rows (только учащиеся, которые получают стипендию: на «5» и на «5 и 4»)
  const scholarshipEligibleStudents = students.filter(
    (st) => st.status === "EXCELLENT" || st.status === "GOOD"
  );

  if (scholarshipEligibleStudents.length === 0) {
    page2TableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2 + activeSubjects.length,
            borders: solidBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Учащихся, назначенных на стипендию, нет",
                    size: 19,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    scholarshipEligibleStudents.forEach((st, idx) => {
      const rowCells: TableCell[] = [
        new TableCell({
          width: { size: colIndexWidth, type: WidthType.DXA },
          borders: solidBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${idx + 1}.`,
                  size: 19,
                  font: "Times New Roman",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colNameWidth, type: WidthType.DXA },
          borders: solidBorder,
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: st.studentName,
                  size: 19,
                  font: "Times New Roman",
                }),
              ],
            }),
          ],
        }),
      ];

      activeSubjects.forEach((subj) => {
        const gradeStr = st.grades[subj] || "";
        rowCells.push(
          new TableCell({
            width: { size: colSubjWidth, type: WidthType.DXA },
            borders: solidBorder,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: gradeStr,
                    size: 19,
                    bold: gradeStr.length > 0,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          })
        );
      });

      page2TableRows.push(
        new TableRow({
          children: rowCells,
        })
      );
    });
  }

  // Page 2 Commission Signatures Table
  const commissionTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 36, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `Мастер п/о группы ${groupName}`,
                    bold: true,
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 64, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: masterName,
                    bold: true,
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 36, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: "Председатель",
                    bold: true,
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 64, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: "Зам. директора по УВР Бейшенова К.Ж",
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 36, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Члены комиссии",
                    bold: true,
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 64, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: "Старший мастер Сатыбалдиева К.Б.",
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: "Преподаватель кыргыз.языка: Жумакенова А.К.",
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: "Преподаватель русского.языка: Тиленбаева Н.Ы.",
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: "Мастер п/о Цыс Р.Ф",
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Мастер п/о Бейшенова Б.Ж",
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Construct complete 2-page Word Document
  const doc = new Document({
    sections: [
      // ------------------------------------------
      // Page 1: Список учащихся группы (Ведомость)
      // ------------------------------------------
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
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: page1TableRows,
          }),
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
      // -------------------------------------------------------------
      // Page 2: Табель учета успеваемость учащихся (По дисциплинам)
      // -------------------------------------------------------------
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: 800,
              bottom: 800,
              left: 1000,
              right: 1000,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: `Табель учета успеваемость учащихся группы ${groupName} по профессии «${professionName}» за ${monthName} месяц ${academicYear} учебного года`,
                bold: true,
                size: 21,
                font: "Times New Roman",
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: page2TableRows,
          }),
          new Paragraph({
            spacing: { before: 500 },
            children: [],
          }),
          commissionTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Ведомость_и_Табель_стипендии_${groupName}_${monthLabel.replace(/\s+/g, "_")}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
