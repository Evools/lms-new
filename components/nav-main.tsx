"use client";

import React, { useState } from "react";
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
            className="rounded-lg font-medium text-xs h-8.5 px-2.5 transition-all data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
          />
        }
      >
        <span className="shrink-0 text-muted-foreground group-data-[active=true]/collapsible:text-primary transition-colors">
          {item.icon}
        </span>
        <span className="truncate">{item.title}</span>
        {item.badge && (
          <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0 font-normal shrink-0">
            {item.badge}
          </Badge>
        )}
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 text-muted-foreground shrink-0 h-3.5 w-3.5" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub className="my-1 border-l border-primary/20 pl-2 ml-3">
          {item.items?.map((subItem) => {
            const isSubActive = pathname === subItem.url;
            return (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  isActive={isSubActive}
                  className="rounded-md text-xs h-7 px-2 font-medium transition-all data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
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
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-1 select-none">
              {section.groupLabel}
            </SidebarGroupLabel>
          )}
          <SidebarMenu>
            {section.items.map((item) => {
              const hasSubItems = item.items && item.items.length > 0;
              const isCurrentActive =
                pathname === item.url ||
                (item.items?.some((sub) => pathname === sub.url) ?? false);

              if (!hasSubItems) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isCurrentActive}
                      tooltip={item.title}
                      className="rounded-lg font-medium text-xs h-8.5 px-2.5 transition-all data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                      render={<Link href={item.url} />}
                    >
                      <span className={`shrink-0 transition-colors ${isCurrentActive ? "text-primary" : "text-muted-foreground"}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={isCurrentActive ? "default" : "secondary"}
                          className={`ml-auto text-[9px] px-1.5 py-0 font-medium shrink-0 ${
                            isCurrentActive ? "bg-primary text-primary-foreground" : ""
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
