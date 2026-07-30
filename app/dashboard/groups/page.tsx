import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGroupsAction } from "./actions";
import { GroupsView } from "./_components/groups-view";

export default async function GroupsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "STUDENT";
  const groupsList = await getGroupsAction();

  return <GroupsView userRole={role} initialGroups={groupsList} />;
}
