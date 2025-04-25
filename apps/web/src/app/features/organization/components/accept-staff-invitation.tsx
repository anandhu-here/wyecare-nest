// AcceptStaffInvitation.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useAcceptStaffInvitationMutation } from '../organizationApi';
import { CheckCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const AcceptStaffInvitation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);
    const [invitationDetails, setInvitationDetails] = useState<any>(null);
    const [acceptInvitation, { isLoading, isSuccess, error }] = useAcceptStaffInvitationMutation();

    useEffect(() => {
        const invitationToken = searchParams.get('token');
        if (invitationToken) {
            setToken(invitationToken);
            // You'd typically fetch invitation details here
            // For now we'll simulate it
            setInvitationDetails({
                organizationName: "Test Organization",
                role: "Carer"
            });
        } else {
            navigate('/dashboard');
        }
    }, [searchParams, navigate]);

    const handleAccept = async () => {
        if (token) {
            try {
                await acceptInvitation(token).unwrap();
                toast.success('You have successfully joined the organization');
            } catch (err: any) {
                toast.error(err?.data?.message || 'Failed to accept invitation');
            }
        }
    };

    const handleDecline = () => {
        navigate('/dashboard');
    };

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardContent className="flex flex-col items-center pt-6 pb-4">
                    <CheckCircle className="h-16 w-16 text-success mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Invitation Accepted!</h2>
                    <p className="text-center text-muted-foreground">
                        You have successfully joined {invitationDetails?.organizationName}.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Organization Invitation</CardTitle>
            </CardHeader>
            <CardContent>
                {invitationDetails ? (
                    <p>
                        You've been invited to join {invitationDetails.organizationName} as a {invitationDetails.role}.
                        Would you like to accept this invitation?
                    </p>
                ) : (
                    <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDecline} disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    Decline
                </Button>
                <Button onClick={handleAccept} disabled={isLoading || !invitationDetails}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Accept Invitation
                </Button>
            </CardFooter>
        </Card>
    );
};

export default AcceptStaffInvitation;