import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnnouncementsView } from "./_components/announcements-view";
import { getAnnouncementsAction } from "./actions";

export default async function AnnouncementsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, role } = session.user;
  const initialAnnouncements = await getAnnouncementsAction();

  return (
    <AnnouncementsView
      userRole={role ?? "STUDENT"}
      userName={name ?? "Пользователь"}
      initialAnnouncements={initialAnnouncements}
    />
  );
}
