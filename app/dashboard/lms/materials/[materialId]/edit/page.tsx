import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMaterialsDataAction, getMaterialForEditAction } from "@/app/dashboard/lms/actions";
import { EditMaterialView } from "./_components/edit-material-view";

interface EditMaterialPageProps {
  params: Promise<{
    materialId: string;
  }>;
  searchParams: Promise<{
    group?: string;
  }>;
}

export default async function EditMaterialPage({ params, searchParams }: EditMaterialPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    redirect("/dashboard/lms/materials");
  }

  const { materialId } = await params;
  const { group: groupQuery } = await searchParams;

  const matRes = await getMaterialForEditAction(materialId);
  if (!matRes.success || !matRes.material) {
    notFound();
  }

  const initialMaterial = matRes.material;
  const selectedGroupId = groupQuery || initialMaterial.groupId;

  const data = await getMaterialsDataAction(selectedGroupId);

  return (
    <EditMaterialView
      initialMaterial={initialMaterial}
      groups={data.groups}
      topics={data.topics}
    />
  );
}
