import React from 'react';
import { Icon } from '@iconify/react';
import { useSidebarMenu } from './context';
import { cn } from '@/lib/util';

const SidebarMenuItem = ({ item, isDrawer = false }: any) => {
    const { selectedPath, handleItemClick } = useSidebarMenu();

    // More precise selection logic that prevents "/" or "/dashboard" from matching everything
    const isSelected =
        // Exact match case
        selectedPath === item.link ||
        // Nested routes case with special handling for home/dashboard
        (item.link &&
            item.link !== '/dashboard' && // Special case for dashboard home link
            selectedPath.startsWith(`${item.link}/`));

    // Special case for home/dashboard - only select if it's exactly /dashboard or empty
    const isDashboardHome = item.link === '/dashboard' &&
        (selectedPath === '/dashboard' ||
            selectedPath === '/' ||
            selectedPath === '');

    return (
        <button
            onClick={(e) => { e.preventDefault(); handleItemClick(item); }}
            className={cn(
                "relative transition-all duration-200 rounded-lg",
                isDrawer
                    ? "flex items-center w-full px-4 py-2.5 my-1"
                    : "flex flex-col items-center justify-center w-[64px] h-14 mx-auto my-[2px]",
                (isSelected || isDashboardHome)
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
        >
            {/* Icon & Badge */}
            <div className="relative flex items-center justify-center">
                {item.badgeContent && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {item.badgeContent}
                    </span>
                )}

                <Icon
                    icon={item.icon}
                    className={cn(
                        "w-5 h-5",
                        (isSelected || isDashboardHome) ? "text-white" : "text-gray-700 dark:text-gray-300"
                    )}
                />
            </div>

            {/* Label */}
            <span
                className={cn(
                    isDrawer ? "ml-3 text-sm" : "text-[11px] mt-1",
                    (isSelected || isDashboardHome) ? "text-white" : "text-gray-700 dark:text-gray-300",
                    !isDrawer && "font-medium"
                )}
            >
                {item.label}
            </span>
        </button>
    );
};

const SidebarMenu = ({ isDrawer = false }) => {
    const { menuItems } = useSidebarMenu();

    return (
        <div className={cn(
            "w-full flex flex-col",
            isDrawer ? "px-2 py-4" : "px-1 py-2"
        )}>
            {menuItems.map((item, index) => (
                <SidebarMenuItem key={index} item={item} isDrawer={isDrawer} />
            ))}
        </div>
    );
};

export default React.memo(SidebarMenu);