import React from "react";
import JSZip from "jszip";
import { toast } from "@/components/ui/toast";
import { SubmissionDTO } from "../actions";

export interface SubmissionCodeFile {
  name: string;
  code: string;
}

export interface SubmissionPayload {
  type: "code" | "text";
  note?: string;
  files?: SubmissionCodeFile[];
}

export function parseSubmissionContent(comment?: string | null): SubmissionPayload {
  if (!comment || typeof comment !== "string") return { type: "text", note: "" };
  try {
    const parsed = JSON.parse(comment);
    if (parsed && typeof parsed === "object" && (parsed.type === "code" || Array.isArray(parsed.files))) {
      const rawFiles = Array.isArray(parsed.files) ? parsed.files : [];
      const safeFiles: SubmissionCodeFile[] = rawFiles.map((f: unknown, index: number) => {
        if (typeof f === "object" && f !== null) {
          const fileObj = f as { name?: unknown; code?: unknown };
          return {
            name: typeof fileObj.name === "string" ? fileObj.name : `file_${index + 1}.txt`,
            code: typeof fileObj.code === "string" ? fileObj.code : "",
          };
        }
        return { name: `file_${index + 1}.txt`, code: String(f || "") };
      });

      return {
        type: "code",
        note: typeof parsed.note === "string" ? parsed.note : "",
        files: safeFiles,
      };
    }
  } catch {}
  return { type: "text", note: comment };
}

export function detectLanguage(fileName?: string | null): string {
  if (!fileName || typeof fileName !== "string") return "code";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "html":
    case "htm":
      return "html";
    case "css":
    case "scss":
    case "sass":
      return "css";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "ts":
      return "typescript";
    case "tsx":
      return "react (tsx)";
    case "jsx":
      return "react (jsx)";
    case "php":
      return "php";
    case "py":
      return "python";
    case "sql":
      return "sql";
    case "json":
      return "json";
    case "cpp":
    case "c":
      return "c/c++";
    case "java":
      return "java";
    case "vue":
      return "vue";
    default:
      return "code";
  }
}

export function parseAttachmentLinks(fileUrl?: string | null): string[] {
  if (!fileUrl || typeof fileUrl !== "string") return [];
  const trimmed = fileUrl.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: unknown) => {
          if (typeof item === "string") return item.trim();
          if (typeof item === "object" && item !== null && "url" in item) {
            return String((item as { url?: unknown }).url || "").trim();
          }
          return "";
        })
        .filter(Boolean);
    }
  } catch {}
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return [trimmed];
  }
  return [];
}

