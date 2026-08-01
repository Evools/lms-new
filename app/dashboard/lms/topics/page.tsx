import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTopicsDataAction } from "../actions";
import { TopicsView } from "./_components/topics-view";

interface PageProps {
  searchParams: Promise<{ group?: string; subject?: string }>;
}

export default async function TopicsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { group, subject } = await searchParams;
  const data = await getTopicsDataAction(group, subject);

  return <TopicsView {...data} />;
}
