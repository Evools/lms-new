import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTestsDataAction } from "../../actions";
import { CreateTestView } from "./_components/create-test-view";

interface PageProps {
  searchParams: Promise<{ group?: string; topic?: string }>;
}

export default async function CreateTestPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    redirect("/dashboard/lms/tests");
  }

  const { group, topic } = await searchParams;
  const data = await getTestsDataAction(group, topic);

  return (
    <CreateTestView
      groups={data.groups}
      subjects={data.subjects}
      topics={data.topics}
      selectedGroupId={data.selectedGroupId}
      selectedTopicId={topic || ""}
    />
  );
}
