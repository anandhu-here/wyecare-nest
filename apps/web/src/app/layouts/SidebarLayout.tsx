// SidebarLayout.tsx
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useDarkMode } from 'usehooks-ts';
import { Capacitor } from '@capacitor/core';
import { useSelector } from 'react-redux';
import { selectStaffType, selectUser } from '../features/auth/AuthSlice';
import { cn } from '@/lib/util';

// Import new UI components
import { AppSidebar } from '@/app/layouts/shadcn-sidebar/app-sidebar';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

// Import your existing header component
import Header from './Header';
import MobileBottomNav from './BottomTabs';

interface SidebarLayoutProps {
    children?: ReactNode;
}

export const SidebarLayout = ({ children }: SidebarLayoutProps) => {
    const { isDarkMode, toggle: toggleDarkMode } = useDarkMode();
    const { isMobile, isTablet, isDesktop } = useDeviceType();
    const user = useSelector(selectUser);
    const staffType = useSelector(selectStaffType);
    console.log('user', user);
    console.log('staffType', staffType);
    const isCareStaff = staffType === 'care';

    // Show bottom tabs on mobile AND tablet for care staff
    const showBottomTabs = (isMobile || isTablet) && isCareStaff;

    const isIOS = Capacitor.getPlatform() === 'ios';

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Current Page</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto flex items-center px-4">
                        {/* Keep your existing header controls here */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {isDarkMode ? 'Light' : 'Dark'}
                        </button>
                    </div>
                </header>

                <div
                    className={cn(
                        'overflow-y-auto p-4',
                        // Add bottom padding only when bottom tabs are shown
                        Capacitor.isNativePlatform() &&
                        `${showBottomTabs ? 'pb-[60px]' : ''}`,
                        // When no bottom tabs, just account for header
                        !Capacitor.isNativePlatform() &&
                        `${showBottomTabs ? 'pb-[70px]' : 'pb-[0px]'}`,
                        isIOS && 'mt-[env(safe-area-inset-top)]'
                    )}
                >
                    {children || <Outlet />}
                </div>

                {/* Bottom Navigation - Show on mobile and tablet for care staff */}
                {showBottomTabs && (
                    <nav className="fixed bottom-0 left-0 right-0 h-[60px] z-30">
                        <MobileBottomNav />
                    </nav>
                )}
            </SidebarInset>

            {/* Portal container for modals */}
            <div id="modal-root" className="relative z-50" />
        </SidebarProvider>
    );
};

export default SidebarLayout;

// Utility hook for device type
export const useDeviceType = () => {
    const [width, setWidth] = React.useState(window.innerWidth);

    React.useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
    };
};