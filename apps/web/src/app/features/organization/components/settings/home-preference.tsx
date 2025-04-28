"use client"

import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'



// Shadcn Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// Icons
import {
  Clock,
  Plus,
  Bell,
  Settings2,
  Trash2,
  Eye,
  MoreVertical,
  AlertCircle
} from 'lucide-react'
import { IShiftPattern } from '@wyecare-monorepo/shared-types'
import ShiftTypeDialog from '@/app/features/shift/components/shift-pattern/home-add-shift-pattern'
import { useCreateShiftPatternMutation, useDeleteShiftPatternMutation, useGetShiftPatternsQuery, useUpdateShiftPatternMutation } from '@/app/features/shift-pattern/shiftPatternsApi'
import ClaimTemporaryHomeCard from './temperoryhome-claim'
// import ClaimTemporaryHomeCard from './ClaimtempHomeCard'

// Shift color variants
const SHIFT_COLORS = [
  { bg: "bg-indigo-100 dark:bg-indigo-900/50", text: "text-indigo-600 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-700" },
  { bg: "bg-sky-100 dark:bg-sky-900/50", text: "text-sky-600 dark:text-sky-300", border: "border-sky-200 dark:border-sky-700" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-600 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-700" },
  { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-600 dark:text-amber-300", border: "border-amber-200 dark:border-amber-700" },
  { bg: "bg-rose-100 dark:bg-rose-900/50", text: "text-rose-600 dark:text-rose-300", border: "border-rose-200 dark:border-rose-700" },
  { bg: "bg-violet-100 dark:bg-violet-900/50", text: "text-violet-600 dark:text-violet-300", border: "border-violet-200 dark:border-violet-700" }
]

const CareHomePreferences = () => {
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedShiftType, setSelectedShiftType] = useState<IShiftPattern | null>(null)

  const dispatch = useDispatch()

  // RTK Query hooks - using the new version
  const { data: shiftTypes = [], refetch: fetchShiftTypes, isLoading, error } = useGetShiftPatternsQuery()
  const [createShiftPattern] = useCreateShiftPatternMutation()
  const [updateShiftPattern] = useUpdateShiftPatternMutation()
  const [deleteShiftPattern] = useDeleteShiftPatternMutation()

  useEffect(() => {
    if (error) {
      toast.error('Error fetching shift types')
    }
  }, [error])

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
      handleCloseDialog()
    } catch (error) {
      toast.error('Error saving shift type')
    }
  }

  const handleDeleteShiftType = async (shiftTypeId: string) => {
    try {
      await deleteShiftPattern(shiftTypeId).unwrap()
      toast.success('Shift type deleted successfully')
    } catch (error) {
      toast.error('Error deleting shift type')
    }
  }

  // Empty state when no shift types exist
  const EmptyState = () => (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full p-3 bg-muted">
          <AlertCircle className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-lg font-medium">No shift types defined</h3>
          <p className="text-sm text-muted-foreground">
            Create your first shift type to start configuring shift patterns for your care home.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Add Shift Type
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div>
      {/* Main Content */}
      <div className="space-y-8">
        {/* Shift Types Section */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Shift Types</CardTitle>
                  <CardDescription>
                    Create and manage shift types for your organization
                  </CardDescription>
                </div>
              </div>
              {shiftTypes.length > 0 && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shift Type
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : shiftTypes.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shiftTypes.map((shiftType, index) => {
                  const color = SHIFT_COLORS[index % SHIFT_COLORS.length];
                  return (
                    <div
                      key={shiftType._id}
                      className={`group rounded-lg border  p-4 transition-all hover:shadow-md cursor-pointer`}
                      onClick={() => handleOpenDialog(shiftType)}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`${color.text} font-medium text-lg`}>
                          {shiftType.name}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100">
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
                        <p className={`mt-2 text-sm ${color.text} opacity-80`}>
                          {shiftType.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shift Rules Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Shift Rules</CardTitle>
                    <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                      Coming Soon
                    </Badge>
                  </div>
                  <CardDescription>
                    Configure shift scheduling rules and constraints
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Define constraints like minimum rest periods, maximum shifts per week, and preferred shift sequences.
              </p>
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Shift Notifications</CardTitle>
                    <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                      Coming Soon
                    </Badge>
                  </div>
                  <CardDescription>
                    Manage shift-related notifications and alerts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Configure how and when shift notifications are sent to staff members.
              </p>
            </CardContent>
          </Card>

          <ClaimTemporaryHomeCard />
        </div>
      </div>

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

export default CareHomePreferences