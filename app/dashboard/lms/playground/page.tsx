import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlaygroundView } from "./_components/playground-view";

export const metadata = {
  title: "Web Code Playground | Лицей LMS",
  description: "Интерактивная песочница HTML, CSS и JavaScript с живым предпросмотром и веб-консолью",
};

export default async function PlaygroundPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <PlaygroundView />;
}

