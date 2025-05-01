
// Sidebar.tsx
import React, { useContext } from 'react';
import { SidebarContext } from './contexts/SidebarContext';
import { useDeviceType } from './hook';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarContent } from './SidebarContent';
import { cn } from '@/lib/util';

const SIDEBAR_WIDTH = '90px';

const Sidebar = () => {
    const { sidebarToggle, toggleSidebar } = useContext(SidebarContext);
    const { isDesktop } = useDeviceType();

    // Only show fixed sidebar on desktop
    const showSidebar = isDesktop;

    return (
        <>
            {/* Desktop Sidebar - positioned below header */}
            {showSidebar && (
                <div className={cn(
                    "fixed left-0 z-30",
                    "top-[64px]",
                    `w-[${SIDEBAR_WIDTH}]`,
                    "h-[calc(100vh-64px)]", // Full height minus header
                    "dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 bg-white"
                )}>
                    <SidebarContent />
                </div>
            )}

            {/* Mobile Drawer */}
            <Sheet open={sidebarToggle} onOpenChange={toggleSidebar}>
                <SheetContent side="left" className="p-0 w-60 [&>button:first-child]:hidden">
                    <SidebarContent isDrawer={true} />
                </SheetContent>
            </Sheet>
        </>
    );
};

export default React.memo(Sidebar);