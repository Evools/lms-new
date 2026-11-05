import { auth } from "@/lib/auth";
import { isModuleDisabled } from "@/lib/feature-guard";
import { ModuleDisabledCard } from "@/components/module-disabled-card";

export default async function PracticeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const disabled = await isModuleDisabled("feature_practice");
  if (disabled) {
    return (
      <ModuleDisabledCard
        moduleTitle="База практики"
        moduleDesc="Раздел производственной практики и договоров временно отключен администрацией лицея."
        isAdmin={session?.user?.role === "ADMIN"}
      />
    );
  }
  return <>{children}</>;
}

