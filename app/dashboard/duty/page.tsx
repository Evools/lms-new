import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getDutyScheduleAction,
  getAllGroupsTodayDutyAction,
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

  const { groups, weeklyDays, groupStudents } = await getDutyScheduleAction(group);
  const targetGroupId = group || groups[0]?.id;

  const [allGroupsTodayDuty, groupDutyStats] = await Promise.all([
    getAllGroupsTodayDutyAction(),
    targetGroupId ? getGroupDutyStatsAction(targetGroupId) : Promise.resolve([]),
  ]);

  return (
    <DutyScheduleView
      userRole={role}
      groupsList={groups}
      weeklyDays={weeklyDays}
      groupStudents={groupStudents}
      allGroupsTodayDuty={allGroupsTodayDuty}
      groupDutyStats={groupDutyStats}
      selectedGroupId={targetGroupId}
    />
  );
}
