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
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "ADMINISTRATION" &&
    session.user.role !== "TEACHER"
  ) {
    redirect("/dashboard");
  }

  const data = await getSubjectsDataAction();
  const canManage =
    session.user.role === "ADMIN" ||
    session.user.role === "ADMINISTRATION" ||
    session.user.role === "TEACHER";

  return (
    <SubjectsView
      subjects={data.subjects}
      bindings={data.bindings}
      teachers={data.teachers}
      groups={data.groups}
      specialties={data.specialties}
      isAdmin={canManage}
    />
  );
}
