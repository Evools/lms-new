import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PracticeView } from "./_components/practice-view";
import { getPracticeFullDataAction } from "./actions";

export const metadata = {
  title: "База практики | LMS",
};

export default async function PracticePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "STUDENT";
  const userName = session.user.name || "Пользователь";

  const practiceData = await getPracticeFullDataAction();

  return (
    <PracticeView
      userRole={role}
      currentUserName={userName}
      initialCompanies={practiceData.companies as any}
      initialStudents={practiceData.students as any}
      initialDiaryPlans={practiceData.diaryPlans as any}
      initialRewrittenDays={practiceData.rewrittenDayIds}
      initialGroups={practiceData.groupsList}
    />
  );
}
