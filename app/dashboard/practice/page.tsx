import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PracticeView } from "./_components/practice-view";

export const metadata = {
  title: "База практики | LMS",
};

export default async function PracticePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "STUDENT";
  const userName = session.user.name || "Пользователь";

  let availableGroups: { id: string; name: string; course: number; specialty: string }[] = [];
  try {
    const dbGroups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        course: true,
        specialty: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
    availableGroups = dbGroups.map((g) => ({
      id: g.id,
      name: g.name,
      course: g.course || 1,
      specialty: g.specialty?.name || "Общая специальность",
    }));
  } catch (e) {
    console.error("Error fetching groups for practice:", e);
  }

  return (
    <PracticeView
      userRole={role}
      currentUserName={userName}
      initialGroups={availableGroups}
    />
  );
}
