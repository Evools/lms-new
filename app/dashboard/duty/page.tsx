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

  const { groups, weeklyDays, groupStudents } = await getDutyScheduleAction(group);

  return (
    <DutyScheduleView
      userRole={role}
      groupsList={groups}
      weeklyDays={weeklyDays}
      groupStudents={groupStudents}
      selectedGroupId={group}
    />
  );
}
