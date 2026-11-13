"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Lock,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import type { ImageQuotaUsage, StoredImageDTO } from "@/lib/images/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type VisibilityFilter = "ALL" | "PUBLIC" | "PRIVATE";

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "Все категории" },
  { value: "material", label: "Материалы" },
  { value: "assignment", label: "Задания" },
  { value: "cover", label: "Обложки" },
  { value: "avatar", label: "Аватары" },
  { value: "student_photo", label: "Студенты" },
  { value: "profile", label: "Профили" },
  { value: "other", label: "Прочее" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Публичное (PUBLIC)" },
  { value: "PRIVATE", label: "Приватное (PRIVATE)" },
] as const;

function getCategoryLabel(value: string): string {
  return CATEGORY_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface ImagesAdminViewProps {
  initialImages: StoredImageDTO[];
  initialQuota: ImageQuotaUsage;
  userRole: string;
}

export function ImagesAdminView({ initialImages, initialQuota, userRole }: ImagesAdminViewProps) {
  const isAdmin = userRole === "ADMIN";
  const [images, setImages] = useState<StoredImageDTO[]>(initialImages);
  const [quota, setQuota] = useState<ImageQuotaUsage>(initialQuota);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [visibility, setVisibility] = useState<VisibilityFilter>("ALL");
  const [uploadCategory, setUploadCategory] = useState<string>("material");
  const [uploadVisibility, setUploadVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [previewImage, setPreviewImage] = useState<StoredImageDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoredImageDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isFirstRender = useRef(true);

  const fetchImages = useCallback(
    async (q: string, cat: string, vis: VisibilityFilter) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (cat !== "ALL") params.set("category", cat);
        if (vis !== "ALL") params.set("visibility", vis);
        params.set("limit", "100");

        const res = await fetch(`/api/images?${params.toString()}`);
        const data = (await res.json()) as {
          images?: StoredImageDTO[];
          quota?: ImageQuotaUsage;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Не удалось загрузить список изображений");
        }
        setImages(data.images ?? []);
        if (data.quota) {
          setQuota(data.quota);
        }
      } catch (err) {
        toast.add({
          title: err instanceof Error ? err.message : "Ошибка загрузки",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void fetchImages(query, category, visibility);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, category, visibility, fetchImages]);

  const stats = useMemo(() => {
    const totalSize = images.reduce((acc, item) => acc + item.size, 0);
    const publicCount = images.filter((item) => item.visibility === "PUBLIC").length;
    const privateCount = images.length - publicCount;
    return { totalSize, publicCount, privateCount };
  }, [images]);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const list = Array.from(files);
    setUploadProgress({ current: 0, total: list.length });

    let uploadedCount = 0;
    let lastError: string | null = null;

    for (let i = 0; i < list.length; i++) {
      setUploadProgress({ current: i + 1, total: list.length });
      const file = list[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", uploadCategory);
      formData.append("visibility", uploadVisibility);

      try {
        const res = await fetch("/api/images", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as { image?: StoredImageDTO; error?: string };
        if (!res.ok || !data.image) {
          throw new Error(data.error ?? `Не удалось загрузить ${file.name}`);
        }
        uploadedCount += 1;
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Ошибка загрузки";
      }
    }

    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (uploadedCount > 0) {
      toast.add({
        title:
          uploadedCount === 1
            ? "Изображение оптимизировано в WebP и загружено"
            : `Загружено изображений: ${uploadedCount}`,
        type: "success",
      });
      await fetchImages(query, category, visibility);
    }
    if (lastError) {
      toast.add({ title: lastError, type: "error" });
    }
  };

  const handleCopyMarkdown = async (item: StoredImageDTO) => {
    const alt = item.title.replace(/[\[\]\n\r]/g, "").trim() || "Изображение";
    const snippet = `![${alt}](${item.url})`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedId(item.id);
      toast.add({ title: "Markdown-ссылка скопирована", type: "success" });
      setTimeout(() => {
        setCopiedId((prev) => (prev === item.id ? null : prev));
      }, 1500);
    } catch {
      toast.add({ title: "Не удалось скопировать в буфер обмена", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/images/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Не удалось удалить изображение");
      }
      toast.add({ title: "Изображение удалено", type: "success" });
      setImages((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setSelectedIds((prev) => {
        if (!prev.has(deleteTarget.id)) return prev;
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      if (previewImage?.id === deleteTarget.id) {
        setPreviewImage(null);
      }
      setDeleteTarget(null);
      await fetchImages(query, category, visibility);
    } catch (err) {
      toast.add({
        title: err instanceof Error ? err.message : "Ошибка удаления",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const allVisibleSelected =
    images.length > 0 && images.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map((item) => item.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkDeleting(true);
    let deletedCount = 0;
    let firstError: string | null = null;
    const deletedSet = new Set<string>();

    try {
      for (const id of ids) {
        try {
          const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
          const data = (await res.json()) as { success?: boolean; error?: string };
          if (res.ok) {
            deletedCount += 1;
            deletedSet.add(id);
          } else if (!firstError) {
            firstError = data.error ?? "Не удалось удалить часть изображений";
          }
        } catch {
          if (!firstError) {
            firstError = "Ошибка сети при удалении";
          }
        }
      }

      if (deletedCount > 0) {
        toast.add({
          title: `Удалено изображений: ${deletedCount}`,
          type: "success",
        });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          deletedSet.forEach((id) => next.delete(id));
          return next;
        });
        if (previewImage && deletedSet.has(previewImage.id)) {
          setPreviewImage(null);
        }
        await fetchImages(query, category, visibility);
      }

      if (firstError) {
        toast.add({
          title: firstError,
          type: "error",
        });
      }

      setBulkDeleteOpen(false);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Библиотека изображений
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin
              ? "Централизованное хранилище WebP-изображений всех пользователей платформы."
              : "Ваша личная библиотека изображений: загрузка, поиск, повторное использование и удаление."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium border-border">
            Всего: {images.length}
          </Badge>
          <Badge variant="outline" className="text-xs font-medium border-border">
            Публичных: {stats.publicCount}
          </Badge>
          <Badge variant="outline" className="text-xs font-medium border-border">
            Приватных: {stats.privateCount}
          </Badge>
          <Badge variant="outline" className="text-xs font-medium border-primary/40 text-primary">
            {quota.maxBytes !== null
              ? `Квота: ${formatBytes(quota.usedBytes)} / ${formatBytes(quota.maxBytes)}`
              : `Объём: ${formatBytes(stats.totalSize)}`}
          </Badge>
          {quota.maxFiles !== null && (
            <Badge variant="outline" className="text-xs font-medium border-border">
              Файлов: {quota.usedFiles} / {quota.maxFiles}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs font-medium border-border">
            До 5 МБ / файл
          </Badge>
        </div>
      </div>

      {/* Панель фильтров и загрузки */}
      <Card size="sm" className="py-3">
        <CardContent className="px-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по названию или имени файла..."
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 w-[170px] text-xs font-medium bg-background">
                  <div className="flex items-center gap-1.5 truncate">
                    <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <SelectValue>{getCategoryLabel(category)}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs
                value={visibility}
                onValueChange={(val) => setVisibility(val as VisibilityFilter)}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="ALL" className="text-xs px-2.5 data-[active]:shadow-none aria-selected:shadow-none">
                    Все
                  </TabsTrigger>
                  <TabsTrigger value="PUBLIC" className="text-xs px-2.5 data-[active]:shadow-none aria-selected:shadow-none">
                    Публичные
                  </TabsTrigger>
                  <TabsTrigger value="PRIVATE" className="text-xs px-2.5 data-[active]:shadow-none aria-selected:shadow-none">
                    Приватные
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border lg:pt-0 lg:border-t-0 lg:border-l lg:pl-3">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                Загрузка в:
              </span>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="h-8 w-[145px] text-xs font-medium bg-background">
                  <div className="flex items-center gap-1.5 truncate">
                    <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <SelectValue>{getCategoryLabel(uploadCategory)}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.filter((o) => o.value !== "ALL").map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={uploadVisibility}
                onValueChange={(val) => setUploadVisibility(val as "PUBLIC" | "PRIVATE")}
              >
                <SelectTrigger className="h-8 w-[175px] text-xs font-medium bg-background">
                  <div className="flex items-center gap-1.5 truncate">
                    {uploadVisibility === "PUBLIC" ? (
                      <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <SelectValue>
                      {VISIBILITY_OPTIONS.find((v) => v.value === uploadVisibility)?.label}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => void handleUploadFiles(e.target.files)}
              />

              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs font-medium gap-1.5"
                disabled={uploadProgress !== null}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadProgress
                  ? `Загрузка ${uploadProgress.current}/${uploadProgress.total}...`
                  : "Загрузить файлы"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Панель массового выделения */}
      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 min-h-[46px] rounded-lg border border-border bg-card px-3 py-2 text-xs">
          <div className="flex items-center gap-2 h-7">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={() => toggleSelectAll()}
              aria-label="Выбрать все изображения"
            />
            <button
              type="button"
              onClick={toggleSelectAll}
              className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {allVisibleSelected ? "Снять выделение" : "Выбрать все"}
            </button>
            {selectedIds.size > 0 && (
              <Badge variant="outline" className="text-xs font-medium border-primary/40 text-primary">
                Выбрано: {selectedIds.size}
              </Badge>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium"
                onClick={() => setSelectedIds(new Set())}
              >
                Отменить выбор
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Удалить выбранные ({selectedIds.size})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Сетка изображений */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, idx) => (
            <Card key={idx} size="sm" className="gap-0 py-0">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <CardContent className="p-2.5 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : images.length === 0 ? (
        <Card size="sm" className="py-8">
          <CardContent className="text-center space-y-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs text-muted-foreground">
              Изображения не найдены. Измените фильтры или загрузите новые файлы.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {images.map((item) => {
            const isCopied = copiedId === item.id;
            const isSelected = selectedIds.has(item.id);
            return (
              <Card
                key={item.id}
                size="sm"
                className={`gap-0 py-0 transition-colors ${isSelected ? "border-primary" : ""}`}
              >
                <div className="relative aspect-[4/3] w-full bg-muted/40 overflow-hidden border-b border-border group">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(item)}
                    className="h-full w-full text-left cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  </button>
                  <div
                    className="absolute top-1.5 left-1.5 z-10 flex items-center justify-center rounded-md border border-border bg-background/90 p-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => toggleSelect(item.id, Boolean(checked))}
                      aria-label={`Выбрать ${item.title}`}
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className="absolute top-1.5 right-1.5 h-5 px-1.5 text-[10px] font-medium border-border bg-background/90 gap-1 pointer-events-none"
                  >
                    {item.visibility === "PUBLIC" ? (
                      <>
                        <Globe className="h-2.5 w-2.5 text-primary" />
                        PUBLIC
                      </>
                    ) : (
                      <>
                        <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                        PRIVATE
                      </>
                    )}
                  </Badge>
                </div>

                <CardContent className="p-2.5 flex-1 flex flex-col justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <p className="font-medium truncate" title={item.title}>
                      {item.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{formatBytes(item.size)}</span>
                      {item.width && item.height ? (
                        <span>
                          • {item.width}×{item.height}
                        </span>
                      ) : null}
                      <span>• {getCategoryLabel(item.category)}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.uploadedByName ? `${item.uploadedByName} • ` : ""}
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="px-2.5 py-2 border-t border-border flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px] font-medium gap-1"
                      onClick={() => void handleCopyMarkdown(item)}
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      MD
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px] font-medium"
                      onClick={() => setPreviewImage(item)}
                      aria-label="Предпросмотр"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(item)}
                    aria-label="Удалить изображение"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Предпросмотр */}
      <Dialog open={previewImage !== null} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[680px]">
          {previewImage && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold truncate pr-6">
                  {previewImage.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {previewImage.fileName} • {formatBytes(previewImage.size)}
                  {previewImage.width && previewImage.height
                    ? ` • ${previewImage.width}×${previewImage.height}`
                    : ""}
                  {` • ${previewImage.visibility}`}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-lg border border-border bg-muted/30 p-2 flex items-center justify-center max-h-[60vh] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-h-[56vh] w-auto object-contain rounded"
                />
              </div>

              <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border sm:justify-between">
                <code className="text-[11px] bg-muted px-2 py-1 rounded border border-border truncate max-w-[420px]">
                  {`![${previewImage.title}](${previewImage.url})`}
                </code>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs font-medium gap-1"
                    onClick={() => void handleCopyMarkdown(previewImage)}
                  >
                    <Copy className="h-3 w-3" />
                    Копировать MD
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-7 px-2.5 text-xs font-medium gap-1"
                    onClick={() => setDeleteTarget(previewImage)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Удалить
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="place-items-start text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold">
              Удалить изображение?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Файл «{deleteTarget?.title}» будет удалён с сервера. Если изображение используется в
              учебных материалах или профилях, удаление будет заблокировано.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-6 px-2.5 text-xs font-medium mt-0"
            >
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="h-6 px-2.5 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Подтверждение массового удаления */}
      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => !open && !isBulkDeleting && setBulkDeleteOpen(false)}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="place-items-start text-left gap-1">
            <AlertDialogTitle className="text-sm font-bold">
              Удалить выбранные ({selectedIds.size})?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Выбранные файлы будут удалены из хранилища и базы данных. Изображения, которые
              используются в материалах или профилях, не будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <AlertDialogCancel
              disabled={isBulkDeleting}
              className="h-6 px-2.5 text-xs font-medium mt-0"
            >
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkDeleting}
              onClick={(e) => {
                e.preventDefault();
                void handleBulkDelete();
              }}
              className="h-6 px-2.5 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
