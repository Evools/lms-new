import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentRegistrationForm } from "./_components/student-registration-form";

export default async function NewStudentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "STUDENT";

  return <StudentRegistrationForm userRole={role} />;
}
