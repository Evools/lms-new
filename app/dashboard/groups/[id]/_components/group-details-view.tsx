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
import { Checkbox } from "@/components/ui/checkbox";
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
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
} from "lucide-react";
import {
  GroupDetailsDTO,
  GroupStudentDTO,
  GroupSubjectDTO,
  GroupAnnouncementDTO,
  removeStudentFromGroupAction,
  setGroupLeadershipAction,
  createGroupAnnouncementAction,
  updateGroupAnnouncementAction,
  deleteGroupAnnouncementAction,
} from "../../actions";
import { DayDutyGroupDTO, addDutyStudentAction, removeDutyStudentAction, generateWeeklyDutyAction } from "@/app/dashboard/duty/actions";

interface GroupDetailsViewProps {
  group: GroupDetailsDTO;
  userRole: string;
  weeklyDays?: DayDutyGroupDTO[];
}

export function GroupDetailsView({ group, userRole, weeklyDays = [] }: GroupDetailsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchStudent, setSearchStudent] = useState("");
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "SUBJECTS" | "ANNOUNCEMENTS" | "DUTY">("STUDENTS");

  // Announcement modal state
  const [isAddAnnOpen, setIsAddAnnOpen] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [annErrorMessage, setAnnErrorMessage] = useState<string | null>(null);

  // Student deletion modal state
  const [targetRemoveStudentId, setTargetRemoveStudentId] = useState<string | null>(null);
  const [removeErrorMessage, setRemoveErrorMessage] = useState<string | null>(null);

  // Manual duty assignment modal state
  const [dutyModalDay, setDutyModalDay] = useState<DayDutyGroupDTO | null>(null);
  const [selectedDutyStudentId, setSelectedDutyStudentId] = useState<string>("");
  const [dutyActionStatus, setDutyActionStatus] = useState<{ success?: string; error?: string } | null>(null);

  // Duty Sub-Tab State: SCHEDULE vs SETTINGS
  const [dutySubTab, setDutySubTab] = useState<"SCHEDULE" | "SETTINGS">("SCHEDULE");
  const [dutyPerDaySetting, setDutyPerDaySetting] = useState<number>(0); // 0 = Auto
  const [activeDutyDays, setActiveDutyDays] = useState<number[]>([0, 1, 2, 3, 4, 5]); // Mon-Sat
  const [includeLeader, setIncludeLeader] = useState<boolean>(true);
  const [dutyAlgorithm, setDutyAlgorithm] = useState<"FAIR" | "ALPHABETICAL" | "RANDOM">("FAIR");
  const [excludedStudentIds, setExcludedStudentIds] = useState<string[]>([]);
  const [exemptionSearch, setExemptionSearch] = useState<string>("");

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER";

  const handleApplyDetailedDutySettings = () => {
    setDutyActionStatus(null);
    startTransition(async () => {
      const res = await generateWeeklyDutyAction(group.id, {
        perDay: dutyPerDaySetting > 0 ? dutyPerDaySetting : undefined,
        activeDays: activeDutyDays,
        includeLeader,
        algorithm: dutyAlgorithm,
        excludedStudentIds,
      });
      if (res.success) {
        setDutyActionStatus({ success: "График дежурств успешно сформирован с учетом всех настроек!" });
        setDutySubTab("SCHEDULE");
        router.refresh();
        setTimeout(() => setDutyActionStatus(null), 3500);
      } else {
        setDutyActionStatus({ error: res.error || "Ошибка при генерации графика" });
      }
    });
  };

  const handleConfirmAddDuty = () => {
    if (!dutyModalDay || !selectedDutyStudentId) return;
    setDutyActionStatus(null);
    startTransition(async () => {
      const res = await addDutyStudentAction(group.id, selectedDutyStudentId, dutyModalDay.fullDate);
      if (res.success) {
        setDutyActionStatus({ success: "Дежурный успешно добавлен!" });
        setDutyModalDay(null);
        setSelectedDutyStudentId("");
        router.refresh();
        setTimeout(() => setDutyActionStatus(null), 3000);
      } else {
        setDutyActionStatus({ error: res.error || "Ошибка добавления дежурного" });
      }
    });
  };

  const handleRemoveDutyStudent = (studentId: string, dateStr: string) => {
    setDutyActionStatus(null);
    startTransition(async () => {
      const res = await removeDutyStudentAction(group.id, studentId, dateStr);
      if (res.success) {
        setDutyActionStatus({ success: "Дежурный успешно убран!" });
        router.refresh();
        setTimeout(() => setDutyActionStatus(null), 3000);
      } else {
        setDutyActionStatus({ error: res.error || "Ошибка при удалении из дежурства" });
      }
    });
  };

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
    const res = await createGroupAnnouncementAction(group.id, newAnnTitle, newAnnContent, isImportant);

    if (res.success) {
      setNewAnnTitle("");
      setNewAnnContent("");
      setIsImportant(false);
      setIsAddAnnOpen(false);
    } else {
      setAnnErrorMessage(res.error || "Ошибка при публикации объявления");
    }
  };
  const [editingAnn, setEditingAnn] = useState<GroupAnnouncementDTO | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editIsImportant, setEditIsImportant] = useState(false);
  const [editAnnErrorMessage, setEditAnnErrorMessage] = useState<string | null>(null);

  // Announcement Delete modal state
  const [deletingAnnId, setDeletingAnnId] = useState<string | null>(null);

  const handleOpenEditAnn = (ann: GroupAnnouncementDTO) => {
    setEditingAnn(ann);
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditIsImportant(ann.isImportant);
    setEditAnnErrorMessage(null);
  };

  const handleSaveEditAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn || !editTitle.trim() || !editContent.trim()) return;

    setEditAnnErrorMessage(null);
    const res = await updateGroupAnnouncementAction(group.id, editingAnn.id, editTitle, editContent, editIsImportant);

    if (res.success) {
      setEditingAnn(null);
    } else {
      setEditAnnErrorMessage(res.error || "Ошибка при обновлении объявления");
    }
  };

  const handleConfirmDeleteAnn = async () => {
    if (!deletingAnnId) return;

    const res = await deleteGroupAnnouncementAction(group.id, deletingAnnId);
    if (res.success) {
      setDeletingAnnId(null);
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
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-foreground">
                  Группа {group.name}
                </h1>
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 font-medium">
                  {group.course} Курс
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {group.specialty}
              </p>
            </div>
          </div>

          {/* Quick KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="bg-background border p-2 rounded-lg text-center">
              <div className="text-[9px] text-muted-foreground uppercase font-semibold">Студентов в группе</div>
              <div className="text-sm font-bold text-primary flex items-center justify-center gap-1 mt-0.5">
                <GraduationCap className="h-3.5 w-3.5" />
                {group.studentCount} чел.
              </div>
            </div>

            <div className="bg-background border p-2 rounded-lg text-center">
              <div className="text-[9px] text-muted-foreground uppercase font-semibold">Куратор группы</div>
              <div className="text-xs font-bold text-foreground mt-0.5 truncate max-w-[130px] mx-auto">
                {group.curatorName || "Не назначен"}
              </div>
            </div>

            <div className="bg-background border p-2 rounded-lg text-center col-span-2 sm:col-span-1">
              <div className="text-[9px] text-muted-foreground uppercase font-semibold">Учебный период</div>
              <div className="text-xs font-bold text-foreground mt-0.5">
                {group.academicYear}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Workspace Navigation Tabs */}
      <div className="space-y-4">
        <div className="bg-muted/60 p-1 border rounded-xl flex items-center gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("STUDENTS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === "STUDENTS"
                ? "bg-background border border-border shadow-2xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span>Состав студентов ({group.studentsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SUBJECTS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === "SUBJECTS"
                ? "bg-background border border-border shadow-2xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span>Предметы ({group.subjectsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ANNOUNCEMENTS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === "ANNOUNCEMENTS"
                ? "bg-background border border-border shadow-2xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Megaphone className="h-3.5 w-3.5 shrink-0" />
            <span>Объявления ({group.announcementsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DUTY")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === "DUTY"
                ? "bg-background border border-border shadow-2xs text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>График дежурств</span>
          </button>
        </div>

        {/* TAB 1: STUDENTS LIST WORKSPACE */}
        {activeTab === "STUDENTS" && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Поиск по ФИО, email или телефону..."
                  className="pl-8 h-8 text-xs bg-background"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {filteredStudents.length} чел.
                </span>
                {isAdminOrTeacher && (
                  <Button size="xs" className="h-8 text-xs gap-1.5" render={<Link href="/dashboard/students/new" />}>
                    <UserPlus className="h-3.5 w-3.5" /> Зачислить
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[28px_1fr_auto] md:grid-cols-[28px_1fr_160px_130px_auto] items-center gap-3 px-3 py-2 bg-muted/40 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <span className="text-center">#</span>
                <span>Студент</span>
                <span className="hidden md:block">Email</span>
                <span className="hidden md:block">Телефон</span>
                <span></span>
              </div>

              <div className="divide-y">
                {filteredStudents.map((st: GroupStudentDTO, idx: number) => (
                  <div
                    key={st.id}
                    className="grid grid-cols-[28px_1fr_auto] md:grid-cols-[28px_1fr_160px_130px_auto] items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors"
                  >
                    {/* Index */}
                    <span className="text-[11px] text-muted-foreground text-center font-medium">{idx + 1}</span>

                    {/* Name + badges */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-7 w-7 border shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {st.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/dashboard/students/${st.id}/edit`}
                            className="text-xs font-medium text-foreground hover:text-primary hover:underline transition-colors truncate"
                          >
                            {st.name}
                          </Link>
                          {st.roleInGroup === "MONITOR" && (
                            <Badge className="shrink-0 bg-primary text-primary-foreground text-[9px] px-1.5 py-0 gap-0.5 font-medium whitespace-nowrap">
                              <Crown className="h-2.5 w-2.5 shrink-0" /> Староста
                            </Badge>
                          )}
                          {st.roleInGroup === "DEPUTY_MONITOR" && (
                            <Badge variant="secondary" className="shrink-0 text-[9px] px-1.5 py-0 gap-0.5 font-medium whitespace-nowrap">
                              <ShieldCheck className="h-2.5 w-2.5 shrink-0" /> Зам. старосты
                            </Badge>
                          )}
                        </div>
                        {/* Mobile contacts */}
                        <div className="md:hidden flex flex-col gap-0.5 text-[10px] text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-2.5 w-2.5 shrink-0" /> {st.email}
                          </span>
                          {st.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5 shrink-0" /> {st.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email column */}
                    <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{st.email}</span>
                    </div>

                    {/* Phone column */}
                    <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground">
                      {st.phone ? (
                        <>
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{st.phone}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center shrink-0">
                      {isAdminOrTeacher ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="h-7 w-7 text-muted-foreground hover:text-foreground" />}>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-xs">Назначения в группе</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSetLeadership(st.id, "MONITOR")}>
                              <Crown className="h-3.5 w-3.5 mr-2 text-primary" /> Назначить старостой
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSetLeadership(st.id, "DEPUTY_MONITOR")}>
                              <ShieldCheck className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Назначить зам. старосты
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
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{st.joinedAt}</span>
                      )}
                    </div>
                  </div>
                ))}

                {filteredStudents.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground text-xs space-y-2">
                    <Users className="h-7 w-7 mx-auto text-muted-foreground/40" />
                    <div>Студенты не найдены</div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SUBJECTS & TEACHERS WORKSPACE */}
        {activeTab === "SUBJECTS" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {group.subjectsList.length} {group.subjectsList.length === 1 ? "дисциплина" : "дисциплин"}
              </span>
            </div>

            <div className="rounded-xl border overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_180px_auto] items-center gap-3 px-3 py-2 bg-muted/40 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <span>Дисциплина</span>
                <span className="hidden md:block">Преподаватель</span>
                <span></span>
              </div>

              <div className="divide-y">
                {group.subjectsList.map((sub: GroupSubjectDTO) => (
                  <div
                    key={sub.id}
                    className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_180px_auto] items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors"
                  >
                    {/* Subject name */}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{sub.name}</div>
                      {/* Mobile teacher */}
                      <div className="md:hidden flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <GraduationCap className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{sub.teacherName}</span>
                      </div>
                    </div>

                    {/* Teacher column */}
                    <div className="hidden md:flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs text-foreground font-medium truncate">{sub.teacherName}</span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                        <Mail className="h-2.5 w-2.5 shrink-0" /> {sub.teacherEmail}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="flex items-center shrink-0">
                      <Button size="xs" variant="ghost" className="h-7 text-xs text-primary gap-1 px-2" render={<Link href="/dashboard/lms" />}>
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">LMS</span>
                      </Button>
                    </div>
                  </div>
                ))}

                {group.subjectsList.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground text-xs space-y-2">
                    <BookOpen className="h-7 w-7 mx-auto text-muted-foreground/40" />
                    <div>Учебные дисциплины не назначены</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* TAB 3: GROUP ANNOUNCEMENTS WORKSPACE */}
        {activeTab === "ANNOUNCEMENTS" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">Лента объявлений</span>
                {group.announcementsList.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                    {group.announcementsList.length}
                  </Badge>
                )}
              </div>

              {isAdminOrTeacher && (
                <Dialog open={isAddAnnOpen} onOpenChange={setIsAddAnnOpen}>
                  <DialogTrigger render={<Button size="xs" className="h-8 text-xs gap-1.5" />}>
                    <Plus className="h-3.5 w-3.5" /> Новое объявление
                  </DialogTrigger>
                  <DialogContent className="p-4 gap-3 text-xs sm:max-w-[540px]">
                    <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                      <DialogHeader className="pb-2 border-b gap-1">
                        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <Megaphone className="h-4 w-4 text-primary" /> Публикация объявления
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                          Для студентов группы <strong>{group.name}</strong>
                        </DialogDescription>
                      </DialogHeader>

                      {annErrorMessage && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
                          {annErrorMessage}
                        </div>
                      )}

                      <div className="space-y-3 text-xs">
                        {/* Type selector cards */}
                        <div className="space-y-1.5">
                          <label className="font-medium text-foreground text-xs">Категория</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setIsImportant(false)}
                              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                                !isImportant
                                  ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                              }`}
                            >
                              <div className={`mt-0.5 p-1 rounded-md shrink-0 ${!isImportant ? "bg-primary/15" : "bg-muted"}`}>
                                <Megaphone className={`h-3.5 w-3.5 ${!isImportant ? "text-primary" : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <div className={`text-xs font-medium ${!isImportant ? "text-primary" : "text-foreground"}`}>Обычное</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Стандартное извещение</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsImportant(true)}
                              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                                isImportant
                                  ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                              }`}
                            >
                              <div className={`mt-0.5 p-1 rounded-md shrink-0 ${isImportant ? "bg-primary/15" : "bg-muted"}`}>
                                <Sparkles className={`h-3.5 w-3.5 ${isImportant ? "text-primary" : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <div className={`text-xs font-medium flex items-center gap-1.5 ${isImportant ? "text-primary" : "text-foreground"}`}>
                                  Важное
                                  <Badge className="bg-primary/15 text-primary border-0 text-[8px] px-1 py-0 font-medium">закреплено</Badge>
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Всегда сверху в ленте</div>
                              </div>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-medium text-foreground text-xs">Заголовок *</label>
                          <Input
                            required
                            placeholder="Например: Изменение расписания на вторник"
                            value={newAnnTitle}
                            onChange={(e) => setNewAnnTitle(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-medium text-foreground text-xs">Текст сообщения *</label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Напишите подробный текст объявления..."
                            value={newAnnContent}
                            onChange={(e) => setNewAnnContent(e.target.value)}
                            className="w-full p-2 rounded-md border text-xs bg-background focus:outline-hidden focus:ring-1 focus:ring-primary resize-none"
                          />
                        </div>
                      </div>

                      <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
                        <Button variant="outline" size="xs" type="button" onClick={() => setIsAddAnnOpen(false)}>
                          Отмена
                        </Button>
                        <Button size="xs" type="submit" disabled={!newAnnTitle.trim() || !newAnnContent.trim()}>
                          <Send className="h-3.5 w-3.5 mr-1" /> Опубликовать
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

              )}
            </div>

            <div className="space-y-2.5">
              {group.announcementsList.map((ann: GroupAnnouncementDTO) => (
                <div
                  key={ann.id}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    ann.isImportant
                      ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                      : "border-border hover:border-muted-foreground/20 bg-background"
                  }`}
                >
                  {/* Header strip */}
                  <div className={`flex items-center justify-between px-3 py-2 border-b gap-3 ${
                    ann.isImportant ? "border-primary/20 bg-primary/5" : "border-border bg-muted/30"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6 border shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                          {ann.authorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-foreground truncate">{ann.authorName}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{ann.date}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {ann.isImportant && (
                        <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 gap-0.5 font-medium">
                          <Sparkles className="h-2.5 w-2.5" /> Закреплено
                        </Badge>
                      )}
                      {isAdminOrTeacher && (
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleOpenEditAnn(ann)}
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            title="Редактировать"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeletingAnnId(ann.id)}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            title="Удалить"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-3 py-2.5 space-y-1">
                    <h4 className={`text-xs font-semibold ${ann.isImportant ? "text-primary" : "text-foreground"}`}>
                      {ann.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </p>
                  </div>
                </div>
              ))}

              {group.announcementsList.length === 0 && (
                <div className="rounded-xl border border-dashed py-10 text-center text-muted-foreground space-y-2">
                  <Megaphone className="h-7 w-7 mx-auto text-muted-foreground/30" />
                  <div className="text-xs font-medium">Нет объявлений для группы {group.name}</div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Опубликуйте первое объявление, чтобы оповестить студентов
                  </p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB 4: AUTOMATED & MANUAL DUTY SCHEDULE CALENDAR & SETTINGS */}
        {activeTab === "DUTY" && (
          <div className="space-y-4">
            {/* Header info & action strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
              <div className="space-y-1">
                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Управление графиком дежурств
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Календарная ротация, ручное назначение и детальные параметры дежурств
                </p>

                {/* Sub-tab navigation */}
                <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border text-xs w-fit mt-2">
                  <button
                    type="button"
                    onClick={() => setDutySubTab("SCHEDULE")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors font-medium ${
                      dutySubTab === "SCHEDULE"
                        ? "bg-card border border-border shadow-2xs text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>График и календарь</span>
                  </button>
                  {isAdminOrTeacher && (
                    <button
                      type="button"
                      onClick={() => setDutySubTab("SETTINGS")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors font-medium ${
                        dutySubTab === "SETTINGS"
                          ? "bg-card border border-border shadow-2xs text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>Настройки дежурств</span>
                    </button>
                  )}
                </div>
              </div>

              {dutySubTab === "SCHEDULE" && (
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                  <Button
                    size="xs"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => {
                      const targetDay = weeklyDays.find((d) => d.isToday && !d.isSunday) || weeklyDays.find((d) => !d.isSunday) || weeklyDays[0];
                      if (targetDay) {
                        setDutyModalDay(targetDay);
                        const avail = group.studentsList.filter((s) => !targetDay.dutyStudents.some((ds) => ds.id === s.id));
                        setSelectedDutyStudentId(avail[0]?.id || "");
                      }
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Назначить дежурного
                  </Button>
                  {isAdminOrTeacher && (
                    <Button
                      size="xs"
                      onClick={handleApplyDetailedDutySettings}
                      disabled={isPending}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {isPending ? "Расчет..." : "Сформировать график"}
                    </Button>
                  )}
                  <Button size="xs" variant="outline" className="h-8 text-xs gap-1.5" render={<Link href={`/dashboard/duty?group=${group.id}`} />}>
                    <Clock className="h-3.5 w-3.5" /> Общий реестр
                  </Button>
                </div>
              )}
            </div>

            {dutyActionStatus?.success && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{dutyActionStatus.success}</span>
              </div>
            )}

            {dutyActionStatus?.error && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <span>{dutyActionStatus.error}</span>
              </div>
            )}

            {/* SUB-TAB 1: WEEKLY SCHEDULE CALENDAR VIEW */}
            {dutySubTab === "SCHEDULE" && (
              <div className="space-y-4">
                <div className="rounded-xl border overflow-hidden bg-card">
                  {/* Table header */}
                  <div className="grid grid-cols-[100px_1fr_auto] items-center gap-3 px-3 py-2 bg-muted/40 border-b text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>День / Дата</span>
                    <span>Дежурные студенты</span>
                    <span className="text-right">Действие</span>
                  </div>

                  <div className="divide-y">
                    {weeklyDays.map((day) => {
                      const availableStudents = group.studentsList.filter(
                        (s) => !day.dutyStudents.some((ds) => ds.id === s.id)
                      );

                      return (
                        <div
                          key={day.fullDate}
                          className={`grid grid-cols-[100px_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors ${
                            day.isToday
                              ? "bg-primary/5"
                              : day.isSunday
                              ? "bg-muted/20 opacity-60"
                              : "hover:bg-muted/20"
                          }`}
                        >
                          {/* Day Column */}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold ${day.isToday ? "text-primary" : "text-foreground"}`}>
                                {day.dayName}
                              </span>
                              {day.isToday && (
                                <Badge className="bg-primary text-primary-foreground text-[8px] px-1 py-0 font-medium">
                                  Сегодня
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{day.dateStr}</div>
                          </div>

                          {/* Duty Students List Column */}
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            {day.isSunday ? (
                              <span className="text-[11px] text-muted-foreground/60 italic">Выходной день</span>
                            ) : day.dutyStudents && day.dutyStudents.length > 0 ? (
                              day.dutyStudents.map((st) => (
                                <div
                                  key={st.id}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${
                                    day.isToday
                                      ? "border-primary/30 bg-primary/10 text-primary"
                                      : "border-border bg-muted/20 text-foreground"
                                  }`}
                                >
                                  <Avatar className="h-4 w-4 border shrink-0">
                                    <AvatarFallback className={`text-[7px] font-bold ${day.isToday ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                      {st.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">{st.name}</span>
                                  {isAdminOrTeacher && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger render={
                                        <button
                                          type="button"
                                          className="p-1 rounded hover:bg-muted/80 text-muted-foreground/60 hover:text-foreground transition-colors ml-0.5"
                                        />
                                      }>
                                        <MoreVertical className="h-3 w-3" />
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="text-xs p-1 min-w-[160px]">
                                        <DropdownMenuItem
                                          onClick={() => handleRemoveDutyStudent(st.id, day.fullDate)}
                                          className="text-xs gap-2 py-1.5 cursor-pointer text-destructive focus:text-destructive font-medium"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          <span>Удалить из дежурных</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-muted-foreground/50">Не назначены</span>
                            )}
                          </div>

                          {/* Action Column */}
                          <div className="flex items-center justify-end gap-1.5 shrink-0">
                            {!day.isSunday && isAdminOrTeacher && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  setDutyModalDay(day);
                                  setSelectedDutyStudentId(availableStudents[0]?.id || "");
                                }}
                                disabled={availableStudents.length === 0}
                                className="h-7 text-xs px-2.5 gap-1 border-primary/20 text-primary hover:bg-primary/10"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Назначить</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {weeklyDays.length === 0 && (
                  <div className="rounded-xl border border-dashed py-10 text-center text-muted-foreground space-y-2">
                    <Clock className="h-7 w-7 mx-auto text-muted-foreground/30" />
                    <div className="text-xs font-medium">График дежурств ещё не создан</div>
                    {isAdminOrTeacher && (
                      <Button size="xs" onClick={handleApplyDetailedDutySettings} className="mt-2 text-xs">
                        <Sparkles className="h-3.5 w-3.5 mr-1" /> Сформировать авто-ротацию
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: DUTY SETTINGS PAGE VIEW */}
            {dutySubTab === "SETTINGS" && (
              <Card className="p-4 space-y-4 text-xs bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-primary" /> Настройки автоматической ротации
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Настройка алгоритма, числа дежурных, рабочих дней недели и индивидуальных исключений
                    </p>
                  </div>
                  <Button
                    size="xs"
                    onClick={handleApplyDetailedDutySettings}
                    disabled={isPending}
                    className="h-8 text-xs gap-1.5 shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {isPending ? "Расчет..." : "Сохранить и сформировать"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column 1: Duty Parameters */}
                  <div className="space-y-3.5">
                    {/* 1. Duty Persons Count */}
                    <div className="space-y-1.5 p-3 rounded-xl border bg-muted/10">
                      <label className="font-semibold text-foreground flex items-center justify-between">
                        <span>Количество дежурных в день:</span>
                        <span className="text-primary font-bold text-[11px]">
                          {dutyPerDaySetting === 0 ? "Авто-расчет (1-3 чел.)" : `${dutyPerDaySetting} чел. в смену`}
                        </span>
                      </label>
                      <div className="grid grid-cols-6 gap-1 p-1 bg-muted/60 rounded-lg border text-xs text-center font-medium">
                        {[
                          { value: 0, label: "Авто" },
                          { value: 1, label: "1 чел" },
                          { value: 2, label: "2 чел" },
                          { value: 3, label: "3 чел" },
                          { value: 4, label: "4 чел" },
                          { value: 5, label: "5 чел" },
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setDutyPerDaySetting(item.value)}
                            className={`py-1.5 rounded-md transition-colors ${
                              dutyPerDaySetting === item.value
                                ? "bg-background border border-border text-primary shadow-2xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Days of Week */}
                    <div className="space-y-1.5 p-3 rounded-xl border bg-muted/10">
                      <label className="font-semibold text-foreground">Дни проведения дежурств:</label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[
                          { idx: 0, name: "Пн" },
                          { idx: 1, name: "Вт" },
                          { idx: 2, name: "Ср" },
                          { idx: 3, name: "Чт" },
                          { idx: 4, name: "Пт" },
                          { idx: 5, name: "Сб" },
                        ].map((day) => {
                          const isActive = activeDutyDays.includes(day.idx);
                          return (
                            <button
                              key={day.idx}
                              type="button"
                              onClick={() => {
                                setActiveDutyDays((prev) =>
                                  isActive ? prev.filter((d) => d !== day.idx) : [...prev, day.idx].sort()
                                );
                              }}
                              className={`py-2 rounded-lg border text-center font-semibold transition-colors text-xs ${
                                isActive
                                  ? "bg-primary/10 border-primary/40 text-primary"
                                  : "bg-background border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {day.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Rotation Algorithm */}
                    <div className="space-y-1.5 p-3 rounded-xl border bg-muted/10">
                      <label className="font-semibold text-foreground">Алгоритм распределения:</label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg border text-xs text-center font-medium">
                        {[
                          { id: "FAIR", label: "Честный (учет прошлых)" },
                          { id: "ALPHABETICAL", label: "По алфавиту" },
                          { id: "RANDOM", label: "Случайный (рандом)" },
                        ].map((alg) => (
                          <button
                            key={alg.id}
                            type="button"
                            onClick={() => setDutyAlgorithm(alg.id as any)}
                            className={`py-1.5 px-1 rounded-md transition-colors text-[11px] truncate ${
                              dutyAlgorithm === alg.id
                                ? "bg-background border border-border text-primary shadow-2xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {alg.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Monitor / Leader Options */}
                    <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <Crown className="h-4 w-4 text-amber-500" /> Назначать старосту старшим
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Староста группы автоматически ставится ответственным дежурным на каждый день
                        </div>
                      </div>
                      <Checkbox
                        checked={includeLeader}
                        onCheckedChange={(val) => setIncludeLeader(!!val)}
                      />
                    </div>
                  </div>

                  {/* Column 2: Exempted Students (Исключения) */}
                  <div className="space-y-2 p-3 rounded-xl border bg-muted/10 flex flex-col">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-foreground">Освобождение от дежурств (Исключения):</label>
                      {excludedStudentIds.length > 0 ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 font-medium">
                          Освобождено: {excludedStudentIds.length} чел.
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Все дежурят</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Отметьте студентов, которые не должны включаться в ротацию (освобождены по здоровью и т.д.):
                    </p>

                    {group.studentsList.length > 6 && (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Поиск по ФИО..."
                          className="pl-8 h-8 text-xs bg-background"
                          value={exemptionSearch}
                          onChange={(e) => setExemptionSearch(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-h-[220px] max-h-[280px] overflow-y-auto border rounded-lg divide-y bg-background p-1">
                      {group.studentsList
                        .filter((s) => s.name.toLowerCase().includes(exemptionSearch.toLowerCase()))
                        .map((st) => {
                          const isExempt = excludedStudentIds.includes(st.id);
                          return (
                            <div
                              key={st.id}
                              onClick={() => {
                                setExcludedStudentIds((prev) =>
                                  isExempt ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                                );
                              }}
                              className={`p-2 flex items-center justify-between text-xs rounded-md cursor-pointer transition-colors ${
                                isExempt ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                              }`}
                            >
                              <span className="truncate">{st.name}</span>
                              <Checkbox
                                checked={isExempt}
                                onCheckedChange={() => {
                                  setExcludedStudentIds((prev) =>
                                    isExempt ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                                  );
                                }}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    При нажатии на кнопку график на текущую неделю будет автоматически переформирован.
                  </div>
                  <Button
                    size="xs"
                    onClick={handleApplyDetailedDutySettings}
                    disabled={isPending}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {isPending ? "Расчет..." : "Сохранить и сформировать график"}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

      </div>

      {/* AlertDialog for Student Removal */}
      <AlertDialog
        open={targetRemoveStudentId !== null}
        onOpenChange={(open) => !open && setTargetRemoveStudentId(null)}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="text-left place-items-start gap-1">
            <AlertDialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
              <Trash2 className="h-4 w-4" /> Исключение из группы
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите исключить выбранного студента из состава группы <strong>{group.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeErrorMessage && (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
              {removeErrorMessage}
            </div>
          )}

          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setTargetRemoveStudentId(null)}>
              Отмена
            </Button>
            <Button variant="destructive" size="xs" onClick={handleConfirmRemoveStudent}>
              Исключить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for Editing Announcement */}
      <Dialog open={editingAnn !== null} onOpenChange={(open) => !open && setEditingAnn(null)}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[540px]">
          <form onSubmit={handleSaveEditAnn} className="space-y-3">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Edit className="h-4 w-4 text-primary" /> Редактирование объявления
              </DialogTitle>
              <DialogDescription className="text-xs">
                Изменение содержания или типа публикации
              </DialogDescription>
            </DialogHeader>

            {editAnnErrorMessage && (
              <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
                {editAnnErrorMessage}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground text-xs">Категория объявления</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsImportant(false)}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all ${
                      !editIsImportant
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:bg-muted/30 text-muted-foreground font-medium"
                    }`}
                  >
                    <Megaphone className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <div>
                      <div className="text-xs font-medium">Обычное</div>
                      <div className="text-[10px] opacity-75">Стандартное извещение</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsImportant(true)}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all ${
                      editIsImportant
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:bg-muted/30 text-muted-foreground font-medium"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs font-medium flex items-center gap-1">
                        Важное <Badge className="bg-primary text-primary-foreground text-[8px] px-1 py-0 font-normal">Закреплено</Badge>
                      </div>
                      <div className="text-[10px] opacity-75">Всегда сверху в ленте</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Заголовок *</label>
                <Input
                  required
                  placeholder="Заголовок..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Текст сообщения *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Текст сообщения..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 rounded-md border text-xs bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" type="button" onClick={() => setEditingAnn(null)}>
                Отмена
              </Button>
              <Button size="xs" type="submit" disabled={!editTitle.trim() || !editContent.trim()}>
                Сохранить изменения
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog for Announcement Deletion */}
      <AlertDialog
        open={deletingAnnId !== null}
        onOpenChange={(open) => !open && setDeletingAnnId(null)}
      >
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="text-left place-items-start gap-1">
            <AlertDialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
              <Trash2 className="h-4 w-4" /> Удаление объявления
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите безвозвратно удалить это объявление из базы данных?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="xs" onClick={() => setDeletingAnnId(null)}>
              Отмена
            </Button>
            <Button variant="destructive" size="xs" onClick={handleConfirmDeleteAnn}>
              Удалить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for Manual Duty Assignment */}
      <Dialog open={dutyModalDay !== null} onOpenChange={(open) => !open && setDutyModalDay(null)}>
        {dutyModalDay && (
          <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
            <DialogHeader className="pb-2 border-b gap-1">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <UserPlus className="h-4 w-4 text-primary" /> Назначение дежурного на день
              </DialogTitle>
              <DialogDescription className="text-xs">
                Выберите день недели и студента из группы <strong>{group.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1 text-xs">
              {/* Day Selector */}
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">День недели</label>
                <Select
                  value={dutyModalDay.fullDate}
                  onValueChange={(val) => {
                    const found = weeklyDays.find((d) => d.fullDate === val);
                    if (found) {
                      setDutyModalDay(found);
                      const avail = group.studentsList.filter((s) => !found.dutyStudents.some((ds) => ds.id === s.id));
                      setSelectedDutyStudentId(avail[0]?.id || "");
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>
                      {dutyModalDay.dayName} ({dutyModalDay.dateStr})
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {weeklyDays
                      .filter((d) => !d.isSunday)
                      .map((d) => (
                        <SelectItem key={d.fullDate} value={d.fullDate} className="text-xs">
                          {d.dayName} ({d.dateStr}) {d.isToday ? "— Сегодня" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Selector */}
              <div className="space-y-1">
                <label className="font-medium text-foreground text-xs">Студент для дежурства</label>
                <Select value={selectedDutyStudentId} onValueChange={(val) => val && setSelectedDutyStudentId(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue>
                      {group.studentsList.find((s) => s.id === selectedDutyStudentId)?.name || "Выберите студента"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[...group.studentsList]
                      .filter((s) => !dutyModalDay.dutyStudents.some((ds) => ds.id === s.id))
                      .sort((a, b) => {
                        const aOnDuty = weeklyDays.some((d) => d.dutyStudents.some((ds) => ds.id === a.id));
                        const bOnDuty = weeklyDays.some((d) => d.dutyStudents.some((ds) => ds.id === b.id));
                        if (aOnDuty !== bOnDuty) return aOnDuty ? 1 : -1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((st) => {
                        const isAlreadyOnDutyThisWeek = weeklyDays.some(
                          (d) => d.dutyStudents.some((ds) => ds.id === st.id)
                        );
                        return (
                          <SelectItem key={st.id} value={st.id} className="text-xs">
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{st.name}</span>
                              {isAlreadyOnDutyThisWeek && (
                                <span className="text-[10px] text-primary font-normal">
                                  (Уже дежурит на этой неделе)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="xs" onClick={() => setDutyModalDay(null)}>
                Отмена
              </Button>
              <Button size="xs" disabled={!selectedDutyStudentId || isPending} onClick={handleConfirmAddDuty}>
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Назначить
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

    </div>
  );
}
