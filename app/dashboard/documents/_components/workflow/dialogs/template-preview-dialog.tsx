"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { DocumentTemplateItem } from "../../../workflow-data";
import { substituteVariables } from "../../../workflow-data";
import type { WorkflowStudentDTO } from "../../../actions";

interface TemplatePreviewDialogProps {
  previewingTemplate: DocumentTemplateItem | null;
  onClose: () => void;
  onUseTemplate: (tpl: DocumentTemplateItem) => void;
  sampleStudent?: WorkflowStudentDTO;
}

export function TemplatePreviewDialog({
  previewingTemplate,
  onClose,
  onUseTemplate,
  sampleStudent,
}: TemplatePreviewDialogProps) {
  if (!previewingTemplate) return null;

  return (
    <Dialog open={!!previewingTemplate} onOpenChange={() => onClose()}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="place-items-start text-left gap-1">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {previewingTemplate.code}
            </span>
            Шаблон: {previewingTemplate.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {previewingTemplate.categoryLabel} • {previewingTemplate.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Official A4 Sheet */}
          <div className="bg-white text-zinc-900 border border-border p-6 rounded font-sans text-xs leading-relaxed">
            {/* Official Header */}
            <div className="text-center pb-2 mb-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-900">
                МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ
              </p>
              <p className="text-sm font-extrabold uppercase tracking-wide text-zinc-950 mt-0.5">
                ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98
              </p>
            </div>
            <hr className="border-t-[1.5px] border-zinc-950 mb-3" />

            {/* Meta & Addressee */}
            <div className="flex justify-between items-start mb-4 text-[10px]">
              <div>
                <p>Дата: {new Date().toLocaleDateString("ru-RU")} г.</p>
              </div>
              {previewingTemplate.defaultAddressee?.trim() && (
                <div className="text-right whitespace-pre-line font-medium text-zinc-800 max-w-xs">
                  {previewingTemplate.defaultAddressee.trim()}
                </div>
              )}
            </div>

            {/* Title */}
            <div className="text-center my-4">
              <h3 className="font-bold text-xs uppercase tracking-wide">
                {previewingTemplate.title}
              </h3>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                учебная группа ИС-1-25 (образец заполнения)
              </p>
            </div>

            {/* Reason */}
            <p className="text-justify my-2 text-[11px]">
              {previewingTemplate.defaultReason}
            </p>

            {/* Sample Table if MultiStudent */}
            {previewingTemplate.isMultiStudent ? (
              <div className="my-3">
                <table className="w-full border-collapse border border-zinc-800 text-[10px]">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-800 font-bold">
                      <th className="border border-zinc-800 p-1 text-center w-6">№</th>
                      <th className="border border-zinc-800 p-1 text-left">ФИО обучающегося</th>
                      <th className="border border-zinc-800 p-1 text-center w-14">Группа</th>
                      <th className="border border-zinc-800 p-1 text-center w-16">Посещ. %</th>
                      <th className="border border-zinc-800 p-1 text-left">Основание / Примечание</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800">
                      <td className="border border-zinc-800 p-1 text-center font-mono">1</td>
                      <td className="border border-zinc-800 p-1 font-semibold">Асанов Азамат Бакытович</td>
                      <td className="border border-zinc-800 p-1 text-center">ИС-1-25</td>
                      <td className="border border-zinc-800 p-1 text-center font-mono">54%</td>
                      <td className="border border-zinc-800 p-1">72 часа пропусков без уважительной причины</td>
                    </tr>
                    <tr className="border-b border-zinc-800">
                      <td className="border border-zinc-800 p-1 text-center font-mono">2</td>
                      <td className="border border-zinc-800 p-1 font-semibold">Бакиров Данияр Эркинович</td>
                      <td className="border border-zinc-800 p-1 text-center">ИС-1-25</td>
                      <td className="border border-zinc-800 p-1 text-center font-mono">48%</td>
                      <td className="border border-zinc-800 p-1">86 часов пропусков без уважительной причины</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* Prewritten official text */}
            <div className="text-justify my-3 text-[11px] whitespace-pre-line leading-relaxed font-sans text-zinc-900">
              {substituteVariables(previewingTemplate.defaultPrewrittenBody, {
                groupName: "ИС-1-25",
                student: sampleStudent,
              })}
            </div>

            {/* Signatures */}
            <div className="mt-7 pt-4 border-t border-zinc-300 flex justify-between text-[11px]">
              <div>
                <p className="font-bold">Мастер группы (куратор):</p>
                <p className="text-[9px] text-zinc-500 mt-1.5">
                  (подпись) _______________________
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">Тоялиева М. Р.</p>
                <p className="text-[9px] text-zinc-500 mt-1.5">
                  (подпись) _______________________
                </p>
              </div>
            </div>
          </div>

          {/* Variables reference block */}
          <div className="p-2.5 rounded border border-border bg-muted/30 flex flex-col gap-1.5">
            <span className="font-bold text-foreground text-xs">
              Переменные автоматической подстановки:
            </span>
            <div className="flex flex-wrap gap-1">
              {previewingTemplate.variables.map((v: string) => (
                <code
                  key={v}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border font-mono text-primary font-medium"
                >
                  {v}
                </code>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            Закрыть
          </Button>
          <Button
            size="sm"
            onClick={() => onUseTemplate(previewingTemplate)}
            className="h-8 text-xs gap-1 bg-primary text-primary-foreground"
          >
            Создать по этому шаблону
            <ArrowRight className="h-3 w-3" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
