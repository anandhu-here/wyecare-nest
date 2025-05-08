import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    Shield,
    Bell,
    Globe,
    Key,
    Trash2,
    MailWarning,
    AlertTriangle,
    MessageCircle,
    Smartphone,
    Mail,
    Info,
    Plus,
    X
} from 'lucide-react';
import { selectCurrentOrganization, selectCurrentUser } from '@/features/auth/authSlice';

// Comment out the dialogs import as requested
// import {
//     RequestResetDialog,
//     ResetPasswordDialog
// } from '@wyecare/frontend/components/core/dialogs/users/password-reset';

// Temporarily comment out RTK Query hooks
// import { useRequestDeleteAccountMutation } from '@/redux/services/authApi';
// import {
//     useGetNotificationQuotaQuery,
//     useGetNotificationSettingsQuery,
//     useUpdateNotificationSettingsMutation
// } from '@/redux/services/organisationApi';

// Helper Components
const SettingSection = ({ icon, title, description, children }) => (
    <div className="bg-white rounded-lg shadow-sm mb-6 dark:bg-gray-800 bg-primary-50 border ">
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-2 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg font-semibold ">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {children}
        </div>
    </div>
);

const Switch = ({ checked, onChange, disabled = false }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out focus:outline-none
            ${checked
                ? 'bg-primary-600 dark:bg-primary-500'
                : 'bg-gray-200 dark:bg-gray-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
    >
        <span
            className={`
                inline-block h-4 w-4 transform rounded-full bg-gray-50
                transition duration-200 ease-in-out
                ${checked ? 'translate-x-6' : 'translate-x-1'}
            `}
        />
    </button>
);

const Modal = ({ open, onClose, title, children, footer = null }) => {
    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 bg-primary-50 border rounded-lg shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold ">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const AccountSettingsTab: React.FC = () => {
    // Replace useAppSelector with separate selectors
    const userState = useSelector(selectCurrentUser);
    const currentOrganization = useSelector(selectCurrentOrganization);

    // Create dummy data for notification settings and quota since RTK query might not be implemented
    const [notificationSettings, setNotificationSettings] = useState({
        push: { enabled: false },
        sms: { enabled: false, additionalNumbers: [] },
        email: { enabled: true }
    });
    const [notificationQuota, setNotificationQuota] = useState({
        push: { used: 12, monthly: 100 },
        sms: { used: 25, monthly: 200 }
    });

    // Comment out the RTK Query hooks and use dummy state instead
    const notificationSettingsLoading = false;
    const notificationQuotaLoading = false;

    const dispatch = useDispatch();

    const { control, handleSubmit, setValue } = useForm({
        defaultValues: {
            email: '',
            password: '',
            notifications: true,
            twoFactor: false,
            accountUpdates: true,
            marketingEmails: false,
            language: 'en',
            timeFormat: '24h',
            dateFormat: 'DD/MM/YYYY',
            pushNotification: Boolean(notificationSettings?.push?.enabled),
            smsNotification: Boolean(notificationSettings?.sms?.enabled),
        }
    });

    const [openRequestDialog, setOpenRequestDialog] = useState(false);
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openErrorDialog, setOpenErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [openAddNumberDialog, setOpenAddNumberDialog] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState('');

    // Comment out the actual mutation and use a dummy function
    // const [requestDeletion] = useRequestDeleteAccountMutation();
    const requestDeletion = async () => {
        // Placeholder for the actual API call
        return Promise.resolve({ data: 'success' });
    };

    const handleAddNumber = async () => {
        try {
            const updatedSettings = {
                ...notificationSettings,
                sms: {
                    ...notificationSettings?.sms,
                    additionalNumbers: [
                        ...(notificationSettings?.sms?.additionalNumbers || []),
                        newPhoneNumber
                    ]
                }
            };

            // Update local state instead of calling API
            setNotificationSettings(updatedSettings);

            setNewPhoneNumber('');
            setOpenAddNumberDialog(false);
            toast.success('Phone number added successfully');
        } catch (error) {
            toast.error('Failed to add phone number');
        }
    };

    const handleRemoveNumber = async (index: number) => {
        try {
            const currentNumbers = [...(notificationSettings?.sms?.additionalNumbers || [])];
            currentNumbers.splice(index, 1);

            const updatedSettings = {
                ...notificationSettings,
                sms: {
                    ...notificationSettings?.sms,
                    additionalNumbers: currentNumbers
                }
            };

            // Update local state instead of calling API
            setNotificationSettings(updatedSettings);

            toast.success('Phone number removed successfully');
        } catch (error) {
            toast.error('Failed to remove phone number');
        }
    };

    const handleToggleNotification = async (type: 'push' | 'sms', value: boolean) => {
        try {
            const updatedSettings = {
                ...notificationSettings,
                [type]: {
                    ...notificationSettings[type],
                    enabled: value,
                    quotaExceededAction: 'continue'
                }
            };

            // Update local state instead of calling API
            setNotificationSettings(updatedSettings);
        } catch (error) {
            console.error('Failed to update notification settings:', error);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await requestDeletion();
            toast.success('Account deletion requested');
            setOpenDeleteDialog(false);
            window.location.href = '/';
        } catch (error) {
            console.error('Error deleting account:', error);
            setErrorMessage(
                'An error occurred while deleting the account'
            );
            setOpenErrorDialog(true);
        }
    };

    useEffect(() => {
        if (notificationSettings) {
            setValue('pushNotification', Boolean(notificationSettings.push?.enabled));
            setValue('smsNotification', Boolean(notificationSettings.sms?.enabled));
        }
    }, [notificationSettings, setValue]);

    return (
        <div className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* Security Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl hover:border-primary-500 transition-colors">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h6 className="text-lg font-semibold">Security & Password</h6>
                                    <p className="text-sm text-gray-600">Manage your password and security settings</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                                    <div>
                                        <h3 className="text-sm font-medium">Change Password</h3>
                                        <p className="text-sm text-gray-600">Update your account password</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setOpenRequestDialog(true)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        <Key className="w-4 h-4 mr-2" />
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl hover:border-primary-500 transition-colors">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div>
                                    <h6 className="text-lg font-semibold">Notifications</h6>
                                    <p className="text-sm text-gray-600">Manage your notification preferences</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Push Notifications */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <Smartphone className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <h3 className="text-sm font-medium">Push Notifications</h3>
                                            <p className="text-sm text-gray-600">Receive updates on your device</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {notificationQuota?.push?.used && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                {notificationQuota.push.used}/{notificationQuota.push.monthly} used
                                            </span>
                                        )}
                                        <Controller
                                            name="pushNotification"
                                            control={control}
                                            render={({ field }) => (
                                                <Switch
                                                    checked={Boolean(notificationSettings?.push?.enabled)}
                                                    onChange={(checked) => {
                                                        field.onChange(checked);
                                                        handleToggleNotification('push', checked);
                                                    }}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* SMS Notifications */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <MessageCircle className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <h3 className="text-sm font-medium">SMS Notifications</h3>
                                            <p className="text-sm text-gray-600">Get real-time updates via SMS</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {notificationQuota?.sms?.used && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                {notificationQuota.sms.used}/{notificationQuota.sms.monthly} used
                                            </span>
                                        )}
                                        <Controller
                                            name="smsNotification"
                                            control={control}
                                            render={({ field }) => (
                                                <Switch
                                                    checked={Boolean(notificationSettings?.sms?.enabled)}
                                                    onChange={(checked) => {
                                                        field.onChange(checked);
                                                        handleToggleNotification('sms', checked);
                                                    }}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Quota Information */}
                                {(notificationQuota?.sms?.used > 0 || notificationQuota?.push?.used > 0) && (
                                    <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-primary-600">
                                                {notificationQuota.sms.used + notificationQuota.push.used} notifications sent this month
                                            </p>
                                            <button
                                                className="p-1 hover:bg-primary-100 rounded-full transition-colors"
                                                title="Monthly quota resets on the 1st of each month"
                                            >
                                                <Info className="w-4 h-4 text-primary-600" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* SMS Numbers Section */}
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                    <h3 className="text-sm font-medium mb-4">SMS Notification Numbers</h3>

                                    {/* Default Number */}
                                    <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Default Organization Number</p>
                                                <p className="text-sm text-gray-600">
                                                    {currentOrganization?.countryCode} {currentOrganization?.phone}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                Default
                                            </span>
                                        </div>
                                    </div>

                                    {/* Additional Numbers */}
                                    {notificationSettings?.sms?.additionalNumbers?.map((number, index) => (
                                        <div
                                            key={index}
                                            className="mb-2 p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between"
                                        >
                                            <span className="text-sm">{number}</span>
                                            <button
                                                onClick={() => handleRemoveNumber(index)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add Number Button */}
                                    <button
                                        type="button"
                                        onClick={() => setOpenAddNumberDialog(true)}
                                        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Phone Number
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Danger Zone Card */}
                    <div className="bg-white border border-red-200 rounded-2xl hover:border-red-300 transition-colors">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-red-50 text-red-600">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h6 className="text-lg font-semibold text-red-600">Danger Zone</h6>
                                    <p className="text-sm text-gray-600">Permanent account actions</p>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 flex items-start gap-3">
                                <MailWarning className="w-5 h-5 mt-0.5" />
                                <p className="text-sm">
                                    Deleting your account will permanently remove all your data.
                                    This action cannot be undone.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpenDeleteDialog(true)}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Account
                            </button>
                        </div>
                    </div>

                    {/* Admin Section */}
                    {userState?.role === 'admin' && currentOrganization?.type === 'home' && (
                        <div className="mt-6">
                            {/* Comment out TimeSheetAdminSection as it's likely not available yet */}
                            {/* <TimeSheetAdminSection /> */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Admin controls will be available here.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Commented out dialogs but keeping their usage as requested */}
            {/* <RequestResetDialog
                open={openRequestDialog}
                onClose={() => setOpenRequestDialog(false)}
                onRequestSuccess={() => {
                    setOpenRequestDialog(false);
                    setOpenResetDialog(true);
                }}
            />

            <ResetPasswordDialog
                open={openResetDialog}
                onClose={() => setOpenResetDialog(false)}
                onResetSuccess={() => {
                    setOpenResetDialog(false);
                    toast.success('Password reset successful');
                }}
            /> */}

            {/* Modals implemented with the Modal component */}
            {/* Delete Account Dialog */}
            <Modal
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                title={
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Confirm Account Deletion
                    </div>
                }
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setOpenDeleteDialog(false)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 inline-flex items-center text-red-600 border border-red-300 
                                     dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-200">
                        Are you sure you want to delete your account? This action cannot be undone.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <li className="flex items-center gap-2">
                            • All your personal data will be permanently deleted
                        </li>
                        <li className="flex items-center gap-2">
                            • You will lose access to all your account settings
                        </li>
                        <li className="flex items-center gap-2">
                            • This action is irreversible
                        </li>
                    </ul>
                </div>
            </Modal>

            {/* Error Dialog */}
            <Modal
                open={openErrorDialog}
                onClose={() => setOpenErrorDialog(false)}
                title={
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Error
                    </div>
                }
                footer={
                    <button
                        type="button"
                        onClick={() => setOpenErrorDialog(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        Close
                    </button>
                }
            >
                <p className="text-gray-700 dark:text-gray-200">
                    {errorMessage}
                </p>
            </Modal>

            {/* Add Phone Number Dialog */}
            <Modal
                open={openAddNumberDialog}
                onClose={() => setOpenAddNumberDialog(false)}
                title="Add Phone Number"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setOpenAddNumberDialog(false)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAddNumber}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            disabled={!newPhoneNumber}
                        >
                            Add Number
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={newPhoneNumber}
                            onChange={(e) => setNewPhoneNumber(e.target.value)}
                            placeholder="+1234567890"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                     focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Include country code (e.g., +1234567890)
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AccountSettingsTab;