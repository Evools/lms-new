import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAssignmentForEditAction } from "@/app/dashboard/assignments/actions";
import { EditAssignmentView } from "./_components/edit-assignment-view";

interface EditAssignmentPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    group?: string;
  }>;
}

export default async function EditAssignmentPage({
  params,
  searchParams,
}: EditAssignmentPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    redirect("/dashboard/assignments");
  }

  const { id } = await params;
  const { group: groupQuery } = await searchParams;

  const res = await getAssignmentForEditAction(id);
  if (!res.success || !res.assignment) {
    notFound();
  }

  const initialAssignment = res.assignment;
  const selectedGroupId = groupQuery || initialAssignment.groupId;

  const groups = await prisma.group.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const groupSubjects = await prisma.groupSubject.findMany({
    include: {
      group: { select: { name: true } },
      subject: { select: { name: true } },
      teacher: { select: { name: true } },
    },
  });

  const groupSubjectOptions = groupSubjects.map((gs) => ({
    id: gs.id,
    groupId: gs.groupId,
    groupName: gs.group.name,
    subjectName: gs.subject.name,
    teacherName: gs.teacher.name,
  }));

  return (
    <EditAssignmentView
      initialAssignment={initialAssignment}
      groups={groups}
      groupSubjects={groupSubjectOptions}
      selectedGroupId={selectedGroupId}
    />
  );
}
