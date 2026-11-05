import { auth } from "@/lib/auth";
import { isModuleDisabled } from "@/lib/feature-guard";
import { ModuleDisabledCard } from "@/components/module-disabled-card";

export default async function TestsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const disabled = await isModuleDisabled("feature_tests");
  if (disabled) {
    return (
      <ModuleDisabledCard
        moduleTitle="Тесты & Опросы"
        moduleDesc="Конструктор и прохождение тестов временно отключены администрацией лицея."
        isAdmin={session?.user?.role === "ADMIN"}
      />
    );
  }
  return <>{children}</>;
}

