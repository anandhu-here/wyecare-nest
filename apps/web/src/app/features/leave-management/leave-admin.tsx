// LeaveAdminDashboard.tsx
"use client";

import React, { useState } from 'react';
// Commenting out tab imports as requested
// import LeaveRequestsTab from './tabs/LeaveRequestTab';
// import LeaveCalendarTab from './tabs/LeaveCalendarTab';
// import LeaveSettingsTab from './tabs/LeaveSettingsTab';

// UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Inbox,
    Calendar,
    Settings,
    RotateCcw,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { selectCurrentOrganization } from '../auth/AuthSlice';
import { useDispatch, useSelector } from 'react-redux';
import { leaveManagementApi } from './leaveApi';
import { LoadingOverlay } from '@/components/loading-overlay';
import LeaveQuickStats from './components/quick-stats';
import LeaveRequestsTab from './components/LeaveRequestsTab';
import LeaveCalendarTab from './components/LeaveCalendar';
import LeaveSettingsTab from './components/LeaveSettingsTab';

/**
 * Main Dashboard Component for Leave Management
 */
const LeaveAdminDashboard = () => {
    const [currentTab, setCurrentTab] = useState("requests");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const dispatch = useDispatch();

    // Get current organization ID from auth context instead of Redux
    const currentOrganization = useSelector(selectCurrentOrganization);
    const orgId = currentOrganization?._id;


    // Refresh data function
    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            dispatch(leaveManagementApi.util.invalidateTags(['LeaveRequests', 'LeavePolicy', 'LeaveBalance']))
            toast.success('Data refreshed successfully');
        } catch (error) {
            toast.error('Failed to refresh data');
        } finally {
            setTimeout(() => {
                setIsRefreshing(false);
            }, 1000);
        }
    };

    return (
        <div className="w-full flex flex-col space-y-6">
            <LoadingOverlay isVisible={isRefreshing} />

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
                <Button
                    onClick={refreshData}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Quick Stats Section */}
            <div className="space-y-4">
                <LeaveQuickStats orgId={orgId as any} />
            </div>

            {/* Main Content */}
            <Tabs defaultValue="requests" value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                <div className="flex justify-between items-center">
                    <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-flex">
                        <TabsTrigger value="requests" className="flex items-center gap-2 py-2">
                            <Inbox className="h-4 w-4" />
                            <span className="hidden sm:inline">Leave Requests</span>
                            <span className="sm:hidden">Requests</span>
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="flex items-center gap-2 py-2">
                            <Calendar className="h-4 w-4" />
                            <span className="hidden sm:inline">Calendar View</span>
                            <span className="sm:hidden">Calendar</span>
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2 py-2">
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Policy Settings</span>
                            <span className="sm:hidden">Settings</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Leave Requests Tab - Content will be added later */}
                <TabsContent value="requests" className="space-y-6">
                    <div className="bg-muted/50 p-8 text-center rounded-lg border border-dashed">
                        <LeaveRequestsTab
                            orgId={orgId as any}
                            refreshData={refreshData}
                        />
                    </div>
                </TabsContent>

                {/* Calendar Tab - Content will be added later */}
                <TabsContent value="calendar">
                    <div className="bg-muted/50 p-8 text-center rounded-lg border border-dashed">
                        <LeaveCalendarTab
                        />
                    </div>
                </TabsContent>

                {/* Settings Tab - Content will be added later */}
                <TabsContent value="settings">
                    <div className="bg-muted/50 p-8 text-center rounded-lg border border-dashed">
                        <LeaveSettingsTab
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default LeaveAdminDashboard;