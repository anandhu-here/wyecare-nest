import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from '@/app/hooks';
import { logout, selectCurrentUser } from '@/features/auth/authSlice';
import {
    ChevronRight,
    ChevronsUpDown,
    LogOut,
    Settings,
    User as UserIcon,
    LayoutDashboard,
    Users,
    Building,
    Shield,
    KeyRound,
    Calendar,
    ClipboardList,
    FileText,
    Clock,
    Activity,
    Plus,
    LucideIcon
} from "lucide-react";

// Import the sidebar components
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
} from "@/components/ui/sidebar";

// Import avatar components
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

// Import dropdown menu components
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import collapsible components
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDispatch } from "react-redux";
import { NavMain } from "./NavMain";

// Menu item type definition
interface MenuItem {
    id: string;
    label: string;
    path: string;
    icon: any;
    roles?: string[];
}

// Menu section type definition
interface MenuSection {
    id: string;
    label: string;
    icon: any;
    items: MenuItem[];
    roles?: string[];
}

// Function to get icon component from string name
const getIconComponent = (iconName: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
        'dashboard': LayoutDashboard,
        'users': Users,
        'organizations': Building,
        'roles': Shield,
        'permissions': KeyRound,
        'appointments': Calendar,
        'patients': UserIcon,
        'medical-records': ClipboardList,
        'lab-results': Activity,
        'billing': FileText,
        'schedule': Clock,
        'settings': Settings,
        'add': Plus
    };

    return iconMap[iconName] || LayoutDashboard; // Default to Dashboard icon if not found
};


// User Profile Component
const UserProfile = () => {
    const { isMobile } = useSidebar();
    const user = useAppSelector(selectCurrentUser);
    const navigate = useNavigate();
    const dispatch = useDispatch()

    const handleLogout = () => {
        localStorage.removeItem('token');
        dispatch(logout())
        navigate('/login', { replace: true });
    };

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
                                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user?.firstName} {user?.lastName}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user?.roles?.[0]?.name || 'User'}
                                </span>
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
                                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user?.firstName} {user?.lastName}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
};

// Generate menu configuration based on user roles
const generateMenuConfig = (userRoles: string[]) => {
    // Default menu sections for all users
    const defaultSections: MenuSection[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: getIconComponent('dashboard'),
            items: [
                { id: 'overview', label: 'Overview', path: '/dashboard', icon: getIconComponent('dashboard') }
            ]
        }
    ];

    // Super Admin specific sections
    const superAdminSections: MenuSection[] = [
        {
            id: 'system',
            label: 'System',
            icon: getIconComponent('settings'),
            items: [
                { id: 'organizations', label: 'Organizations', path: '/organizations', icon: getIconComponent('organizations') },
                { id: 'roles', label: 'Roles', path: '/roles', icon: getIconComponent('roles') },
                { id: 'permissions', label: 'Permissions', path: '/permissions', icon: getIconComponent('permissions') }
            ],
            roles: ['Super Admin']
        }
    ];

    // Admin specific sections
    const adminSections: MenuSection[] = [
        {
            id: 'users',
            label: 'Users',
            icon: getIconComponent('users'),
            items: [
                { id: 'all-users', label: 'All Users', path: '/users', icon: getIconComponent('users') },
                { id: 'invite-user', label: 'Invite User', path: '/users/invite', icon: getIconComponent('add') }
            ],
            roles: ['Super Admin', 'Organization Admin']
        },
        // settings section for organization admin

        {
            id: 'settings',
            label: 'Settings',
            icon: getIconComponent('settings'),
            items: [
                { id: 'profile', label: 'Profile', path: '/settings/profile', icon: getIconComponent('settings') },
                { id: 'shifts', label: 'Shifts', path: '/settings/shifts', icon: getIconComponent('settings') },
                {
                    id: 'shifts-payments',
                    label: 'Shifts Payments',
                    path: '/settings/shifts-payments',
                    icon: getIconComponent('settings')
                }
            ],
            roles: ['Super Admin', 'Organization Admin']
        }
    ];

    // Healthcare sections
    const healthcareSections: MenuSection[] = [
        {
            id: 'patients',
            label: 'Patients',
            icon: getIconComponent('patients'),
            items: [
                { id: 'all-patients', label: 'All Patients', path: '/patients', icon: getIconComponent('patients') },
                { id: 'add-patient', label: 'Add Patient', path: '/patients/create', icon: getIconComponent('add') }
            ],
            roles: ['Doctor', 'Nurse', 'Receptionist']
        },
        {
            id: 'appointments',
            label: 'Appointments',
            icon: getIconComponent('appointments'),
            items: [
                { id: 'all-appointments', label: 'All Appointments', path: '/appointments', icon: getIconComponent('appointments') },
                { id: 'schedule', label: 'Schedule', path: '/appointments/create', icon: getIconComponent('add') }
            ],
            roles: ['Doctor', 'Nurse', 'Receptionist']
        },
        {
            id: 'medical',
            label: 'Medical Records',
            icon: getIconComponent('medical-records'),
            items: [
                { id: 'all-records', label: 'All Records', path: '/medical-records', icon: getIconComponent('medical-records') },
                { id: 'lab-results', label: 'Lab Results', path: '/lab-results', icon: getIconComponent('lab-results') }
            ],
            roles: ['Doctor', 'Nurse', 'Lab Technician']
        },
        {
            id: 'staff',
            label: 'Staff',
            icon: getIconComponent('schedule'),
            items: [
                { id: 'staff-schedule', label: 'Schedule', path: '/schedule', icon: getIconComponent('schedule') },
                { id: 'shift-management', label: 'Shift Management', path: '/shifts', icon: getIconComponent('schedule') }
            ],
            roles: ['Organization Admin', 'Doctor', 'Nurse']
        },
        {
            id: 'billing',
            label: 'Billing',
            icon: getIconComponent('billing'),
            items: [
                { id: 'invoices', label: 'Invoices', path: '/billing/invoices', icon: getIconComponent('billing') },
                { id: 'payments', label: 'Payments', path: '/billing/payments', icon: getIconComponent('billing') }
            ],
            roles: ['Billing Staff', 'Organization Admin']
        }
    ];

    // Filter sections based on user roles
    let filteredSections = [...defaultSections];

    // Check if user is Super Admin
    if (userRoles.includes('Super Admin')) {
        filteredSections = [...filteredSections, ...superAdminSections];
    }

    // Check if user is Admin (either Super Admin or Organization Admin)
    if (userRoles.includes('Super Admin') || userRoles.includes('Organization Admin')) {
        filteredSections = [...filteredSections, ...adminSections];
    }

    // Add healthcare sections based on roles
    healthcareSections.forEach(section => {
        if (!section.roles || section.roles.some(role => userRoles.includes(role))) {
            filteredSections.push(section);
        }
    });

    return filteredSections;
};

export function AppSidebar() {
    const location = useLocation();
    const currentPath = location.pathname;
    const currentUser = useAppSelector(selectCurrentUser);

    // Get user roles as an array of role names
    const userRoles = React.useMemo(() => {
        return currentUser?.roles?.map((role: any) => role.name) || [];
    }, [currentUser]);

    // Generate menu based on user roles
    const menuSections = React.useMemo(() => {
        return generateMenuConfig(userRoles);
    }, [userRoles]);



    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <ClipboardList className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">Hospital Portal</span>
                                    <span className="text-xs text-muted-foreground">{currentUser?.organization?.name || 'Healthcare Management'}</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={menuSections} />
            </SidebarContent>

            <SidebarFooter>
                <UserProfile />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}

export default AppSidebar;