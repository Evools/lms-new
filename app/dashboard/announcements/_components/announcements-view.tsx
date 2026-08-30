"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Users,
  UserCheck,
  Building2,
  Trash2,
  Pencil,
  AlertTriangle,
  Sparkles,
  Lock,
  UploadCloud,
} from "lucide-react";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
} from "../actions";
import { RichWysiwygEditor } from "@/components/rich-wysiwyg-editor";

export type AnnouncementAudience = "LYCEUM" | "GROUP" | "TEACHERS";

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

  // Sync with fresh server data after revalidatePath
  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAudienceFilter, setActiveAudienceFilter] = useState<"ALL" | "LYCEUM" | "GROUP" | "TEACHERS">("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // New Announcement Form State
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newAudience, setNewAudience] = useState<AnnouncementAudience>("LYCEUM");
  const [newPinned, setNewPinned] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAudience, setEditAudience] = useState<AnnouncementAudience>("LYCEUM");
  const [editPinned, setEditPinned] = useState(false);

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

  const handleStartEdit = (item: AnnouncementItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditBody(item.body);
    setEditAudience(item.targetAudience);
    setEditPinned(!!item.isPinned);
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
    };

    setAnnouncements([createdItem, ...announcements]);

    const titleVal = newTitle.trim();
    const bodyVal = newBody.trim();
    const audienceVal = newAudience;

    setNewTitle("");
    setNewBody("");
    setNewAudience("LYCEUM");
    setNewPinned(false);
    setIsDialogOpen(false);

    startTransition(async () => {
      await createAnnouncementAction({
        title: titleVal,
        body: bodyVal,
        targetAudience: audienceVal,
        isPinned: newPinned,
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

    setAnnouncements((prev) =>
      prev.map((item) =>
        item.id === targetId
          ? {
              ...item,
              title: updatedTitle,
              body: updatedBody,
              targetAudience: updatedAudience,
              isPinned: updatedPinned,
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
        isPinned: updatedPinned,
      });
    });
  };

  const getAudienceBadge = (audience: "LYCEUM" | "GROUP" | "TEACHERS", groupName?: string) => {
    switch (audience) {
      case "LYCEUM":
        return (
          <Badge variant="outline" className="gap-1 text-[10px] font-medium">
            <Building2 className="h-3 w-3" />
            Всему лицею
          </Badge>
        );
      case "GROUP":
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
            <Users className="h-3 w-3" />
            {groupName ? `Группа ${groupName}` : "Группа ИС-1-25"}
          </Badge>
        );
      case "TEACHERS":
        return (
          <Badge variant="outline" className="border-primary/40 text-primary gap-1 text-[10px] font-medium">
            <UserCheck className="h-3 w-3" />
            Преподавателям
          </Badge>
        );
    }
  };

  return (
    <div className="w-full space-y-4 pb-20 text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              Объявления лицея
            </h1>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
              {announcements.length} всего
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Официальные извещения, изменения расписаний и новости лицея
          </p>
        </div>

        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button size="xs" className="h-8 text-xs gap-1.5 shrink-0" />}>
              <Plus className="h-3.5 w-3.5" /> Новое объявление
            </DialogTrigger>
            <DialogContent className="p-4 gap-3 text-xs sm:max-w-[760px]">
              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <DialogHeader className="pb-2 border-b gap-1">
                  <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Megaphone className="h-4 w-4 text-primary" /> Новое объявление
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Опубликуйте извещение для лицея, конкретной группы или преподавателей
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-xs">
                  {/* Type Selector Cards (Restored 2-Card Style) */}
                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground text-xs">Категория</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewPinned(false)}
                        className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                          !newPinned
                            ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-md shrink-0 ${!newPinned ? "bg-primary/15" : "bg-muted"}`}>
                          <Megaphone className={`h-3.5 w-3.5 ${!newPinned ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <div className={`text-xs font-medium ${!newPinned ? "text-primary" : "text-foreground"}`}>Обычное</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Стандартное извещение</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewPinned(true)}
                        className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                          newPinned
                            ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-md shrink-0 ${newPinned ? "bg-primary/15" : "bg-muted"}`}>
                          <Sparkles className={`h-3.5 w-3.5 ${newPinned ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <div className={`text-xs font-medium flex items-center gap-1.5 ${newPinned ? "text-primary" : "text-foreground"}`}>
                            Важное
                            <Badge className="bg-primary/15 text-primary border-0 text-[8px] px-1 py-0 font-medium">закреплено</Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Всегда сверху в ленте</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground text-xs">Целевая аудитория</label>
                    <Select
                      value={newAudience}
                      onValueChange={(val) => {
                        if (val) setNewAudience(val as AnnouncementAudience);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue>
                          {newAudience === "LYCEUM"
                            ? "Всему лицею"
                            : newAudience === "GROUP"
                            ? "Студентам"
                            : "Преподавателям"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LYCEUM" className="text-xs">Всему лицею</SelectItem>
                        <SelectItem value="GROUP" className="text-xs">Студентам</SelectItem>
                        <SelectItem value="TEACHERS" className="text-xs">Преподавателям</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-foreground text-xs">Заголовок *</label>
                    <Input
                      required
                      placeholder="Например: Изменение расписания на вторник"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <RichWysiwygEditor
                      label="Текст объявления *"
                      value={newBody}
                      onChange={setNewBody}
                      placeholder="Введите подробный текст объявления..."
                      minHeight="180px"
                      showStats={false}
                    />
                  </div>

                  {/* Disabled File Upload Dropzone */}
                  <div className="space-y-1.5 opacity-65 pointer-events-none select-none pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Прикрепить файлы</label>
                      <Badge variant="outline" className="text-[9px] gap-1 py-0 px-1.5 bg-muted text-muted-foreground font-normal border">
                        <Lock className="h-2.5 w-2.5" /> Временно отключено
                      </Badge>
                    </div>
                    <div className="border border-dashed border-input/60 rounded-lg p-3 flex flex-col items-center justify-center bg-muted/20 text-center cursor-not-allowed">
                      <UploadCloud className="h-5 w-5 text-muted-foreground/40 mb-1" />
                      <span className="text-[11px] font-medium text-muted-foreground">Загрузка файлов недоступна</span>
                      <span className="text-[10px] text-muted-foreground/60 mt-0.5">Будет подключено после интеграции S3</span>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
                  <Button variant="outline" size="xs" type="button" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button size="xs" type="submit" disabled={isPending || !newTitle.trim() || !newBody.trim()}>
                    Опубликовать
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Announcement Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[760px]">
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <DialogHeader className="pb-2 border-b gap-1">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Pencil className="h-4 w-4 text-primary" /> Редактирование объявления
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              {/* Type Selector Cards (Restored 2-Card Style) */}
              <div className="space-y-1.5">
                <label className="font-medium text-foreground text-xs">Категория</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPinned(false)}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                      !editPinned
                        ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`mt-0.5 p-1 rounded-md shrink-0 ${!editPinned ? "bg-primary/15" : "bg-muted"}`}>
                      <Megaphone className={`h-3.5 w-3.5 ${!editPinned ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className={`text-xs font-medium ${!editPinned ? "text-primary" : "text-foreground"}`}>Обычное</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Стандартное извещение</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditPinned(true)}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                      editPinned
                        ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`mt-0.5 p-1 rounded-md shrink-0 ${editPinned ? "bg-primary/15" : "bg-muted"}`}>
                      <Sparkles className={`h-3.5 w-3.5 ${editPinned ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className={`text-xs font-medium flex items-center gap-1.5 ${editPinned ? "text-primary" : "text-foreground"}`}>
                        Важное
                        <Badge className="bg-primary/15 text-primary border-0 text-[8px] px-1 py-0 font-medium">закреплено</Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Всегда сверху в ленте</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Целевая аудитория</label>
                <Select
                  value={editAudience}
                  onValueChange={(val) => {
                    if (val) setEditAudience(val as AnnouncementAudience);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>
                      {editAudience === "LYCEUM"
                        ? "Всему лицею"
                        : editAudience === "GROUP"
                        ? "Студентам"
                        : "Преподавателям"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LYCEUM" className="text-xs">Всему лицею</SelectItem>
                    <SelectItem value="GROUP" className="text-xs">Студентам</SelectItem>
                    <SelectItem value="TEACHERS" className="text-xs">Преподавателям</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Заголовок *</label>
                <Input
                  required
                  placeholder="Заголовок объявления"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <RichWysiwygEditor
                  label="Текст объявления *"
                  value={editBody}
                  onChange={setEditBody}
                  placeholder="Введите текст объявления..."
                  minHeight="180px"
                  showStats={false}
                />
              </div>

              {/* Disabled File Upload Dropzone */}
              <div className="space-y-1.5 opacity-65 pointer-events-none select-none pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Прикрепить файлы</label>
                  <Badge variant="outline" className="text-[9px] gap-1 py-0 px-1.5 bg-muted text-muted-foreground font-normal border">
                    <Lock className="h-2.5 w-2.5" /> Временно отключено
                  </Badge>
                </div>
                <div className="border border-dashed border-input/60 rounded-lg p-3 flex flex-col items-center justify-center bg-muted/20 text-center cursor-not-allowed">
                  <UploadCloud className="h-5 w-5 text-muted-foreground/40 mb-1" />
                  <span className="text-[11px] font-medium text-muted-foreground">Загрузка файлов недоступна</span>
                  <span className="text-[10px] text-muted-foreground/60 mt-0.5">Будет подключено после интеграции S3</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" type="button" onClick={() => setEditingItem(null)}>
                Отмена
              </Button>
              <Button size="xs" type="submit" disabled={isPending || !editTitle.trim() || !editBody.trim()}>
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="text-left place-items-start gap-1">
            <AlertDialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Удалить объявление?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите удалить это объявление?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <AlertDialogCancel className="h-7 text-xs px-3">Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeleteAnnouncement}
              className="h-7 text-xs px-3"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Audience Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", "LYCEUM", "GROUP", "TEACHERS"] as const).map((audVal) => {
            const isActive = activeAudienceFilter === audVal;
            const labels = {
              ALL: `Все (${announcements.length})`,
              LYCEUM: "Лицею",
              GROUP: "Студентам",
              TEACHERS: "Преподавателям",
            };
            return (
              <button
                key={audVal}
                type="button"
                onClick={() => setActiveAudienceFilter(audVal)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[audVal]}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск объявлений..."
            className="pl-8 h-8 text-xs bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-2.5">
        {/* Pinned Announcements */}
        {pinnedAnnouncements.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-primary/40 bg-primary/5 dark:bg-primary/10 overflow-hidden transition-all"
          >
            {/* Header strip */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-primary/20 bg-primary/5 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6 border shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-bold">
                    {item.authorName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground truncate">{item.authorName}</span>
                <span className="text-muted-foreground text-[10px]">·</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{item.createdAt}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {getAudienceBadge(item.targetAudience, item.groupName)}
                <Badge className="bg-primary text-primary-foreground text-[8px] px-1 py-0 gap-0.5 font-medium">
                  <Sparkles className="h-2.5 w-2.5" /> Закреплено
                </Badge>
                {canCreate && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={() => handleStartEdit(item)}
                      title="Редактировать"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletingId(item.id)}
                      title="Удалить"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-1.5 text-xs">
              <h3 className="font-bold text-xs text-primary leading-snug">{item.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
                {item.body}
              </p>

              {/* Files */}
              {item.files && item.files.length > 0 && (
                <div className="space-y-1 pt-1">
                  {item.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-background text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium text-xs text-foreground truncate">{file.fileName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{file.fileSize}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDownloadFile(file)}
                        className="h-6 text-[10px] text-primary hover:text-primary hover:bg-primary/10 gap-1 shrink-0"
                      >
                        <Download className="h-3 w-3" /> Скачать
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Regular Announcements */}
        {regularAnnouncements.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border hover:border-muted-foreground/20 bg-background overflow-hidden transition-all"
          >
            {/* Header strip */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6 border shrink-0">
                  <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">
                    {item.authorName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground truncate">{item.authorName}</span>
                <span className="text-muted-foreground text-[10px]">·</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{item.createdAt}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {getAudienceBadge(item.targetAudience, item.groupName)}
                {canCreate && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                      onClick={() => handleStartEdit(item)}
                      title="Редактировать"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletingId(item.id)}
                      title="Удалить"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-1.5 text-xs">
              <h3 className="font-semibold text-xs text-foreground leading-snug">{item.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
                {item.body}
              </p>

              {/* Files */}
              {item.files && item.files.length > 0 && (
                <div className="space-y-1 pt-1">
                  {item.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/20 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-xs text-foreground truncate">{file.fileName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{file.fileSize}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleDownloadFile(file)}
                        className="h-6 text-[10px] gap-1 shrink-0"
                      >
                        <Download className="h-3 w-3" /> Скачать
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredAnnouncements.length === 0 && (
          <div className="rounded-xl border p-12 text-center space-y-2">
            <Megaphone className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <h3 className="text-sm font-semibold text-foreground">Объявлений не найдено</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              По вашему запросу объявлений не обнаружено. Сбросьте поиск или фильтр.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
