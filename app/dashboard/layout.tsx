import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { AppHeaderBreadcrumbs } from "@/components/app-header-breadcrumbs";
import { NotificationsPopover } from "@/components/notifications-popover";
import { TourTriggerButton } from "@/components/tour-trigger-button";
import { OnboardingTour } from "@/components/onboarding-tour";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id: userId, name, email, role, avatar } = session.user;

  let studentGroupName: string | null = null;
  if (role === "STUDENT") {
    const enrollment = await prisma.groupStudent.findFirst({
      where: { studentId: userId },
      include: { group: { select: { name: true } } },
    });
    studentGroupName = enrollment?.group?.name ?? null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        user={{
          name: name ?? "Пользователь",
          email: email ?? "",
          role: role ?? "STUDENT",
          avatar: avatar ?? null,
        }}
      />
      <SidebarInset className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="rounded-md" />
            <Separator orientation="vertical" className="h-4" />
            <div data-tour="header-breadcrumbs">
              <AppHeaderBreadcrumbs />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {studentGroupName && (
              <span className="text-xs font-mono text-muted-foreground border px-2 py-0.5 rounded-md bg-muted/40 font-medium">
                {studentGroupName}
              </span>
            )}
            <div data-tour="header-notifications">
              <NotificationsPopover />
            </div>
            <TourTriggerButton />
          </div>
        </header>

        <div className="flex-1 p-6" data-tour="dashboard-content">
          {children}
        </div>
      </SidebarInset>

      <OnboardingTour />
    </SidebarProvider>
  );
}
