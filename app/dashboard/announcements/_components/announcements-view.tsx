"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import {
  Megaphone,
  Pin,
  Plus,
  Search,
  FileText,
  Download,
  Paperclip,
  Users,
  UserCheck,
  Building2,
  Trash2,
  Pencil,
  AlertTriangle,
  Loader2,
  X,
  UploadCloud,
} from "lucide-react";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
} from "../actions";

export interface FileAttachmentItem {
  id: string;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  blob?: File;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  authorName: string;
  authorRole: "ADMIN" | "TEACHER";
  authorAvatar?: string;
  targetAudience: "LYCEUM" | "GROUP" | "TEACHERS";
  groupName?: string;
  createdAt: string;
  isPinned?: boolean;
  files?: FileAttachmentItem[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface AnnouncementsViewProps {
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
  userName: string;
  initialAnnouncements?: AnnouncementItem[];
}

export function AnnouncementsView({
  userRole,
  userName,
  initialAnnouncements = [],
}: AnnouncementsViewProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAudienceFilter, setActiveAudienceFilter] = useState<"ALL" | "LYCEUM" | "GROUP" | "TEACHERS">("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // New Announcement Form State
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newAudience, setNewAudience] = useState<"LYCEUM" | "GROUP" | "TEACHERS">("LYCEUM");
  const [newPinned, setNewPinned] = useState(false);
  const [newFiles, setNewFiles] = useState<FileAttachmentItem[]>([]);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAudience, setEditAudience] = useState<"LYCEUM" | "GROUP" | "TEACHERS">("LYCEUM");
  const [editPinned, setEditPinned] = useState(false);
  const [editFiles, setEditFiles] = useState<FileAttachmentItem[]>([]);

  const canCreate = userRole === "ADMIN" || userRole === "TEACHER";

  const handleDownloadFile = (file: FileAttachmentItem) => {
    let downloadUrl = file.fileUrl;

    if (!downloadUrl || downloadUrl === "#" || !downloadUrl.startsWith("blob:")) {
      const dummyContent = `Официальный документ лицея: ${file.fileName}\nДата скачивания: ${new Date().toLocaleString()}\nПлатформа Лицей LMS.`;
      const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
      downloadUrl = URL.createObjectURL(blob);
    }

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSelectNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).map((file, idx) => ({
      id: `file-new-${Date.now()}-${idx}`,
      fileName: file.name,
      fileSize: formatBytes(file.size),
      fileUrl: URL.createObjectURL(file),
      blob: file,
    }));
    setNewFiles((prev) => [...prev, ...selected]);
  };

  const handleRemoveNewFile = (id: string) => {
    setNewFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSelectEditFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).map((file, idx) => ({
      id: `file-edit-${Date.now()}-${idx}`,
      fileName: file.name,
      fileSize: formatBytes(file.size),
      fileUrl: URL.createObjectURL(file),
      blob: file,
    }));
    setEditFiles((prev) => [...prev, ...selected]);
  };

  const handleRemoveEditFile = (id: string) => {
    setEditFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleStartEdit = (item: AnnouncementItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditBody(item.body);
    setEditAudience(item.targetAudience);
    setEditPinned(!!item.isPinned);
    setEditFiles(item.files || []);
  };

  // Filter Announcements
  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAudience =
      activeAudienceFilter === "ALL" || item.targetAudience === activeAudienceFilter;

    return matchesSearch && matchesAudience;
  });

  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter((a) => !a.isPinned);

  const confirmDeleteAnnouncement = () => {
    if (!deletingId) return;

    const targetId = deletingId;
    setAnnouncements((prev) => prev.filter((a) => a.id !== targetId));
    setDeletingId(null);

    startTransition(async () => {
      await deleteAnnouncementAction(targetId);
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    const createdItem: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: newTitle.trim(),
      body: newBody.trim(),
      authorName: userName || (userRole === "ADMIN" ? "Администратор" : "Преподаватель"),
      authorRole: userRole === "ADMIN" ? "ADMIN" : "TEACHER",
      targetAudience: newAudience,
      groupName: newAudience === "GROUP" ? "ИС-1-25" : undefined,
      createdAt: "Только что",
      isPinned: newPinned,
      files: newFiles,
    };

    setAnnouncements([createdItem, ...announcements]);

    const titleVal = newTitle.trim();
    const bodyVal = newBody.trim();
    const audienceVal = newAudience;
    const fileUrlVal = newFiles.map((f) => f.fileName).join(", ");

    setNewTitle("");
    setNewBody("");
    setNewAudience("LYCEUM");
    setNewPinned(false);
    setNewFiles([]);
    setIsDialogOpen(false);

    startTransition(async () => {
      await createAnnouncementAction({
        title: titleVal,
        body: bodyVal,
        targetAudience: audienceVal,
        fileUrl: fileUrlVal || undefined,
      });
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim() || !editBody.trim()) return;

    const targetId = editingItem.id;
    const updatedTitle = editTitle.trim();
    const updatedBody = editBody.trim();
    const updatedAudience = editAudience;
    const updatedPinned = editPinned;
    const updatedFiles = editFiles;

    setAnnouncements((prev) =>
      prev.map((item) =>
        item.id === targetId
          ? {
              ...item,
              title: updatedTitle,
              body: updatedBody,
              targetAudience: updatedAudience,
              isPinned: updatedPinned,
              files: updatedFiles,
            }
          : item
      )
    );

    setEditingItem(null);

    startTransition(async () => {
      await updateAnnouncementAction(targetId, {
        title: updatedTitle,
        body: updatedBody,
        targetAudience: updatedAudience,
        fileUrl: updatedFiles.map((f) => f.fileName).join(", ") || undefined,
      });
    });
  };

  const getAudienceBadge = (audience: "LYCEUM" | "GROUP" | "TEACHERS", groupName?: string) => {
    switch (audience) {
      case "LYCEUM":
        return (
          <Badge variant="outline" className="gap-1 text-[11px]">
            <Building2 className="h-3 w-3" />
            Всему лицею
          </Badge>
        );
      case "GROUP":
        return (
          <Badge variant="secondary" className="gap-1 text-[11px]">
            <Users className="h-3 w-3" />
            {groupName ? `Группа ${groupName}` : "Учебная группа"}
          </Badge>
        );
      case "TEACHERS":
        return (
          <Badge variant="outline" className="border-primary/40 text-primary gap-1 text-[11px]">
            <UserCheck className="h-3 w-3" />
            Преподавателям
          </Badge>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Объявления лицея</h1>
          <p className="text-sm text-muted-foreground">
            Официальные уведомления, расписания и новости учебного процесса
          </p>
        </div>

        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1.5" /> Опубликовать объявление
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Новое объявление
                  </DialogTitle>
                  <DialogDescription>
                    Опубликуйте уведомление для лицея, конкретной группы или преподавателей
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Заголовок объявления *</label>
                    <Input
                      placeholder="Например: Изменение в расписании пар..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Целевая аудитория</label>
                      <Select
                        value={newAudience}
                        onValueChange={(val) => {
                          if (val) setNewAudience(val as any);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {newAudience === "LYCEUM"
                              ? "Всему лицею"
                              : newAudience === "GROUP"
                              ? "Студентам группы ИС-1-25"
                              : "Преподавательскому составу"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LYCEUM">Всему лицею</SelectItem>
                          <SelectItem value="GROUP">Студентам группы ИС-1-25</SelectItem>
                          <SelectItem value="TEACHERS">Преподавательскому составу</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <Checkbox
                          checked={newPinned}
                          onCheckedChange={(checked) => setNewPinned(!!checked)}
                        />
                        <span>Закрепить как важное</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Текст объявления *</label>
                    <textarea
                      rows={4}
                      className="w-full rounded-md border border-input bg-background p-3 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                      placeholder="Введите текст вашего объявления..."
                      value={newBody}
                      onChange={(e) => setNewBody(e.target.value)}
                      required
                    />
                  </div>

                  {/* Multi-File Upload Dropzone */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Прикрепить файлы</label>
                    <label className="border border-dashed border-input rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/40 transition-colors">
                      <UploadCloud className="h-6 w-6 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-medium text-foreground">Выбрать файлы с компьютера</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">PDF, DOCX, XLSX, картинки (можно несколько)</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleSelectNewFiles}
                      />
                    </label>

                    {/* Attached Files List Preview */}
                    {newFiles.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {newFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 border rounded-md bg-muted/30 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="truncate font-medium">{file.fileName}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">({file.fileSize})</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRemoveNewFile(file.id)}
                              className="text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose render={<Button variant="outline" type="button" />}>
                    Отмена
                  </DialogClose>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Опубликовать
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Announcement Modal Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Pencil className="h-5 w-5 text-primary" />
                Редактировать объявление
              </DialogTitle>
              <DialogDescription>
                Внесите изменения в ранее опубликованное объявление
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Заголовок объявления *</label>
                <Input
                  placeholder="Заголовок объявления"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Целевая аудитория</label>
                  <Select
                    value={editAudience}
                    onValueChange={(val) => {
                      if (val) setEditAudience(val as any);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {editAudience === "LYCEUM"
                          ? "Всему лицею"
                          : editAudience === "GROUP"
                          ? "Студентам группы ИС-1-25"
                          : "Преподавательскому составу"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LYCEUM">Всему лицею</SelectItem>
                      <SelectItem value="GROUP">Студентам группы ИС-1-25</SelectItem>
                      <SelectItem value="TEACHERS">Преподавательскому составу</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox
                      checked={editPinned}
                      onCheckedChange={(checked) => setEditPinned(!!checked)}
                    />
                    <span>Закрепить как важное</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Текст объявления *</label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-input bg-background p-3 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  placeholder="Введите текст объявления..."
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  required
                />
              </div>

              {/* Multi-File Upload Dropzone for Editing */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Прикрепленные файлы</label>
                <label className="border border-dashed border-input rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/40 transition-colors">
                  <UploadCloud className="h-6 w-6 text-muted-foreground mb-1.5" />
                  <span className="text-xs font-medium text-foreground">Добавить еще файлы</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">Выбор нескольких файлов с устройства</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleSelectEditFiles}
                  />
                </label>

                {/* File preview list in Edit mode */}
                {editFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {editFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 border rounded-md bg-muted/30 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate font-medium">{file.fileName}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">({file.fileSize})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveEditFile(file.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingItem(null)}>
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Сохранить изменения
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Удалить объявление?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы действительно хотите удалить это объявление? Это действие окончательно и его нельзя будет отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeleteAnnouncement}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="xs"
            variant={activeAudienceFilter === "ALL" ? "default" : "outline"}
            onClick={() => setActiveAudienceFilter("ALL")}
          >
            Все ({announcements.length})
          </Button>
          <Button
            size="xs"
            variant={activeAudienceFilter === "LYCEUM" ? "default" : "outline"}
            onClick={() => setActiveAudienceFilter("LYCEUM")}
          >
            Лицею
          </Button>
          <Button
            size="xs"
            variant={activeAudienceFilter === "GROUP" ? "default" : "outline"}
            onClick={() => setActiveAudienceFilter("GROUP")}
          >
            Моей группе
          </Button>
          <Button
            size="xs"
            variant={activeAudienceFilter === "TEACHERS" ? "default" : "outline"}
            onClick={() => setActiveAudienceFilter("TEACHERS")}
          >
            Преподавателям
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск объявлений..."
            className="pl-9 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {/* Pinned Announcements Section */}
        {pinnedAnnouncements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Pin className="h-3.5 w-3.5 fill-current" />
              <span>Закрепленные объявления</span>
            </div>

            {pinnedAnnouncements.map((item) => (
              <Card key={item.id} className="border border-primary/30 bg-primary/5 shadow-none">
                <CardHeader className="pb-3 border-b border-primary/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {item.authorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{item.authorName}</span>
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                            {item.authorRole === "ADMIN" ? "Администратор" : "Преподаватель"}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {item.createdAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getAudienceBadge(item.targetAudience, item.groupName)}
                      <Badge className="bg-primary text-primary-foreground gap-1 text-[10px]">
                        <Pin className="h-3 w-3 fill-current" /> Важно
                      </Badge>
                      {canCreate && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleStartEdit(item)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Редактировать объявление"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeletingId(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Удалить объявление"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-sm">
                  <h3 className="font-semibold text-base text-foreground leading-snug">{item.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
                    {item.body}
                  </p>

                  {/* Render Attached Files List */}
                  {item.files && item.files.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {item.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2.5 border rounded-md bg-background text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded bg-muted">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="truncate">
                              <div className="font-medium text-foreground truncate">{file.fileName}</div>
                              <div className="text-[10px] text-muted-foreground">{file.fileSize}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDownloadFile(file)}
                            className="shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> Скачать
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Regular Announcements Feed */}
        {regularAnnouncements.length > 0 && (
          <div className="space-y-4">
            {pinnedAnnouncements.length > 0 && (
              <div className="text-xs font-medium text-muted-foreground pt-2">
                Все объявления
              </div>
            )}

            {regularAnnouncements.map((item) => (
              <Card key={item.id} className="border shadow-none">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border shrink-0">
                        <AvatarFallback className="text-xs font-semibold">
                          {item.authorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{item.authorName}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            {item.authorRole === "ADMIN" ? "Администратор" : "Преподаватель"}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {item.createdAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getAudienceBadge(item.targetAudience, item.groupName)}
                      {canCreate && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleStartEdit(item)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Редактировать объявление"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeletingId(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Удалить объявление"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-sm">
                  <h3 className="font-semibold text-base text-foreground leading-snug">{item.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
                    {item.body}
                  </p>

                  {/* Render Attached Files List */}
                  {item.files && item.files.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {item.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2.5 border rounded-md bg-muted/20 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded bg-background border">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="truncate">
                              <div className="font-medium text-foreground truncate">{file.fileName}</div>
                              <div className="text-[10px] text-muted-foreground">{file.fileSize}</div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleDownloadFile(file)}
                            className="shrink-0"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> Скачать
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredAnnouncements.length === 0 && (
          <Card className="border shadow-none p-12 text-center">
            <div className="flex justify-center mb-3">
              <Megaphone className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Объявлений не найдено</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              По вашему запросу объявлений не обнаружено. Попробуйте изменить параметры поиска или фильтра.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
