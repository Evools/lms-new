import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnnouncementsView } from "./_components/announcements-view";

export default async function AnnouncementsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, role } = session.user;

  return (
    <AnnouncementsView
      userRole={role ?? "STUDENT"}
      userName={name ?? "Пользователь"}
    />
  );
}
