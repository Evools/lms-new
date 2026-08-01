"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  FileCheck2,
  FileStack,
  FileSignature,
  CalendarDays,
  FolderOpen,
  ScrollText,
} from "lucide-react";
import type { DocumentDTO } from "../actions";
import {
  createDocumentAction,
  updateDocumentAction,
  deleteDocumentAction,
} from "../actions";
import { ALLOWED_CATEGORIES } from "../constants";

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  Методички: {
    icon: <BookOpen className="h-4 w-4" />,
    color: "text-primary bg-primary/10 border-primary/20",
  },
  Положения: {
    icon: <ScrollText className="h-4 w-4" />,
    color: "text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-950 dark:border-violet-800 dark:text-violet-400",
  },
  Инструкции: {
    icon: <FileCheck2 className="h-4 w-4" />,
    color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400",
  },
  Шаблоны: {
    icon: <FileStack className="h-4 w-4" />,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400",
  },
  Приказы: {
    icon: <FileSignature className="h-4 w-4" />,
    color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-400",
  },
  Расписание: {
    icon: <CalendarDays className="h-4 w-4" />,
    color: "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-400",
  },
  Прочее: {
    icon: <FolderOpen className="h-4 w-4" />,
    color: "text-muted-foreground bg-muted border-border",
  },
};

interface DocumentsViewProps {
  documents: DocumentDTO[];
  canManage: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DocumentsView({ documents, canManage }: DocumentsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState(ALLOWED_CATEGORIES[0]);
  const [newUrl, setNewUrl] = useState("");

  // Edit
  const [editTarget, setEditTarget] = useState<DocumentDTO | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DocumentDTO | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
    try {
      toast.add({ title: msg, type: "success" });
    } catch {}
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      setErrorMsg("Укажите название и ссылку");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createDocumentAction({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        fileUrl: newUrl,
      });
      if (res.success) {
        setIsCreateOpen(false);
        setNewTitle(""); setNewDesc(""); setNewUrl(""); setNewCategory(ALLOWED_CATEGORIES[0]);
        showSuccess("Документ добавлен!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка");
      }
    });
  };

  const openEdit = (doc: DocumentDTO) => {
    setEditTarget(doc);
    setEditTitle(doc.title);
    setEditDesc(doc.description || "");
    setEditCategory(doc.category);
    setEditUrl(doc.fileUrl);
  };

  const handleUpdate = () => {
    if (!editTarget || !editTitle.trim() || !editUrl.trim()) {
      setErrorMsg("Укажите название и ссылку");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateDocumentAction(editTarget.id, {
        title: editTitle,
        description: editDesc,
        category: editCategory,
        fileUrl: editUrl,
      });
      if (res.success) {
        setEditTarget(null);
        showSuccess("Документ обновлён!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteDocumentAction(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        showSuccess("Документ удалён!");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Ошибка");
      }
    });
  };

  const filtered = documents
    .filter((d) =>
      filterCategory === "all" || d.category === filterCategory
    )
    .filter((d) =>
      !search.trim() ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
    );

  // Group by category for display
  const categories = ALLOWED_CATEGORIES.filter((cat) =>
    filtered.some((d) => d.category === cat)
  );

  return (
    <div className="space-y-3 w-full text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Лицей LMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Документы лицея</span>
          </div>
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Документы лицея
          </h1>
        </div>
        {canManage && (
          <Button size="xs" className="h-8 text-xs gap-1.5 font-medium" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Добавить документ
          </Button>
        )}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск документов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-card border"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`px-3 h-8 rounded-lg text-xs font-medium border transition-colors ${
              filterCategory === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Все ({documents.length})
          </button>
          {ALLOWED_CATEGORIES.filter((cat) => documents.some((d) => d.category === cat)).map((cat) => {
            const meta = CATEGORY_META[cat] || CATEGORY_META["Прочее"];
            const count = documents.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 h-8 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  filterCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card border rounded-xl">
          <FileText className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Документов нет</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {search ? "Попробуйте изменить поисковый запрос" : "Пока не добавлено ни одного документа"}
            </p>
          </div>
        </div>
      )}

      {/* Documents grouped by category */}
      <div className="space-y-4">
        {(filterCategory === "all" ? categories : [filterCategory]).map((cat) => {
          const catDocs = filtered.filter((d) => d.category === cat);
          if (catDocs.length === 0) return null;
          const meta = CATEGORY_META[cat] || CATEGORY_META["Прочее"];
          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${meta.color}`}>
                  {meta.icon}
                  {cat}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">{catDocs.length} шт.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {catDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-card border rounded-xl p-3 space-y-2 hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${meta.color}`}>
                        {meta.icon}
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openEdit(doc)}
                            className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(doc)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="font-semibold text-foreground text-xs line-clamp-2 leading-snug">
                        {doc.title}
                      </div>
                      {doc.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{doc.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t gap-2">
                      <div className="text-[10px] text-muted-foreground truncate">
                        {doc.authorName} · {formatDate(doc.createdAt)}
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 shrink-0 transition-colors"
                      >
                        Открыть <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
          <DialogHeader className="pb-2 border-b gap-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-primary" /> Добавить документ
            </DialogTitle>
            <DialogDescription className="text-xs">Добавьте документ лицея со ссылкой</DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-1">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Название *</label>
              <Input
                placeholder="Например: Учебный план 2025-2026"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Категория *</label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue>{newCategory}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Ссылка на файл *</label>
              <Input
                placeholder="https://drive.google.com/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-8 text-xs bg-background font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-xs">Описание</label>
              <Input
                placeholder="Краткое описание документа..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="h-8 text-xs bg-background"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setIsCreateOpen(false)}>Отмена</Button>
            <Button size="xs" disabled={isPending} onClick={handleCreate}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        {editTarget && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1 text-left">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                <Pencil className="h-4 w-4 text-primary" /> Редактировать документ
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2.5 py-1">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Название *</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Категория *</label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>{editCategory}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ALLOWED_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Ссылка на файл *</label>
                <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="h-8 text-xs bg-background font-mono" />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Описание</label>
                <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8 text-xs bg-background" />
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setEditTarget(null)}>Отмена</Button>
              <Button size="xs" disabled={isPending} onClick={handleUpdate}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal: Delete */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        {deleteTarget && (
          <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
            <AlertDialogHeader className="place-items-start text-left gap-1">
              <AlertDialogTitle className="text-sm font-bold flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" /> Удалить документ?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                «{deleteTarget.title}» будет удалён. Отменить это действие невозможно.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setDeleteTarget(null)}>Отмена</Button>
              <Button variant="destructive" size="xs" disabled={isPending} onClick={handleDelete}>Удалить</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
