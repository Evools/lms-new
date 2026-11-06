"use client";

import React, { createContext, useContext, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Shield,
  Percent,
} from "lucide-react";
import { getStudentCardDataAction, type StudentCardDTO } from "@/app/dashboard/students/actions";

interface StudentQuickSheetContextType {
  openStudent: (studentId: string) => void;
  closeStudent: () => void;
  isOpen: boolean;
  student: StudentCardDTO | null;
  loading: boolean;
}

const StudentQuickSheetContext = createContext<StudentQuickSheetContextType>({
  openStudent: () => {},
  closeStudent: () => {},
  isOpen: false,
  student: null,
  loading: false,
});

export function useStudentQuickSheet() {
  return useContext(StudentQuickSheetContext);
}

export function StudentQuickSheetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentCardDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const openStudent = (studentId: string) => {
    setActiveStudentId(studentId);
    setIsOpen(true);
    setLoading(true);

    getStudentCardDataAction(studentId)
      .then((data) => {
        setStudent(data);
      })
      .catch((err) => {
        console.error("Failed to load student card:", err);
        setStudent(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const closeStudent = () => {
    setIsOpen(false);
    setActiveStudentId(null);
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Global click delegator: any element with data-student-id="xyz" will open the sheet!
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-student-id]");
      if (target) {
        const studentId = target.getAttribute("data-student-id");
        if (studentId) {
          e.preventDefault();
          e.stopPropagation();
          openStudent(studentId);
        }
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  return (
    <StudentQuickSheetContext.Provider
      value={{
        openStudent,
        closeStudent,
        isOpen,
        student,
        loading,
      }}
    >
      {children}

      <Sheet open={isOpen} onOpenChange={(open) => (!open ? closeStudent() : null)}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="p-5 gap-3.5 text-xs sm:max-w-[560px] md:max-w-[580px] w-full overflow-y-auto flex flex-col justify-between"
        >
          {loading ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-16 bg-muted rounded-lg" />
                <div className="h-16 bg-muted rounded-lg" />
                <div className="h-16 bg-muted rounded-lg" />
                <div className="h-16 bg-muted rounded-lg" />
              </div>
              <div className="h-28 bg-muted rounded-lg" />
            </div>
          ) : student ? (
            <div className="space-y-3.5 flex-1">
              {/* Header Info */}
              <SheetHeader className="p-0 text-left space-y-1">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border border-border shadow-xs shrink-0">
                    <AvatarImage src={student.avatar || undefined} alt={student.name} />
                    <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <SheetTitle className="text-sm font-bold text-foreground truncate">
                        {student.name}
                      </SheetTitle>
                      {student.rollNumber && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-semibold shrink-0">
                          П/Н {student.rollNumber}
                        </span>
                      )}
                    </div>

                    <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{student.groupName || "Без группы"}</span>
                      {student.course && <span>• {student.course} курс</span>}
                    </SheetDescription>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {student.roleInGroup === "MONITOR" && (
                        <Badge variant="outline" className="text-[10px] h-5 border-primary text-primary font-medium">
                          Староста группы
                        </Badge>
                      )}
                      {student.roleInGroup === "DEPUTY_MONITOR" && (
                        <Badge variant="outline" className="text-[10px] h-5 border-primary text-primary font-medium">
                          Зам. старосты
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 font-medium bg-muted text-foreground"
                      >
                        {student.accountStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Quick Contacts Bar */}
              <div className="p-2.5 rounded-lg border bg-muted/40 space-y-1.5 text-xs">
                {student.phone ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground truncate">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <a
                        href={`tel:${student.phone}`}
                        className="hover:underline text-foreground font-mono text-xs"
                      >
                        {student.phone}
                      </a>
                    </div>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleCopy(student.phone || "", "phone")}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      title="Копировать номер"
                    >
                      {copiedField === "phone" ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    <span>Телефон не указан</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <a
                      href={`mailto:${student.email}`}
                      className="hover:underline text-foreground text-xs truncate max-w-[220px]"
                    >
                      {student.email}
                    </a>
                  </div>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleCopy(student.email, "email")}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    title="Копировать email"
                  >
                    {copiedField === "email" ? (
                      <Check className="h-3 w-3 text-primary" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* 4 Key Academic Stats Tiles */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border bg-card space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">Посещаемость:</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-foreground">
                      {student.attendance.percent}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {student.attendance.present}/{student.attendance.total} пар
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 mt-1 overflow-hidden">
                    <div
                      className="bg-primary h-1 rounded-full transition-all"
                      style={{ width: `${Math.min(100, student.attendance.percent)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border bg-card space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">Пропуски (всего):</span>
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`text-sm font-bold ${
                        student.attendance.absent > 10 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {student.attendance.absent} ч
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      уваж: {student.attendance.excused} ч
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    опозданий: {student.attendance.late}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border bg-card space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">Средний балл:</span>
                  <div className="text-sm font-bold text-foreground">
                    {student.academics.averageGrade || "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Сдано заданий: {student.academics.submittedAssignments}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border bg-card space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">Дежурство:</span>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {student.isDutyExempt ? (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3 text-amber-500 shrink-0" />
                        <span>Освобождён ({student.dutyExemptReason || "ЛОВЗ"})</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-primary shrink-0" />
                        <span>В графике группы</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Куратор: {student.curatorName || "Не назначен"}
                  </div>
                </div>
              </div>

              {/* Group & Specialty Info */}
              <div className="p-2.5 rounded-lg border bg-card space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Специальность:</span>
                  <span className="font-medium text-foreground text-right truncate max-w-[200px]">
                    {student.specialtyName || "Общеобразовательная"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground border-t border-border/60 pt-1">
                  <span>Куратор группы:</span>
                  <span className="font-medium text-foreground">
                    {student.curatorName || "Не назначен"}
                  </span>
                </div>
              </div>

              {/* Recent Absences or Submissions mini-preview */}
              {student.attendance.allAbsences && student.attendance.allAbsences.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                    <span>Последние пропуски:</span>
                    <span className="text-muted-foreground text-[10px] font-normal">
                      {student.attendance.allAbsences.length} зап.
                    </span>
                  </div>
                  <div className="max-h-[100px] overflow-y-auto space-y-1 pr-1">
                    {student.attendance.allAbsences.slice(0, 3).map((ab) => (
                      <div
                        key={ab.id}
                        className="p-1.5 rounded border bg-muted/30 text-[10px] flex items-center justify-between"
                      >
                        <span className="truncate max-w-[190px] text-foreground font-medium">
                          {ab.subjectName}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-muted-foreground font-mono">{ab.date}</span>
                          <span
                            className={`px-1 rounded text-[9px] font-bold ${
                              ab.status === "EXCUSED"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {ab.status === "EXCUSED" ? "Уваж." : "НБ"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-1">
              <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto" />
              <p>Информация о студенте не найдена</p>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="border-t pt-3 mt-2 flex items-center justify-between gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={closeStudent}
              className="h-8 text-xs px-3"
            >
              Закрыть
            </Button>

            {student && (
              <Button
                size="xs"
                render={<Link href={`/dashboard/students/${student.id}`} onClick={closeStudent} />}
                className="h-8 text-xs px-3 gap-1.5 bg-primary text-primary-foreground font-medium"
              >
                <span>Полный профиль</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </StudentQuickSheetContext.Provider>
  );
}
