"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  MapPin,
  ChevronRight,
  LayoutGrid,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Search,
  Check,
  CheckCircle2,
  UploadCloud,
  X,
  BookOpen,
  Clock,
  User,
  Sparkles,
} from "lucide-react";

export interface LessonSlot {
  id: string;
  pairNumber: number;
  time: string;
  subject: string;
  room: string;
  teacher?: string;
  note?: string;
  isSpecialEvent?: boolean;
}

export interface DaySchedule {
  dateStr: string;
  dayOfWeek: string;
  fullDateRu: string;
  holidayNote?: string;
  lessons: LessonSlot[];
}

export interface GroupScheduleData {
  groupId: string;
  groupName: string;
  course: number;
  specialty: string;
  curator: string;
  shift: string;
  days: DaySchedule[];
}

export type ShiftType = "1-я смена" | "2-я смена";

// Helper to calculate pair time slots dynamically given a start time string like "14:20" or "08:00"
// Standard lyceum/college rule: 80 min lesson + 10 min break
export function calculatePairSlotsFromStart(
  startTimeStr: string,
  pairDurationMin: number = 80,
  breakDurationMin: number = 10,
  totalPairs: number = 6
): Record<number, string> {
  const match = startTimeStr.match(/(\d{1,2})[:.](\d{2})/);
  let startMinutes = 8 * 60; // fallback 08:00
  if (match) {
    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    startMinutes = hours * 60 + mins;
  }

  const result: Record<number, string> = {};
  let currentStart = startMinutes;

  for (let i = 1; i <= totalPairs; i++) {
    const currentEnd = currentStart + pairDurationMin;
    const startH = Math.floor(currentStart / 60) % 24;
    const startM = currentStart % 60;
    const endH = Math.floor(currentEnd / 60) % 24;
    const endM = currentEnd % 60;

    const format = (h: number, m: number) =>
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

    result[i] = `${format(startH, startM)} – ${format(endH, endM)}`;
    currentStart = currentEnd + breakDurationMin;
  }

  return result;
}

export const SHIFT_DEFAULT_START: Record<ShiftType, string> = {
  "1-я смена": "08:00",
  "2-я смена": "14:20",
};

export const SHIFT_PRESET_STARTS: Record<ShiftType, string[]> = {
  "1-я смена": ["08:00", "08:30"],
  "2-я смена": ["14:20", "13:00", "13:30"],
};

export const normalizeShiftType = (shift?: string): ShiftType => {
  if (shift && shift.includes("2-я")) return "2-я смена";
  return "1-я смена";
};

export const extractShiftStartTime = (shift?: string): string => {
  if (!shift) return "08:00";
  const match = shift.match(/(\d{1,2}[:.]\d{2})/);
  if (match) return match[1].replace(".", ":");
  return shift.includes("2-я") ? "14:20" : "08:00";
};

export const getTimeSlotForShift = (shift: string, pairNum: number): string => {
  const startTime = extractShiftStartTime(shift);
  const slots = calculatePairSlotsFromStart(startTime);
  return slots[pairNum] || "08:00 – 09:20";
};

const INITIAL_SCHEDULE_DATA: GroupScheduleData[] = [
  {
    groupId: "vr-1-26",
    groupName: "ВР-1-26",
    course: 1,
    specialty: "Веб-разработка",
    curator: "Асанова Г. К.",
    shift: "1-я смена (08:00)",
    days: [
      {
        dateStr: "21.09.26",
        dayOfWeek: "Понедельник",
        fullDateRu: "21 сентября 2026",
        lessons: [
          { id: "l-vr1-1-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
          { id: "l-vr1-1-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Русский язык", room: "каб. 204", teacher: "Смирнова Е. В." },
          { id: "l-vr1-1-3", pairNumber: 3, time: "11:00 – 12:20", subject: "Биология", room: "каб. 108", teacher: "Жукова М. А." },
        ],
      },
      {
        dateStr: "22.09.26",
        dayOfWeek: "Вторник",
        fullDateRu: "22 сентября 2026",
        lessons: [
          { id: "l-vr1-2-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Английский язык", room: "каб. 302", teacher: "Исаева Н. М." },
          { id: "l-vr1-2-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Русский язык", room: "каб. 204", teacher: "Смирнова Е. В." },
          { id: "l-vr1-2-3", pairNumber: 3, time: "11:00 – 12:20", subject: "Русский язык", room: "каб. 204", teacher: "Смирнова Е. В." },
        ],
      },
      {
        dateStr: "23.09.26",
        dayOfWeek: "Среда",
        fullDateRu: "23 сентября 2026",
        holidayNote: "Кыргыз Республикасынын Мамлекеттик тил күнү",
        lessons: [
          { id: "l-vr1-3-1", pairNumber: 1, time: "08:00 – 09:20", subject: "История", room: "каб. 105", teacher: "Бекбоев А. Т." },
          { id: "l-vr1-3-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
          { id: "l-vr1-3-3", pairNumber: 3, time: "11:00 – 12:20", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
        ],
      },
      {
        dateStr: "24.09.26",
        dayOfWeek: "Четверг",
        fullDateRu: "24 сентября 2026",
        lessons: [
          { id: "l-vr1-4-1", pairNumber: 1, time: "08:00 – 09:20", subject: "История", room: "каб. 105", teacher: "Бекбоев А. Т." },
          { id: "l-vr1-4-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
          {
            id: "l-vr1-4-3",
            pairNumber: 3,
            time: "11:00 – 12:20",
            subject: "Основы программирования",
            room: "Актовый зал",
            teacher: "Ташиев Б. К.",
            note: "Гостевая лекция — работа в Японии",
            isSpecialEvent: true,
          },
        ],
      },
      {
        dateStr: "25.09.26",
        dayOfWeek: "Пятница",
        fullDateRu: "25 сентября 2026",
        lessons: [
          { id: "l-vr1-5-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Геометрия", room: "каб. 208", teacher: "Алиев Р. Т." },
          { id: "l-vr1-5-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Охрана труда", room: "каб. 102", teacher: "Кузнецов В. С." },
          { id: "l-vr1-5-3", pairNumber: 3, time: "11:00 – 12:20", subject: "Физика", room: "каб. 305", teacher: "Петров С. И." },
        ],
      },
      {
        dateStr: "26.09.26",
        dayOfWeek: "Суббота",
        fullDateRu: "26 сентября 2026",
        lessons: [
          { id: "l-vr1-6-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Охрана труда", room: "каб. 102", teacher: "Кузнецов В. С." },
          { id: "l-vr1-6-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
          { id: "l-vr1-6-3", pairNumber: 3, time: "11:00 – 12:20", subject: "География", room: "каб. 210", teacher: "Мамбетова Д. А." },
        ],
      },
    ],
  },
  {
    groupId: "vr-2-26",
    groupName: "ВР-2-26",
    course: 1,
    specialty: "Веб-разработка",
    curator: "Иванов Д. А.",
    shift: "1-я смена (08:00)",
    days: [
      {
        dateStr: "21.09.26",
        dayOfWeek: "Понедельник",
        fullDateRu: "21 сентября 2026",
        lessons: [
          { id: "l-vr2-1-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Русская литература", room: "каб. 204", teacher: "Смирнова Е. В." },
          { id: "l-vr2-1-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Физическая культура", room: "Спортзал", teacher: "Кадыров Э. Т." },
          { id: "l-vr2-1-3", pairNumber: 3, time: "11:00 – 12:20", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
        ],
      },
      {
        dateStr: "22.09.26",
        dayOfWeek: "Вторник",
        fullDateRu: "22 сентября 2026",
        lessons: [
          { id: "l-vr2-2-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Основы программирования", room: "Лаб. 3", teacher: "Ташиев Б. К." },
          { id: "l-vr2-2-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Основы программирования", room: "Лаб. 3", teacher: "Ташиев Б. К." },
          { id: "l-vr2-2-3", pairNumber: 3, time: "11:00 – 12:20", subject: "Основы программирования", room: "Лаб. 3", teacher: "Ташиев Б. К." },
        ],
      },
      {
        dateStr: "23.09.26",
        dayOfWeek: "Среда",
        fullDateRu: "23 сентября 2026",
        holidayNote: "Кыргыз Республикасынын Мамлекеттик тил күнү",
        lessons: [
          { id: "l-vr2-3-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Физика", room: "каб. 305", teacher: "Петров С. И." },
          { id: "l-vr2-3-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
          { id: "l-vr2-3-3", pairNumber: 3, time: "11:00 – 12:20", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
        ],
      },
      {
        dateStr: "24.09.26",
        dayOfWeek: "Четверг",
        fullDateRu: "24 сентября 2026",
        lessons: [
          { id: "l-vr2-4-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Геометрия", room: "каб. 208", teacher: "Алиев Р. Т." },
          { id: "l-vr2-4-2", pairNumber: 2, time: "09:30 – 10:50", subject: "История", room: "каб. 105", teacher: "Бекбоев А. Т." },
          {
            id: "l-vr2-4-3",
            pairNumber: 3,
            time: "11:00 – 12:20",
            subject: "Основы программирования",
            room: "Актовый зал",
            teacher: "Ташиев Б. К.",
            note: "Гостевая лекция — работа в Японии",
            isSpecialEvent: true,
          },
        ],
      },
      {
        dateStr: "25.09.26",
        dayOfWeek: "Пятница",
        fullDateRu: "25 сентября 2026",
        lessons: [
          { id: "l-vr2-5-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Охрана труда", room: "каб. 102", teacher: "Кузнецов В. С." },
          { id: "l-vr2-5-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Русский язык", room: "каб. 204", teacher: "Смирнова Е. В." },
          { id: "l-vr2-5-3", pairNumber: 3, time: "11:00 – 12:20", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
        ],
      },
      {
        dateStr: "26.09.26",
        dayOfWeek: "Суббота",
        fullDateRu: "26 сентября 2026",
        lessons: [
          { id: "l-vr2-6-1", pairNumber: 1, time: "08:00 – 09:20", subject: "Производственное обучение (П/О)", room: "Мастерская 1", teacher: "Кузнецов В. С." },
          { id: "l-vr2-6-2", pairNumber: 2, time: "09:30 – 10:50", subject: "Производственное обучение (П/О)", room: "Мастерская 1", teacher: "Кузнецов В. С." },
          { id: "l-vr2-6-3", pairNumber: 3, time: "11:00 – 12:20", subject: "Производственное обучение (П/О)", room: "Мастерская 1", teacher: "Кузнецов В. С." },
        ],
      },
    ],
  },
  {
    groupId: "sit-k-25",
    groupName: "СИТ-К-25",
    course: 2,
    specialty: "Сетевые технологии",
    curator: "Касымов Н. О.",
    shift: "2-я смена (14:20)",
    days: [
      {
        dateStr: "21.09.26",
        dayOfWeek: "Понедельник",
        fullDateRu: "21 сентября 2026",
        lessons: [
          { id: "l-sit-1-1", pairNumber: 1, time: "14:20 – 15:40", subject: "Основы программирования", room: "Лаб. 2", teacher: "Ташиев Б. К." },
          { id: "l-sit-1-2", pairNumber: 2, time: "15:50 – 17:10", subject: "Основы программирования", room: "Лаб. 2", teacher: "Ташиев Б. К." },
          { id: "l-sit-1-3", pairNumber: 3, time: "17:20 – 18:40", subject: "Основы программирования", room: "Лаб. 2", teacher: "Ташиев Б. К." },
        ],
      },
      {
        dateStr: "22.09.26",
        dayOfWeek: "Вторник",
        fullDateRu: "22 сентября 2026",
        lessons: [
          { id: "l-sit-2-1", pairNumber: 1, time: "14:20 – 15:40", subject: "Производственное обучение", room: "Серверная", teacher: "Исаков М. Т." },
          { id: "l-sit-2-2", pairNumber: 2, time: "15:50 – 17:10", subject: "Производственное обучение", room: "Серверная", teacher: "Исаков М. Т." },
        ],
      },
      {
        dateStr: "23.09.26",
        dayOfWeek: "Среда",
        fullDateRu: "23 сентября 2026",
        holidayNote: "Кыргыз Республикасынын Мамлекеттик тил күнү",
        lessons: [
          { id: "l-sit-3-1", pairNumber: 1, time: "14:20 – 15:40", subject: "Основы программирования", room: "Лаб. 2", teacher: "Ташиев Б. К." },
          { id: "l-sit-3-2", pairNumber: 2, time: "15:50 – 17:10", subject: "Кыргызский язык", room: "каб. 201", teacher: "Асанова Г. К." },
        ],
      },
      {
        dateStr: "24.09.26",
        dayOfWeek: "Четверг",
        fullDateRu: "24 сентября 2026",
        lessons: [
          { id: "l-sit-4-1", pairNumber: 1, time: "14:20 – 15:40", subject: "Цифровая грамотность", room: "Лаб. 1", teacher: "Алиев Р. Т." },
          { id: "l-sit-4-2", pairNumber: 2, time: "15:50 – 17:10", subject: "Цифровая грамотность", room: "Лаб. 1", teacher: "Алиев Р. Т." },
        ],
      },
      {
        dateStr: "25.09.26",
        dayOfWeek: "Пятница",
        fullDateRu: "25 сентября 2026",
        lessons: [
          { id: "l-sit-5-1", pairNumber: 1, time: "14:20 – 15:40", subject: "Основы программирования", room: "Лаб. 2", teacher: "Ташиев Б. К." },
          { id: "l-sit-5-2", pairNumber: 2, time: "15:50 – 17:10", subject: "Основы программирования", room: "Лаб. 2", teacher: "Ташиев Б. К." },
        ],
      },
      {
        dateStr: "26.09.26",
        dayOfWeek: "Суббота",
        fullDateRu: "26 сентября 2026",
        lessons: [
          { id: "l-sit-6-1", pairNumber: 1, time: "14:20 – 15:40", subject: "Основы программирования", room: "Лаб. 2", teacher: "Ташиев Б. К." },
        ],
      },
    ],
  },
];

const SCHEDULE_STORAGE_KEY = "lms_schedule_data_v1";

export function ScheduleView() {
  const [scheduleData, setScheduleData] = useState<GroupScheduleData[]>(INITIAL_SCHEDULE_DATA);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("vr-1-26");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState<boolean>(false);

  // 1. Initial Load from LocalStorage (persists across page reloads/browser sessions)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setScheduleData(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load schedule from localStorage", err);
    } finally {
      setIsLoadedFromStorage(true);
    }
  }, []);

  // 2. Auto-save to LocalStorage on every modification
  useEffect(() => {
    if (!isLoadedFromStorage) return;
    try {
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(scheduleData));
    } catch (err) {
      console.error("Failed to save schedule to localStorage", err);
    }
  }, [scheduleData, isLoadedFromStorage]);

  // Dialog States
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<{
    groupId: string;
    dayIndex: number;
    lesson?: LessonSlot;
  } | null>(null);

  // Lesson Form fields
  const [formDayIndex, setFormDayIndex] = useState<number>(0);
  const [formShift, setFormShift] = useState<ShiftType>("1-я смена");
  const [formStartTime, setFormStartTime] = useState<string>("08:00");
  const [formPairNum, setFormPairNum] = useState<number>(1);
  const [formTime, setFormTime] = useState<string>("08:00 – 09:20");
  const [formSubject, setFormSubject] = useState<string>("");
  const [formRoom, setFormRoom] = useState<string>("");
  const [formTeacher, setFormTeacher] = useState<string>("");
  const [formNote, setFormNote] = useState<string>("");
  const [formIsSpecial, setFormIsSpecial] = useState<boolean>(false);
  const [formIsDoublePair, setFormIsDoublePair] = useState<boolean>(false);

  // Dynamic pair slots calculated from the current shift start time (80 min + 10 min break)
  const dynamicPairSlots = useMemo(() => {
    return calculatePairSlotsFromStart(formStartTime);
  }, [formStartTime]);

  // Mobile View Active Day
  const [activeMobileDayIndex, setActiveMobileDayIndex] = useState<number>(0);

  // Day Holiday/Event Note State
  const [isDayNoteDialogOpen, setIsDayNoteDialogOpen] = useState<boolean>(false);
  const [dayNoteEditing, setDayNoteEditing] = useState<{ dayIndex: number; note: string } | null>(null);

  // Import Dialog State
  const [isImportDialogOpen, setIsImportDialogOpen] = useState<boolean>(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  const currentGroup = useMemo(() => {
    return scheduleData.find((g) => g.groupId === selectedGroupId) || scheduleData[0];
  }, [scheduleData, selectedGroupId]);

  // Open Day Note Dialog
  const handleOpenDayNoteDialog = (dayIndex: number) => {
    const currentNote = currentGroup.days[dayIndex]?.holidayNote || "";
    setDayNoteEditing({ dayIndex, note: currentNote });
    setIsDayNoteDialogOpen(true);
  };

  // Save Day Note
  const handleSaveDayNote = (customNote?: string) => {
    if (!dayNoteEditing) return;
    const noteToSave = customNote !== undefined ? customNote : dayNoteEditing.note;
    
    setScheduleData((prev) =>
      prev.map((g) => {
        if (g.groupId !== selectedGroupId) return g;
        const updatedDays = [...g.days];
        updatedDays[dayNoteEditing.dayIndex] = {
          ...updatedDays[dayNoteEditing.dayIndex],
          holidayNote: noteToSave.trim() || undefined,
        };
        return { ...g, days: updatedDays };
      })
    );
    setIsDayNoteDialogOpen(false);
  };

  // Toggle shift for current group
  const handleChangeGroupShift = (newShift: ShiftType, customStartTime?: string) => {
    const startTime = customStartTime || SHIFT_DEFAULT_START[newShift];
    const shiftLabel = `${newShift} (${startTime})`;
    setScheduleData((prev) =>
      prev.map((g) => (g.groupId === selectedGroupId ? { ...g, shift: shiftLabel } : g))
    );
  };

  // Extract unique suggestions across all schedules
  const suggestions = useMemo(() => {
    const subjects = new Set<string>();
    const rooms = new Set<string>();
    const teachers = new Set<string>();

    scheduleData.forEach((grp) => {
      if (grp.curator) teachers.add(grp.curator);
      grp.days.forEach((d) => {
        d.lessons.forEach((l) => {
          if (l.subject) subjects.add(l.subject);
          if (l.room) rooms.add(l.room);
          if (l.teacher) teachers.add(l.teacher);
        });
      });
    });

    return {
      subjects: Array.from(subjects),
      rooms: Array.from(rooms),
      teachers: Array.from(teachers),
    };
  }, [scheduleData]);

  // Open Edit/Add Modal
  const handleOpenAddLesson = (dayIndex: number, pairNum?: number) => {
    const groupShift = normalizeShiftType(currentGroup.shift);
    const groupStartTime = extractShiftStartTime(currentGroup.shift);
    const pNum = pairNum || 1;
    const computedSlots = calculatePairSlotsFromStart(groupStartTime);
    const initialTime = computedSlots[pNum] || "08:00 – 09:20";

    setEditingLesson({
      groupId: selectedGroupId,
      dayIndex,
    });
    setFormDayIndex(dayIndex);
    setFormShift(groupShift);
    setFormStartTime(groupStartTime);
    setFormPairNum(pNum);
    setFormTime(initialTime);
    setFormSubject("");
    setFormRoom("каб. 201");
    setFormTeacher(currentGroup.curator);
    setFormNote("");
    setFormIsSpecial(false);
    setFormIsDoublePair(false);
    setIsLessonDialogOpen(true);
  };

  const handleOpenEditLesson = (dayIndex: number, lesson: LessonSlot) => {
    const groupShift = normalizeShiftType(currentGroup.shift);
    const groupStartTime = extractShiftStartTime(currentGroup.shift);

    let startTime = groupStartTime;
    if (lesson.pairNumber === 1 && lesson.time) {
      startTime = extractShiftStartTime(lesson.time);
    }

    const computedSlots = calculatePairSlotsFromStart(startTime);

    setEditingLesson({
      groupId: selectedGroupId,
      dayIndex,
      lesson,
    });
    setFormDayIndex(dayIndex);
    setFormShift(groupShift);
    setFormStartTime(startTime);
    setFormPairNum(lesson.pairNumber);
    setFormTime(lesson.time || computedSlots[lesson.pairNumber] || "08:00 – 09:20");
    setFormSubject(lesson.subject);
    setFormRoom(lesson.room);
    setFormTeacher(lesson.teacher || "");
    setFormNote(lesson.note || "");
    setFormIsSpecial(!!lesson.isSpecialEvent);
    setFormIsDoublePair(false);
    setIsLessonDialogOpen(true);
  };

  // Change Shift in modal
  const handleModalShiftChange = (s: ShiftType) => {
    setFormShift(s);
    const defaultStart = SHIFT_DEFAULT_START[s];
    setFormStartTime(defaultStart);
    const slots = calculatePairSlotsFromStart(defaultStart);
    setFormTime(slots[formPairNum] || "08:00 – 09:20");
  };

  // Change Start time of 1st pair in modal (auto-recalculates all other pairs!)
  const handleModalStartTimeChange = (newStartTime: string) => {
    setFormStartTime(newStartTime);
    const slots = calculatePairSlotsFromStart(newStartTime);
    setFormTime(slots[formPairNum] || "08:00 – 09:20");
  };

  // Change Pair in modal
  const handleModalPairChange = (num: number) => {
    setFormPairNum(num);
    const slots = calculatePairSlotsFromStart(formStartTime);
    setFormTime(slots[num] || "08:00 – 09:20");
  };

  // Handle manual input in Time field (if editing 1st pair, automatically update chain)
  const handleManualTimeChange = (val: string) => {
    setFormTime(val);
    if (formPairNum === 1) {
      const match = val.match(/(\d{1,2}[:.]\d{2})/);
      if (match) {
        const detectedStart = match[1].replace(".", ":");
        setFormStartTime(detectedStart);
      }
    }
  };

  // Quick apply subject preset
  const handleSelectSubjectSuggestion = (subj: string) => {
    setFormSubject(subj);
    for (const d of currentGroup.days) {
      const match = d.lessons.find((l) => l.subject === subj);
      if (match) {
        if (!formRoom || formRoom === "каб. 201") setFormRoom(match.room);
        if (!formTeacher || formTeacher === currentGroup.curator) {
          setFormTeacher(match.teacher || "");
        }
        break;
      }
    }
  };

  // Save Lesson
  const handleSaveLesson = () => {
    if (!editingLesson || !formSubject.trim()) return;

    const time = formTime.trim() || getTimeSlotForShift(formShift, formPairNum);
    const newLessonObj: LessonSlot = {
      id: editingLesson.lesson?.id || `lesson-${Date.now()}`,
      pairNumber: formPairNum,
      time,
      subject: formSubject.trim(),
      room: formRoom.trim() || "каб. 201",
      teacher: formTeacher.trim() || undefined,
      note: formNote.trim() || undefined,
      isSpecialEvent: formIsSpecial,
    };

    const doubleLessonObj: LessonSlot | null =
      formIsDoublePair && formPairNum < 6 && !editingLesson.lesson
        ? {
            id: `lesson-${Date.now() + 1}`,
            pairNumber: formPairNum + 1,
            time: getTimeSlotForShift(formShift, formPairNum + 1),
            subject: formSubject.trim(),
            room: formRoom.trim() || "каб. 201",
            teacher: formTeacher.trim() || undefined,
            note: formNote.trim() || undefined,
            isSpecialEvent: formIsSpecial,
          }
        : null;

    setScheduleData((prev) =>
      prev.map((g) => {
        if (g.groupId !== editingLesson.groupId) return g;

        const updatedDays = [...g.days];
        const targetDay = { ...updatedDays[formDayIndex] };

        if (editingLesson.lesson) {
          // If day changed during edit
          if (formDayIndex !== editingLesson.dayIndex) {
            // Remove from old day
            const oldDay = { ...updatedDays[editingLesson.dayIndex] };
            oldDay.lessons = oldDay.lessons.filter((l) => l.id !== editingLesson.lesson!.id);
            updatedDays[editingLesson.dayIndex] = oldDay;

            // Add to new day
            const filtered = targetDay.lessons.filter((l) => l.pairNumber !== formPairNum);
            targetDay.lessons = [...filtered, newLessonObj].sort((a, b) => a.pairNumber - b.pairNumber);
          } else {
            // Edit in same day
            targetDay.lessons = targetDay.lessons.map((l) =>
              l.id === editingLesson.lesson!.id ? newLessonObj : l
            );
          }
        } else {
          // Check if pair slots occupied and insert
          const pairsToReplace = new Set([formPairNum]);
          if (doubleLessonObj) pairsToReplace.add(formPairNum + 1);

          const filtered = targetDay.lessons.filter((l) => !pairsToReplace.has(l.pairNumber));
          const toAdd = [newLessonObj];
          if (doubleLessonObj) toAdd.push(doubleLessonObj);

          targetDay.lessons = [...filtered, ...toAdd].sort((a, b) => a.pairNumber - b.pairNumber);
        }

        updatedDays[formDayIndex] = targetDay;
        return { ...g, days: updatedDays };
      })
    );

    setIsLessonDialogOpen(false);
  };

  // Delete Lesson
  const handleDeleteLesson = (dayIndex: number, lessonId: string) => {
    setScheduleData((prev) =>
      prev.map((g) => {
        if (g.groupId !== selectedGroupId) return g;
        const updatedDays = [...g.days];
        const targetDay = { ...updatedDays[dayIndex] };
        targetDay.lessons = targetDay.lessons.filter((l) => l.id !== lessonId);
        updatedDays[dayIndex] = targetDay;
        return { ...g, days: updatedDays };
      })
    );
  };

  // Simulate Excel Import
  const handleExecuteImport = () => {
    if (!importFileName) return;
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        setIsImportDialogOpen(false);
        setImportFileName(null);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="space-y-3 w-full text-xs">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Учебный процесс</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Расписание занятий</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Сетка расписания пар
            </h1>
            <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/30">
              2026–2027 уч. год (2-я неделя)
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Group Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-[11px] hidden sm:inline">Группа:</span>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="h-8 text-xs bg-background w-[130px] font-medium">
                <SelectValue placeholder="Выберите группу" />
              </SelectTrigger>
              <SelectContent>
                {scheduleData.map((g) => (
                  <SelectItem key={g.groupId} value={g.groupId} className="text-xs">
                    Группа {g.groupName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift Switcher for Selected Group */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => handleChangeGroupShift("1-я смена", "08:00")}
              className={`h-7 px-3 rounded-md text-[11px] font-medium transition-colors ${
                normalizeShiftType(currentGroup.shift) === "1-я смена"
                  ? "bg-background text-foreground shadow-2xs border font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              1-я смена (08:00)
            </button>
            <button
              type="button"
              onClick={() => handleChangeGroupShift("2-я смена", "14:20")}
              className={`h-7 px-3 rounded-md text-[11px] font-medium transition-colors ${
                normalizeShiftType(currentGroup.shift) === "2-я смена"
                  ? "bg-background text-foreground shadow-2xs border font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              2-я смена (14:20)
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-[150px] sm:w-[170px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Admin Add Lesson Button */}
          <Button
            size="xs"
            onClick={() => handleOpenAddLesson(activeMobileDayIndex || 0, 1)}
            className="h-8 text-xs gap-1.5 font-medium shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Добавить пару</span>
          </Button>

          {/* Admin Import Excel Action */}
          <Button
            size="xs"
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="h-8 text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
            title="Импорт из Excel учебной части"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Импорт Excel</span>
          </Button>
        </div>
      </div>

      {/* Live Status Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
              <span>Сейчас идёт: {currentGroup.shift.includes("14:20") ? "1-я пара (14:20 – 15:40)" : currentGroup.shift.includes("13:00") ? "1-я пара (13:00 – 14:20)" : "2-я пара (09:30 – 10:50)"}</span>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Идёт пара
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                {currentGroup.shift}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Группа <span className="font-medium text-foreground">{currentGroup.groupName}</span>: {currentGroup.days[0]?.lessons[1]?.subject || "Русский язык"} • {currentGroup.days[0]?.lessons[1]?.room || "каб. 204"} ({currentGroup.days[0]?.lessons[1]?.teacher || "Смирнова Е. В."})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div>Специальность: <span className="font-medium text-foreground">{currentGroup.specialty}</span></div>
          <div>•</div>
          <div>Куратор: <span className="font-semibold text-foreground">{currentGroup.curator}</span></div>
        </div>
      </div>

      {/* 1. Desktop & Tablet Week Table (hidden on mobile) */}
      <div className="hidden md:block bg-card border rounded-xl p-3.5 shadow-2xs space-y-3 overflow-x-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5">
            <LayoutGrid className="h-4 w-4 text-primary" />
            Сетка занятий: Группа {currentGroup.groupName} ({currentGroup.shift})
          </h3>
          <span className="text-[11px] text-muted-foreground">Понедельник – Суббота</span>
        </div>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50 border-y text-muted-foreground text-[11px]">
              <th className="py-2.5 px-3 text-left font-semibold w-28 border-r">Пара / Время</th>
              {currentGroup.days.map((d, dayIndex) => (
                <th key={d.dateStr} className="py-2.5 px-3 text-left font-semibold min-w-[160px] border-r last:border-r-0 group/th relative">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-foreground">{d.dayOfWeek}</div>
                    <button
                      type="button"
                      onClick={() => handleOpenDayNoteDialog(dayIndex)}
                      className="opacity-0 group-hover/th:opacity-100 p-1 rounded text-muted-foreground hover:text-primary hover:bg-background transition-opacity duration-200"
                      title="Редактировать событие / праздник дня"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-[10px] font-normal text-muted-foreground">{d.fullDateRu}</div>
                  
                  {/* Stable fixed height container for day note (prevents any header height jumping) */}
                  <div className="h-5 mt-1 flex items-center">
                    {d.holidayNote ? (
                      <button
                        type="button"
                        onClick={() => handleOpenDayNoteDialog(dayIndex)}
                        className="text-[10px] font-medium text-amber-600 dark:text-amber-400 truncate bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors duration-200 text-left max-w-full"
                        title={`Нажмите для редактирования: ${d.holidayNote}`}
                      >
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span className="truncate">{d.holidayNote}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenDayNoteDialog(dayIndex)}
                        className="text-[9px] text-muted-foreground/40 hover:text-primary opacity-0 group-hover/th:opacity-100 flex items-center gap-1 transition-opacity duration-200"
                      >
                        <Plus className="h-2.5 w-2.5" /> событие дня
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {[1, 2, 3, 4, 5].map((pairNum) => {
              const timeSlot = getTimeSlotForShift(currentGroup.shift, pairNum);

              return (
                <tr key={pairNum} className="hover:bg-muted/10 transition-colors duration-200">
                  {/* Left Column: Fixed Pair Time Slot */}
                  <td className="p-2 font-medium text-muted-foreground bg-muted/15 border-r align-middle w-28">
                    <div className="h-[76px] flex flex-col justify-center px-1">
                      <div className="font-bold text-foreground text-xs">{pairNum} пара</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{timeSlot}</div>
                    </div>
                  </td>

                  {/* Day Columns */}
                  {currentGroup.days.map((day, dayIndex) => {
                    let lesson = day.lessons.find((l) => l.pairNumber === pairNum);
                    
                    // Filter by search query if any
                    if (searchQuery.trim() && lesson) {
                      const q = searchQuery.toLowerCase().trim();
                      const matches =
                        lesson.subject.toLowerCase().includes(q) ||
                        lesson.room.toLowerCase().includes(q) ||
                        (lesson.teacher && lesson.teacher.toLowerCase().includes(q));
                      if (!matches) lesson = undefined;
                    }

                    // Empty Slot
                    if (!lesson) {
                      return (
                        <td
                          key={day.dateStr}
                          onClick={() => handleOpenAddLesson(dayIndex, pairNum)}
                          className="p-2 border-r last:border-r-0 cursor-pointer group align-middle"
                          title="Кликните, чтобы добавить пару"
                        >
                          <div className="h-[76px] rounded-lg border border-dashed border-transparent group-hover:border-primary/30 group-hover:bg-primary/5 flex items-center justify-center gap-1.5 text-muted-foreground/20 group-hover:text-primary transition-all duration-200">
                            <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Добавить
                            </span>
                            <span className="text-sm font-normal text-muted-foreground/20 group-hover:hidden select-none">
                              —
                            </span>
                          </div>
                        </td>
                      );
                    }

                    // Lesson Card
                    return (
                      <td
                        key={day.dateStr}
                        className={`p-2 align-middle border-r last:border-r-0 group transition-colors duration-200 ${
                          lesson.isSpecialEvent ? "bg-emerald-500/5 dark:bg-emerald-950/10" : ""
                        }`}
                      >
                        <div
                          className={`h-[76px] p-2 rounded-lg border flex flex-col justify-between transition-all duration-200 ${
                            lesson.isSpecialEvent
                              ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60 shadow-2xs"
                              : "bg-card border-border/70 hover:border-primary/40 hover:shadow-2xs"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <div className="font-bold text-foreground text-[11px] leading-snug line-clamp-1">
                                {lesson.subject}
                              </div>
                              {/* Fast Action Buttons on Hover */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditLesson(dayIndex, lesson!);
                                  }}
                                  className="p-1 hover:text-primary text-muted-foreground rounded hover:bg-muted transition-colors duration-150"
                                  title="Редактировать пару"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(dayIndex, lesson!.id);
                                  }}
                                  className="p-1 hover:text-destructive text-muted-foreground rounded hover:bg-muted transition-colors duration-150"
                                  title="Удалить пару"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                              <MapPin className="h-2.5 w-2.5 text-primary shrink-0" />
                              <span className="text-foreground/80 truncate">{lesson.room}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1 text-[9px] text-muted-foreground">
                            {lesson.teacher ? (
                              <span className="truncate">{lesson.teacher}</span>
                            ) : (
                              <span />
                            )}
                            {lesson.note && (
                              <span className="font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded shrink-0">
                                ★ {lesson.note}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Native Mobile Adaptive View (Days Ribbon + Timeline Cards) */}
      <div className="md:hidden space-y-3">
        {/* Horizontal Days Selector Ribbon */}
        <div className="bg-card border rounded-xl p-2.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" /> Дни недели:
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">
              {currentGroup.days[activeMobileDayIndex]?.fullDateRu}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {currentGroup.days.map((d, idx) => {
              const isSelected = activeMobileDayIndex === idx;
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setActiveMobileDayIndex(idx)}
                  className={`py-2 px-0.5 rounded-lg border font-medium text-center transition-all flex flex-col items-center justify-center relative ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-muted/30 hover:bg-muted text-foreground border-border"
                  }`}
                >
                  <span className="text-xs font-bold leading-tight">{d.dayOfWeek.slice(0, 2)}</span>
                  <span className={`text-[9px] leading-tight ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {d.dateStr.slice(0, 5)}
                  </span>
                  {d.holidayNote && (
                    <span
                      className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${
                        isSelected ? "bg-amber-300" : "bg-amber-500"
                      }`}
                      title={d.holidayNote}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Header Card */}
        {(() => {
          const selectedDay = currentGroup.days[activeMobileDayIndex] || currentGroup.days[0];
          return (
            <div className="space-y-2.5">
              <div className="bg-card border rounded-xl p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <span>{selectedDay.dayOfWeek}</span>
                    <span className="text-xs font-normal text-muted-foreground">({selectedDay.fullDateRu})</span>
                  </h3>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleOpenDayNoteDialog(activeMobileDayIndex)}
                    className="h-6 px-2 text-[10px] gap-1 font-medium text-muted-foreground hover:text-primary"
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>{selectedDay.holidayNote ? "Изменить" : "+ Событие"}</span>
                  </Button>
                </div>

                {selectedDay.holidayNote && (
                  <div
                    onClick={() => handleOpenDayNoteDialog(activeMobileDayIndex)}
                    className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">★ {selectedDay.holidayNote}</span>
                    </div>
                    <Edit2 className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
              </div>

              {/* Vertical Timeline Cards for 1..5 pairs */}
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((pairNum) => {
                  const timeSlot = getTimeSlotForShift(currentGroup.shift, pairNum);
                  let lesson = selectedDay.lessons.find((l) => l.pairNumber === pairNum);

                  if (searchQuery.trim() && lesson) {
                    const q = searchQuery.toLowerCase().trim();
                    const matches =
                      lesson.subject.toLowerCase().includes(q) ||
                      lesson.room.toLowerCase().includes(q) ||
                      (lesson.teacher && lesson.teacher.toLowerCase().includes(q));
                    if (!matches) lesson = undefined;
                  }

                  if (!lesson) {
                    return (
                      <div
                        key={pairNum}
                        onClick={() => handleOpenAddLesson(activeMobileDayIndex, pairNum)}
                        className="p-3 rounded-xl border border-dashed border-border bg-card/60 hover:bg-primary/5 hover:border-primary/40 cursor-pointer transition-all flex items-center justify-between text-xs group"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-muted/40 font-medium">
                            {pairNum} пара • {timeSlot}
                          </Badge>
                        </div>
                        <div className="text-[11px] font-medium text-muted-foreground/60 group-hover:text-primary flex items-center gap-1 transition-colors">
                          <Plus className="h-3.5 w-3.5" />
                          <span>Добавить</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={pairNum}
                      className={`p-3 rounded-xl border transition-all shadow-2xs space-y-2 ${
                        lesson.isSpecialEvent
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30">
                            {pairNum} пара
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                            {lesson.time || timeSlot}
                          </span>
                          {lesson.isSpecialEvent && (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold">
                              Событие
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleOpenEditLesson(activeMobileDayIndex, lesson!)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-primary font-medium"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            <span>Изменить</span>
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleDeleteLesson(activeMobileDayIndex, lesson!.id)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive font-medium"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-foreground text-sm leading-snug">
                          {lesson.subject}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
                          <div className="flex items-center gap-1 font-medium text-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            <span>{lesson.room}</span>
                          </div>
                          {lesson.teacher && (
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{lesson.teacher}</span>
                            </div>
                          )}
                        </div>

                        {lesson.note && (
                          <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md mt-2">
                            ★ {lesson.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Dialog 1: Add / Edit Lesson Modal */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="p-6 gap-4 text-xs sm:max-w-[860px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="place-items-start text-left gap-1 pb-2 border-b">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                {editingLesson?.lesson ? "Редактировать пару" : "Добавить пару в расписание"}
              </DialogTitle>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-medium">
                Группа {currentGroup.groupName} ({formShift})
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Заполните параметры пары или нажмите на подсказки для быстрого автозаполнения.
            </DialogDescription>
          </DialogHeader>

          {/* 2-Column Spacious Body */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-1">
            {/* Left Column (5 of 12 cols): Time, Day, Shift, Pair */}
            <div className="md:col-span-5 space-y-3.5">
              <div className="bg-muted/30 border rounded-xl p-3.5 space-y-3.5">
                {/* 1. Day of Week */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> День недели
                  </label>
                  <div className="grid grid-cols-6 gap-1">
                    {currentGroup.days.map((d, idx) => {
                      const isActive = formDayIndex === idx;
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => setFormDayIndex(idx)}
                          className={`py-1.5 px-0.5 rounded-lg border font-medium text-center transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                              : "bg-background border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="font-bold text-[11px]">{d.dayOfWeek.slice(0, 2)}</div>
                          <div className={`text-[9px] ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {d.dateStr.slice(0, 5)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Shift Selection & Start Time Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Смена звонков
                    </label>
                    <span className="text-[10px] text-muted-foreground font-mono">Старт: {formStartTime}</span>
                  </div>

                  {/* Shift toggle */}
                  <div className="grid grid-cols-2 gap-1 bg-muted/60 p-1 rounded-lg border">
                    <button
                      type="button"
                      onClick={() => handleModalShiftChange("1-я смена")}
                      className={`h-7 rounded-md text-[11px] font-medium transition-colors ${
                        formShift === "1-я смена"
                          ? "bg-background text-foreground shadow-2xs border"
                          : "text-muted-foreground hover:text-foreground border-transparent border"
                      }`}
                    >
                      1-я смена
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModalShiftChange("2-я смена")}
                      className={`h-7 rounded-md text-[11px] font-medium transition-colors ${
                        formShift === "2-я смена"
                          ? "bg-background text-foreground shadow-2xs border"
                          : "text-muted-foreground hover:text-foreground border-transparent border"
                      }`}
                    >
                      2-я смена
                    </button>
                  </div>

                  {/* Start time presets for current shift */}
                  <div className="space-y-1 pt-0.5">
                    <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-between">
                      <span>Время старта 1-й пары:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {SHIFT_PRESET_STARTS[formShift].map((preset) => {
                        const isSelected = formStartTime === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleModalStartTimeChange(preset)}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                : "bg-background hover:bg-muted text-muted-foreground border-border hover:text-foreground"
                            }`}
                          >
                            {preset} {preset === SHIFT_DEFAULT_START[formShift] ? "(стандарт)" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Pair Number Selector (auto-calculated time on each button) */}
                <div className="space-y-1.5 pt-1 border-t">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-foreground">Номер пары</label>
                    <span className="text-[9px] text-primary font-medium">80 мин + 10 мин перерыв</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const isActive = formPairNum === num;
                      const slotTime = dynamicPairSlots[num] || "08:00 – 09:20";
                      const startPart = slotTime.split("–")[0]?.trim();
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleModalPairChange(num)}
                          className={`h-11 rounded-lg border font-medium text-xs transition-colors flex flex-col items-center justify-center p-1 ${
                            isActive
                              ? "bg-primary/10 border-primary text-primary ring-1 ring-primary/40"
                              : "bg-background border-border text-foreground hover:bg-muted"
                          }`}
                          title={`Пара ${num}: ${slotTime}`}
                        >
                          <span className="font-bold">{num} пара</span>
                          <span className="text-[9px] text-muted-foreground leading-tight font-mono">
                            {startPart}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Editable Time Slot & Auto-Sync Notification */}
                <div className="space-y-1.5 pt-1 border-t">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-muted-foreground">Время пары:</label>
                    <span className="text-[10px] font-mono text-foreground font-semibold">{formTime}</span>
                  </div>
                  <Input
                    value={formTime}
                    onChange={(e) => handleManualTimeChange(e.target.value)}
                    placeholder="например, 14:20 – 15:40"
                    className="h-8 text-xs font-mono bg-background"
                  />
                  <div className="text-[9px] text-muted-foreground leading-relaxed bg-background/60 p-1.5 rounded border">
                    ⚡ <span className="font-medium text-foreground">Авто-подстройка:</span> при изменении времени 1-й пары все следующие пары ({formShift}) автоматически смещаются.
                  </div>
                </div>

                {/* Double pair checkbox */}
                {!editingLesson?.lesson && formPairNum < 5 && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Checkbox
                      id="isDoublePair"
                      checked={formIsDoublePair}
                      onCheckedChange={(checked) => setFormIsDoublePair(!!checked)}
                    />
                    <label htmlFor="isDoublePair" className="text-[11px] font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground">
                      Сдвоенная пара (добавить сразу на {formPairNum}-ю и {formPairNum + 1}-ю)
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (7 of 12 cols): Subject, Room, Teacher, Notes */}
            <div className="md:col-span-7 space-y-3.5">
              {/* Block: Subject */}
              <div className="bg-muted/30 border rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" /> Дисциплина (Предмет)
                  </label>
                  <span className="text-[10px] text-muted-foreground">Свободный ввод</span>
                </div>
                <Input
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="например, Веб-программирование, Физика, Базы данных..."
                  className="h-8 text-xs font-medium bg-background"
                  autoFocus
                />
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Частые предметы (нажмите для выбора):</span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {suggestions.subjects.map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => handleSelectSubjectSuggestion(subj)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors ${
                          formSubject === subj
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 border-border text-foreground/80"
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Block: Room and Teacher (Manual Input only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Room */}
                <div className="bg-muted/30 border rounded-xl p-3 space-y-1.5">
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Аудитория
                  </label>
                  <Input
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="каб. 201, Лаб. 1..."
                    className="h-8 text-xs bg-background"
                  />
                </div>

                {/* Teacher */}
                <div className="bg-muted/30 border rounded-xl p-3 space-y-1.5">
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" /> Преподаватель
                  </label>
                  <Input
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="ФИО преподавателя"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Block: Notes & Highlighting */}
              <div className="bg-muted/30 border rounded-xl p-3 space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Примечание (необязательно)</label>
                  <Input
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="например, Лабораторная работа, Зачёт или Тема занятия"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 border-t">
                  <Checkbox
                    id="isSpecial"
                    checked={formIsSpecial}
                    onCheckedChange={(checked) => setFormIsSpecial(!!checked)}
                  />
                  <label htmlFor="isSpecial" className="text-xs font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground">
                    Выделить карточку в расписании (Гостевая лекция / Праздник / Важное событие)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-3 border-t mt-1">
            <div className="text-[11px] text-muted-foreground hidden sm:block">
              {currentGroup.days[formDayIndex]?.dayOfWeek} • {formPairNum} пара ({formTime})
            </div>
            <div className="flex items-center gap-2">
              <Button size="xs" variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
                Отмена
              </Button>
              <Button size="xs" onClick={handleSaveLesson} disabled={!formSubject.trim()} className="px-4 font-medium">
                Сохранить пару
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: Excel Import Modal */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[440px]">
          <DialogHeader className="place-items-start text-left gap-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Импорт расписания из файла Excel
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Загрузите общий файл расписания учебной части (.xlsx / .xls). Система сама разложит данные по всем группам.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div
              onClick={() => setImportFileName("Расписание_2026_2027_2_неделя.xlsx")}
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-colors space-y-2"
            >
              <UploadCloud className="h-8 w-8 text-primary mx-auto" />
              <div className="font-semibold text-foreground">
                {importFileName ? importFileName : "Перетащите сюда Excel-файл или нажмите для выбора"}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Поддерживаются стандартные шаблоны расписаний (.xlsx, .xls)
              </p>
            </div>

            {importFileName && (
              <div className="p-2.5 rounded-lg bg-muted/40 border text-[11px] space-y-1">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Файл готов к обработке
                  </span>
                  <span className="text-[10px] text-muted-foreground">42.5 KB</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Обнаружены группы: ВР-1-26, ВР-2-26, СИТ-К-25 (+другие)
                </div>
              </div>
            )}

            {importSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold text-center text-xs flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4" /> Расписание успешно загружено и обновлено!
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t mt-2">
            <Button size="xs" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              size="xs"
              onClick={handleExecuteImport}
              disabled={!importFileName || isImporting || importSuccess}
            >
              {isImporting ? "Обработка..." : "Импортировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog 3: Day Event / Holiday Note Dialog */}
      <Dialog open={isDayNoteDialogOpen} onOpenChange={setIsDayNoteDialogOpen}>
        <DialogContent className="p-4 gap-3 text-xs sm:max-w-[420px]">
          <DialogHeader className="place-items-start text-left gap-1">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Событие / Праздник дня
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {dayNoteEditing !== null && currentGroup.days[dayNoteEditing.dayIndex] && (
                <span>
                  {currentGroup.days[dayNoteEditing.dayIndex].dayOfWeek},{" "}
                  {currentGroup.days[dayNoteEditing.dayIndex].fullDateRu}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">
                Название события или праздника:
              </label>
              <Input
                value={dayNoteEditing?.note || ""}
                onChange={(e) =>
                  setDayNoteEditing((prev) => (prev ? { ...prev, note: e.target.value } : null))
                }
                placeholder="например, День государственного языка, Сокращённый день..."
                className="h-8 text-xs bg-background"
                autoFocus
              />
            </div>

            {/* Quick Presets Grid (Static Stable Layout) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground font-medium">Готовые шаблоны (нажмите для выбора):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  "Кыргыз Республикасынын Мамлекеттик тил күнү",
                  "Праздничный нерабочий день",
                  "День учителя",
                  "Сокращённый день",
                  "Санитарный день",
                  "Экзаменационная сессия",
                ].map((preset) => {
                  const isSelected = dayNoteEditing?.note === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setDayNoteEditing((prev) => (prev ? { ...prev, note: preset } : null))
                      }
                      className={`text-left text-[11px] px-2.5 py-2 rounded-lg border font-medium transition-colors leading-snug ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/30 hover:bg-muted text-foreground/80 hover:text-foreground border-border"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2 border-t mt-2">
            <div>
              {dayNoteEditing?.note ? (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleSaveDayNote("")}
                  className="text-destructive hover:bg-destructive/10 text-xs px-2.5 h-7 font-medium"
                >
                  Удалить событие
                </Button>
              ) : (
                <div className="h-7" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="xs" variant="outline" onClick={() => setIsDayNoteDialogOpen(false)}>
                Отмена
              </Button>
              <Button size="xs" onClick={() => handleSaveDayNote()} className="font-medium">
                Сохранить
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
