import { auth } from "@/lib/auth";
import { isModuleDisabled } from "@/lib/feature-guard";
import { ModuleDisabledCard } from "@/components/module-disabled-card";

export default async function ScholarshipLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const disabled = await isModuleDisabled("feature_scholarship");
  if (disabled) {
    return (
      <ModuleDisabledCard
        moduleTitle="Стипендиальный калькулятор"
        moduleDesc="Модуль расчета академических и социальных стипендий временно отключен администрацией лицея."
        isAdmin={session?.user?.role === "ADMIN"}
      />
    );
  }
  return <>{children}</>;
}

