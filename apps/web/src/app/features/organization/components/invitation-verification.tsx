import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Home, Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { organizationApi, useAcceptLinkTokenMutation, useVerifyLinkTokenMutation } from '../organizationApi';
import { selectCurrentOrganization } from '../../auth/AuthSlice';

const OrganizationLinkVerify = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verified' | 'error' | 'accepted' | 'rejected'>('loading');
    const [error, setError] = useState('');
    const [sourceOrganization, setSourceOrganization] = useState<any>(null);

    const currentOrganization = useSelector(selectCurrentOrganization);
    console.log(currentOrganization, 'currrrrrr')

    const [verifyLinkToken, { isLoading: isVerifying }] = useVerifyLinkTokenMutation();
    const [acceptLinkToken, { isLoading: isAccepting }] = useAcceptLinkTokenMutation();

    // Extract token from URL when component mounts
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tokenValue = params.get('token');

        if (tokenValue) {
            setToken(tokenValue);
            setIsDialogOpen(true);
            verifyToken(tokenValue);
        } else {
            // No token found, redirect to dashboard
            navigate('/dashboard');
        }
    }, [location.search]);

    const verifyToken = async (tokenValue: string) => {
        try {
            const result = await verifyLinkToken({ token: tokenValue }).unwrap();

            if (result.success && result.data) {
                setSourceOrganization(result.data.sourceOrganization);
                setVerificationStatus('verified');
            } else {
                setVerificationStatus('error');
                setError('Unable to verify the invitation link');
            }
        } catch (err: any) {
            setVerificationStatus('error');
            setError(err?.data?.message || 'Invalid or expired invitation link');
        }
    };

    const handleAccept = async () => {
        console.log(token, 'token')
        if (!token) {
            toast.error('NO token found');
            return
        }
        if (!currentOrganization) {
            toast.error('NO organization found');
            return
        }

        try {
            const result = await acceptLinkToken({
                token,
                targetOrganizationId: currentOrganization._id
            }).unwrap();

            if (result.success) {
                setVerificationStatus('accepted');
                toast.success('Organization link established successfully');
            } else {
                setVerificationStatus('error');
                setError('Failed to establish organization link');
            }
        } catch (err: any) {
            setVerificationStatus('error');
            setError(err?.data?.message || 'Failed to establish organization link');
        }
    };

    const handleReject = () => {
        setVerificationStatus('rejected');
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        // Clear token from URL and redirect to organizations list
        navigate('/dashboard/agency-users');
    };

    // Render verification status content
    const renderStatusContent = () => {
        switch (verificationStatus) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold">Verifying Invitation</h3>
                        <p className="text-sm text-muted-foreground text-center">
                            Please wait while we verify the invitation link...
                        </p>
                    </div>
                );

            case 'verified':
                return (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center space-y-2">
                            <h3 className="text-lg font-semibold">Organization Link Invitation</h3>
                            <p className="text-sm text-muted-foreground text-center">
                                You've been invited to link with the following organization:
                            </p>
                        </div>

                        {sourceOrganization && (
                            <Card className="border">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                            {sourceOrganization.logoUrl ? (
                                                <img
                                                    src={sourceOrganization.logoUrl}
                                                    alt={sourceOrganization.name}
                                                    className="h-full w-full rounded-full"
                                                />
                                            ) : (
                                                <span className="text-primary font-medium text-xl">
                                                    {sourceOrganization.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-lg">{sourceOrganization.name}</p>
                                            <div className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {sourceOrganization.type === 'home' ? (
                                                    <Home className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <Building2 className="h-3 w-3 mr-1" />
                                                )}
                                                {sourceOrganization.type}
                                            </div>
                                        </div>
                                    </div>

                                    {sourceOrganization.message && (
                                        <div className="space-y-2 p-4 bg-muted/10 rounded-lg">
                                            <p className="text-sm font-medium">Message:</p>
                                            <p className="text-sm">{sourceOrganization.message}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <p className="text-sm text-muted-foreground text-center">
                            Linking with this organization will allow sharing of staff and resources between organizations.
                            This can be undone later if needed.
                        </p>
                    </div>
                );

            case 'error':
                return (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <AlertCircle className="h-16 w-16 text-destructive" />
                        <h3 className="text-lg font-semibold">Verification Failed</h3>
                        <p className="text-sm text-destructive text-center">
                            {error || 'The invitation link is invalid or has expired.'}
                        </p>
                    </div>
                );

            case 'accepted':
                return (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-success" />
                        <h3 className="text-lg font-semibold">Link Established!</h3>
                        <p className="text-sm text-muted-foreground text-center">
                            Your organization is now linked with {sourceOrganization?.name}.
                            You can now share staff and resources between organizations.
                        </p>
                    </div>
                );

            case 'rejected':
                return (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <XCircle className="h-16 w-16 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Invitation Declined</h3>
                        <p className="text-sm text-muted-foreground text-center">
                            You have declined the invitation to link with {sourceOrganization?.name}.
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>Organization Link Invitation</DialogTitle>
                    </DialogHeader>

                    {renderStatusContent()}

                    <DialogFooter>
                        <div className="flex justify-between w-full">
                            {verificationStatus === 'verified' ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handleReject}
                                        disabled={isAccepting}
                                    >
                                        Decline
                                    </Button>
                                    <Button
                                        onClick={handleAccept}
                                        disabled={isAccepting}
                                    >
                                        {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Accept & Link
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="default"
                                    onClick={handleCloseDialog}
                                    className="ml-auto"
                                >
                                    {verificationStatus === 'accepted' ? 'View Linked Organizations' : 'Close'}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Placeholder content for the route */}
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Organization Link Verification</h1>
                <p>Verifying organization link invitation...</p>
            </div>
        </>
    );
};

export default OrganizationLinkVerify;