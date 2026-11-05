import { auth } from "@/lib/auth";
import { isModuleDisabled } from "@/lib/feature-guard";
import { ModuleDisabledCard } from "@/components/module-disabled-card";

export default async function GitLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const disabled = await isModuleDisabled("feature_git");
  if (disabled) {
    return (
      <ModuleDisabledCard
        moduleTitle="Git-симулятор"
        moduleDesc="Интерактивный тренажёр ветвления Git временно отключен администрацией лицея в настройках системы."
        isAdmin={session?.user?.role === "ADMIN"}
      />
    );
  }
  return <>{children}</>;
}

