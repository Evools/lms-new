import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

import { NotificationsPopover } from "@/components/notifications-popover";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, email, role, avatar } = session.user;

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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs font-medium">
                    Панель управления
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground border px-2 py-0.5 rounded-md">
              ИС-1-25
            </span>
            <NotificationsPopover />
          </div>
        </header>

        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
