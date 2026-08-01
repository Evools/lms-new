import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMaterialsDataAction } from "../actions";
import { MaterialsView } from "./_components/materials-view";

interface PageProps {
  searchParams: Promise<{ group?: string; topic?: string; type?: string }>;
}

export default async function MaterialsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { group, topic, type } = await searchParams;
  const data = await getMaterialsDataAction(group, topic, type);

  return <MaterialsView {...data} selectedTopicId={topic || ""} selectedType={type || ""} />;
}
