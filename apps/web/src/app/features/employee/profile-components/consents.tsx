import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
    useGetEmployeeApplicationQuery,
    useUpdateSectionMutation
} from '../employeeApplicationApi';
import {
    Shield,
    ShieldCheck,
    FileText,
    Save,
    Edit2,
    X,
    Info,
    Loader2
} from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

// Consent Configuration
const consentDetails: Record<keyof ConsentsData, ConsentInfo> = {
    dataProcessing: {
        title: 'Data Processing Agreement',
        description: 'We handle your data with utmost care and in compliance with GDPR regulations.',
        icon: Shield,
        content: `Our Data Processing Agreement outlines how we collect, process, and protect your personal information. This includes:

    1. Purpose of data collection
    2. How we process your information
    3. Your rights regarding your data
    4. Security measures we implement
    5. Data retention policies
    
    We are committed to maintaining the confidentiality and security of your information in compliance with GDPR and relevant data protection laws.`
    },
    backgroundCheck: {
        title: 'Background Check Authorization',
        description: 'Authorization for conducting necessary background verifications.',
        icon: ShieldCheck,
        content: `By agreeing to the background check authorization, you permit us to:

    1. Verify your identity
    2. Check employment history
    3. Verify professional qualifications
    4. Conduct criminal record checks
    5. Contact professional references
    
    This information is essential for ensuring the safety and quality of our care services.`
    },
    termsAndConditions: {
        title: 'Terms and Conditions',
        description: 'Our standard terms and conditions for care services.',
        icon: FileText,
        content: `Our Terms and Conditions establish the framework for our professional relationship. Key points include:

    1. Service delivery standards
    2. Payment terms and conditions
    3. Cancellation policies
    4. Professional conduct expectations
    5. Dispute resolution procedures
    
    These terms ensure clarity and mutual understanding in our service delivery.`
    }
};

interface ConsentsProps {
    initialData?: Record<string, any>;
    onSubmit?: (data: any, index: number | undefined, section: string) => void;
    selectedSection: string;
    editable?: boolean;
    isViewedByYourOrg?: boolean;
    userId: string;
}

interface ConsentsData {
    dataProcessing: boolean;
    backgroundCheck: boolean;
    termsAndConditions: boolean;
}

interface ConsentInfo {
    title: string;
    description: string;
    icon: React.ElementType;
    content: string;
}

const Consents: React.FC<ConsentsProps> = ({
    initialData,
    onSubmit,
    selectedSection,
    isViewedByYourOrg = false,
    userId,
    editable = true
}) => {
    const [editableSections, setEditableSections] = useState({
        consents: false
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
    const processData = (data: any): ConsentsData => {
        if (!data) {
            return {
                dataProcessing: false,
                backgroundCheck: false,
                termsAndConditions: false
            };
        }

        return {
            dataProcessing: data.dataProcessing || false,
            backgroundCheck: data.backgroundCheck || false,
            termsAndConditions: data.termsAndConditions || false
        };
    };

    const defaultValues = editable
        ? processData(carerApplication?.data[selectedSection])
        : processData(initialData);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ConsentsData>({
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

    const handleSave = async (data: ConsentsData) => {
        if (!editable && !isViewedByYourOrg) return;
        setSaving(true);

        try {
            await updateApplicationSection({
                section: selectedSection,
                data,
                carerId: userId
            }).unwrap();

            if (isViewedByYourOrg) {
                setEditableSections(prev => ({
                    ...prev,
                    consents: false
                }));
            }

            toast.success('Consents saved successfully');
            await refetch();
        } catch (error: any) {
            console.error('Save failed:', error);
            toast.error(`Failed to save consents: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-primary-600" />
                        <CardTitle>Consents and Agreements</CardTitle>
                    </div>

                    {!editable && isViewedByYourOrg && (
                        <Button
                            variant={editableSections.consents ? "destructive" : "outline"}
                            onClick={() => setEditableSections(prev => ({
                                ...prev,
                                consents: !prev.consents
                            }))}
                            size="sm"
                        >
                            {editableSections.consents ? (
                                <>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel Edit
                                </>
                            ) : (
                                <>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </>
                            )}
                        </Button>
                    )}
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
                        {(Object.keys(consentDetails) as Array<keyof ConsentsData>).map((key) => {
                            const consent = consentDetails[key];
                            const ConsentIcon = consent.icon;

                            return (
                                <Controller
                                    key={key}
                                    name={key}
                                    control={control}
                                    rules={{}}
                                    render={({ field, fieldState: { error } }) => (
                                        <div className="border rounded-md p-4">
                                            <div className="flex flex-col space-y-4">
                                                {/* Header */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <ConsentIcon className="w-5 h-5 mt-1 text-gray-500" />
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">{consent.title}</h3>
                                                            <p className="text-sm text-gray-600">{consent.description}</p>
                                                        </div>
                                                    </div>

                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="px-2 h-8">
                                                                <Info className="w-4 h-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle className="flex items-center gap-2">
                                                                    <ConsentIcon className="w-5 h-5" />
                                                                    {consent.title}
                                                                </DialogTitle>
                                                            </DialogHeader>
                                                            <ScrollArea className="max-h-[60vh] mt-4">
                                                                <div className="prose prose-sm max-w-none">
                                                                    <p className="whitespace-pre-line">{consent.content}</p>
                                                                </div>
                                                            </ScrollArea>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>

                                                {/* Checkbox */}
                                                {(editable || editableSections.consents) && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Checkbox
                                                            id={`consent-${key}`}
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                        <Label
                                                            htmlFor={`consent-${key}`}
                                                            className="text-sm text-gray-700"
                                                        >
                                                            I have read and agree to the {consent.title.toLowerCase()}
                                                        </Label>
                                                    </div>
                                                )}

                                                {/* Read-only status */}
                                                {!editable && !editableSections.consents && (
                                                    <div className="pt-2 border-t">
                                                        <span className={`text-sm ${field.value ? 'text-green-600' : 'text-red-600'}`}>
                                                            {field.value ? 'Agreed' : 'Not yet agreed'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Error message */}
                                                {error && (
                                                    <p className="text-sm text-red-500 mt-1">{error.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                />
                            );
                        })}

                        {/* Save button */}
                        {(editable || editableSections.consents) && (
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Consents
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Consents;