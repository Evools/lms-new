import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSpecialtiesAction } from "./actions";
import { SpecialtiesView } from "./_components/specialties-view";

export const metadata = {
  title: "Специальности | Лицей LMS",
  description: "Управление направлениями подготовки и специальностями лицея",
};

export default async function SpecialtiesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const specialties = await getSpecialtiesAction();

  return (
    <SpecialtiesView
      specialties={specialties}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
