import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listImagesService } from "@/lib/images/service";
import { ImagesAdminView } from "./_components/images-admin-view";

export const dynamic = "force-dynamic";

export default async function AdminImagesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const initialImages = await listImagesService({
    userId: session.user.id,
    userRole: "ADMIN",
    limit: 100,
  });

  return <ImagesAdminView initialImages={initialImages} />;
}

