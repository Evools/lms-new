"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Clock, ExternalLink, EyeOff, Paperclip } from "lucide-react";
import { AssignmentDTO } from "../actions";
import { renderMarkdown } from "@/lib/markdown";
import { parseAttachmentLinks } from "./submission-utils";

interface ViewAssignmentDialogProps {
  assignment: AssignmentDTO | null;
  onClose: () => void;
}

export function ViewAssignmentDialog({
  assignment,
  onClose,
}: ViewAssignmentDialogProps) {
  return (
    <Dialog open={assignment !== null} onOpenChange={(open) => !open && onClose()}>
      {assignment && (
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b gap-1 place-items-start text-left">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 text-primary bg-primary/5 font-medium"
              >
                {assignment.subjectName}
              </Badge>
              {!assignment.isPublished && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-dashed border-muted-foreground/40 text-muted-foreground bg-muted/40 font-medium px-2 py-0 inline-flex items-center gap-1"
                >
                  <EyeOff className="h-3 w-3" /> Черновик
                </Badge>
              )}
              {assignment.dueDate && (
                <Badge variant="secondary" className="text-[10px] gap-1 shrink-0 font-normal">
                  <Clock className="h-3 w-3 text-primary" />
                  До: {new Date(assignment.dueDate).toLocaleDateString("ru-RU")}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-sm font-bold text-foreground pt-1">
              {assignment.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-0.5">
              <span>Преподаватель: {assignment.teacherName}</span>
              <span>•</span>
              <span>Выдано: {new Date(assignment.createdAt).toLocaleDateString("ru-RU")}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-1 text-xs space-y-3 leading-relaxed">
            <div className="p-3 border rounded-xl bg-card text-foreground">
              {renderMarkdown(assignment.description)}
            </div>

            {parseAttachmentLinks(assignment.fileUrl).length > 0 && (
              <div className="space-y-1.5 pt-2 border-t">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-primary" /> Прикреплённые ресурсы:
                </div>
                <div className="flex flex-col gap-1.5">
                  {parseAttachmentLinks(assignment.fileUrl).map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors truncate"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={onClose}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
