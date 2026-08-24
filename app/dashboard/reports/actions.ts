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

export async function getReportsDataAction() {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
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

    return {
      summary,
      groups: groupDTOs,
      groupAttendance,
      groupAssignments,
      studentActivity,
    };
  } catch (error) {
    console.error("getReportsDataAction error:", error);
    return { error: "Ошибка при загрузке данных отчётов" };
  }
}
