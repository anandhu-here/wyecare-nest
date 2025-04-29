import { TabsContent } from '@/components/ui/tabs';
import React, { Fragment, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentOrganization, selectStaffType, selectUser } from '../../features/auth/AuthSlice';
import { OrganizationRole } from '@wyecare-monorepo/shared-types';
import { useMediaQuery } from '../hook/media-query';
import { useNavigate } from 'react-router-dom';
import ModernShiftCalendar from '@/app/features/shift/components/org-shift-calendar';
import { QuickStats } from './components/quick-stats';
import { Button } from '@/components/ui/button';
import AnalyticsDashboard from './components/legacy/DashboardV2';
import StaffShiftCalendar from '@/app/features/employee/employee-shift-calendar';
import StaffScheduleView from '@/app/features/employee/shift-schedule-view';
interface TabPanelProps {
    children?: React.ReactNode;
    value: string;
}

function TabPanel({ children, value }: TabPanelProps) {
    return (
        <TabsContent value={value}>
            {children}
        </TabsContent>
    );
}

interface DashboardDateRange {
    startDate: string;
    endDate: string;
    period: 'day' | 'week' | 'month' | 'year';
}

export default function LegacyDashBoardLayout() {
    // const { user, currentOrganization, staffType } = useAppSelector(
    //     (state) => state.userState
    // );

    const user = useSelector(selectUser);
    const currentOrganization = useSelector(selectCurrentOrganization);
    const staffType = useSelector(selectStaffType);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentRole, setCurrentRole] = useState<OrganizationRole | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [slideIn, setSlideIn] = useState(false);
    const [openInvitation, setOpenInvitation] = useState(false);
    const [tabValue, setTabValue] = useState("0");

    // Media query for mobile detection
    const {
        isMobile
    } = useMediaQuery();

    useEffect(() => {
        setSlideIn(true);
    }, [user?._id]);

    const handleMonthChange = (month: number, year: number) => {
        // setCurrentMonth(month);
        // setCurrentYear(year);
    };

    const handleTabChange = (value: string) => {
        setTabValue(value);
    };

    const hasPermission = (permission: any) => {
        return currentRole?.permissions.includes(permission);
    };

    const renderCalendar = () => {
        if (staffType === 'care') {
            return <StaffScheduleView onMonthChange={handleMonthChange} />;
        }
        return <ModernShiftCalendar onMonthChange={handleMonthChange} />;
    };


    return (
        <div className="w-full px-1">
            <div className="space-y-4">
                {/* Quick Stats Section */}
                <div className="grid grid-cols-1">
                    {/* <div className="flex justify-between items-center mb-2">
            {isCareHome && staffType !== 'care' && isMobile && (
              <QuickShiftsButton />
            )}
          </div> */}
                    <QuickStats type={
                        staffType === 'care' ? 'staff' : currentOrganization?.type as any
                    } />
                </div>

                {/* Main Content */}
                {isMobile ? (
                    <div className="flex flex-col gap-4">
                        {staffType === 'care' && (
                            <></>
                        )}
                        {renderCalendar()}

                        <AnalyticsDashboard
                            selectedMonth={currentMonth}
                            selectedYear={currentYear}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                            {renderCalendar()}
                        </div>
                        <div>
                            <AnalyticsDashboard
                                selectedMonth={currentMonth}
                                selectedYear={currentYear}
                            />
                        </div>
                    </div>
                )}

                {/* Additional Features */}
                {/* <InvitationDialog
                    open={openInvitation}
                    onClose={() => {
                        setOpenInvitation(false);
                        localStorage.removeItem('invToken');
                    }}
                /> */}
            </div>
        </div>
    );
}