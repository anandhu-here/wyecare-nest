// LeaveSettingsTab.tsx
"use client";

import React, { useState } from 'react';
import {
    useGetLeavePolicyQuery,
    useUpsertLeavePolicyMutation,
    useGetLeaveTypesQuery
} from '../leaveApi';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { LeaveTimeUnit, AccrualFrequency, AccrualMethod } from '@wyecare-monorepo/shared-types';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Custom Components
import { LeaveTypeDialog } from './dialogs/leave-type-form.dialog'; // Import the new dialog component

// Icons
import { Plus, Save, Trash2, Edit, AlertCircle, Copy } from "lucide-react";
import { selectCurrentOrganization } from '../../auth/AuthSlice';

interface LeaveSettingsTabProps { }

const LeaveSettingsTab: React.FC<LeaveSettingsTabProps> = () => {
    const [activeTab, setActiveTab] = useState('leave-types');
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [confirmDeleteName, setConfirmDeleteName] = useState('');
    const [leaveTypeToEdit, setLeaveTypeToEdit] = useState<any>(null);
    const [leaveTypeToDeleteIndex, setLeaveTypeToDeleteIndex] = useState<number | null>(null);

    // Get current organization
    const currentOrganization = useSelector(selectCurrentOrganization);
    const orgId = currentOrganization?._id;

    // API queries
    const { data: policyData, isLoading: isPolicyLoading } = useGetLeavePolicyQuery(undefined, {
        refetchOnMountOrArgChange: true,
        skip: !orgId
    });

    const { data: leaveTypesData, isLoading: isLeaveTypesLoading } = useGetLeaveTypesQuery(undefined, {
        refetchOnMountOrArgChange: true,
        skip: !orgId
    });

    const [upsertPolicy, { isLoading: isSaving }] = useUpsertLeavePolicyMutation();

    const policy = policyData?.data;
    const leaveTypes = leaveTypesData?.data || [];

    // Form handlers
    const handleSaveLeaveType = async (formData) => {
        if (!policy) return;

        try {
            let updatedLeaveTypes;

            if (leaveTypeToEdit) {
                // Edit existing leave type
                const index = policy.leaveTypes.findIndex(lt => lt.type === leaveTypeToEdit.type);
                if (index >= 0) {
                    updatedLeaveTypes = [...policy.leaveTypes];
                    updatedLeaveTypes[index] = formData;
                } else {
                    updatedLeaveTypes = [...policy.leaveTypes, formData];
                }
            } else {
                // Add new leave type
                updatedLeaveTypes = [...policy.leaveTypes, formData];
            }

            // Send updated policy to API
            await upsertPolicy({
                ...policy,
                leaveTypes: updatedLeaveTypes
            }).unwrap();

            toast.success(
                leaveTypeToEdit ? 'Leave type updated successfully' : 'Leave type created successfully'
            );

            // Close dialog and reset state
            setIsEditDialogOpen(false);
            setLeaveTypeToEdit(null);
        } catch (error) {
            toast.error('Failed to save leave type');
            console.error('Error saving leave type:', error);
        }
    };

    const handleDeleteLeaveType = async () => {
        if (!policy || leaveTypeToDeleteIndex === null) return;

        try {
            // Filter out the leave type to delete
            const updatedLeaveTypes = [...policy.leaveTypes];
            updatedLeaveTypes.splice(leaveTypeToDeleteIndex, 1);

            await upsertPolicy({
                ...policy,
                leaveTypes: updatedLeaveTypes
            }).unwrap();

            toast.success('Leave type deleted successfully');
            setIsDeleteDialogOpen(false);
            setLeaveTypeToDeleteIndex(null);
            setConfirmDeleteName('');
        } catch (error) {
            toast.error('Failed to delete leave type');
            console.error('Error deleting leave type:', error);
        }
    };

    // Open dialog for creating a new leave type
    const handleAddLeaveType = () => {
        setLeaveTypeToEdit(null);
        setIsEditDialogOpen(true);
    };

    // Open dialog for editing an existing leave type
    const handleEditLeaveType = (leaveType) => {
        setLeaveTypeToEdit(leaveType);
        setIsEditDialogOpen(true);
    };

    // Open delete confirmation dialog
    const handleDeleteClick = (leaveType, index) => {
        setLeaveTypeToEdit(leaveType);
        setLeaveTypeToDeleteIndex(index);
        setIsDeleteDialogOpen(true);
        setConfirmDeleteName('');
    };

    // Loading state
    if (isPolicyLoading || isLeaveTypesLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Leave Management Settings</CardTitle>
                    <CardDescription>
                        Configure your organization's leave policies, types, and workflow settings
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
                            <TabsTrigger value="policies">Policy Settings</TabsTrigger>
                            <TabsTrigger value="workflow">Approval Workflow</TabsTrigger>
                        </TabsList>

                        {/* Leave Types Tab */}
                        <TabsContent value="leave-types" className="space-y-4 pt-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium">Leave Types</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Configure the different types of leave your organization offers
                                    </p>
                                </div>

                                <Button onClick={handleAddLeaveType}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Leave Type
                                </Button>
                            </div>

                            <Separator />

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Entitlement</TableHead>
                                            <TableHead>Accrual</TableHead>
                                            <TableHead>Settings</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {policy?.leaveTypes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                        <AlertCircle className="h-8 w-8 mb-2" />
                                                        <h3 className="font-medium mb-1">No leave types defined</h3>
                                                        <p className="text-sm">Create your first leave type to get started</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            policy?.leaveTypes.map((leaveType, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <div className="font-medium">{leaveType.name || 'Unnamed'}</div>
                                                        <div className="text-sm text-muted-foreground">{leaveType.type || 'Uncategorized'}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {leaveType.entitlementAmount} {leaveType.defaultTimeUnit?.toLowerCase()}
                                                        <div className="text-xs text-muted-foreground">
                                                            {leaveType.isProratedForNewJoiners ? 'Pro-rated' : 'Fixed'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {leaveType.accrualEnabled ? (
                                                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                                                                {leaveType.accrualFrequency} accrual
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">
                                                                No accrual
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {leaveType.requiresApproval && (
                                                                <Badge variant="outline" className="text-xs">Approval Required</Badge>
                                                            )}
                                                            {leaveType.allowPartialTimeUnit && (
                                                                <Badge variant="outline" className="text-xs">Partial Units</Badge>
                                                            )}
                                                            {leaveType.allowCarryOver && (
                                                                <Badge variant="outline" className="text-xs">Carry-Over</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => handleEditLeaveType(leaveType)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(leaveType, index)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* Policy Settings Tab - unchanged */}
                        <TabsContent value="policies" className="space-y-4 pt-4">
                            {/* Your existing policy settings content */}
                            {/* ... */}
                        </TabsContent>

                        {/* Approval Workflow Tab - unchanged */}
                        <TabsContent value="workflow" className="space-y-4 pt-4">
                            {/* Your existing workflow content */}
                            {/* ... */}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* New Leave Type Dialog (using the new component) */}
            <LeaveTypeDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                initialData={leaveTypeToEdit}
                onSave={handleSaveLeaveType}
                isEditing={!!leaveTypeToEdit}
            />

            {/* Delete Confirmation Dialog - unchanged */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Delete Leave Type</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            <span className="font-semibold"> {leaveTypeToEdit?.name}</span> leave type
                            and remove it from all leave balances.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            To confirm, type <span className="font-semibold">{leaveTypeToEdit?.name}</span> below:
                        </p>
                        <Input
                            value={confirmDeleteName}
                            onChange={(e) => setConfirmDeleteName(e.target.value)}
                            placeholder={leaveTypeToEdit?.name}
                        />
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteLeaveType}
                            disabled={confirmDeleteName !== leaveTypeToEdit?.name || isSaving}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSaving ? 'Deleting...' : 'Delete Leave Type'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default LeaveSettingsTab;