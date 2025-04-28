import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import {
    Eye,
    FileText,
    Hash,
    Paperclip,
    Upload,
    X,
    Save,
    Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { IEmployeeApplication } from '@wyecare-monorepo/shared-types';
import { useDispatch } from 'react-redux';
import { employeeApplicationApi, useDeleteDocumentMutation, useGetEmployeeApplicationQuery, useUpdateSectionMutation } from '../employeeApplicationApi';
import { apiHostname } from '@/config/api';
import { toast } from 'react-toastify';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { DatePicker } from '@/components/date-picker';

interface IdentificationDocumentsProps {
    initialData?: IEmployeeApplication['identificationDocuments'];
    onSubmit?: (data: IEmployeeApplication['identificationDocuments']) => void;
    selectedSection: string;
    editable?: boolean;
    userId?: string;
    isViewedByYourOrg?: boolean;
}

type DocumentType = 'passport' | 'drivingLicense' | 'biometricResidencePermit';
type DocumentSide = 'front' | 'back';

interface DocumentFile {
    front?: File;
    back?: File;
}

const IdentificationDocuments: React.FC<IdentificationDocumentsProps> = ({
    initialData,
    onSubmit,
    selectedSection,
    isViewedByYourOrg,
    userId,
    editable = true,
}) => {
    const dispatch = useDispatch();
    const { data: applicationResponse, isLoading: isApplicationLoading } = useGetEmployeeApplicationQuery({
        carerId: userId
    }, {
        skip: !userId
    });
    const employeeApplication = applicationResponse?.data;

    const [updateSection] = useUpdateSectionMutation();
    const [deleteDocument, { isLoading: isDeletingDocument }] = useDeleteDocumentMutation();

    const [editableSections, setEditableSections] = useState<{
        [key in DocumentType]?: boolean;
    }>({});

    const [selectedFiles, setSelectedFiles] = useState<{
        [key in DocumentType]?: DocumentFile;
    }>({});

    const [uploadingDocument, setUploadingDocument] = useState<{
        [key in DocumentType]?: { [side in DocumentSide]?: boolean };
    }>({});

    const [savingSection, setSavingSection] = useState<{
        [key: string]: boolean;
    }>({});

    const defaultValues = editable
        ? employeeApplication?.[selectedSection] || {
            rightToWorkStatus: '',
            passport: {
                number: '',
                expiryDate: null,
                frontUploadUrl: undefined,
                backUploadUrl: undefined,
            },
            drivingLicense: {
                number: '',
                expiryDate: null,
                frontUploadUrl: undefined,
                backUploadUrl: undefined,
            },
            biometricResidencePermit: {
                number: '',
                expiryDate: null,
                frontUploadUrl: undefined,
                backUploadUrl: undefined,
            },
        }
        : initialData || {
            rightToWorkStatus: '',
            passport: {
                number: '',
                expiryDate: null,
                frontUploadUrl: undefined,
                backUploadUrl: undefined,
            },
            drivingLicense: {
                number: '',
                expiryDate: null,
                frontUploadUrl: undefined,
                backUploadUrl: undefined,
            },
            biometricResidencePermit: {
                number: '',
                expiryDate: null,
                frontUploadUrl: undefined,
                backUploadUrl: undefined,
            },
        };

    const { control, handleSubmit, watch, setValue, reset } = useForm<
        IEmployeeApplication['identificationDocuments']
    >({
        defaultValues,
    });


    console.log("Initial form data source:", {
        editable,
        employeeApplicationData: employeeApplication?.[selectedSection],
        initialData,
        userId
    });

    useEffect(() => {
        // Log what's happening
        console.log("Form reset triggered", {
            hasEmployeeData: Boolean(employeeApplication?.[selectedSection]),
            hasInitialData: Boolean(initialData),
            editable
        });

        // Clearer logic for which data source to use
        if (employeeApplication?.[selectedSection]) {
            console.log("Resetting form with employee data:", employeeApplication[selectedSection]);
            reset(employeeApplication[selectedSection]);
        } else if (initialData) {
            console.log("Resetting form with initial data:", initialData);
            reset(initialData);
        }
    }, [employeeApplication, selectedSection, initialData, reset]);

    const rightToWorkStatus = watch('rightToWorkStatus');

    const handleFileSelect =
        (documentType: DocumentType, side: DocumentSide) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                if (file) {
                    setSelectedFiles((prev) => ({
                        ...prev,
                        [documentType]: {
                            ...prev[documentType],
                            [side]: file,
                        },
                    }));
                }
            };

    const handleFileUpload = async (
        documentType: DocumentType,
        side: DocumentSide
    ) => {
        const files = selectedFiles[documentType];
        const file = files?.[side];

        if (file) {
            setUploadingDocument((prev) => ({
                ...prev,
                [documentType]: {
                    ...prev[documentType],
                    [side]: true,
                },
            }));

            const formData = new FormData();
            formData.append('file', file);
            formData.append('section', `identificationDocuments.${documentType}`);
            formData.append('documentType', documentType);
            formData.append('side', side);

            try {
                const response = await axios.post(
                    `${apiHostname}/api/v1/employee-applications/upload-document${userId ? `?carerId=${userId}` : ''}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

                if (response.data.success) {
                    const documentData = response.data.data.identificationDocuments[documentType];
                    if (documentData && documentData[`${side}UploadUrl`]) {
                        setValue(
                            `${documentType}.${side}UploadUrl` as any,
                            documentData[`${side}UploadUrl`]
                        );
                        toast.success(`${documentType} ${side} side uploaded successfully!`);
                        dispatch(employeeApplicationApi.util.invalidateTags(['EmployeeApplication']));
                    } else {
                        throw new Error(`Upload succeeded but couldn't find the expected URL in the response`);
                    }
                }
            } catch (error: any) {
                console.error('Upload failed:', error);
                toast.error(error.message || 'Failed to upload document');
            } finally {
                setUploadingDocument((prev) => ({
                    ...prev,
                    [documentType]: {
                        ...prev[documentType],
                        [side]: false,
                    },
                }));
                setSelectedFiles((prev) => ({
                    ...prev,
                    [documentType]: {
                        ...prev[documentType],
                        [side]: undefined,
                    },
                }));
            }
        }
    };

    const handleDeleteDocument = async (
        documentType: DocumentType,
        side: DocumentSide
    ) => {
        try {
            await deleteDocument({
                section: `identificationDocuments.${documentType}`,
                side: side,
                carerId: userId,
            }).unwrap();

            setValue(`${documentType}.${side}UploadUrl` as any, undefined);
            toast.success(
                `${documentType} ${side} side deleted successfully!`)
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete document');
        }
    };

    const handleSaveSection = async (section: string, data: any) => {
        setSavingSection((prev) => ({ ...prev, [section]: true }));
        try {
            await updateSection({
                section: `identificationDocuments.${section}`,
                data,
                carerId: userId
            }).unwrap();

            // Handle file uploads if any
            const fileUploads = [];
            if (selectedFiles[section as DocumentType]?.front) {
                fileUploads.push(handleFileUpload(section as DocumentType, 'front'));
            }
            if (selectedFiles[section as DocumentType]?.back) {
                fileUploads.push(handleFileUpload(section as DocumentType, 'back'));
            }

            // Wait for all file uploads to complete
            await Promise.all(fileUploads);

            toast.success(`${section} information saved successfully!`);
            // Reset edit mode if in view mode
            if (isViewedByYourOrg) {
                setEditableSections((prev) => ({
                    ...prev,
                    [section]: false,
                }));
            }
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save section');
        } finally {
            setSavingSection((prev) => ({ ...prev, [section]: false }));
        }
    };

    const renderFileUpload = (docType: DocumentType, side: DocumentSide) => {
        const uploadUrl = watch(`${docType}.${side}UploadUrl` as any);
        const isUploading = uploadingDocument[docType]?.[side];
        const selectedFile = selectedFiles[docType]?.[side];
        const isEditing = editableSections[docType];

        return (
            <div className="w-full mb-4">
                <Label className="mb-2 block">
                    {side.charAt(0).toUpperCase() + side.slice(1)} Side
                </Label>
                <div className="flex items-center gap-3 flex-wrap">
                    {(editable || isEditing) && (
                        <div>
                            <input
                                accept="image/*,.pdf"
                                className="hidden"
                                id={`${docType}-${side}-upload-input`}
                                type="file"
                                onChange={handleFileSelect(docType, side)}
                            />
                            <label
                                htmlFor={`${docType}-${side}-upload-input`}
                                className="inline-flex items-center px-4 py-2 rounded-lg
                bg-primary/10 text-primary hover:bg-primary/20
                transition-all duration-200 gap-2 cursor-pointer"
                            >
                                <Upload className="w-4 h-4" />
                                <span>
                                    {selectedFile
                                        ? selectedFile.name
                                        : uploadUrl
                                            ? 'Replace File'
                                            : 'Upload File'}
                                </span>
                            </label>
                        </div>
                    )}

                    {isUploading && (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Uploading...</span>
                        </div>
                    )}

                    {uploadUrl && (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
                                <Paperclip className="w-4 h-4" />
                                <span className="text-sm">{`${docType} ${side}`}</span>
                                {(editable || isEditing) && (
                                    <button
                                        onClick={() => handleDeleteDocument(docType, side)}
                                        className="hover:bg-muted p-1 rounded-full transition-colors"
                                    >
                                        {isDeletingDocument ? (
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <X className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </button>
                                )}
                            </Badge>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(uploadUrl, '_blank')}
                                title={`View ${side} side`}
                            >
                                <Eye className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderDocumentSection = (docType: DocumentType) => {
        const isSaving = savingSection[docType];
        const isEditing = editableSections[docType];
        const docExists = Boolean(watch(`${docType}` as any)?.number ||
            watch(`${docType}.frontUploadUrl` as any) ||
            watch(`${docType}.backUploadUrl` as any));

        return (
            <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-primary" />
                            <CardTitle>
                                {docType.split(/(?=[A-Z])/).join(' ')}
                            </CardTitle>
                        </div>

                        {!editable && isViewedByYourOrg && (
                            <Button
                                variant={isEditing ? "destructive" : "outline"}
                                onClick={() =>
                                    setEditableSections((prev) => ({
                                        ...prev,
                                        [docType]: !prev[docType],
                                    }))
                                }
                                size="sm"
                            >
                                {isEditing ? 'Cancel Edit' : 'Edit'}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Document Number Input */}
                        <div className="max-w-md">
                            <div className="flex items-center gap-2 mb-2">
                                <Hash className="w-4 h-4 text-muted-foreground" />
                                <Label>{`${docType} Number`}</Label>
                            </div>
                            <Controller
                                name={`${docType}.number` as any}
                                control={control}
                                render={({ field }) =>
                                    editable || isEditing ? (
                                        <Input
                                            {...field}
                                            placeholder={`Enter ${docType} number`}
                                        />
                                    ) : (
                                        <p className="text-foreground">{field.value || 'N/A'}</p>
                                    )
                                }
                            />
                        </div>

                        {/* Document Expiry Date */}
                        <div className="max-w-md">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <Label>{`Expiry Date`}</Label>
                            </div>
                            <Controller
                                name={`${docType}.expiryDate` as any}
                                control={control}
                                render={({ field }) =>
                                    editable || isEditing ? (
                                        <DatePicker
                                            date={field.value ? new Date(field.value) : undefined}
                                            onSelect={(date) => field.onChange(date)}
                                            placeholder="Select expiry date"
                                            fromYear={1900}
                                            toYear={new Date().getFullYear() + 20}
                                            disabledDates={(date) => date < new Date("1900-01-01")}
                                        />
                                    ) : (
                                        <p className="text-foreground">
                                            {field.value
                                                ? new Date(field.value).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    )
                                }
                            />
                        </div>

                        <Separator className="my-6" />

                        {/* File Upload Section */}
                        {renderFileUpload(docType, 'front')}
                        {renderFileUpload(docType, 'back')}

                        {/* Save Button */}
                        {(editable || isEditing) && (
                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={() => {
                                        handleSaveSection(docType, watch(docType as any));
                                        if (isViewedByYourOrg) {
                                            setEditableSections((prev) => ({
                                                ...prev,
                                                [docType]: false,
                                            }));
                                        }
                                    }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" />
                                            <span>Save</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="rounded-2xl">
            <div className="grid grid-cols-1 gap-6">
                <div className="col-span-1">
                    {renderDocumentSection('biometricResidencePermit')}
                </div>
                <div className="col-span-1">{renderDocumentSection('passport')}</div>
                <div className="col-span-1">{renderDocumentSection('drivingLicense')}</div>
            </div>
        </div>
    );
};

export default IdentificationDocuments;