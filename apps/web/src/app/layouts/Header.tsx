import React, { useContext } from 'react';
import { Icon } from '@iconify/react';
import { SidebarContext } from './contexts/SidebarContext';
import { useDeviceType } from './hook';
import { Switch } from '@/components/ui/switch'; // Adjust path as needed
import { cn } from '@/lib/util';

interface HeaderProps {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const Header = ({ isDarkMode, toggleDarkMode }: HeaderProps) => {
    const { toggleSidebar } = useContext(SidebarContext);
    const { isDesktop } = useDeviceType();

    return (
        <div className={cn(
            "h-full px-4 border-b bg-background border-border flex items-center justify-between",
            isDesktop ? "pl-4" : "pl-4"
        )}>
            {/* Left side */}
            <div className="flex items-center gap-2">
                {/* Menu toggle for mobile/tablet */}
                {!isDesktop && (
                    <button
                        onClick={toggleSidebar}
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Icon icon="heroicons:bars-3" className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>
                )}

                {/* App title/logo - shown only on desktop */}
                {isDesktop && (
                    <div className="text-lg font-medium">
                        Application
                    </div>
                )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Theme toggle */}
                <div className="flex items-center gap-2">
                    <Icon
                        icon="heroicons:sun"
                        className="h-4 w-4 text-gray-600 dark:text-gray-400"
                    />
                    <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                    <Icon
                        icon="heroicons:moon"
                        className="h-4 w-4 text-gray-600 dark:text-gray-400"
                    />
                </div>

                {/* User profile - placeholder */}
                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            </div>
        </div>
    );
};

export default Header;