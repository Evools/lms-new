import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Building2, Shield, UserCheck, GraduationCap } from "lucide-react";

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

  const roleConfigs = {
    ADMIN: { label: "Администратор", variant: "default" as const, icon: Shield },
    TEACHER: { label: "Преподаватель", variant: "secondary" as const, icon: UserCheck },
    STUDENT: { label: "Студент", variant: "outline" as const, icon: GraduationCap },
  };

  const currentRole = roleConfigs[role] || roleConfigs.STUDENT;
  const RoleIcon = currentRole.icon;

  const userInitials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans">
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm tracking-tight">Лицей LMS</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="rounded-md text-xs font-semibold">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium leading-none">{name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{email}</div>
            </div>
            <Badge variant={currentRole.variant} className="rounded-md gap-1">
              <RoleIcon className="h-3 w-3" />
              {currentRole.label}
            </Badge>
          </div>

          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="icon-sm" title="Выйти">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </form>
        </div>
      </header>

      <main className="w-full p-6">{children}</main>
    </div>
  );
}
