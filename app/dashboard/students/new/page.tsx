import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGroupsAction } from "../../groups/actions";
import { StudentRegistrationForm } from "./_components/student-registration-form";

export default async function NewStudentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "STUDENT";
  const groups = await getGroupsAction();

  return <StudentRegistrationForm userRole={role} dbGroups={groups} />;
}
