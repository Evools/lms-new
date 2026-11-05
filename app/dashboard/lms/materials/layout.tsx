import { auth } from "@/lib/auth";
import { isModuleDisabled } from "@/lib/feature-guard";
import { ModuleDisabledCard } from "@/components/module-disabled-card";

export default async function MaterialsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const disabled = await isModuleDisabled("feature_materials");
  if (disabled) {
    return (
      <ModuleDisabledCard
        moduleTitle="Учебные материалы"
        moduleDesc="Электронная библиотека учебных пособий и лекций временно отключена администрацией лицея."
        isAdmin={session?.user?.role === "ADMIN"}
      />
    );
  }
  return <>{children}</>;
}

