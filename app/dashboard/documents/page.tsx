import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDocumentsAction } from "./actions";
import { DocumentsView } from "./_components/documents-view";

export const metadata = {
  title: "Документы лицея | Лицей LMS",
  description: "Методички, положения, инструкции, шаблоны и другие документы лицея",
};

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getDocumentsAction();

  return (
    <DocumentsView
      documents={data.documents}
      canManage={data.canManage}
    />
  );
}
