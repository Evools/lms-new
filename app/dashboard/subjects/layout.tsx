import { auth } from "@/lib/auth";
import { isModuleDisabled } from "@/lib/feature-guard";
import { ModuleDisabledCard } from "@/components/module-disabled-card";

export default async function SubjectsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const disabled = await isModuleDisabled("feature_subjects");
  if (disabled) {
    return (
      <ModuleDisabledCard
        moduleTitle="Предметы и дисциплины"
        moduleDesc="Каталог учебных предметов и дисциплин временно отключен администрацией лицея."
        isAdmin={session?.user?.role === "ADMIN"}
      />
    );
  }
  return <>{children}</>;
}

