// LeaveCalendarView.tsx
"use client";

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useSelector } from 'react-redux';
import { LeaveStatus } from '@wyecare-monorepo/shared-types';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { selectCurrentOrganization } from '../../auth/AuthSlice';
import { useGetLeaveRequestsQuery } from '../leaveApi';

interface LeaveCalendarViewProps { }

const LeaveCalendarView: React.FC<LeaveCalendarViewProps> = () => {
    // Get current organization
    const currentOrganization = useSelector(selectCurrentOrganization);
    const orgId = currentOrganization?._id;

    // Get approved leave requests
    const { data: leaveRequestsResponse, isLoading } = useGetLeaveRequestsQuery({
        organizationId: orgId as any,
        status: LeaveStatus.APPROVED,
        // No date filters initially - will show data for the current view
        page: 1,
        limit: 1000 // Large limit to get all events
    }, {
        refetchOnMountOrArgChange: true,
        skip: !orgId
    });

    const leaveRequests = leaveRequestsResponse?.data || [];

    // Transform leave requests into calendar events
    const events = leaveRequests.map(leave => ({
        id: leave._id,
        title: `${leave.user.firstName} ${leave.user.lastName} - ${leave.leaveType}`,
        start: leave.startDateTime,
        end: new Date(new Date(leave.endDateTime).setDate(new Date(leave.endDateTime).getDate() + 1)).toISOString(), // Add one day for inclusive display
        backgroundColor: getLeaveTypeColor(leave.leaveType),
        borderColor: getLeaveTypeColor(leave.leaveType),
        extendedProps: {
            leaveType: leave.leaveType,
            reason: leave.reason,
            amount: leave.amount,
            timeUnit: leave.timeUnit
        }
    }));

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leave Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[600px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle>Leave Calendar</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="pt-2 pb-6">
                    <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        height="auto"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,dayGridWeek'
                        }}
                        eventContent={(eventInfo) => (
                            <div className="p-1">
                                <div className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                                    {eventInfo.event.title}
                                </div>
                                {eventInfo.view.type === 'dayGridWeek' && (
                                    <div className="text-xs whitespace-nowrap overflow-hidden text-ellipsis opacity-75">
                                        {eventInfo.event.extendedProps.amount} {eventInfo.event.extendedProps.timeUnit.toLowerCase()}
                                    </div>
                                )}
                            </div>
                        )}
                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            meridiem: false
                        }}
                        dayMaxEvents={3} // Show "+X more" when there are too many events
                        eventDisplay="block" // Make events more compact
                        eventClick={(info) => {
                            // Show event details in a tooltip or modal
                            const event = info.event;
                            alert(`
                ${event.title}
                Period: ${new Date(event.start).toLocaleDateString()} to ${new Date(event.end).toLocaleDateString()}
                Amount: ${event.extendedProps.amount} ${event.extendedProps.timeUnit.toLowerCase()}
                Reason: ${event.extendedProps.reason || 'Not specified'}
              `);
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

// Helper function to get colors for different leave types
const getLeaveTypeColor = (leaveType: string): string => {
    const colors: Record<string, string> = {
        'Sick Leave': '#f4863a',     // Muted Orange
        'Annual Leave': '#5fb878',   // Muted Green
        'Casual Leave': '#4ba7e8',   // Muted Blue
        'Maternity Leave': '#e66d8f', // Muted Pink
        'Paternity Leave': '#a355c0', // Muted Purple
        'Bereavement Leave': '#718fa2', // Muted Blue Grey
        'Unpaid Leave': '#8d6e63'    // Muted Brown
    };

    // Handle legacy types without "Leave" suffix and other custom types
    const baseType = leaveType.replace(/\s+Leave$/, '').toLowerCase();

    for (const [type, color] of Object.entries(colors)) {
        if (type.toLowerCase().includes(baseType)) {
            return color;
        }
    }

    return '#888888'; // Muted Grey default
};

export default LeaveCalendarView;