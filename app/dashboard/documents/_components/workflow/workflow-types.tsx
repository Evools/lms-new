import React from "react";
import { Clock, Send, CheckCircle2, AlertCircle, Archive } from "lucide-react";
import type { WorkflowDocument, DocumentWorkflowStatus } from "../../workflow-data";

export type TabType =
  | "OVERVIEW"
  | "ALL_DOCS"
  | "MY_DOCS"
  | "CREATE"
  | "TEMPLATES"
  | "APPROVAL"
  | "ARCHIVE"
  | "REGULATORY";

export interface CharBlocksState {
  academic: boolean;
  professional: boolean;
  personal: boolean;
  social: boolean;
  habits: boolean;
  purpose: boolean;
  signCurator: boolean;
  signViceDirector: boolean;
}

export const STATUS_CONFIG: Record<
  DocumentWorkflowStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Черновик",
    bg: "bg-muted text-muted-foreground border-border",
    text: "text-muted-foreground",
    icon: <Clock className="h-3 w-3" />,
  },
  PENDING_APPROVAL: {
    label: "На согласовании",
    bg: "bg-primary/10 text-primary border-primary/20",
    text: "text-primary",
    icon: <Send className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Утверждён",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    text: "text-emerald-600",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Отклонён",
    bg: "bg-destructive/10 text-destructive border-destructive/20",
    text: "text-destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  ARCHIVED: {
    label: "В архиве",
    bg: "bg-muted text-muted-foreground border-border",
    text: "text-muted-foreground",
    icon: <Archive className="h-3 w-3" />,
  },
};

export function getDocumentStatusBadge(doc: WorkflowDocument) {
  if (doc.status === "APPROVED") {
    const isSimple =
      doc.category === "CURATOR" || doc.docNumber.startsWith("ХАР");
    return {
      label: isSimple ? "Готов" : "Утверждён",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
      text: "text-emerald-600",
      icon: <CheckCircle2 className="h-3 w-3 shrink-0" />,
      subtext: isSimple ? "Готов к печати и выдаче" : "Одобрено администрацией",
    };
  }
  if (doc.status === "PENDING_APPROVAL") {
    return {
      label: "На рассмотрении",
      bg: "bg-primary/10 text-primary border-primary/20",
      text: "text-primary",
      icon: <Send className="h-3 w-3 shrink-0" />,
      subtext: "Ожидает решения администрации",
    };
  }
  if (doc.status === "REJECTED") {
    return {
      label: "Отклонён",
      bg: "bg-destructive/10 text-destructive border-destructive/20",
      text: "text-destructive",
      icon: <AlertCircle className="h-3 w-3 shrink-0" />,
      subtext: "Возвращён на доработку",
    };
  }
  if (doc.status === "DRAFT") {
    return {
      label: "Черновик",
      bg: "bg-muted text-muted-foreground border-border",
      text: "text-muted-foreground",
      icon: <Clock className="h-3 w-3 shrink-0" />,
      subtext: "В работе у автора",
    };
  }
  return {
    label: "В архиве",
    bg: "bg-muted text-muted-foreground border-border",
    text: "text-muted-foreground",
    icon: <Archive className="h-3 w-3 shrink-0" />,
    subtext: "Архивное дело",
  };
}
