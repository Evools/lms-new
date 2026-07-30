import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, email, role } = session.user;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        user={{
          name: name ?? "Пользователь",
          email: email ?? "",
          role: role ?? "STUDENT",
        }}
      />
      <SidebarInset className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="rounded-md" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-xs font-medium text-muted-foreground">Цифровая экосистема лицея</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground border px-2 py-0.5 rounded-md">
              ИС-1-25
            </span>
          </div>
        </header>

        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
