import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserImageQuotaUsage, listImagesService } from "@/lib/images/service";
import { ImagesAdminView } from "./_components/images-admin-view";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["ADMIN", "TEACHER", "ADMINISTRATION"]);

export default async function ImagesLibraryPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role || "STUDENT";
  if (!ALLOWED_ROLES.has(role)) {
    redirect("/dashboard");
  }

  const [initialImages, initialQuota] = await Promise.all([
    listImagesService({
      userId: session.user.id,
      userRole: role,
      limit: 100,
    }),
    getUserImageQuotaUsage(session.user.id, role),
  ]);

  return (
    <ImagesAdminView
      initialImages={initialImages}
      initialQuota={initialQuota}
      userRole={role}
    />
  );
}
