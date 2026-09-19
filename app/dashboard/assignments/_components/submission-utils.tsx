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
  if (!comment) return { type: "text", note: "" };
  try {
    const parsed = JSON.parse(comment);
    if (parsed && typeof parsed === "object" && (parsed.type === "code" || Array.isArray(parsed.files))) {
      return {
        type: "code",
        note: parsed.note || "",
        files: Array.isArray(parsed.files) ? parsed.files : [],
      };
    }
  } catch {}
  return { type: "text", note: comment };
}

export function detectLanguage(fileName: string): string {
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
  if (!fileUrl) return [];
  try {
    const parsed = JSON.parse(fileUrl);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: unknown) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null && "url" in item) {
            return String((item as { url?: unknown }).url || "");
          }
          return "";
        })
        .filter(Boolean);
    }
  } catch {}
  if (fileUrl.trim().startsWith("http://") || fileUrl.trim().startsWith("https://")) {
    return [fileUrl.trim()];
  }
  return [];
}
