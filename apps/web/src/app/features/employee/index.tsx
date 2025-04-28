import React, { useState, useEffect } from 'react';
import { App, BackButtonListenerEvent } from '@capacitor/app';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@wyecare/frontend/redux/store';
import axios from 'axios';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Mail, Phone } from 'lucide-react';
import { useMediaQuery } from '@/app/layouts/hook/media-query';
import { selectUser } from '../auth/AuthSlice';
import { apiHostname } from '@/config/api';
import { toast } from 'react-toastify';
import { baseApi } from '@/redux/baseApi';
import { LoadingOverlay } from '@/components/loading-overlay';
import { useGetApplicationStatusQuery, useGetEmployeeApplicationQuery } from './employeeApplicationApi';
import ProfileTab from './profile-components';


const EmployeeProfilePage = ({ callback }: {
    callback?: (hide: boolean) => void;
}) => {
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const { isMobile, isTablet } = useMediaQuery();
    const dispatch = useDispatch<AppDispatch>();

    const userState = useSelector(selectUser);

    const { data: applicationStatus, isLoading: isApplicationStatusLoading } = useGetApplicationStatusQuery({
        userId: userState?._id || '',
    }, {
        skip: !userState?._id,
        refetchOnMountOrArgChange: true,

    });
    const { data: carerApplication, isLoading: isCarerApplicationLoading } = useGetEmployeeApplicationQuery(
        { carerId: userState?._id || '' },
        {
            skip: !userState?._id,
            refetchOnMountOrArgChange: true,
        }
    );
    useEffect(() => {
        if (carerApplication?.data?.personalInfo?.avatarUrl) {
            setProfilePicture(carerApplication.data.personalInfo.avatarUrl);
        }
    }, [carerApplication]);

    const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file: any = event.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        const fileExtension = file.name.substr(file.name.lastIndexOf('.'));
        const newFileName = `profile_picture_${userState?._id}_${Date.now()}${fileExtension}`;
        const renamedFile = new File([file], newFileName, { type: file.type });
        formData.append('file', renamedFile);
        try {
            const response = await axios.post(
                `${apiHostname}/api/v1/pictures/${userState?._id}/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            if (response.data.success) {
                toast.success('Profile picture updated successfully!');
                setProfilePicture(response.data?.data?.avatarUrl);
                // dispatch(_setAvatar(response.data?.data?.avatarUrl));
                dispatch(baseApi.util.invalidateTags(['Application']));
            } else {
                throw new Error(response.data.error || 'Failed to update profile picture');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile picture');
        } finally {
            setIsUploading(false);
        }
    };

    const personalInfo = carerApplication?.data?.personalInfo;
    const fullName = personalInfo ? `${personalInfo.title || ''} ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() : 'Your Name';
    const jobTitle = personalInfo?.jobTitle || 'Healthcare Professional';
    const email = personalInfo?.email || 'email@example.com';
    const phone = personalInfo?.phone || 'Not provided';

    if (isUploading) {
        return <LoadingOverlay isVisible={isUploading} />;
    }

    return (
        <div className="">
            <div className="bg-white border-b">
                <div className="mx-auto px-4 py-5">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                accept="image/*"
                                className="hidden"
                                id="profile-picture-upload"
                                type="file"
                                onChange={handleProfilePictureUpload}
                            />
                            <label htmlFor="profile-picture-upload">
                                <div className="relative w-19 h-19 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer hover:opacity-90 transition-opacity">
                                    {/* Avatar is always visible */}
                                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 object-cover">
                                        {profilePicture ? (
                                            <AvatarImage src={profilePicture} alt="Profile" className='object-cover' />
                                        ) : (
                                            <AvatarFallback className="bg-gray-100 text-gray-400" />
                                        )}
                                    </Avatar>


                                    {/* Camera icon overlay (only shown when not uploading) */}
                                    {!isUploading && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                        <div>
                            <h1 className="text-sm sm:text-sm font-semibold">{fullName}</h1>
                            <p className="text-gray-600 text-xs">{jobTitle}</p>
                            <div className="mt-1 flex flex-wrap gap-0 text-xs text-gray-500">
                                <div className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    <span className='text-xs'>{email}</span>
                                </div>
                                <div className="flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    <span className='text-xs'>{phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-4 py-4">
                <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <ProfileTab
                            carerApplication={carerApplication}
                            isCarerApplicationLoading={isCarerApplicationLoading}
                            isMobile={isMobile}
                            isTablet={isTablet}
                            callback={callback}
                        />
                    </TabsContent>

                    <TabsContent value="settings">
                        {/* <SettingsTab
                            isMobile={isMobile}
                            isTablet={isTablet}
                            callback={callback}
                        /> */}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default EmployeeProfilePage;