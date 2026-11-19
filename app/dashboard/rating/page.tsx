import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRatingPageDataAction } from "./actions";
import { RatingDemoView } from "./_components/rating-demo-view";

export const dynamic = "force-dynamic";

export default async function RatingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const initialData = await getRatingPageDataAction();

  return (
    <RatingDemoView
      initialData={initialData}
      userName={session.user.name || "Студент"}
      userRole={session.user.role || "STUDENT"}
    />
  );
}
