import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getStudentCardDataAction } from "../actions";
import { StudentCardView } from "./_components/student-card-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const student = await getStudentCardDataAction(id);
  if (!student) {
    return { title: "Студент не найден | Лицей LMS" };
  }
  return {
    title: `Личная карточка: ${student.name} | Лицей LMS`,
    description: `Профиль студента ${student.name}, группа ${student.groupName}, посещаемость и успеваемость`,
  };
}

export default async function StudentCardPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const student = await getStudentCardDataAction(id);

  if (!student) {
    notFound();
  }

  const role = session.user.role || "STUDENT";

  return <StudentCardView student={student} userRole={role} />;
}
