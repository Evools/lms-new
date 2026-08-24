"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

export interface NavGroupItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  badge?: string;
  items?: {
    title: string;
    url: string;
  }[];
}

export interface NavMainSection {
  groupLabel?: string;
  items: NavGroupItem[];
}

function checkIsActive(currentPath: string, targetUrl: string) {
  if (!targetUrl) return false;
  if (targetUrl === "/dashboard") {
    return currentPath === "/dashboard";
  }
  return currentPath === targetUrl || currentPath.startsWith(`${targetUrl}/`);
}

function NavMainCollapsibleItem({
  item,
  isCurrentActive,
  pathname,
  isCollapsed,
}: {
  item: NavGroupItem;
  isCurrentActive: boolean;
  pathname: string;
  isCollapsed: boolean;
}) {
  const [open, setOpen] = useState(isCurrentActive);

  useEffect(() => {
    if (isCurrentActive) {
      setOpen(true);
    }
  }, [isCurrentActive]);

  // In collapsed icon mode: render a DropdownMenu so sub-items can be accessed in 1 click!
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                isActive={isCurrentActive}
                tooltip={item.title}
                className="rounded-md font-medium text-xs h-8 px-0 justify-center transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
              />
            }
          >
            <span
              className={`shrink-0 flex items-center justify-center transition-colors ${
                isCurrentActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.icon}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="min-w-48 p-1.5 rounded-xl text-xs shadow-lg border bg-popover text-popover-foreground z-50"
          >
            <DropdownMenuLabel className="text-xs font-semibold px-2 py-1 text-muted-foreground">
              {item.title}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            {item.items?.map((subItem) => {
              const isSubActive = checkIsActive(pathname, subItem.url);
              return (
                <DropdownMenuItem
                  key={subItem.title}
                  render={
                    <Link
                      href={subItem.url}
                      className={`text-xs flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                        isSubActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    />
                  }
                >
                  <span>{subItem.title}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  // In expanded mode: render standard accordion
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            isActive={isCurrentActive}
            tooltip={item.title}
            className="rounded-md font-medium text-xs h-8 px-2.5 transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
          />
        }
      >
        <span
          className={`shrink-0 flex items-center justify-center transition-colors ${
            isCurrentActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {item.icon}
        </span>
        <span className="truncate">{item.title}</span>
        {item.badge && (
          <Badge
            variant="secondary"
            className="ml-auto text-[9px] px-1 py-0 font-medium shrink-0"
          >
            {item.badge}
          </Badge>
        )}
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 text-muted-foreground shrink-0 h-3.5 w-3.5" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub className="my-1 border-l border-primary/20 pl-2 ml-3.5 space-y-0.5">
          {item.items?.map((subItem) => {
            const isSubActive = checkIsActive(pathname, subItem.url);
            return (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  isActive={isSubActive}
                  className="rounded-md text-xs h-7 px-2 font-normal transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-normal text-muted-foreground hover:text-foreground"
                  render={<Link href={subItem.url} />}
                >
                  <span className="truncate">{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function NavMain({
  sections,
}: {
  sections: NavMainSection[];
}) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <>
      {sections.map((section, sectionIdx) => (
        <SidebarGroup key={section.groupLabel || sectionIdx} className="py-1">
          {section.groupLabel && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 py-1 select-none group-data-[collapsible=icon]:hidden">
              {section.groupLabel}
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="space-y-0.5">
            {section.items.map((item) => {
              const hasSubItems = item.items && item.items.length > 0;
              const isDirectActive = checkIsActive(pathname, item.url);
              const isChildActive =
                item.items?.some((sub) => checkIsActive(pathname, sub.url)) ?? false;
              const isCurrentActive = isDirectActive || isChildActive;

              if (!hasSubItems) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isDirectActive}
                      tooltip={item.title}
                      className="rounded-md font-medium text-xs h-8 px-2.5 transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                      render={<Link href={item.url} />}
                    >
                      <span
                        className={`shrink-0 flex items-center justify-center transition-colors ${
                          isDirectActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={isDirectActive ? "default" : "secondary"}
                          className={`ml-auto text-[9px] px-1.5 py-0 font-medium shrink-0 group-data-[collapsible=icon]:hidden ${
                            isDirectActive ? "bg-primary text-primary-foreground" : ""
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <NavMainCollapsibleItem
                  key={item.title}
                  item={item}
                  isCurrentActive={isCurrentActive}
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                />
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
