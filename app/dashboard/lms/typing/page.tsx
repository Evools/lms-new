import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTypingDataAction } from "./actions";
import { TypingView } from "./_components/typing-view";

export const metadata = {
  title: "Клавиатурный тренажер | Лицей LMS",
  description: "Интерактивный тренажер слепой печати и норматив скорости ввода для студентов лицея",
};

interface TypingPageProps {
  searchParams: Promise<{ group?: string }>;
}

export default async function TypingPage({ searchParams }: TypingPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { group } = await searchParams;
  const data = await getTypingDataAction(group);

  if (!data) {
    redirect("/dashboard");
  }

  return <TypingView initialData={data} />;
}

