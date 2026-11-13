import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getUserImageQuotaUsage,
  listImagesService,
  type ImageQuotaUsage,
  type StoredImageDTO,
} from "@/lib/images/service";
import { getImageQuotaForRole } from "@/lib/images/validation";
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

  const limits = getImageQuotaForRole(role);
  let initialImages: StoredImageDTO[] = [];
  let initialQuota: ImageQuotaUsage = {
    usedBytes: 0,
    usedFiles: 0,
    maxBytes: limits.maxBytes,
    maxFiles: limits.maxFiles,
  };
  let initialError: string | null = null;

  try {
    const [images, quota] = await Promise.all([
      listImagesService({
        userId: session.user.id,
        userRole: role,
        limit: 100,
      }),
      getUserImageQuotaUsage(session.user.id, role),
    ]);
    initialImages = images;
    initialQuota = quota;
  } catch (error) {
    console.error("ImagesLibraryPage load error:", error);
    initialError =
      error instanceof Error
        ? error.message
        : "Не удалось загрузить библиотеку изображений с сервера.";
  }

  return (
    <ImagesAdminView
      initialImages={initialImages}
      initialQuota={initialQuota}
      userRole={role}
      initialError={initialError}
    />
  );
}
