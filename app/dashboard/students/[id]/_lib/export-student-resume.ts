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
import { StudentCardDTO, StudentAchievementDTO } from "../../actions";
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_LEVELS } from "../_components/achievement-dialog";

function getCategoryLabel(cat: StudentAchievementDTO["category"]): string {
  return ACHIEVEMENT_CATEGORIES.find((c) => c.value === cat)?.label.split("/")[0].trim() || cat;
}

function getLevelLabel(lvl: StudentAchievementDTO["level"]): string {
  return ACHIEVEMENT_LEVELS.find((l) => l.value === lvl)?.label || lvl;
}

/**
 * Clean isolated A4 HTML print/PDF export
 * Opens an isolated print window without any dashboard layout, sidebar or buttons.
 */
export function printStudentResume(
  student: StudentCardDTO,
  achievements: StudentAchievementDTO[]
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Пожалуйста, разрешите всплывающие окна в браузере для печати резюме");
    return;
  }

  const achievementsRowsHtml =
    achievements.length > 0
      ? achievements
          .map(
            (a, idx) => `
            <tr>
              <td style="text-align: center; width: 30px;">${idx + 1}</td>
              <td>
                <div style="font-weight: 600;">${a.title}</div>
                ${a.description ? `<div style="font-size: 8.5pt; color: #4b5563; margin-top: 2px;">${a.description}</div>` : ""}
              </td>
              <td style="width: 120px;">${getCategoryLabel(a.category)}</td>
              <td style="width: 110px;">${getLevelLabel(a.level)}</td>
              <td style="width: 100px; font-weight: 600; color: #047857;">${a.place || "Участник"}</td>
              <td style="width: 75px; text-align: center;">${a.date}</td>
              <td style="width: 120px;">${a.issuer || "—"}</td>
            </tr>
          `
          )
          .join("")
      : `<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 16px;">Внеучебных достижений пока не зафиксировано</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="utf-8" />
      <title>Портфолио и резюме — ${student.name}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: "Times New Roman", Times, Georgia, serif;
          color: #111827;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 10.5pt;
          line-height: 1.35;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #111827;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }
        .institution {
          font-size: 10pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #374151;
          margin-bottom: 4px;
        }
        .doc-title {
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 4px 0;
        }
        .doc-subtitle {
          font-size: 10pt;
          color: #4b5563;
        }
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 24px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 14px;
          font-size: 10pt;
        }
        .profile-item {
          display: flex;
          justify-content: space-between;
        }
        .profile-label {
          color: #6b7280;
        }
        .profile-value {
          font-weight: 600;
          color: #111827;
          text-align: right;
        }
        .section-title {
          font-size: 11pt;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 1.5px solid #d1d5db;
          padding-bottom: 3px;
          margin: 14px 0 8px 0;
          display: flex;
          justify-content: space-between;
        }
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .kpi-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 6px 10px;
          text-align: center;
          background: #ffffff;
        }
        .kpi-label {
          font-size: 8.5pt;
          color: #6b7280;
          text-transform: uppercase;
        }
        .kpi-value {
          font-size: 13pt;
          font-weight: bold;
          color: #111827;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5pt;
          margin-top: 6px;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 6px 8px;
          vertical-align: middle;
        }
        th {
          background-color: #f3f4f6;
          font-weight: bold;
          text-align: left;
          font-size: 9pt;
          text-transform: uppercase;
        }
        .footer-signs {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          font-size: 10pt;
        }
        .sign-block {
          width: 45%;
        }
        .sign-line {
          border-bottom: 1px solid #111827;
          margin-top: 24px;
          margin-bottom: 4px;
        }
        .sign-hint {
          font-size: 8pt;
          color: #6b7280;
          text-align: center;
        }
        @media print {
          body {
            padding: 0;
          }
          button {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="institution">Официальный документ • Лицей LMS</div>
        <div class="doc-title">Портфолио и резюме выпускника / студента</div>
        <div class="doc-subtitle">Сводная ведомость академической успеваемости и внеучебных достижений</div>
      </div>

      <div class="profile-grid">
        <div class="profile-item">
          <span class="profile-label">Ф.И.О. студента:</span>
          <span class="profile-value">${student.name}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Учебная группа:</span>
          <span class="profile-value">${student.groupName} (${student.course} курс)</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Специальность:</span>
          <span class="profile-value">${student.specialtyName || "—"}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Поименный № (П/Н):</span>
          <span class="profile-value">${student.rollNumber || "—"}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Куратор группы:</span>
          <span class="profile-value">${student.curatorName || "—"}</span>
        </div>
        <div class="profile-item">
          <span class="profile-label">Дата зачисления:</span>
          <span class="profile-value">${student.joinedAt}</span>
        </div>
      </div>

      <div class="section-title">
        <span>Академическая успеваемость и дисциплина</span>
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">Средний балл (GPA)</div>
          <div class="kpi-value">${student.academics.averageGrade || "—"}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Посещаемость</div>
          <div class="kpi-value">${student.attendance.percent}%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Сдано заданий</div>
          <div class="kpi-value">${student.academics.submittedAssignments}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Пропусков (Н/Б)</div>
          <div class="kpi-value">${student.attendance.absent + student.attendance.excused}</div>
        </div>
      </div>

      <div class="section-title">
        <span>Внеучебные достижения, олимпиады и сертификаты (${achievements.length})</span>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: center;">№</th>
            <th>Мероприятие / Достижение</th>
            <th>Категория</th>
            <th>Уровень</th>
            <th>Результат</th>
            <th style="text-align: center;">Дата</th>
            <th>Организатор</th>
          </tr>
        </thead>
        <tbody>
          ${achievementsRowsHtml}
        </tbody>
      </table>

      <div class="footer-signs">
        <div class="sign-block">
          <div>Куратор учебной группы:</div>
          <div class="sign-line"></div>
          <div class="sign-hint">(подпись / ${student.curatorName || "расшифровка"})</div>
        </div>
        <div class="sign-block" style="text-align: right;">
          <div>Учебная часть / Заведующий отделением:</div>
          <div class="sign-line"></div>
          <div class="sign-hint">М.П. (подпись / дата выдачи: ${new Date().toLocaleDateString("ru-RU")})</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Give fonts and styles a brief tick to load before showing print dialog
  setTimeout(() => {
    printWindow.print();
  }, 200);
}

/**
 * Official Word (.docx) export for student portfolio & resume
 */
export async function exportStudentResumeDocx(
  student: StudentCardDTO,
  achievements: StudentAchievementDTO[]
) {
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  };

  const headerCells = [
    new TableCell({
      width: { size: 5, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ text: "№", alignment: AlignmentType.CENTER })],
    }),
    new TableCell({
      width: { size: 30, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ text: "Мероприятие / Достижение", alignment: AlignmentType.LEFT })],
    }),
    new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ text: "Категория", alignment: AlignmentType.LEFT })],
    }),
    new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ text: "Уровень", alignment: AlignmentType.LEFT })],
    }),
    new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ text: "Результат", alignment: AlignmentType.LEFT })],
    }),
    new TableCell({
      width: { size: 10, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ text: "Дата", alignment: AlignmentType.CENTER })],
    }),
    new TableCell({
      width: { size: 10, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ text: "Организатор", alignment: AlignmentType.LEFT })],
    }),
  ];

  const achievementRows = achievements.map((a, idx) => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: String(idx + 1), alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: a.title, bold: true }),
                ...(a.description
                  ? [new TextRun({ text: `\n${a.description}`, size: 18, color: "666666" })]
                  : []),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [new Paragraph({ text: getCategoryLabel(a.category) })],
        }),
        new TableCell({
          children: [new Paragraph({ text: getLevelLabel(a.level) })],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: a.place || "Участник", bold: true, color: "047857" })],
            }),
          ],
        }),
        new TableCell({
          children: [new Paragraph({ text: a.date, alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          children: [new Paragraph({ text: a.issuer || "—" })],
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "ПОРТФОЛИО И РЕЗЮМЕ СТУДЕНТА",
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Сводная ведомость академической успеваемости и внеучебных достижений",
                size: 20,
                color: "666666",
              }),
            ],
          }),

          // Student Details Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Ф.И.О.: ", bold: true }), new TextRun(student.name)] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Группа: ", bold: true }), new TextRun(`${student.groupName} (${student.course} курс)`)] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Специальность: ", bold: true }), new TextRun(student.specialtyName || "—")] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Куратор: ", bold: true }), new TextRun(student.curatorName || "—")] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Средний балл (GPA): ", bold: true }), new TextRun(student.academics.averageGrade || "—")] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Посещаемость: ", bold: true }), new TextRun(`${student.attendance.percent}%`)] })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: "Внеучебные достижения, олимпиады и сертификаты",
                bold: true,
                size: 22,
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({ children: headerCells }), ...achievementRows],
          }),

          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            children: [
              new TextRun({ text: "Куратор группы: _______________________ / " + (student.curatorName || "____________") }),
            ],
          }),
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({ text: `Дата формирования: ${new Date().toLocaleDateString("ru-RU")}                     М.П.` }),
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
  a.download = `Резюме_Портфолио_${student.name.replace(/\s+/g, "_")}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
