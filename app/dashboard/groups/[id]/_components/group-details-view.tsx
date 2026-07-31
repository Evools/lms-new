"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Users,
  GraduationCap,
  Mail,
  Phone,
  Search,
  BookOpen,
  Megaphone,
  UserCheck,
  ChevronLeft,
  Crown,
  ShieldCheck,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  Send,
  UserPlus,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  GroupDetailsDTO,
  GroupStudentDTO,
  GroupSubjectDTO,
  GroupAnnouncementDTO,
  removeStudentFromGroupAction,
  setGroupLeadershipAction,
  createGroupAnnouncementAction,
} from "../../actions";

interface GroupDetailsViewProps {
  group: GroupDetailsDTO;
  userRole: string;
}

export function GroupDetailsView({ group, userRole }: GroupDetailsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchStudent, setSearchStudent] = useState("");
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "SUBJECTS" | "ANNOUNCEMENTS" | "DUTY">("STUDENTS");

  // Announcement modal state
  const [isAddAnnOpen, setIsAddAnnOpen] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [annErrorMessage, setAnnErrorMessage] = useState<string | null>(null);

  // Student deletion modal state
  const [targetRemoveStudentId, setTargetRemoveStudentId] = useState<string | null>(null);
  const [removeErrorMessage, setRemoveErrorMessage] = useState<string | null>(null);

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";

  // Filter students
  const filteredStudents = group.studentsList.filter((s: GroupStudentDTO) => {
    const query = searchStudent.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      (s.phone && s.phone.toLowerCase().includes(query))
    );
  });

  const handleConfirmRemoveStudent = async () => {
    if (!targetRemoveStudentId) return;

    setRemoveErrorMessage(null);
    const res = await removeStudentFromGroupAction(group.id, targetRemoveStudentId);

    if (res.success) {
      setTargetRemoveStudentId(null);
    } else {
      setRemoveErrorMessage(res.error || "Ошибка при исключении из группы");
    }
  };

  const handleSetLeadership = (studentId: string, role: "MONITOR" | "DEPUTY_MONITOR" | "NONE") => {
    startTransition(async () => {
      await setGroupLeadershipAction(group.id, studentId, role);
    });
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    setAnnErrorMessage(null);
    const res = await createGroupAnnouncementAction(group.id, newAnnTitle, newAnnContent);

    if (res.success) {
      setNewAnnTitle("");
      setNewAnnContent("");
      setIsAddAnnOpen(false);
    } else {
      setAnnErrorMessage(res.error || "Ошибка при публикации объявления");
    }
  };

  return (
    <div className="w-full space-y-4 text-xs pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/dashboard/groups" className="hover:text-primary transition-colors flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Учебные группы</span>
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">{group.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {isAdminOrTeacher && (
            <Button
              variant="outline"
              size="xs"
              render={<Link href={`/dashboard/groups/${group.id}/edit`} />}
              className="text-xs h-7 gap-1"
            >
              <Edit className="h-3.5 w-3.5" /> Редактировать группу
            </Button>
          )}
          <Button
            variant="outline"
            size="xs"
            onClick={() => router.push("/dashboard/groups")}
            className="text-xs h-7"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> К списку групп
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <Card className="border bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-xs overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Группа {group.name}
                  </h1>
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0">
                    {group.course} Курс
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.specialty}
                </p>
              </div>
            </div>

            {/* Quick KPI Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="bg-background/90 border p-2.5 rounded-xl text-center shadow-xs">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Студентов в группе</div>
                <div className="text-base font-extrabold text-primary flex items-center justify-center gap-1 mt-0.5">
                  <GraduationCap className="h-4 w-4" />
                  {group.studentCount} чел.
                </div>
              </div>

              <div className="bg-background/90 border p-2.5 rounded-xl text-center shadow-xs">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Куратор группы</div>
                <div className="text-xs font-bold text-foreground mt-1 truncate max-w-[140px] mx-auto">
                  {group.curatorName || "Не назначен"}
                </div>
              </div>

              <div className="bg-background/90 border p-2.5 rounded-xl text-center shadow-xs col-span-2 sm:col-span-1">
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Учебный период</div>
                <div className="text-xs font-bold text-foreground mt-1">
                  {group.academicYear}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Workspace Navigation Tabs */}
      <div className="space-y-4">
        <div className="bg-muted/40 p-1 border rounded-xl flex items-center gap-1 overflow-x-auto">
          <Button
            size="xs"
            variant={activeTab === "STUDENTS" ? "default" : "ghost"}
            onClick={() => setActiveTab("STUDENTS")}
            className="text-xs gap-1.5 rounded-lg px-3 py-1.5 h-8"
          >
            <GraduationCap className="h-3.5 w-3.5" /> Состав студентов ({group.studentsList.length})
          </Button>

          <Button
            size="xs"
            variant={activeTab === "SUBJECTS" ? "default" : "ghost"}
            onClick={() => setActiveTab("SUBJECTS")}
            className="text-xs gap-1.5 rounded-lg px-3 py-1.5 h-8"
          >
            <BookOpen className="h-3.5 w-3.5" /> Предметы ({group.subjectsList.length})
          </Button>

          <Button
            size="xs"
            variant={activeTab === "ANNOUNCEMENTS" ? "default" : "ghost"}
            onClick={() => setActiveTab("ANNOUNCEMENTS")}
            className="text-xs gap-1.5 rounded-lg px-3 py-1.5 h-8"
          >
            <Megaphone className="h-3.5 w-3.5" /> Объявления ({group.announcementsList.length})
          </Button>

          <Button
            size="xs"
            variant={activeTab === "DUTY" ? "default" : "ghost"}
            onClick={() => setActiveTab("DUTY")}
            className="text-xs gap-1.5 rounded-lg px-3 py-1.5 h-8"
          >
            <Clock className="h-3.5 w-3.5" /> График дежурств
          </Button>
        </div>

        {/* TAB 1: STUDENTS LIST WORKSPACE */}
        {activeTab === "STUDENTS" && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-xl border">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Поиск студента по ФИО, Email или телефону..."
                  className="pl-8 h-8 text-xs bg-background"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
              </div>

              {isAdminOrTeacher && (
                <Button size="xs" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/students/new" />}>
                  <UserPlus className="h-3.5 w-3.5" /> Зачислить нового студента
                </Button>
              )}
            </div>

            <Card className="border shadow-none overflow-hidden">
              <CardHeader className="py-2.5 px-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Приказной состав группы {group.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    Всего: {filteredStudents.length} чел.
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="divide-y text-xs">
                  {filteredStudents.map((st: GroupStudentDTO, idx: number) => (
                    <div
                      key={st.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-muted-foreground w-5 text-[11px] font-semibold text-center">{idx + 1}.</span>
                        <Avatar className="h-8 w-8 border shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-[11px]">
                            {st.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="font-semibold text-foreground text-xs flex items-center gap-2 flex-wrap">
                            <Link href={`/dashboard/students/${st.id}/edit`} className="hover:underline hover:text-primary transition-colors">
                              {st.name}
                            </Link>

                            {st.roleInGroup === "MONITOR" && (
                              <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 gap-1">
                                <Crown className="h-2.5 w-2.5" /> Староста
                              </Badge>
                            )}

                            {st.roleInGroup === "DEPUTY_MONITOR" && (
                              <Badge className="bg-blue-500 text-white text-[9px] px-1.5 py-0 gap-1">
                                <ShieldCheck className="h-2.5 w-2.5" /> Зам. старосты
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-[11px] mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {st.email}
                            </span>
                            {st.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {st.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-8 sm:pl-0 shrink-0">
                        <span className="text-[10px] text-muted-foreground">Зачислен: {st.joinedAt}</span>

                        {isAdminOrTeacher && (
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="h-7 w-7 text-muted-foreground" />}>
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs">Назначения в группе</DropdownMenuLabel>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSetLeadership(st.id, "MONITOR")}>
                                <Crown className="h-3.5 w-3.5 mr-2 text-amber-500" /> Назначить старостой
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetLeadership(st.id, "DEPUTY_MONITOR")}>
                                <ShieldCheck className="h-3.5 w-3.5 mr-2 text-blue-500" /> Назначить зам. старосты
                              </DropdownMenuItem>
                              {st.roleInGroup !== "STUDENT" && (
                                <DropdownMenuItem onClick={() => handleSetLeadership(st.id, "NONE")}>
                                  <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Снять полномочия
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem render={<Link href={`/dashboard/students/${st.id}/edit`} />}>
                                <Edit className="h-3.5 w-3.5 mr-2 text-primary" /> Редактировать профиль
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setTargetRemoveStudentId(st.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Исключить из группы
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredStudents.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                      <Users className="h-7 w-7 mx-auto text-muted-foreground/40" />
                      <div>Студенты не найдены в составе этой группы</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: SUBJECTS & TEACHERS WORKSPACE */}
        {activeTab === "SUBJECTS" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.subjectsList.map((sub: GroupSubjectDTO) => (
              <Card key={sub.id} className="border shadow-none hover:border-primary/40 transition-all">
                <CardHeader className="pb-2.5 border-b">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {sub.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Преподаватель: <strong className="text-foreground">{sub.teacherName}</strong>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Активен
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> Email: {sub.teacherEmail}
                  </div>
                  <div className="pt-2 border-t flex items-center justify-end">
                    <Button size="xs" variant="ghost" className="text-xs text-primary gap-1" render={<Link href="/dashboard/lms" />}>
                      <BookOpen className="h-3.5 w-3.5" /> Учебный контент & LMS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {group.subjectsList.length === 0 && (
              <Card className="col-span-2 border shadow-none p-8 text-center text-muted-foreground space-y-2">
                <BookOpen className="h-7 w-7 mx-auto text-muted-foreground/40" />
                <div>Для группы {group.name} пока не назначены учебные дисциплины</div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: GROUP ANNOUNCEMENTS WORKSPACE */}
        {activeTab === "ANNOUNCEMENTS" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-xl border">
              <div>
                <h3 className="font-semibold text-xs text-foreground">Объявления и важные извещения группы</h3>
                <p className="text-[11px] text-muted-foreground">Публикация важной информации для студентов группы {group.name}</p>
              </div>

              {isAdminOrTeacher && (
                <Dialog open={isAddAnnOpen} onOpenChange={setIsAddAnnOpen}>
                  <DialogTrigger render={<Button size="xs" className="h-8 text-xs gap-1.5" />}>
                    <Plus className="h-3.5 w-3.5" /> Опубликовать объявление
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px]">
                    <form onSubmit={handleCreateAnnouncement}>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                          <Megaphone className="h-4.5 w-4.5 text-primary" /> Публикация объявления
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                          Оповещение будет доступно всем студентам группы <strong>{group.name}</strong>
                        </DialogDescription>
                      </DialogHeader>

                      {annErrorMessage && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded border border-destructive/20 mt-2">
                          {annErrorMessage}
                        </div>
                      )}

                      <div className="space-y-3 py-3 text-xs">
                        <div className="space-y-1.5">
                          <label className="font-medium text-foreground">Заголовок объявления *</label>
                          <Input
                            required
                            placeholder="Например: Изменение расписания на вторник"
                            value={newAnnTitle}
                            onChange={(e) => setNewAnnTitle(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-medium text-foreground">Текст сообщения *</label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Введите подробную информацию..."
                            value={newAnnContent}
                            onChange={(e) => setNewAnnContent(e.target.value)}
                            className="w-full p-2.5 rounded-md border text-xs bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <DialogClose render={<Button variant="outline" size="xs" type="button" />}>
                          Отмена
                        </DialogClose>
                        <Button size="xs" type="submit" disabled={!newAnnTitle.trim() || !newAnnContent.trim()}>
                          <Send className="h-3.5 w-3.5 mr-1" /> Опубликовать
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-3">
              {group.announcementsList.map((ann: GroupAnnouncementDTO) => (
                <Card key={ann.id} className="border shadow-none">
                  <CardHeader className="pb-2 border-b">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-bold text-foreground">{ann.title}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">{ann.date}</Badge>
                    </div>
                    <CardDescription className="text-[11px]">
                      Автор: <strong className="text-foreground">{ann.authorName}</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-3 text-xs leading-relaxed">
                    {ann.content}
                  </CardContent>
                </Card>
              ))}

              {group.announcementsList.length === 0 && (
                <Card className="border shadow-none p-8 text-center text-muted-foreground space-y-2">
                  <Megaphone className="h-7 w-7 mx-auto text-muted-foreground/40" />
                  <div>Нет активных объявлений для группы {group.name}</div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUTOMATED DUTY SCHEDULE WORKSPACE */}
        {activeTab === "DUTY" && (
          <Card className="border shadow-none">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> График дежурств по группе
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Автоматическое распределение студентов группы {group.name}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Поток: {group.name}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Ответственные за порядок
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Староста группы: <strong className="text-foreground">{group.monitorName || "Не назначен"}</strong>
                  </p>
                </div>
                <Button size="xs" variant="outline" render={<Link href="/dashboard/duty" />}>
                  Полноэкранный график
                </Button>
              </div>

              <div className="divide-y border rounded-xl overflow-hidden">
                {group.studentsList.map((st: GroupStudentDTO, i: number) => (
                  <div key={st.id} className="p-3 flex items-center justify-between hover:bg-muted/20">
                    <div className="flex items-center gap-2.5">
                      <span className="text-muted-foreground text-[11px] font-mono w-4">#{i + 1}</span>
                      <span className="font-semibold text-foreground">{st.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {i % 2 === 0 ? "Понедельник / Среда" : "Вторник / Четверг"}
                    </Badge>
                  </div>
                ))}

                {group.studentsList.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    Студенты для формирования графика дежурств пока не зачислены
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AlertDialog for Student Removal */}
      <AlertDialog
        open={targetRemoveStudentId !== null}
        onOpenChange={(open) => !open && setTargetRemoveStudentId(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Исключение из группы
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Вы действительно хотите исключить выбранного студента из состава группы <strong>{group.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeErrorMessage && (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded border border-destructive/20">
              {removeErrorMessage}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Отмена</AlertDialogCancel>
            <Button variant="destructive" size="sm" onClick={handleConfirmRemoveStudent}>
              Исключить из группы
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
