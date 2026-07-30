import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentsView } from "./_components/students-view";

export default async function StudentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "STUDENT";

  return <StudentsView userRole={role} />;
}
