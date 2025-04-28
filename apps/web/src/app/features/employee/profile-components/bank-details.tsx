import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
    useGetEmployeeApplicationQuery,
    useUpdateSectionMutation
} from '../employeeApplicationApi';
import {
    Building2,
    User,
    CreditCard,
    Hash,
    ShieldCheck,
    Save,
    Edit2,
    X,
    HelpCircle,
    Loader2
} from 'lucide-react';

interface BankDetailsProps {
    initialData?: Record<string, any>;
    onSubmit?: (data: any, index: number | undefined, section: string) => void;
    selectedSection: string;
    editable?: boolean;
    isViewedByYourOrg?: boolean;
    userId: string;
}

interface BankDetailsData {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    sortCode: string;
}

interface TooltipProps {
    children: React.ReactNode;
    content: string;
}

const BankDetails: React.FC<BankDetailsProps> = ({
    initialData,
    onSubmit,
    selectedSection,
    isViewedByYourOrg = false,
    userId,
    editable = true
}) => {
    const [editableSections, setEditableSections] = useState({
        bankDetails: false
    });
    const [formInitialized, setFormInitialized] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const dispatch = useDispatch();
    const { data: carerApplication, refetch } = useGetEmployeeApplicationQuery({
        carerId: userId
    }, {
        skip: isViewedByYourOrg,
        refetchOnMountOrArgChange: true
    });

    const [updateApplicationSection] = useUpdateSectionMutation();

    // Process initial data
    const processData = (data: any): BankDetailsData => {
        if (!data) {
            return {
                accountHolderName: '',
                bankName: '',
                accountNumber: '',
                sortCode: ''
            };
        }

        return {
            accountHolderName: data.accountHolderName || '',
            bankName: data.bankName || '',
            accountNumber: data.accountNumber || '',
            sortCode: data.sortCode || ''
        };
    };

    // Initialize form with default values
    const defaultValues = editable
        ? processData(carerApplication?.data[selectedSection])
        : processData(initialData);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<BankDetailsData>({
        defaultValues
    });

    useEffect(() => {
        if (editable && carerApplication?.data[selectedSection]) {
            reset(processData(carerApplication.data[selectedSection]));
            setFormInitialized(true);
        } else if (!editable && initialData) {
            reset(processData(initialData));
            setFormInitialized(true);
        }
    }, [carerApplication, selectedSection, reset, editable, initialData]);

    const handleSave = async (data: BankDetailsData) => {
        if (!editable && !isViewedByYourOrg) return;
        setSaving(true);

        try {
            await updateApplicationSection({
                section: `${selectedSection}`,
                data,
                carerId: userId
            }).unwrap();

            if (isViewedByYourOrg) {
                setEditableSections(prev => ({
                    ...prev,
                    bankDetails: false
                }));
            }

            toast.success('Bank details saved successfully');
        } catch (error: any) {
            console.error('Save failed:', error);
            toast.error(`Failed to save bank details: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const renderTextField = (
        name: keyof BankDetailsData,
        label: string,
        Icon: React.ElementType,
        rules: Record<string, any> = {},
        type: string = 'text',
        tooltip?: string,
        autoComplete: string = 'off'
    ) => (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field }) => {
                const isEditable = editable || editableSections.bankDetails;
                const value = field.value || '';

                return isEditable ? (
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {label}
                            {tooltip && (
                                <Tooltip content={tooltip}>
                                    <HelpCircle className="inline-block w-4 h-4 ml-1 text-gray-400" />
                                </Tooltip>
                            )}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Icon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                {...field}
                                value={value}
                                type={type}
                                autoComplete={autoComplete}
                                className={`
                  w-full pl-10 pr-4 py-2.5 rounded-lg border
                  focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  transition-all duration-200
                  ${errors[name] ? 'border-red-300' : 'border-gray-300'}
                  ${type === 'password' ? 'font-mono tracking-wider' : ''}
                `}
                            />
                        </div>
                        {errors[name] && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors[name]?.message as string}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1">
                        <span className="text-sm text-gray-500">{label}</span>
                        <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg">
                            <Icon className="w-5 h-5 text-primary-500" />
                            <span className="font-medium text-gray-900">
                                {value || 'N/A'}
                            </span>
                        </div>
                    </div>
                );
            }}
        />
    );

    return (
        <div className="bg-gray-50 rounded-2xl">
            <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
                {/* Header section */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-primary-600" />
                        <h2 className="text-xl font-semibold text-gray-900 relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-10 after:h-0.5 after:bg-primary-600 after:rounded-full">
                            Bank Details
                        </h2>
                    </div>

                    {!editable && isViewedByYourOrg && (
                        <button
                            onClick={() => setEditableSections(prev => ({
                                ...prev,
                                bankDetails: !prev.bankDetails
                            }))}
                            className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                transition-all duration-200
                ${editableSections.bankDetails
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                }
              `}
                        >
                            {editableSections.bankDetails ? (
                                <>
                                    <X className="w-4 h-4" />
                                    Cancel Edit
                                </>
                            ) : (
                                <>
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Form section */}
                <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            {renderTextField(
                                'accountHolderName',
                                'Account Holder Name',
                                User,
                                { required: 'Account holder name is required' }
                            )}
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            {renderTextField(
                                'bankName',
                                'Bank Name',
                                Building2,
                                { required: 'Bank name is required' }
                            )}
                        </div>

                        <div>
                            {renderTextField(
                                'accountNumber',
                                'Account Number',
                                CreditCard,
                                {
                                    required: 'Account number is required'
                                },
                                'text',
                                undefined,
                                'new-password'
                            )}
                        </div>

                        <div>
                            {renderTextField(
                                'sortCode',
                                'Sort Code',
                                Hash,
                                {
                                    required: 'Sort code is required'
                                },
                                'text'
                            )}
                        </div>
                    </div>

                    {/* Security notice */}
                    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-lg mt-8">
                        <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-medium text-green-700">
                                Secure Information
                            </p>
                            <p className="text-sm text-green-600">
                                Your bank details are encrypted and stored securely. This
                                information is only used for payment processing.
                            </p>
                        </div>
                    </div>

                    {/* Save button */}
                    {(editable || editableSections.bankDetails) && (
                        <div className="flex justify-end pt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`
                  inline-flex items-center px-6 py-3 rounded-lg text-white
                  shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-primary-500 transition-all duration-200
                  ${saving
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
                                    }
                `}
                            >
                                {saving ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="animate-spin h-5 w-5 text-white" />
                                        <span>Saving Changes...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        <span>Save Bank Details</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && (
                <div className="absolute left-0 -top-12 z-50 w-48 bg-gray-900 text-white text-sm py-2 px-3 rounded-lg shadow-lg">
                    {content}
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45" />
                </div>
            )}
        </div>
    );
};

export default BankDetails;