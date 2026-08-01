import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTopicsDataAction } from "../../actions";
import { CreateTopicView } from "./_components/create-topic-view";

interface PageProps {
  searchParams: Promise<{ group?: string; subject?: string }>;
}

export default async function CreateTopicPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    redirect("/dashboard/lms/topics");
  }

  const { group, subject } = await searchParams;
  const data = await getTopicsDataAction(group, subject);

  return (
    <CreateTopicView
      groups={data.groups}
      subjects={data.subjects}
      selectedGroupId={data.selectedGroupId}
      selectedSubjectId={data.selectedGroupSubjectId}
      existingTopicsCount={data.topics.length}
    />
  );
}
