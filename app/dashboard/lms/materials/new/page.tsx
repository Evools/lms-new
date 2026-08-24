import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMaterialsDataAction } from "../../actions";
import { CreateMaterialView } from "./_components/create-material-view";

interface PageProps {
  searchParams: Promise<{ group?: string; subject?: string; topic?: string }>;
}

export default async function CreateMaterialPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    redirect("/dashboard/lms/materials");
  }

  const { group, subject, topic } = await searchParams;
  const data = await getMaterialsDataAction(group, topic);

  return (
    <CreateMaterialView
      groups={data.groups}
      subjects={data.subjects}
      topics={data.topics}
      selectedGroupId={data.selectedGroupId}
      selectedSubjectId={subject || ""}
      selectedTopicId={topic || ""}
    />
  );
}
