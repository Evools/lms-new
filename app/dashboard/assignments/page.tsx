import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAssignmentsDataAction } from "./actions";
import { AssignmentsView } from "./_components/assignments-view";

interface PageProps {
  searchParams: Promise<{ group?: string }>;
}

export default async function AssignmentsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { group } = await searchParams;
  const role = session.user.role || "STUDENT";

  const { groups, subjects, assignments, selectedGroupId, canCreate } =
    await getAssignmentsDataAction(group);

  return (
    <AssignmentsView
      userRole={role}
      groups={groups}
      subjects={subjects}
      assignments={assignments}
      selectedGroupId={selectedGroupId}
      canCreate={canCreate}
    />
  );
}
