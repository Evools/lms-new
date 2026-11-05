import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GitSimulatorView } from "./_components/git-simulator-view";

export const metadata = {
  title: "Git-симулятор: интерактивный тренажёр ветвления | Лицей LMS",
  description: "Практический обучающий симулятор Git с терминалом, живым деревом веток и пошаговыми уроками",
};

export default async function GitSimulatorPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <GitSimulatorView />;
}

