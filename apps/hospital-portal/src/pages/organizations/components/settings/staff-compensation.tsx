// src/pages/CompensationPage.tsx

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import { selectCurrentOrganization } from '@/features/auth/authSlice';
import {
    useUsersControllerFindAllQuery,
    useOrganizationsControllerGetDepartmentsQuery,
    useShiftTypesControllerFindAllQuery,
} from '@/features/generatedApi';
import CompensationRatesTab from './compensation-tabs/rates';
import ShiftPremiumsTab from './compensation-tabs/shifts-premium';
import { Department, User } from '@/lib/types';
import { ShiftType } from '@/features/shifts/shiftsApi';



// Utility functions
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

// Types
export type PaymentType = 'HOURLY' | 'WEEKLY' | 'MONTHLY';

export interface CompensationFormValues {
    staffProfileId: string;
    departmentId: string;
    baseRate: number;
    paymentType: PaymentType;
    specialtyBonus: number;
    experienceMultiplier: number;
    effectiveDate: Date | string;
    endDate?: Date | string;
}

export interface PremiumFormValues {
    shiftTypeId: string;
    compensationRateId: string;
    isPremiumPercentage: boolean;
    premiumValue: number;
    effectiveDate: Date | string;
    endDate?: Date | string;
}

const CompensationPage = () => {
    const currentOrganization = useSelector(selectCurrentOrganization);
    const organizationId = currentOrganization?.id || '';

    const [activeTab, setActiveTab] = useState('base-compensation');

    // Shared data queries
    const { data: staffProfiles = [], isLoading: isLoadingStaff } = useUsersControllerFindAllQuery(
        {
            organizationId: organizationId || undefined,
        },
        { skip: !organizationId }
    );

    const { data: departments = [], isLoading: isLoadingDepartments } = useOrganizationsControllerGetDepartmentsQuery(
        organizationId || undefined,
        { skip: !organizationId }
    );

    const { data: shiftTypes = [], isLoading: isLoadingShiftTypes } = useShiftTypesControllerFindAllQuery(undefined, { skip: !organizationId }
    );

    // Helper functions (used by both tabs)
    const getStaffName = (id: string) => {
        const staff = staffProfiles?.users?.find(s => s.id === id);
        return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
    };

    const getDepartmentName = (id: string) => {
        const department = departments.find(d => d.id === id);
        return department ? department.name : 'Unknown';
    };

    const getShiftTypeName = (id: string) => {
        const shiftType = shiftTypes.find(s => s.id === id);
        return shiftType ? shiftType.name : 'Unknown';
    };

    const getPaymentTypeLabel = (type: PaymentType) => {
        switch (type) {
            case 'HOURLY': return 'Hourly Rate';
            case 'WEEKLY': return 'Weekly Salary';
            case 'MONTHLY': return 'Monthly Salary';
            default: return type;
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <Tabs defaultValue="base-compensation" value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="base-compensation">Base Compensation Rates</TabsTrigger>
                    <TabsTrigger value="shift-premiums">Shift Type Premiums</TabsTrigger>
                </TabsList>

                {/* Base Compensation Tab */}
                <TabsContent value="base-compensation" className="mt-6">
                    <CompensationRatesTab
                        organizationId={organizationId}
                        staffProfiles={staffProfiles as User[]}
                        departments={departments as Department[]}
                        shiftTypes={shiftTypes as any[]}
                        getStaffName={getStaffName}
                        getDepartmentName={getDepartmentName}
                        getShiftTypeName={getShiftTypeName}
                        getPaymentTypeLabel={getPaymentTypeLabel}
                        setActiveTab={setActiveTab}
                    />
                </TabsContent>

                {/* Shift Premiums Tab */}
                <TabsContent value="shift-premiums" className="mt-6">
                    <ShiftPremiumsTab
                        organizationId={organizationId}
                        staffProfiles={staffProfiles as User[]}
                        departments={departments as Department[]}
                        shiftTypes={shiftTypes as ShiftType[]}
                        getStaffName={getStaffName}
                        getDepartmentName={getDepartmentName}
                        getShiftTypeName={getShiftTypeName}
                        getPaymentTypeLabel={getPaymentTypeLabel}
                        setActiveTab={setActiveTab}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CompensationPage;