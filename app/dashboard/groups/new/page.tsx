import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTeachersListAction } from "../actions";
import { GroupCreationForm } from "./_components/group-creation-form";

export default async function NewGroupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/groups");
  }

  const teachers = await getTeachersListAction();

  return <GroupCreationForm teachersList={teachers} />;
}
