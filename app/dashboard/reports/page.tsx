import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getReportsDataAction } from "./actions";
import { ReportsView } from "./_components/reports-view";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Аналитика & Отчёты | Лицей LMS",
  description: "Сводная аналитика посещаемости, домашних заданий и активности студентов",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const data = await getReportsDataAction();

  if ("error" in data && data.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Ошибка загрузки отчётов</p>
        <p className="text-xs text-muted-foreground">{data.error}</p>
      </div>
    );
  }

  return (
    <ReportsView
      summary={data.summary!}
      groups={data.groups!}
      groupAttendance={data.groupAttendance!}
      groupAssignments={data.groupAssignments!}
      studentActivity={data.studentActivity!}
    />
  );
}
