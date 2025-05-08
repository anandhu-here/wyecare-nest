import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
    Mail,
    Building2,
    Home,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Copy,
    Search,
    Check
} from 'lucide-react';
import { cn } from '@/lib/util';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { selectCurrentOrganization } from '../OrganizationSlice';
import {
    useFindOrganizationsByEmailQuery,
    useCreateLinkTokenMutation,
    useSendLinkInvitationMutation,
    useLazyFindOrganizationsByEmailQuery
} from '../organizationApi';

interface OrganizationItem {
    _id: string;
    name: string;
    email: string;
    type: 'agency' | 'home';
    logoUrl?: string;
}

interface InviteOrganizationDialogProps {
    open: boolean;
    onClose: () => void;
}

const InviteOrganizationDialog: React.FC<InviteOrganizationDialogProps> = ({
    open,
    onClose
}) => {
    const currentOrganization = useSelector(selectCurrentOrganization);

    // State for the multi-step form
    const [searchEmail, setSearchEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [invitationStatus, setInvitationStatus] = useState<'idle' | 'success' | 'error' | 'copied'>('idle');

    // State for organization selection and token management
    const [foundOrganizations, setFoundOrganizations] = useState<OrganizationItem[]>([]);
    const [selectedOrganization, setSelectedOrganization] = useState<OrganizationItem | null>(null);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [invitationLink, setInvitationLink] = useState<string | null>(null);

    // RTK Query hooks
    const [findOrganizationsByEmail, { data: orgSearchResult, isLoading: isSearching }] =
        useLazyFindOrganizationsByEmailQuery();
    const [createLinkToken, { isLoading: isCreatingToken }] = useCreateLinkTokenMutation();
    const [sendLinkInvitation, { isLoading: isSendingInvitation }] = useSendLinkInvitationMutation();

    const steps = ['Search Organization', 'Select Organization', 'Generate Link', 'Send Invitation'];

    // Update foundOrganizations when search results arrive
    useEffect(() => {
        if (orgSearchResult?.data) {
            setFoundOrganizations(orgSearchResult.data);
            if (activeStep === 0 && orgSearchResult.data.length > 0) {
                setActiveStep(1); // Move to organization selection step
            }
        }
    }, [orgSearchResult, activeStep]);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSearch = () => {
        if (!validateEmail(searchEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setError('');
        findOrganizationsByEmail(searchEmail);
    };

    const handleSelectOrganization = (org: OrganizationItem) => {
        setSelectedOrganization(org);
        setActiveStep(2); // Move to generate link step
    };

    const handleGenerateToken = async () => {
        if (!selectedOrganization) return;

        setError('');
        try {
            const result = await createLinkToken({
                targetOrganizationId: selectedOrganization._id,
                message: message,
                linkType: 'default'
            }).unwrap();

            if (result.success && result.data) {
                setGeneratedToken(result.data.token);
                setInvitationLink(result.data.linkUrl);
                setActiveStep(3); // Move to send invitation step
            } else {
                setError('Failed to generate invitation link');
            }
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to generate invitation link');
        }
    };

    const handleSendInvitation = async () => {
        if (!selectedOrganization || !generatedToken) return;

        setError('');
        try {
            await sendLinkInvitation({
                targetOrganizationId: selectedOrganization._id,
                token: generatedToken,
                message: message
            }).unwrap();

            setInvitationStatus('success');
            toast.success('Invitation sent successfully');
        } catch (err) {
            setInvitationStatus('error');
            setError('Failed to send invitation. Please try again.');
            toast.error('Error sending invitation');
        }
    };

    const copyToClipboard = async () => {
        if (!invitationLink) return;

        try {
            await navigator.clipboard.writeText(invitationLink);
            setInvitationStatus('copied');
            toast.success('Link copied to clipboard');
            setTimeout(() => setInvitationStatus('idle'), 2000);
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    const handleClose = () => {
        setSearchEmail('');
        setMessage('');
        setError('');
        setActiveStep(0);
        setInvitationStatus('idle');
        setFoundOrganizations([]);
        setSelectedOrganization(null);
        setGeneratedToken(null);
        setInvitationLink(null);
        onClose();
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0: // Search Organization
                return (
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Search for an organization by email address. You can search for the organization's email
                            or the email of an admin.
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="organization@example.com"
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={isSearching || !searchEmail.trim()}
                            >
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                            </Button>
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>
                );

            case 1: // Select Organization
                return (
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Select the organization you want to invite:
                        </p>

                        {isSearching ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : foundOrganizations.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-muted-foreground">No organizations found</p>
                                <Button
                                    variant="link"
                                    onClick={() => setActiveStep(0)}
                                    className="mt-2"
                                >
                                    Try another search
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {foundOrganizations.map((org) => (
                                    <Card
                                        key={org._id}
                                        className="border cursor-pointer hover:bg-muted/20"
                                        onClick={() => handleSelectOrganization(org)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {org.logoUrl ? (
                                                        <img
                                                            src={org.logoUrl}
                                                            alt={org.name}
                                                            className="h-full w-full rounded-full"
                                                        />
                                                    ) : (
                                                        <span className="text-primary font-medium">
                                                            {org.name.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{org.name}</p>
                                                    <div className="flex items-center">
                                                        <span className="text-sm text-muted-foreground mr-2">
                                                            {org.email}
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                            {org.type === 'home' ? (
                                                                <Home className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <Building2 className="h-3 w-3 mr-1" />
                                                            )}
                                                            {org.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 2: // Generate Link
                return (
                    <div className="space-y-4 py-4">
                        <h4 className="text-sm font-medium">Generate Invitation Link</h4>

                        {selectedOrganization && (
                            <Card className="border">
                                <CardContent className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Selected Organization</p>
                                        <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                {selectedOrganization.logoUrl ? (
                                                    <img
                                                        src={selectedOrganization.logoUrl}
                                                        alt={selectedOrganization.name}
                                                        className="h-full w-full rounded-full"
                                                    />
                                                ) : (
                                                    <span className="text-primary font-medium">
                                                        {selectedOrganization.name.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{selectedOrganization.name}</p>
                                                <div className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                    {selectedOrganization.type === 'home' ? (
                                                        <Home className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <Building2 className="h-3 w-3 mr-1" />
                                                    )}
                                                    {selectedOrganization.type}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Optional Message</p>
                                        <Input
                                            placeholder="Add a personal message to your invitation"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>
                );

            case 3: // Send Invitation
                return (
                    <div className="space-y-4 py-4">
                        {invitationStatus === 'success' ? (
                            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                <CheckCircle2 className="h-16 w-16 text-success" />
                                <h3 className="text-lg font-semibold">Invitation Sent Successfully!</h3>
                                <p className="text-sm text-muted-foreground text-center">
                                    We'll notify you when they accept the invitation.
                                </p>
                            </div>
                        ) : invitationStatus === 'error' ? (
                            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                <AlertCircle className="h-16 w-16 text-destructive" />
                                <h3 className="text-lg font-semibold">Failed to Send Invitation</h3>
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        ) : (
                            <>
                                <h4 className="text-sm font-medium">Invitation Link Generated</h4>
                                <p className="text-sm text-muted-foreground">
                                    You can copy this link and share it manually, or send it directly to the organization's administrators:
                                </p>

                                {invitationLink && (
                                    <div className="relative">
                                        <Input
                                            value={invitationLink}
                                            readOnly
                                            className="pr-10 font-mono text-xs"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full"
                                            onClick={copyToClipboard}
                                        >
                                            {invitationStatus === 'copied' ? (
                                                <Check className="h-4 w-4 text-success" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mt-4">
                                    <hr className="flex-1" />
                                    <span className="text-sm text-muted-foreground">Or</span>
                                    <hr className="flex-1" />
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handleSendInvitation}
                                    disabled={isSendingInvitation}
                                >
                                    {isSendingInvitation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Email Invitation
                                </Button>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                            </>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Invite Organization</DialogTitle>

                    {/* Custom Stepper */}
                    <div className="flex items-center justify-center mt-4">
                        {steps.map((label, index) => (
                            <React.Fragment key={label}>
                                <div className="flex items-center">
                                    <div
                                        className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
                                            activeStep >= index
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {index + 1}
                                    </div>
                                    <span
                                        className={cn(
                                            "ml-2 text-sm hidden sm:block",
                                            activeStep >= index
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            "h-px w-8 mx-2",
                                            activeStep > index ? "bg-primary" : "bg-border"
                                        )}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </DialogHeader>

                {error && activeStep !== 3 && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {renderStepContent(activeStep)}

                <DialogFooter>
                    <div className="flex justify-between w-full">
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                        >
                            {activeStep === 3 && invitationStatus === 'success' ? 'Done' : 'Cancel'}
                        </Button>
                        <div className="space-x-2">
                            {activeStep > 0 && activeStep < 3 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setActiveStep(prev => prev - 1)}
                                >
                                    Back
                                </Button>
                            )}
                            {activeStep < 2 && activeStep !== 1 && (
                                <Button
                                    onClick={handleSearch}
                                    disabled={!searchEmail || isSearching}
                                >
                                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Search'}
                                </Button>
                            )}
                            {activeStep === 2 && (
                                <Button
                                    onClick={handleGenerateToken}
                                    disabled={isCreatingToken || !selectedOrganization}
                                >
                                    {isCreatingToken && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate Link
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InviteOrganizationDialog;