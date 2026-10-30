"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
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
  const router = useRouter();
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

  // Navigation helper: loads month and group data from database
  const navigateTo = (newGroupId: string, newMonth: string) => {
    setSelectedGroupId(newGroupId);
    setSelectedMonth(newMonth);
    startTransition(() => {
      router.replace(`/dashboard/scholarship?group=${newGroupId}&month=${newMonth}`);
    });
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
    navigateTo(selectedGroupId, newMonth);
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
    navigateTo(selectedGroupId, newMonth);
  };

  // Group switch handler
  const handleGroupChange = (newGroupId: string) => {
    navigateTo(newGroupId, selectedMonth);
  };

  // Reset subjects to group curriculum defaults
  const handleResetToGroupSubjects = () => {
    if (currentGroup?.defaultSubjects && currentGroup.defaultSubjects.length > 0) {
      setSubjects(currentGroup.defaultSubjects);
      setHasUnsavedChanges(true);
    }
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

  const printAcademicYearInfo = useMemo(() => {
    let y = new Date().getFullYear();
    let m = new Date().getMonth() + 1;
    if (selectedMonth && selectedMonth.includes("-")) {
      const parts = selectedMonth.split("-");
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
    return {
      monthName: monthsRu[m - 1] || "сентябрь",
      academicYear: m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`,
    };
  }, [selectedMonth]);

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
        selectedMonth,
        students: calculatedRows,
        subjects,
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

          .scholarship-page-break {
            page-break-before: always;
            break-before: page;
            margin-top: 20mm;
          }
        }

        @media screen {
          .scholarship-printable-doc {
            display: none;
          }
        }
      `}</style>

      {/* SCREEN UI (Hidden during print) */}
      <div className="screen-only-view space-y-2.5">
        {/* Top Control Bar (Compact, Stable, No Jittering) */}
        <div className="bg-card border rounded-xl p-3 space-y-2.5 shadow-2xs">
          {/* Row 1: Title, Group Selector, Month Stepper, Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h1 className="text-sm font-bold text-foreground flex items-center gap-1.5 shrink-0">
                <Award className="h-4 w-4 text-primary" />
                Стипендия
              </h1>

              {/* Group Selector */}
              <div className="w-56 shrink-0">
                <Select
                  value={selectedGroupId}
                  onValueChange={handleGroupChange}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-7 text-xs bg-background w-full font-medium">
                    <SelectValue placeholder="Выберите группу">
                      {currentGroup
                        ? `${currentGroup.name} (${currentGroup.students.length} студ.)`
                        : "Выберите группу"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        <span className="font-semibold text-foreground">Группа {g.name}</span>{" "}
                        <span className="text-muted-foreground text-[11px]">({g.students.length} студ.)</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Stepper */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handlePrevMonth}
                  disabled={isPending}
                  className="h-7 w-7 p-0"
                  title="Предыдущий месяц"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <div className="h-7 px-2.5 rounded-md border border-border bg-background flex items-center justify-center font-bold text-xs text-center font-mono min-w-[130px]">
                  {isPending ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      Загрузка...
                    </span>
                  ) : (
                    formatMonthKeyToLabel(selectedMonth)
                  )}
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleNextMonth}
                  disabled={isPending}
                  className="h-7 w-7 p-0"
                  title="Следующий месяц"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] h-7 px-2.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Не сохранено
                </span>
              ) : saveSuccessMessage ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] h-7 px-2.5 rounded-md bg-muted text-foreground border border-border font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Сохранено
                </span>
              ) : null}

              <Button
                size="xs"
                variant="outline"
                onClick={handleExportWord}
                className="h-7 px-2.5 gap-1 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5"
                title="Выгрузить 2-страничный официальный документ в Word (.docx)"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Word (.docx)</span>
              </Button>

              <Button
                size="xs"
                variant="outline"
                onClick={() => window.print()}
                className="h-7 px-2.5 gap-1 text-xs font-medium"
                title="Печать 2 страниц ведомости и табеля (Ctrl+P)"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Печать</span>
              </Button>

              <Button
                size="xs"
                onClick={handleSave}
                disabled={isPending}
                className="h-7 px-3 gap-1.5 text-xs font-medium"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isPending ? "Сохранение..." : "Сохранить"}</span>
              </Button>
            </div>
          </div>

          {/* Row 2: Search, Filter Tabs, Summary Stats & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
            {/* Search & Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по ФИО..."
                  className="h-7 pl-8 pr-7 text-xs bg-background"
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

              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                    statusFilter === "ALL"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Все ({calculatedRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("EXCELLENT")}
                  className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                    statusFilter === "EXCELLENT"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Отличники ({summaryKPI.excellentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("GOOD")}
                  className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                    statusFilter === "GOOD"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Ударники ({summaryKPI.goodCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("NO_SCHOLARSHIP")}
                  className={`h-6 px-2.5 rounded-md font-medium transition-colors ${
                    statusFilter === "NO_SCHOLARSHIP"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Сняты ({summaryKPI.noScholarshipCount})
                </button>
              </div>
            </div>

            {/* Quick KPI stats & Quick demo fill */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="px-2 py-0.5 rounded bg-muted/60 border text-foreground font-mono">
                Ср. балл группы: <strong>{summaryKPI.groupAverageGrade > 0 ? summaryKPI.groupAverageGrade.toFixed(2) : "—"}</strong>
              </span>

              <Button
                size="xs"
                variant="outline"
                onClick={handleQuickFillDemo}
                className="h-6 px-2 text-[11px] font-medium text-primary border-primary/30 hover:bg-primary/10 gap-1"
                title="Заполнить типовыми реалистичными оценками"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Заполнить журнал</span>
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={handleClearAllGrades}
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                title="Очистить все оценки"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Очистить
              </Button>
            </div>
          </div>

          {/* Row 3: Disciplines pill list */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t text-[11px]">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
                <BookMarked className="h-3 w-3 text-primary" />
                Предметы ({subjects.length}):
              </span>
              {subjects.map((subj) => (
                <div
                  key={subj}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border border-border text-foreground text-[11px]"
                >
                  <span className="truncate max-w-[130px]">{subj}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(subj)}
                    className="text-muted-foreground hover:text-destructive"
                    title={`Убрать ${subj}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentGroup?.defaultSubjects && currentGroup.defaultSubjects.length > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleResetToGroupSubjects}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground border border-dashed"
                  title="Восстановить список дисциплин из учебного плана группы"
                >
                  <RotateCcw className="h-2.5 w-2.5 mr-1" />
                  План группы ({currentGroup.defaultSubjects.length})
                </Button>
              )}

              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsAddSubjectOpen(true)}
                className="h-6 px-2 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Plus className="h-3 w-3" />
                <span>Добавить предмет</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Local draft restored notice (compact) */}
        {restoredFromDraft && (
          <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between gap-2 text-[11px] text-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Черновик восстановлен из локальной памяти браузера.</span>
            </span>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="text-muted-foreground hover:text-destructive underline text-[10px]"
            >
              Сбросить
            </button>
          </div>
        )}

        {/* SPREADSHEET TABLE: Matrix of students, roll numbers & subjects */}
        <div className="border rounded-xl bg-card overflow-hidden shadow-2xs relative min-h-[300px]">
          {/* Loading overlay when switching months or groups */}
          {isPending && (
            <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-[1.5px] flex items-center justify-center pointer-events-auto">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-card border border-border shadow-sm text-xs font-medium text-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <span>Загрузка данных ведомости...</span>
              </div>
            </div>
          )}

          <div
            className={`overflow-x-auto overflow-y-auto max-h-[calc(100vh-235px)] transition-opacity duration-150 ${
              isPending ? "opacity-30 pointer-events-none select-none" : ""
            }`}
          >
            <table className="w-full text-xs border-collapse text-left table-fixed">
              <colgroup>
                <col style={{ width: "38px" }} />
                <col style={{ width: "60px" }} />
                <col style={{ width: "260px" }} />
                {subjects.map((s) => (
                  <col key={s} style={{ width: "96px" }} />
                ))}
                <col style={{ width: "96px" }} />
                <col style={{ width: "64px" }} />
                <col style={{ width: "140px" }} />
              </colgroup>
              <thead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-xs border-b">
                <tr className="h-9 text-[11px] text-muted-foreground">
                  <th className="sticky left-0 z-40 bg-muted p-1 text-center border-r font-semibold">
                    №
                  </th>
                  <th
                    className="sticky left-[38px] z-40 bg-muted p-1 text-center border-r font-semibold"
                    title="Поименный номер студента"
                  >
                    П/Н
                  </th>
                  <th className="sticky left-[98px] z-40 bg-muted p-2 text-left border-r font-semibold shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                    Ф.И.О. учащихся
                  </th>
                  {subjects.map((subj) => (
                    <th
                      key={subj}
                      className="p-1 text-center border-r font-semibold truncate"
                      title={subj}
                    >
                      {subj}
                    </th>
                  ))}
                  <th className="p-1 text-center border-r font-semibold">
                    Оценки (5/4/3/2)
                  </th>
                  <th className="p-1 text-center border-r font-semibold">
                    Ср. балл
                  </th>
                  <th className="p-1 text-center font-semibold">
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
                        className="hover:bg-muted/10 transition-colors h-10 border-b"
                      >
                        <td className="sticky left-0 z-10 bg-card p-1 text-center font-mono text-muted-foreground border-r">
                          {idx + 1}
                        </td>

                        {/* Поименный номер (П/Н) - только показ, без ввода */}
                        <td
                          className="sticky left-[38px] z-10 bg-card p-1 text-center font-mono text-xs text-foreground/80 border-r"
                          title="Поименный номер студента"
                        >
                          {row.rollNumber || rollNumbers[row.studentId] || "—"}
                        </td>

                        <td
                          className="sticky left-[98px] z-10 bg-card p-2 font-medium text-foreground border-r truncate shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                          title={row.studentName}
                        >
                          <span className="font-semibold whitespace-nowrap">{row.studentName}</span>
                        </td>

                        {/* Subject cells: ZERO JITTER, clean standard inputs */}
                        {subjects.map((subj) => {
                          const currentVal = row.grades[subj] || "";
                          const avg = row.subjectAverages[subj];
                          const hasBad = /[1-3]/.test(currentVal);

                          let inputClasses = "border-border bg-background text-foreground focus:border-primary";
                          if (hasBad) {
                            inputClasses = "border-destructive/30 bg-destructive/5 text-destructive font-medium focus:border-destructive";
                          } else if (currentVal) {
                            inputClasses = "border-border bg-background text-foreground font-medium focus:border-primary";
                          }

                          return (
                            <td
                              key={subj}
                              className="p-1 text-center border-r"
                            >
                              <div className="flex flex-col items-center justify-center h-full">
                                <input
                                  type="text"
                                  value={currentVal}
                                  onChange={(e) => handleSetGrade(row.studentId, subj, e.target.value)}
                                  placeholder="—"
                                  className={`h-6 w-full px-1 text-center text-xs font-mono rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${inputClasses}`}
                                  title={`Оценки по ${subj}. Вводите подряд: 54554 или 5`}
                                />
                                <span className="text-[9px] font-mono leading-none h-3 mt-0.5 text-muted-foreground block truncate">
                                  {avg !== null ? `ср. ${avg}` : " "}
                                </span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Grades counter breakdown */}
                        <td className="p-1 text-center border-r font-mono text-[11px]">
                          <div className="flex items-center justify-center gap-1 text-foreground">
                            <span title="Количество 5-к">{row.count5}</span>
                            <span className="text-muted-foreground">/</span>
                            <span title="Количество 4-к">{row.count4}</span>
                            <span className="text-muted-foreground">/</span>
                            <span
                              className={row.count3 > 0 ? "text-destructive font-medium" : "text-muted-foreground"}
                              title="Количество 3-к"
                            >
                              {row.count3}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span
                              className={row.count2 > 0 ? "text-destructive font-medium" : "text-muted-foreground"}
                              title="Количество 2-к"
                            >
                              {row.count2}
                            </span>
                          </div>
                        </td>

                        {/* Average Grade */}
                        <td className="p-1 text-center font-mono font-bold text-foreground border-r">
                          {row.averageGrade > 0 ? row.averageGrade.toFixed(2) : "—"}
                        </td>

                        {/* Scholarship Status Badge */}
                        <td className="p-1 text-center">
                          {row.status === "EXCELLENT" && (
                            <Badge
                              variant="outline"
                              className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 font-medium"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Отличник (на «5»)</span>
                            </Badge>
                          )}

                          {row.status === "GOOD" && (
                            <Badge
                              variant="outline"
                              className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[10px] gap-1 font-medium"
                            >
                              <CheckCircle className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
                              <span>Ударник (на «5» и «4»)</span>
                            </Badge>
                          )}

                          {row.status === "NO_SCHOLARSHIP" && (
                            <Badge
                              variant="outline"
                              className="border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20 text-[10px] gap-1 font-medium"
                              title={row.statusReason}
                            >
                              <XCircle className="h-3 w-3 shrink-0" />
                              <span>Снят со стипендии</span>
                            </Badge>
                          )}

                          {row.status === "PENDING" && (
                            <span className="text-muted-foreground text-[11px]">
                              —
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
        </div>

          {/* Footer info note */}
          <div className="p-2 rounded-lg bg-muted/20 border flex items-center gap-2 text-muted-foreground text-[11px]">
            <AlertTriangle className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Правило формирования стипендии: в официальный приказ включаются только учащиеся <strong>на «5»</strong> (отличники) и <strong>на «5» и «4»</strong> (ударники). При наличии хотя бы одной тройки студент исключается из списка.
            </span>
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

        {/* Page 1 Footer Signature */}
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

        {/* ============================================================== */}
        {/* PAGE 2: ТАБЕЛЬ УЧЕТА УСПЕВАЕМОСТИ УЧАЩИХСЯ (ПО ДИСЦИПЛИНАМ)    */}
        {/* ============================================================== */}
        <div className="scholarship-page-break">
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <div style={{ fontWeight: "bold", fontSize: "13pt", lineHeight: 1.3 }}>
              Табель учета успеваемость учащихся группы {currentGroup?.name} по профессии «{currentGroup?.specialtyName || "Разработчик Веб и мультимедийных приложений"}» за {printAcademicYearInfo.monthName} месяц {printAcademicYearInfo.academicYear} учебного года
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1.5px solid #000000",
              fontSize: "10pt",
              fontFamily: "Times New Roman, serif",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #000000",
                    padding: "4px",
                    textAlign: "center",
                    width: "36px",
                    fontWeight: "bold",
                    verticalAlign: "middle",
                  }}
                >
                  №<br />п/п
                </th>
                <th
                  style={{
                    border: "1px solid #000000",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontWeight: "bold",
                    verticalAlign: "middle",
                  }}
                >
                  Ф.И.О. учащихся
                </th>
                {subjects.map((subj) => (
                  <th
                    key={subj}
                    style={{
                      border: "1px solid #000000",
                      textAlign: "center",
                      verticalAlign: "bottom",
                      padding: "6px 2px",
                      width: "34px",
                      height: "115px",
                    }}
                  >
                    <div
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        whiteSpace: "nowrap",
                        fontSize: "9pt",
                        fontWeight: "bold",
                        margin: "0 auto",
                      }}
                    >
                      {subj}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const scholarshipEligibleRows = calculatedRows.filter(
                  (st) => st.status === "EXCELLENT" || st.status === "GOOD"
                );

                if (scholarshipEligibleRows.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan={2 + subjects.length}
                        style={{
                          border: "1px solid #000000",
                          padding: "8px",
                          textAlign: "center",
                          fontStyle: "italic",
                        }}
                      >
                        Учащихся, назначенных на стипендию, нет
                      </td>
                    </tr>
                  );
                }

                return scholarshipEligibleRows.map((st, idx) => (
                  <tr key={st.studentId}>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "4px",
                        textAlign: "center",
                      }}
                    >
                      {idx + 1}.
                    </td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "4px 8px",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {st.studentName}
                    </td>
                    {subjects.map((subj) => (
                      <td
                        key={subj}
                        style={{
                          border: "1px solid #000000",
                          padding: "4px 2px",
                          textAlign: "center",
                          fontFamily: "monospace, sans-serif",
                          fontWeight: "bold",
                          fontSize: "9.5pt",
                        }}
                      >
                        {st.grades[subj] || ""}
                      </td>
                    ))}
                  </tr>
                ));
              })()}
            </tbody>
          </table>

          {/* Page 2 Signatures & Commission Block */}
          <div
            style={{
              marginTop: "45px",
              fontSize: "10.5pt",
              lineHeight: 1.45,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ width: "35%", verticalAlign: "top", fontWeight: "bold" }}>
                    Мастер п/о группы {currentGroup?.name}
                  </td>
                  <td style={{ width: "65%", verticalAlign: "top", fontWeight: "bold" }}>
                    {currentGroup?.curatorName || "Вопольский В.В"}
                  </td>
                </tr>
                <tr>
                  <td style={{ verticalAlign: "top", fontWeight: "bold", paddingTop: "6px" }}>
                    Председатель
                  </td>
                  <td style={{ verticalAlign: "top", paddingTop: "6px" }}>
                    Зам. директора по УВР Бейшенова К.Ж
                  </td>
                </tr>
                <tr>
                  <td style={{ verticalAlign: "top", fontWeight: "bold", paddingTop: "6px" }}>
                    Члены комиссии
                  </td>
                  <td style={{ verticalAlign: "top", paddingTop: "6px" }}>
                    Старший мастер Сатыбалдиева К.Б.<br />
                    Преподаватель кыргыз.языка: Жумакенова А.К.<br />
                    Преподаватель русского.языка: Тиленбаева Н.Ы.<br />
                    Мастер п/о Цыс Р.Ф<br />
                    Мастер п/о Бейшенова Б.Ж
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
