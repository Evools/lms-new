"use client";

import React, { useState } from "react";
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
  AlertTriangle,
} from "lucide-react";

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
  fileAttachment?: {
    fileName: string;
    fileSize: string;
    fileUrl: string;
  };
}

const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "ann-1",
    title: "Заседание педагогического совета и подведение итогов модуля",
    body: "Сегодня в 15:00 состоится плановое заседание педагогического совета в 304 кабинете. Повестка дня: промежуточная аттестация студентов за текущий модуль, анализ посещаемости и утверждение графиков предсессионных консультаций.",
    authorName: "Абдуллаева Г.Т.",
    authorRole: "ADMIN",
    targetAudience: "TEACHERS",
    createdAt: "Сегодня, 09:30",
    isPinned: true,
    fileAttachment: {
      fileName: "Повестка_педсовета_30_июля.pdf",
      fileSize: "1.2 MB",
      fileUrl: "#",
    },
  },
  {
    id: "ann-2",
    title: "График предсессионных консультаций по веб-программированию",
    body: "Уважаемые студенты группы ИС-1-25! Опубликован обновленный график дополнительных практических консультаций перед сдачей лабораторных работ. Консультации проходят по четвергам с 14:00 до 16:00 в кабинете 204.",
    authorName: "Иванов И.И.",
    authorRole: "TEACHER",
    targetAudience: "GROUP",
    groupName: "ИС-1-25",
    createdAt: "Вчера, 14:15",
    isPinned: false,
    fileAttachment: {
      fileName: "График_консультаций_ИС-1-25.docx",
      fileSize: "450 KB",
      fileUrl: "#",
    },
  },
  {
    id: "ann-3",
    title: "Обновление правил пользования цифровой библиотекой лицея",
    body: "Внимание студентам и преподавателям! В электронную библиотеку лицея добавлены новые учебные пособия по веб-разработке, алгоритмам и базами данных SQL. Доступ открыт для всех авторизованных пользователей платформы.",
    authorName: "Администрация Лицея",
    authorRole: "ADMIN",
    targetAudience: "LYCEUM",
    createdAt: "28 июля 2026, 11:00",
    isPinned: false,
    fileAttachment: {
      fileName: "Каталог_новинок_библиотеки_2026.pdf",
      fileSize: "3.8 MB",
      fileUrl: "#",
    },
  },
];

interface AnnouncementsViewProps {
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
  userName: string;
}

export function AnnouncementsView({ userRole, userName }: AnnouncementsViewProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(INITIAL_ANNOUNCEMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAudienceFilter, setActiveAudienceFilter] = useState<"ALL" | "LYCEUM" | "GROUP" | "TEACHERS">("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Announcement Form State
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newAudience, setNewAudience] = useState<"LYCEUM" | "GROUP" | "TEACHERS">("LYCEUM");
  const [newPinned, setNewPinned] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const canCreate = userRole === "ADMIN" || userRole === "TEACHER";

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
    if (deletingId) {
      setAnnouncements(announcements.filter((a) => a.id !== deletingId));
      setDeletingId(null);
    }
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
      fileAttachment: newFileName
        ? {
            fileName: newFileName,
            fileSize: "1.0 MB",
            fileUrl: "#",
          }
        : undefined,
    };

    setAnnouncements([createdItem, ...announcements]);
    setNewTitle("");
    setNewBody("");
    setNewAudience("LYCEUM");
    setNewPinned(false);
    setNewFileName("");
    setIsDialogOpen(false);
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
                        onValueChange={(val) => setNewAudience(val as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите аудиторию" />
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Прикрепить файл (необязательно)</label>
                    <Input
                      placeholder="Имя файла (например, Документ.pdf)"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose render={<Button variant="outline" type="button" />}>
                    Отмена
                  </DialogClose>
                  <Button type="submit">Опубликовать</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeletingId(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Удалить объявление"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-sm">
                  <h3 className="font-semibold text-base text-foreground leading-snug">{item.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
                    {item.body}
                  </p>

                  {item.fileAttachment && (
                    <div className="flex items-center justify-between p-2.5 border rounded-md bg-background text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded bg-muted">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-foreground truncate">{item.fileAttachment.fileName}</div>
                          <div className="text-[10px] text-muted-foreground">{item.fileAttachment.fileSize}</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="xs" className="shrink-0 text-primary">
                        <Download className="h-3.5 w-3.5 mr-1" /> Скачать
                      </Button>
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
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeletingId(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Удалить объявление"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-sm">
                  <h3 className="font-semibold text-base text-foreground leading-snug">{item.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
                    {item.body}
                  </p>

                  {item.fileAttachment && (
                    <div className="flex items-center justify-between p-2.5 border rounded-md bg-muted/20 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded bg-background border">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-foreground truncate">{item.fileAttachment.fileName}</div>
                          <div className="text-[10px] text-muted-foreground">{item.fileAttachment.fileSize}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="xs" className="shrink-0">
                        <Download className="h-3.5 w-3.5 mr-1" /> Скачать
                      </Button>
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
