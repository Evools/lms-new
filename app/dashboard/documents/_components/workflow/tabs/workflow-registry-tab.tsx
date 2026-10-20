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
import { Search, Eye, ShieldCheck, Download, Trash2 } from "lucide-react";
import type { WorkflowDocument } from "../../../workflow-data";
import { getDocumentStatusBadge } from "../workflow-types";

interface WorkflowRegistryTabProps {
  workflowDocs: WorkflowDocument[];
  groups: string[];
  canManage: boolean;
  currentUserId?: string;
  activeFilterMode?: "ALL_DOCS" | "MY_DOCS" | "APPROVAL" | "ARCHIVE";
  onPreviewDoc: (doc: WorkflowDocument) => void;
  onApprovalDoc: (doc: WorkflowDocument) => void;
  onDownloadPdf: (doc: WorkflowDocument) => void;
  onDeleteDoc: (doc: WorkflowDocument) => void;
}

export function WorkflowRegistryTab({
  workflowDocs,
  groups,
  canManage,
  currentUserId,
  activeFilterMode = "ALL_DOCS",
  onPreviewDoc,
  onApprovalDoc,
  onDownloadPdf,
  onDeleteDoc,
}: WorkflowRegistryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("ALL");

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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[130px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="ALL">Все статусы</SelectItem>
              <SelectItem value="DRAFT">Черновик</SelectItem>
              <SelectItem value="PENDING_APPROVAL">На согласовании</SelectItem>
              <SelectItem value="APPROVED">Утверждён</SelectItem>
              <SelectItem value="REJECTED">Отклонён</SelectItem>
              <SelectItem value="ARCHIVED">В архиве</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="h-8 text-xs w-[120px]">
              <SelectValue placeholder="Группа" />
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
            <tr className="border-b bg-muted/40 text-muted-foreground">
              <th className="p-2.5 font-medium">Номер документа</th>
              <th className="p-2.5 font-medium">Название и категория</th>
              <th className="p-2.5 font-medium">Группа / Студенты</th>
              <th className="p-2.5 font-medium">Автор / Роль</th>
              <th className="p-2.5 font-medium">Дата</th>
              <th className="p-2.5 font-medium">Статус</th>
              <th className="p-2.5 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDocs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-muted-foreground"
                >
                  Документы не найдены по заданным критериям
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const statusMeta = getDocumentStatusBadge(doc);
                return (
                  <tr key={doc.id} className="hover:bg-muted/20">
                    <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap">
                      {doc.docNumber}
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {doc.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {doc.categoryLabel}
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-col gap-0.5">
                        {doc.groupName && (
                          <Badge
                            variant="outline"
                            className="w-fit text-[10px] font-mono px-1.5 py-0"
                          >
                            {doc.groupName}
                          </Badge>
                        )}
                        {doc.students.length > 0 && (
                          <span className="text-muted-foreground text-[11px] line-clamp-1">
                            {doc.students.map((s: any) => s.name).join(", ")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-col">
                        <span className="text-foreground">{doc.authorName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {doc.authorRole}
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`w-fit inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${statusMeta.bg}`}
                        >
                          {statusMeta.icon}
                          {statusMeta.label}
                        </span>
                        <span className={`text-[10px] ${statusMeta.text}`}>
                          {statusMeta.subtext}
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadPdf(doc)}
                          className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                          title="Скачать PDF"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteDoc(doc)}
                            className="h-6 px-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Удалить документ"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
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
