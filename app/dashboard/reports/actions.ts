"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AttendanceStatus, SubmissionStatus } from "@prisma/client";

export interface ReportGroupDTO {
  id: string;
  name: string;
  studentsCount: number;
  subjectsCount: number;
}

export interface ReportSummaryDTO {
  totalGroups: number;
  totalStudents: number;
  totalTeachers: number;
  totalAssignments: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  totalAttendanceRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  totalTests: number;
  testSubmissionsCount: number;
}

export interface GroupAttendanceDTO {
  groupId: string;
  groupName: string;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  presentPct: number;
}

export interface GroupAssignmentDTO {
  groupId: string;
  groupName: string;
  totalAssignments: number;
  totalSubmissions: number;
  acceptedCount: number;
  needRevisionCount: number;
  submissionPct: number;
  acceptedPct: number;
}

export interface StudentActivityDTO {
  studentId: string;
  studentName: string;
  groupName: string;
  submissionsCount: number;
  acceptedCount: number;
  attendancePresent: number;
  attendanceTotal: number;
  attendancePct: number;
}

export interface GroupDisciplineDTO {
  id: string; // groupSubjectId
  subjectId: string;
  name: string; // subject name
  teacherName?: string;
}

export interface StudentPerformanceSubjectDTO {
  groupSubjectId: string;
  subjectName: string;
  grade: number; // 2, 3, 4, 5
  percentage: number; // 0-100%
  totalAssignments: number;
  acceptedAssignments: number;
  testScorePct?: number;
  status: "EXCELLENT" | "GOOD" | "SATISFACTORY" | "DEBT";
}

export interface StudentPerformanceRowDTO {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  subjects: Record<string, StudentPerformanceSubjectDTO>; // key is groupSubjectId
  averageGrade: number; // e.g. 4.6
  overallPercentage: number; // e.g. 92%
  debtsCount: number; // number of debts / "2"
  academicStatus: "EXCELLENT" | "GOOD" | "SATISFACTORY" | "DEBT";
}

export interface GroupPerformanceSheetDTO {
  groupId: string;
  groupName: string;
  curatorName?: string;
  specialtyName?: string;
  course?: number;
  disciplines: GroupDisciplineDTO[];
  students: StudentPerformanceRowDTO[];
  totalStudents: number;
  excellentCount: number; // 5
  goodCount: number; // 4
  satisfactoryCount: number; // 3
  debtCount: number; // 2
  academicSuccessPct: number; // Успеваемость % (без двоек)
  qualityKnowledgePct: number; // Качество знаний % (на 4 и 5)
  averageGroupGrade: number; // Средний балл группы
  subjectAverages: Record<string, { averageGrade: number; successPct: number; qualityPct: number }>;
}

export interface StudentAbsenceSubjectDTO {
  groupSubjectId: string;
  subjectName: string;
  totalLessons: number;
  totalHours: number;
  absentHours: number; // неуважительные (НБ) в часах
  excusedHours: number; // уважительные (УВ) в часах
  lateCount: number;
  totalMissedHours: number;
  absencePct: number;
  attendancePct: number;
}

export interface StudentAbsenceRowDTO {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  subjects: Record<string, StudentAbsenceSubjectDTO>; // key is groupSubjectId
  totalLessons: number;
  totalHours: number;
  totalMissedHours: number;
  absentHours: number; // неуважительные (НБ)
  excusedHours: number; // уважительные (УВ)
  lateCount: number;
  absencePct: number;
  attendancePct: number;
  unexcusedRatioPct: number;
  riskStatus: "NORMAL" | "WARNING" | "CRITICAL";
}

export interface GroupAbsenceSheetDTO {
  groupId: string;
  groupName: string;
  curatorName?: string;
  specialtyName?: string;
  course?: number;
  periodLabel: string;
  disciplines: GroupDisciplineDTO[];
  students: StudentAbsenceRowDTO[];
  totalStudents: number;
  totalGroupHours: number;
  totalMissedHours: number;
  totalAbsentHours: number;
  totalExcusedHours: number;
  totalLateCount: number;
  groupAttendancePct: number;
  groupAbsencePct: number;
  unexcusedPct: number;
  excusedPct: number;
  subjectStats: Record<
    string,
    {
      totalHours: number;
      missedHours: number;
      absentHours: number;
      excusedHours: number;
      absencePct: number;
      attendancePct: number;
    }
  >;
}

export async function getReportsDataAction() {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" &&
        session.user.role !== "TEACHER" &&
        session.user.role !== "ADMINISTRATION")
    ) {
      return { error: "Недостаточно прав для просмотра отчётов" };
    }

    // === Parallel Fast Aggregate & Batch Queries ===
    const [
      totalGroups,
      totalStudents,
      totalTeachers,
      totalAssignments,
      totalTests,
      testSubmissionsCount,
      submissionGroupStats,
      attendanceGroupStats,
      groups,
      allAttendanceRecords,
      allAssignmentsWithSubs,
      students,
    ] = await Promise.all([
      prisma.group.count(),
      prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
      prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
      prisma.assignment.count(),
      prisma.test.count(),
      prisma.testSubmission.count(),
      // DB-level aggregation for submissions
      prisma.assignmentSubmission.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      // DB-level aggregation for attendance
      prisma.attendance.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      // Groups metadata
      prisma.group.findMany({
        select: {
          id: true,
          name: true,
          students: { select: { studentId: true } },
          groupSubjects: { select: { id: true } },
        },
        orderBy: { name: "asc" },
      }),
      // Single query for all group attendance mappings
      prisma.attendance.findMany({
        select: {
          status: true,
          groupSubject: { select: { groupId: true } },
        },
      }),
      // Single query for all assignments and their submission statuses
      prisma.assignment.findMany({
        select: {
          id: true,
          groupSubject: { select: { groupId: true } },
          submissions: { select: { status: true } },
        },
      }),
      // Students activity (only lean fields)
      prisma.user.findMany({
        where: { role: "STUDENT", isActive: true },
        select: {
          id: true,
          name: true,
          studentEnrollments: {
            select: { group: { select: { name: true } } },
          },
          submissions: { select: { status: true } },
          attendances: { select: { status: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // Parse summary metrics from fast DB groupBy results
    const totalSubmissions = submissionGroupStats.reduce((acc, curr) => acc + curr._count._all, 0);
    const acceptedSubmissions =
      submissionGroupStats.find((s) => s.status === SubmissionStatus.ACCEPTED)?._count._all || 0;

    const totalAttendanceRecords = attendanceGroupStats.reduce((acc, curr) => acc + curr._count._all, 0);
    const presentCount =
      attendanceGroupStats.find((a) => a.status === AttendanceStatus.PRESENT)?._count._all || 0;
    const absentCount =
      attendanceGroupStats.find((a) => a.status === AttendanceStatus.ABSENT)?._count._all || 0;
    const lateCount =
      attendanceGroupStats.find((a) => a.status === AttendanceStatus.LATE)?._count._all || 0;
    const excusedCount =
      attendanceGroupStats.find((a) => a.status === AttendanceStatus.EXCUSED)?._count._all || 0;

    const summary: ReportSummaryDTO = {
      totalGroups,
      totalStudents,
      totalTeachers,
      totalAssignments,
      totalSubmissions,
      acceptedSubmissions,
      totalAttendanceRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      totalTests,
      testSubmissionsCount,
    };

    // Map Groups
    const groupDTOs: ReportGroupDTO[] = groups.map((g) => ({
      id: g.id,
      name: g.name,
      studentsCount: g.students.length,
      subjectsCount: g.groupSubjects.length,
    }));

    // Pre-aggregate attendance per group in-memory (O(N) single pass)
    const attendanceByGroupMap = new Map<
      string,
      { total: number; present: number; absent: number; late: number; excused: number }
    >();

    for (const record of allAttendanceRecords) {
      const gId = record.groupSubject?.groupId;
      if (!gId) continue;
      if (!attendanceByGroupMap.has(gId)) {
        attendanceByGroupMap.set(gId, { total: 0, present: 0, absent: 0, late: 0, excused: 0 });
      }
      const item = attendanceByGroupMap.get(gId)!;
      item.total++;
      if (record.status === AttendanceStatus.PRESENT) item.present++;
      else if (record.status === AttendanceStatus.ABSENT) item.absent++;
      else if (record.status === AttendanceStatus.LATE) item.late++;
      else if (record.status === AttendanceStatus.EXCUSED) item.excused++;
    }

    const groupAttendance: GroupAttendanceDTO[] = groups.map((g) => {
      const stats = attendanceByGroupMap.get(g.id) || { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
      return {
        groupId: g.id,
        groupName: g.name,
        totalRecords: stats.total,
        presentCount: stats.present,
        absentCount: stats.absent,
        lateCount: stats.late,
        excusedCount: stats.excused,
        presentPct: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      };
    });

    // Pre-aggregate assignments per group in-memory (O(N) single pass)
    const assignmentsByGroupMap = new Map<
      string,
      { totalAssignments: number; totalSubs: number; accepted: number; needRevision: number }
    >();

    for (const asg of allAssignmentsWithSubs) {
      const gId = asg.groupSubject?.groupId;
      if (!gId) continue;
      if (!assignmentsByGroupMap.has(gId)) {
        assignmentsByGroupMap.set(gId, { totalAssignments: 0, totalSubs: 0, accepted: 0, needRevision: 0 });
      }
      const item = assignmentsByGroupMap.get(gId)!;
      item.totalAssignments++;
      for (const sub of asg.submissions) {
        item.totalSubs++;
        if (sub.status === SubmissionStatus.ACCEPTED) item.accepted++;
        else if (sub.status === SubmissionStatus.NEED_REVISION) item.needRevision++;
      }
    }

    const groupAssignments: GroupAssignmentDTO[] = groups.map((g) => {
      const stats = assignmentsByGroupMap.get(g.id) || {
        totalAssignments: 0,
        totalSubs: 0,
        accepted: 0,
        needRevision: 0,
      };
      const studentsInGroup = g.students.length;
      const maxPossibleSubs = stats.totalAssignments * studentsInGroup;

      return {
        groupId: g.id,
        groupName: g.name,
        totalAssignments: stats.totalAssignments,
        totalSubmissions: stats.totalSubs,
        acceptedCount: stats.accepted,
        needRevisionCount: stats.needRevision,
        submissionPct: maxPossibleSubs > 0 ? Math.round((stats.totalSubs / maxPossibleSubs) * 100) : 0,
        acceptedPct: stats.totalSubs > 0 ? Math.round((stats.accepted / stats.totalSubs) * 100) : 0,
      };
    });

    // Parse Student activity
    const studentActivity: StudentActivityDTO[] = students.map((s) => {
      const groupName = s.studentEnrollments[0]?.group.name || "Без группы";
      const attendanceTotal = s.attendances.length;
      const attendancePresent = s.attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
      return {
        studentId: s.id,
        studentName: s.name,
        groupName,
        submissionsCount: s.submissions.length,
        acceptedCount: s.submissions.filter((sub) => sub.status === SubmissionStatus.ACCEPTED).length,
        attendancePresent,
        attendanceTotal,
        attendancePct: attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0,
      };
    });

    const firstGroupId = groups[0]?.id;
    let initialPerformanceSheet: GroupPerformanceSheetDTO | null = null;
    let initialAbsenceSheet: GroupAbsenceSheetDTO | null = null;

    if (firstGroupId) {
      [initialPerformanceSheet, initialAbsenceSheet] = await Promise.all([
        buildGroupPerformanceSheet(firstGroupId),
        buildGroupAbsenceSheet(firstGroupId),
      ]);
    }

    return {
      summary,
      groups: groupDTOs,
      groupAttendance,
      groupAssignments,
      studentActivity,
      initialPerformanceSheet,
      initialAbsenceSheet,
    };
  } catch (error) {
    console.error("getReportsDataAction error:", error);
    return { error: "Ошибка при загрузке данных отчётов" };
  }
}

export async function buildGroupPerformanceSheet(groupId: string): Promise<GroupPerformanceSheetDTO | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      specialty: { select: { name: true } },
      curator: { select: { name: true } },
      students: {
        include: {
          student: {
            select: { id: true, name: true, rollNumber: true, avatar: true },
          },
        },
      },
      groupSubjects: {
        include: {
          subject: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!group) return null;

  const disciplines: GroupDisciplineDTO[] = group.groupSubjects.map((gs) => ({
    id: gs.id,
    subjectId: gs.subjectId,
    name: gs.subject.name,
    teacherName: gs.teacher?.name || undefined,
  }));

  const studentsList = group.students
    .map((gs) => gs.student)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const [tests, assignments, scholarshipRecord] = await Promise.all([
    prisma.test.findMany({
      where: { groupSubject: { groupId } },
      include: { submissions: true },
    }),
    prisma.assignment.findMany({
      where: { groupSubject: { groupId } },
      include: { submissions: true },
    }),
    prisma.scholarshipRecord.findFirst({
      where: { groupId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const gradesDataMap = (scholarshipRecord?.gradesData as Record<string, any>) || {};

  const studentsRows: StudentPerformanceRowDTO[] = studentsList.map((st) => {
    const subjectsMap: Record<string, StudentPerformanceSubjectDTO> = {};
    let totalGradeSum = 0;
    let totalPctSum = 0;
    let debtsCount = 0;

    disciplines.forEach((disc) => {
      const savedGrade = gradesDataMap[st.id]?.grades?.[disc.name];

      const discTests = tests.filter((t) => t.groupSubjectId === disc.id);
      let avgTestScore: number | null = null;
      if (discTests.length > 0) {
        let totalScore = 0;
        let count = 0;
        discTests.forEach((t) => {
          const sub = t.submissions.find((s) => s.studentId === st.id);
          if (sub && sub.maxScore > 0) {
            totalScore += (sub.score / sub.maxScore) * 100;
            count++;
          }
        });
        if (count > 0) avgTestScore = Math.round(totalScore / count);
      }

      const discAsgs = assignments.filter((a) => a.groupSubjectId === disc.id);
      const totalAssignments = discAsgs.length;
      const acceptedAssignments = discAsgs.filter((a) =>
        a.submissions.some((s) => s.studentId === st.id && s.status === SubmissionStatus.ACCEPTED)
      ).length;

      // 1. Check for official saved grade from scholarship journal record
      let parsedSavedGrade: number | null = null;
      if (typeof savedGrade === "number" && savedGrade >= 2 && savedGrade <= 5) {
        parsedSavedGrade = savedGrade;
      } else if (typeof savedGrade === "string") {
        const matches = savedGrade.match(/[2-5]/g);
        if (matches && matches.length > 0) {
          const nums = matches.map(Number);
          const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
          parsedSavedGrade = Math.round(avg);
        }
      }

      // 2. Check for graded assignment submissions (where teacher manually scored with grade 2..5)
      const studentDiscSubmissions = discAsgs
        .map((a) => a.submissions.find((s) => s.studentId === st.id))
        .filter((sub) => sub && typeof sub.grade === "number" && sub.grade >= 2 && sub.grade <= 5);

      let avgTeacherGrade: number | null = null;
      if (studentDiscSubmissions.length > 0) {
        const sum = studentDiscSubmissions.reduce((acc, sub) => acc + (sub!.grade || 0), 0);
        avgTeacherGrade = Number((sum / studentDiscSubmissions.length).toFixed(1));
      }

      let percentage: number;
      let grade: number;

      if (parsedSavedGrade !== null) {
        grade = parsedSavedGrade;
        percentage = grade === 5 ? 95 : grade === 4 ? 80 : grade === 3 ? 65 : 45;
      } else if (avgTeacherGrade !== null) {
        grade = Math.round(avgTeacherGrade);
        percentage = grade === 5 ? 95 : grade === 4 ? 80 : grade === 3 ? 65 : 45;
      } else if (avgTestScore !== null) {
        percentage = avgTestScore;
        grade = percentage >= 85 ? 5 : percentage >= 70 ? 4 : percentage >= 55 ? 3 : 2;
      } else if (totalAssignments > 0 && acceptedAssignments > 0) {
        percentage = Math.round((acceptedAssignments / totalAssignments) * 100);
        grade = percentage >= 85 ? 5 : percentage >= 70 ? 4 : percentage >= 55 ? 3 : 2;
      } else {
        // Neutral baseline (4 = good standard) allowing quick teacher adjustment
        grade = 4;
        percentage = 75;
      }

      const status: "EXCELLENT" | "GOOD" | "SATISFACTORY" | "DEBT" =
        grade === 5 ? "EXCELLENT" : grade === 4 ? "GOOD" : grade === 3 ? "SATISFACTORY" : "DEBT";

      if (grade === 2) debtsCount++;
      totalGradeSum += grade;
      totalPctSum += percentage;

      subjectsMap[disc.id] = {
        groupSubjectId: disc.id,
        subjectName: disc.name,
        grade,
        percentage,
        totalAssignments,
        acceptedAssignments,
        testScorePct: avgTestScore || undefined,
        status,
      };
    });

    const discCount = disciplines.length || 1;
    const averageGrade = Number((totalGradeSum / discCount).toFixed(1));
    const overallPercentage = Math.round(totalPctSum / discCount);

    const allGrades = Object.values(subjectsMap).map((s) => s.grade);
    let academicStatus: "EXCELLENT" | "GOOD" | "SATISFACTORY" | "DEBT" = "SATISFACTORY";
    if (debtsCount > 0) academicStatus = "DEBT";
    else if (allGrades.length > 0 && allGrades.every((g) => g === 5)) academicStatus = "EXCELLENT";
    else if (allGrades.length > 0 && allGrades.every((g) => g >= 4)) academicStatus = "GOOD";

    return {
      studentId: st.id,
      studentName: st.name,
      rollNumber: st.rollNumber || undefined,
      subjects: subjectsMap,
      averageGrade,
      overallPercentage,
      debtsCount,
      academicStatus,
    };
  });

  const totalStudents = studentsRows.length;
  const excellentCount = studentsRows.filter((s) => s.academicStatus === "EXCELLENT").length;
  const goodCount = studentsRows.filter((s) => s.academicStatus === "GOOD").length;
  const satisfactoryCount = studentsRows.filter((s) => s.academicStatus === "SATISFACTORY").length;
  const debtCount = studentsRows.filter((s) => s.academicStatus === "DEBT").length;

  const academicSuccessPct =
    totalStudents > 0 ? Math.round(((totalStudents - debtCount) / totalStudents) * 100) : 0;
  const qualityKnowledgePct =
    totalStudents > 0 ? Math.round(((excellentCount + goodCount) / totalStudents) * 100) : 0;
  const averageGroupGrade =
    totalStudents > 0
      ? Number(
          (studentsRows.reduce((acc, s) => acc + s.averageGrade, 0) / totalStudents).toFixed(2)
        )
      : 0;

  const subjectAverages: Record<string, { averageGrade: number; successPct: number; qualityPct: number }> = {};
  disciplines.forEach((disc) => {
    const grades = studentsRows.map((s) => s.subjects[disc.id]?.grade || 0);
    const avg = grades.length > 0 ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)) : 0;
    const noDebts = grades.filter((g) => g >= 3).length;
    const quality = grades.filter((g) => g >= 4).length;
    subjectAverages[disc.id] = {
      averageGrade: avg,
      successPct: grades.length > 0 ? Math.round((noDebts / grades.length) * 100) : 0,
      qualityPct: grades.length > 0 ? Math.round((quality / grades.length) * 100) : 0,
    };
  });

  return {
    groupId: group.id,
    groupName: group.name,
    curatorName: group.curator?.name || undefined,
    specialtyName: group.specialty?.name || undefined,
    course: group.course,
    disciplines,
    students: studentsRows,
    totalStudents,
    excellentCount,
    goodCount,
    satisfactoryCount,
    debtCount,
    academicSuccessPct,
    qualityKnowledgePct,
    averageGroupGrade,
    subjectAverages,
  };
}

export async function buildGroupAbsenceSheet(
  groupId: string,
  period?: string
): Promise<GroupAbsenceSheetDTO | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      specialty: { select: { name: true } },
      curator: { select: { name: true } },
      students: {
        include: {
          student: {
            select: { id: true, name: true, rollNumber: true, avatar: true },
          },
        },
      },
      groupSubjects: {
        include: {
          subject: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!group) return null;

  const disciplines: GroupDisciplineDTO[] = group.groupSubjects.map((gs) => ({
    id: gs.id,
    subjectId: gs.subjectId,
    name: gs.subject.name,
    teacherName: gs.teacher?.name || undefined,
  }));

  const studentsList = group.students
    .map((gs) => gs.student)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  let periodFilter = {};
  let periodLabel = "За весь период";
  if (period && period.toLowerCase() !== "all") {
    const [year, month] = period.split("-").map(Number);
    if (year && month) {
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      periodFilter = { date: { gte: start, lte: end } };
      const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
      ];
      periodLabel = `${monthNames[month - 1]} ${year}`;
    }
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      groupSubject: { groupId },
      ...periodFilter,
    },
    select: {
      studentId: true,
      groupSubjectId: true,
      date: true,
      status: true,
    },
  });

  const distinctLessonsPerSubject = new Map<string, number>();
  disciplines.forEach((disc) => {
    const dates = new Set(
      attendances
        .filter((a) => a.groupSubjectId === disc.id)
        .map((a) => a.date.toISOString().split("T")[0])
    );
    distinctLessonsPerSubject.set(disc.id, dates.size);
  });

  const studentsRows: StudentAbsenceRowDTO[] = studentsList.map((st) => {
    const subjectsMap: Record<string, StudentAbsenceSubjectDTO> = {};
    let totalLessonsSum = 0;
    let totalHoursSum = 0;
    let totalMissedHoursSum = 0;
    let absentHoursSum = 0;
    let excusedHoursSum = 0;
    let lateCountSum = 0;

    disciplines.forEach((disc) => {
      const studentDiscAtt = attendances.filter(
        (a) => a.studentId === st.id && a.groupSubjectId === disc.id
      );

      const lessonsConducted = distinctLessonsPerSubject.get(disc.id) || studentDiscAtt.length;
      const totalSubjectHours = lessonsConducted * 2;

      let absentLessons = 0;
      let excusedLessons = 0;
      let lateCount = 0;

      studentDiscAtt.forEach((a) => {
        if (a.status === AttendanceStatus.ABSENT) absentLessons++;
        else if (a.status === AttendanceStatus.EXCUSED) excusedLessons++;
        else if (a.status === AttendanceStatus.LATE) lateCount++;
      });

      const absentHours = absentLessons * 2;
      const excusedHours = excusedLessons * 2;
      const totalMissedHours = absentHours + excusedHours;

      const absencePct =
        totalSubjectHours > 0 ? Math.round((totalMissedHours / totalSubjectHours) * 100) : 0;
      const attendancePct = totalSubjectHours > 0 ? Math.max(0, 100 - absencePct) : 100;

      totalLessonsSum += lessonsConducted;
      totalHoursSum += totalSubjectHours;
      totalMissedHoursSum += totalMissedHours;
      absentHoursSum += absentHours;
      excusedHoursSum += excusedHours;
      lateCountSum += lateCount;

      subjectsMap[disc.id] = {
        groupSubjectId: disc.id,
        subjectName: disc.name,
        totalLessons: lessonsConducted,
        totalHours: totalSubjectHours,
        absentHours,
        excusedHours,
        lateCount,
        totalMissedHours,
        absencePct,
        attendancePct,
      };
    });

    const absencePct =
      totalHoursSum > 0 ? Math.round((totalMissedHoursSum / totalHoursSum) * 100) : 0;
    const attendancePct = totalHoursSum > 0 ? Math.max(0, 100 - absencePct) : 100;
    const unexcusedRatioPct =
      totalMissedHoursSum > 0 ? Math.round((absentHoursSum / totalMissedHoursSum) * 100) : 0;

    let riskStatus: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL";
    if (absencePct >= 20 || absentHoursSum >= 16) {
      riskStatus = "CRITICAL";
    } else if (absencePct >= 10 || absentHoursSum >= 8) {
      riskStatus = "WARNING";
    }

    return {
      studentId: st.id,
      studentName: st.name,
      rollNumber: st.rollNumber || undefined,
      subjects: subjectsMap,
      totalLessons: totalLessonsSum,
      totalHours: totalHoursSum,
      totalMissedHours: totalMissedHoursSum,
      absentHours: absentHoursSum,
      excusedHours: excusedHoursSum,
      lateCount: lateCountSum,
      absencePct,
      attendancePct,
      unexcusedRatioPct,
      riskStatus,
    };
  });

  const totalStudents = studentsRows.length;
  const totalGroupHours = studentsRows.reduce((acc, s) => acc + s.totalHours, 0);
  const totalMissedHours = studentsRows.reduce((acc, s) => acc + s.totalMissedHours, 0);
  const totalAbsentHours = studentsRows.reduce((acc, s) => acc + s.absentHours, 0);
  const totalExcusedHours = studentsRows.reduce((acc, s) => acc + s.excusedHours, 0);
  const totalLateCount = studentsRows.reduce((acc, s) => acc + s.lateCount, 0);

  const groupAttendancePct =
    totalGroupHours > 0 ? Math.round(((totalGroupHours - totalMissedHours) / totalGroupHours) * 100) : 100;
  const groupAbsencePct =
    totalGroupHours > 0 ? Math.round((totalMissedHours / totalGroupHours) * 100) : 0;
  const unexcusedPct =
    totalMissedHours > 0 ? Math.round((totalAbsentHours / totalMissedHours) * 100) : 0;
  const excusedPct =
    totalMissedHours > 0 ? Math.round((totalExcusedHours / totalMissedHours) * 100) : 0;

  const subjectStats: Record<
    string,
    {
      totalHours: number;
      missedHours: number;
      absentHours: number;
      excusedHours: number;
      absencePct: number;
      attendancePct: number;
    }
  > = {};

  disciplines.forEach((disc) => {
    let totH = 0;
    let misH = 0;
    let abH = 0;
    let exH = 0;
    studentsRows.forEach((s) => {
      const sub = s.subjects[disc.id];
      if (sub) {
        totH += sub.totalHours;
        misH += sub.totalMissedHours;
        abH += sub.absentHours;
        exH += sub.excusedHours;
      }
    });
    const abPct = totH > 0 ? Math.round((misH / totH) * 100) : 0;
    subjectStats[disc.id] = {
      totalHours: totH,
      missedHours: misH,
      absentHours: abH,
      excusedHours: exH,
      absencePct: abPct,
      attendancePct: Math.max(0, 100 - abPct),
    };
  });

  return {
    groupId: group.id,
    groupName: group.name,
    curatorName: group.curator?.name || undefined,
    specialtyName: group.specialty?.name || undefined,
    course: group.course,
    periodLabel,
    disciplines,
    students: studentsRows,
    totalStudents,
    totalGroupHours,
    totalMissedHours,
    totalAbsentHours,
    totalExcusedHours,
    totalLateCount,
    groupAttendancePct,
    groupAbsencePct,
    unexcusedPct,
    excusedPct,
    subjectStats,
  };
}

export async function getGroupMatrixReportsAction(groupId: string, period?: string) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" &&
        session.user.role !== "TEACHER" &&
        session.user.role !== "ADMINISTRATION")
    ) {
      return { error: "Недостаточно прав для просмотра отчётов" };
    }

    const [performanceSheet, absenceSheet] = await Promise.all([
      buildGroupPerformanceSheet(groupId),
      buildGroupAbsenceSheet(groupId, period),
    ]);

    return { performanceSheet, absenceSheet };
  } catch (error) {
    console.error("getGroupMatrixReportsAction error:", error);
    return { error: "Ошибка при формировании сводных ведомостей" };
  }
}

export async function updateStudentGradeAction(
  groupId: string,
  studentId: string,
  subjectName: string,
  newGrade: number
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" &&
        session.user.role !== "TEACHER" &&
        session.user.role !== "ADMINISTRATION")
    ) {
      return { error: "Недостаточно прав для изменения оценок" };
    }

    if (!newGrade || newGrade < 2 || newGrade > 5) {
      return { error: "Недопустимая оценка. Допустимы оценки от 2 до 5" };
    }

    const currentMonthKey = new Date().toISOString().slice(0, 7); // e.g. "2026-10"

    // Find or create scholarship record for group
    let record = await prisma.scholarshipRecord.findFirst({
      where: { groupId },
      orderBy: { updatedAt: "desc" },
    });

    if (!record) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: { groupSubjects: { include: { subject: true } } },
      });
      const subjects = group?.groupSubjects.map((gs) => gs.subject.name) || [subjectName];
      record = await prisma.scholarshipRecord.create({
        data: {
          groupId,
          month: currentMonthKey,
          monthLabel: "Ведомость успеваемости",
          subjects,
          gradesData: {},
        },
      });
    }

    const gradesData = (record.gradesData as Record<string, any>) || {};
    if (!gradesData[studentId]) {
      gradesData[studentId] = { grades: {} };
    }
    if (!gradesData[studentId].grades) {
      gradesData[studentId].grades = {};
    }

    gradesData[studentId].grades[subjectName] = newGrade;

    await prisma.scholarshipRecord.update({
      where: { id: record.id },
      data: { gradesData },
    });

    const updatedSheet = await buildGroupPerformanceSheet(groupId);

    return { success: true, sheet: updatedSheet };
  } catch (error) {
    console.error("updateStudentGradeAction error:", error);
    return { error: "Ошибка при сохранении оценки" };
  }
}

