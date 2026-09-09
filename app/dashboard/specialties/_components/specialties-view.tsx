"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FolderTree,
} from "lucide-react";
import type { SpecialtyDTO } from "../actions";
import {
  createSpecialtyAction,
  updateSpecialtyAction,
  deleteSpecialtyAction,
} from "../actions";

interface SpecialtiesViewProps {
  specialties: SpecialtyDTO[];
  isAdmin: boolean;
}

export function SpecialtiesView({ specialties, isAdmin }: SpecialtiesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add / Edit Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<SpecialtyDTO | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Alert Dialog state
  const [deletingSpecialty, setDeletingSpecialty] = useState<SpecialtyDTO | null>(null);

  // Filtered specialties
  const filteredSpecialties = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return specialties;
    return specialties.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [specialties, searchQuery]);

  const openCreateDialog = () => {
    setEditingSpecialty(null);
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: SpecialtyDTO) => {
    setEditingSpecialty(item);
    setFormName(item.name);
    setFormCode(item.code || "");
    setFormDescription(item.description || "");
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Укажите наименование специальности");
      return;
    }

    setFormError(null);

    startTransition(async () => {
      if (editingSpecialty) {
        const res = await updateSpecialtyAction(editingSpecialty.id, {
          name: formName.trim(),
          code: formCode.trim() || undefined,
          description: formDescription.trim() || undefined,
        });

        if (!res.success) {
          setFormError(res.error || "Ошибка при обновлении");
          return;
        }

        setIsDialogOpen(false);
        showNotification("success", `Специальность «${formName.trim()}» успешно обновлена`);
        router.refresh();
      } else {
        const res = await createSpecialtyAction({
          name: formName.trim(),
          code: formCode.trim() || undefined,
          description: formDescription.trim() || undefined,
        });

        if (!res.success) {
          setFormError(res.error || "Ошибка при создании");
          return;
        }

        setIsDialogOpen(false);
        showNotification("success", `Специальность «${formName.trim()}» успешно добавлена`);
        router.refresh();
      }
    });
  };

  const handleDelete = async () => {
    if (!deletingSpecialty) return;

    startTransition(async () => {
      const res = await deleteSpecialtyAction(deletingSpecialty.id);
      setDeletingSpecialty(null);

      if (!res.success) {
        showNotification("error", res.error || "Ошибка при удалении");
        return;
      }

      showNotification("success", "Специальность успешно удалена");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 pb-6 text-xs w-full">
      {/* Header & Breadcrumbs */}
      <div className="bg-card p-3 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-[11px]">
                  Панель
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[11px]">Специальности</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <GraduationCap className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-bold text-foreground">
              Специальности и направления подготовки
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold px-2 py-0"
            >
              {specialties.length} всего
            </Badge>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="xs"
              onClick={openCreateDialog}
              className="h-8 text-xs gap-1.5 font-medium px-3"
            >
              <Plus className="h-3.5 w-3.5" /> Добавить специальность
            </Button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
            notification.type === "success"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Поиск по коду, названию специальности..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-card"
          />
        </div>
      </div>

      {/* Specialties Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSpecialties.map((item) => (
          <Card key={item.id} className="border shadow-none rounded-xl flex flex-col justify-between">
            <CardHeader className="p-3 pb-2 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  {item.code ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5 px-1.5 py-0"
                    >
                      {item.code}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0">
                      Код не указан
                    </Badge>
                  )}
                  <CardTitle className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                    {item.name}
                  </CardTitle>
                </div>
              </div>

              {item.description && (
                <CardDescription className="text-[11px] line-clamp-2 pt-0.5">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="p-3 pt-2 border-t bg-muted/10 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>
                  Групп: <strong className="text-foreground font-semibold">{item.groupsCount}</strong>
                </span>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => openEditDialog(item)}
                    className="h-6 px-2 text-xs font-medium"
                    title="Редактировать"
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Изменить
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setDeletingSpecialty(item)}
                    className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10 font-medium"
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Удалить
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredSpecialties.length === 0 && (
          <div className="col-span-full p-8 border rounded-xl bg-card text-center space-y-2">
            <div className="h-9 w-9 mx-auto rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <FolderTree className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold text-foreground">Специальности не найдены</div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? "По запросу «" + searchQuery + "» ничего не найдено. Попробуйте изменить поисковый запрос."
                : "В базе данных пока нет ни одной специальности. Добавьте первую запись."}
            </p>
            {isAdmin && !searchQuery && (
              <Button size="xs" onClick={openCreateDialog} className="h-8 text-xs font-medium mt-1">
                <Plus className="h-3.5 w-3.5 mr-1" /> Добавить специальность
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-sm font-bold text-foreground">
              {editingSpecialty ? "Редактирование специальности" : "Новая специальность"}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground">
              Укажите официальный шифр специальности (например: 09.02.07) и наименование
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3">
            {formError && (
              <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[11px] flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                Код специальности (шифр)
              </Label>
              <Input
                placeholder="Например: 09.02.07"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                className="h-8 text-xs bg-background font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Классификатор специальностей СПО или направление обучения
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                Наименование направления / специальности <span className="text-primary">*</span>
              </Label>
              <Input
                required
                placeholder="Информационные системы и программирование"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Описание / Квалификация</Label>
              <Input
                placeholder="Краткая информация о программе обучения"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-8 text-xs bg-background font-medium"
              />
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setIsDialogOpen(false)}
                className="h-6 px-2.5 text-xs font-medium"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                size="xs"
                disabled={isPending || !formName.trim()}
                className="h-6 px-2.5 text-xs font-medium"
              >
                {isPending ? "Сохранение..." : editingSpecialty ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deletingSpecialty}
        onOpenChange={(open) => {
          if (!open) setDeletingSpecialty(null);
        }}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="place-items-start text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold text-foreground">
              Удалить специальность?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы уверены, что хотите удалить специальность «{deletingSpecialty?.name}»? Если к ней
              привязаны учебные группы, удаление будет заблокировано.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setDeletingSpecialty(null)}
              className="h-6 px-2.5 text-xs font-medium"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="xs"
              onClick={handleDelete}
              disabled={isPending}
              className="h-6 px-2.5 text-xs font-medium"
            >
              {isPending ? "Удаление..." : "Удалить"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
