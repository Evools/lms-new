import { getFeatureModulesAction } from "@/app/dashboard/settings/actions";
import type { FeatureModulesDTO } from "@/lib/feature-modules";

export async function isModuleDisabled(featureKey: keyof FeatureModulesDTO): Promise<boolean> {
  const mods = await getFeatureModulesAction();
  if (featureKey === "feature_typing" || featureKey === "feature_playground" || featureKey === "feature_git") {
    return !mods.feature_interactive || !mods[featureKey];
  }
  return !mods[featureKey];
}

