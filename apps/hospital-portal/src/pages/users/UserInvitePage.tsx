import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAbility } from '@/lib/casl/AbilityContext';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

// Import UI components
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, Send, AlertCircle } from 'lucide-react';
import {
    useInvitationsControllerCreateMutation,
    useRolesControllerFindAllQuery
} from '@/features/generatedApi';

const useGetDepartmentsQuery = () => {
    return {
        data: [
            { id: '1', name: 'Administration' },
            { id: '2', name: 'Cardiology' },
            { id: '3', name: 'Emergency' },
            { id: '4', name: 'General Medicine' },
            { id: '5', name: 'Laboratory' },
            { id: '6', name: 'Neurology' },
            { id: '7', name: 'Pediatrics' },
            { id: '8', name: 'Radiology' }
        ],
        isLoading: false,
        error: null
    };
};

// Use the departments query if it's available

export function UserInvitePage() {
    const navigate = useNavigate();
    const ability = useAbility();
    const currentUser = useAppSelector(selectCurrentUser);

    // Get roles data using RTK Query
    const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } = useRolesControllerFindAllQuery({
        take: 100,
        isSystemRole: true,
        organizationId: currentUser?.organizationId
    }, {
        refetchOnFocus: true,
        refetchOnReconnect: true,
        refetchOnMountOrArgChange: true,
    });


    console.log('Roles data:', rolesData);

    // Extract roles from the response (adjust based on your API response structure)
    const roles = rolesData?.roles || [];

    // Get departments data - if you have a query for this, use it
    const { data: departmentsData, isLoading: departmentsLoading } = useGetDepartmentsQuery(
        currentUser?.organizationId
    );

    // Extract departments from the response
    const departments = departmentsData?.data || [];

    // Create invitation mutation
    const [createInvitation, { isLoading: isSubmitting }] = useInvitationsControllerCreateMutation();

    // Form validation schema
    const form = useForm({
        defaultValues: {
            email: '',
            roleId: '',
            departmentId: '',
            message: '',
            sendCopy: false,
        },
    });

    // Check if user has permission to invite users
    React.useEffect(() => {
        if (!ability.can('invite', 'User')) {
            toast.error('You do not have permission to invite users.');
            navigate('/dashboard');
        }
    }, [ability, navigate]);

    // Handle form submission
    const onSubmit = async (values) => {
        try {
            console.log('Submitting invitation with values:', values);

            // Format the data for the API
            const invitationData = {
                email: values.email,
                ...(values.roleId && { roleId: values.roleId }),
                ...(values.message && { message: values.message }),
                organizationId: currentUser?.organizationId
                // Don't include expiresAt unless specifically needed
            };

            console.log('Formatted invitation data:', invitationData);

            // Submit invitation
            const response = await createInvitation(invitationData).unwrap();
            console.log('Invitation created successfully:', response);

            // Show success message
            toast.success(`Invitation sent to ${values.email}`);

            // Optionally navigate back to invitations list
            // navigate('/invitations');
        } catch (error) {
            console.error('Error creating invitation:', error);
            toast.error('Failed to send invitation. Please try again.');
        }
    };

    const selectedRole = roles?.find(role => role.id === form.watch('roleId'));

    return (
        <div className="mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Invite User</h1>
                    <p className="text-muted-foreground mt-1">
                        Send invitations to new users to join your organization
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={() => navigate('/invitations')}
                >
                    View Invitations
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-5">
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>New Invitation</CardTitle>
                        <CardDescription>
                            Invite a new user to join {currentUser?.organization?.name || 'your organization'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {rolesLoading ? (
                            <div className="flex items-center justify-center p-6">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    {form.formState.errors.root && (
                                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-2" />
                                            {form.formState.errors.root.message}
                                        </div>
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        rules={{ required: "Email is required" }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="colleague@example.com"
                                                        {...field}
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    An invitation will be sent to this email address
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="roleId"
                                        rules={{ required: "Role is required" }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    disabled={isSubmitting || rolesLoading}
                                                    onOpenChange={refetchRoles}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a role" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {roles?.length > 0 ? (
                                                            roles.map((role) => (
                                                                <SelectItem key={role.id} value={role.id}>
                                                                    {role.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <SelectItem value="none" disabled>
                                                                No roles available
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    {selectedRole
                                                        ? selectedRole.description
                                                        : 'The user\'s role determines their permissions'}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {departments?.length > 0 && (
                                        <FormField
                                            control={form.control}
                                            name="departmentId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Department (Optional)</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        disabled={isSubmitting || departmentsLoading}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a department" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="">None</SelectItem>
                                                            {departments.map((department) => (
                                                                <SelectItem key={department.id} value={department.id}>
                                                                    {department.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        Assign the user to a specific department
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Personal Message (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Add a personal message to the invitation email"
                                                        {...field}
                                                        disabled={isSubmitting}
                                                        rows={3}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="sendCopy"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Send me a copy of the invitation
                                                    </FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end space-x-4 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate('/users')}
                                            disabled={isSubmitting}
                                            type="button"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Send Invitation
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                </Card>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>About User Invitations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-md bg-primary/10 p-4">
                                <h3 className="font-medium flex items-center">
                                    <UserPlus className="h-4 w-4 mr-2 text-primary" />
                                    How It Works
                                </h3>
                                <ul className="mt-2 space-y-2 text-sm">
                                    <li className="flex gap-2">
                                        <span className="font-bold text-primary">1.</span>
                                        <span>Fill out the form with the new user's email and select their role</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-primary">2.</span>
                                        <span>The user receives an email with a link to join your organization</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-primary">3.</span>
                                        <span>They create their account and are automatically assigned their role</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold text-primary">4.</span>
                                        <span>You can manage pending invitations from the invitations page</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Invitation Settings</h3>
                                <p className="text-sm text-muted-foreground">
                                    Invitations expire after 7 days. You can resend or revoke pending invitations from the invitations management page.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Role Information</h3>
                                <p className="text-sm text-muted-foreground">
                                    The role you select determines the user's permissions in the system. Make sure to select the appropriate role for the user.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default UserInvitePage;