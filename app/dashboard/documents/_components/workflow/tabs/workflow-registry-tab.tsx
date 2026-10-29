"use client";

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, Eye, ShieldCheck, Download, Trash2, Printer } from "lucide-react";
import type { WorkflowDocument } from "../../../workflow-data";
import { getDocumentStatusBadge } from "../workflow-types";

interface WorkflowRegistryTabProps {
  workflowDocs: WorkflowDocument[];
  groups: string[];
  canManage: boolean;
  canApprove: boolean;
  currentUserId?: string;
  activeFilterMode?: "ALL_DOCS" | "MY_DOCS" | "APPROVAL" | "ARCHIVE";
  onPreviewDoc: (doc: WorkflowDocument) => void;
  onApprovalDoc: (doc: WorkflowDocument) => void;
  onPrintDoc: (doc: WorkflowDocument) => void;
  onDownloadPdf: (doc: WorkflowDocument) => void;
  onDeleteDoc: (doc: WorkflowDocument) => void;
}

export function WorkflowRegistryTab({
  workflowDocs,
  groups,
  canManage,
  canApprove,
  currentUserId,
  activeFilterMode = "ALL_DOCS",
  onPreviewDoc,
  onApprovalDoc,
  onPrintDoc,
  onDownloadPdf,
  onDeleteDoc,
}: WorkflowRegistryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");

  const statusFilterLabels: Record<string, string> = {
    ALL: "Все статусы",
    DRAFT: "Черновик",
    PENDING_APPROVAL: "На рассмотрении",
    APPROVED: "Утверждён",
    REJECTED: "Отклонён",
    ARCHIVED: "В архиве",
  };

  const filteredDocs = useMemo(() => {
    return workflowDocs.filter((doc) => {
      // Tab-specific filters
      if (activeFilterMode === "MY_DOCS") {
        if (currentUserId && doc.authorId !== currentUserId) return false;
      }
      if (activeFilterMode === "APPROVAL") {
        if (doc.status !== "PENDING_APPROVAL") return false;
      }
      if (activeFilterMode === "ARCHIVE") {
        if (!doc.isArchived && doc.status !== "ARCHIVED") return false;
      }

      // Dropdown filters
      if (statusFilter !== "ALL" && doc.status !== statusFilter) return false;
      if (groupFilter !== "ALL" && doc.groupName !== groupFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesNumber = doc.docNumber.toLowerCase().includes(query);
        const matchesAuthor = doc.authorName.toLowerCase().includes(query);
        const matchesStudent = doc.students.some((s: any) =>
          s.name.toLowerCase().includes(query)
        );
        const matchesGroup = doc.groupName?.toLowerCase().includes(query);
        if (
          !matchesTitle &&
          !matchesNumber &&
          !matchesAuthor &&
          !matchesStudent &&
          !matchesGroup
        ) {
          return false;
        }
      }

      return true;
    });
  }, [workflowDocs, activeFilterMode, currentUserId, statusFilter, groupFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-3">
      {/* Filter Bar */}
      <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, номеру, студенту или автору..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs w-full"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val || "ALL")}
          >
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="Все статусы">
                {statusFilterLabels[statusFilter] || "Все статусы"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="ALL">Все статусы</SelectItem>
              <SelectItem value="DRAFT">Черновик</SelectItem>
              <SelectItem value="PENDING_APPROVAL">На рассмотрении</SelectItem>
              <SelectItem value="APPROVED">Утверждён</SelectItem>
              <SelectItem value="REJECTED">Отклонён</SelectItem>
              <SelectItem value="ARCHIVED">В архиве</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={groupFilter}
            onValueChange={(val) => setGroupFilter(val || "ALL")}
          >
            <SelectTrigger className="h-8 text-xs w-[135px]">
              <SelectValue placeholder="Все группы">
                {groupFilter === "ALL" ? "Все группы" : groupFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="ALL">Все группы</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(statusFilter !== "ALL" || groupFilter !== "ALL" || searchQuery.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("ALL");
                setGroupFilter("ALL");
                setSearchQuery("");
              }}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Сбросить
            </Button>
          )}
        </div>

        <div className="text-muted-foreground text-[11px] whitespace-nowrap">
          Найдено документов:{" "}
          <span className="font-bold text-foreground">{filteredDocs.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-lg bg-card">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground text-[11px]">
              <th className="py-2.5 px-3 font-medium">Документ</th>
              <th className="py-2.5 px-3 font-medium">Группа и студенты</th>
              <th className="py-2.5 px-3 font-medium">Автор</th>
              <th className="py-2.5 px-3 font-medium">Статус согласования</th>
              <th className="py-2.5 px-3 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDocs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  Документы не найдены по заданным критериям
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const statusMeta = getDocumentStatusBadge(doc);
                const studentSummary =
                  doc.students.length === 1
                    ? doc.students[0].name
                    : doc.students.length > 1
                      ? `${doc.students[0].name} и ещё ${doc.students.length - 1}`
                      : "Без привязки к студенту";
                return (
                  <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 max-w-[320px]">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="font-mono font-medium text-foreground/80">
                            {doc.docNumber}
                          </span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString("ru-RU")}</span>
                          <span>•</span>
                          <span className="truncate">{doc.categoryLabel}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onPreviewDoc(doc)}
                          className="font-medium text-foreground hover:text-primary transition-colors text-left truncate cursor-pointer"
                          title={doc.title}
                        >
                          {doc.title}
                        </button>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {doc.groupName && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-1.5 py-0 h-5 shrink-0"
                          >
                            {doc.groupName}
                          </Badge>
                        )}
                        <span
                          className="text-muted-foreground text-[11px] truncate max-w-[190px]"
                          title={doc.students.map((s) => s.name).join(", ")}
                        >
                          {studentSummary}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium text-[11px]">
                          {doc.authorName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {doc.authorRole}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`w-fit inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border whitespace-nowrap ${statusMeta.bg}`}
                        >
                          {statusMeta.icon}
                          {statusMeta.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {statusMeta.subtext}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {canApprove && doc.status === "PENDING_APPROVAL" && (
                          <Button
                            size="sm"
                            onClick={() => onApprovalDoc(doc)}
                            className="h-7 px-2.5 text-[11px] bg-primary text-primary-foreground gap-1 cursor-pointer"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Решение
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPreviewDoc(doc)}
                          className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Бланк
                        </Button>

                        <div className="inline-flex items-center rounded-md border border-border bg-background divide-x divide-border">
                          <button
                            type="button"
                            onClick={() => onPrintDoc(doc)}
                            className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer rounded-l-md"
                            title="Распечатать бланк"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDownloadPdf(doc)}
                            className={`h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer ${
                              !canApprove ? "rounded-r-md" : ""
                            }`}
                            title="Скачать PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          {canApprove && (
                            <button
                              type="button"
                              onClick={() => onDeleteDoc(doc)}
                              className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer rounded-r-md"
                              title="Удалить документ"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
