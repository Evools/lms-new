import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSettingsDataAction } from "./actions";
import { SettingsView } from "./_components/settings-view";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Настройки | Лицей LMS",
  description: "Настройки профиля, безопасности и системы",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getSettingsDataAction();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
        <Settings className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Ошибка загрузки настроек</p>
      </div>
    );
  }

  return (
    <SettingsView
      profile={data.profile}
      allUsers={data.allUsers}
      academicYears={data.academicYears}
      systemStats={data.systemStats}
      systemConfig={data.systemConfig}
      role={data.role}
    />
  );
}
