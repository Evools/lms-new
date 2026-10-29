"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Download,
  FileText,
} from "lucide-react";
import {
  StudentCardDTO,
  StudentAchievementDTO,
  StudentResumeProfileDTO,
} from "../../actions";
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_LEVELS } from "./achievement-dialog";
import { LANGUAGE_LEVEL_LABELS, SKILL_LEVEL_LABELS } from "./student-resume-dialog";
import {
  printStudentResume,
  exportStudentResumeDocx,
} from "../_lib/export-student-resume";

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentCardDTO;
  achievements: StudentAchievementDTO[];
  resumeProfile?: StudentResumeProfileDTO;
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
  resumeProfile,
}: ResumePreviewModalProps) {
  const resume = resumeProfile || student.resumeProfile;
  const dateFormatted = new Date().toLocaleDateString("ru-RU");
  const curatorName = student.curatorName || "Вопольский Виктор Владимирович";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="place-items-start text-left gap-1">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Официальный бланк резюме студента
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Резюме выпускника / студента — {student.name} ({student.groupName})
          </DialogDescription>
        </DialogHeader>

        {/* Printable A4 Sheet (Strict official style matching /dashboard/documents) */}
        <div className="bg-white text-zinc-900 border border-border p-6 rounded font-sans text-xs leading-relaxed">
          {/* Official Header */}
          <div className="text-center pb-2 mb-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-900">
              МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ
            </p>
            <p className="text-sm font-extrabold uppercase tracking-wide text-zinc-950 mt-0.5">
              ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98
            </p>
          </div>
          <hr className="border-t-[1.5px] border-zinc-950 mb-3" />

          {/* Meta row */}
          <div className="flex justify-between items-start mb-3 text-[11px] font-sans">
            <div>
              Дата формирования: <span className="font-semibold">{dateFormatted} г.</span>
            </div>
            <div className="text-right font-medium text-zinc-800">
              По месту требования / Для практики и трудоустройства
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wide text-zinc-950">
              РЕЗЮМЕ ВЫПУСКНИКА / СТУДЕНТА
            </h3>
          </div>

          {/* Main Student Details Table */}
          <table className="w-full border-collapse border border-zinc-800 text-[11px] font-sans mb-3">
            <tbody>
              <tr className="border-b border-zinc-800">
                <td className="border border-zinc-800 p-1.5 bg-zinc-100 font-bold w-[34%]">
                  Ф.И.О. студента:
                </td>
                <td className="border border-zinc-800 p-1.5 font-bold text-zinc-950">
                  {student.name}
                </td>
              </tr>
              <tr className="border-b border-zinc-800">
                <td className="border border-zinc-800 p-1.5 bg-zinc-100 font-bold">
                  Учебная группа и курс:
                </td>
                <td className="border border-zinc-800 p-1.5">
                  {student.groupName} ({student.course} курс)
                  {student.rollNumber ? `, поименный № ${student.rollNumber}` : ""}
                </td>
              </tr>
              <tr className="border-b border-zinc-800">
                <td className="border border-zinc-800 p-1.5 bg-zinc-100 font-bold">
                  Специальность:
                </td>
                <td className="border border-zinc-800 p-1.5">
                  {student.specialtyName || "Информационные системы и программирование"}
                </td>
              </tr>
              {resume?.desiredPosition && (
                <tr className="border-b border-zinc-800">
                  <td className="border border-zinc-800 p-1.5 bg-zinc-100 font-bold">
                    Желаемая должность / профиль:
                  </td>
                  <td className="border border-zinc-800 p-1.5 font-semibold">
                    {resume.desiredPosition}
                    {resume.workFormat ? ` (${resume.workFormat})` : ""}
                  </td>
                </tr>
              )}
              <tr className="border-b border-zinc-800">
                <td className="border border-zinc-800 p-1.5 bg-zinc-100 font-bold">
                  Контактные данные:
                </td>
                <td className="border border-zinc-800 p-1.5">
                  {student.phone ? `Тел.: ${student.phone}; ` : ""}Email: {student.email}
                </td>
              </tr>
              <tr>
                <td className="border border-zinc-800 p-1.5 bg-zinc-100 font-bold">
                  Успеваемость и посещаемость:
                </td>
                <td className="border border-zinc-800 p-1.5">
                  Средний балл (GPA):{" "}
                  <span className="font-bold">{student.academics.averageGrade || "—"}</span> •{" "}
                  Посещаемость занятий:{" "}
                  <span className="font-bold">{student.attendance.percent}%</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* About Me */}
          {resume?.aboutMe && (
            <p className="text-justify my-2.5 text-[11px] leading-relaxed font-sans">
              <span className="font-bold">Краткая характеристика и цель: </span>
              {resume.aboutMe}
            </p>
          )}

          {/* 1. Languages Table */}
          {resume && resume.languages.length > 0 && (
            <div className="my-3">
              <div className="font-extrabold text-[11px] uppercase text-zinc-950 mb-1">
                1. Знание языков
              </div>
              <table className="w-full border-collapse border border-zinc-800 text-[10.5px] font-sans">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-800 font-bold">
                    <th className="border border-zinc-800 p-1 text-center w-8">№</th>
                    <th className="border border-zinc-800 p-1 text-left">Язык</th>
                    <th className="border border-zinc-800 p-1 text-left">Степень владения</th>
                  </tr>
                </thead>
                <tbody>
                  {resume.languages.map((lang, idx) => (
                    <tr key={lang.id} className="border-b border-zinc-800">
                      <td className="border border-zinc-800 p-1 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="border border-zinc-800 p-1 font-semibold">
                        {lang.language}
                      </td>
                      <td className="border border-zinc-800 p-1">
                        {LANGUAGE_LEVEL_LABELS[lang.level]?.label || lang.level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Hard Skills Table */}
          {resume && resume.hardSkills.length > 0 && (
            <div className="my-3">
              <div className="font-extrabold text-[11px] uppercase text-zinc-950 mb-1">
                2. Профессиональные навыки и компетенции (что умеет студент)
              </div>
              <table className="w-full border-collapse border border-zinc-800 text-[10.5px] font-sans">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-800 font-bold">
                    <th className="border border-zinc-800 p-1 text-center w-8">№</th>
                    <th className="border border-zinc-800 p-1 text-left">
                      Профессиональный навык / Компетенция
                    </th>
                    <th className="border border-zinc-800 p-1 text-left w-40">
                      Уровень освоения
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resume.hardSkills.map((skill, idx) => (
                    <tr key={skill.id} className="border-b border-zinc-800">
                      <td className="border border-zinc-800 p-1 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="border border-zinc-800 p-1 font-semibold">
                        {skill.name}
                      </td>
                      <td className="border border-zinc-800 p-1">
                        {SKILL_LEVEL_LABELS[skill.level]?.label || skill.level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Soft Skills */}
          {resume && resume.softSkills.length > 0 && (
            <p className="text-justify my-2.5 text-[11px] leading-relaxed font-sans">
              <span className="font-bold">Личные и деловые качества: </span>
              {resume.softSkills.join(", ")}.
            </p>
          )}

          {/* 3. Practice & Projects */}
          {resume && resume.projects.length > 0 && (
            <div className="my-3">
              <div className="font-extrabold text-[11px] uppercase text-zinc-950 mb-1">
                3. Производственная практика и учебные проекты
              </div>
              <table className="w-full border-collapse border border-zinc-800 text-[10.5px] font-sans">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-800 font-bold">
                    <th className="border border-zinc-800 p-1 text-left w-36">Период</th>
                    <th className="border border-zinc-800 p-1 text-left">
                      Проект / Место практики и выполняемые задачи
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resume.projects.map((proj) => (
                    <tr key={proj.id} className="border-b border-zinc-800">
                      <td className="border border-zinc-800 p-1 align-top">
                        {proj.period || "За период обучения"}
                      </td>
                      <td className="border border-zinc-800 p-1">
                        <div className="font-bold">
                          {proj.title}
                          {proj.role ? ` — ${proj.role}` : ""}
                        </div>
                        {proj.description && (
                          <div className="text-zinc-700 mt-0.5">{proj.description}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Achievements Table (only if student has achievements) */}
          {achievements.length > 0 && (
            <div className="my-3">
              <div className="font-extrabold text-[11px] uppercase text-zinc-950 mb-1">
                4. Олимпиады, сертификаты и достижения
              </div>
              <table className="w-full border-collapse border border-zinc-800 text-[10.5px] font-sans">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-800 font-bold">
                    <th className="border border-zinc-800 p-1 text-center w-8">№</th>
                    <th className="border border-zinc-800 p-1 text-left">
                      Наименование мероприятия / достижения
                    </th>
                    <th className="border border-zinc-800 p-1 text-left w-28">Уровень</th>
                    <th className="border border-zinc-800 p-1 text-left w-24">Результат</th>
                    <th className="border border-zinc-800 p-1 text-center w-20">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.map((item, idx) => (
                    <tr key={item.id} className="border-b border-zinc-800">
                      <td className="border border-zinc-800 p-1 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="border border-zinc-800 p-1">
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-[9.5px] text-zinc-600">
                          {getCategoryLabel(item.category)}
                          {item.issuer ? ` • ${item.issuer}` : ""}
                        </div>
                      </td>
                      <td className="border border-zinc-800 p-1">{getLevelLabel(item.level)}</td>
                      <td className="border border-zinc-800 p-1 font-semibold">
                        {item.place || "Участник"}
                      </td>
                      <td className="border border-zinc-800 p-1 text-center font-mono">
                        {item.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures Block (matching /dashboard/documents) */}
          <div className="mt-6 pt-3 border-t border-zinc-300 flex justify-between items-end gap-6 text-[11px] font-sans">
            <div>
              <p className="font-bold text-zinc-950">Мастер группы (куратор):</p>
              <p className="text-[9px] text-zinc-500 mt-1.5">
                (подпись) _______________________
              </p>
              <p className="font-bold text-zinc-950 text-[11px] mt-1.5">
                {curatorName}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-zinc-950">
                Зам. директора по учебной части:
              </p>
              <p className="text-[9px] text-zinc-500 mt-1.5">
                (подпись) _______________________
              </p>
              <p className="font-bold text-zinc-950 text-[11px] mt-1.5">
                Тоялиева М. Р.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printStudentResume(student, achievements, resume)}
            className="h-8 text-xs gap-1"
          >
            <Printer className="h-3.5 w-3.5" />
            Печать / PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportStudentResumeDocx(student, achievements, resume)}
            className="h-8 text-xs gap-1"
          >
            <Download className="h-3.5 w-3.5" />
            Скачать Word
          </Button>
          <Button size="sm" onClick={onClose} className="h-8 text-xs">
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
