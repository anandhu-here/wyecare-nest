import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { employeeApplicationApi, useDeleteDocumentMutation, useGetEmployeeApplicationQuery, useRemoveFromArrayMutation, useUpdateSectionMutation } from '../employeeApplicationApi';
import { toast } from 'react-toastify';
import { apiHostname } from '@/config/api';

interface ProfessionalInformationProps {
    initialData?: any;
    onSubmit: (data: any, index: number | undefined, section: string) => void;
    selectedSection: string;
    editable?: boolean;
    userId: string;
    isViewedByYourOrg?: boolean;
}

const ProfessionalInformation: React.FC<ProfessionalInformationProps> = ({
    initialData,
    onSubmit,
    selectedSection,
    isViewedByYourOrg = false,
    userId,
    editable = true
}) => {
    const [editableSections, setEditableSections] = useState({
        qualifications: false,
        trainings: false,
        workExperience: false,
        references: false,
        professionalRegistrations: false,
        dbsCheck: false
    });

    const dispatch = useDispatch();
    const {
        data: carerApplication,
        isLoading: isCarerApplicationLoading,
        refetch
    } = useGetEmployeeApplicationQuery({
        carerId: userId
    }, {
        skip: isViewedByYourOrg
    });

    const [updateApplicationSection] = useUpdateSectionMutation();
    const [deleteArrayItem] = useRemoveFromArrayMutation();
    const [deleteDocument] = useDeleteDocumentMutation();

    const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({});
    const [uploadingDocument, setUploadingDocument] = useState<{ [key: string]: boolean }>({});
    const [savingSection, setSavingSection] = useState<{ [key: string]: boolean }>({});
    const [savedSections, setSavedSections] = useState<{ [key: string]: boolean }>({});
    const [dbsFile, setDbsFile] = useState<File | null>(null);
    const [uploadingDbs, setUploadingDbs] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ section: string; index: number } | null>(null);
    const [formInitialized, setFormInitialized] = useState(false);

    const defaultValues = useMemo(() => {
        const data = editable ? carerApplication?.data[selectedSection] || {} : initialData || {};

        const convertDates = (item: any) => {
            if (!item) return item;
            const newItem = { ...item };

            const dateFields = ['dateCompleted', 'dateExpires', 'startDate', 'endDate', 'dateObtained', 'expiryDate'];
            dateFields.forEach(field => {
                if (field in newItem) {
                    newItem[field] = newItem[field] ? new Date(newItem[field]) : null;
                }
            });

            return newItem;
        };

        const processedData = { ...data };
        const arrayFields = ['qualifications', 'trainings', 'workExperience', 'professionalRegistrations', 'references'];

        arrayFields.forEach(key => {
            // Handle the case where the server returns an object with numeric keys instead of an array
            if (processedData[key] && typeof processedData[key] === 'object' && !Array.isArray(processedData[key])) {
                // Convert object with numeric keys to array
                const arrayData = Object.keys(processedData[key])
                    .filter(k => !isNaN(Number(k)))
                    .sort((a, b) => Number(a) - Number(b))
                    .map(k => processedData[key][k]);

                processedData[key] = arrayData.map(convertDates);
            } else if (Array.isArray(processedData[key])) {
                processedData[key] = processedData[key].map(convertDates);
            } else {
                // Initialize empty arrays for fields that don't exist
                processedData[key] = [];
            }
        });

        return processedData;
    }, [carerApplication?.data, selectedSection, editable, initialData]);

    const { control, handleSubmit, reset, watch, getValues, formState: { errors } } = useForm({
        defaultValues
    });

    const qualificationsArray = useFieldArray({ control, name: 'qualifications' });
    const trainingsArray = useFieldArray({ control, name: 'trainings' });
    const workExperienceArray = useFieldArray({ control, name: 'workExperience' });
    const referencesArray = useFieldArray({ control, name: 'references' });
    const professionalRegistrationsArray = useFieldArray({
        name: 'professionalRegistrations',
        control
    });

    useEffect(() => {
        if (editable && carerApplication?.data[selectedSection]) {
            reset(carerApplication.data[selectedSection]);
            setFormInitialized(true);
        } else if (!editable && initialData) {
            reset(initialData);
            setFormInitialized(true);
        }
    }, [carerApplication, selectedSection, reset, editable, initialData]);

    // Ensure arrays are properly initialized with initial data
    useEffect(() => {
        if (formInitialized) {
            const data = editable ? carerApplication?.data[selectedSection] : initialData;

            if (data) {
                // Helper function to convert object with numeric keys to array
                const objectToArray = (obj: any) => {
                    if (!obj) return [];
                    if (Array.isArray(obj)) return obj;

                    return Object.keys(obj)
                        .filter(k => !isNaN(Number(k)))
                        .sort((a, b) => Number(a) - Number(b))
                        .map(k => obj[k]);
                };

                // Handle qualifications (might be object with numeric keys or array)
                const qualifications = objectToArray(data.qualifications);
                if (qualifications.length > 0) {
                    qualificationsArray.replace(qualifications.map(convertDates));
                }

                // Handle trainings (might be object with numeric keys or array)
                const trainings = objectToArray(data.trainings);
                if (trainings.length > 0) {
                    trainingsArray.replace(trainings.map(convertDates));
                }

                // Handle workExperience (might be object with numeric keys or array)
                const workExperience = objectToArray(data.workExperience);
                if (workExperience.length > 0) {
                    workExperienceArray.replace(workExperience.map(convertDates));
                }

                // Handle references (might be object with numeric keys or array)
                const references = objectToArray(data.references);
                if (references.length > 0) {
                    referencesArray.replace(references.map(convertDates));
                }

                // Handle professionalRegistrations (might be object with numeric keys or array)
                const professionalRegistrations = objectToArray(data.professionalRegistrations);
                if (professionalRegistrations.length > 0) {
                    professionalRegistrationsArray.replace(professionalRegistrations.map(convertDates));
                }
            }
        }
    }, [formInitialized, carerApplication, initialData, selectedSection, editable,
        qualificationsArray, trainingsArray, workExperienceArray, referencesArray, professionalRegistrationsArray]);

    const convertDates = (item: any) => {
        if (!item) return item;
        const newItem = { ...item };

        const dateFields = ['dateCompleted', 'dateExpires', 'startDate', 'endDate', 'dateObtained', 'expiryDate'];
        dateFields.forEach(field => {
            if (field in newItem) {
                newItem[field] = newItem[field] ? new Date(newItem[field]) : null;
            }
        });

        return newItem;
    };

    const handleFileSelect = (section: string, index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFiles((prev) => ({
                ...prev,
                [`${section}.${index}`]: file
            }));
        }
    };

    const handleDbsFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setDbsFile(file);
        }
    };

    const handleFileUpload = async (section: string, index?: number) => {
        const key = `${section}${index !== undefined ? `.${index}` : ''}`;
        const file = selectedFiles[key];
        if (file) {
            setUploadingDocument((prev) => ({ ...prev, [key]: true }));
            const formData = new FormData();
            formData.append('file', file);
            formData.append('section', `professionalInfo.${section}`);
            formData.append('documentType', section);
            if (index !== undefined) {
                formData.append('index', index.toString());
            }

            try {

                const response = await axios.post(
                    `${apiHostname}/api/v1/application/upload-document?carerId=${userId}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (response.data.success) {
                    toast.success(`${section} document uploaded successfully`);
                    dispatch(employeeApplicationApi.util.invalidateTags(['Application']));
                } else {
                    throw new Error(response.data.error || 'Failed to upload document');
                }
            } catch (error: any) {
                console.error('Upload failed:', error);
                toast.error(`Failed to upload document: ${error.message}`);
            } finally {
                setUploadingDocument((prev) => ({ ...prev, [key]: false }));
                setSelectedFiles((prev) => {
                    const newFiles = { ...prev };
                    delete newFiles[key];
                    return newFiles;
                });
            }
        }
    };

    const handleDbsFileUpload = async () => {
        if (dbsFile) {
            setUploadingDbs(true);
            const formData = new FormData();
            formData.append('file', dbsFile);
            formData.append('section', 'professionalInfo.dbsCheck');
            formData.append('documentType', 'dbsCheck');

            try {
                const response = await axios.post(
                    `${apiHostname}/api/v1/application/upload-document?carerId=${userId}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (response.data.success) {
                    toast.success('DBS Check document uploaded successfully');
                    dispatch(employeeApplicationApi.util.invalidateTags(['Application']));
                } else {
                    throw new Error('Failed to upload DBS Check document');
                }
            } catch (error: any) {
                console.error('DBS Check upload failed:', error);
                toast.error(`Failed to upload DBS Check document: ${error.message}`);
            } finally {
                setUploadingDbs(false);
                setDbsFile(null);
            }
        }
    };

    const handleDeleteDocument = async (section: string, index?: number) => {
        try {
            await deleteDocument({ section, index, carerId: userId });
            toast.success('Document deleted successfully');
        } catch (error) {
            console.error('Delete document failed:', error);
            toast.error('Failed to delete document');
        }
    };

    const handleDeleteItem = async (section: string, index: number) => {
        setItemToDelete({ section, index });
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { section, index } = itemToDelete;

        try {
            await deleteArrayItem({ section: `professionalInfo.${section}`, index, userId });
            toast.success(`${section} item deleted successfully`);
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error(`Failed to delete ${section} item`);
        } finally {
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSaveSection = async (section: string, index?: number) => {
        const key = `${section}${index !== undefined ? `.${index}` : ''}`;
        setSavingSection((prev) => ({ ...prev, [key]: true }));

        try {
            let data;
            if (section === 'dbsCheck') {
                data = getValues('dbsCheck');
            } else {
                data = index !== undefined ? getValues(section)[index] : getValues(section);
            }

            await updateApplicationSection({
                section: `professionalInfo.${section}`,
                data,
                index,
                carerId: userId
            }).unwrap();

            if (section === 'dbsCheck' && dbsFile) {
                await handleDbsFileUpload();
            } else if (selectedFiles[key]) {
                await handleFileUpload(section, index);
            }

            setSavedSections((prev) => ({ ...prev, [key]: true }));

            if (isViewedByYourOrg) {
                setEditableSections(prev => ({
                    ...prev,
                    [section]: false
                }));
            }

            toast.success(`${section} information saved successfully`);
        } catch (error) {
            console.error('Save failed:', error);
            toast.error(`Failed to save ${section} information`);
        } finally {
            setSavingSection((prev) => ({ ...prev, [key]: false }));
            setTimeout(() => {
                setSavedSections((prev) => ({ ...prev, [key]: false }));
            }, 3000);
        }
    };

    const renderTextField = (name: string, label: string) => (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const sectionName = name.split('.')[0];
                const isEditing = editable || editableSections[sectionName];

                return isEditing ? (
                    <div className="space-y-2">
                        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                            {label}
                        </label>
                        <input
                            {...field}
                            type="text"
                            id={name}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-150 ease-in-out"
                            placeholder={label}
                        />
                    </div>
                ) : (
                    <div className="space-y-1">
                        <span className="text-sm text-gray-500">{label}</span>
                        <p className="font-medium text-gray-900">{field.value || 'N/A'}</p>
                    </div>
                );
            }}
        />
    );

    const renderDateField = (name: string, label: string) => (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const sectionName = name.split('.')[0];
                const isEditing = editable || editableSections[sectionName];

                return isEditing ? (
                    <div className="space-y-2">
                        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                            {label}
                        </label>
                        <input
                            type="date"
                            id={name}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-150 ease-in-out"
                        />
                    </div>
                ) : (
                    <div className="space-y-1">
                        <span className="text-sm text-gray-500">{label}</span>
                        <p className="font-medium text-gray-900">
                            {field.value ? new Date(field.value).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                );
            }}
        />
    );

    const renderFileUpload = (section: string, index?: number) => {
        const key = `${section}${index !== undefined ? `.${index}` : ''}`;
        const fileName = index !== undefined
            ? watch(`${section}.${index}.fileName`)
            : watch(`${section}.fileName`);
        const uploadUrl = index !== undefined
            ? watch(`${section}.${index}.uploadUrl`)
            : watch(`${section}.uploadUrl`);
        const selectedFile = selectedFiles[key];
        const isUploading = uploadingDocument[key];
        const isEditing = editable || editableSections[section];

        if (isCarerApplicationLoading) {
            return (
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
            );
        }
        return (
            <div className="mt-4 flex flex-wrap items-center gap-3">
                {isEditing && (
                    <div>
                        <input
                            accept="image/*,.pdf"
                            id={`${section}-upload-${index ?? ''}`}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setSelectedFiles((prev) => ({
                                        ...prev,
                                        [key]: file
                                    }));
                                }
                            }}
                        />
                        <label
                            htmlFor={`${section}-upload-${index ?? ''}`}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 cursor-pointer transition-colors duration-150 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {selectedFile
                                ? selectedFile.name
                                : uploadUrl
                                    ? 'Replace File'
                                    : 'Upload File'}
                        </label>
                    </div>
                )}

                {isUploading && (
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                )}

                {uploadUrl && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-sm text-gray-700">{fileName || `${section} Document`}</span>
                            {isEditing && (
                                <button
                                    onClick={() => handleDeleteDocument(`professionalInfo.${section}`, index)}
                                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors duration-150"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => window.open(uploadUrl, '_blank')}
                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-150"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderArraySection = (
        title: string,
        fieldsArray: any,
        section: string,
        renderFields: (index: number) => React.ReactNode,
        icon: React.ReactNode
    ) => (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    {icon}
                    <h2 className="text-2xl font-semibold relative pb-2">
                        {title}
                        <span className="absolute bottom-0 left-0 w-8 h-1 bg-primary-600 rounded-full"></span>
                    </h2>
                </div>

                {!editable && isViewedByYourOrg && (
                    <button
                        onClick={() => setEditableSections(prev => ({
                            ...prev,
                            [section]: !prev[section]
                        }))}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-150 ${editableSections[section]
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                            }`}
                    >
                        {editableSections[section] ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel Edit
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </>
                        )}
                    </button>
                )}
            </div>

            {fieldsArray.fields.length === 0 ? (
                <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500 text-center">
                    No {title} added yet. Click below to add your first entry.
                </div>
            ) : (
                fieldsArray.fields.map((field: any, index: number) => {
                    const isSaving = savingSection[`${section}.${index}`];
                    const isSaved = savedSections[`${section}.${index}`];

                    return (
                        <div key={field.id} className="transition-all duration-300">
                            <div className={`mb-4 bg-white rounded-xl shadow-sm overflow-hidden border ${isSaved ? 'border-t-4 border-t-green-500' : 'border-gray-200'}`}>
                                <div className="p-6">
                                    {renderFields(index)}
                                    {renderFileUpload(section, index)}

                                    {(editable || isViewedByYourOrg) && (
                                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => handleDeleteItem(section, index)}
                                                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Remove
                                            </button>
                                            <button
                                                onClick={() => handleSaveSection(section, index)}
                                                disabled={isSaving}
                                                className={`inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-150 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Save
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {(editable || isViewedByYourOrg) && (
                <button
                    onClick={() => {
                        const lastIndex = fieldsArray.fields.length - 1;
                        if (lastIndex >= 0 && selectedFiles[`${section}.${lastIndex}`]) {
                            handleSaveSection(section, lastIndex).then(() => {
                                fieldsArray.append({});
                                setEditableSections(prev => ({
                                    ...prev,
                                    [section]: true
                                }));
                            });
                        } else {
                            fieldsArray.append({});
                            setEditableSections(prev => ({
                                ...prev,
                                [section]: true
                            }));
                        }
                    }}
                    className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors duration-150 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add {title}
                </button>
            )}
        </div>
    );

    return (
        <div className="bg-gray-50 rounded-2xl">
            {renderArraySection(
                'Qualifications',
                qualificationsArray,
                'qualifications',
                (index: number) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderTextField(`qualifications.${index}.name`, 'Qualification Name')}
                        {renderTextField(`qualifications.${index}.level`, 'Level')}
                        {renderTextField(`qualifications.${index}.institution`, 'Institution')}
                        {renderDateField(`qualifications.${index}.dateObtained`, 'Date Obtained')}
                    </div>
                ),
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            )}

            {renderArraySection(
                'Trainings',
                trainingsArray,
                'trainings',
                (index: number) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderTextField(`trainings.${index}.name`, 'Training Name')}
                        {renderTextField(`trainings.${index}.provider`, 'Provider')}
                        {renderDateField(`trainings.${index}.dateCompleted`, 'Date Completed')}
                        {renderDateField(`trainings.${index}.dateExpires`, 'Date Expires')}
                    </div>
                ),
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}

            {renderArraySection(
                'Work Experience',
                workExperienceArray,
                'workExperience',
                (index: number) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderTextField(`workExperience.${index}.jobTitle`, 'Job Title')}
                        {renderTextField(`workExperience.${index}.employer`, 'Employer')}
                        {renderDateField(`workExperience.${index}.startDate`, 'Start Date')}
                        {renderDateField(`workExperience.${index}.endDate`, 'End Date')}
                    </div>
                ),
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V6a2 2 0 012-2h2a2 2 0 012 2v2M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )}

            {renderArraySection(
                'References',
                referencesArray,
                'references',
                (index: number) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderTextField(`references.${index}.name`, 'Name')}
                        {renderTextField(`references.${index}.position`, 'Position')}
                        {renderTextField(`references.${index}.company`, 'Company')}
                        {renderTextField(`references.${index}.email`, 'Email')}
                        {renderTextField(`references.${index}.phone`, 'Phone')}
                    </div>
                ),
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )}

            {renderArraySection(
                'Professional Registrations',
                professionalRegistrationsArray,
                'professionalRegistrations',
                (index: number) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name={`professionalRegistrations.${index}.type`}
                            control={control}
                            render={({ field }) => {
                                const isEditing = editable || editableSections.professionalRegistrations;

                                return isEditing ? (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Type</label>
                                        <select
                                            {...field}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-150 ease-in-out"
                                        >
                                            <option value="">Select type</option>
                                            <option value="NMC">NMC</option>
                                            <option value="HCPC">HCPC</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <span className="text-sm text-gray-500">Type</span>
                                        <p className="font-medium text-gray-900">{field.value || 'N/A'}</p>
                                    </div>
                                );
                            }}
                        />
                        {renderTextField(
                            `professionalRegistrations.${index}.registrationNumber`,
                            'Registration Number'
                        )}
                        {renderDateField(
                            `professionalRegistrations.${index}.expiryDate`,
                            'Expiry Date'
                        )}
                    </div>
                ),
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            )}

            {/* DBS Check Section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <h2 className="text-2xl font-semibold relative pb-2">
                            DBS Check
                            <span className="absolute bottom-0 left-0 w-8 h-1 bg-primary-600 rounded-full"></span>
                        </h2>
                    </div>

                    {!editable && isViewedByYourOrg && (
                        <button
                            onClick={() => setEditableSections(prev => ({
                                ...prev,
                                dbsCheck: !prev.dbsCheck
                            }))}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-150 ${editableSections.dbsCheck
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                }`}
                        >
                            {editableSections.dbsCheck ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancel Edit
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderTextField('dbsCheck.certificateNumber', 'DBS Certificate Number')}
                            <Controller
                                name="dbsCheck.type"
                                control={control}
                                render={({ field }) => {
                                    const isEditing = editable || editableSections.dbsCheck;

                                    return isEditing ? (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">DBS Type</label>
                                            <select
                                                {...field}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-150 ease-in-out"
                                            >
                                                <option value="">Select DBS Type</option>
                                                <option value="Standard">Standard</option>
                                                <option value="Enhanced">Enhanced</option>
                                                <option value="Basic">Basic</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500">DBS Type</span>
                                            <p className="font-medium text-gray-900">{field.value || 'N/A'}</p>
                                        </div>
                                    );
                                }}
                            />

                            {renderDateField('dbsCheck.issueDate', 'Issue Date')}
                            {renderDateField('dbsCheck.expiryDate', 'Expiry Date')}
                            <Controller
                                name="dbsCheck.status"
                                control={control}
                                render={({ field }) => {
                                    const isEditing = editable || editableSections.dbsCheck;

                                    return isEditing ? (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                {...field}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-150 ease-in-out"
                                            >
                                                <option value="">Select status</option>
                                                <option value="Clear">Clear</option>
                                                <option value="Not Clear">Not Clear</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Not Applicable">Not Applicable</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <span className="text-sm text-gray-500">Status</span>
                                            <p className="font-medium text-gray-900">{field.value || 'N/A'}</p>
                                        </div>
                                    );
                                }}
                            />
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">DBS Certificate</h3>
                            {renderFileUpload('dbsCheck')}
                        </div>

                        {editable && (
                            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleSaveSection('dbsCheck')}
                                    disabled={savingSection['dbsCheck']}
                                    className={`inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-150 ${savingSection['dbsCheck'] ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {savingSection['dbsCheck'] ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save DBS Check
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Are you sure you want to delete this item? This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirmOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionalInformation;