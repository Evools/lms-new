"use client";

import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Download,
  X,
  FileText,
  Award,
  Calendar,
  Building,
} from "lucide-react";
import { StudentCardDTO, StudentAchievementDTO } from "../../actions";
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_LEVELS } from "./achievement-dialog";
import { exportStudentResumeDocx } from "../_lib/export-student-resume";

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentCardDTO;
  achievements: StudentAchievementDTO[];
}

function getCategoryLabel(cat: StudentAchievementDTO["category"]): string {
  return ACHIEVEMENT_CATEGORIES.find((c) => c.value === cat)?.label.split("/")[0].trim() || cat;
}

function getLevelLabel(lvl: StudentAchievementDTO["level"]): string {
  return ACHIEVEMENT_LEVELS.find((l) => l.value === lvl)?.label || lvl;
}

export function ResumePreviewModal({
  isOpen,
  onClose,
  student,
  achievements,
}: ResumePreviewModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Hidden iframe silent print: prints only the A4 document without opening any new tabs or windows!
  const handlePrint = () => {
    if (!sheetRef.current) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const htmlContent = sheetRef.current.innerHTML;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>Резюме и портфолио — ${student.name}</title>
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
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .institution {
            font-size: 9.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #4b5563;
            margin-bottom: 3px;
          }
          .doc-title {
            font-size: 13.5pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 3px 0;
          }
          .doc-subtitle {
            font-size: 9.5pt;
            color: #4b5563;
          }
          .profile-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 20px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
            font-size: 9.5pt;
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
            font-size: 10.5pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1.5px solid #d1d5db;
            padding-bottom: 2px;
            margin: 12px 0 6px 0;
          }
          .kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin-bottom: 12px;
          }
          .kpi-card {
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 4px 6px;
            text-align: center;
            background: #ffffff;
          }
          .kpi-label {
            font-size: 8pt;
            color: #6b7280;
            text-transform: uppercase;
          }
          .kpi-value {
            font-size: 12pt;
            font-weight: bold;
            color: #111827;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-top: 4px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 5px 6px;
            vertical-align: middle;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            text-align: left;
            font-size: 8.5pt;
            text-transform: uppercase;
          }
          .footer-signs {
            margin-top: 28px;
            display: flex;
            justify-content: space-between;
            font-size: 9.5pt;
          }
          .sign-block {
            width: 45%;
          }
          .sign-line {
            border-bottom: 1px solid #111827;
            margin-top: 20px;
            margin-bottom: 3px;
          }
          .sign-hint {
            font-size: 8pt;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] sm:max-w-5xl md:max-w-6xl max-h-[94vh] p-0 gap-0 overflow-hidden flex flex-col bg-card border border-border shadow-2xl"
      >
        {/* Top Control Bar in Modal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground truncate">
              Предпросмотр официального резюме и портфолио
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="xs"
              variant="outline"
              onClick={() => exportStudentResumeDocx(student, achievements)}
              className="h-7 px-2.5 gap-1 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5"
              title="Скачать официальный файл Word (.docx)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Word (.docx)</span>
            </Button>

            <Button
              size="xs"
              onClick={handlePrint}
              className="h-7 px-3 gap-1.5 text-xs font-medium"
              title="Печать или сохранение в PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Печать / Сохранить в PDF</span>
            </Button>

            <Button
              size="xs"
              variant="ghost"
              onClick={onClose}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Full 100% modal preview content (Flat, No shadows, No outer padding frames) */}
        <div
          ref={sheetRef}
          className="overflow-y-auto flex-1 p-5 sm:p-7 bg-card text-foreground select-text space-y-4 w-full"
        >
          {/* Header */}
          <div className="text-center border-b pb-3 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
              Официальный документ • Лицей LMS
            </div>
            <h1 className="text-base sm:text-lg font-bold uppercase tracking-tight text-foreground">
              Портфолио и резюме выпускника / студента
            </h1>
            <div className="text-xs text-muted-foreground">
              Сводная ведомость академической успеваемости и внеучебных достижений
            </div>
          </div>

          {/* Student Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 p-3 rounded-lg border bg-muted/30 text-xs">
            <div className="flex items-center justify-between gap-2 border-b sm:border-b-0 pb-1 sm:pb-0">
              <span className="text-muted-foreground">Ф.И.О. студента:</span>
              <span className="font-semibold text-foreground text-right">{student.name}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-b sm:border-b-0 pb-1 sm:pb-0">
              <span className="text-muted-foreground">Группа:</span>
              <span className="font-semibold text-foreground text-right">
                {student.groupName} ({student.course} курс)
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 border-b sm:border-b-0 pb-1 sm:pb-0">
              <span className="text-muted-foreground">Специальность:</span>
              <span className="font-semibold text-foreground text-right">{student.specialtyName || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-b sm:border-b-0 pb-1 sm:pb-0">
              <span className="text-muted-foreground">Поименный № (П/Н):</span>
              <span className="font-mono font-bold text-foreground text-right">{student.rollNumber || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-b sm:border-b-0 pb-1 sm:pb-0">
              <span className="text-muted-foreground">Куратор:</span>
              <span className="font-semibold text-foreground text-right">{student.curatorName || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Дата зачисления:</span>
              <span className="font-mono text-foreground text-right">{student.joinedAt}</span>
            </div>
          </div>

          {/* Academic KPIs Section */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              Академическая успеваемость и дисциплина
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="border rounded-lg p-2.5 bg-background text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-medium">Средний балл (GPA)</div>
                <div className="text-base font-bold font-mono text-foreground mt-0.5">
                  {student.academics.averageGrade || "—"}
                </div>
              </div>
              <div className="border rounded-lg p-2.5 bg-background text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-medium">Посещаемость</div>
                <div className="text-base font-bold font-mono text-foreground mt-0.5">
                  {student.attendance.percent}%
                </div>
              </div>
              <div className="border rounded-lg p-2.5 bg-background text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-medium">Сдано заданий</div>
                <div className="text-base font-bold font-mono text-foreground mt-0.5">
                  {student.academics.submittedAssignments}
                </div>
              </div>
              <div className="border rounded-lg p-2.5 bg-background text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-medium">Пропусков (Н/Б)</div>
                <div className="text-base font-bold font-mono text-foreground mt-0.5">
                  {student.attendance.absent + student.attendance.excused}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              Внеучебные достижения, олимпиады и сертификаты ({achievements.length})
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-muted/70 border-b text-[11px] text-muted-foreground">
                    <th className="p-2 border-r text-center w-10 font-semibold">№</th>
                    <th className="p-2 border-r font-semibold">Мероприятие / Достижение</th>
                    <th className="p-2 border-r font-semibold w-36">Категория</th>
                    <th className="p-2 border-r font-semibold w-36">Уровень</th>
                    <th className="p-2 border-r font-semibold w-28">Результат</th>
                    <th className="p-2 border-r text-center font-semibold w-24">Дата</th>
                    <th className="p-2 font-semibold w-36">Организатор</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.length > 0 ? (
                    achievements.map((item, idx) => (
                      <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="p-2 border-r text-center font-mono text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="p-2 border-r">
                          <div className="font-semibold text-foreground">{item.title}</div>
                          {item.description && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="p-2 border-r text-muted-foreground">{getCategoryLabel(item.category)}</td>
                        <td className="p-2 border-r text-muted-foreground">{getLevelLabel(item.level)}</td>
                        <td className="p-2 border-r font-bold text-emerald-600 dark:text-emerald-400">
                          {item.place || "Участник"}
                        </td>
                        <td className="p-2 border-r text-center font-mono text-[11px]">
                          {item.date}
                        </td>
                        <td className="p-2 text-muted-foreground">
                          {item.issuer || "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-6 text-center text-muted-foreground italic text-xs"
                      >
                        Внеучебных достижений пока не зафиксировано
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Signatures Block */}
          <div className="pt-6 border-t flex flex-row justify-between items-end text-xs text-muted-foreground">
            <div className="w-[45%]">
              <div>Куратор учебной группы:</div>
              <div className="border-b border-foreground/40 mt-8 mb-1"></div>
              <div className="text-[10px] text-center">
                (подпись / {student.curatorName || "расшифровка"})
              </div>
            </div>

            <div className="w-[45%] text-right">
              <div>Учебная часть / Заведующий отделением:</div>
              <div className="border-b border-foreground/40 mt-8 mb-1"></div>
              <div className="text-[10px] text-center">
                М.П. (подпись / {new Date().toLocaleDateString("ru-RU")})
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
