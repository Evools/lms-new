"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Search,
  ArrowRight,
  AlertCircle,
  Users,
  SlidersHorizontal,
  Check,
  Printer,
  Clock,
  Send,
} from "lucide-react";
import type { WorkflowStudentDTO, WorkflowUserDTO } from "../../../actions";
import {
  DOCUMENT_TEMPLATES,
  type DocumentTemplateItem,
} from "../../../workflow-data";
import type { CharBlocksState } from "../workflow-types";

interface WorkflowCreatorTabProps {
  creatorStep: 1 | 2 | 3 | 4;
  setCreatorStep: (step: 1 | 2 | 3 | 4) => void;
  selectedTemplate: DocumentTemplateItem;
  setSelectedTemplate: (tpl: DocumentTemplateItem) => void;
  creatorGroup: string;
  setCreatorGroup: (g: string) => void;
  groups: string[];
  creatorSelectedStudentIds: string[];
  setCreatorSelectedStudentIds: React.Dispatch<React.SetStateAction<string[]>>;
  students: WorkflowStudentDTO[];
  availableStudentsForGroup: WorkflowStudentDTO[];
  creatorIndividualReasons: Record<string, string>;
  setCreatorIndividualReasons: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  enableIndividualReasons: boolean;
  setEnableIndividualReasons: (val: boolean) => void;
  creatorGeneralReason: string;
  setCreatorGeneralReason: (val: string) => void;
  creatorAddressee: string;
  setCreatorAddressee: (val: string) => void;
  creatorDescription: string;
  setCreatorDescription: (val: string) => void;
  creatorSignatory: string;
  setCreatorSignatory: (val: string) => void;
  creatorSignatoryRole: string;
  setCreatorSignatoryRole: (val: string) => void;
  studentSearchInCreator: string;
  setStudentSearchInCreator: (val: string) => void;
  charBlocks: CharBlocksState;
  setCharBlocks: React.Dispatch<React.SetStateAction<CharBlocksState>>;
  handleToggleCharBlock: (key: keyof CharBlocksState) => void;
  creatorTplCategory: string;
  setCreatorTplCategory: (cat: string) => void;
  creatorTplSearch: string;
  setCreatorTplSearch: (search: string) => void;
  creatorFilteredTemplates: DocumentTemplateItem[];
  handleSelectTemplate: (tpl: DocumentTemplateItem) => void;
  handleToggleStudentSelection: (st: WorkflowStudentDTO) => void;
  handleSelectAllCriticalStudents: () => void;
  handlePrintDocument: () => void;
  handleSaveDocument: (asDraft: boolean) => void;
  currentUser: WorkflowUserDTO | null;
}

export function WorkflowCreatorTab({
  creatorStep,
  setCreatorStep,
  selectedTemplate,
  creatorGroup,
  setCreatorGroup,
  groups,
  creatorSelectedStudentIds,
  setCreatorSelectedStudentIds,
  students,
  availableStudentsForGroup,
  creatorIndividualReasons,
  setCreatorIndividualReasons,
  enableIndividualReasons,
  setEnableIndividualReasons,
  creatorGeneralReason,
  setCreatorGeneralReason,
  creatorAddressee,
  setCreatorAddressee,
  creatorDescription,
  setCreatorDescription,
  creatorSignatory,
  setCreatorSignatory,
  creatorSignatoryRole,
  setCreatorSignatoryRole,
  studentSearchInCreator,
  setStudentSearchInCreator,
  charBlocks,
  setCharBlocks,
  handleToggleCharBlock,
  creatorTplCategory,
  setCreatorTplCategory,
  creatorTplSearch,
  setCreatorTplSearch,
  creatorFilteredTemplates,
  handleSelectTemplate,
  handleToggleStudentSelection,
  handleSelectAllCriticalStudents,
  handlePrintDocument,
  handleSaveDocument,
  currentUser,
}: WorkflowCreatorTabProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Stepper Header */}
      <div className="p-3 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
              {creatorStep}
            </span>
            <span className="text-xs font-bold text-foreground">
              {creatorStep === 1 && "Шаг 1: Выбор шаблона документа"}
              {creatorStep === 2 && "Шаг 2: Выбор группы и студентов"}
              {creatorStep === 3 && "Шаг 3: Реквизиты и содержание"}
              {creatorStep === 4 && "Шаг 4: Предпросмотр официального бланка"}
            </span>
          </div>

          {/* Step indicator pills */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((stepNum) => (
              <button
                key={stepNum}
                onClick={() => setCreatorStep(stepNum as 1 | 2 | 3 | 4)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  creatorStep === stepNum
                    ? "w-6 bg-primary"
                    : creatorStep > stepNum
                      ? "w-2 bg-primary/40"
                      : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* STEP 1: SELECT TEMPLATE */}
      {creatorStep === 1 && (
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setCreatorTplCategory("ALL")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  creatorTplCategory === "ALL"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Все ({DOCUMENT_TEMPLATES.length})
              </button>
              <button
                onClick={() => setCreatorTplCategory("CURATOR")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  creatorTplCategory === "CURATOR"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Характеристики (1)
              </button>
              <button
                onClick={() => setCreatorTplCategory("REPORTS")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  creatorTplCategory === "REPORTS"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Рапорты и служебные (5)
              </button>
              <button
                onClick={() => setCreatorTplCategory("ACADEMIC")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  creatorTplCategory === "ACADEMIC"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Учебная деятельность (2)
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или коду..."
                value={creatorTplSearch}
                onChange={(e) => setCreatorTplSearch(e.target.value)}
                className="pl-8 h-8 text-xs w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {creatorFilteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                        {tpl.code}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-normal bg-muted/40"
                      >
                        {tpl.categoryLabel}
                      </Badge>
                    </div>
                    {tpl.isMultiStudent ? (
                      <span className="text-[10px] text-primary font-medium">
                        Групповой
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        1 студент
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {tpl.requiresAttendanceData
                      ? "Данные посещаемости LMS"
                      : "Ручное заполнение"}
                  </span>
                  <span className="text-primary font-medium flex items-center gap-0.5">
                    Выбрать <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT GROUP & STUDENTS */}
      {creatorStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 p-3.5 rounded-lg border border-border bg-card flex flex-col gap-3">
            <div>
              <h3 className="font-bold text-foreground text-xs">
                Параметры выборки
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Шаблон:{" "}
                <span className="font-medium text-foreground">
                  {selectedTemplate.title}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground">
                Учебная группа
              </label>
              <Select
                value={creatorGroup}
                onValueChange={(val) => {
                  setCreatorGroup(val || "");
                  setCreatorSelectedStudentIds([]);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Выберите группу">
                    {creatorGroup || "Выберите группу"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {groups.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Нет созданных групп
                    </SelectItem>
                  ) : (
                    groups.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate.isMultiStudent && (
              <div className="pt-2 border-t flex flex-col gap-2">
                <span className="text-[11px] font-medium text-foreground">
                  Быстрый выбор по фильтрам:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllCriticalStudents}
                  className="h-7 text-xs justify-start"
                >
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Студенты с пропусками &gt; 36 ч.
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCreatorSelectedStudentIds(
                      availableStudentsForGroup.map((s) => s.id)
                    )
                  }
                  className="h-7 text-xs justify-start"
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Выбрать всех студентов группы
                </Button>
              </div>
            )}

            <div className="p-2.5 rounded bg-muted/40 border border-border text-[11px] text-muted-foreground flex flex-col gap-1">
              <span className="font-medium text-foreground">
                Выбрано: {creatorSelectedStudentIds.length} студент(ов)
              </span>
              <span>
                Данные пропусков и посещаемости рассчитываются из электронного журнала LMS автоматически.
              </span>
            </div>

            <div className="mt-auto pt-3 border-t flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatorStep(1)}
                className="h-8 text-xs"
              >
                Назад
              </Button>
              <Button
                size="sm"
                disabled={creatorSelectedStudentIds.length === 0}
                onClick={() => setCreatorStep(3)}
                className="h-8 text-xs gap-1"
              >
                Далее: Реквизиты
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 p-3.5 rounded-lg border border-border bg-card flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-foreground text-xs">
                  {selectedTemplate.isMultiStudent
                    ? "Список студентов группы (отметьте нужных)"
                    : "Выберите одного студента"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Показатели рассчитаны за текущий учебный семестр
                </p>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Поиск студента..."
                  value={studentSearchInCreator}
                  onChange={(e) => setStudentSearchInCreator(e.target.value)}
                  className="h-7 text-xs pl-7"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground">
                    <th className="p-2 w-8 text-center">Выбор</th>
                    <th className="p-2 font-medium">№</th>
                    <th className="p-2 font-medium">ФИО студента</th>
                    <th className="p-2 font-medium">Посещаемость</th>
                    <th className="p-2 font-medium">Пропуски (ч.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {availableStudentsForGroup.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                        {groups.length === 0
                          ? "В системе пока нет созданных групп и студентов."
                          : `В группе ${creatorGroup || "—"} пока нет зарегистрированных студентов.`}
                      </td>
                    </tr>
                  ) : (
                    availableStudentsForGroup.map((st, idx) => {
                      const isSelected = creatorSelectedStudentIds.includes(st.id);
                      return (
                        <tr
                          key={st.id}
                          onClick={() => handleToggleStudentSelection(st)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-primary/5" : "hover:bg-muted/20"
                          }`}
                        >
                          <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleStudentSelection(st)}
                            />
                          </td>
                          <td className="p-2 font-mono text-[10px] text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="p-2 font-medium text-foreground">
                            {st.name}
                          </td>
                          <td className="p-2">
                            <span
                              className={`font-mono font-medium ${
                                st.attendanceRate < 60
                                  ? "text-destructive"
                                  : "text-foreground"
                              }`}
                            >
                              {st.attendanceRate}%
                            </span>
                          </td>
                          <td className="p-2 font-mono text-muted-foreground font-medium">
                            {st.unexcusedHours} ч.
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DETAILS & CONTENT */}
      {creatorStep === 3 && (
        <div
          className={`w-full ${
            selectedTemplate.isMultiStudent
              ? "grid grid-cols-1 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-4"
          }`}
        >
          <div
            className={`${
              selectedTemplate.isMultiStudent ? "lg:col-span-2" : "w-full"
            } p-3.5 rounded-lg border border-border bg-card flex flex-col gap-3`}
          >
            <h3 className="font-bold text-foreground text-xs">
              Официальные реквизиты документа
            </h3>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-muted-foreground font-medium">
                  Адресат (кому подаётся)
                </label>
                <span className="text-[10px] text-muted-foreground">
                  выберите вариант или оставьте пустым
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setCreatorAddressee("По месту требования")}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    creatorAddressee === "По месту требования"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  По месту требования
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorAddressee("В Военный комиссариат")}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    creatorAddressee === "В Военный комиссариат"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  В Военный комиссариат
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCreatorAddressee(
                      "Директору Профессионального лицея №98\nСагынбековой Ч. М."
                    )
                  }
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    creatorAddressee.includes("Сагынбековой")
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Директору лицея
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorAddressee("")}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    !creatorAddressee.trim()
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Оставить пустым
                </button>
              </div>

              <Textarea
                rows={2}
                value={creatorAddressee}
                onChange={(e) => setCreatorAddressee(e.target.value)}
                placeholder="Например: По месту требования (или оставьте пустым)..."
                className="text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted-foreground">
                  Должность заявителя
                </label>
                <Input
                  value={creatorSignatoryRole}
                  onChange={(e) => setCreatorSignatoryRole(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted-foreground">
                  ФИО заявителя (подпись)
                </label>
                <Input
                  value={creatorSignatory}
                  onChange={(e) => setCreatorSignatory(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted-foreground">
                Общее основание документа
              </label>
              <Input
                value={creatorGeneralReason}
                onChange={(e) => setCreatorGeneralReason(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Characteristic Blocks */}
            {selectedTemplate.id === "student_characteristic" && (
              <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                      Конструктор блоков характеристики
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Включайте или отключайте разделы галочками — текст и подписи адаптируются автоматически
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const allOn = {
                          academic: true,
                          professional: true,
                          personal: true,
                          social: true,
                          habits: true,
                          purpose: true,
                          signCurator: true,
                          signViceDirector: true,
                        };
                        setCharBlocks(allOn);
                      }}
                      className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Включить все
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 border-t border-border/60">
                  <label className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                    <Checkbox
                      checked={charBlocks.academic}
                      onCheckedChange={() => handleToggleCharBlock("academic")}
                      className="mt-0.5"
                    />
                    <div className="text-[11px]">
                      <p className="font-medium text-foreground">1. Успеваемость и журнал</p>
                      <p className="text-[10px] text-muted-foreground">Оценки, посещаемость % и долги</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                    <Checkbox
                      checked={charBlocks.professional}
                      onCheckedChange={() => handleToggleCharBlock("professional")}
                      className="mt-0.5"
                    />
                    <div className="text-[11px]">
                      <p className="font-medium text-foreground">2. Олимпиады и профессия</p>
                      <p className="text-[10px] text-muted-foreground">Интерес к IT и профмастерство</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                    <Checkbox
                      checked={charBlocks.personal}
                      onCheckedChange={() => handleToggleCharBlock("personal")}
                      className="mt-0.5"
                    />
                    <div className="text-[11px]">
                      <p className="font-medium text-foreground">3. Личные качества</p>
                      <p className="text-[10px] text-muted-foreground">Характер, вежливость, авторитет</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                    <Checkbox
                      checked={charBlocks.social}
                      onCheckedChange={() => handleToggleCharBlock("social")}
                      className="mt-0.5"
                    />
                    <div className="text-[11px]">
                      <p className="font-medium text-foreground">4. Общественная активность</p>
                      <p className="text-[10px] text-muted-foreground">Мероприятия группы и лицея</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                    <Checkbox
                      checked={charBlocks.habits}
                      onCheckedChange={() => handleToggleCharBlock("habits")}
                      className="mt-0.5"
                    />
                    <div className="text-[11px]">
                      <p className="font-medium text-foreground">5. Дисциплина и устав</p>
                      <p className="text-[10px] text-muted-foreground">Соблюдение правил, без вредных привычек</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                    <Checkbox
                      checked={charBlocks.purpose}
                      onCheckedChange={() => handleToggleCharBlock("purpose")}
                      className="mt-0.5"
                    />
                    <div className="text-[11px]">
                      <p className="font-medium text-foreground">6. Цель выдачи</p>
                      <p className="text-[10px] text-muted-foreground">По месту требования / в военкомат</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-muted-foreground">
                  Содержание текста документа
                </label>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>Переменные:</span>
                  {selectedTemplate.variables.slice(0, 3).map((v: string) => (
                    <code key={v} className="bg-muted px-1 rounded text-primary">
                      {v}
                    </code>
                  ))}
                </div>
              </div>
              <Textarea
                rows={selectedTemplate.isMultiStudent ? 6 : 10}
                value={creatorDescription}
                onChange={(e) => setCreatorDescription(e.target.value)}
                className="text-xs resize-y font-mono leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatorStep(2)}
                className="h-8 text-xs"
              >
                Назад
              </Button>
              <Button
                size="sm"
                onClick={() => setCreatorStep(4)}
                className="h-8 text-xs gap-1"
              >
                Предпросмотр бланка
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Individual notes for multi-student templates */}
          {selectedTemplate.isMultiStudent && (
            <div className="lg:col-span-1 p-3.5 rounded-lg border border-border bg-card flex flex-col gap-3">
              <div>
                <h3 className="font-bold text-foreground text-xs">
                  Индивидуальные основания
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Заполните отдельную причину для каждого студента
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t">
                <Checkbox
                  checked={enableIndividualReasons}
                  onCheckedChange={(checked) => setEnableIndividualReasons(Boolean(checked))}
                  id="indiv-toggle"
                />
                <label htmlFor="indiv-toggle" className="text-xs font-medium cursor-pointer">
                  Добавить колонку «Особое основание»
                </label>
              </div>

              {enableIndividualReasons && (
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {students
                    .filter((st) => creatorSelectedStudentIds.includes(st.id))
                    .map((st) => (
                      <div
                        key={st.id}
                        className="p-2 rounded border border-border bg-background flex flex-col gap-1 text-xs"
                      >
                        <span className="font-medium text-foreground">{st.name}</span>
                        <Input
                          placeholder="Причина (например: 72 часа пропусков без уваж. причины)..."
                          value={creatorIndividualReasons[st.id] || ""}
                          onChange={(e) =>
                            setCreatorIndividualReasons((prev) => ({
                              ...prev,
                              [st.id]: e.target.value,
                            }))
                          }
                          className="h-7 text-[11px]"
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: OFFICIAL A4 PAPER PREVIEW */}
      {creatorStep === 4 && (
        <div className="flex flex-col gap-3">
          {/* Action bar */}
          <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatorStep(3)}
                className="h-8 text-xs"
              >
                Назад к настройкам
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintDocument}
                className="h-8 text-xs gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Печать
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveDocument(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                Сохранить черновик
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveDocument(false)}
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
              >
                <Send className="h-3.5 w-3.5" />
                {selectedTemplate.category === "CURATOR" ||
                selectedTemplate.id === "student_characteristic"
                  ? "Сформировать документ"
                  : "Передать администрации лицея"}
              </Button>
            </div>
          </div>

          {/* A4 Sheet Container */}
          <div className="flex justify-center bg-muted/40 p-4 rounded-lg border border-border w-full">
            <div className="w-full bg-white text-zinc-900 shadow-sm border border-border p-8 rounded-sm font-sans text-xs leading-relaxed print:p-0 print:border-none print:shadow-none">
              {/* Official Header */}
              <div className="text-center pb-2 mb-3">
                <p className="text-[10px] tracking-wider uppercase font-bold text-zinc-900">
                  МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ
                </p>
                <p className="text-sm font-extrabold uppercase tracking-wide text-zinc-950 mt-0.5">
                  ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98
                </p>
              </div>
              <hr className="border-t-[1.5px] border-zinc-950 mb-3" />

              {/* Document Meta Row */}
              <div className="flex justify-between items-start mb-4 text-[11px] font-sans">
                <div>
                  <p>
                    Дата:{" "}
                    <span className="font-medium">
                      {new Date().toLocaleDateString("ru-RU")} г.
                    </span>
                  </p>
                </div>

                <div className="text-right text-[11px] max-w-xs whitespace-pre-line font-medium text-zinc-800">
                  {creatorAddressee?.trim() || "По месту требования"}
                </div>
              </div>

              {/* Title */}
              <div className="text-center my-4">
                <h2 className="text-xs font-extrabold uppercase tracking-wider font-sans text-zinc-950">
                  {selectedTemplate.title}
                </h2>
              </div>

              {/* Document Content */}
              {selectedTemplate.isMultiStudent ? (
                <>
                  {creatorGeneralReason && (
                    <div className="text-justify mb-3 font-sans text-xs whitespace-pre-line leading-relaxed">
                      {creatorGeneralReason}
                    </div>
                  )}

                  {/* Multi-student Table */}
                  <div className="my-3">
                    <table className="w-full border-collapse border border-zinc-800 text-[10.5px] font-sans">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-zinc-800 font-bold text-zinc-900">
                          <th className="border border-zinc-800 p-1 w-8 text-center">№</th>
                          <th className="border border-zinc-800 p-1 text-left">ФИО студента</th>
                          <th className="border border-zinc-800 p-1 w-20 text-center">Группа</th>
                          <th className="border border-zinc-800 p-1 w-28 text-center">Пропуски (ч.)</th>
                          {enableIndividualReasons &&
                            creatorSelectedStudentIds.some(
                              (id) => creatorIndividualReasons[id]?.trim()
                            ) && (
                              <th className="border border-zinc-800 p-1 text-left">
                                Особое примечание
                              </th>
                            )}
                        </tr>
                      </thead>
                      <tbody>
                        {students
                          .filter((st) => creatorSelectedStudentIds.includes(st.id))
                          .map((st, idx) => (
                            <tr key={st.id} className="border-b border-zinc-800">
                              <td className="border border-zinc-800 p-1 text-center font-mono">
                                {idx + 1}
                              </td>
                              <td className="border border-zinc-800 p-1 font-semibold">
                                {st.name}
                              </td>
                              <td className="border border-zinc-800 p-1 text-center">
                                {st.group || creatorGroup || "—"}
                              </td>
                              <td className="border border-zinc-800 p-1 text-center font-mono font-medium">
                                {st.unexcusedHours} ч.
                              </td>
                              {enableIndividualReasons &&
                                creatorSelectedStudentIds.some(
                                  (id) => creatorIndividualReasons[id]?.trim()
                                ) && (
                                  <td className="border border-zinc-800 p-1 text-zinc-700">
                                    {creatorIndividualReasons[st.id]?.trim() || "—"}
                                  </td>
                                )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Resolution Text */}
                  {creatorDescription && (
                    <div className="text-justify my-3 font-sans text-xs whitespace-pre-line leading-relaxed">
                      {creatorDescription}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-justify my-3 font-sans text-xs whitespace-pre-line leading-relaxed">
                  {creatorDescription}
                </div>
              )}

              {/* Signatures Block */}
              <div className="mt-8 pt-4 border-t border-zinc-300 font-sans text-xs flex justify-between items-end gap-6">
                <div>
                  <p className="font-bold text-zinc-950">
                    Мастер группы (куратор):
                  </p>
                  <p className="text-[9px] text-zinc-500 mt-1.5">
                    (подпись) _______________________
                  </p>
                  <p className="font-bold text-zinc-950 text-[11px] mt-2">
                    {creatorSignatory || currentUser?.name || "Вопольский Виктор Владимирович"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-zinc-950">
                    Зам. директора по учебной части:
                  </p>
                  <p className="text-[9px] text-zinc-500 mt-1.5">
                    (подпись) _______________________
                  </p>
                  <p className="font-bold text-zinc-950 text-[11px] mt-2">
                    Тоялиева М. Р.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
