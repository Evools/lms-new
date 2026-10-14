"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ArrowRightLeft,
  CheckSquare,
  Square,
  Building2,
  History,
  Printer,
  CheckCircle2,
  UserPlus,
  Users,
  UserMinus,
  Trash2,
} from "lucide-react";
import { CompanyPartner, StudentPracticeRecord } from "../types";
import { AnimatedCounter } from "../animated-counter";

interface StudentsTabProps {
  courseFilter: "ALL" | number;
  setCourseFilter: (val: "ALL" | number) => void;
  groupFilter: string;
  setGroupFilter: (val: string) => void;
  groupsList: string[];
  companyFilter: string;
  setCompanyFilter: (val: string) => void;
  companies: CompanyPartner[];
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  filteredStudents: StudentPracticeRecord[];
  selectedStudentIds: string[];
  setSelectedStudentIds: (ids: string[]) => void;
  isAllFilteredSelected: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectStudent: (id: string) => void;
  onOpenMoveSelected: () => void;
  onOpenMoveSingle: (rec: StudentPracticeRecord) => void;
  onOpenHistoryModal: (rec: StudentPracticeRecord) => void;
  onOpenDocPreview: (rec: StudentPracticeRecord) => void;
  onToggleCompletePractice: (rec: StudentPracticeRecord) => void;
  onOpenEnrollModal: () => void;
  onUnassignSingle: (rec: StudentPracticeRecord) => void;
  onUnassignSelected: () => void;
  onPromptDeleteSingle: (rec: StudentPracticeRecord) => void;
  onPromptDeleteSelected: () => void;
}

export function StudentsTab({
  courseFilter,
  setCourseFilter,
  groupFilter,
  setGroupFilter,
  groupsList,
  companyFilter,
  setCompanyFilter,
  companies,
  statusFilter,
  setStatusFilter,
  filteredStudents,
  selectedStudentIds,
  setSelectedStudentIds,
  isAllFilteredSelected,
  onToggleSelectAll,
  onToggleSelectStudent,
  onOpenMoveSelected,
  onOpenMoveSingle,
  onOpenHistoryModal,
  onOpenDocPreview,
  onToggleCompletePractice,
  onOpenEnrollModal,
  onUnassignSingle,
  onUnassignSelected,
  onPromptDeleteSingle,
  onPromptDeleteSelected,
}: StudentsTabProps) {
  return (
    <div className="space-y-3">
      {/* Filters Bar */}
      <div className="bg-card border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-[11px]">Курс:</span>
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs">
              <button
                type="button"
                onClick={() => setCourseFilter("ALL")}
                className={`h-6 px-2 rounded-md text-[10px] font-medium transition-colors ${
                  courseFilter === "ALL"
                    ? "bg-background text-foreground border"
                    : "text-muted-foreground"
                }`}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => setCourseFilter(1)}
                className={`h-6 px-2 rounded-md text-[10px] font-medium transition-colors ${
                  courseFilter === 1
                    ? "bg-background text-foreground border"
                    : "text-muted-foreground"
                }`}
              >
                1 курс
              </button>
              <button
                type="button"
                onClick={() => setCourseFilter(2)}
                className={`h-6 px-2 rounded-md text-[10px] font-medium transition-colors ${
                  courseFilter === 2
                    ? "bg-background text-foreground border"
                    : "text-muted-foreground"
                }`}
              >
                2 курс
              </button>
            </div>
          </div>

          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="h-7 text-xs bg-background w-[125px]">
              <SelectValue placeholder="Все группы">
                {groupFilter === "ALL" ? "Все группы" : groupFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Все группы
              </SelectItem>
              {groupsList.map((g) => (
                <SelectItem key={g} value={g} className="text-xs">
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="h-7 text-xs bg-background w-[150px]">
              <SelectValue placeholder="Все базы">
                {companyFilter === "ALL"
                  ? "Все базы практики"
                  : companies.find((c) => c.id === companyFilter)?.name || "База"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Все базы практики
              </SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs bg-background w-[155px]">
              <SelectValue placeholder="Все статусы">
                {statusFilter === "ALL" ? "Все статусы" : statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Все статусы
              </SelectItem>
              <SelectItem value="Не распределен" className="text-xs">
                Не распределен
              </SelectItem>
              <SelectItem value="Направлен" className="text-xs">
                Направлен
              </SelectItem>
              <SelectItem value="Проходит практику" className="text-xs">
                Проходит практику
              </SelectItem>
              <SelectItem value="Переведен на другую базу" className="text-xs">
                Переведен на другую базу
              </SelectItem>
              <SelectItem value="Практика завершена" className="text-xs">
                Практика завершена
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              Найдено:{" "}
              <strong className="text-foreground">
                <AnimatedCounter value={filteredStudents.length} />
              </strong>
            </span>
          </div>

          <Button
            size="sm"
            onClick={onOpenEnrollModal}
            className="h-8 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-none"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Зачислить студентов</span>
          </Button>
        </div>
      </div>

      {/* Floating / Sticky Multi-Selection Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-primary text-primary-foreground text-xs font-semibold px-2"
            >
              <AnimatedCounter value={selectedStudentIds.length} />
            </Badge>
            <span className="text-xs font-medium text-foreground">
              студентов выбрано
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setSelectedStudentIds([])}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Снять выбор
            </Button>

            <Button
              size="xs"
              onClick={onOpenMoveSelected}
              className="h-7 px-3 text-xs gap-1.5 font-medium shadow-none"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>
                Направить на базу ({selectedStudentIds.length})
              </span>
            </Button>

            <Button
              size="xs"
              variant="outline"
              onClick={onUnassignSelected}
              className="h-7 px-2.5 text-xs gap-1 font-medium border-border hover:bg-muted"
              title="Отвязать выбранных студентов от организаций и вернуть в статус «Не распределен»"
            >
              <UserMinus className="h-3.5 w-3.5" />
              <span>Отвязать от баз</span>
            </Button>

            <Button
              size="xs"
              variant="ghost"
              onClick={onPromptDeleteSelected}
              className="h-7 px-2.5 text-xs gap-1 font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              title="Удалить выбранных студентов из практики"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Удалить ({selectedStudentIds.length})</span>
            </Button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-card border rounded-xl overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b text-muted-foreground text-[11px]">
              {/* Multi-Select Checkbox in Header */}
              <th className="py-2.5 px-3 w-8 text-center">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className="p-1 hover:text-foreground text-muted-foreground"
                  title={
                    isAllFilteredSelected
                      ? "Снять выбор со всех"
                      : "Выбрать всех отфильтрованных"
                  }
                >
                  {isAllFilteredSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3 text-left font-semibold">Студент / Группа</th>
              <th className="py-2.5 px-3 text-left font-semibold">Текущая база практики</th>
              <th className="py-2.5 px-3 text-left font-semibold">Вид практики & Период</th>
              <th className="py-2.5 px-3 text-left font-semibold">Перемещения</th>
              <th className="py-2.5 px-3 text-left font-semibold">Статус</th>
              <th className="py-2.5 px-3 text-right font-semibold">Управление</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredStudents.map((rec) => {
              const isSelected = selectedStudentIds.includes(rec.id);
              const hasMovements = rec.movements && rec.movements.length > 1;
              const movementsCount = rec.movements?.length || 0;

              return (
                <tr
                  key={rec.id}
                  className={`hover:bg-muted/10 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-2.5 px-3 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => onToggleSelectStudent(rec.id)}
                      className="p-1 hover:text-foreground text-muted-foreground"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>

                  <td className="py-2.5 px-3 align-middle">
                    <div className="font-bold text-foreground">{rec.studentName}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span className="font-medium text-foreground">{rec.groupName}</span>
                      <span>•</span>
                      <span>{rec.course} курс</span>
                      <span>•</span>
                      <span>{rec.specialty}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 align-middle">
                    {rec.companyName ? (
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-primary shrink-0" />
                          <span>{rec.companyName}</span>
                        </div>
                        {rec.companyMentor && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Наставник: {rec.companyMentor}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30 font-medium"
                      >
                        Не распределен
                      </Badge>
                    )}
                  </td>

                  <td className="py-2.5 px-3 align-middle">
                    <div className="font-medium text-foreground text-[11px]">
                      {rec.practiceType}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      {rec.startDate} – {rec.endDate}
                    </div>
                  </td>

                  {/* Movement Tracker Cell */}
                  <td className="py-2.5 px-3 align-middle">
                    {movementsCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpenHistoryModal(rec)}
                        className="flex items-center gap-1.5 text-left group"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium transition-colors ${
                            hasMovements
                              ? "bg-primary/10 text-primary border-primary/30 group-hover:bg-primary/20"
                              : "bg-muted/60 text-muted-foreground border-border group-hover:bg-muted"
                          }`}
                        >
                          <History className="h-3 w-3 mr-1" />
                          {hasMovements ? `${movementsCount} перемещения` : "1 направление"}
                        </Badge>
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 align-middle">
                    <div className="space-y-1">
                      {rec.status === "Практика завершена" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-primary/10 text-primary border-primary/30 font-medium"
                        >
                          Практика завершена
                        </Badge>
                      )}
                      {rec.status === "Переведен на другую базу" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-muted/60 text-foreground border-border font-medium"
                        >
                          Переведен
                        </Badge>
                      )}
                      {rec.status === "Проходит практику" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-primary/10 text-primary border-primary/30 font-medium"
                        >
                          Проходит практику
                        </Badge>
                      )}
                      {rec.status === "Направлен" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-muted/60 text-muted-foreground border-border font-medium"
                        >
                          Направлен
                        </Badge>
                      )}
                      {rec.status === "Не распределен" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 font-medium"
                        >
                          Не распределен
                        </Badge>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 align-middle text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Row Action: Направить / Перевести */}
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onOpenMoveSingle(rec)}
                        className="h-7 px-2 text-xs font-medium border-primary/40 text-primary hover:bg-primary/10"
                        title="Направить или перевести на другую базу практики"
                      >
                        <ArrowRightLeft className="h-3 w-3 mr-1" />
                        <span>{rec.companyName ? "Перевести" : "Направить"}</span>
                      </Button>

                      {/* Row Action: Отвязать от базы практики */}
                      {rec.companyName && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => onUnassignSingle(rec)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Отвязать студента от базы практики (вернуть в статус «Не распределен»)"
                        >
                          <UserMinus className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="hidden sm:inline">Отвязать</span>
                        </Button>
                      )}

                      {/* Row Action: Быстрый доступ к Истории перемещений */}
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onOpenHistoryModal(rec)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="История перемещений студента"
                      >
                        <History className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="hidden sm:inline">История</span>
                      </Button>

                      {rec.companyName && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => onOpenDocPreview(rec)}
                          className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Печать официального направления"
                        >
                          <Printer className="h-3 w-3 mr-1 text-primary" />
                          <span className="hidden sm:inline">Бланк</span>
                        </Button>
                      )}

                      {rec.status !== "Не распределен" && (
                        <Button
                          size="xs"
                          variant={
                            rec.status === "Практика завершена" ? "outline" : "ghost"
                          }
                          onClick={() => onToggleCompletePractice(rec)}
                          className={`h-7 px-2 font-medium transition-colors ${
                            rec.status === "Практика завершена"
                              ? "border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title={
                            rec.status === "Практика завершена"
                              ? "Вернуть статус «Проходит практику»"
                              : "Отметить завершение практики"
                          }
                        >
                          <CheckCircle2
                            className={`h-3 w-3 mr-1 ${
                              rec.status === "Практика завершена"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span>
                            {rec.status === "Практика завершена"
                              ? "Завершена"
                              : "Завершить"}
                          </span>
                        </Button>
                      )}

                      {/* Row Action: Удалить с практики */}
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onPromptDeleteSingle(rec)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Удалить студента из практики"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="font-medium text-foreground">Студенты на практике не найдены</div>
                    <p className="text-[11px] max-w-sm text-muted-foreground">
                      Вы можете зачислить учебную группу или отдельных студентов колледжа на практику и сразу распределить их по организациям.
                    </p>
                    <Button
                      size="sm"
                      onClick={onOpenEnrollModal}
                      className="mt-1 h-8 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-none"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Зачислить студентов на практику
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
