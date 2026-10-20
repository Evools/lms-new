import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDocumentsAction } from "./actions";
import { DocumentsWorkflowView } from "./_components/documents-workflow-view";

export const metadata = {
  title: "Документооборот и отчётность | Лицей LMS",
  description: "Автоматизированное формирование, согласование и архив документов лицея",
};

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "STUDENT") redirect("/dashboard");

  const data = await getDocumentsAction();

  return (
    <DocumentsWorkflowView
      documents={data.documents}
      canManage={data.canManage}
      availableGroups={data.groups}
      groupDetails={data.groupDetails}
      availableStudents={data.students}
      currentUser={data.currentUser}
    />
  );
}
