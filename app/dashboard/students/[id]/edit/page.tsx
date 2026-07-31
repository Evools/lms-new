import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getStudentByIdAction } from "../../actions";
import { StudentEditForm } from "./_components/student-edit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const student = await getStudentByIdAction(id);

  if (!student) {
    notFound();
  }

  const role = session.user.role || "STUDENT";

  return <StudentEditForm student={student} userRole={role} />;
}
