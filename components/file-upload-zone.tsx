"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  File,
  FileText,
  FileArchive,
  FileCode,
  Image as ImageIcon,
  X,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/toast";

export interface UploadedFileMeta {
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  key?: string;
}

interface FileUploadZoneProps {
  folder?: "materials" | "assignments" | "submissions" | "documents";
  value?: string; // current file url
  fileName?: string;
  onUploadSuccess: (fileMeta: UploadedFileMeta) => void;
  onRemove?: () => void;
  disabled?: boolean;
  maxSizeMb?: number;
  label?: string;
  description?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["pdf", "docx", "doc", "txt", "rtf", "odt"].includes(ext)) {
    return <FileText className="h-4 w-4 text-primary shrink-0" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className="h-4 w-4 text-amber-500 shrink-0" />;
  }
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return <ImageIcon className="h-4 w-4 text-sky-500 shrink-0" />;
  }
  if (["json", "sql", "py", "js", "ts", "jsx", "tsx", "html", "css", "cpp", "c", "cs", "java", "md"].includes(ext)) {
    return <FileCode className="h-4 w-4 text-emerald-500 shrink-0" />;
  }
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export function FileUploadZone({
  folder = "materials",
  value,
  fileName,
  onUploadSuccess,
  onRemove,
  disabled = false,
  maxSizeMb = 25,
  label = "Прикрепить файл",
  description = "PDF, Word, Excel, ZIP-архив, исходный код или изображение",
}: FileUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.add({
        title: `Размер файла превышает лимит ${maxSizeMb} МБ`,
        type: "error",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ошибка загрузки файла");
      }

      toast.add({
        title: "Файл успешно прикреплен!",
        type: "success",
      });

      onUploadSuccess({
        url: data.url,
        name: data.safeName || file.name,
        size: data.size,
        mimeType: data.mimeType,
        key: data.key,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.add({
        title: err?.message || "Не удалось загрузить файл",
        type: "error",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  // If a file is already uploaded, show clean file pill
  if (value) {
    const rawName = fileName || value.split("/").pop() || "Прикрепленный файл";
    // Strip internal storage UUID prefix (e.g. 5a6310dd-fe13-4eb3-ad46-7abe3ed38bf7-Name.ext -> Name.ext)
    const displayName = decodeURIComponent(rawName)
      .replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/, "")
      .replace(/_/g, " ");
    return (
      <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/40 gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon(displayName)}
          <span className="truncate font-medium text-foreground text-xs" title={displayName}>
            {displayName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Открыть файл в новой вкладке"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled || isUploading}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title="Удалить прикрепленный файл"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border border-dashed text-xs text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-primary bg-primary/5 text-primary"
            : "border-border hover:border-primary/50 hover:bg-muted/30 text-muted-foreground"
        } ${disabled || isUploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        {isUploading ? (
          <div className="flex items-center gap-2 py-1 text-primary font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Загрузка файла в Cloudflare R2...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div className="font-medium text-foreground text-xs flex items-center gap-1">
              <span>{label}</span>
              <span className="text-[10px] text-muted-foreground font-normal">или перетащите сюда</span>
            </div>
            <div className="text-[10px] text-muted-foreground max-w-xs leading-tight">
              {description} • макс. {maxSizeMb} МБ
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
