import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlaygroundView } from "./_components/playground-view";
import { getFeatureModulesAction } from "@/app/dashboard/settings/actions";

export const metadata = {
  title: "Web Code Playground | Лицей LMS",
  description: "Интерактивная песочница HTML, CSS и JavaScript с живым предпросмотром и веб-консолью",
};

export default async function PlaygroundPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const featureModules = await getFeatureModulesAction();
  if (!featureModules.feature_interactive || !featureModules.feature_playground) {
    redirect("/dashboard");
  }

  return <PlaygroundView />;
}

