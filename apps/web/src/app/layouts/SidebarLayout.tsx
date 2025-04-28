import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useDarkMode } from 'usehooks-ts';
import { SidebarProvider } from './contexts/SidebarContext';
import { useDeviceType } from './hook';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileBottomNav from './BottomTabs';
import { Capacitor } from '@capacitor/core'; // You'll need to install this dependency
import { useSelector } from 'react-redux';
import { selectStaffType, selectUser } from '../features/auth/AuthSlice';
import { cn } from '@/lib/util';

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

    // Only show sidebar on desktop
    const showSidebar = isDesktop;

    // Show bottom tabs on mobile AND tablet for care staff
    const showBottomTabs = (isMobile || isTablet) && isCareStaff;

    const isIOS = Capacitor.getPlatform() === 'ios';

    return (
        <SidebarProvider>
            <div className="flex bg-background min-h-screen">
                {/* Sidebar - Only show on desktop */}
                <aside>
                    <Sidebar />
                </aside>

                {/* Main content area */}
                <main
                    className={cn(
                        'flex-1 flex flex-col',
                        // Add margin only when sidebar is shown
                        showSidebar && 'ml-[80px] flex-1 flex flex-col'
                    )}
                >
                    <header className="fixed top-0 left-0 right-0 h-[64px] z-30">
                        <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                    </header>

                    <div
                        className={cn(
                            'overflow-y-auto pt-[70px] pb-2',
                            // Add bottom padding only when bottom tabs are shown
                            Capacitor.isNativePlatform() &&
                            `pt-[70px] ${showBottomTabs ? 'pb-[60px]' : ''}`,
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
                </main>
            </div>

            {/* Portal container for modals */}
            <div id="modal-root" className="relative z-50" />
        </SidebarProvider>
    );
};

export default SidebarLayout;