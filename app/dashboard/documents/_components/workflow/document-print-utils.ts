import type { WorkflowDocument, ApprovalStep } from "../../workflow-data";
import { toast } from "@/components/ui/toast";

export const cleanDocumentText = (text: string) => {
  return text
    .replace(/54\.02\.01\s*/g, "")
    .replace(/54\.02\.01/g, "")
    .replace(/\s*\((?:номер\s+)?личного\s+дела:?[^)]*\)/gi, "")
    .replace(/\s*\(Личное\s+дело[^)]*\)/gi, "");
};

export function getAdminResolutionStep(doc: {
  status?: string;
  approvalSteps?: ApprovalStep[];
}): ApprovalStep | null {
  if (!Array.isArray(doc.approvalSteps) || doc.approvalSteps.length === 0) {
    return null;
  }
  const adminSteps = doc.approvalSteps.filter((s) => s.role !== "CURATOR");
  const decidedAdmin = [...adminSteps]
    .reverse()
    .find((s) => s.status === "APPROVED" || s.status === "REJECTED");
  if (decidedAdmin) return decidedAdmin;
  return null;
}

export const generateOfficialDocumentHtml = (
  doc: {
    title: string;
    createdAt?: Date | string;
    addressee?: string;
    generalReason?: string;
    descriptionText: string;
    students?: any[];
    signatoryName?: string;
    signatoryTitle?: string;
    authorName?: string;
    authorRole?: string;
    docNumber?: string;
    status?: string;
    approvalSteps?: ApprovalStep[];
  },
  currentUserName?: string
) => {
  const studentsList = doc.students || [];
  const isMulti = studentsList.length > 1;
  const dateFormatted = doc.createdAt
    ? new Date(doc.createdAt).toLocaleDateString("ru-RU")
    : new Date().toLocaleDateString("ru-RU");

  const curatorName =
    doc.signatoryName ||
    doc.authorName ||
    currentUserName ||
    "Вопольский Виктор Владимирович";

  const resolutionStep = getAdminResolutionStep(doc);
  const adminSignerName = resolutionStep?.name || "Тоялиева М. Р.";

  const addresseeText = doc.addressee?.trim() || "По месту требования";
  const cleanedBody = cleanDocumentText(doc.descriptionText || "");
  const cleanedGeneralReason = doc.generalReason
    ? cleanDocumentText(doc.generalReason)
    : "";

  const studentsRows =
    isMulti
      ? `
      <table class="students-table">
        <thead>
          <tr>
            <th style="width: 28px; text-align: center;">№</th>
            <th style="text-align: left;">ФИО студента</th>
            <th style="width: 80px; text-align: center;">Группа</th>
            <th style="width: 110px; text-align: center;">Пропуски (ч.)</th>
            ${
              studentsList.some((s) => Boolean(s.individualReason?.trim()))
                ? '<th style="text-align: left;">Особое примечание</th>'
                : ""
            }
          </tr>
        </thead>
        <tbody>
          ${studentsList
            .map(
              (st, idx) => `
            <tr>
              <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
              <td style="font-weight: 600;">${st.name}</td>
              <td style="text-align: center;">${st.group || "—"}</td>
              <td style="text-align: center; font-family: monospace;">${
                typeof st.unexcusedHours === "number"
                  ? `${st.unexcusedHours} ч.`
                  : typeof st.attendanceRate === "number"
                  ? `${st.attendanceRate}%`
                  : "0 ч."
              }</td>
              ${
                studentsList.some((s) => Boolean(s.individualReason?.trim()))
                  ? `<td>${st.individualReason?.trim() || "—"}</td>`
                  : ""
              }
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
      : "";

  const resolutionHtml = resolutionStep
    ? `
      <div class="resolution-box">
        <div class="resolution-header">
          <span>РЕЗОЛЮЦИЯ АДМИНИСТРАЦИИ ЛИЦЕЯ: ${
            resolutionStep.status === "APPROVED"
              ? "УТВЕРЖДЕНО / ОДОБРЕНО"
              : "ОТКЛОНЕНО"
          }</span>
          <span>Дата решения: ${resolutionStep.date || dateFormatted} г.</span>
        </div>
        ${
          resolutionStep.comment
            ? `<div class="resolution-comment">Решение: «${resolutionStep.comment}»</div>`
            : ""
        }
        <div class="resolution-signer">
          Рассмотрел(а): ${resolutionStep.roleTitle} — <strong>${resolutionStep.name}</strong>
        </div>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: ${isMulti ? "10mm 15mm 10mm 15mm" : "15mm 20mm 15mm 20mm"};
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #09090b;
      font-family: Arial, "Helvetica Neue", Helvetica, "Segoe UI", sans-serif;
      font-size: ${isMulti ? "9.5pt" : "11pt"};
      line-height: ${isMulti ? "1.35" : "1.45"};
    }
    .page-sheet {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .official-header {
      text-align: center;
      margin-bottom: 6px;
    }
    .ministry-title {
      font-size: ${isMulti ? "8.5pt" : "9.5pt"};
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #18181b;
      margin: 0 0 3px 0;
    }
    .lyceum-title {
      font-size: ${isMulti ? "11.5pt" : "13.5pt"};
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #000000;
      margin: 0;
    }
    .header-rule {
      border: none;
      border-top: 1.5px solid #000000;
      margin: 6px 0 12px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: ${isMulti ? "10px" : "16px"};
      font-size: ${isMulti ? "9.5pt" : "10.5pt"};
      color: #09090b;
    }
    .meta-date {
      font-weight: 500;
    }
    .meta-addressee {
      text-align: right;
      font-weight: 500;
      max-width: 50%;
      white-space: pre-line;
    }
    .doc-title {
      text-align: center;
      font-size: ${isMulti ? "10.5pt" : "12pt"};
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin: ${isMulti ? "10px 0 12px 0" : "16px 0 14px 0"};
      color: #000000;
    }
    .body-paragraph {
      text-align: justify;
      text-indent: 0;
      margin: 0 0 ${isMulti ? "8px" : "12px"} 0;
    }
    .lead-reason {
      margin-bottom: ${isMulti ? "10px" : "14px"};
    }
    .students-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 8.5pt;
      line-height: 1.25;
      page-break-inside: auto;
      break-inside: auto;
    }
    .students-table th, .students-table td {
      border: 1px solid #18181b;
      padding: 3px 5px;
    }
    .students-table th {
      background-color: #f4f4f5;
      font-weight: 700;
    }
    .students-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .resolution-box {
      margin: 14px 0 6px 0;
      padding: 8px 10px;
      border: 1.5px solid #18181b;
      background-color: #fafafa;
      font-size: 9.5pt;
      line-height: 1.35;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .resolution-header {
      display: flex;
      justify-content: space-between;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9pt;
      border-bottom: 1px solid #d4d4d8;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    .resolution-comment {
      margin: 4px 0;
      font-weight: 600;
    }
    .resolution-signer {
      font-size: 9pt;
      color: #27272a;
    }
    .signatures-divider {
      border: none;
      border-top: 1px solid #d4d4d8;
      margin: ${isMulti ? "14px 0 10px 0" : "20px 0 14px 0"};
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
      font-size: ${isMulti ? "9.5pt" : "10.5pt"};
    }
    .signature-block {
      flex: 1;
    }
    .signature-role {
      font-weight: 700;
      color: #09090b;
      margin: 0 0 3px 0;
    }
    .signature-line {
      font-size: 8.5pt;
      color: #71717a;
      margin: 3px 0 5px 0;
    }
    .signature-name {
      font-weight: 700;
      color: #09090b;
      margin: 0;
    }
    .text-right {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="page-sheet">
    <div class="official-header">
      <div class="ministry-title">МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ</div>
      <div class="lyceum-title">ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98</div>
    </div>
    <hr class="header-rule" />

    <div class="meta-row">
      <div class="meta-date">Дата: ${dateFormatted} г.${doc.docNumber ? ` • № ${doc.docNumber}` : ""}</div>
      <div class="meta-addressee">${addresseeText}</div>
    </div>

    <div class="doc-title">${doc.title}</div>

    ${cleanedGeneralReason ? `<p class="body-paragraph lead-reason">${cleanedGeneralReason}</p>` : ""}

    ${studentsRows}

    ${cleanedBody
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p class="body-paragraph">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("")}

    <hr class="signatures-divider" />

    <div class="signatures-row">
      <div class="signature-block">
        <div class="signature-role">Мастер группы (куратор):</div>
        <div class="signature-line">(подпись) _______________________</div>
        <div class="signature-name">${curatorName}</div>
      </div>
      <div class="signature-block text-right">
        <div class="signature-role">Зам. директора по учебной части:</div>
        ${
          resolutionStep?.status === "APPROVED"
            ? `<div class="signature-line" style="font-weight: 600; color: #18181b;">(УТВЕРЖДЕНО • ${resolutionStep.date || dateFormatted})</div>`
            : resolutionStep?.status === "REJECTED"
            ? `<div class="signature-line" style="font-weight: 600; color: #18181b;">(ОТКЛОНЕНО • ${resolutionStep.date || dateFormatted})</div>`
            : ""
        }
        <div class="signature-line">(подпись) _______________________</div>
        <div class="signature-name">${adminSignerName}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const printHtmlContent = (htmlContent: string) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  iframe.contentWindow?.document.open();
  iframe.contentWindow?.document.write(htmlContent);
  iframe.contentWindow?.document.close();
  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 300);
};

export const exportDocumentDocx = (doc: WorkflowDocument, currentUserName?: string) => {
  const isMulti = doc.students.length > 1;
  const dateFormatted = new Date(doc.createdAt).toLocaleDateString("ru-RU");
  const curatorName =
    doc.signatoryName ||
    doc.authorName ||
    currentUserName ||
    "Вопольский Виктор Владимирович";
  const resolutionStep = getAdminResolutionStep(doc);
  const adminSignerName = resolutionStep?.name || "Тоялиева М. Р.";
  const addresseeText = doc.addressee?.trim() || "По месту требования";
  const cleanedBody = cleanDocumentText(doc.descriptionText || "");
  const cleanedGeneralReason = doc.generalReason
    ? cleanDocumentText(doc.generalReason)
    : "";

  const studentsRows =
    isMulti
      ? `
      <table border="1" cellpadding="4" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:10px; margin-bottom:10px; font-size:9pt; mso-pagination:lines-together;">
        <thead>
          <tr style="background-color:#f4f4f5; font-weight:bold;">
            <th style="width:30px; text-align:center;">№</th>
            <th style="text-align:left;">ФИО студента</th>
            <th style="width:80px; text-align:center;">Группа</th>
            <th style="width:110px; text-align:center;">Пропуски (ч.)</th>
            ${
              doc.students.some((s) => Boolean(s.individualReason?.trim()))
                ? '<th style="text-align:left;">Особое примечание</th>'
                : ""
            }
          </tr>
        </thead>
        <tbody>
          ${doc.students
            .map(
              (st, idx) => `
            <tr style="page-break-inside:avoid; mso-pagination:lines-together;">
              <td style="text-align:center; font-family:monospace;">${idx + 1}</td>
              <td><strong>${st.name}</strong></td>
              <td style="text-align:center;">${st.group || "—"}</td>
              <td style="text-align:center; font-family:monospace;">${
                typeof st.unexcusedHours === "number"
                  ? `${st.unexcusedHours} ч.`
                  : typeof st.attendanceRate === "number"
                  ? `${st.attendanceRate}%`
                  : "0 ч."
              }</td>
              ${
                doc.students.some((s) => Boolean(s.individualReason?.trim()))
                  ? `<td>${st.individualReason?.trim() || "—"}</td>`
                  : ""
              }
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
      : "";

  const resolutionWordBlock = resolutionStep
    ? `
      <table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12pt; margin-bottom:6pt; background-color:#fafafa; font-size:9.5pt;">
        <tr>
          <td>
            <strong>РЕЗОЛЮЦИЯ АДМИНИСТРАЦИИ ЛИЦЕЯ: ${
              resolutionStep.status === "APPROVED"
                ? "УТВЕРЖДЕНО / ОДОБРЕНО"
                : "ОТКЛОНЕНО"
            }</strong> (Дата: ${resolutionStep.date || dateFormatted} г.)<br/>
            ${
              resolutionStep.comment
                ? `<span>Решение: «${resolutionStep.comment}»</span><br/>`
                : ""
            }
            <span>Рассмотрел(а): ${resolutionStep.roleTitle} — <strong>${resolutionStep.name}</strong></span>
          </td>
        </tr>
      </table>
    `
    : "";

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${doc.title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 595.3pt 841.9pt;
          margin: ${isMulti ? "30.0pt 42.0pt 30.0pt 42.0pt" : "42.0pt 56.7pt 42.0pt 56.7pt"};
          mso-header-margin: 36.0pt;
          mso-footer-margin: 36.0pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          font-size: ${isMulti ? "9.5pt" : "11pt"};
          line-height: ${isMulti ? "1.3" : "1.45"};
          color: #000000;
        }
        p { margin: 0 0 ${isMulti ? "6pt" : "8pt"} 0; text-align: justify; }
        .header-center { text-align: center; }
        .min-title { font-size: ${isMulti ? "8.5pt" : "9.5pt"}; font-weight: bold; text-transform: uppercase; margin-bottom: 2pt; }
        .lic-title { font-size: ${isMulti ? "11.5pt" : "13.5pt"}; font-weight: bold; text-transform: uppercase; margin-bottom: 4pt; }
        .divider-line { border-top: 1.5pt solid #000000; margin-bottom: 10pt; }
        .doc-title { text-align: center; font-size: ${isMulti ? "10.5pt" : "12pt"}; font-weight: bold; text-transform: uppercase; margin: 10pt 0 10pt 0; }
        .meta-tbl { width: 100%; border: none; margin-bottom: 10pt; }
        .meta-tbl td { border: none; padding: 0; font-size: ${isMulti ? "9.5pt" : "10.5pt"}; }
        .sig-tbl { width: 100%; border: none; margin-top: 16pt; mso-pagination: lines-together; page-break-inside: avoid; }
        .sig-tbl td { border: none; padding: 0; vertical-align: top; }
      </style>
    </head>
    <body lang="RU">
    <div class="Section1">
      <div class="header-center">
        <div class="min-title">МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ</div>
        <div class="lic-title">ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98</div>
      </div>
      <div class="divider-line"></div>

      <table class="meta-tbl">
        <tr>
          <td style="text-align: left; vertical-align: top;">
            <strong>Дата:</strong> ${dateFormatted} г.${doc.docNumber ? ` • № ${doc.docNumber}` : ""}
          </td>
          <td style="text-align: right; vertical-align: top;">
            ${addresseeText.replace(/\n/g, "<br/>")}
          </td>
        </tr>
      </table>

      <div class="doc-title">${doc.title}</div>

      ${cleanedGeneralReason ? `<p style="margin-bottom:8pt;">${cleanedGeneralReason}</p>` : ""}

      ${studentsRows}

      ${cleanedBody
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
        .join("")}

      <hr style="border: none; border-top: 1pt solid #d4d4d8; margin-top: 18pt; margin-bottom: 12pt;" />

      <table class="sig-tbl">
        <tr>
          <td style="width: 50%;">
            <strong>Мастер группы (куратор):</strong><br/>
            <span style="font-size: 8.5pt; color: #71717a;">(подпись) _______________________</span><br/>
            <strong style="margin-top: 4pt; display: inline-block;">${curatorName}</strong>
          </td>
          <td style="width: 50%; text-align: right;">
            <strong>Зам. директора по учебной части:</strong><br/>
            ${
              resolutionStep?.status === "APPROVED"
                ? `<span style="font-size: 8.5pt; font-weight: bold; color: #18181b;">(УТВЕРЖДЕНО • ${resolutionStep.date || dateFormatted})</span><br/>`
                : resolutionStep?.status === "REJECTED"
                ? `<span style="font-size: 8.5pt; font-weight: bold; color: #18181b;">(ОТКЛОНЕНО • ${resolutionStep.date || dateFormatted})</span><br/>`
                : ""
            }
            <span style="font-size: 8.5pt; color: #71717a;">(подпись) _______________________</span><br/>
            <strong style="margin-top: 4pt; display: inline-block;">${adminSignerName}</strong>
          </td>
        </tr>
      </table>
    </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.title}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.add({
    title: `Файл успешно скачан для Microsoft Word`,
    type: "success",
  });
};
