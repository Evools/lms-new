import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getGroupByIdAction } from "../actions";
import { getDutyScheduleAction, getGroupDutyStatsAction } from "@/app/dashboard/duty/actions";
import { GroupDetailsView } from "./_components/group-details-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const [group, dutyData, groupDutyStats] = await Promise.all([
    getGroupByIdAction(id),
    getDutyScheduleAction(id),
    getGroupDutyStatsAction(id),
  ]);

  if (!group) {
    notFound();
  }

  const role = session.user.role || "STUDENT";

  return (
    <GroupDetailsView
      group={group}
      userRole={role}
      weeklyDays={dutyData.weeklyDays}
      dutyGroupStudents={dutyData.groupStudents}
      groupDutyStats={groupDutyStats}
      dutyGroupsList={dutyData.groups}
      isDutyEnabled={dutyData.isDutyEnabled}
    />
  );
}

