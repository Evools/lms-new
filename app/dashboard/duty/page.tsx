import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getDutyScheduleAction,
  getGroupDutyStatsAction,
} from "./actions";
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

  const { groups, weeklyDays, groupStudents, isDutyEnabled, selectedGroupId, canManageDuty } =
    await getDutyScheduleAction(group);
  const targetGroupId = selectedGroupId || group || groups[0]?.id || "";

  const groupDutyStats = targetGroupId ? await getGroupDutyStatsAction(targetGroupId) : [];

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
    />
  );
}
