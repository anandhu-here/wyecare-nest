import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { GraduationCap, Languages, Medal, Plus, Save, Trash2, X } from 'lucide-react';
import { useGetEmployeeApplicationQuery, useRemoveFromArrayMutation, useUpdateSectionMutation } from '../employeeApplicationApi';
import { toast } from 'react-toastify';

interface SkillsProps {
    initialData?: Record<string, any>;
    onSubmit: (data: any, index: number | undefined, section: string) => void;
    selectedSection: string;
    editable?: boolean;
    isViewedByYourOrg?: boolean;
    userId: string;
}

interface Language {
    language: string;
    proficiency: string;
    _id?: string;
    updatedAt?: string;
}

interface CareSkill {
    skill: string;
    experienceLevel: string;
    _id?: string;
    updatedAt?: string;
}

interface Specialization {
    name: string;
    description: string;
    _id?: string;
    updatedAt?: string;
}

interface SkillsData {
    languages: Language[];
    careSkills: CareSkill[];
    specializations: Specialization[];
}

const Skills: React.FC<SkillsProps> = ({
    initialData,
    onSubmit,
    selectedSection,
    userId,
    isViewedByYourOrg = false,
    editable = true
}) => {
    const [formInitialized, setFormInitialized] = useState<boolean>(false);
    const dispatch = useDispatch();
    const { data: carerApplication } = useGetEmployeeApplicationQuery({
        carerId: userId,
    }, {
        skip: isViewedByYourOrg,
        refetchOnMountOrArgChange: true
    });
    const [updateApplicationSection] = useUpdateSectionMutation();
    const [deleteArrayItem] = useRemoveFromArrayMutation();

    const [editableSections, setEditableSections] = useState({
        languages: false,
        careSkills: false,
        specializations: false
    });

    const [savingSection, setSavingSection] = useState<{
        [key: string]: boolean;
    }>({});

    // Convert object with numeric keys to array
    const objectToArray = (obj: Record<string, any> | any[] | undefined): any[] => {
        if (!obj) return [];
        if (Array.isArray(obj)) return obj;

        return Object.keys(obj)
            .filter(k => !isNaN(Number(k)))
            .sort((a, b) => Number(a) - Number(b))
            .map(k => obj[k]);
    };

    const defaultValues = useMemo<SkillsData>(() => {
        const data = editable
            ? carerApplication?.data[selectedSection] || {}
            : initialData || {};

        return {
            languages: objectToArray(data.languages || []),
            careSkills: objectToArray(data.careSkills || []),
            specializations: objectToArray(data.specializations || [])
        };
    }, [carerApplication?.data, selectedSection, editable, initialData]);

    const { control, handleSubmit, reset, getValues } = useForm<SkillsData>({
        defaultValues
    });

    const languageArray = useFieldArray({
        control,
        name: 'languages'
    });

    const skillArray = useFieldArray({
        control,
        name: 'careSkills'
    });

    const specializationArray = useFieldArray({
        control,
        name: 'specializations'
    });

    useEffect(() => {
        if (editable && carerApplication?.data[selectedSection]) {
            // Process the data to convert object with numeric keys to arrays
            const processedData: SkillsData = {
                languages: objectToArray(carerApplication.data[selectedSection].languages || []),
                careSkills: objectToArray(carerApplication.data[selectedSection].careSkills || []),
                specializations: objectToArray(carerApplication.data[selectedSection].specializations || [])
            };

            reset(processedData);
            setFormInitialized(true);
        } else if (!editable && initialData) {
            // Process the initial data for non-editable view
            const processedData: SkillsData = {
                languages: objectToArray(initialData.languages || []),
                careSkills: objectToArray(initialData.careSkills || []),
                specializations: objectToArray(initialData.specializations || [])
            };

            reset(processedData);
            setFormInitialized(true);
        }
    }, [carerApplication?.data, selectedSection, reset, editable, initialData]);

    // Ensure arrays are properly initialized
    useEffect(() => {
        if (formInitialized) {
            const data = editable ? carerApplication?.data[selectedSection] : initialData;

            if (data) {
                // Handle languages (might be object with numeric keys or array)
                const languages = objectToArray(data.languages);
                if (languages.length > 0) {
                    languageArray.replace(languages);
                }

                // Handle careSkills (might be object with numeric keys or array)
                const careSkills = objectToArray(data.careSkills);
                if (careSkills.length > 0) {
                    skillArray.replace(careSkills);
                }

                // Handle specializations (might be object with numeric keys or array)
                const specializations = objectToArray(data.specializations);
                if (specializations.length > 0) {
                    specializationArray.replace(specializations);
                }
            }
        }
    }, [formInitialized, carerApplication, initialData, selectedSection, editable,
        languageArray, skillArray, specializationArray]);

    const handleSaveSection = async (section: string, index?: number) => {
        const key = `${section}${index !== undefined ? `.${index}` : ''}`;
        setSavingSection(prev => ({ ...prev, [key]: true }));

        try {
            const data = index !== undefined
                ? getValues(section as keyof SkillsData)[index]
                : getValues(section as keyof SkillsData);

            await updateApplicationSection({
                section: `skills.${section}`,
                data,
                index,
                carerId: userId
            }).unwrap();

            if (isViewedByYourOrg) {
                setEditableSections(prev => ({
                    ...prev,
                    [section]: false
                }));
            }

            toast.success(`Successfully saved ${section}`);
        } catch (error: any) {
            toast.error(`Failed to save ${section}: ${error.message}`);
        } finally {
            setSavingSection(prev => ({ ...prev, [key]: false }));
        }
    };

    const renderSection = (
        title: string,
        fieldsArray: {
            fields: Record<"id", string>[];
            append: (value: any) => void;
            remove: (index: number) => void;
        },
        section: string,
        icon: React.ReactNode,
        renderContent: (index: number) => React.ReactNode,
    ) => (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    {icon}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                        <div className="h-1 w-10 bg-primary-600 rounded-full mt-2" />
                    </div>
                </div>

                {!editable && isViewedByYourOrg && (
                    <button
                        onClick={() => setEditableSections(prev => ({
                            ...prev,
                            [section]: !prev[section]
                        }))}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm transition-colors
              ${editableSections[section]
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                            }`}
                    >
                        {editableSections[section] ? (
                            <>
                                <X className="w-4 h-4 mr-2" />
                                Cancel Edit
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Edit
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {fieldsArray.fields.length === 0 ? (
                    <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500 text-center">
                        No {title} added yet. Click below to add your first entry.
                    </div>
                ) : (
                    fieldsArray.fields.map((field, index) => (
                        <div key={field.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            {renderContent(index)}

                            {(editable || editableSections[section]) && (
                                <div className="flex justify-end items-center mt-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => fieldsArray.remove(index)}
                                        className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg mr-3"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Remove
                                    </button>
                                    <button
                                        onClick={() => handleSaveSection(section, index)}
                                        disabled={savingSection[`${section}.${index}`]}
                                        className="inline-flex items-center px-4 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 mr-1" />
                                        {savingSection[`${section}.${index}`] ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {(editable || editableSections[section]) && (
                    <button
                        onClick={() => fieldsArray.append({})}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add {title}
                    </button>
                )}
            </div>
        </div>
    );

    const renderLanguageFields = (index: number) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
                name={`languages.${index}.language`}
                control={control}
                render={({ field }) => (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Language
                        </label>
                        <input
                            {...field}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter language"
                        />
                    </div>
                )}
            />
            <Controller
                name={`languages.${index}.proficiency`}
                control={control}
                render={({ field }) => (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proficiency
                        </label>
                        <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Select proficiency</option>
                            <option value="Basic">Basic</option>
                            <option value="Conversational">Conversational</option>
                            <option value="Fluent">Fluent</option>
                            <option value="Native">Native</option>
                        </select>
                    </div>
                )}
            />
        </div>
    );

    const renderSkillFields = (index: number) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
                name={`careSkills.${index}.skill`}
                control={control}
                render={({ field }) => (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Skill
                        </label>
                        <input
                            {...field}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter skill"
                        />
                    </div>
                )}
            />
            <Controller
                name={`careSkills.${index}.experienceLevel`}
                control={control}
                render={({ field }) => (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Experience Level
                        </label>
                        <select
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Select level</option>
                            <option value="Novice">Novice</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Expert">Expert</option>
                        </select>
                    </div>
                )}
            />
        </div>
    );

    return (
        <div className="bg-gray-50 rounded-xl">
            <form onSubmit={handleSubmit((data) => onSubmit(data, undefined, 'skills'))}>
                {renderSection(
                    'Languages',
                    languageArray,
                    'languages',
                    <Languages className="w-6 h-6 text-primary-600" />,
                    renderLanguageFields,
                )}

                {renderSection(
                    'Care Skills',
                    skillArray,
                    'careSkills',
                    <Medal className="w-6 h-6 text-primary-600" />,
                    renderSkillFields,
                )}
            </form>
        </div>
    );
};

export default Skills;