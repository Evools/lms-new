"use client";

import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck2, Search, Eye, ArrowRight } from "lucide-react";
import { DOCUMENT_TEMPLATES, type DocumentTemplateItem } from "../../../workflow-data";

interface WorkflowTemplatesTabProps {
  onPreviewTemplate: (tpl: DocumentTemplateItem) => void;
  onSelectTemplateForCreate: (tpl: DocumentTemplateItem) => void;
}

export function WorkflowTemplatesTab({
  onPreviewTemplate,
  onSelectTemplateForCreate,
}: WorkflowTemplatesTabProps) {
  const [templateCatFilter, setTemplateCatFilter] = useState<string>("ALL");
  const [templateSearch, setTemplateSearch] = useState<string>("");

  const filteredTemplates = useMemo(() => {
    return DOCUMENT_TEMPLATES.filter((tpl: DocumentTemplateItem) => {
      if (templateCatFilter !== "ALL" && tpl.category !== templateCatFilter)
        return false;
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase();
        const matchesTitle = tpl.title.toLowerCase().includes(q);
        const matchesCode = tpl.code.toLowerCase().includes(q);
        const matchesDesc = tpl.description.toLowerCase().includes(q);
        const matchesVars = tpl.variables.some((v: string) =>
          v.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesCode && !matchesDesc && !matchesVars)
          return false;
      }
      return true;
    });
  }, [templateCatFilter, templateSearch]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header & Stats */}
      <div className="p-3 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold text-foreground flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-primary" />
            Библиотека официальных шаблонов документов лицея
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Характеристики, рапорты на отчисление, о пропусках и служебные записки с готовыми текстами
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Всего шаблонов:</span>
          <span className="font-bold text-foreground font-mono bg-muted px-2 py-0.5 rounded">
            {DOCUMENT_TEMPLATES.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTemplateCatFilter("ALL")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              templateCatFilter === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Все разделы ({DOCUMENT_TEMPLATES.length})
          </button>
          <button
            onClick={() => setTemplateCatFilter("EXPULSION")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              templateCatFilter === "EXPULSION"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Отчисление и дисциплина (4)
          </button>
          <button
            onClick={() => setTemplateCatFilter("CURATOR")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              templateCatFilter === "CURATOR"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Характеристики куратора (4)
          </button>
          <button
            onClick={() => setTemplateCatFilter("REPORTS")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              templateCatFilter === "REPORTS"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Рапорты и служебные (5)
          </button>
          <button
            onClick={() => setTemplateCatFilter("ACADEMIC")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              templateCatFilter === "ACADEMIC"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Учебная деятельность (2)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию, коду или переменной..."
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            className="pl-8 h-8 text-xs w-full"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-3.5 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors flex flex-col justify-between gap-3"
          >
            <div className="flex flex-col gap-2">
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
                    Множественный выбор
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Один студент
                  </span>
                )}
              </div>

              <h3 className="font-bold text-foreground text-xs leading-snug">
                {tpl.title}
              </h3>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {tpl.description}
              </p>

              <div className="flex flex-wrap gap-1 mt-1">
                {tpl.variables.slice(0, 4).map((v) => (
                  <code
                    key={v}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground"
                  >
                    {v}
                  </code>
                ))}
                {tpl.variables.length > 4 && (
                  <span className="text-[9px] text-muted-foreground">
                    +{tpl.variables.length - 4} ещё
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreviewTemplate(tpl)}
                className="h-7 text-xs px-2 gap-1 cursor-pointer"
              >
                <Eye className="h-3 w-3" />
                Бланк
              </Button>
              <Button
                size="sm"
                onClick={() => onSelectTemplateForCreate(tpl)}
                className="h-7 text-xs px-2.5 gap-1 bg-primary text-primary-foreground cursor-pointer"
              >
                Создать
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
