// app-sidebar.tsx
"use client"

import * as React from "react"
import { useEffect, useMemo } from "react"
import { ChevronRight, GalleryVerticalEnd, LucideIcon } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"

// Import your existing redux selectors

// Import the shadcn sidebar components
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    useSidebar
} from "@/components/ui/sidebar"

// Import your avatar components
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

// Import dropdown menu components
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import necessary UI icons
import {
    ChevronsUpDown,
    LogOut,
    Home,
    Users,
    FileText,
    Settings,
    Calendar,
    ShoppingCart,
    CreditCard,
    ClipboardList,
    BarChart2,
    User,
    Activity
} from "lucide-react"

// Import collapsible components
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Import your menu configuration and type definitions
import { menuConfig } from '@wyecare-monorepo/web-ui'
import { OrganizationCategory } from '@wyecare-monorepo/web-ui'
import { selectCurrentOrganization, selectUser } from "@/app/features/auth/AuthSlice"

// Function to get icon component from string name
const getIconComponent = (iconName: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
        'home': Home,
        'users': Users,
        'file-text': FileText,
        'settings': Settings,
        'calendar': Calendar,
        'shopping-cart': ShoppingCart,
        'credit-card': CreditCard,
        'clipboard-list': ClipboardList,
        'bar-chart-2': BarChart2,
        'user': User,
        'activity': Activity,
        // Add more icon mappings as needed
    }

    return iconMap[iconName] || Home // Default to Home icon if not found
}

// NavMenuItem Component (replaces the SidebarMenuItem from your old implementation)
const NavMenuItem = ({
    item,
    isActive = false
}: {
    item: any,
    isActive?: boolean
}) => {
    const navigate = useNavigate()
    const { isMobile } = useSidebar()

    // Get the icon component
    const IconComponent = getIconComponent(item.icon)

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (item.path) {
            navigate(item.path)
        }
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                tooltip={item.label}
                isActive={isActive}
                onClick={handleClick}
            >
                <IconComponent />
                <span>{item.label}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

// NavSection Component (displays a section of menu items)
const NavSection = ({
    section,
    currentPath
}: {
    section: any,
    currentPath: string
}) => {
    return (
        <Collapsible asChild defaultOpen className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={section.label}>
                        {section.icon && getIconComponent(section.icon)}
                        <span>{section.label}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {section.items.map((item: any) => (
                            <SidebarMenuSubItem key={item.id}>
                                <SidebarMenuSubButton
                                    isActive={currentPath === item.path}
                                    asChild
                                >
                                    <a href={item.path} onClick={(e) => {
                                        e.preventDefault()
                                        navigate(item.path)
                                    }}>
                                        <span>{item.label}</span>
                                    </a>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
}

// User Profile Component (for the sidebar footer)
const UserProfile = ({ user }: { user: any }) => {
    const { isMobile } = useSidebar()

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                                <AvatarFallback className="rounded-lg">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user?.firstName} {user?.lastName}</span>
                                <span className="truncate text-xs">{user?.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user?.avatar} alt={user?.firstName} />
                                    <AvatarFallback className="rounded-lg">
                                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user?.firstName} {user?.lastName}</span>
                                    <span className="truncate text-xs">{user?.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => navigate('/dashboard/settings/profile')}>
                                <User />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                                <Settings />
                                Settings
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                            // Add your logout logic here
                            console.log('Logging out...')
                        }}>
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

// Main AppSidebar Component
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const navigate = useNavigate()
    const location = useLocation()
    const currentPath = location.pathname

    // Get user and organization from Redux
    const user = useSelector(selectUser)
    const currentOrganization = useSelector(selectCurrentOrganization)

    // Determine the organization category
    const organizationCategory = useMemo(() => {
        if (currentOrganization?.category) {
            return currentOrganization.category as OrganizationCategory
        }

        // Legacy support - map from type to category
        if (currentOrganization?.type === 'agency') {
            return OrganizationCategory.SERVICE_PROVIDER
        } else if (currentOrganization?.type === 'home') {
            return OrganizationCategory.CARE_HOME
        }

        return OrganizationCategory.OTHER
    }, [currentOrganization])

    // Filter menu sections based on organization category and user role
    const filteredSections = useMemo(() => {
        const sections: any[] = []

        menuConfig.sections.forEach(section => {
            // Check if section applies to this organization category
            if (!section.organizationCategories.includes("*" as never) &&
                !section.organizationCategories.includes(organizationCategory as never)) {
                return
            }

            // Filter items within this section
            const filteredItems = section.items.filter((item: any) => {
                // Skip items not meant for this user's role
                if (item.roles && !item.roles.includes(user?.role)) {
                    return false
                }

                // Skip items not meant for this organization category
                if (item.organizationCategories &&
                    !item.organizationCategories.includes("*" as any) &&
                    !item.organizationCategories.includes(organizationCategory)) {
                    return false
                }

                return true
            }).map((item: any) => ({
                ...item,
                // Use path for navigation
                path: item.path,
                // Apply category-specific label if available
                label: item.categoryLabels?.[organizationCategory] || item.label
            }))

            // Only include sections with items
            if (filteredItems.length > 0) {
                sections.push({
                    ...section,
                    // Apply category-specific label if available
                    label: section.categoryLabels?.[organizationCategory] || section.label,
                    items: filteredItems
                })
            }
        })

        return sections.sort((a, b) => (a.order || 0) - (b.order || 0))
    }, [menuConfig, organizationCategory, user?.role])

    // Log filtered sections for debugging
    useEffect(() => {
        console.log('Filtered Sections:', filteredSections)
    }, [filteredSections])

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>

                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <GalleryVerticalEnd className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold"> {currentOrganization?.name || 'Dashboard'}</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Render main sections */}
                {filteredSections.map(section => (
                    <SidebarGroup key={section.id}>
                        <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                        <SidebarMenu>
                            {section.items.map((item: any) => (
                                <NavMenuItem
                                    key={item.id}
                                    item={item}
                                    isActive={currentPath === item.path}
                                />
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <UserProfile user={user} />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}