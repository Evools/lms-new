"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import {
  ScholarshipGroupInfo,
  SavedScholarshipRecord,
  ScholarshipStatus,
} from "./types";
import {
  formatMonthKeyToLabel,
  calculateStudentRow,
  calculateSummaryKPI,
  parseGradeString,
} from "../_lib/scholarship-calculator";
import { exportScholarshipDocx } from "../_lib/export-scholarship-docx";
import { saveScholarshipRecordAction } from "../actions";
import { AddSubjectDialog } from "./dialogs/add-subject-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Award,
  BookMarked,
  CheckCircle2,
  CheckCircle,
  XCircle,
  Users,
  Search,
  Plus,
  Printer,
  Download,
  Save,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  X,
  Hash,
} from "lucide-react";

interface ScholarshipViewProps {
  groups: ScholarshipGroupInfo[];
  initialGroupId: string;
  initialMonth: string;
  initialRecord: SavedScholarshipRecord | null;
}

export function ScholarshipView({
  groups,
  initialGroupId,
  initialMonth,
  initialRecord,
}: ScholarshipViewProps) {
  const [isPending, startTransition] = useTransition();

  // State: selected group & month
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);

  const currentGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0];
  }, [groups, selectedGroupId]);

  // Subjects for the active statement
  const [subjects, setSubjects] = useState<string[]>(() => {
    if (initialRecord?.subjects && initialRecord.subjects.length > 0) {
      return initialRecord.subjects;
    }
    if (currentGroup?.defaultSubjects && currentGroup.defaultSubjects.length > 0) {
      return currentGroup.defaultSubjects;
    }
    return ["Алгебра", "Русский язык", "Информатика", "Веб-разработка"];
  });

  // Roll numbers state (Поименный номер): Record<studentId, string>
  const [rollNumbers, setRollNumbers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    // 1. Populate from students permanent profile in DB
    groups.forEach((g) => {
      g.students.forEach((s) => {
        if (s.rollNumber) {
          initial[s.id] = String(s.rollNumber);
        }
      });
    });
    // 2. Also merge from current saved record
    if (initialRecord?.gradesData) {
      Object.entries(initialRecord.gradesData).forEach(([studentId, item]) => {
        if (item?.rollNumber) {
          initial[studentId] = String(item.rollNumber);
        }
      });
    }
    return initial;
  });

  // Grades state: Record<studentId, Record<subjectName, string>> (e.g. "54554")
  const [gradesData, setGradesData] = useState<Record<string, Record<string, string>>>(() => {
    if (initialRecord?.gradesData) {
      const initial: Record<string, Record<string, string>> = {};
      Object.entries(initialRecord.gradesData).forEach(([studentId, item]) => {
        initial[studentId] = {};
        if (item?.grades) {
          Object.entries(item.grades).forEach(([subj, gVal]) => {
            initial[studentId][subj] = gVal !== null && gVal !== undefined ? String(gVal) : "";
          });
        }
      });
      return initial;
    }
    return {};
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ScholarshipStatus>("ALL");

  // Save feedback state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Add subject dialog
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);

  // Local storage auto-draft state
  const [restoredFromDraft, setRestoredFromDraft] = useState(false);
  const draftKey = `scholarship_draft_${selectedGroupId}_${selectedMonth}`;

  // 1. Protection: warn if user tries to close tab or leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 2. Recovery: on group or month switch, check for any uncommitted local draft
  useEffect(() => {
    if (typeof window === "undefined" || !selectedGroupId || !selectedMonth) return;
    try {
      const savedRaw = localStorage.getItem(draftKey);
      if (savedRaw) {
        const draft = JSON.parse(savedRaw);
        if (draft && draft.gradesData && Object.keys(draft.gradesData).length > 0) {
          setGradesData(draft.gradesData);
          if (draft.rollNumbers) {
            setRollNumbers((prev) => ({ ...prev, ...draft.rollNumbers }));
          }
          if (draft.subjects && Array.isArray(draft.subjects) && draft.subjects.length > 0) {
            setSubjects(draft.subjects);
          }
          setRestoredFromDraft(true);
          setHasUnsavedChanges(true);
        }
      } else {
        setRestoredFromDraft(false);
      }
    } catch (e) {
      console.warn("Failed to check local draft", e);
    }
  }, [selectedGroupId, selectedMonth, draftKey]);

  // 3. Auto-save draft to localStorage whenever grades or roll numbers change (0 database load)
  useEffect(() => {
    if (typeof window === "undefined" || !selectedGroupId || !selectedMonth) return;
    if (!hasUnsavedChanges) return;

    try {
      const draft = {
        groupId: selectedGroupId,
        month: selectedMonth,
        subjects,
        gradesData,
        rollNumbers,
        timestamp: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (e) {
      console.warn("Failed to auto-save local draft", e);
    }
  }, [gradesData, rollNumbers, subjects, selectedGroupId, selectedMonth, hasUnsavedChanges, draftKey]);

  // Discard local draft and revert to database values
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {}

    if (initialRecord?.gradesData) {
      const initial: Record<string, Record<string, string>> = {};
      Object.entries(initialRecord.gradesData).forEach(([studentId, item]) => {
        initial[studentId] = {};
        if (item?.grades) {
          Object.entries(item.grades).forEach(([subj, gVal]) => {
            initial[studentId][subj] = gVal !== null && gVal !== undefined ? String(gVal) : "";
          });
        }
      });
      setGradesData(initial);
    } else {
      setGradesData({});
    }
    setRestoredFromDraft(false);
    setHasUnsavedChanges(false);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [yearStr, monthNumStr] = selectedMonth.split("-");
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthNumStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y--;
    }
    const newMonth = `${y}-${String(m).padStart(2, "0")}`;
    setSelectedMonth(newMonth);
    setHasUnsavedChanges(true);
  };

  const handleNextMonth = () => {
    const [yearStr, monthNumStr] = selectedMonth.split("-");
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthNumStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y++;
    }
    const newMonth = `${y}-${String(m).padStart(2, "0")}`;
    setSelectedMonth(newMonth);
    setHasUnsavedChanges(true);
  };

  // Group switch handler
  const handleGroupChange = (newGroupId: string) => {
    setSelectedGroupId(newGroupId);
    const grp = groups.find((g) => g.id === newGroupId);
    if (grp) {
      if (grp.defaultSubjects.length > 0) {
        setSubjects(grp.defaultSubjects);
      }
    }
    setHasUnsavedChanges(true);
  };

  // Add subject to statement
  const handleAddSubject = (subjectName: string) => {
    if (!subjects.includes(subjectName)) {
      setSubjects((prev) => [...prev, subjectName]);
      setHasUnsavedChanges(true);
    }
  };

  // Remove subject from statement
  const handleRemoveSubject = (subjectName: string) => {
    setSubjects((prev) => prev.filter((s) => s !== subjectName));
    setGradesData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((stId) => {
        if (updated[stId]) {
          const studentGrades = { ...updated[stId] };
          delete studentGrades[subjectName];
          updated[stId] = studentGrades;
        }
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Set roll number (Поименный номер)
  const handleSetRollNumber = (studentId: string, val: string) => {
    setRollNumbers((prev) => ({
      ...prev,
      [studentId]: val.trim(),
    }));
    setHasUnsavedChanges(true);
  };

  // Set grade string for student & subject (e.g. "54554")
  const handleSetGrade = (studentId: string, subject: string, val: string) => {
    // Keep numbers 1-5, comma, space
    const cleaned = val.replace(/[^1-5, ]/g, "");
    setGradesData((prev) => {
      const studentGrades = { ...(prev[studentId] || {}) };
      if (!cleaned) {
        delete studentGrades[subject];
      } else {
        studentGrades[subject] = cleaned;
      }
      return {
        ...prev,
        [studentId]: studentGrades,
      };
    });
    setHasUnsavedChanges(true);
  };

  // Calculate full rows for all students in group
  const calculatedRows = useMemo(() => {
    if (!currentGroup?.students) return [];
    return currentGroup.students.map((st) => {
      const stGrades = gradesData[st.id] || {};
      const stRollNumber = rollNumbers[st.id] || "";
      return calculateStudentRow(st.id, st.name, st.avatar, stRollNumber, stGrades, subjects);
    });
  }, [currentGroup, gradesData, rollNumbers, subjects]);

  // KPI Metrics
  const summaryKPI = useMemo(() => {
    return calculateSummaryKPI(calculatedRows);
  }, [calculatedRows]);

  // Filtered rows for interactive table
  const filteredRows = useMemo(() => {
    return calculatedRows.filter((row) => {
      const matchesSearch = row.studentName
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      return row.status === statusFilter;
    });
  }, [calculatedRows, searchQuery, statusFilter]);

  // Save to database
  const handleSave = () => {
    if (!currentGroup) return;

    startTransition(async () => {
      try {
        const payloadGrades: Record<string, any> = {};
        calculatedRows.forEach((r) => {
          payloadGrades[r.studentId] = {
            grades: r.grades,
            rollNumber: rollNumbers[r.studentId] || "",
            status: r.status,
            averageGrade: r.averageGrade,
          };
        });

        await saveScholarshipRecordAction({
          groupId: currentGroup.id,
          month: selectedMonth,
          monthLabel: formatMonthKeyToLabel(selectedMonth),
          subjects,
          gradesData: payloadGrades,
        });

        // Clear local draft upon successful database save
        try {
          localStorage.removeItem(draftKey);
        } catch (e) {}

        setRestoredFromDraft(false);
        setHasUnsavedChanges(false);
        setSaveSuccessMessage("Ведомость успешно сохранена в базу данных");
        setTimeout(() => setSaveSuccessMessage(null), 3500);
      } catch (err: any) {
        console.error("Save error:", err);
        alert(err?.message || "Ошибка при сохранении ведомости");
      }
    });
  };

  // Export Word (.docx) - exact matching template from screenshot
  const handleExportWord = async () => {
    if (!currentGroup) return;
    try {
      await exportScholarshipDocx({
        groupName: currentGroup.name,
        monthLabel: formatMonthKeyToLabel(selectedMonth),
        students: calculatedRows,
        specialtyName: currentGroup.specialtyName || "Разработчик Веб и мультимедийных приложений",
        curatorName: currentGroup.curatorName || "Вопольский В.В",
      });
    } catch (e: any) {
      console.error("Export error:", e);
      alert("Ошибка при экспорте документа в Word: " + e?.message);
    }
  };

  // Quick fill helper (demo filling with multi-grades, e.g. "54554")
  const handleQuickFillDemo = () => {
    if (!currentGroup?.students) return;
    const newGrades: Record<string, Record<string, string>> = {};
    const newRolls: Record<string, string> = {};
    let rollCounter = 3960;

    currentGroup.students.forEach((st, idx) => {
      rollCounter += Math.floor(Math.random() * 5) + 2;
      newRolls[st.id] = String(rollCounter);

      const studentGrades: Record<string, string> = {};
      subjects.forEach((subj, sIdx) => {
        if (idx === 0) {
          studentGrades[subj] = "5555"; // Отличник (только 5)
        } else if (idx <= 4) {
          studentGrades[subj] = sIdx % 2 === 0 ? "54554" : "5455"; // Ударник (4 и 5)
        } else if (idx === 5) {
          studentGrades[subj] = sIdx === 0 ? "5435" : "4554"; // Тройка -> Снят со стипендии
        } else {
          const demoOptions = ["5545", "54554", "555", "4454", "5345", "5544"];
          studentGrades[subj] = demoOptions[(idx + sIdx) % demoOptions.length];
        }
      });
      newGrades[st.id] = studentGrades;
    });

    setGradesData(newGrades);
    setRollNumbers((prev) => ({ ...prev, ...newRolls }));
    setHasUnsavedChanges(true);
  };

  const handleClearAllGrades = () => {
    setGradesData({});
    setHasUnsavedChanges(true);
  };

  // Students for the official document: Excellent and Good
  const excellentStudents = calculatedRows.filter((s) => s.status === "EXCELLENT");
  const goodStudents = calculatedRows.filter((s) => s.status === "GOOD");

  return (
    <div className="space-y-3 text-xs">
      {/* PRINT STYLES: Completely hides dashboard sidebar, header, buttons and prints clean document */}
      <style jsx global>{`
        @media print {
          /* Hide sidebar, layout headers, and all screen UI */
          aside,
          header,
          nav,
          [data-sidebar="sidebar"],
          [data-slot="sidebar"],
          .no-print,
          button,
          input,
          .screen-only-view {
            display: none !important;
          }

          body,
          main,
          #root,
          .dashboard-container {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          .scholarship-printable-doc {
            display: block !important;
            width: 100% !important;
            padding: 20mm 15mm !important;
            color: #000000 !important;
            background: #ffffff !important;
            font-family: "Times New Roman", Times, serif !important;
          }
        }

        @media screen {
          .scholarship-printable-doc {
            display: none;
          }
        }
      `}</style>

      {/* SCREEN UI (Hidden during print) */}
      <div className="screen-only-view space-y-3">
        {/* Top Main Card */}
        <div className="bg-card border rounded-xl p-3.5 space-y-3">
          {/* Title & Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div>
              <h1 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                Ведомость успеваемости и формирования стипендии
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Вносите оценки студентов (например, <strong>54554</strong> или <strong>5</strong>) и их поименные номера. Студенты с хотя бы одной тройкой или двойкой не включаются в приказ на стипендию.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-6 px-2 border-amber-500/40 text-amber-700 bg-amber-500/10"
                >
                  Есть несохраненные изменения
                </Badge>
              )}

              {saveSuccessMessage && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-6 px-2 border-emerald-500/40 text-emerald-700 bg-emerald-500/10"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  {saveSuccessMessage}
                </Badge>
              )}

              <Button
                size="xs"
                variant="outline"
                onClick={handleExportWord}
                className="h-8 gap-1.5 font-medium border-primary/40 text-primary hover:bg-primary/10"
                title="Выгрузить официальный документ в Word 1-в-1 по шаблону"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Экспорт в Word (.docx)</span>
              </Button>

              <Button
                size="xs"
                variant="outline"
                onClick={() => window.print()}
                className="h-8 gap-1.5 font-medium"
                title="Печать официального документа (без сайдбара и лишних элементов)"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Печать</span>
              </Button>

              <Button
                size="xs"
                onClick={handleSave}
                disabled={isPending}
                className="h-8 gap-1.5 font-medium"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isPending ? "Сохранение..." : "Сохранить ведомость"}</span>
              </Button>
            </div>
          </div>

          {/* Group Selector & Month Stepper Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-center">
            {/* Group Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                Учебная группа:
              </label>
              <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="h-8 text-xs bg-background w-full font-medium">
                  <SelectValue placeholder="Выберите группу">
                    {currentGroup
                      ? `Группа ${currentGroup.name} (${currentGroup.students.length} студентов)`
                      : "Выберите группу"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="font-semibold text-foreground">Группа {g.name}</span>
                        <span className="text-muted-foreground text-[11px]">
                          {g.specialtyName ? `${g.specialtyName} • ` : ""}
                          {g.students.length} студ.
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Stepper */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">
                Отчетный месяц:
              </label>
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 p-0"
                  title="Предыдущий месяц"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="h-8 px-3 rounded-md border border-border bg-background flex items-center justify-center font-bold text-xs flex-1 text-center font-mono">
                  {formatMonthKeyToLabel(selectedMonth)}
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleNextMonth}
                  className="h-8 w-8 p-0"
                  title="Следующий месяц"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Fill / Clear Buttons */}
            <div className="space-y-1 flex flex-col justify-end">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Быстрые действия:
              </label>
              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleQuickFillDemo}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 border border-dashed"
                  title="Заполнить типовыми оценками и поименными номерами"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>Заполнить пример</span>
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleClearAllGrades}
                  className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
                  title="Очистить все выставленные оценки"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Очистить оценки</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Subjects list bar for current month */}
          <div className="p-2.5 rounded-lg bg-muted/30 border space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <BookMarked className="h-3.5 w-3.5 text-primary" />
                Предметы в ведомости этого месяца ({subjects.length}):
              </span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsAddSubjectOpen(true)}
                className="h-6 px-2 text-[11px] gap-1 font-medium bg-background border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="h-3 w-3" />
                <span>Добавить предмет</span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {subjects.length === 0 ? (
                <span className="text-muted-foreground text-[11px]">
                  В ведомости еще нет предметов. Нажмите «Добавить предмет».
                </span>
              ) : (
                subjects.map((subj) => (
                  <div
                    key={subj}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-foreground text-xs"
                  >
                    <span className="font-medium">{subj}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subj)}
                      className="p-0.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                      title={`Убрать ${subj} из ведомости`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <div className="p-2.5 rounded-lg border bg-background flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Всего студентов</span>
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-lg font-bold font-mono mt-1 text-foreground">
                {summaryKPI.totalStudents}
              </div>
              <span className="text-[10px] text-muted-foreground">В группе {currentGroup?.name}</span>
            </div>

            <div className="p-2.5 rounded-lg border bg-emerald-500/5 border-emerald-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-700 text-[11px]">
                <span className="font-semibold">Отличники</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="text-lg font-bold font-mono mt-1 text-emerald-600">
                {summaryKPI.excellentCount}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium">Повышенная стипендия (на «5»)</span>
            </div>

            <div className="p-2.5 rounded-lg border bg-blue-500/5 border-blue-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-700 text-[11px]">
                <span className="font-semibold">Ударники</span>
                <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="text-lg font-bold font-mono mt-1 text-blue-600">
                {summaryKPI.goodCount}
              </div>
              <span className="text-[10px] text-blue-700 font-medium">Обычная стипендия (на «5» и «4»)</span>
            </div>

            <div className="p-2.5 rounded-lg border bg-rose-500/5 border-rose-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-rose-700 text-[11px]">
                <span className="font-semibold">Сняты со стипендии</span>
                <XCircle className="h-3.5 w-3.5 text-rose-600" />
              </div>
              <div className="text-lg font-bold font-mono mt-1 text-rose-600">
                {summaryKPI.noScholarshipCount}
              </div>
              <span className="text-[10px] text-rose-700 font-medium">Есть хоть одна тройка/неуд</span>
            </div>

            <div className="p-2.5 rounded-lg border bg-background flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Средний балл группы</span>
                <Award className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="text-lg font-bold font-mono mt-1 text-primary">
                {summaryKPI.groupAverageGrade > 0 ? summaryKPI.groupAverageGrade.toFixed(2) : "—"}
              </div>
              <span className="text-[10px] text-muted-foreground">По всем дисциплинам</span>
            </div>
          </div>

          {/* Toolbar: Search & Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск студента по ФИО..."
                className="h-8 pl-8 pr-7 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`h-6 px-2.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Все ({calculatedRows.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("EXCELLENT")}
                className={`h-6 px-2.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === "EXCELLENT"
                    ? "bg-emerald-600 text-white"
                    : "text-muted-foreground hover:text-emerald-600"
                }`}
              >
                Отличники ({summaryKPI.excellentCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("GOOD")}
                className={`h-6 px-2.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === "GOOD"
                    ? "bg-blue-600 text-white"
                    : "text-muted-foreground hover:text-blue-600"
                }`}
              >
                Ударники ({summaryKPI.goodCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("NO_SCHOLARSHIP")}
                className={`h-6 px-2.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === "NO_SCHOLARSHIP"
                    ? "bg-rose-600 text-white"
                    : "text-muted-foreground hover:text-rose-600"
                }`}
              >
                Сняты со стипендии ({summaryKPI.noScholarshipCount})
              </button>
            </div>
          </div>

          {/* Local draft restored notice banner */}
          {restoredFromDraft && (
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 text-xs text-foreground">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>
                  <strong>Локальный черновик восстановлен:</strong> данные сохранены в вашем браузере при случайном закрытии или обрыве связи. Нажмите <strong>«Сохранить ведомость»</strong>, чтобы зафиксировать их в БД.
                </span>
              </div>
              <Button
                size="xs"
                variant="outline"
                onClick={handleDiscardDraft}
                className="h-6 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 font-medium"
              >
                Сбросить черновик
              </Button>
            </div>
          )}

          {/* SPREADSHEET TABLE: Matrix of students, roll numbers & subjects */}
          <div className="border rounded-lg overflow-x-auto bg-background">
            <table className="w-full text-xs border-collapse text-left table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-20" />
                <col className="w-56" />
                {subjects.map((s) => (
                  <col key={s} className="w-28" />
                ))}
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-44" />
              </colgroup>
              <thead>
                <tr className="bg-muted/50 border-b text-[11px] text-muted-foreground">
                  <th className="p-2 text-center border-r font-semibold">№</th>
                  <th className="p-2 text-center border-r font-semibold">П/Н</th>
                  <th className="p-2 text-left border-r font-semibold">
                    Ф.И.О. учащихся
                  </th>
                  {subjects.map((subj) => (
                    <th
                      key={subj}
                      className="p-2 text-center border-r font-semibold truncate"
                      title={subj}
                    >
                      {subj}
                    </th>
                  ))}
                  <th className="p-2 text-center border-r font-semibold">
                    Оценки (5/4/3/2)
                  </th>
                  <th className="p-2 text-center border-r font-semibold">
                    Ср. балл
                  </th>
                  <th className="p-2 text-center font-semibold">
                    Статус стипендии
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6 + subjects.length}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Студентов по выбранным условиям не найдено.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    return (
                      <tr
                        key={row.studentId}
                        className="hover:bg-muted/10 transition-colors h-10"
                      >
                        <td className="p-2 text-center font-mono text-muted-foreground border-r">
                          {idx + 1}
                        </td>

                        {/* Поименный номер (П/Н) - только показ, без ввода */}
                        <td className="p-2 text-center font-mono text-xs text-foreground/80 border-r" title="Поименный номер студента">
                          {row.rollNumber || rollNumbers[row.studentId] || "—"}
                        </td>

                        <td className="p-2 font-medium text-foreground border-r truncate" title={row.studentName}>
                          <span className="font-semibold">{row.studentName}</span>
                        </td>

                        {/* Subject cells: Stable clean inputs, ZERO hover shaking */}
                        {subjects.map((subj) => {
                          const currentVal = row.grades[subj] || "";
                          const parsed = parseGradeString(currentVal);
                          const avg = row.subjectAverages[subj];
                          const hasBad = /[1-3]/.test(currentVal);
                          const isAll5 = parsed.length > 0 && !hasBad && parsed.every((g) => g === 5);
                          const isGood = parsed.length > 0 && !hasBad && parsed.some((g) => g === 4);

                          let inputClasses = "border-border bg-background text-foreground";
                          if (hasBad) {
                            inputClasses = "border-rose-400 bg-rose-500/15 text-rose-800 font-bold focus:border-rose-500";
                          } else if (isAll5) {
                            inputClasses = "border-emerald-400/50 bg-emerald-500/10 text-emerald-700 font-bold focus:border-emerald-500";
                          } else if (isGood) {
                            inputClasses = "border-blue-400/50 bg-blue-500/10 text-blue-700 font-bold focus:border-blue-500";
                          }

                          return (
                            <td
                              key={subj}
                              className="p-1 text-center border-r"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <input
                                  type="text"
                                  value={currentVal}
                                  onChange={(e) => handleSetGrade(row.studentId, subj, e.target.value)}
                                  placeholder="—"
                                  className={`h-7 w-full px-1.5 text-center text-xs font-mono tracking-wider rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${inputClasses}`}
                                  title={`Оценки по ${subj}. Вводите подряд, например: 54554 или 5`}
                                />
                                {avg !== null && (
                                  <span className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
                                    ср. {avg}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Grades counter breakdown */}
                        <td className="p-2 text-center border-r font-mono text-[11px]">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-emerald-600 font-bold" title="Количество 5-к">
                              {row.count5}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-blue-600 font-bold" title="Количество 4-к">
                              {row.count4}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span
                              className={`font-bold ${row.count3 > 0 ? "text-amber-700" : "text-muted-foreground"}`}
                              title="Количество 3-к"
                            >
                              {row.count3}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span
                              className={`font-bold ${row.count2 > 0 ? "text-rose-700" : "text-muted-foreground"}`}
                              title="Количество 2-к"
                            >
                              {row.count2}
                            </span>
                          </div>
                        </td>

                        {/* Average Grade */}
                        <td className="p-2 text-center font-mono font-bold text-foreground border-r">
                          {row.averageGrade > 0 ? row.averageGrade.toFixed(2) : "—"}
                        </td>

                        {/* Scholarship Status Badge */}
                        <td className="p-2 text-center">
                          {row.status === "EXCELLENT" && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] gap-1 font-semibold"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Отличник (на «5»)</span>
                            </Badge>
                          )}

                          {row.status === "GOOD" && (
                            <Badge
                              variant="outline"
                              className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-[10px] gap-1 font-semibold"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Ударник (на «5» и «4»)</span>
                            </Badge>
                          )}

                          {row.status === "NO_SCHOLARSHIP" && (
                            <Badge
                              variant="outline"
                              className="bg-rose-500/10 text-rose-700 border-rose-500/40 text-[10px] gap-1 font-semibold"
                              title={row.statusReason}
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Снят со стипендии</span>
                            </Badge>
                          )}

                          {row.status === "PENDING" && (
                            <span className="text-muted-foreground text-[11px]">
                              Нет оценок
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer info note */}
          <div className="p-2 rounded-lg bg-muted/20 border flex items-center gap-2 text-muted-foreground text-[11px]">
            <AlertTriangle className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Правило формирования стипендии: в официальный приказ включаются только учащиеся <strong>на «5»</strong> (отличники) и <strong>на «5» и «4»</strong> (ударники). При наличии хотя бы одной тройки студент исключается из списка.
            </span>
          </div>
        </div>

        {/* Add Subject Dialog */}
        <AddSubjectDialog
          open={isAddSubjectOpen}
          onOpenChange={setIsAddSubjectOpen}
          availableDefaultSubjects={currentGroup?.defaultSubjects || []}
          currentSubjects={subjects}
          onAddSubject={handleAddSubject}
        />
      </div>

      {/* DEDICATED OFFICIAL PRINTABLE DOCUMENT (Visible ONLY during window.print()) */}
      <div className="scholarship-printable-doc">
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <div style={{ fontWeight: "bold", fontSize: "14pt", lineHeight: 1.3 }}>
            Список учащихся группы «{currentGroup?.name}» по профессии
          </div>
          <div style={{ fontWeight: "bold", fontSize: "14pt", lineHeight: 1.3 }}>
            «{currentGroup?.specialtyName || "Разработчик Веб и мультимедийных приложений"} за{" "}
            {formatMonthKeyToLabel(selectedMonth).toLowerCase()}»
          </div>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1.5px solid #000000",
            fontSize: "11pt",
            fontFamily: "Times New Roman, serif",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px 4px",
                  textAlign: "center",
                  width: "12%",
                  fontWeight: "bold",
                }}
              >
                № п\п
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  textAlign: "center",
                  width: "60%",
                  fontWeight: "bold",
                }}
              >
                Ф.И.О. учащихся
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "6px 8px",
                  textAlign: "center",
                  width: "28%",
                  fontWeight: "bold",
                }}
              >
                Поименный номер
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Category 1: на «5» */}
            <tr>
              <td
                colSpan={3}
                style={{
                  border: "1px solid #000000",
                  padding: "5px 8px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                на «5»
              </td>
            </tr>
            {excellentStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    border: "1px solid #000000",
                    padding: "5px 8px",
                    textAlign: "center",
                  }}
                >
                  —
                </td>
              </tr>
            ) : (
              excellentStudents.map((st, idx) => (
                <tr key={st.studentId}>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "5px 6px",
                      textAlign: "left",
                    }}
                  >
                    {idx + 1}.
                  </td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "5px 8px",
                      textAlign: "left",
                    }}
                  >
                    {st.studentName}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "5px 8px",
                      textAlign: "center",
                    }}
                  >
                    {st.rollNumber || "—"}
                  </td>
                </tr>
              ))
            )}

            {/* Category 2: на «5» и «4» */}
            <tr>
              <td
                colSpan={3}
                style={{
                  border: "1px solid #000000",
                  padding: "5px 8px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                на «5» и «4»
              </td>
            </tr>
            {goodStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    border: "1px solid #000000",
                    padding: "5px 8px",
                    textAlign: "center",
                  }}
                >
                  —
                </td>
              </tr>
            ) : (
              goodStudents.map((st, idx) => (
                <tr key={st.studentId}>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "5px 6px",
                      textAlign: "left",
                    }}
                  >
                    {excellentStudents.length + idx + 1}.
                  </td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "5px 8px",
                      textAlign: "left",
                    }}
                  >
                    {st.studentName}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "5px 8px",
                      textAlign: "center",
                    }}
                  >
                    {st.rollNumber || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer Signature */}
        <div
          style={{
            marginTop: "60px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12pt",
            fontWeight: "bold",
          }}
        >
          <div>Мастер п/о _____________________</div>
          <div style={{ marginRight: "30px" }}>
            {currentGroup?.curatorName || "Вопольский В.В"}
          </div>
        </div>
      </div>
    </div>
  );
}
