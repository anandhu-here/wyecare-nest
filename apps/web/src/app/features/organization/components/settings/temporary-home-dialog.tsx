"use client"

import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

// Shadcn Components
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Icons
import {
    Plus,
    Building,
    Clipboard,
    Trash2,
    MoreVertical,
    HomeIcon,
    Link,
    AlertCircle,
    CheckCircle2,
    Copy,
    Loader2,
    Undo2
} from 'lucide-react'
import { useCreateTemporaryHomeMutation, useDeleteTemporaryHomeMutation, useGetAgencyTemporaryHomesQuery, useUnclaimTemporaryHomeMutation } from '../../organizationApi'
import { toast } from 'react-toastify'

// Type definitions
interface TemporaryHome {
    _id: string
    name: string
    temporaryId: string
    isClaimed: boolean
    claimedBy?: string
    createdAt: string
    metadata?: any
}

interface TemporaryHomeDialogProps {
    open: boolean
    onClose: () => void
}

const TemporaryHomeDialog: React.FC<TemporaryHomeDialogProps> = ({ open, onClose }) => {
    const [newHomeName, setNewHomeName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [unclaimDialogOpen, setUnclaimDialogOpen] = useState(false)
    const [selectedHome, setSelectedHome] = useState<TemporaryHome | null>(null)

    const dispatch = useDispatch()

    // RTK Query hooks
    const { data: tempHomes, isLoading: isLoadingHomes, refetch } = useGetAgencyTemporaryHomesQuery()
    const [createTemporaryHome] = useCreateTemporaryHomeMutation()
    const [deleteTemporaryHome] = useDeleteTemporaryHomeMutation()
    const [unclaimTemporaryHome, { isLoading: isUnclaiming }] = useUnclaimTemporaryHomeMutation()

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setNewHomeName('')
            setIsCreating(false)
        }
    }, [open])

    // Handle creating a new temporary home
    const handleCreateHome = async () => {
        if (!newHomeName.trim()) {
            toast.error('Please enter a valid home name')
            return
        }

        setIsCreating(true)
        try {
            await createTemporaryHome({ name: newHomeName.trim() }).unwrap()
            toast.success('Temporary home created successfully')
            setNewHomeName('')
            refetch()
        } catch (error) {
            toast.error('Failed to create temporary home')
            console.error('Error creating temporary home:', error)
        } finally {
            setIsCreating(false)
        }
    }

    // Handle deleting a temporary home
    const handleDeleteHome = async (homeId: string) => {
        try {
            await deleteTemporaryHome(homeId).unwrap()
            toast.success('Temporary home deleted successfully')
            refetch()
        } catch (error) {
            toast.error('Failed to delete temporary home')

        }
    }

    // Handle unclaiming a temporary home
    const handleUnclaimHome = async () => {
        if (!selectedHome) return;

        try {
            await unclaimTemporaryHome(selectedHome._id).unwrap()
            toast.success('Temporary home unclaimed successfully')
            setUnclaimDialogOpen(false)
            setSelectedHome(null)
            refetch()
        } catch (error) {
            toast.error('Failed to unclaim temporary home')
            console.error('Error unclaiming temporary home:', error)
        }
    }

    // Open unclaim dialog
    const openUnclaimDialog = (home: TemporaryHome) => {
        setSelectedHome(home)
        setUnclaimDialogOpen(true)
    }

    // Copy temporary ID to clipboard
    const copyToClipboard = (temporaryId: string) => {
        navigator.clipboard.writeText(temporaryId)
        setCopiedId(temporaryId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Render loading skeletons
    const renderSkeletons = () => (
        <div className="space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                            Temporary Care Homes
                        </DialogTitle>
                        <DialogDescription>
                            Create placeholder homes for care homes that haven't joined the system yet
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col flex-grow overflow-hidden">
                        {/* Create new temporary home section */}
                        <div className="space-y-4 mb-6 py-2 border-b">
                            <div className="grid grid-cols-[1fr_auto] gap-3 px-2">
                                <div className="space-y-2">
                                    <Label htmlFor="temp-home-name">Care Home Name</Label>
                                    <Input
                                        id="temp-home-name"
                                        placeholder="Enter care home name"
                                        value={newHomeName}
                                        onChange={(e) => setNewHomeName(e.target.value)}
                                        disabled={isCreating}
                                    />
                                </div>
                                <div className="self-end">
                                    <Button
                                        onClick={handleCreateHome}
                                        disabled={!newHomeName.trim() || isCreating}
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* List of temporary homes */}
                        <div className="text-sm font-medium mb-2 text-muted-foreground">
                            Existing Temporary Homes
                        </div>

                        <ScrollArea className="flex-grow pr-4">
                            {isLoadingHomes ? (
                                renderSkeletons()
                            ) : !tempHomes || tempHomes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg border-dashed">
                                    <HomeIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
                                    <h3 className="font-medium text-lg">No temporary homes yet</h3>
                                    <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">
                                        Create temporary placeholders for care homes before they join the platform
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Temporary ID</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[80px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tempHomes?.data?.map((home: TemporaryHome) => (
                                            <TableRow key={home._id}>
                                                <TableCell className="font-medium">{home.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                                            {home.temporaryId}
                                                        </code>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={() => copyToClipboard(home.temporaryId)}
                                                                    >
                                                                        {copiedId === home.temporaryId ? (
                                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                                        ) : (
                                                                            <Copy className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {copiedId === home.temporaryId ? 'Copied!' : 'Copy ID'}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {home.isClaimed ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                            Claimed
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {home.isClaimed && (
                                                                <DropdownMenuItem
                                                                    className="text-amber-600 focus:text-amber-600"
                                                                    onClick={() => openUnclaimDialog(home)}
                                                                >
                                                                    <Undo2 className="h-4 w-4 mr-2" />
                                                                    Unclaim
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => handleDeleteHome(home._id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </ScrollArea>
                    </div>

                    <DialogFooter className="pt-2">
                        <div className="flex items-center text-xs text-muted-foreground mr-auto">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Share the ID with care homes to link accounts
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unclaim Confirmation Dialog */}
            <AlertDialog open={unclaimDialogOpen} onOpenChange={setUnclaimDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-amber-600">Unclaim Temporary Home</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will revert all data migrations and unlink the care home from your agency.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {selectedHome && (
                        <div className="py-2">
                            <div className="border rounded-lg p-4 bg-muted/30 mb-4">
                                <div className="space-y-2">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Temporary Home</div>
                                        <div className="font-semibold">{selectedHome.name}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Temporary ID</div>
                                        <div className="font-semibold">{selectedHome.temporaryId}</div>
                                    </div>
                                </div>
                            </div>

                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Warning:</strong> This action will reverse all data migrations including shifts, timesheets, and invoices.
                                    All data will be moved back to the temporary home.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={handleUnclaimHome}
                            disabled={isUnclaiming}
                        >
                            {isUnclaiming ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Unclaiming...
                                </>
                            ) : 'Confirm Unclaim'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default TemporaryHomeDialog