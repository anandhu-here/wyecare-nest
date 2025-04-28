"use client"

import React, { useState } from 'react'

// Shadcn Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Icons
import { Building, Plus, Link2, ClipboardList, Loader2, Link } from 'lucide-react'
import TemporaryHomeDialog from './temporary-home-dialog';
import { useGetAgencyTemporaryHomesQuery } from '../../organizationApi'

const TemporaryHomeSection = () => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const { data: tempHomes, isLoading } = useGetAgencyTemporaryHomesQuery(undefined)

    // Calculate stats
    const totalHomes = tempHomes?.length || 0
    const claimedHomes = tempHomes?.data?.filter((home: any) => home.isClaimed)?.length || 0
    const pendingHomes = totalHomes - claimedHomes

    return (
        <div>
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-4 bg-muted/30 border-b rounded-t-lg">
                <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setDialogOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Homes
                </Button>
            </div>

            {/* Content */}
            <div className="p-4">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-20 sm:h-24 w-full" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
                            {/* Total Homes */}
                            <div className="rounded-lg border bg-card shadow-sm p-3 md:p-4">
                                <div className="flex items-center gap-2 mb-1 md:mb-2">
                                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs md:text-sm font-medium">Total Homes</span>
                                </div>
                                <div className="text-xl md:text-2xl font-semibold">
                                    {totalHomes}
                                </div>
                            </div>

                            {/* Claimed Homes */}
                            <div className="rounded-lg border bg-card shadow-sm p-3 md:p-4">
                                <div className="flex items-center gap-2 mb-1 md:mb-2">
                                    <Link2 className="h-4 w-4 text-green-600" />
                                    <span className="text-xs md:text-sm font-medium">Claimed</span>
                                </div>
                                <div className="text-xl md:text-2xl font-semibold text-green-600">
                                    {claimedHomes}
                                </div>
                            </div>

                            {/* Pending Homes */}
                            <div className="rounded-lg border bg-card shadow-sm p-3 md:p-4">
                                <div className="flex items-center gap-2 mb-1 md:mb-2">
                                    <Link className="h-4 w-4 text-amber-600" />
                                    <span className="text-xs md:text-sm font-medium">Pending</span>
                                </div>
                                <div className="text-xl md:text-2xl font-semibold text-amber-600">
                                    {pendingHomes}
                                </div>
                            </div>
                        </div>

                        {/* Recent homes list */}
                        {tempHomes && tempHomes?.data?.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Recent Temporary Homes</h3>
                                <div className="space-y-2">
                                    {tempHomes?.data?.slice(0, 3).map((home: any) => (
                                        <div
                                            key={home._id}
                                            className="flex items-center justify-between p-2 rounded-md bg-muted/40"
                                        >
                                            <div className="font-medium text-xs sm:text-sm truncate mr-2">{home.name}</div>
                                            <Badge
                                                variant="outline"
                                                className={`text-xs whitespace-nowrap ${home.isClaimed ?
                                                    "bg-green-50 text-green-700 border-green-200" :
                                                    "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`}
                                            >
                                                {home.isClaimed ? "Claimed" : "Pending"}
                                            </Badge>
                                        </div>
                                    ))}

                                    {tempHomes?.data?.length > 3 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-xs md:text-sm text-muted-foreground hover:text-foreground mt-1"
                                            onClick={() => setDialogOpen(true)}
                                        >
                                            View all {tempHomes?.data?.length} homes
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dialog for managing temporary homes */}
            <TemporaryHomeDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </div>
    )
}

export default TemporaryHomeSection