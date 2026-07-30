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
import { ChevronRight } from "lucide-react";

export interface NavGroupItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
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
            className="rounded-md font-medium text-xs h-8.5"
          />
        }
      >
        {item.icon}
        <span>{item.title}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 text-muted-foreground shrink-0 h-3.5 w-3.5" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub className="my-1 border-l border-border/60 pl-2">
          {item.items?.map((subItem) => {
            const isSubActive = pathname === subItem.url;
            return (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  isActive={isSubActive}
                  className="rounded-md text-xs h-7"
                  render={<Link href={subItem.url} />}
                >
                  <span>{subItem.title}</span>
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
        <SidebarGroup key={section.groupLabel || sectionIdx}>
          {section.groupLabel && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 py-1">
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
                      className="rounded-md font-medium text-xs h-8.5"
                      render={<Link href={item.url} />}
                    >
                      {item.icon}
                      <span>{item.title}</span>
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
