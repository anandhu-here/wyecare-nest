import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, Mail, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { selectCurrentOrganization } from '../OrganizationSlice';
import { useCreateStaffInvitationMutation } from '../organizationApi';

interface StaffInvitationModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffType?: 'admin' | 'care';
}

const StaffInvitationModal: React.FC<StaffInvitationModalProps> = ({
    isOpen,
    onClose,
    staffType = 'care'
}) => {
    const currentOrganization = useSelector(selectCurrentOrganization);
    const [createStaffInvitation, { isLoading }] = useCreateStaffInvitationMutation();

    // Form state
    const [invitationType, setInvitationType] = useState<'single' | 'multiple'>('single');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [emails, setEmails] = useState('');
    const [role, setRole] = useState(staffType === 'care' ? 'carer' : 'admin');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Role options based on type
    const roleOptions = staffType === 'care'
        ? [
            { value: 'carer', label: 'Carer' },
            { value: 'nurse', label: 'Nurse' },
            { value: 'senior_carer', label: 'Senior Carer' }
        ]
        : [
            { value: 'admin', label: 'Admin' },
            { value: 'manager', label: 'Manager' },
            { value: 'hr', label: 'HR' },
            { value: 'finance', label: 'Finance' }
        ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (invitationType === 'single') {
                // Validate single invitation
                if (!firstName || !lastName || !email) {
                    setError('Please fill in all required fields');
                    return;
                }

                if (!validateEmail(email)) {
                    setError('Please enter a valid email address');
                    return;
                }

                // Send single invitation
                await createStaffInvitation({
                    firstName,
                    lastName,
                    email,
                    role,
                    message,
                    staffType
                }).unwrap();

                toast.success(`Invitation sent to ${email}`);
            } else {
                // Validate multiple invitations
                const emailList = parseEmails(emails);

                if (emailList.length === 0) {
                    setError('Please enter at least one valid email address');
                    return;
                }

                // Send batch of invitations
                let successCount = 0;
                let errorCount = 0;

                for (const email of emailList) {
                    try {
                        await createStaffInvitation({
                            email,
                            role,
                            message,
                            staffType
                        }).unwrap();
                        successCount++;
                    } catch (err) {
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    toast.success(`${successCount} invitation(s) sent successfully`);
                }

                if (errorCount > 0) {
                    toast.error(`Failed to send ${errorCount} invitation(s)`);
                }
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to send invitation');
            toast.error('Failed to send invitation');
        }
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const parseEmails = (emailsText: string): string[] => {
        // Split by comma, newline or semicolon, then trim and filter out empty/invalid emails
        return emailsText
            .split(/[,;\n]/)
            .map(email => email.trim())
            .filter(email => email && validateEmail(email));
    };

    const handleClose = () => {
        // Reset state when closing
        setFirstName('');
        setLastName('');
        setEmail('');
        setEmails('');
        setRole(staffType === 'care' ? 'carer' : 'admin');
        setMessage('');
        setSuccess(false);
        setError('');
        onClose();
    };

    // Render success view
    if (success) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <div className="flex flex-col items-center py-8 space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-success" />
                        <h3 className="text-lg font-semibold">Invitation Sent!</h3>
                        <p className="text-sm text-muted-foreground text-center">
                            {invitationType === 'single'
                                ? `${firstName} ${lastName} has been invited to join your organization.`
                                : 'Your invitations have been sent successfully.'}
                        </p>

                        <Button onClick={handleClose} className="mt-4">
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Invite Staff</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="single" onValueChange={(v) => setInvitationType(v as 'single' | 'multiple')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="single">Single Invitation</TabsTrigger>
                        <TabsTrigger value="multiple">Multiple Invitations</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit}>
                        <TabsContent value="single" className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="multiple" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="emails">Email Addresses</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        id="emails"
                                        value={emails}
                                        onChange={(e) => setEmails(e.target.value)}
                                        placeholder="Enter multiple email addresses (separated by commas, semicolons, or new lines)"
                                        className="min-h-[120px] pl-10"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    For multiple invitations, names will need to be entered when the users register.
                                </p>
                            </div>
                        </TabsContent>

                        {/* Common fields for both tabs */}
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-2 gap-2 pt-2">
                                    {roleOptions.map((option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={option.value} id={option.value} />
                                            <Label htmlFor={option.value} className="cursor-pointer">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message (Optional)</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Add a personal message to the invitation"
                                    className="min-h-[80px]"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Invitation
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default StaffInvitationModal;