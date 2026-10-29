import {
  StudentCardDTO,
  StudentAchievementDTO,
  StudentResumeProfileDTO,
} from "../../actions";
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_LEVELS } from "../_components/achievement-dialog";
import { LANGUAGE_LEVEL_LABELS, SKILL_LEVEL_LABELS } from "../_components/student-resume-dialog";
import { toast } from "@/components/ui/toast";

function getCategoryLabel(cat: StudentAchievementDTO["category"]): string {
  return ACHIEVEMENT_CATEGORIES.find((c) => c.value === cat)?.label.split("/")[0].trim() || cat;
}

function getLevelLabel(lvl: StudentAchievementDTO["level"]): string {
  return ACHIEVEMENT_LEVELS.find((l) => l.value === lvl)?.label || lvl;
}

/**
 * Generates clean official A4 HTML for Student Resume (in the exact style of /dashboard/documents)
 */
export function generateOfficialResumeHtml(
  student: StudentCardDTO,
  achievements: StudentAchievementDTO[],
  customResume?: StudentResumeProfileDTO
): string {
  const resume = customResume || student.resumeProfile;
  const dateFormatted = new Date().toLocaleDateString("ru-RU");
  const curatorName = student.curatorName || "Вопольский Виктор Владимирович";

  const languagesList = resume?.languages || [];
  const hardSkillsList = resume?.hardSkills || [];
  const softSkillsList = resume?.softSkills || [];
  const projectsList = resume?.projects || [];

  const languagesTableHtml =
    languagesList.length > 0
      ? `
      <div class="section-heading">1. Знание языков</div>
      <table class="official-table">
        <thead>
          <tr>
            <th style="width: 36px; text-align: center;">№</th>
            <th style="text-align: left;">Язык</th>
            <th style="text-align: left;">Степень владения</th>
          </tr>
        </thead>
        <tbody>
          ${languagesList
            .map(
              (lang, idx) => `
            <tr>
              <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
              <td style="font-weight: 600;">${lang.language}</td>
              <td>${LANGUAGE_LEVEL_LABELS[lang.level]?.label || lang.level}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
      : "";

  const skillsTableHtml =
    hardSkillsList.length > 0
      ? `
      <div class="section-heading">2. Профессиональные навыки и компетенции (что умеет студент)</div>
      <table class="official-table">
        <thead>
          <tr>
            <th style="width: 36px; text-align: center;">№</th>
            <th style="text-align: left;">Профессиональный навык / Компетенция</th>
            <th style="width: 170px; text-align: left;">Уровень освоения</th>
          </tr>
        </thead>
        <tbody>
          ${hardSkillsList
            .map(
              (skill, idx) => `
            <tr>
              <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
              <td style="font-weight: 600;">${skill.name}</td>
              <td>${SKILL_LEVEL_LABELS[skill.level]?.label || skill.level}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
      : "";

  const projectsHtml =
    projectsList.length > 0
      ? `
      <div class="section-heading">3. Производственная практика и учебные проекты</div>
      <table class="official-table">
        <thead>
          <tr>
            <th style="width: 140px; text-align: left;">Период / Срок</th>
            <th style="text-align: left;">Проект / Место практики и выполняемые задачи</th>
          </tr>
        </thead>
        <tbody>
          ${projectsList
            .map(
              (proj) => `
            <tr>
              <td style="vertical-align: top;">${proj.period || "За период обучения"}</td>
              <td>
                <div style="font-weight: 700;">${proj.title}${proj.role ? ` — ${proj.role}` : ""}</div>
                ${proj.description ? `<div style="margin-top: 2px;">${proj.description}</div>` : ""}
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
      : "";

  const achievementsHtml =
    achievements.length > 0
      ? `
      <div class="section-heading">4. Олимпиады, сертификаты и достижения</div>
      <table class="official-table">
        <thead>
          <tr>
            <th style="width: 32px; text-align: center;">№</th>
            <th style="text-align: left;">Наименование мероприятия / достижения</th>
            <th style="width: 120px; text-align: left;">Уровень</th>
            <th style="width: 110px; text-align: left;">Результат</th>
            <th style="width: 80px; text-align: center;">Дата</th>
          </tr>
        </thead>
        <tbody>
          ${achievements
            .map(
              (a, idx) => `
            <tr>
              <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
              <td>
                <div style="font-weight: 600;">${a.title}</div>
                <div style="font-size: 8pt; color: #3f3f46;">${getCategoryLabel(a.category)}${a.issuer ? ` • ${a.issuer}` : ""}</div>
              </td>
              <td>${getLevelLabel(a.level)}</td>
              <td style="font-weight: 600;">${a.place || "Участник"}</td>
              <td style="text-align: center;">${a.date}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `
      : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Резюме студента — ${student.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 18mm 14mm 18mm;
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
      font-size: 10pt;
      line-height: 1.4;
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
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #18181b;
      margin: 0 0 2px 0;
    }
    .lyceum-title {
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #000000;
      margin: 0;
    }
    .header-rule {
      border: none;
      border-top: 1.5px solid #000000;
      margin: 6px 0 10px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      font-size: 9.5pt;
      color: #09090b;
    }
    .doc-title {
      text-align: center;
      font-size: 11.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin: 8px 0 10px 0;
      color: #000000;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 9.5pt;
    }
    .info-table td {
      border: 1px solid #18181b;
      padding: 4px 7px;
      vertical-align: top;
    }
    .info-label {
      width: 32%;
      background-color: #f4f4f5;
      font-weight: 700;
    }
    .section-heading {
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      margin: 10px 0 4px 0;
      color: #000000;
    }
    .body-paragraph {
      text-align: justify;
      margin: 0 0 8px 0;
      font-size: 9.5pt;
    }
    .official-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0 8px 0;
      font-size: 9pt;
      line-height: 1.3;
    }
    .official-table th, .official-table td {
      border: 1px solid #18181b;
      padding: 4px 6px;
    }
    .official-table th {
      background-color: #f4f4f5;
      font-weight: 700;
    }
    .official-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signatures-divider {
      border: none;
      border-top: 1px solid #d4d4d8;
      margin: 16px 0 10px 0;
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
      font-size: 9.5pt;
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
      <div>Дата формирования: <strong>${dateFormatted} г.</strong></div>
      <div class="text-right">По месту требования / Для трудоустройства и практики</div>
    </div>

    <div class="doc-title">РЕЗЮМЕ ВЫПУСКНИКА / СТУДЕНТА</div>

    <table class="info-table">
      <tr>
        <td class="info-label">Ф.И.О. студента:</td>
        <td><strong>${student.name}</strong></td>
      </tr>
      <tr>
        <td class="info-label">Учебная группа и курс:</td>
        <td>${student.groupName} (${student.course} курс)${student.rollNumber ? `, поименный № ${student.rollNumber}` : ""}</td>
      </tr>
      <tr>
        <td class="info-label">Специальность:</td>
        <td>${student.specialtyName || "Информационные системы и программирование"}</td>
      </tr>
      ${
        resume?.desiredPosition
          ? `<tr>
              <td class="info-label">Желаемая должность / профиль:</td>
              <td><strong>${resume.desiredPosition}</strong>${resume.workFormat ? ` (${resume.workFormat})` : ""}</td>
            </tr>`
          : ""
      }
      <tr>
        <td class="info-label">Контактные данные:</td>
        <td>${student.phone ? `Тел.: ${student.phone}; ` : ""}Email: ${student.email}</td>
      </tr>
      <tr>
        <td class="info-label">Успеваемость и посещаемость:</td>
        <td>Средний балл (GPA): <strong>${student.academics.averageGrade || "—"}</strong> • Посещаемость занятий: <strong>${student.attendance.percent}%</strong></td>
      </tr>
    </table>

    ${
      resume?.aboutMe
        ? `<p class="body-paragraph"><strong>Краткая характеристика и цель:</strong> ${resume.aboutMe}</p>`
        : ""
    }

    ${languagesTableHtml}

    ${skillsTableHtml}

    ${
      softSkillsList.length > 0
        ? `<p class="body-paragraph" style="margin-top: 6px;"><strong>Личные и деловые качества:</strong> ${softSkillsList.join(", ")}.</p>`
        : ""
    }

    ${projectsHtml}

    ${achievementsHtml}

    <hr class="signatures-divider" />

    <div class="signatures-row">
      <div class="signature-block">
        <div class="signature-role">Мастер группы (куратор):</div>
        <div class="signature-line">(подпись) _______________________</div>
        <div class="signature-name">${curatorName}</div>
      </div>
      <div class="signature-block text-right">
        <div class="signature-role">Зам. директора по учебной части:</div>
        <div class="signature-line">(подпись) _______________________</div>
        <div class="signature-name">Тоялиева М. Р.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Silent iframe print (no popup windows, exact A4 output like /dashboard/documents)
 */
export function printStudentResume(
  student: StudentCardDTO,
  achievements: StudentAchievementDTO[],
  customResume?: StudentResumeProfileDTO
) {
  const htmlContent = generateOfficialResumeHtml(student, achievements, customResume);

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
}

/**
 * Official Word (.doc) export matching /dashboard/documents style
 */
export async function exportStudentResumeDocx(
  student: StudentCardDTO,
  achievements: StudentAchievementDTO[],
  customResume?: StudentResumeProfileDTO
) {
  const htmlContent = generateOfficialResumeHtml(student, achievements, customResume);

  const wordHtml = htmlContent.replace(
    "<html lang=\"ru\">",
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' lang='ru'>"
  );

  const blob = new Blob(["\ufeff", wordHtml], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Резюме_${student.name.replace(/\s+/g, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.add({
    title: "Официальный бланк резюме скачан для Microsoft Word",
    type: "success",
  });
}
