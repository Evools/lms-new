import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getScholarshipDataAction } from "./actions";
import { ScholarshipView } from "./_components/scholarship-view";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Ведомость стипендии | Лицей LMS",
  description: "Формирование ежемесячной стипендии, расчет отличников и ударников по оценкам дисциплин",
};

export default async function ScholarshipPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Strict role guard: students NEVER have access to scholarship calculation
  if (session.user.role === "STUDENT") {
    redirect("/dashboard");
  }

  const data = await getScholarshipDataAction();

  if (!data.groups || data.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center p-6 bg-card border rounded-xl">
        <ShieldAlert className="h-10 w-10 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Нет доступных учебных групп</h2>
        <p className="text-xs text-muted-foreground max-w-md">
          {session.user.role === "TEACHER"
            ? "У вас нет прикрепленных учебных групп для формирования стипендии. Преподаватель может просматривать и заполнять ведомости только тех групп, где он является куратором или ведет дисциплины."
            : "В системе еще не создано ни одной учебной группы."}
        </p>
      </div>
    );
  }

  return (
    <ScholarshipView
      groups={data.groups}
      initialGroupId={data.activeGroupId}
      initialMonth={data.activeMonth}
      initialRecord={data.savedRecord}
    />
  );
}
