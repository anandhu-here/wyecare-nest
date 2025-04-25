"use client"

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'


// Comment out or update imports if components aren't available yet
// import InvoiceConfigSection from './invoice-auto'
// import TemporaryHomeSection from './TempHomeSection'
// import ShiftPresetSection from './ShiftPresetSection'

// Shadcn Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Icons
import {
    Clock,
    Plus,
    Bell,
    Settings2,
    Trash2,
    Eye,
    MoreVertical,
    AlertCircle,
    Loader2,
    FileText,
    ChevronDown,
    ChevronUp,
    Home
} from 'lucide-react'
import { selectUser } from '@/app/features/auth/AuthSlice'
import { IShiftPattern } from '@wyecare-monorepo/shared-types'
import ShiftTypeDialog from '@/app/features/shift/components/shift-pattern/home-add-shift-pattern'
import { useCreateShiftPatternMutation, useDeleteShiftPatternMutation, useGetShiftPatternsQuery, useUpdateShiftPatternMutation } from '@/app/features/shift-pattern/shiftPatternsApi'

// Shift color variants with improved styling for Shadcn
const SHIFT_COLORS = [
    { bg: "bg-primary-50 dark:bg-primary-900/20", text: "text-primary-700 dark:text-primary-300", border: "border-primary-200 dark:border-primary-800", hoverBg: "hover:bg-primary-100 dark:hover:bg-primary-900/30" },
    { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800", hoverBg: "hover:bg-purple-100 dark:hover:bg-purple-900/30" },
    { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/30" },
    { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/30" },
    { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", hoverBg: "hover:bg-rose-100 dark:hover:bg-rose-900/30" },
    { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800", hoverBg: "hover:bg-teal-100 dark:hover:bg-teal-900/30" }
]

const AgencyPreferences = () => {
    // State
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedShiftType, setSelectedShiftType] = useState<IShiftPattern | null>(null)

    // Redux
    const user = useSelector(selectUser)
    const dispatch = useDispatch()

    // RTK Query hooks - using the new pattern
    const { data: shiftTypes = [], isLoading: shiftTypesLoading, refetch: fetchShiftTypes } = useGetShiftPatternsQuery()
    const [createShiftPattern] = useCreateShiftPatternMutation()
    const [updateShiftPattern] = useUpdateShiftPatternMutation()
    const [deleteShiftPattern] = useDeleteShiftPatternMutation()

    // Dialog handlers
    const handleOpenDialog = (shiftType?: IShiftPattern) => {
        setSelectedShiftType(shiftType || null)
        setOpenDialog(true)
    }

    const handleCloseDialog = () => {
        setOpenDialog(false)
        setSelectedShiftType(null)
    }

    // CRUD operations
    const handleSaveShiftType = async (shiftType: IShiftPattern) => {
        try {
            if (shiftType._id) {
                await updateShiftPattern({
                    id: shiftType._id,
                    data: shiftType
                }).unwrap()
                toast.success('Shift type updated successfully')
            } else {
                await createShiftPattern(shiftType).unwrap()
                toast.success('Shift type created successfully')
            }
            fetchShiftTypes()
            handleCloseDialog()
        } catch (error) {
            toast.error('Error saving shift type')
        }
    }

    const handleDeleteShiftType = async (shiftTypeId: string) => {
        try {
            await deleteShiftPattern(shiftTypeId).unwrap()
            fetchShiftTypes()
            toast.success('Shift type deleted successfully')
        } catch (error) {
            toast.error('Error deleting shift type')
        }
    }

    // Loading state
    if (shiftTypesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        )
    }

    // Section Header component for consistent styling
    const SectionHeader = ({ icon, title, description, action = null }) => (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-4 bg-muted/30 border-b rounded-t-lg">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                    {icon}
                </div>
                <div>
                    <h3 className="text-base font-medium md:text-lg">{title}</h3>
                    <p className="text-xs text-muted-foreground md:text-sm">{description}</p>
                </div>
            </div>
            {action}
        </div>
    )

    // Empty state component for shift types
    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-8 px-4 md:py-10 space-y-4">
            <div className="rounded-full p-3 bg-muted">
                <AlertCircle className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-2 max-w-md">
                <h3 className="text-base md:text-lg font-medium">No shift types defined</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                    Create your first shift type to start configuring shift patterns for your agency.
                </p>
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Shift Type
            </Button>
        </div>
    )

    // Shift Type Card component
    const ShiftTypeCard = ({ shiftType, index }) => {
        const color = SHIFT_COLORS[index % SHIFT_COLORS.length];

        return (
            <div
                className={`group rounded-lg border shadow-sm p-3 transition-all hover:shadow-md ${color.hoverBg} cursor-pointer`}
                onClick={() => handleOpenDialog(shiftType)}
            >
                <div className="flex justify-between items-start">
                    <div className={`${color.text} font-medium text-sm sm:text-base truncate max-w-[70%]`}>
                        {shiftType.name}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-70 hover:opacity-100">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog(shiftType);
                            }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (shiftType._id) {
                                        handleDeleteShiftType(shiftType._id);
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {shiftType.description && (
                    <p className={`mt-1 text-xs sm:text-sm ${color.text} opacity-80 line-clamp-2`}>
                        {shiftType.description}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6 pb-16">
            {/* Page Title */}
            <div className="px-1">
                <h1 className="text-xl font-semibold md:text-2xl">Agency Preferences</h1>
                <p className="text-sm text-muted-foreground mt-1">Configure how your agency works with WyeCare</p>
            </div>

            {/* Shift Types Section */}
            <section className="rounded-lg border shadow-sm bg-card">
                <SectionHeader
                    icon={<Clock className="h-4 w-4 md:h-5 md:w-5" />}
                    title="Shift Types"
                    description="Create and manage shift types for your agency"
                    action={
                        shiftTypes.length > 0 ? (
                            <Button size="sm" onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Shift Type
                            </Button>
                        ) : null
                    }
                />
                <div className="p-4">
                    {shiftTypes.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {shiftTypes.map((shiftType, index) => (
                                <ShiftTypeCard
                                    key={shiftType._id}
                                    shiftType={shiftType}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Temporary Homes Section */}
            <section className="rounded-lg border shadow-sm bg-card">
                <SectionHeader
                    icon={<Home className="h-4 w-4 md:h-5 md:w-5" />}
                    title="Temporary Homes"
                    description="Manage temporary care home locations"
                />
                <div className="p-4">
                    {/* Comment out the component if not available yet */}
                    {/* <TemporaryHomeSection /> */}
                    <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-md text-center">
                        Temporary home management coming soon
                    </div>
                </div>
            </section>

            {/* Additional Settings */}
            <section className="rounded-lg border shadow-sm bg-card">
                <SectionHeader
                    icon={<Settings2 className="h-4 w-4 md:h-5 md:w-5" />}
                    title="Additional Settings"
                    description="Configure other agency preferences"
                />
                <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Notifications Card */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" />
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <CardTitle className="text-sm sm:text-base">Notifications</CardTitle>
                                        <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 text-xs">
                                            Coming Soon
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        Manage shift-related alerts
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="text-xs pt-2">
                            <p className="text-muted-foreground">
                                Configure how and when shift notifications are sent to staff members and clients.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Invoice Configuration Card */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <CardTitle className="text-sm sm:text-base">Invoice Configuration</CardTitle>
                                        <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 text-xs">
                                            Coming Soon
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        Manage invoice settings
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="text-xs pt-2">
                            <p className="text-muted-foreground">
                                Configure default invoice settings, payment terms, and automation preferences.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Shift Type Dialog */}
            <ShiftTypeDialog
                open={openDialog}
                onClose={handleCloseDialog}
                onSave={handleSaveShiftType}
                selectedShiftType={selectedShiftType}
            />
        </div>
    )
}

export default AgencyPreferences