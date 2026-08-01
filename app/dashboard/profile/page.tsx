import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfileDataAction } from "./actions";
import { ProfileView } from "./_components/profile-view";
import { User } from "lucide-react";

export const metadata = {
  title: "Мой профиль | Лицей LMS",
  description: "Личный профиль пользователя, статистика и безопасность",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getProfileDataAction();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
        <User className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Ошибка загрузки профиля</p>
      </div>
    );
  }

  return <ProfileView profile={profile} />;
}
