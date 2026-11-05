import { auth } from "@/lib/auth";
import { isModuleDisabled } from "@/lib/feature-guard";
import { ModuleDisabledCard } from "@/components/module-disabled-card";

export default async function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const disabled = await isModuleDisabled("feature_assignments");
  if (disabled) {
    return (
      <ModuleDisabledCard
        moduleTitle="Домашние задания"
        moduleDesc="Раздел выдачи и проверки домашних заданий временно отключен администрацией лицея."
        isAdmin={session?.user?.role === "ADMIN"}
      />
    );
  }
  return <>{children}</>;
}

