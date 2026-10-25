import React from "react";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  FolderArchive,
  Code2,
  Image as ImageIcon,
  Video,
  Music,
  Globe,
  Layers,
  Send,
} from "lucide-react";

export interface ResourceMeta {
  type: string;
  badge: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  url: string;
  isDownloadable?: boolean;
}

/**
 * Extracts a human-readable clean file name from a storage URL or file path.
 * Strips UUID prefixes (e.g. 68b1b04d-74df-4c4c-...-filename.docx)
 * and cleans encoded characters and underscores.
 */
export function getCleanFileName(rawUrl: string): string {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();

  let pathname = "";
  try {
    const parsed = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`
    );
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    const withoutDomain = trimmed.replace(/^https?:\/\/[^/]+/, "");
    try {
      pathname = decodeURIComponent(withoutDomain);
    } catch {
      pathname = withoutDomain;
    }
  }

  // Get last path segment
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
  if (!lastSegment) return trimmed;

  // Strip UUID prefix (e.g. 5a6310dd-fe13-4eb3-ad46-7abe3ed38bf7-filename.docx)
  let clean = lastSegment.replace(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[-_.]?/,
    ""
  );

  // If there's timestamp prefix (e.g. 1730000000000-)
  clean = clean.replace(/^[0-9]{13,}[-_.]?/, "");

  // Clean underscores that were converted from spaces
  clean = clean
    .replace(/\._/g, ". ")
    .replace(/_/g, " ")
    .trim();

  return clean || lastSegment;
}

export function getResourceMeta(rawUrl: string): ResourceMeta {
  const url = rawUrl.trim();
  let domain = "";
  let pathname = "";
  try {
    const parsed = new URL(
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`
    );
    domain = parsed.hostname.replace(/^www\./, "");
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    domain = url.split("/")[0] || url;
    pathname = url.slice(domain.length);
  }

  const cleanFileName = getCleanFileName(url);
  const isStorage =
    domain.includes("r2.dev") ||
    domain.includes("cloudflarestorage.com") ||
    domain.includes("r2.") ||
    pathname.includes("/materials/") ||
    pathname.includes("/submissions/") ||
    pathname.includes("/assignments/") ||
    pathname.includes("/documents/");

  const lowerUrl = url.toLowerCase();
  const lowerName = cleanFileName.toLowerCase();

  // Known services
  if (lowerUrl.includes("github.com") || lowerUrl.includes("gitlab.com")) {
    return {
      type: "Репозиторий",
      badge: "GitHub / Git",
      icon: <Code2 className="h-4 w-4 text-primary" />,
      title: pathname.length > 1 ? pathname.replace(/^\//, "") : domain,
      subtitle: domain,
      url,
    };
  }

  if (lowerUrl.includes("figma.com")) {
    return {
      type: "Дизайн-макет",
      badge: "Figma",
      icon: <Layers className="h-4 w-4 text-primary" />,
      title: cleanFileName && cleanFileName !== domain ? cleanFileName : "Figma Проект",
      subtitle: domain,
      url,
    };
  }

  if (lowerUrl.includes("drive.google.com") || lowerUrl.includes("docs.google.com")) {
    return {
      type: "Облачные документы",
      badge: "Google Диск",
      icon: <FileText className="h-4 w-4 text-primary" />,
      title: "Google Документ / Диск",
      subtitle: domain,
      url,
    };
  }

  if (lowerUrl.includes("t.me") || lowerUrl.includes("telegram.me")) {
    return {
      type: "Мессенджер",
      badge: "Telegram",
      icon: <Send className="h-4 w-4 text-primary" />,
      title: pathname.length > 1 ? `@${pathname.replace(/^\//, "")}` : "Telegram",
      subtitle: domain,
      url,
    };
  }

  // File Extensions
  if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
    return {
      type: "Документ",
      badge: "Word / DOCX",
      icon: <FileText className="h-4 w-4 text-primary" />,
      title: cleanFileName || "Документ Word",
      subtitle: isStorage ? "Материал к уроку (Word)" : domain,
      url,
      isDownloadable: true,
    };
  }

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".csv")) {
    return {
      type: "Таблица",
      badge: lowerName.endsWith(".csv") ? "CSV" : "Excel / XLSX",
      icon: <FileSpreadsheet className="h-4 w-4 text-primary" />,
      title: cleanFileName || "Таблица Excel",
      subtitle: isStorage ? "Таблица к уроку" : domain,
      url,
      isDownloadable: true,
    };
  }

  if (lowerName.endsWith(".pptx") || lowerName.endsWith(".ppt")) {
    return {
      type: "Презентация",
      badge: "PowerPoint",
      icon: <Presentation className="h-4 w-4 text-primary" />,
      title: cleanFileName || "Презентация",
      subtitle: isStorage ? "Презентация к уроку" : domain,
      url,
      isDownloadable: true,
    };
  }

  if (lowerName.endsWith(".pdf")) {
    return {
      type: "Документ",
      badge: "PDF",
      icon: <FileText className="h-4 w-4 text-primary" />,
      title: cleanFileName || "PDF Документ",
      subtitle: isStorage ? "Материал к уроку (PDF)" : domain,
      url,
      isDownloadable: true,
    };
  }

  if (
    lowerName.endsWith(".zip") ||
    lowerName.endsWith(".rar") ||
    lowerName.endsWith(".7z") ||
    lowerName.endsWith(".tar") ||
    lowerName.endsWith(".gz")
  ) {
    return {
      type: "Архив",
      badge: "ZIP / Архив",
      icon: <FolderArchive className="h-4 w-4 text-primary" />,
      title: cleanFileName || "Архив файлов",
      subtitle: isStorage ? "Архив материалов" : domain,
      url,
      isDownloadable: true,
    };
  }

  if (
    lowerName.endsWith(".js") ||
    lowerName.endsWith(".ts") ||
    lowerName.endsWith(".tsx") ||
    lowerName.endsWith(".jsx") ||
    lowerName.endsWith(".py") ||
    lowerName.endsWith(".html") ||
    lowerName.endsWith(".css") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".sql") ||
    lowerName.endsWith(".sh")
  ) {
    const ext = cleanFileName.split(".").pop()?.toUpperCase() || "КОД";
    return {
      type: "Исходный код",
      badge: ext,
      icon: <Code2 className="h-4 w-4 text-primary" />,
      title: cleanFileName || "Исходный код",
      subtitle: isStorage ? "Файл программы" : domain,
      url,
      isDownloadable: true,
    };
  }

  if (
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".webp") ||
    lowerName.endsWith(".gif") ||
    lowerName.endsWith(".svg")
  ) {
    const ext = cleanFileName.split(".").pop()?.toUpperCase() || "IMG";
    return {
      type: "Изображение",
      badge: ext,
      icon: <ImageIcon className="h-4 w-4 text-primary" />,
      title: cleanFileName || "Изображение",
      subtitle: isStorage ? "Графический файл к уроку" : domain,
      url,
      isDownloadable: true,
    };
  }

  if (
    lowerName.endsWith(".mp4") ||
    lowerName.endsWith(".webm") ||
    lowerName.endsWith(".mov") ||
    lowerName.endsWith(".mkv")
  ) {
    return {
      type: "Видео",
      badge: "Видео",
      icon: <Video className="h-4 w-4 text-primary" />,
      title: cleanFileName || "Видеозапись",
      subtitle: isStorage ? "Видеоматериал" : domain,
      url,
      isDownloadable: true,
    };
  }

  if (
    lowerName.endsWith(".mp3") ||
    lowerName.endsWith(".wav") ||
    lowerName.endsWith(".ogg")
  ) {
    return {
      type: "Аудио",
      badge: "Аудио",
      icon: <Music className="h-4 w-4 text-primary" />,
      title: cleanFileName || "Аудиозапись",
      subtitle: isStorage ? "Аудиоматериал" : domain,
      url,
      isDownloadable: true,
    };
  }

  // Fallback for storage files without specific extension
  if (isStorage) {
    return {
      type: "Файл",
      badge: "Файл",
      icon: <FileText className="h-4 w-4 text-primary" />,
      title: cleanFileName || "Прикреплённый файл",
      subtitle: "Материал к уроку",
      url,
      isDownloadable: true,
    };
  }

  // Fallback for generic web links
  return {
    type: "Веб-ресурс",
    badge: domain,
    icon: <Globe className="h-4 w-4 text-primary" />,
    title: cleanFileName && cleanFileName !== domain ? cleanFileName : domain,
    subtitle: domain,
    url,
  };
}
