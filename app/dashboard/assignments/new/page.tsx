import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreateAssignmentView } from "./_components/create-assignment-view";

interface PageProps {
  searchParams: Promise<{ group?: string }>;
}

export default async function NewAssignmentPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    redirect("/dashboard/assignments");
  }

  const { group } = await searchParams;

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
    <CreateAssignmentView
      groups={groups}
      groupSubjects={groupSubjectOptions}
      defaultGroupId={group}
    />
  );
}
