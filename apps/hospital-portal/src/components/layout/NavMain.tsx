"use client"

import { ChevronRight } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface MenuItem {
    id: string;
    label: string;
    path: string;
    icon: React.ComponentType<any>;
    roles?: string[];
}

interface MenuSection {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    items: MenuItem[];
    roles?: string[];
}

export function NavMain({
    items,
}: {
    items: MenuSection[]
}) {
    return (
        <>
            {items.map((section) => (
                <SidebarGroup key={section.id}>
                    <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                    <SidebarMenu>
                        {section.items?.map((menuItem) => (
                            <SidebarMenuItem key={menuItem.id}>
                                <SidebarMenuButton asChild>
                                    <a href={menuItem.path}>
                                        {menuItem.icon && <menuItem.icon />}
                                        <span>{menuItem.label}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    )
}