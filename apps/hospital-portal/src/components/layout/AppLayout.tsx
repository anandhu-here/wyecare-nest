import React, { ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser } from '@/features/auth/authSlice';


// Import sidebar components
import { AppSidebar } from './Sidebar';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';

// Import breadcrumb components
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { Separator } from '@/components/ui/separator';

// Import additional components for the header
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    Bell,
    Moon,
    Sun,
    Menu,
    Search,
    User
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '../ui/theme-provider';


interface AppLayoutProps {
    children?: ReactNode;
}

// Get the page title from the current path
const getPageTitle = (path: string): string => {
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'Dashboard';

    // Get the last segment and format it
    const lastSegment = pathSegments[pathSegments.length - 1];
    return lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Get breadcrumb items from path
const getBreadcrumbItems = (path: string): { label: string; path: string }[] => {
    const pathSegments = path.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/dashboard' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
        if (segment === 'dashboard') return; // Skip dashboard segment

        currentPath += `/${segment}`;
        const label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
};
function ModeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


export function AppLayout({ children }: AppLayoutProps) {
    const { setTheme } = useTheme()
    const location = useLocation();
    const navigate = useNavigate();
    const currentUser = useAppSelector(selectCurrentUser);

    // Light/dark mode toggle (placeholder)
    const [isDark, setIsDark] = React.useState(false);
    const toggleTheme = () => setIsDark(!isDark);

    // Get page title and breadcrumbs
    const pageTitle = getPageTitle(location.pathname);
    const breadcrumbItems = getBreadcrumbItems(location.pathname);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background">
                <header className="flex h-16 shrink-0 items-center border-b bg-background px-4 transition-[width,height] ease-linear">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbItems.map((item, index) => (
                                    <React.Fragment key={item.path}>
                                        {index === breadcrumbItems.length - 1 ? (
                                            <BreadcrumbItem>
                                                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                            </BreadcrumbItem>
                                        ) : (
                                            <BreadcrumbItem>
                                                <BreadcrumbLink href={item.path}>
                                                    {item.label}
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                        )}
                                        {index < breadcrumbItems.length - 1 && (
                                            <BreadcrumbSeparator />
                                        )}
                                    </React.Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <div className="relative ml-auto hidden sm:flex w-full max-w-sm items-center lg:max-w-md">
                        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="w-full pl-8 bg-background border-muted"
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <ModeToggle />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full relative"
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                                        3
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <div className="p-4">
                                    <h3 className="font-medium">Notifications</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        You have 3 unread notifications
                                    </p>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex gap-4 p-2 rounded-lg hover:bg-muted">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm">New user invitation</p>
                                                <p className="text-xs text-muted-foreground">3 minutes ago</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 p-2 rounded-lg hover:bg-muted">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Bell className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm">System update scheduled</p>
                                                <p className="text-xs text-muted-foreground">1 hour ago</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 mx-auto ">
                        {children || <Outlet />}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AppLayout;