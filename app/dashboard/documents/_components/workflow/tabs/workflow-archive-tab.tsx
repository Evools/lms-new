"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, Plus, FolderOpen, BookOpen, ExternalLink, Trash2 } from "lucide-react";
import type { DocumentDTO } from "../../../actions";
import { ALLOWED_CATEGORIES } from "../../../constants";

interface WorkflowArchiveTabProps {
  regulatoryDocs: DocumentDTO[];
  canManage: boolean;
  onOpenUploadDialog: () => void;
  onDeleteRegDoc: (doc: DocumentDTO) => void;
}

export function WorkflowArchiveTab({
  regulatoryDocs,
  canManage,
  onOpenUploadDialog,
  onDeleteRegDoc,
}: WorkflowArchiveTabProps) {
  const [regSearch, setRegSearch] = useState("");
  const [regCategory, setRegCategory] = useState("ALL");

  const filteredDocs = regulatoryDocs.filter((doc) => {
    if (regCategory !== "ALL" && doc.category !== regCategory) return false;
    if (regSearch && !doc.title.toLowerCase().includes(regSearch.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold text-foreground">
            Нормативная база и внутренние документы лицея
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Методические указания, положения, инструкции, приказы и расписания
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Поиск файла..."
              value={regSearch}
              onChange={(e) => setRegSearch(e.target.value)}
              className="h-7 text-xs pl-7"
            />
          </div>

          <Select value={regCategory} onValueChange={(val) => setRegCategory(val || "ALL")}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue placeholder="Категория">
                {regCategory === "ALL" ? "Все категории" : regCategory}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="ALL">Все категории</SelectItem>
              {ALLOWED_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManage && (
            <Button
              size="xs"
              onClick={onOpenUploadDialog}
              className="h-7 text-xs px-2.5 bg-primary text-primary-foreground gap-1 font-medium cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить документ
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full py-12 text-center flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg bg-muted/10 text-xs">
            <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">
              Документы лицея пока не загружены
            </p>
            {canManage && (
              <Button
                size="xs"
                variant="outline"
                onClick={onOpenUploadDialog}
                className="mt-1 gap-1 h-7 text-xs"
              >
                <Plus className="h-3 w-3" />
                Загрузить первый документ
              </Button>
            )}
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-3 rounded-lg border border-border bg-card flex flex-col justify-between gap-2"
            >
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground line-clamp-1">
                    {doc.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {doc.category} • {doc.authorName}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(doc.createdAt).toLocaleDateString("ru-RU")}
                </span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-[11px] flex items-center gap-1 font-medium"
                  >
                    Открыть
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onDeleteRegDoc(doc)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Удалить документ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
