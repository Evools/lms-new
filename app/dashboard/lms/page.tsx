import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLmsOverviewDataAction } from "./actions";
import { LmsOverviewView } from "./_components/lms-overview-view";

interface PageProps {
  searchParams: Promise<{ group?: string }>;
}

export default async function LmsOverviewPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { group } = await searchParams;
  const data = await getLmsOverviewDataAction(group);

  return <LmsOverviewView {...data} />;
}
