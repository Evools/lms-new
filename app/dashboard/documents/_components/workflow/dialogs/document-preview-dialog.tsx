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
import { FileText, Printer, Download, Trash2, History, CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import type { WorkflowDocument, StudentItem, ApprovalStep } from "../../../workflow-data";
import { cleanDocumentText } from "../document-print-utils";

interface DocumentPreviewDialogProps {
  previewDoc: WorkflowDocument | null;
  onClose: () => void;
  onPrint: (doc: WorkflowDocument) => void;
  onDownloadDocx: (doc: WorkflowDocument) => void;
  onDownloadPdf: (doc: WorkflowDocument) => void;
  onDeleteRequest: (doc: WorkflowDocument) => void;
  onApprovalRequest?: (doc: WorkflowDocument) => void;
  canManage: boolean;
  canApprove?: boolean;
  currentUserName?: string;
}

export function DocumentPreviewDialog({
  previewDoc,
  onClose,
  onPrint,
  onDownloadDocx,
  onDownloadPdf,
  onDeleteRequest,
  onApprovalRequest,
  canManage,
  canApprove,
  currentUserName,
}: DocumentPreviewDialogProps) {
  if (!previewDoc) return null;

  return (
    <Dialog open={!!previewDoc} onOpenChange={() => onClose()}>
      <DialogContent className="p-4 gap-3 text-xs sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="place-items-start text-left gap-1">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Официальный бланк документа
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {previewDoc.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Printable sheet */}
          <div className="bg-white text-zinc-900 border border-border p-6 rounded font-sans text-xs leading-relaxed">
            <div className="text-center pb-2 mb-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-900">
                МИНИСТЕРСТВО ПРОСВЕЩЕНИЯ КЫРГЫЗСКОЙ РЕСПУБЛИКИ
              </p>
              <p className="text-sm font-extrabold uppercase tracking-wide text-zinc-950 mt-0.5">
                ПРОФЕССИОНАЛЬНЫЙ ЛИЦЕЙ №98
              </p>
            </div>
            <hr className="border-t-[1.5px] border-zinc-950 mb-3" />

            <div className="flex justify-between items-start mb-3 text-[11px] font-sans">
              <div>
                <p>
                  Дата:{" "}
                  <span className="font-medium">
                    {new Date(previewDoc.createdAt).toLocaleDateString("ru-RU")} г.
                  </span>
                </p>
              </div>
              <div className="text-right whitespace-pre-line font-medium text-zinc-800 max-w-xs">
                {previewDoc.addressee?.trim() || "По месту требования"}
              </div>
            </div>

            <div className="text-center my-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wide text-zinc-950">
                {previewDoc.title}
              </h3>
            </div>

            {previewDoc.generalReason && (
              <p className="text-justify my-2 text-[11px] font-sans">
                {cleanDocumentText(previewDoc.generalReason)}
              </p>
            )}

            {previewDoc.students.length > 1 && (
              <div className="my-3">
                <table className="w-full border-collapse border border-zinc-800 text-[10px] font-sans">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-800 font-bold">
                      <th className="border border-zinc-800 p-1 text-center w-6">№</th>
                      <th className="border border-zinc-800 p-1 text-left">ФИО студента</th>
                      <th className="border border-zinc-800 p-1 text-center w-20">Группа</th>
                      <th className="border border-zinc-800 p-1 text-center w-24">Пропуски (ч.)</th>
                      {previewDoc.students.some((st: StudentItem) => Boolean(st.individualReason?.trim())) && (
                        <th className="border border-zinc-800 p-1 text-left">Особое примечание</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewDoc.students.map((st: StudentItem, i: number) => (
                      <tr key={st.id} className="border-b border-zinc-800">
                        <td className="border border-zinc-800 p-1 text-center font-mono">
                          {i + 1}
                        </td>
                        <td className="border border-zinc-800 p-1 font-semibold">
                          {st.name}
                        </td>
                        <td className="border border-zinc-800 p-1 text-center">
                          {st.group || "—"}
                        </td>
                        <td className="border border-zinc-800 p-1 text-center font-mono">
                          {typeof st.unexcusedHours === "number"
                            ? `${st.unexcusedHours} ч.`
                            : typeof st.attendanceRate === "number"
                            ? `${st.attendanceRate}%`
                            : "0 ч."}
                        </td>
                        {previewDoc.students.some((s: StudentItem) => Boolean(s.individualReason?.trim())) && (
                          <td className="border border-zinc-800 p-1 text-zinc-700">
                            {st.individualReason?.trim() || "—"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-justify my-3 text-[11px] whitespace-pre-line leading-relaxed font-sans">
              {cleanDocumentText(previewDoc.descriptionText)}
            </div>

            <div className="mt-7 pt-4 border-t border-zinc-300 flex flex-col gap-4 text-[11px] font-sans">
              <div className="flex justify-between items-end gap-6">
                <div>
                  <p className="font-bold text-zinc-950">
                    Мастер группы (куратор):
                  </p>
                  <p className="text-[9px] text-zinc-500 mt-1.5">
                    (подпись) _______________________
                  </p>
                  <p className="font-bold text-zinc-950 text-[11px] mt-2">
                    {previewDoc.signatoryName ||
                      previewDoc.authorName ||
                      currentUserName ||
                      "Вопольский Виктор Владимирович"}
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

          {/* Status and workflow timeline */}
          <div className="p-3 rounded border border-border bg-muted/30 flex flex-col gap-2">
            <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-primary" />
              Маршрут согласования документа
            </span>

            <div className="flex flex-col gap-1.5">
              {previewDoc.approvalSteps.map((step: ApprovalStep, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[11px] p-1.5 rounded bg-background border border-border"
                >
                  <div className="flex items-center gap-2">
                    {step.status === "APPROVED" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : step.status === "REJECTED" ? (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <div>
                      <span className="font-medium text-foreground">
                        {step.roleTitle}:
                      </span>{" "}
                      <span className="text-muted-foreground">{step.name}</span>
                      {step.comment && (
                        <p className="text-[10px] text-muted-foreground italic">
                          «{step.comment}»
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-medium ${
                        step.status === "APPROVED"
                          ? "text-emerald-600"
                          : step.status === "REJECTED"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {step.status === "APPROVED"
                        ? `Одобрено (${step.date || "—"})`
                        : step.status === "REJECTED"
                          ? `Отклонено`
                          : `Ожидает`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
          {canApprove && previewDoc.status === "PENDING_APPROVAL" && onApprovalRequest && (
            <Button
              size="sm"
              onClick={() => {
                onApprovalRequest(previewDoc);
                onClose();
              }}
              className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Решение администрации
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPrint(previewDoc)}
            className="h-8 text-xs gap-1"
          >
            <Printer className="h-3.5 w-3.5" />
            Печать
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadDocx(previewDoc)}
            className="h-8 text-xs gap-1"
          >
            <Download className="h-3.5 w-3.5" />
            DOCX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadPdf(previewDoc)}
            className="h-8 text-xs gap-1"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </Button>
          {canApprove && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDeleteRequest(previewDoc);
                onClose();
              }}
              className="h-8 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Удалить
            </Button>
          )}
          <Button size="sm" onClick={onClose} className="h-8 text-xs">
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
