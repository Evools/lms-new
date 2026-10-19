import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDutyScheduleAction } from "./actions";
import { DutyScheduleView } from "./_components/duty-schedule-view";

interface PageProps {
  searchParams: Promise<{ group?: string }>;
}

export default async function DutySchedulePage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { group } = await searchParams;
  const role = session.user.role || "STUDENT";

  const {
    groups,
    weeklyDays,
    groupStudents,
    groupDutyStats,
    isDutyEnabled,
    selectedGroupId,
    canManageDuty,
    groupDutySettings,
  } = await getDutyScheduleAction(group);
  const targetGroupId = selectedGroupId || group || groups[0]?.id || "";

  return (
    <DutyScheduleView
      userRole={role}
      canManageDuty={canManageDuty}
      groupsList={groups}
      weeklyDays={weeklyDays}
      groupStudents={groupStudents}
      groupDutyStats={groupDutyStats}
      selectedGroupId={targetGroupId}
      isDutyEnabled={isDutyEnabled}
      initialDutySettings={groupDutySettings}
    />
  );
}
