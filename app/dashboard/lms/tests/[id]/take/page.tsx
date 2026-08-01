import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTestForTakeAction } from "../../../actions";
import { TakeTestView } from "./_components/take-test-view";
import { FileCheck2 } from "lucide-react";

export const metadata = {
  title: "Прохождение теста | Лицей LMS",
  description: "Онлайн-прохождение тестирования на обучающей платформе",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TakeTestPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const res = await getTestForTakeAction(id);

  if (!res.success || !res.test) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
        <FileCheck2 className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">{res.error || "Тест не найден"}</p>
      </div>
    );
  }

  return <TakeTestView test={res.test} />;
}
