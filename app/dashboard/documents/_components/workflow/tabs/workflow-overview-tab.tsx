"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  GraduationCap,
  Users,
  AlertCircle,
  ArrowRight,
  FileSignature,
  Eye,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { WorkflowDocument, DocumentTemplateItem } from "../../../workflow-data";
import { DOCUMENT_TEMPLATES, substituteVariables } from "../../../workflow-data";
import { getDocumentStatusBadge } from "../workflow-types";
import type { WorkflowStudentDTO } from "../../../actions";

interface WorkflowOverviewTabProps {
  stats: {
    total: number;
    drafts: number;
    pending: number;
    approved: number;
    archived: number;
  };
  workflowDocs: WorkflowDocument[];
  students: WorkflowStudentDTO[];
  creatorGroup: string;
  creatorSelectedStudentIds: string[];
  canManage: boolean;
  onQuickCreate: (template: DocumentTemplateItem, description: string) => void;
  onNavigateToAll: () => void;
  onPreviewDoc: (doc: WorkflowDocument) => void;
  onApprovalDoc: (doc: WorkflowDocument) => void;
  onDeleteDoc: (doc: WorkflowDocument) => void;
}

export function WorkflowOverviewTab({
  stats,
  workflowDocs,
  students,
  creatorGroup,
  creatorSelectedStudentIds,
  canManage,
  onQuickCreate,
  onNavigateToAll,
  onPreviewDoc,
  onApprovalDoc,
  onDeleteDoc,
}: WorkflowOverviewTabProps) {
  const getSelectedStudent = () =>
    students.find((s) => s.id === creatorSelectedStudentIds[0]) || students[0];

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Всего документов</span>
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-foreground">
              {stats.total}
            </span>
            <span className="text-[10px] text-muted-foreground">в базе LMS</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Рапорты на педсовете</span>
            <Send className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-primary">
              {stats.pending}
            </span>
            <span className="text-[10px] text-primary">ждут решения</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Готовые и утверждённые</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-600">
              {stats.approved}
            </span>
            <span className="text-[10px] text-muted-foreground">готовы к выдаче</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium">Черновики</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-muted-foreground">
              {stats.drafts}
            </span>
            <span className="text-[10px] text-muted-foreground">в работе</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-3 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Быстрые действия: создать популярный документ
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Автозаполнение данными посещаемости и групп
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Characteristic */}
          <button
            onClick={() => {
              const tpl = DOCUMENT_TEMPLATES[0];
              const sel = getSelectedStudent();
              const desc = substituteVariables(tpl.defaultPrewrittenBody, {
                student: sel,
                groupName: creatorGroup,
              });
              onQuickCreate(tpl, desc);
            }}
            className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1 cursor-pointer"
          >
            <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-foreground line-clamp-1">
              Характеристика
            </span>
            <span className="text-[10px] text-muted-foreground">
              Готовый текст
            </span>
          </button>

          {/* Expulsion Single */}
          <button
            onClick={() => {
              const tpl = DOCUMENT_TEMPLATES[1];
              const sel = getSelectedStudent();
              const desc = substituteVariables(tpl.defaultPrewrittenBody, {
                student: sel,
                groupName: creatorGroup,
              });
              onQuickCreate(tpl, desc);
            }}
            className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1 cursor-pointer"
          >
            <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-foreground line-clamp-1">
              Рапорт на отчисление
            </span>
            <span className="text-[10px] text-muted-foreground">
              Индивидуальный
            </span>
          </button>

          {/* Expulsion Group */}
          <button
            onClick={() => {
              const tpl = DOCUMENT_TEMPLATES[2];
              const desc = substituteVariables(tpl.defaultPrewrittenBody, {
                groupName: creatorGroup,
              });
              onQuickCreate(tpl, desc);
            }}
            className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1 cursor-pointer"
          >
            <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-foreground line-clamp-1">
              Групповой рапорт
            </span>
            <span className="text-[10px] text-muted-foreground">
              Отчисление группы
            </span>
          </button>

          {/* Attendance Report */}
          <button
            onClick={() => {
              const tpl = DOCUMENT_TEMPLATES[3];
              const desc = substituteVariables(tpl.defaultPrewrittenBody, {
                groupName: creatorGroup,
              });
              onQuickCreate(tpl, desc);
            }}
            className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1 cursor-pointer"
          >
            <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-foreground line-clamp-1">
              О пропусках
            </span>
            <span className="text-[10px] text-muted-foreground">
              Предупреждение
            </span>
          </button>

          {/* Transfer */}
          <button
            onClick={() => {
              const tpl = DOCUMENT_TEMPLATES[4];
              const sel = getSelectedStudent();
              const desc = substituteVariables(tpl.defaultPrewrittenBody, {
                student: sel,
                groupName: creatorGroup,
              });
              onQuickCreate(tpl, desc);
            }}
            className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1 cursor-pointer"
          >
            <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-foreground line-clamp-1">
              О переводе
            </span>
            <span className="text-[10px] text-muted-foreground">
              В другую группу
            </span>
          </button>

          {/* Service Note */}
          <button
            onClick={() => {
              const tpl = DOCUMENT_TEMPLATES[7];
              const desc = substituteVariables(tpl.defaultPrewrittenBody, {
                groupName: creatorGroup,
              });
              onQuickCreate(tpl, desc);
            }}
            className="p-2.5 rounded-md border border-border bg-background hover:border-primary transition-colors text-left flex flex-col gap-1 cursor-pointer"
          >
            <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
              <FileSignature className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-foreground line-clamp-1">
              Служебная записка
            </span>
            <span className="text-[10px] text-muted-foreground">
              Администрации
            </span>
          </button>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="p-3 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold text-foreground">
              Последние сформированные документы
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Документы учебного процесса с историей согласований
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToAll}
            className="h-7 text-xs px-2.5"
          >
            Все документы
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <div className="overflow-x-auto border border-border rounded-md">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="p-2 font-medium">Номер и название</th>
                <th className="p-2 font-medium">Группа / Субъекты</th>
                <th className="p-2 font-medium">Автор</th>
                <th className="p-2 font-medium">Статус</th>
                <th className="p-2 font-medium">Состояние / Резолюция</th>
                <th className="p-2 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workflowDocs.slice(0, 5).map((doc) => {
                const statusMeta = getDocumentStatusBadge(doc);
                return (
                  <tr key={doc.id} className="hover:bg-muted/20">
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {doc.docNumber}
                        </span>
                        <span className="font-medium text-foreground line-clamp-1">
                          {doc.title}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        {doc.groupName && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-1.5 py-0"
                          >
                            {doc.groupName}
                          </Badge>
                        )}
                        {doc.students.length > 0 && (
                          <span className="text-muted-foreground text-[11px]">
                            ({doc.students.length} студ.)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {doc.authorName}
                    </td>
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${statusMeta.bg}`}
                      >
                        {statusMeta.icon}
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      <span className={statusMeta.text}>
                        {statusMeta.subtext}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPreviewDoc(doc)}
                          className="h-6 px-2 text-[11px]"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Бланк
                        </Button>
                        {doc.status === "PENDING_APPROVAL" && (
                          <Button
                            size="sm"
                            onClick={() => onApprovalDoc(doc)}
                            className="h-6 px-2 text-[11px] bg-primary text-primary-foreground gap-1"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Решение педсовета
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteDoc(doc)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Удалить документ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
