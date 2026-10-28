import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { AppHeaderBreadcrumbs } from "@/components/app-header-breadcrumbs";
import { NotificationsPopover } from "@/components/notifications-popover";
import { TourTriggerButton } from "@/components/tour-trigger-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingTour } from "@/components/onboarding-tour";
import { TourHubModal } from "@/components/tour-hub-modal";
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

  const [enrollment, unreadNotificationsCount, rawNotifications] = await Promise.all([
    role === "STUDENT" && userId
      ? prisma.groupStudent.findFirst({
          where: { studentId: userId },
          include: { group: { select: { name: true } } },
        })
      : Promise.resolve(null),
    userId
      ? prisma.notification.count({
          where: { userId, isRead: false },
        })
      : Promise.resolve(0),
    userId
      ? prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            message: true,
            link: true,
            type: true,
            isRead: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const studentGroupName = enrollment?.group?.name ?? null;
  const initialNotifications = rawNotifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    link: n.link || undefined,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        user={{
          name: name ?? "Пользователь",
          email: email ?? "",
          role: role ?? "STUDENT",
          avatar: avatar ?? null,
        }}
        className="print:hidden"
      />
      <SidebarInset className="flex min-h-screen flex-col bg-background min-w-0 max-w-full overflow-x-clip print:min-h-0 print:overflow-visible print:p-0 print:m-0 print:border-none print:shadow-none">
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background px-4 print:hidden">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="rounded-md" />
            <Separator orientation="vertical" className="h-4" />
            <div data-tour="header-breadcrumbs">
              <AppHeaderBreadcrumbs />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {studentGroupName && (
              <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-md bg-muted/40 font-medium">
                {studentGroupName}
              </span>
            )}
            <ThemeToggle />
            <div data-tour="header-notifications">
              <NotificationsPopover
                initialUnreadCount={unreadNotificationsCount}
                initialNotifications={initialNotifications}
              />
            </div>
            <TourTriggerButton />
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 min-w-0 max-w-full overflow-x-clip print:p-0 print:m-0 print:overflow-visible" data-tour="dashboard-content">
          {children}
        </div>
      </SidebarInset>

      <div className="print:hidden">
        <OnboardingTour />
        <TourHubModal userRole={role ?? "STUDENT"} />
      </div>
    </SidebarProvider>
  );
}
