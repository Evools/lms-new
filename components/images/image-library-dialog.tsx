"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Image as ImageIcon,
  Search,
  Upload,
  Trash2,
  Check,
  Loader2,
  Eye,
  Lock,
  Globe,
  RefreshCw,
} from "lucide-react";

export interface LibraryImageItem {
  id: string;
  url: string;
  title: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  visibility: "PUBLIC" | "PRIVATE";
  category: string;
  uploadedById: string;
  uploadedByName?: string;
  createdAt: string;
}

interface ImageLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (image: LibraryImageItem) => void;
  category?: string;
  visibility?: "PUBLIC" | "PRIVATE";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function ImageLibraryDialog({
  open,
  onOpenChange,
  onSelect,
  category = "material",
  visibility = "PUBLIC",
}: ImageLibraryDialogProps) {
  const [images, setImages] = useState<LibraryImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<LibraryImageItem | null>(null);
  const [previewImage, setPreviewImage] = useState<LibraryImageItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryImageItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async (q: string = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("limit", "60");
      const res = await fetch(`/api/images?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.add({ title: data.error || "Ошибка загрузки библиотеки", type: "error" });
        return;
      }
      setImages(data.images || []);
    } catch {
      toast.add({ title: "Не удалось загрузить библиотеку изображений", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchImages(searchQuery);
    } else {
      setSelectedImage(null);
      setPreviewImage(null);
    }
  }, [open, fetchImages]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      fetchImages(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, open, fetchImages]);

  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedItems: LibraryImageItem[] = [];
    let failedCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(files.length > 1 ? `${i + 1}/${files.length}` : "");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);
        formData.append("visibility", visibility);

        try {
          const res = await fetch("/api/images", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (res.ok && data.image) {
            uploadedItems.push(data.image as LibraryImageItem);
          } else {
            failedCount++;
            if (files.length === 1) {
              toast.add({ title: data.error || "Ошибка загрузки изображения", type: "error" });
            }
          }
        } catch {
          failedCount++;
        }
      }

      if (uploadedItems.length > 0) {
        setImages((prev) => [...uploadedItems.slice().reverse(), ...prev]);
        setSelectedImage(uploadedItems[uploadedItems.length - 1]);
        toast.add({
          title:
            uploadedItems.length === 1
              ? "Изображение загружено и оптимизировано"
              : `Загружено изображений: ${uploadedItems.length}${failedCount > 0 ? ` (ошибок: ${failedCount})` : ""}`,
          type: failedCount > 0 ? "warning" : "success",
        });
      } else if (files.length > 1 && failedCount > 0) {
        toast.add({ title: `Не удалось загрузить файлы (${failedCount})`, type: "error" });
      }
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/images/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.add({ title: data.error || "Не удалось удалить изображение", type: "error" });
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== deleteTarget.id));
      if (selectedImage?.id === deleteTarget.id) setSelectedImage(null);
      if (previewImage?.id === deleteTarget.id) setPreviewImage(null);
      toast.add({ title: "Изображение удалено", type: "success" });
      setDeleteTarget(null);
    } catch {
      toast.add({ title: "Ошибка при удалении изображения", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleInsertSelected = () => {
    if (!selectedImage) return;
    onSelect(selectedImage);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[720px] w-[95vw] max-h-[88vh] flex flex-col border border-border">
          <DialogHeader className="p-0 pb-2 border-b border-border gap-1 text-left shrink-0">
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>Библиотека изображений</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Выберите ранее загруженное изображение или загрузите новое с компьютера
            </DialogDescription>
          </DialogHeader>

          {/* Search & Upload toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs pl-8 bg-background"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => fetchImages(searchQuery)}
              disabled={loading}
              className="h-8 w-8 p-0 cursor-pointer shrink-0"
              title="Обновить список"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUploadFiles(e.target.files);
                }
              }}
            />

            <Button
              type="button"
              size="xs"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs px-3 gap-1.5 font-medium cursor-pointer shrink-0"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>
                {uploading
                  ? uploadProgress
                    ? `Загрузка (${uploadProgress})...`
                    : "Загрузка..."
                  : "Загрузить"}
              </span>
            </Button>
          </div>

          {/* Grid of images */}
          <div className="flex-1 min-h-[240px] overflow-y-auto pr-1">
            {loading && images.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Загрузка изображений...</span>
              </div>
            ) : images.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground gap-1.5 border border-dashed border-border rounded-lg bg-muted/20">
                <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
                <span className="font-medium text-foreground">Изображения не найдены</span>
                <span className="text-[11px]">
                  Загрузите первое изображение или измените поисковый запрос
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {images.map((img) => {
                  const isSelected = selectedImage?.id === img.id;
                  return (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      onDoubleClick={() => {
                        onSelect(img);
                        onOpenChange(false);
                      }}
                      className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-colors bg-card flex flex-col ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />

                        {isSelected && (
                          <span className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </span>
                        )}

                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(img);
                            }}
                            className="h-6 w-6 rounded-md bg-background/90 border border-border text-foreground hover:text-primary flex items-center justify-center cursor-pointer"
                            title="Предпросмотр"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(img);
                            }}
                            className="h-6 w-6 rounded-md bg-background/90 border border-border text-muted-foreground hover:text-destructive flex items-center justify-center cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        <div className="font-medium text-foreground truncate text-[11px]" title={img.title}>
                          {img.title}
                        </div>
                        <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                          <span>{formatBytes(img.size)}</span>
                          <span className="inline-flex items-center gap-0.5">
                            {img.visibility === "PRIVATE" ? (
                              <Lock className="h-2.5 w-2.5" />
                            ) : (
                              <Globe className="h-2.5 w-2.5 text-primary" />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected image info & footer */}
          <DialogFooter className="p-0 pt-2.5 border-t border-border flex flex-row items-center justify-between gap-2 shrink-0">
            <div className="text-[11px] text-muted-foreground truncate flex-1">
              {selectedImage ? (
                <span className="flex items-center gap-2 truncate">
                  <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary bg-primary/5">
                    Выбрано
                  </Badge>
                  <span className="truncate font-medium text-foreground">{selectedImage.title}</span>
                  {selectedImage.width && selectedImage.height && (
                    <span className="shrink-0">
                      ({selectedImage.width}×{selectedImage.height})
                    </span>
                  )}
                </span>
              ) : (
                "Кликните по изображению для выбора или дважды для быстрой вставки"
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => onOpenChange(false)}
                className="h-7 px-2.5 text-xs"
              >
                Отмена
              </Button>
              <Button
                type="button"
                size="xs"
                disabled={!selectedImage}
                onClick={handleInsertSelected}
                className="h-7 px-3 text-xs font-medium gap-1 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Вставить</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewImage !== null} onOpenChange={(o) => !o && setPreviewImage(null)}>
        {previewImage && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[680px] w-[95vw] max-h-[88vh] flex flex-col border border-border">
            <DialogHeader className="p-0 pb-2 border-b border-border gap-1 text-left">
              <DialogTitle className="text-sm font-bold truncate">{previewImage.title}</DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                <span>{formatBytes(previewImage.size)}</span>
                {previewImage.width && previewImage.height && (
                  <span>• {previewImage.width}×{previewImage.height} px</span>
                )}
                <span>• {previewImage.visibility === "PRIVATE" ? "Приватное" : "Публичное"}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center overflow-auto min-h-0 bg-muted/20 rounded-lg border border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[62vh] max-w-full object-contain rounded"
              />
            </div>
            <DialogFooter className="p-0 pt-2 border-t border-border flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setPreviewImage(null)}
                className="h-7 px-2.5 text-xs"
              >
                Закрыть
              </Button>
              <Button
                type="button"
                size="xs"
                onClick={() => {
                  onSelect(previewImage);
                  setPreviewImage(null);
                  onOpenChange(false);
                }}
                className="h-7 px-3 text-xs font-medium gap-1 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Вставить</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        {deleteTarget && (
          <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px] place-items-start text-left border border-border">
            <AlertDialogHeader className="text-left gap-1">
              <AlertDialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span>Удалить изображение?</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Вы уверены, что хотите удалить{" "}
                <strong className="text-foreground">«{deleteTarget.title}»</strong>? Если оно
                используется в материалах или заданиях, удаление будет заблокировано.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2 w-full">
              <AlertDialogCancel className="h-6 px-2.5 text-xs" disabled={deleting}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="h-6 px-2.5 text-xs bg-destructive text-white hover:bg-destructive/90 font-medium"
              >
                {deleting ? "Удаление..." : "Удалить"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
}

