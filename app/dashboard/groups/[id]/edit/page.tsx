import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import {
  getGroupByIdAction,
  getTeachersListAction,
  getAcademicYearsListAction,
} from "@/app/dashboard/groups/actions";
import { GroupEditForm } from "./_components/group-edit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGroupPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/dashboard/groups");
  }

  const { id } = await params;
  const group = await getGroupByIdAction(id);

  if (!group) {
    notFound();
  }

  const [teachers, academicYears] = await Promise.all([
    getTeachersListAction(),
    getAcademicYearsListAction(),
  ]);

  return (
    <GroupEditForm
      group={group}
      userRole={session.user.role}
      teachersList={teachers}
      academicYearsList={academicYears}
    />
  );
}
