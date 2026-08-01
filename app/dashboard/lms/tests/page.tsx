import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTestsDataAction } from "../actions";
import { TestsView } from "./_components/tests-view";

interface PageProps {
  searchParams: Promise<{ group?: string; topic?: string }>;
}

export default async function TestsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { group, topic } = await searchParams;
  const data = await getTestsDataAction(group, topic);

  return <TestsView {...data} selectedTopicId={topic || ""} userRole={session.user.role || "STUDENT"} />;
}
