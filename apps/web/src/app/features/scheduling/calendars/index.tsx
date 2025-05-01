'use client'

import React, { useState, ReactElement, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon, AlertCircle, Clock, CheckSquare, Calendar1 } from 'lucide-react'
import EmployerShiftCalendar from './shift-calendar'
import { selectCurrentOrganization, selectUser, selectPermissions } from '@/app/features/auth/AuthSlice'
import { OrganizationCategory } from '@wyecare-monorepo/web-ui'

// Calendar component placeholders
const EventsCalendar = (): ReactElement => (
    <div className="p-6 min-h-[500px] flex flex-col items-center justify-center bg-slate-50 rounded-lg">
        <Calendar1 className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-xl font-medium mb-2">Events Calendar</p>
        <p className="text-muted-foreground text-center max-w-md">
            Plan and manage organization-wide events, meetings, and activities.
        </p>
    </div>
)

const AppointmentCalendar = (): ReactElement => (
    <div className="p-6 min-h-[500px] flex flex-col items-center justify-center bg-slate-50 rounded-lg">
        <Clock className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-xl font-medium mb-2">Appointment Calendar</p>
        <p className="text-muted-foreground text-center max-w-md">
            Schedule and manage appointments with clients, patients, or customers.
        </p>
    </div>
)

const ClassScheduleCalendar = (): ReactElement => (
    <div className="p-6 min-h-[500px] flex flex-col items-center justify-center bg-slate-50 rounded-lg">
        <CheckSquare className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-xl font-medium mb-2">Class Schedule</p>
        <p className="text-muted-foreground text-center max-w-md">
            Manage educational classes, courses, and training sessions.
        </p>
    </div>
)

// Define the type for our tab items
export type TabItem = {
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
    categories: Array<OrganizationCategory | '*'>;
    requiredPermissions?: string[];
    staffTypes?: string[];
    roles?: string[];
}

type CalendarTabsProps = {
    defaultTab?: string;
    tabs: TabItem[];
    className?: string;
}

export const CalendarTabs = ({
    defaultTab,
    tabs,
    className = '',
}: CalendarTabsProps): ReactElement => {
    // Use the first tab as default if none specified
    const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || '')

    const handleTabChange = (value: string): void => {
        setActiveTab(value)
    }

    // Determine the grid columns based on number of tabs
    const gridCols = useMemo(() => {
        if (tabs.length >= 4) return 'grid-cols-4';
        if (tabs.length === 3) return 'grid-cols-3';
        if (tabs.length === 2) return 'grid-cols-2';
        return 'grid-cols-1';
    }, [tabs.length]);

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="pb-0">
                <CardTitle className="text-2xl">Scheduling Calendars</CardTitle>
                <CardDescription>
                    Manage your organization's schedules, shifts, events, and appointments
                </CardDescription>
            </CardHeader>

            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
            >
                <div className="px-6 pt-4">
                    <TabsList className={`grid w-full ${gridCols} sm:max-w-2xl`}>
                        {tabs.map((tab: TabItem) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="px-4 py-2 data-[state=active]:shadow-md transition-all"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <CardContent className="p-6">
                    {tabs.map((tab: TabItem) => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            {tab.content}
                        </TabsContent>
                    ))}
                </CardContent>
            </Tabs>
        </Card>
    )
}

// Define all possible calendar tabs with their category relevance
const ALL_CALENDAR_TABS: TabItem[] = [
    {
        id: 'shifts',
        label: 'Shift Calendar',
        description: 'Manage staff work schedules and shifts',
        icon: <Clock className="h-5 w-5" />,
        content: <EmployerShiftCalendar />,
        // Categories that use shift calendars
        categories: [
            OrganizationCategory.HOSPITAL,
            OrganizationCategory.CARE_HOME,
            OrganizationCategory.HEALTHCARE,
            OrganizationCategory.HOSPITALITY,
            OrganizationCategory.RETAIL,
            OrganizationCategory.MANUFACTURING,
            OrganizationCategory.SERVICE_PROVIDER
        ],
        requiredPermissions: ['view_schedules', 'edit_schedules'],
        roles: ['admin', 'owner', 'manager', 'supervisor']
    },
    {
        id: 'events',
        label: 'Events Calendar',
        description: 'Organization-wide events and activities',
        icon: <Calendar1 className="h-5 w-5" />,
        content: <EventsCalendar />,
        // All organizations can use event calendars
        categories: ['*' as '*'],
        requiredPermissions: ['view_events']
    },
    {
        id: 'appointments',
        label: 'Appointments',
        description: 'Client and patient appointments',
        icon: <Clock className="h-5 w-5" />,
        content: <AppointmentCalendar />,
        // Only specific categories use appointment calendars
        categories: [
            OrganizationCategory.HOSPITAL,
            OrganizationCategory.HEALTHCARE,
            OrganizationCategory.PROFESSIONAL_SERVICES
        ],
        requiredPermissions: ['view_appointments', 'edit_appointments']
    },
    {
        id: 'classes',
        label: 'Class Schedule',
        description: 'Educational classes and training sessions',
        icon: <CheckSquare className="h-5 w-5" />,
        content: <ClassScheduleCalendar />,
        // Only education organizations use class schedules
        categories: [
            OrganizationCategory.EDUCATION
        ],
        requiredPermissions: ['view_classes', 'edit_classes']
    }
]

// Main component
const SchedulingCalendars = (): ReactElement => {
    // Get necessary data from Redux
    const currentOrganization = useSelector(selectCurrentOrganization);
    const user = useSelector(selectUser);
    const userPermissions = useSelector(selectPermissions) || [];

    // Determine organization category
    const organizationCategory = useMemo(() => {
        if (currentOrganization?.category) {
            return currentOrganization.category as OrganizationCategory;
        }

        // Legacy support - map from type to category
        if (currentOrganization?.type === 'agency') {
            return OrganizationCategory.SERVICE_PROVIDER;
        } else if (currentOrganization?.type === 'home') {
            return OrganizationCategory.CARE_HOME;
        }

        return OrganizationCategory.OTHER;
    }, [currentOrganization]);

    // Function to check if user has permission
    const hasPermission = (requiredPermissions?: string[]): boolean => {
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        // For admin/owner, grant all permissions
        if (user?.role === 'admin' || user?.role === 'owner') {
            return true;
        }

        // Check if user has at least one of the required permissions
        return requiredPermissions.some(perm => userPermissions.includes(perm));
    };

    // Function to check if tab is available for user's role
    const hasRole = (roles?: string[]): boolean => {
        if (!roles || roles.length === 0) {
            return true;
        }

        return roles.includes(user?.role as any);
    };

    // Filter tabs based on organization category and user permissions
    const availableTabs = useMemo(() => {
        return ALL_CALENDAR_TABS.filter(tab => {
            // Check category match
            const categoryMatch = tab.categories.includes('*' as '*') ||
                tab.categories.includes(organizationCategory);

            // Check permissions match
            const permissionMatch = hasPermission(tab.requiredPermissions);

            // Check role match
            const roleMatch = hasRole(tab.roles);

            return categoryMatch && permissionMatch && roleMatch;
        });
    }, [organizationCategory, user?.role, userPermissions]);

    // Determine default tab - prefer shifts if available, otherwise first tab
    const defaultTab = useMemo(() => {
        const shiftTab = availableTabs.find(tab => tab.id === 'shifts');
        return shiftTab ? 'shifts' : (availableTabs[0]?.id || '');
    }, [availableTabs]);

    // If no tabs are available for this organization category
    if (availableTabs.length === 0) {
        return (
            <Alert variant="destructive" className="max-w-3xl mx-auto mt-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Calendar Access</AlertTitle>
                <AlertDescription>
                    You don't have access to any calendar features. This could be due to your organization type
                    or your permission level. Please contact your administrator if you need access.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="mx-auto">
            <CalendarTabs tabs={availableTabs} defaultTab={defaultTab} />
        </div>
    );
}

export default SchedulingCalendars;