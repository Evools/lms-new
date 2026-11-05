import { auth } from "@/lib/auth";
import { isModuleDisabled } from "@/lib/feature-guard";
import { ModuleDisabledCard } from "@/components/module-disabled-card";

export default async function TypingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const disabled = await isModuleDisabled("feature_typing");
  if (disabled) {
    return (
      <ModuleDisabledCard
        moduleTitle="Тренажер печати"
        moduleDesc="Интерактивный клавиатурный тренажер временно отключен администрацией лицея."
        isAdmin={session?.user?.role === "ADMIN"}
      />
    );
  }
  return <>{children}</>;
}

