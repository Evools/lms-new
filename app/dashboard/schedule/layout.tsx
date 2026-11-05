import { auth } from "@/lib/auth";
import { isModuleDisabled } from "@/lib/feature-guard";
import { ModuleDisabledCard } from "@/components/module-disabled-card";

export default async function ScheduleLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const disabled = await isModuleDisabled("feature_schedule");
  if (disabled) {
    return (
      <ModuleDisabledCard
        moduleTitle="Расписание занятий"
        moduleDesc="Сетка расписания пар и занятий временно отключена администрацией лицея."
        isAdmin={session?.user?.role === "ADMIN"}
      />
    );
  }
  return <>{children}</>;
}

