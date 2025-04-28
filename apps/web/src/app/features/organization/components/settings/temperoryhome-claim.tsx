"use client"

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'


// Shadcn Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Icons
import {
    Link2,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Building
} from 'lucide-react'
import { useClaimTemporaryHomeMutation, useUnclaimTemporaryHomeMutation, useVerifyTemporaryIdQuery } from '../../organizationApi'
import { toast } from 'react-toastify'

const ClaimTemporaryHomeCard = () => {
    const [temporaryId, setTemporaryId] = useState('')
    const [verifyId, setVerifyId] = useState<string | null>(null)
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
    const [migrationStats, setMigrationStats] = useState<any>(null)

    const dispatch = useDispatch()

    // RTK Query hooks
    const { data: verificationResult, isLoading: isVerifying, isFetching: isFetchingVerify } =
        useVerifyTemporaryIdQuery(verifyId || '', { skip: !verifyId })

    const [claimTemporaryHome, { isLoading: isClaiming }] = useClaimTemporaryHomeMutation()

    // Handle verification of temporary ID
    const handleVerifyId = () => {
        if (!temporaryId.trim()) {
            dispatch(showSnack({ message: 'Please enter a temporary home ID', color: 'error' }))
            return
        }

        setVerifyId(temporaryId.trim())
    }

    // React to verification results
    React.useEffect(() => {
        if (verificationResult && !isVerifying && !isFetchingVerify) {
            if (verificationResult?.data?.isValid) {
                setIsConfirmDialogOpen(true)
            } else {
                toast.error('Temporary ID is invalid or already claimed', {})
                setVerifyId(null)
            }
        }
    }, [verificationResult, isVerifying, isFetchingVerify, dispatch])

    // Handle claiming the temporary home
    const handleClaimHome = async () => {
        try {
            const result = await claimTemporaryHome({ temporaryId: temporaryId.trim() }).unwrap()

            setMigrationStats(result.migrationStats)
            // dispatch(showSnack({ message: 'Successfully claimed temporary home and migrated data', color: 'success' }))
            toast.success('Successfully claimed temporary home and migrated data', {})

            // Close dialog and reset form
            setIsConfirmDialogOpen(false)
            setTemporaryId('')
            setVerifyId(null)
        } catch (error) {
            toast.error('Failed to claim temporary home', {})
        }
    }

    return (
        <>
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <Link2 className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Link to Agency</CardTitle>
                            <CardDescription>
                                Link your care home to an agency using a temporary ID
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {migrationStats ? (
                        <div className="space-y-4">
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-600">Successfully Linked</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Your care home has been successfully linked to the agency.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="rounded-lg border bg-sky-50 p-4">
                                    <div className="text-sm font-medium text-sky-700">Shifts</div>
                                    <div className="text-xl font-semibold text-sky-800 mt-1">
                                        {migrationStats.shifts}
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-emerald-50 p-4">
                                    <div className="text-sm font-medium text-emerald-700">Timesheets</div>
                                    <div className="text-xl font-semibold text-emerald-800 mt-1">
                                        {migrationStats.timesheets}
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-violet-50 p-4">
                                    <div className="text-sm font-medium text-violet-700">Invoices</div>
                                    <div className="text-xl font-semibold text-violet-800 mt-1">
                                        {migrationStats.invoices}
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                onClick={() => setMigrationStats(null)}
                            >
                                Link Another Agency
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground mb-4">
                                Enter the temporary ID provided by your agency to link accounts and migrate your data.
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="temporary-id">Temporary Home ID</Label>
                                <div className="flex space-x-2">
                                    <Input
                                        id="temporary-id"
                                        placeholder="e.g. TCHOME-12345678-abc123"
                                        value={temporaryId}
                                        onChange={(e) => setTemporaryId(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleVerifyId}
                                        disabled={!temporaryId.trim() || isVerifying || isFetchingVerify}
                                    >
                                        {(isVerifying || isFetchingVerify) ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying
                                            </>
                                        ) : 'Verify ID'}
                                    </Button>
                                </div>
                            </div>

                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Important</AlertTitle>
                                <AlertDescription>
                                    This will link your care home to the agency and migrate all related data. This action cannot be undone.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                            Confirm Linking
                        </DialogTitle>
                        <DialogDescription>
                            You are about to link your care home to an agency and migrate data
                        </DialogDescription>
                    </DialogHeader>

                    {verificationResult && verificationResult?.data?.isValid && verificationResult?.data?.agency && (
                        <div className="space-y-4 py-2">
                            <div className="border rounded-lg p-4 bg-muted/30">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Agency Name</div>
                                        <div className="font-semibold">{verificationResult?.data?.agency.name}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Temporary Home</div>
                                        <div className="font-semibold">{verificationResult?.data?.tempHome.name}</div>
                                    </div>
                                </div>
                            </div>

                            <Alert className="bg-amber-50 border-amber-200">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-700">
                                    This will migrate all shifts, timesheets, and invoices associated with the temporary home to your care home.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsConfirmDialogOpen(false);
                                setVerifyId(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleClaimHome}
                            disabled={isClaiming}
                        >
                            {isClaiming ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Linking...
                                </>
                            ) : 'Confirm & Link'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ClaimTemporaryHomeCard