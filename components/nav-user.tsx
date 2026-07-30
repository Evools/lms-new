"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/app/actions/auth";
import {
  ChevronsUpDown,
  LogOut,
  Shield,
  UserCheck,
  GraduationCap,
  User,
  Settings,
} from "lucide-react";
import Link from "next/link";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
    role: "ADMIN" | "TEACHER" | "STUDENT";
  };
}) {
  const { isMobile } = useSidebar();

  const roleConfigs = {
    ADMIN: { label: "Администратор", variant: "default" as const, icon: Shield },
    TEACHER: { label: "Преподаватель", variant: "secondary" as const, icon: UserCheck },
    STUDENT: { label: "Студент", variant: "outline" as const, icon: GraduationCap },
  };

  const currentRole = roleConfigs[user.role] || roleConfigs.STUDENT;
  const RoleIcon = currentRole.icon;

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-md"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-md shrink-0">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="rounded-md text-xs font-semibold">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium text-foreground">{user.name}</span>
              <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-md"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 px-2 py-2 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-md shrink-0">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    <AvatarFallback className="rounded-md text-xs font-semibold">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                    <span className="truncate font-semibold text-foreground">{user.name}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
                    <div className="mt-1">
                      <Badge variant={currentRole.variant} className="text-[10px] px-1.5 py-0 rounded-md gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {currentRole.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                <User className="mr-2 h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => logoutAction()}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти из системы
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
