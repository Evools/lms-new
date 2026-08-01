import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSubjectsDataAction } from "./actions";
import { SubjectsView } from "./_components/subjects-view";

export const metadata = {
  title: "Учебные дисциплины | Лицей LMS",
  description: "Управление дисциплинами и их привязкой к учебным группам",
};

export default async function SubjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const data = await getSubjectsDataAction();

  return (
    <SubjectsView
      subjects={data.subjects}
      bindings={data.bindings}
      teachers={data.teachers}
      groups={data.groups}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
