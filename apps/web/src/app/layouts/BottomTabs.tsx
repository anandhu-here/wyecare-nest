import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebarMenu } from './SidebarMenu/context';
import { cn } from '@/lib/util';

const MobileBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { menuItems } = useSidebarMenu();

    // Display only the first 4-5 menu items in the bottom nav
    const bottomNavItems = menuItems.slice(0, 5);

    return (
        <div className="h-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-around px-2">
            {bottomNavItems.map((item, index) => {
                const isActive = location.pathname === item.link;

                return (
                    <button
                        key={index}
                        onClick={() => item.link && navigate(item.link)}
                        className="flex flex-col items-center justify-center w-16 h-full"
                    >
                        <div className="relative">
                            {item.badgeContent && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                    {item.badgeContent}
                                </span>
                            )}
                            <Icon
                                icon={item.icon}
                                className={cn(
                                    "h-5 w-5",
                                    isActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-600 dark:text-gray-400"
                                )}
                            />
                        </div>
                        <span className={cn(
                            "text-[10px] mt-1",
                            isActive
                                ? "text-blue-600 dark:text-blue-400 font-medium"
                                : "text-gray-600 dark:text-gray-400"
                        )}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default MobileBottomNav;