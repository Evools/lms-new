import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutLabView } from "./_components/layout-lab-view";

export const metadata = {
  title: "CSS Flexbox & Grid Лаборатория | Лицей LMS",
  description: "Интерактивный тренажёр верстки Flexbox и Grid с живой сценой, визуальными осями и практическими миссиями",
};

export default async function FlexboxPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <LayoutLabView />;
}

