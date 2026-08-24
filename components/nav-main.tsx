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
} from "@/components/ui/sidebar";
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
}: {
  item: NavGroupItem;
  isCurrentActive: boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(isCurrentActive);

  useEffect(() => {
    if (isCurrentActive) {
      setOpen(true);
    }
  }, [isCurrentActive]);

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
            className="rounded-md font-medium text-xs h-8 px-2.5 transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
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
        <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
        {item.badge && (
          <Badge
            variant="secondary"
            className="ml-auto text-[9px] px-1 py-0 font-medium shrink-0 group-data-[collapsible=icon]:hidden"
          >
            {item.badge}
          </Badge>
        )}
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 text-muted-foreground shrink-0 h-3.5 w-3.5 group-data-[collapsible=icon]:hidden" />
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

  return (
    <>
      {sections.map((section, sectionIdx) => (
        <SidebarGroup key={section.groupLabel || sectionIdx} className="py-1">
          {section.groupLabel && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 py-1 select-none">
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
                />
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
