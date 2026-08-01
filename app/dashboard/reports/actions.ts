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
  totalMaterials: number;
  totalAssignments: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  totalAttendanceRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
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

export interface SubjectMaterialsDTO {
  subjectName: string;
  groupName: string;
  materialsCount: number;
  assignmentsCount: number;
}

export async function getReportsDataAction() {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return { error: "Недостаточно прав для просмотра отчётов" };
    }

    // === Summary KPIs ===
    const [
      totalGroups,
      totalStudents,
      totalTeachers,
      totalMaterials,
      totalAssignments,
      allSubmissions,
      allAttendances,
    ] = await Promise.all([
      prisma.group.count(),
      prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
      prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
      prisma.material.count(),
      prisma.assignment.count(),
      prisma.assignmentSubmission.findMany({ select: { status: true } }),
      prisma.attendance.findMany({ select: { status: true } }),
    ]);

    const summary: ReportSummaryDTO = {
      totalGroups,
      totalStudents,
      totalTeachers,
      totalMaterials,
      totalAssignments,
      totalSubmissions: allSubmissions.length,
      acceptedSubmissions: allSubmissions.filter((s) => s.status === SubmissionStatus.ACCEPTED).length,
      totalAttendanceRecords: allAttendances.length,
      presentCount: allAttendances.filter((a) => a.status === AttendanceStatus.PRESENT).length,
      absentCount: allAttendances.filter((a) => a.status === AttendanceStatus.ABSENT).length,
      lateCount: allAttendances.filter((a) => a.status === AttendanceStatus.LATE).length,
    };

    // === Groups ===
    const groups = await prisma.group.findMany({
      include: {
        students: true,
        groupSubjects: true,
      },
      orderBy: { name: "asc" },
    });

    const groupDTOs: ReportGroupDTO[] = groups.map((g) => ({
      id: g.id,
      name: g.name,
      studentsCount: g.students.length,
      subjectsCount: g.groupSubjects.length,
    }));

    // === Attendance per group ===
    const groupAttendance: GroupAttendanceDTO[] = await Promise.all(
      groups.map(async (g) => {
        const records = await prisma.attendance.findMany({
          where: { groupSubject: { groupId: g.id } },
          select: { status: true },
        });
        const total = records.length;
        const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
        const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
        const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;
        const excused = records.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
        return {
          groupId: g.id,
          groupName: g.name,
          totalRecords: total,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          excusedCount: excused,
          presentPct: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      })
    );

    // === Assignments per group ===
    const groupAssignments: GroupAssignmentDTO[] = await Promise.all(
      groups.map(async (g) => {
        const assignments = await prisma.assignment.findMany({
          where: { groupSubject: { groupId: g.id } },
          include: { submissions: { select: { status: true } } },
        });
        const totalA = assignments.length;
        const allSubs = assignments.flatMap((a) => a.submissions);
        const totalSubs = allSubs.length;
        const accepted = allSubs.filter((s) => s.status === SubmissionStatus.ACCEPTED).length;
        const needRevision = allSubs.filter((s) => s.status === SubmissionStatus.NEED_REVISION).length;

        // Total possible submissions = assignments * students in group
        const studentsInGroup = g.students.length;
        const maxPossibleSubs = totalA * studentsInGroup;

        return {
          groupId: g.id,
          groupName: g.name,
          totalAssignments: totalA,
          totalSubmissions: totalSubs,
          acceptedCount: accepted,
          needRevisionCount: needRevision,
          submissionPct: maxPossibleSubs > 0 ? Math.round((totalSubs / maxPossibleSubs) * 100) : 0,
          acceptedPct: totalSubs > 0 ? Math.round((accepted / totalSubs) * 100) : 0,
        };
      })
    );

    // === Top student activity (top 10) ===
    const students = await prisma.user.findMany({
      where: { role: "STUDENT", isActive: true },
      include: {
        studentEnrollments: {
          include: { group: { select: { name: true } } },
        },
        submissions: { select: { status: true } },
        attendances: { select: { status: true } },
      },
      orderBy: { name: "asc" },
      take: 30,
    });

    const studentActivity: StudentActivityDTO[] = students.map((s) => {
      const groupName = s.studentEnrollments[0]?.group.name || "—";
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

    // === Materials per subject ===
    const groupSubjects = await prisma.groupSubject.findMany({
      include: {
        subject: { select: { name: true } },
        group: { select: { name: true } },
        topics: {
          include: {
            materials: { select: { id: true } },
            assignments: { select: { id: true } },
          },
        },
      },
      orderBy: [{ group: { name: "asc" } }],
    });

    const subjectMaterials: SubjectMaterialsDTO[] = groupSubjects.map((gs) => ({
      subjectName: gs.subject.name,
      groupName: gs.group.name,
      materialsCount: gs.topics.reduce((acc, t) => acc + t.materials.length, 0),
      assignmentsCount: gs.topics.reduce((acc, t) => acc + t.assignments.length, 0),
    }));

    return {
      summary,
      groups: groupDTOs,
      groupAttendance,
      groupAssignments,
      studentActivity,
      subjectMaterials,
    };
  } catch (error) {
    console.error("getReportsDataAction error:", error);
    return { error: "Ошибка при загрузке данных отчётов" };
  }
}
