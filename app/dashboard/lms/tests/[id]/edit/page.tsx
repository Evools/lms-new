import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTestsDataAction, getTestForEditAction } from "@/app/dashboard/lms/actions";
import { EditTestView } from "./_components/edit-test-view";

interface EditTestPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    group?: string;
  }>;
}

export default async function EditTestPage({ params, searchParams }: EditTestPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    redirect("/dashboard/lms/tests");
  }

  const { id } = await params;
  const { group: groupQuery } = await searchParams;

  const testRes = await getTestForEditAction(id);
  if (!testRes.success || !testRes.test) {
    notFound();
  }

  const initialTest = testRes.test;
  const selectedGroupId = groupQuery || initialTest.groupId;

  const data = await getTestsDataAction(selectedGroupId);

  return (
    <EditTestView
      initialTest={initialTest}
      groups={data.groups}
      subjects={data.subjects}
      topics={data.topics}
    />
  );
}
