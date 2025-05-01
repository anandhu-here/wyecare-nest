import React, { useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/util';
import { useMenu } from './Provider';

interface SidebarMenuItemProps {
    id: string;
    label: string;
    icon: string;
    link?: string;
    badgeContent?: string | number;
    isDrawer?: boolean;
    isActive?: boolean;
    onClick?: (link: string | undefined) => void;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
    label,
    icon,
    link,
    badgeContent,
    isDrawer = false,
    isActive = false,
    onClick
}) => {
    const handleClick = (e: React.MouseEvent) => {
        console.log("Clicked link:", link);

        if (onClick && link) {
            onClick(link);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "relative transition-all duration-200 rounded-lg",
                isDrawer
                    ? "flex items-center w-full px-4 py-2.5 my-1"
                    : "flex flex-col items-center justify-center w-[64px] h-14 mx-auto my-[2px]",
                isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
        >
            {/* Icon & Badge */}
            <div className="relative flex items-center justify-center">
                {badgeContent && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {badgeContent}
                    </span>
                )}

                <Icon
                    icon={icon}
                    className={cn(
                        "w-5 h-5",
                        isActive ? "text-white" : "text-gray-700 dark:text-gray-300"
                    )}
                />
            </div>

            {/* Label */}
            <span
                className={cn(
                    isDrawer ? "ml-3 text-sm" : "text-[11px] mt-1",
                    isActive ? "text-white" : "text-gray-700 dark:text-gray-300",
                    !isDrawer && "font-medium"
                )}
            >
                {label}
            </span>
        </button>
    );
};

interface SidebarContentProps {
    isDrawer?: boolean;
    onLinkClick?: () => void; // Optional callback to close drawer when clicked
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
    isDrawer = false,
    onLinkClick
}) => {
    const { menuItems } = useMenu();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const handleItemClick = (link: string | undefined) => {
        console.log("SidebarContent - Clicked link:", link);
        if (link) {
            console.log("SidebarContent - Navigating to:", link);
            navigate(link);

            // If we're in drawer mode and have a callback, call it (to close the drawer)
            if (isDrawer && onLinkClick) {
                onLinkClick();
            }
        } else {
            console.log("SidebarContent - Link is undefined, not navigating");
        }
    };
    // Check if a menu item is active
    const isItemActive = (link: string | undefined) => {
        if (!link) return false;

        // Exact match case
        if (currentPath === link) return true;

        // Special case for dashboard home
        if (link === '/dashboard' &&
            (currentPath === '/dashboard' || currentPath === '/' || currentPath === '')) {
            return true;
        }

        // Nested routes case (but not for dashboard)
        if (link !== '/dashboard' && currentPath.startsWith(`${link}/`)) {
            return true;
        }

        return false;
    };

    useEffect(() => {
        console.log("SidebarContent - menuItems received:", menuItems);
    }, [menuItems]);


    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col">
                {/* Logo only shown in drawer mode, not in desktop sidebar */}
                {isDrawer && (
                    <div className="flex justify-start px-2 py-4">
                        <img
                            src="/assets/logo.png" // Update with actual logo path
                            alt="logo"
                            className="w-24"
                        />
                    </div>
                )}

                {/* Menu */}
                <div className={cn(
                    "w-full flex flex-col",
                    isDrawer ? "px-2 py-4" : "px-1 py-2"
                )}>
                    {menuItems.map((item: any, index) => (
                        <SidebarMenuItem
                            key={`${item.id || index}`}
                            id={item.id || `menu-item-${index}`}
                            label={item.label}
                            icon={item.icon}
                            link={item.link}
                            badgeContent={item.badgeContent}
                            isDrawer={isDrawer}
                            isActive={isItemActive(item.link)}
                            onClick={handleItemClick}
                        />
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
};