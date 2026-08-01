import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAttendanceDataAction } from "./actions";
import { AttendanceView } from "./_components/attendance-view";

interface PageProps {
  searchParams: Promise<{ group?: string; subject?: string; date?: string }>;
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { group, subject, date } = await searchParams;
  const role = session.user.role || "STUDENT";

  const {
    groups,
    subjects,
    students,
    attendanceMap,
    selectedGroupId,
    selectedGroupSubjectId,
    dateStr,
    canEdit,
  } = await getAttendanceDataAction(group, subject, date);

  return (
    <AttendanceView
      userRole={role}
      groups={groups}
      subjects={subjects}
      students={students}
      attendanceMap={attendanceMap}
      selectedGroupId={selectedGroupId}
      selectedGroupSubjectId={selectedGroupSubjectId}
      dateStr={dateStr}
      canEdit={canEdit}
    />
  );
}
