"use client";

import React, { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AttendanceStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
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
  UserCheck,
  CheckCheck,
  Printer,
  ChevronLeft,
  ChevronRight,
  Building2,
  BookOpen,
  Calendar as CalendarIcon,
  Crown,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Clock,
  Shield,
  ShieldCheck,
  RefreshCw,
  Keyboard,
  Layers,
  Zap,
  Accessibility,
  Wifi,
  WifiOff,
  HardDrive,
  CloudUpload,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  GroupItemDTO,
  GroupSubjectItemDTO,
  saveBatchAttendanceAction,
  clearAttendanceAction,
} from "../actions";
import { replaceDutyStudentAction } from "@/app/dashboard/duty/actions";
import { toast } from "@/components/ui/toast";
import { AttendanceStatsView } from "./attendance-stats-view";

interface StudentInfo {
  studentId: string;
  studentName: string;
  isMonitor: boolean;
  isDeputyMonitor?: boolean;
  isDutyExempt?: boolean;
  email?: string;
  rollNumber?: string | null;
}

interface OfflineQueueItem {
  id: string;
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  dateStr: string;
  batchList: { studentId: string; status: AttendanceStatus; comment: string }[];
  savedAt: string;
}

interface AttendanceViewProps {
  userRole: string;
  groups: GroupItemDTO[];
  subjects: GroupSubjectItemDTO[];
  students: StudentInfo[];
  attendanceMap: Record<string, { status: AttendanceStatus; comment: string }>;
  dutyMap?: Record<string, { isDuty: boolean; isLeader: boolean }>;
  selectedGroupId: string;
  selectedGroupSubjectId: string;
  dateStr: string;
  canEdit?: boolean;
}

type FilterStatusTab = "ALL" | AttendanceStatus;

export function AttendanceView({
  userRole,
  groups = [],
  subjects = [],
  students = [],
  attendanceMap = {},
  dutyMap = {},
  selectedGroupId,
  selectedGroupSubjectId,
  dateStr,
  canEdit = false,
}: AttendanceViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentGroupId, setCurrentGroupId] = useState<string>(selectedGroupId);
  const [currentSubjectId, setCurrentSubjectId] = useState<string>(selectedGroupSubjectId);
  const [currentDateStr, setCurrentDateStr] = useState<string>(dateStr);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [statusFilterTab, setStatusFilterTab] = useState<FilterStatusTab>("ALL");
  const [mainViewTab, setMainViewTab] = useState<"daily" | "stats">("daily");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [focusedStudentIndex, setFocusedStudentIndex] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-scroll student into view on arrow/keyboard navigation
  const studentRowRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll student into view on arrow/keyboard navigation
  useEffect(() => {
    if (focusedStudentIndex !== null && studentRowRefs.current[focusedStudentIndex]) {
      studentRowRefs.current[focusedStudentIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusedStudentIndex]);

  // Reset focus and row refs when filters change
  useEffect(() => {
    setFocusedStudentIndex(null);
    studentRowRefs.current = [];
  }, [searchQuery, statusFilterTab, currentGroupId, currentSubjectId, currentDateStr]);

  // Network connection and offline persistence state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

  // Load offline queue and attach online/offline event listeners
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lms_att_offline_queue");
      if (raw) {
        setOfflineQueue(JSON.parse(raw));
      }
    } catch (err) {
      console.error("Failed to read offline queue from localStorage:", err);
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast.add({ title: "Подключение к сети восстановлено", type: "info" });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.add({
        title: "Связь потеряна. Включен офлайн-режим (сохранение в локалку)",
        type: "warning",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync state when props change
  useEffect(() => {
    setCurrentGroupId(selectedGroupId);
  }, [selectedGroupId]);

  useEffect(() => {
    setCurrentSubjectId(selectedGroupSubjectId);
  }, [selectedGroupSubjectId]);

  useEffect(() => {
    setCurrentDateStr(dateStr);
  }, [dateStr]);

  // Local state for attendance records: key = studentId
  const [records, setRecords] = useState<
    Record<string, { status: AttendanceStatus; comment: string }>
  >(() => {
    const initial: Record<string, { status: AttendanceStatus; comment: string }> = {};
    students.forEach((st) => {
      initial[st.studentId] = {
        status: attendanceMap[st.studentId]?.status || AttendanceStatus.PRESENT,
        comment: attendanceMap[st.studentId]?.comment || "",
      };
    });
    return initial;
  });

  // Check and restore local draft if available for this group+subject+date
  useEffect(() => {
    if (!currentGroupId || !currentSubjectId) return;
    const draftKey = `lms_att_draft_${currentGroupId}_${currentSubjectId}_${currentDateStr}`;
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft) {
        const draftObj = JSON.parse(rawDraft);
        if (draftObj && typeof draftObj === "object" && Object.keys(draftObj).length > 0) {
          let hasDiff = false;
          for (const st of students) {
            const dRec = draftObj[st.studentId];
            const curRec = attendanceMap[st.studentId];
            if (
              dRec &&
              (dRec.status !== (curRec?.status || AttendanceStatus.PRESENT) ||
                dRec.comment !== (curRec?.comment || ""))
            ) {
              hasDiff = true;
              break;
            }
          }
          if (hasDiff) {
            setRecords((prev) => ({ ...prev, ...draftObj }));
            setHasUnsavedChanges(true);
            toast.add({
              title: "Восстановлен локальный черновик (несохранённые данные с устройства)",
              type: "info",
            });
          }
        }
      }
    } catch {}
  }, [currentGroupId, currentSubjectId, currentDateStr, students, attendanceMap]);

  // Auto-save local draft whenever records change and hasUnsavedChanges is true
  useEffect(() => {
    if (!currentSubjectId || !currentGroupId || !hasUnsavedChanges) return;
    const draftKey = `lms_att_draft_${currentGroupId}_${currentSubjectId}_${currentDateStr}`;
    try {
      localStorage.setItem(draftKey, JSON.stringify(records));
    } catch {}
  }, [records, hasUnsavedChanges, currentGroupId, currentSubjectId, currentDateStr]);

  // Track current selected filter keys to avoid overwriting dirty/unsaved records on background re-renders
  const currentKey = `${selectedGroupId}_${selectedGroupSubjectId}_${dateStr}`;
  const prevKeyRef = React.useRef(currentKey);

  useEffect(() => {
    // Only re-initialize records from server props if the group, subject, or date actually changed
    // or if the user does NOT have any unsaved changes
    if (prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;
      const initial: Record<string, { status: AttendanceStatus; comment: string }> = {};
      students.forEach((st) => {
        initial[st.studentId] = {
          status: attendanceMap[st.studentId]?.status || AttendanceStatus.PRESENT,
          comment: attendanceMap[st.studentId]?.comment || "",
        };
      });
      setRecords(initial);
      setHasUnsavedChanges(false);
    } else if (!hasUnsavedChanges) {
      // If props updated while no unsaved changes, sync cleanly
      const initial: Record<string, { status: AttendanceStatus; comment: string }> = {};
      students.forEach((st) => {
        initial[st.studentId] = {
          status: attendanceMap[st.studentId]?.status || AttendanceStatus.PRESENT,
          comment: attendanceMap[st.studentId]?.comment || "",
        };
      });
      setRecords(initial);
    }
  }, [currentKey, attendanceMap, students, hasUnsavedChanges]);

  // Local state for dutyMap to support optimistic auto-replacement
  const [localDutyMap, setLocalDutyMap] = useState<Record<string, { isDuty: boolean; isLeader: boolean }>>(dutyMap);

  useEffect(() => {
    setLocalDutyMap(dutyMap);
  }, [dutyMap]);

  // 1-click auto-replace an absent duty student from attendance
  const handleAutoReplaceDuty = (absentStudentId: string, absentStudentName: string) => {
    if (!currentGroupId) return;

    // Find candidate who is present, not already on duty, not exempt (ЛОВЗ), and not the absent student
    const candidates = students.filter((s) => {
      const rec = records[s.studentId];
      const isAbsent = rec?.status === AttendanceStatus.ABSENT || rec?.status === AttendanceStatus.EXCUSED;
      const isAlreadyDuty = localDutyMap[s.studentId]?.isDuty;
      const isExempt = Boolean(s.isDutyExempt);
      return s.studentId !== absentStudentId && !isAbsent && !isAlreadyDuty && !isExempt;
    });

    if (candidates.length === 0) {
      toast.add({
        title: "Нет доступных присутствующих студентов для замены в группе",
        type: "error",
      });
      return;
    }

    const repStudent = candidates[0];

    // Optimistic local state update (preserves all unsaved attendance records!)
    setLocalDutyMap((prev) => ({
      ...prev,
      [absentStudentId]: { isDuty: false, isLeader: false },
      [repStudent.studentId]: { isDuty: true, isLeader: false },
    }));

    toast.add({
      title: `Дежурный заменен: ${absentStudentName} → ${repStudent.studentName}!`,
      type: "success",
    });

    startTransition(async () => {
      const res = await replaceDutyStudentAction(
        currentGroupId,
        absentStudentId,
        repStudent.studentId,
        currentDateStr
      );
      if (!res.success) {
        setLocalDutyMap(dutyMap);
        toast.add({ title: res.error || "Ошибка при автозамене дежурного", type: "error" });
      }
    });
  };

  // Auto-replace all absent duty students
  const handleAutoReplaceAllDuty = () => {
    absentDutyInAttendance.forEach((st) => {
      handleAutoReplaceDuty(st.studentId, st.studentName);
    });
  };

  const isAdminOrTeacher = userRole === "ADMIN" || userRole === "TEACHER" || canEdit;
  const currentGroupObj = groups.find((g) => g.id === currentGroupId);
  const currentSubjectObj = subjects.find((s) => s.id === currentSubjectId);

  // Safe Timezone-Independent Date Helpers
  const parseYMD = (s: string) => {
    const [y, m, d] = (s || "").split("-").map(Number);
    return { year: y || 2026, month: (m || 1) - 1, day: d || 1 };
  };

  const formatYMD = (year: number, monthIndex: number, day: number) => {
    const dt = new Date(year, monthIndex, day);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = (ymdStr: string) => {
    const { year, month, day } = parseYMD(ymdStr);
    return new Date(year, month, day).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Unsaved changes browser prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Request navigation with unsaved changes interception
  const requestNavigation = (navAction: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navAction);
      setIsDiscardDialogOpen(true);
    } else {
      navAction();
    }
  };

  const shiftDate = (daysDelta: number) => {
    const { year, month, day } = parseYMD(currentDateStr);
    const newDateStr = formatYMD(year, month, day + daysDelta);
    requestNavigation(() => {
      setCurrentDateStr(newDateStr);
      startTransition(() => {
        router.push(
          `/dashboard/attendance?group=${currentGroupId}&subject=${currentSubjectId}&date=${newDateStr}`
        );
      });
    });
  };

  const setDateToToday = () => {
    const now = new Date();
    const newDateStr = formatYMD(now.getFullYear(), now.getMonth(), now.getDate());
    requestNavigation(() => {
      setCurrentDateStr(newDateStr);
      startTransition(() => {
        router.push(
          `/dashboard/attendance?group=${currentGroupId}&subject=${currentSubjectId}&date=${newDateStr}`
        );
      });
    });
  };

  // Update filters with transition
  const handleGroupChange = (val: string) => {
    requestNavigation(() => {
      setCurrentGroupId(val);
      setCurrentSubjectId("");
      startTransition(() => {
        router.push(`/dashboard/attendance?group=${val}&date=${currentDateStr}`);
      });
    });
  };

  const handleSubjectChange = (val: string) => {
    requestNavigation(() => {
      setCurrentSubjectId(val);
      startTransition(() => {
        router.push(
          `/dashboard/attendance?group=${currentGroupId}&subject=${val}&date=${currentDateStr}`
        );
      });
    });
  };

  const handleDateChange = (val: string) => {
    requestNavigation(() => {
      setCurrentDateStr(val);
      startTransition(() => {
        router.push(
          `/dashboard/attendance?group=${currentGroupId}&subject=${currentSubjectId}&date=${val}`
        );
      });
    });
  };

  // Status Change Handler (In-memory ONLY, 0 DB queries)
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
    setHasUnsavedChanges(true);
  };

  // Comment Change Handler (In-memory ONLY, 0 DB queries)
  const handleCommentChange = (studentId: string, comment: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], comment },
    }));
    setHasUnsavedChanges(true);
  };

  // Synchronization function for offline-stored attendance records
  const syncOfflineQueue = useCallback(async () => {
    if (isSyncingOffline) return;
    const raw = localStorage.getItem("lms_att_offline_queue");
    if (!raw) return;

    let queue: OfflineQueueItem[] = [];
    try {
      queue = JSON.parse(raw);
    } catch {
      return;
    }

    if (queue.length === 0) return;

    setIsSyncingOffline(true);
    const remaining: OfflineQueueItem[] = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const res = await saveBatchAttendanceAction(item.subjectId, item.dateStr, item.batchList);
        if (res.success) {
          syncedCount++;
          try {
            localStorage.removeItem(`lms_att_draft_${item.groupId}_${item.subjectId}_${item.dateStr}`);
          } catch {}
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    try {
      localStorage.setItem("lms_att_offline_queue", JSON.stringify(remaining));
    } catch {}
    setOfflineQueue(remaining);
    setIsSyncingOffline(false);

    if (syncedCount > 0) {
      toast.add({
        title: `Синхронизировано в БД: ${syncedCount} ${syncedCount === 1 ? "журнал" : "журналов"}!`,
        type: "success",
      });
      router.refresh();
    }

    if (remaining.length > 0) {
      toast.add({
        title: `Не удалось синхронизировать ${remaining.length} записей. Повторим при стабильной связи.`,
        type: "error",
      });
    }
  }, [isSyncingOffline, router]);

  // Auto-sync offline queue when back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && !isSyncingOffline) {
      syncOfflineQueue();
    }
  }, [isOnline, offlineQueue.length, isSyncingOffline, syncOfflineQueue]);

  // Reset in-memory changes back to server state
  const handleResetChanges = () => {
    const resetMap: Record<string, { status: AttendanceStatus; comment: string }> = {};
    students.forEach((st) => {
      resetMap[st.studentId] = {
        status: attendanceMap[st.studentId]?.status || AttendanceStatus.PRESENT,
        comment: attendanceMap[st.studentId]?.comment || "",
      };
    });
    setRecords(resetMap);
    setHasUnsavedChanges(false);
    try {
      localStorage.removeItem(`lms_att_draft_${currentGroupId}_${currentSubjectId}_${currentDateStr}`);
    } catch {}
    toast.add({ title: "Несохранённые изменения сброшены", type: "info" });
  };

  // Mark All Present (In-memory)
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; comment: string }> = {};
    students.forEach((st) => {
      const comm = records[st.studentId]?.comment || "";
      updated[st.studentId] = { status: AttendanceStatus.PRESENT, comment: comm };
    });
    setRecords(updated);
    setHasUnsavedChanges(true);
  };

  // Single Batch Save to DB or Offline Storage
  const handleSaveAll = useCallback(() => {
    if (!currentSubjectId || students.length === 0) return;

    const batchList = students.map((st) => ({
      studentId: st.studentId,
      status: records[st.studentId]?.status || AttendanceStatus.PRESENT,
      comment: records[st.studentId]?.comment || "",
    }));

    // If offline (navigator.onLine === false or isOnline is false)
    if (!isOnline || (typeof navigator !== "undefined" && !navigator.onLine)) {
      const newItem: OfflineQueueItem = {
        id: `${currentGroupId}_${currentSubjectId}_${currentDateStr}_${Date.now()}`,
        groupId: currentGroupId,
        groupName: currentGroupObj?.name || "Группа",
        subjectId: currentSubjectId,
        subjectName: currentSubjectObj?.subjectName || "Предмет",
        dateStr: currentDateStr,
        batchList,
        savedAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      };

      try {
        const raw = localStorage.getItem("lms_att_offline_queue");
        const existing: OfflineQueueItem[] = raw ? JSON.parse(raw) : [];
        const filtered = existing.filter(
          (it) => !(it.groupId === currentGroupId && it.subjectId === currentSubjectId && it.dateStr === currentDateStr)
        );
        filtered.push(newItem);
        localStorage.setItem("lms_att_offline_queue", JSON.stringify(filtered));
        setOfflineQueue(filtered);
      } catch (err) {
        console.error("Failed to save to offline queue", err);
      }

      setHasUnsavedChanges(false);
      toast.add({
        title: "Сохранено в локалку! Отправится в БД сразу при появлении интернета.",
        type: "success",
      });
      return;
    }

    // If online, save to server with offline fallback
    startTransition(async () => {
      try {
        const res = await saveBatchAttendanceAction(currentSubjectId, currentDateStr, batchList);
        if (res.success) {
          setHasUnsavedChanges(false);
          try {
            localStorage.removeItem(`lms_att_draft_${currentGroupId}_${currentSubjectId}_${currentDateStr}`);
          } catch {}
          toast.add({ title: "Журнал успешно сохранен в базу данных!", type: "success" });
        } else {
          toast.add({ title: res.error || "Ошибка при сохранении журнала", type: "error" });
        }
      } catch {
        // Network threw an exception (offline / unreachable)
        const newItem: OfflineQueueItem = {
          id: `${currentGroupId}_${currentSubjectId}_${currentDateStr}_${Date.now()}`,
          groupId: currentGroupId,
          groupName: currentGroupObj?.name || "Группа",
          subjectId: currentSubjectId,
          subjectName: currentSubjectObj?.subjectName || "Предмет",
          dateStr: currentDateStr,
          batchList,
          savedAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        };

        try {
          const raw = localStorage.getItem("lms_att_offline_queue");
          const existing: OfflineQueueItem[] = raw ? JSON.parse(raw) : [];
          const filtered = existing.filter(
            (it) => !(it.groupId === currentGroupId && it.subjectId === currentSubjectId && it.dateStr === currentDateStr)
          );
          filtered.push(newItem);
          localStorage.setItem("lms_att_offline_queue", JSON.stringify(filtered));
          setOfflineQueue(filtered);
        } catch {}

        setHasUnsavedChanges(false);
        setIsOnline(false);
        toast.add({
          title: "Сбой сети! Данные сохранены в локалку и уйдут в БД при появлении связи.",
          type: "warning",
        });
      }
    });
  }, [currentSubjectId, currentGroupId, currentGroupObj, currentSubjectObj, currentDateStr, students, records, isOnline]);

  // Clear / Annul attendance for this day
  const handleClearAttendance = useCallback(() => {
    if (!currentSubjectId) return;

    startTransition(async () => {
      const res = await clearAttendanceAction(currentSubjectId, currentDateStr);
      if (res.success) {
        const resetMap: Record<string, { status: AttendanceStatus; comment: string }> = {};
        students.forEach((st) => {
          resetMap[st.studentId] = { status: AttendanceStatus.PRESENT, comment: "" };
        });
        setRecords(resetMap);
        setHasUnsavedChanges(false);
        setIsClearDialogOpen(false);
        try {
          localStorage.removeItem(`lms_att_draft_${currentGroupId}_${currentSubjectId}_${currentDateStr}`);
        } catch {}
        toast.add({ title: "Посещаемость за этот день успешно аннулирована", type: "success" });
      } else {
        toast.add({ title: res.error || "Ошибка аннулирования посещаемости", type: "error" });
      }
    });
  }, [currentSubjectId, currentDateStr, currentGroupId, students]);

  const handlePrint = () => window.print();

  const totalStudents = students.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  students.forEach((st) => {
    const stStatus = records[st.studentId]?.status || AttendanceStatus.PRESENT;
    if (stStatus === AttendanceStatus.PRESENT) presentCount++;
    else if (stStatus === AttendanceStatus.ABSENT) absentCount++;
    else if (stStatus === AttendanceStatus.LATE) lateCount++;
    else if (stStatus === AttendanceStatus.EXCUSED) excusedCount++;
  });

  // Filtered Students by Fast Search (Multi-token: name, rollNumber, email) and Status Tab
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    return students.filter((st) => {
      if (tokens.length > 0) {
        const name = (st.studentName || "").toLowerCase();
        const roll = (st.rollNumber || "").toLowerCase();
        const email = (st.email || "").toLowerCase();

        const matchesAllTokens = tokens.every(
          (tok) => name.includes(tok) || roll.includes(tok) || email.includes(tok)
        );
        if (!matchesAllTokens) return false;
      }

      const stStatus = records[st.studentId]?.status || AttendanceStatus.PRESENT;
      if (statusFilterTab === "ALL") return true;
      return stStatus === statusFilterTab;
    });
  }, [students, searchQuery, statusFilterTab, records]);

  // Keyboard shortcuts: Ctrl+S, Fast Search (/ or Ctrl+F/K), and Roll Call mode (1, 2, 3, 4, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Save shortcut Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (hasUnsavedChanges && !isPending) {
          handleSaveAll();
        }
        return;
      }

      const activeTag = document.activeElement?.tagName?.toLowerCase();

      // 2. Fast Search shortcut: / or Ctrl+F / Cmd+F or Ctrl+K
      if (
        (e.key === "/" && activeTag !== "input" && activeTag !== "textarea") ||
        ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "k"))
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Ignore other single key shortcuts if user is typing inside an input/textarea/select
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (filteredStudents.length === 0) return;

      // 3. Navigation: ArrowDown, ArrowUp, J, K
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        setFocusedStudentIndex((prev) => {
          if (prev === null) return 0;
          return Math.min(filteredStudents.length - 1, prev + 1);
        });
      } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFocusedStudentIndex((prev) => {
          if (prev === null) return 0;
          return Math.max(0, prev - 1);
        });
      }

      // 4. Status hotkeys on focused student (editors only)
      if (isAdminOrTeacher && focusedStudentIndex !== null && filteredStudents[focusedStudentIndex]) {
        const targetStudent = filteredStudents[focusedStudentIndex];
        if (e.key === "1") {
          e.preventDefault();
          handleStatusChange(targetStudent.studentId, AttendanceStatus.PRESENT);
        } else if (e.key === "2") {
          e.preventDefault();
          handleStatusChange(targetStudent.studentId, AttendanceStatus.ABSENT);
        } else if (e.key === "3") {
          e.preventDefault();
          handleStatusChange(targetStudent.studentId, AttendanceStatus.LATE);
        } else if (e.key === "4") {
          e.preventDefault();
          handleStatusChange(targetStudent.studentId, AttendanceStatus.EXCUSED);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasUnsavedChanges, isPending, handleSaveAll, isAdminOrTeacher, filteredStudents, focusedStudentIndex]);

  // Calculate number of changed records compared to initial server state
  const changedCount = useMemo(() => {
    let count = 0;
    students.forEach((st) => {
      const rec = records[st.studentId];
      const initialStatus = attendanceMap[st.studentId]?.status || AttendanceStatus.PRESENT;
      const initialComment = attendanceMap[st.studentId]?.comment || "";
      if (rec && (rec.status !== initialStatus || rec.comment !== initialComment)) {
        count++;
      }
    });
    return count;
  }, [students, records, attendanceMap]);

  // Calculate if any students scheduled on duty today are absent/excused
  const absentDutyInAttendance = useMemo(() => {
    return students.filter((st) => {
      const isDuty = localDutyMap[st.studentId]?.isDuty;
      const rec = records[st.studentId];
      return Boolean(
        isDuty &&
          (rec?.status === AttendanceStatus.ABSENT ||
            rec?.status === AttendanceStatus.EXCUSED)
      );
    });
  }, [students, localDutyMap, records]);

  return (
    <div
      className={`flex flex-col gap-2.5 text-xs font-sans md:h-[calc(100dvh-6.5rem)] md:max-h-[calc(100dvh-6.5rem)] md:overflow-hidden ${
        hasUnsavedChanges ? "pb-12 md:pb-0" : "pb-1 md:pb-0"
      }`}
    >
      {/* Printable Sheet for Daily Mode (Hidden on screen, Visible on print only in daily mode) */}
      {mainViewTab === "daily" && (
        <>
          <style jsx global>{`
            @media screen {
              #printable-attendance-sheet,
              .attendance-printable-doc {
                display: none !important;
              }
            }
            @media print {
              @page {
                size: A4 portrait;
                margin: 15mm 15mm 15mm 15mm;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              aside,
              header,
              nav,
              [data-sidebar="sidebar"],
              [data-slot="sidebar"],
              [data-slot="sidebar-gap"],
              [data-slot="sidebar-container"],
              [data-slot="sidebar-rail"],
              [data-slot="sidebar-trigger"],
              .screen-only-view,
              .no-print {
                display: none !important;
              }
              #printable-attendance-sheet,
              .attendance-printable-doc {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
                padding: 4mm 8mm !important;
                margin: 0 auto !important;
                color: #000000 !important;
                background: #ffffff !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              th, td {
                padding: 5px 8px !important;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
            }
          `}</style>
          <div id="printable-attendance-sheet" className="attendance-printable-doc font-sans text-black space-y-3">
            {/* Header */}
            <div className="border-b-2 border-black pb-2 text-center space-y-1">
              <div className="text-[10px] tracking-wider uppercase text-neutral-600 font-semibold">
                Группа: {currentGroupObj?.name || "—"}
              </div>
              <h1 className="text-base font-bold uppercase tracking-wide">
                Журнал учета посещаемости занятий
              </h1>
              <div className="text-xs font-medium text-neutral-800">
                Дисциплина: <strong>{currentSubjectObj?.subjectName || "—"}</strong> • Преподаватель: <strong>{currentSubjectObj?.teacherName || "—"}</strong>
              </div>
              <div className="text-[11px] text-neutral-600">
                Дата занятия: <strong>{formatDisplayDate(currentDateStr)}</strong>
              </div>
            </div>

            {/* Attendance Table */}
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-black text-black">
                  <th className="border border-black p-1.5 text-center w-8 font-bold">№</th>
                  <th className="border border-black p-1.5 text-left font-bold">ФИО Студента</th>
                  <th className="border border-black p-1.5 text-center w-24 font-bold">Статус</th>
                  <th className="border border-black p-1.5 text-left font-bold">Примечание</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st, idx) => {
                  const rec = records[st.studentId] || { status: AttendanceStatus.PRESENT, comment: "" };
                  return (
                    <tr key={st.studentId} className="border-b border-black">
                      <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-black p-1.5 font-medium">{st.studentName}</td>
                      <td className="border border-black p-1.5 text-center font-semibold">
                        {rec.status === AttendanceStatus.PRESENT
                          ? "Был"
                          : rec.status === AttendanceStatus.ABSENT
                          ? "НБ"
                          : rec.status === AttendanceStatus.LATE
                          ? "Опоздал"
                          : "Уваж."}
                      </td>
                      <td className="border border-black p-1.5 text-neutral-700">{rec.comment || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Daily Summary & Signatures */}
            <div className="pt-2 space-y-3 text-xs">
              <div className="flex justify-between items-center font-semibold border-t border-b border-black py-1.5 px-2 bg-neutral-50/50">
                <span>Всего студентов: {filteredStudents.length}</span>
                <span>Присутствуют: {presentCount}</span>
                <span>Пропуски (Н/Б): {absentCount}</span>
                <span>Опоздания: {lateCount}</span>
                <span>Уважительные: {excusedCount}</span>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold shrink-0">Преподаватель:</span>
                  <div className="border-b border-black flex-1 text-center text-xs text-neutral-700 pb-0.5">
                    / {currentSubjectObj?.teacherName || "________________________"} /
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold shrink-0">Староста:</span>
                  <div className="border-b border-black flex-1 text-center text-xs text-neutral-500 pb-0.5">
                    (подпись / расшифровка)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 1. Sleek Top Bar (Title, Connection/Save Status, View Switcher & Action Buttons) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-card p-2 sm:px-3 rounded-xl border shadow-2xs shrink-0">
        {/* Left: Navigation, Title & Status */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            title="Назад"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <UserCheck className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-foreground">
            Журнал посещаемости
          </span>

          {currentGroupObj && (
            <Badge
              variant="outline"
              className="text-[10px] border-primary/30 text-primary bg-primary/5 font-semibold px-1.5 py-0"
            >
              {currentGroupObj.name}
            </Badge>
          )}


          {/* Network Pill Badge (As on screenshot) */}
          {!isOnline ? (
            <Badge
              variant="outline"
              className="rounded-full bg-destructive/10 text-destructive border-destructive/30 text-xs font-normal gap-1.5 px-2.5 py-0.5 flex items-center shrink-0"
              title="Офлайн-режим: изменения сохраняются на устройстве"
            >
              <WifiOff className="h-3 w-3" />
              <span>Офлайн</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="rounded-full bg-primary/10 text-primary border-primary/20 text-xs font-normal gap-1.5 px-2.5 py-0.5 flex items-center shrink-0"
              title="Интернет-соединение активно"
            >
              <Wifi className="h-3 w-3 text-primary" />
              <span>В сети</span>
            </Badge>
          )}

          {/* Unsaved Changes Indicator (Shown only when there are modifications) */}
          {hasUnsavedChanges && (
            <Badge
              variant="outline"
              className="rounded-full bg-primary/10 text-primary border-primary/30 text-xs font-normal px-2.5 py-0.5 flex items-center shrink-0 animate-in fade-in duration-150"
            >
              Не сохранено
            </Badge>
          )}
        </div>

        {/* Right: Quick Actions & View Switcher (Anchored to the Right) */}
        <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
          {mainViewTab === "daily" && (
            <>
              {offlineQueue.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={syncOfflineQueue}
                  disabled={isSyncingOffline || !isOnline}
                  className="h-7 text-xs gap-1 font-medium border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
                  title="Отправить локальные записи в БД"
                >
                  {isSyncingOffline ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CloudUpload className="h-3 w-3" />
                  )}
                  <span>Локалка ({offlineQueue.length})</span>
                </Button>
              )}

              {isAdminOrTeacher && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleMarkAllPresent}
                    disabled={isPending || students.length === 0}
                    className="h-7 text-xs gap-1 font-medium cursor-pointer"
                    title="Отметить всех присутствующими"
                  >
                    <CheckCheck className="h-3 w-3 text-primary" />
                    <span>Все были</span>
                  </Button>

                  <Button
                    type="button"
                    size="xs"
                    onClick={handleSaveAll}
                    disabled={isPending || !hasUnsavedChanges || students.length === 0}
                    className={`h-7 text-xs gap-1 font-medium transition-all px-2.5 ${
                      hasUnsavedChanges
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer border border-primary"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-not-allowed opacity-70 border border-transparent"
                    }`}
                    title={
                      !isOnline
                        ? "Сохранить в локальное хранилище устройства"
                        : "Сохранить изменения в базу данных (Ctrl+S)"
                    }
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Сохранение...</span>
                      </>
                    ) : !isOnline ? (
                      <>
                        <HardDrive className="h-3 w-3" />
                        <span>В локалку</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3" />
                        <span>Сохранить</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setIsClearDialogOpen(true)}
                    disabled={isPending || students.length === 0}
                    className="h-7 text-xs gap-1 font-medium text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 cursor-pointer"
                    title="Аннулировать отметки за этот день"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden sm:inline">Сброс</span>
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handlePrint}
                className="h-7 text-xs gap-1 font-medium cursor-pointer"
                title="Печать журнала"
              >
                <Printer className="h-3 w-3" />
                <span className="hidden sm:inline">Печать</span>
              </Button>
            </>
          )}

          {/* View Mode Switcher (Always on the far right) */}
          <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border text-xs shrink-0">
            <button
              type="button"
              onClick={() => setMainViewTab("daily")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer text-xs ${
                mainViewTab === "daily"
                  ? "bg-background text-primary border border-border shadow-2xs"
                  : "border border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="h-3 w-3" />
              <span>День</span>
            </button>
            <button
              type="button"
              onClick={() => setMainViewTab("stats")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer text-xs ${
                mainViewTab === "stats"
                  ? "bg-background text-primary border border-border shadow-2xs"
                  : "border border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Статистика</span>
            </button>
          </div>
        </div>
      </div>

      {mainViewTab === "stats" ? (
        <AttendanceStatsView
          groups={groups}
          subjects={subjects}
          selectedGroupId={currentGroupId}
          onGroupChange={handleGroupChange}
        />
      ) : (
        <>
        {/* Offline Persistent Cache Alert Banner */}
        {(!isOnline || offlineQueue.length > 0) && (
          <div className="print:hidden p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {!isOnline ? (
                <div className="h-6 w-6 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <WifiOff className="h-3.5 w-3.5" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <HardDrive className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="leading-tight space-y-0.5 min-w-0">
                <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                  {!isOnline ? "Офлайн-режим активен (сохранение в локалку)" : "Есть неотправленные локальные журналы"}
                  {offlineQueue.length > 0 && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/30">
                      {offlineQueue.length}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {!isOnline
                    ? "Интернет временно недоступен. Отмечайте присутствие как обычно — кнопка «В локалку» сохранит журнал, а при появлении сети данные уйдут в БД."
                    : "На этом устройстве есть сохранённые журналы. Нажмите «Синхронизировать», чтобы отправить их в БД."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {offlineQueue.length > 0 && isOnline && (
                <Button
                  type="button"
                  size="xs"
                  onClick={syncOfflineQueue}
                  disabled={isSyncingOffline}
                  className="h-6 text-xs px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-1.5 cursor-pointer shadow-2xs border border-primary"
                >
                  {isSyncingOffline ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CloudUpload className="h-3 w-3" />
                  )}
                  <span>Синхронизировать</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Absent Duty Alerts Banner in Attendance */}
      {absentDutyInAttendance.length > 0 && (
        <div className="print:hidden p-2.5 sm:p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <span className="leading-snug">
              <strong>Внимание:</strong> {absentDutyInAttendance.length === 1 ? "Студент" : "Студенты"}{" "}
              <strong>{absentDutyInAttendance.map((s) => s.studentName).join(", ")}</strong> назначен(ы) дежурным(и), но отсутствует(ют).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdminOrTeacher && (
              <Button
                type="button"
                size="xs"
                variant="default"
                disabled={isPending}
                onClick={() => {
                  if (absentDutyInAttendance.length === 1) {
                    handleAutoReplaceDuty(absentDutyInAttendance[0].studentId, absentDutyInAttendance[0].studentName);
                  } else {
                    handleAutoReplaceAllDuty();
                  }
                }}
                className="h-6 text-xs px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-1 shadow-2xs cursor-pointer border border-primary"
                title="Автоматически заменить на первого присутствующего студента в группе"
              >
                <Zap className="h-3 w-3" />
                {absentDutyInAttendance.length === 1 ? "Автозамена" : `Заменить всех (${absentDutyInAttendance.length})`}
              </Button>
            )}
            {currentGroupId && (
              <Link
                href={`/dashboard/duty?group=${currentGroupId}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline px-1.5 py-0.5"
              >
                В график ↗
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 2. Unified Controls Bar: Group + Subject + Date Navigator + Fast Search in ONE ROW */}
      <div className="print:hidden bg-card p-2 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center gap-2 shadow-2xs shrink-0" data-tour="attendance-filters">
        {/* Group Selector */}
        <div className="w-full md:w-44 shrink-0">
          <Select value={currentGroupId} onValueChange={handleGroupChange} disabled={isPending}>
            <SelectTrigger className="h-8 text-xs font-medium bg-background w-full">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <SelectValue>{currentGroupObj?.name ? `Группа ${currentGroupObj.name}` : "Группа"}</SelectValue>
              </div>
              {isPending && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto shrink-0" />}
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">Группа {g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fast Search Student Box (In the Center) */}
        <div className="w-full md:flex-1 min-w-[200px] relative flex items-center">
          <Search className="h-3.5 w-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            placeholder="Поиск (ФИО, №, email)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
                (e.target as HTMLElement).blur();
              }
            }}
            className="h-8 text-xs pl-8 pr-12 bg-background border-border w-full"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {searchQuery ? (
              <>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {filteredStudents.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted cursor-pointer"
                  title="Очистить (Esc)"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <kbd
                className="hidden sm:inline-flex items-center text-[9px] font-mono text-muted-foreground bg-muted/70 px-1 py-0.5 rounded border border-border cursor-pointer"
                title="Быстрый поиск (/ или Ctrl+F)"
                onClick={() => searchInputRef.current?.focus()}
              >
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Subject Selector */}
        <div className="w-full md:w-56 lg:w-64 shrink-0">
          <Select value={currentSubjectId} onValueChange={handleSubjectChange} disabled={isPending}>
            <SelectTrigger className="h-8 text-xs font-medium bg-background w-full">
              <div className="flex items-center gap-1.5 truncate">
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <SelectValue>
                  {currentSubjectObj ? `${currentSubjectObj.subjectName} (${currentSubjectObj.teacherName})` : "Выберите предмет"}
                </SelectValue>
              </div>
              {isPending && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto shrink-0" />}
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">{s.subjectName} ({s.teacherName})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selector with Next/Prev Day */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => shiftDate(-1)}
            disabled={isPending}
            className="h-8 w-7 p-0 shrink-0 cursor-pointer"
            title="Предыдущий день"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Input
            type="date"
            value={currentDateStr}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={isPending}
            className="h-8 text-xs bg-background font-medium w-32 min-w-[120px] text-center px-1"
          />
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => shiftDate(1)}
            disabled={isPending}
            className="h-8 w-7 p-0 shrink-0 cursor-pointer"
            title="Следующий день"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={setDateToToday}
            disabled={isPending}
            className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
          >
            Сегодня
          </Button>
        </div>
      </div>

      {/* Attendance Table with Status Tabs */}
      <Card
        className="relative print:hidden p-0 border overflow-hidden gap-0 [--card-spacing:0] md:flex-1 md:min-h-0 flex flex-col"
        data-tour="attendance-table"
      >
        {/* Loading Overlay */}
        {isPending && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-[1px] transition-all">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border shadow-xs text-xs text-foreground font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Загрузка данных...</span>
            </div>
          </div>
        )}

        {/* Status Filter Tabs & Hotkeys in Table Header */}
        <div className="p-2 border-b bg-card flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilterTab("ALL")}
              className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilterTab === "ALL"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Все ({totalStudents})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilterTab(AttendanceStatus.PRESENT)}
              className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilterTab === AttendanceStatus.PRESENT
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Присутствуют ({presentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilterTab(AttendanceStatus.ABSENT)}
              className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilterTab === AttendanceStatus.ABSENT
                  ? "bg-destructive text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Отсутствуют ({absentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilterTab(AttendanceStatus.LATE)}
              className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilterTab === AttendanceStatus.LATE
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Опоздали ({lateCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilterTab(AttendanceStatus.EXCUSED)}
              className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilterTab === AttendanceStatus.EXCUSED
                  ? "bg-sky-500 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Уважительные ({excusedCount})
            </button>
          </div>

          {/* Clean hotkey helper on the right */}
          {isAdminOrTeacher && (
            <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0 pr-1 select-none">
              <Keyboard className="h-3 w-3 text-primary/70" />
              <span>
                <kbd className="px-1 py-0.2 rounded bg-background border font-mono">↑/↓</kbd> выбор
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1 py-0.2 rounded bg-background border font-mono">1</kbd> Был
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1 py-0.2 rounded bg-background border font-mono">2</kbd> НБ
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1 py-0.2 rounded bg-background border font-mono">3</kbd> Опоздал
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1 py-0.2 rounded bg-background border font-mono">4</kbd> Уваж.
              </span>
              <span>•</span>
              <span>
                <kbd className="px-1 py-0.2 rounded bg-background border font-mono">Ctrl+S</kbd> Сохранить
              </span>
            </div>
          )}
        </div>

        {/* Desktop Table Header */}
        <div className="hidden md:grid md:grid-cols-[36px_1fr_auto_240px] lg:grid-cols-[40px_1fr_auto_280px] items-center gap-3 px-3.5 py-2 bg-muted/50 border-b text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
          <span className="text-center">№</span>
          <span>Студент</span>
          <span className="text-center">Статус</span>
          <span>Примечание</span>
        </div>

        {/* Students Container */}
        <CardContent className="p-0 md:flex-1 md:min-h-0 md:overflow-y-auto overscroll-contain">
          <div className={`divide-y text-xs ${hasUnsavedChanges ? "pb-14 md:pb-16" : ""}`}>
            {filteredStudents.map((st, idx) => {
              const rec = records[st.studentId] || { status: AttendanceStatus.PRESENT, comment: "" };
              const dutyInfo = localDutyMap[st.studentId];
              const isAbsentDuty = Boolean(
                dutyInfo &&
                  (rec.status === AttendanceStatus.ABSENT ||
                    rec.status === AttendanceStatus.EXCUSED)
              );

              const borderAccentColor =
                rec.status === AttendanceStatus.ABSENT
                  ? "border-l border-l-destructive bg-destructive/5"
                  : rec.status === AttendanceStatus.LATE
                  ? "border-l border-l-amber-500 bg-amber-500/5"
                  : rec.status === AttendanceStatus.EXCUSED
                  ? "border-l border-l-sky-500 bg-sky-500/5"
                  : "border-l border-l-border hover:bg-muted/20";

              const isFocused = focusedStudentIndex === idx;

              return (
                <div
                  key={st.studentId}
                  ref={(el) => {
                    studentRowRefs.current[idx] = el;
                  }}
                  onClick={() => setFocusedStudentIndex(idx)}
                  className={`transition-all outline-none ${borderAccentColor} ${
                    isFocused ? "bg-primary/10 border-l-primary" : ""
                  }`}
                >
                  {/* DESKTOP ROW (md and up) */}
                  <div className="hidden md:grid md:grid-cols-[36px_1fr_auto_240px] lg:grid-cols-[40px_1fr_auto_280px] items-center gap-3 px-3.5 py-2">
                    <span className="text-center text-[11px] font-mono text-muted-foreground">{idx + 1}</span>
                    <div className="flex items-center gap-2 font-medium min-w-0 flex-wrap">
                      <Avatar className="h-6 w-6 border text-[10px] shrink-0">
                        <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                          {st.studentName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-foreground text-xs">{st.studentName}</span>
                      {st.rollNumber && (
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 px-1.5 h-3.5 font-mono text-muted-foreground border-border shrink-0"
                          title={`Номер в журнале: ${st.rollNumber}`}
                        >
                          №{st.rollNumber}
                        </Badge>
                      )}
                      {st.isMonitor && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 h-3.5 gap-0.5 border-primary/30 text-primary font-medium shrink-0">
                          <Crown className="h-2.5 w-2.5" /> Староста
                        </Badge>
                      )}
                      {st.isDeputyMonitor && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 h-3.5 gap-0.5 border-primary/30 text-primary font-medium shrink-0">
                          <ShieldCheck className="h-2.5 w-2.5" /> Зам. старосты
                        </Badge>
                      )}
                      {st.isDutyExempt && (
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 px-1.5 h-3.5 gap-0.5 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium shrink-0"
                          title="Освобожден(а) от дежурств (статус ЛОВЗ)"
                        >
                          <Accessibility className="h-2.5 w-2.5" /> ЛОВЗ
                        </Badge>
                      )}
                      {dutyInfo && (
                        <Badge
                          variant="outline"
                          className={`text-[9px] py-0 px-1.5 h-3.5 gap-0.5 font-medium shrink-0 ${
                            isAbsentDuty
                              ? "border-destructive/40 bg-destructive/10 text-destructive"
                              : "border-primary/40 bg-primary/10 text-primary"
                          }`}
                          title={dutyInfo.isLeader ? "Ответственный / старший дежурный на сегодня" : "Дежурный на сегодня"}
                        >
                          <Clock className="h-2.5 w-2.5" />
                          {dutyInfo.isLeader ? "Старший дежурный" : "Дежурный"}
                        </Badge>
                      )}
                      {isAbsentDuty && (
                        <span className="text-[10px] text-destructive font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>Дежурит сегодня!</span>
                          {isAdminOrTeacher && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoReplaceDuty(st.studentId, st.studentName);
                              }}
                              className="text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer ml-0.5"
                              title="Автоматически заменить дежурного"
                            >
                              <Zap className="h-2.5 w-2.5" /> Заменить
                            </button>
                          )}
                        </span>
                      )}
                    </div>

                    {isAdminOrTeacher ? (
                      <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-muted/60 rounded-lg border text-xs shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.PRESENT)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                            rec.status === AttendanceStatus.PRESENT
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Присутствует"
                        >
                          Был
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.ABSENT)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                            rec.status === AttendanceStatus.ABSENT
                              ? "bg-destructive text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Отсутствует (НБ)"
                        >
                          НБ
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.LATE)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                            rec.status === AttendanceStatus.LATE
                              ? "bg-amber-500 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Опоздал"
                        >
                          Опоздал
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.EXCUSED)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                            rec.status === AttendanceStatus.EXCUSED
                              ? "bg-sky-500 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Уважительная причина (отпросился, справка, заявление)"
                        >
                          Уваж.
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-medium ${
                            rec.status === AttendanceStatus.PRESENT
                              ? "bg-primary/10 text-primary border-primary/20"
                              : rec.status === AttendanceStatus.ABSENT
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : rec.status === AttendanceStatus.LATE
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                          }`}
                        >
                          {rec.status === "PRESENT"
                            ? "Присутствует"
                            : rec.status === "ABSENT"
                            ? "Отсутствует (НБ)"
                            : rec.status === "LATE"
                            ? "Опоздал"
                            : rec.comment
                            ? `Уваж. (${rec.comment})`
                            : "Уважительная"}
                        </Badge>
                      </div>
                    )}

                    <div>
                      {isAdminOrTeacher ? (
                        <div className="space-y-1">
                          <Input
                            placeholder="Примечание..."
                            value={rec.comment}
                            onChange={(e) => handleCommentChange(st.studentId, e.target.value)}
                            className="h-7 text-xs bg-background"
                          />
                          {rec.status === AttendanceStatus.EXCUSED && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {(["Отпросился", "Справка", "По семейным", "Мероприятие"] as const).map((reason) => {
                                const isSelected = rec.comment?.trim() === reason;
                                return (
                                  <button
                                    key={reason}
                                    type="button"
                                    onClick={() => handleCommentChange(st.studentId, isSelected ? "" : reason)}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer font-medium ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                                    }`}
                                    title={`Указать: ${reason}`}
                                  >
                                    {reason}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground truncate block">
                          {rec.comment || "—"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* MOBILE CARD VIEW (< md) */}
                  <div className="md:hidden p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[11px] font-mono text-muted-foreground shrink-0 w-4 text-center">{idx + 1}</span>
                        <Avatar className="h-7 w-7 border shrink-0">
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            {st.studentName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground text-xs leading-snug break-words">
                              {st.studentName}
                            </span>
                            {st.rollNumber && (
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 px-1.5 h-3.5 font-mono text-muted-foreground border-border shrink-0"
                              >
                                №{st.rollNumber}
                              </Badge>
                            )}
                            {st.isMonitor && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 h-3.5 gap-0.5 border-primary/30 text-primary font-medium shrink-0">
                                <Crown className="h-2.5 w-2.5" /> Староста
                              </Badge>
                            )}
                            {st.isDeputyMonitor && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 h-3.5 gap-0.5 border-primary/30 text-primary font-medium shrink-0">
                                <ShieldCheck className="h-2.5 w-2.5" /> Зам. старосты
                              </Badge>
                            )}
                            {st.isDutyExempt && (
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 px-1.5 h-3.5 gap-0.5 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium shrink-0"
                                title="Освобожден(а) от дежурств (статус ЛОВЗ)"
                              >
                                <Accessibility className="h-2.5 w-2.5" /> ЛОВЗ
                              </Badge>
                            )}
                            {dutyInfo && (
                              <Badge
                                variant="outline"
                                className={`text-[9px] py-0 px-1.5 h-3.5 gap-0.5 font-medium shrink-0 ${
                                  isAbsentDuty
                                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                                    : "border-primary/40 bg-primary/10 text-primary"
                                }`}
                              >
                                <Clock className="h-2.5 w-2.5" />
                                {dutyInfo.isLeader ? "Старший дежурный" : "Дежурный"}
                              </Badge>
                            )}
                          </div>
                          {isAbsentDuty && (
                            <div className="text-[10px] text-destructive font-semibold flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                Назначен дежурным!
                              </span>
                              {isAdminOrTeacher && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAutoReplaceDuty(st.studentId, st.studentName);
                                  }}
                                  className="text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                                  title="Автоматически заменить дежурного"
                                >
                                  <Zap className="h-2.5 w-2.5" /> Заменить
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isAdminOrTeacher && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium shrink-0 ${
                            rec.status === AttendanceStatus.PRESENT
                              ? "bg-primary/10 text-primary border-primary/20"
                              : rec.status === AttendanceStatus.ABSENT
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : rec.status === AttendanceStatus.LATE
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                          }`}
                        >
                          {rec.status === "PRESENT"
                            ? "Присутствует"
                            : rec.status === "ABSENT"
                            ? "Отсутствует (НБ)"
                            : rec.status === "LATE"
                            ? "Опоздал"
                            : rec.comment
                            ? `Уваж. (${rec.comment})`
                            : "Уважительная"}
                        </Badge>
                      )}
                    </div>

                    {isAdminOrTeacher && (
                      <div className="grid grid-cols-4 gap-1 p-1 bg-muted/60 rounded-lg border text-xs">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.PRESENT)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors text-center cursor-pointer ${
                            rec.status === AttendanceStatus.PRESENT
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          Был
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.ABSENT)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors text-center cursor-pointer ${
                            rec.status === AttendanceStatus.ABSENT
                              ? "bg-destructive text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          НБ
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.LATE)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors text-center cursor-pointer ${
                            rec.status === AttendanceStatus.LATE
                              ? "bg-amber-500 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          Опоздал
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(st.studentId, AttendanceStatus.EXCUSED)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors text-center cursor-pointer ${
                            rec.status === AttendanceStatus.EXCUSED
                              ? "bg-sky-500 text-white shadow-2xs"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title="Уважительная причина (отпросился, справка, заявление)"
                        >
                          Уваж.
                        </button>
                      </div>
                    )}

                    {isAdminOrTeacher ? (
                      <div className="space-y-1.5">
                        <Input
                          placeholder="Примечание (причина, комментарий...)"
                          value={rec.comment}
                          onChange={(e) => handleCommentChange(st.studentId, e.target.value)}
                          className="h-8 text-xs bg-background w-full"
                        />
                        {rec.status === AttendanceStatus.EXCUSED && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(["Отпросился", "Справка", "По семейным", "Мероприятие"] as const).map((reason) => {
                              const isSelected = rec.comment?.trim() === reason;
                              return (
                                <button
                                  key={reason}
                                  type="button"
                                  onClick={() => handleCommentChange(st.studentId, isSelected ? "" : reason)}
                                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer font-medium ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                                  }`}
                                  title={`Указать: ${reason}`}
                                >
                                  {reason}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      rec.comment && (
                        <div className="text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded border">
                          Примечание: {rec.comment}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2.5 px-4">
                <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground border">
                  <Search className="h-4 w-4" />
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {searchQuery ? `По запросу «${searchQuery}» никто не найден` : "Учащиеся не найдены"}
                </div>
                <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                  {searchQuery
                    ? "Проверьте правильность написания ФИО, номера студента или email. Также проверьте выбранный фильтр статуса."
                    : "В выбранной группе отсутствуют студенты на эту дату."}
                </p>
                {searchQuery && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="h-7 text-xs px-2.5 mt-1 border-border font-medium cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Сбросить поиск
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Floating Bottom Sticky Action Bar */}
      {isAdminOrTeacher && mainViewTab === "daily" && hasUnsavedChanges && (
        <div className="print:hidden fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-[calc(100vw-1.5rem)] w-max">
          <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-card/95 backdrop-blur-md border border-primary/30 shadow-xl rounded-full text-xs">
            <div className="flex items-center gap-1.5 pl-0.5 sm:pl-1 text-foreground font-medium pr-0.5 sm:pr-1 whitespace-nowrap">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="hidden sm:inline text-xs">
                {changedCount > 0 ? `Изменено учащихся: ${changedCount}` : "Есть несохранённые изменения"}
              </span>
              <span className="sm:hidden text-[11px]">
                {changedCount > 0 ? `Правки: ${changedCount}` : "Не сохранено"}
              </span>
            </div>

            <div className="h-3.5 sm:h-4 w-px bg-border shrink-0" />

            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleResetChanges}
              disabled={isPending}
              className="h-6 sm:h-7 px-2 sm:px-2.5 text-[11px] sm:text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full cursor-pointer shrink-0"
              title="Сбросить все несохранённые изменения"
            >
              <RotateCcw className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Сбросить</span>
            </Button>

            <Button
              type="button"
              size="xs"
              onClick={handleSaveAll}
              disabled={isPending}
              className="h-6 sm:h-7 px-2.5 sm:px-3 text-[11px] sm:text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full shadow-2xs gap-1 sm:gap-1.5 cursor-pointer border border-primary shrink-0 whitespace-nowrap"
              title={!isOnline ? "Сохранить в локалку" : "Сохранить в базу данных (Ctrl+S)"}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : !isOnline ? (
                <>
                  <HardDrive className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>В локалку</span>
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Сохранить</span>
                  <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] font-sans font-medium rounded bg-primary-foreground/20 text-primary-foreground">
                    Ctrl+S
                  </kbd>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      </>
      )}

      {/* Annulment Confirmation Modal */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px]">
          <AlertDialogHeader className="text-left place-items-start gap-1">
            <AlertDialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Аннулировать посещаемость?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Вы действительно хотите удалить все отметки посещаемости группы{" "}
              <strong className="text-foreground">{currentGroupObj?.name || ""}</strong> по предмету{" "}
              <strong className="text-foreground">{currentSubjectObj?.subjectName || ""}</strong> за дату{" "}
              <strong className="text-foreground">
                {formatDisplayDate(currentDateStr)}
              </strong>
              ? Это действие удалит сохраненные записи из базы данных.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsClearDialogOpen(false)}
              disabled={isPending}
              className="h-7 px-3 text-xs"
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="xs"
              onClick={handleClearAttendance}
              disabled={isPending}
              className="h-7 px-3 text-xs"
            >
              {isPending ? "Аннулирование..." : "Аннулировать"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Unsaved Changes Modal */}
      <AlertDialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <AlertDialogContent className="p-4 gap-3 text-xs sm:max-w-[400px] place-items-start text-left">
          <AlertDialogHeader className="text-left gap-1">
            <AlertDialogTitle className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <AlertTriangle className="h-4 w-4 text-primary" /> Несохранённые изменения
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              У вас есть несохраненные отметки посещаемости. Если вы перейдете сейчас без сохранения, изменения будут утеряны.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => {
                setIsDiscardDialogOpen(false);
                setPendingNavigation(null);
              }}
              className="h-7 px-2.5 text-xs"
            >
              Остаться
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => {
                setIsDiscardDialogOpen(false);
                setHasUnsavedChanges(false);
                if (pendingNavigation) {
                  pendingNavigation();
                  setPendingNavigation(null);
                }
              }}
              className="h-7 px-2.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Сбросить
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => {
                handleSaveAll();
                setIsDiscardDialogOpen(false);
                if (pendingNavigation) {
                  pendingNavigation();
                  setPendingNavigation(null);
                }
              }}
              className="h-7 px-2.5 text-xs font-medium"
            >
              Сохранить и перейти
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
