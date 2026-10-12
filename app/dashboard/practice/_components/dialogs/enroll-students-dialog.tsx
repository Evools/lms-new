"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  UserPlus,
  GraduationCap,
  Building2,
  Calendar,
  CheckSquare,
  Square,
  Search,
  Users,
  X,
  Loader2,
  Check,
  UserCheck,
} from "lucide-react";
import {
  CompanyPartner,
  CollegeGroupInfo,
  PracticeType,
  StudentPracticeRecord,
} from "../types";

interface EnrollStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableGroups: CollegeGroupInfo[];
  companies: CompanyPartner[];
  existingStudents?: StudentPracticeRecord[];
  onEnrollStudents: (data: {
    selectedStudents: { studentId: string; studentName: string }[];
    groupId: string;
    groupName: string;
    course: number;
    specialty: string;
    practiceType: PracticeType;
    startDate: string;
    endDate: string;
    companyId?: string | null;
    collegeMentor?: string | null;
    companyMentor?: string | null;
  }) => Promise<void>;
}

export function EnrollStudentsDialog({
  open,
  onOpenChange,
  availableGroups,
  companies,
  existingStudents = [],
  onEnrollStudents,
}: EnrollStudentsDialogProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [practiceType, setPracticeType] = useState<PracticeType>("Учебная (ознакомительная)");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("NONE");
  const [collegeMentor, setCollegeMentor] = useState<string>("");
  const [companyMentor, setCompanyMentor] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize group and dates on open
  useEffect(() => {
    if (open) {
      if (availableGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(availableGroups[0].id);
      }
      const d = new Date();
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      setStartDate(`${day}.${month}.${year}`);

      const endD = new Date();
      endD.setDate(endD.getDate() + 21);
      const endDay = endD.getDate().toString().padStart(2, "0");
      const endMonth = (endD.getMonth() + 1).toString().padStart(2, "0");
      const endYear = endD.getFullYear();
      setEndDate(`${endDay}.${endMonth}.${endYear}`);
    }
  }, [open, availableGroups, selectedGroupId]);

  const activeGroup = useMemo(() => {
    return availableGroups.find((g) => g.id === selectedGroupId) || availableGroups[0];
  }, [availableGroups, selectedGroupId]);

  const groupStudentsList = useMemo(() => {
    return activeGroup?.students || [];
  }, [activeGroup]);

  // Set of students from this group already enrolled in this practice type
  const enrolledStudentNames = useMemo(() => {
    if (!existingStudents || !activeGroup) return new Set<string>();
    return new Set(
      existingStudents
        .filter(
          (e) =>
            e.groupName?.toLowerCase() === activeGroup.name?.toLowerCase() &&
            e.practiceType === practiceType
        )
        .map((e) => e.studentName.toLowerCase().trim())
    );
  }, [existingStudents, activeGroup, practiceType]);

  // Select all not-yet-enrolled group students by default when group or practice type changes
  useEffect(() => {
    if (groupStudentsList.length > 0) {
      const notEnrolled = groupStudentsList
        .filter((s) => !enrolledStudentNames.has(s.name.toLowerCase().trim()))
        .map((s) => s.id);
      setSelectedStudentIds(notEnrolled.length > 0 ? notEnrolled : groupStudentsList.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
    setStudentSearch("");
  }, [groupStudentsList, enrolledStudentNames]);

  const selectedCompany = useMemo(() => {
    if (selectedCompanyId === "NONE") return null;
    return companies.find((c) => c.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return groupStudentsList;
    const q = studentSearch.toLowerCase().trim();
    return groupStudentsList.filter((s) => s.name.toLowerCase().includes(q));
  }, [groupStudentsList, studentSearch]);

  // Date duration preset handler
  const handleApplyPresetWeeks = (weeks: number) => {
    const parts = startDate.split(".");
    let baseDate = new Date();
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        baseDate = new Date(y, m, d);
      }
    }
    baseDate.setDate(baseDate.getDate() + weeks * 7);
    const endDay = baseDate.getDate().toString().padStart(2, "0");
    const endMonth = (baseDate.getMonth() + 1).toString().padStart(2, "0");
    const endYear = baseDate.getFullYear();
    setEndDate(`${endDay}.${endMonth}.${endYear}`);
  };

  const handleSelectAll = () => {
    setSelectedStudentIds(groupStudentsList.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!activeGroup || selectedStudentIds.length === 0) return;

    const chosenStudents = groupStudentsList
      .filter((s) => selectedStudentIds.includes(s.id))
      .map((s) => ({ studentId: s.id, studentName: s.name }));

    setIsSubmitting(true);
    try {
      await onEnrollStudents({
        selectedStudents: chosenStudents,
        groupId: activeGroup.id,
        groupName: activeGroup.name,
        course: activeGroup.course || 1,
        specialty: activeGroup.specialty || "Общая специальность",
        practiceType,
        startDate: startDate || new Date().toLocaleDateString("ru-RU"),
        endDate: endDate || "",
        companyId: selectedCompanyId !== "NONE" ? selectedCompanyId : null,
        collegeMentor: collegeMentor.trim() || null,
        companyMentor: companyMentor.trim() || null,
      });
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to enroll students:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[760px] max-h-[92vh] flex flex-col">
        {/* Header with safety margin from close button */}
        <DialogHeader className="shrink-0 place-items-start text-left gap-1 pb-2 border-b pr-8">
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-primary" />
              <span>Зачислить студентов на практику</span>
            </DialogTitle>
            <Badge
              variant="outline"
              className="text-[10px] font-medium bg-primary/10 text-primary border-primary/30"
            >
              База колледжа
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Выберите группу, вид практики и период. Отметьте студентов для зачисления в систему.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 py-1">
          {/* 1. Academic Group Selection */}
          <div className="space-y-1.5 p-2.5 rounded-lg border bg-muted/20">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span>Академическая группа</span>
              </label>
              {activeGroup && (
                <span className="text-[11px] text-muted-foreground">
                  В группе: <strong className="text-foreground">{groupStudentsList.length}</strong> студ.
                </span>
              )}
            </div>

            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="h-8 text-xs bg-background font-medium">
                <SelectValue placeholder="Выберите группу">
                  {activeGroup
                    ? `${activeGroup.name} — ${activeGroup.specialty} (${activeGroup.course} курс)`
                    : "Выберите группу"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="text-xs">
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="font-semibold text-foreground">{g.name}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {g.specialty} • {g.course} курс
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/30 text-primary">
                        {g.students?.length || 0} студ.
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quick summary tags of selected group */}
            {activeGroup && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <Badge variant="outline" className="text-[10px] py-0 h-4 font-normal text-muted-foreground">
                  Специальность: <span className="font-medium text-foreground ml-1">{activeGroup.specialty}</span>
                </Badge>
                <Badge variant="outline" className="text-[10px] py-0 h-4 font-normal text-muted-foreground">
                  Курс: <span className="font-medium text-foreground ml-1">{activeGroup.course}</span>
                </Badge>
                {enrolledStudentNames.size > 0 && (
                  <Badge variant="outline" className="text-[10px] py-0 h-4 font-normal border-primary/30 text-primary bg-primary/5">
                    Уже зачислено: {enrolledStudentNames.size} из {groupStudentsList.length}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 2. Practice Type & Base Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">Вид практики</label>
              <Select
                value={practiceType}
                onValueChange={(v) => setPracticeType(v as PracticeType)}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Вид практики">
                    {practiceType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Учебная (ознакомительная)" className="text-xs">
                    Учебная (ознакомительная)
                  </SelectItem>
                  <SelectItem value="Производственная" className="text-xs">
                    Производственная
                  </SelectItem>
                  <SelectItem value="Преддипломная" className="text-xs">
                    Преддипломная
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>База практики (Организация)</span>
              </label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Без базы (распределить позже)">
                    {selectedCompany
                      ? `${selectedCompany.name} (свободно: ${Math.max(0, selectedCompany.quotaTotal - selectedCompany.quotaUsed)})`
                      : "Без базы (статус: «Не распределен»)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" className="text-xs font-medium">
                    Без базы (статус: «Не распределен»)
                  </SelectItem>
                  {companies.map((c) => {
                    const freeSeats = Math.max(0, c.quotaTotal - c.quotaUsed);
                    return (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span>{c.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {freeSeats} мест своб.
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. Dates & Mentors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                <span>Дата начала</span>
              </label>
              <Input
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="15.10.2026"
                className="h-8 text-xs bg-background text-center font-medium"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>Дата окончания</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetWeeks(2)}
                    className="text-[9px] px-1 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground font-medium"
                    title="2 недели (14 дней)"
                  >
                    2 нед
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetWeeks(3)}
                    className="text-[9px] px-1 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground font-medium"
                    title="3 недели (21 день)"
                  >
                    3 нед
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetWeeks(4)}
                    className="text-[9px] px-1 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground font-medium"
                    title="4 недели (28 дней)"
                  >
                    4 нед
                  </button>
                </div>
              </div>
              <Input
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="05.11.2026"
                className="h-8 text-xs bg-background text-center font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground">
                Руководитель колледжа
              </label>
              <Input
                value={collegeMentor}
                onChange={(e) => setCollegeMentor(e.target.value)}
                placeholder="ФИО куратора..."
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          {/* 4. Student Checklist */}
          <div className="space-y-2 border rounded-lg p-2.5 bg-muted/20">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground text-xs">
                  Студенты к зачислению
                </span>
                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-primary/10 text-primary border-primary/30">
                  {selectedStudentIds.length} из {groupStudentsList.length} выбрано
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  type="button"
                  onClick={handleSelectAll}
                  className="h-6 px-2 text-[10px] gap-1 font-medium"
                >
                  <CheckSquare className="h-3 w-3 text-primary" />
                  <span>Выбрать всех</span>
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  type="button"
                  onClick={handleDeselectAll}
                  className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground font-medium"
                >
                  <Square className="h-3 w-3" />
                  <span>Снять всех</span>
                </Button>
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Быстрый поиск студента по ФИО в группе..."
                className="h-7 pl-8 pr-6 text-xs bg-background"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Checklist items container */}
            <div className="border rounded-md bg-background/50 max-h-[260px] overflow-y-auto p-1.5">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-xs">
                  {groupStudentsList.length === 0
                    ? "В выбранной группе пока нет студентов в базе колледжа"
                    : "Студенты не найдены по поисковому запросу"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredStudents.map((st, idx) => {
                    const isChecked = selectedStudentIds.includes(st.id);
                    const isAlreadyEnrolled = enrolledStudentNames.has(st.name.toLowerCase().trim());

                    return (
                      <div
                        key={st.id}
                        onClick={() => handleToggleStudent(st.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-left transition-colors cursor-pointer select-none text-xs ${
                          isChecked
                            ? "bg-primary/5 border-primary/40"
                            : "bg-card border-border/70 hover:bg-muted/50 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isChecked ? (
                            <div className="h-4 w-4 rounded border border-primary bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded border border-muted-foreground/30 bg-background shrink-0" />
                          )}
                          <span className="font-mono text-muted-foreground text-[10px] w-4 shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="font-medium text-foreground truncate text-xs">
                            {st.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-1.5">
                          {isAlreadyEnrolled ? (
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-muted text-muted-foreground font-normal">
                              Уже на практике
                            </Badge>
                          ) : isChecked ? (
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/30 text-primary bg-primary/10 font-normal">
                              Выбран
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 flex flex-row justify-end gap-2 pt-2 border-t mt-1">
          <Button
            size="xs"
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-8 px-3 text-xs"
          >
            Отмена
          </Button>
          <Button
            size="xs"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedStudentIds.length === 0}
            className="h-8 px-3 text-xs gap-1.5 font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Зачисление...</span>
              </>
            ) : (
              <>
                <UserCheck className="h-3.5 w-3.5" />
                <span>Зачислить на практику ({selectedStudentIds.length})</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
