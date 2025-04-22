import React, { useContext } from 'react';
import SidebarMenu from './SidebarMenu';
import { SidebarContext } from './contexts/SidebarContext';
import { SidebarMenuProvider } from './SidebarMenu/context';
import { useDeviceType } from './hook';
import { ScrollArea } from "@/components/ui/scroll-area"; // Adjust path as needed
import { Sheet, SheetContent } from "@/components/ui/sheet"; // Adjust path as needed
import { cn } from '@/lib/util';

// Import your logo
// import Logo from '@/assets/logos/logo.png'; // Adjust path as needed

const SIDEBAR_WIDTH = '90px';

const SidebarContent = ({ isDrawer = false }) => {
    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col">
                {/* Logo only shown in drawer mode, not in desktop sidebar */}
                {isDrawer && (
                    <div className="flex justify-start px-2 py-4">
                        <img
                            src="/path/to/logo.png" // Update with actual logo path
                            alt="logo"
                            className="w-24"
                        />
                    </div>
                )}

                {/* Menu */}
                <SidebarMenu isDrawer={isDrawer} />
            </div>
        </ScrollArea>
    );
};

const Sidebar = () => {
    const { sidebarToggle, toggleSidebar } = useContext(SidebarContext);
    const { isDesktop } = useDeviceType();

    // Only show fixed sidebar on desktop
    const showSidebar = isDesktop;

    return (
        <SidebarMenuProvider>
            {/* Desktop Sidebar - now positioned below header */}
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
        </SidebarMenuProvider>
    );
};

export default React.memo(Sidebar);