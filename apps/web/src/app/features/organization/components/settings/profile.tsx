"use client"

import React, { useState, useRef, useEffect } from 'react'

// Shadcn Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import axios from 'axios';

// Icons
import {
    User,
    Building2,
    Mail,
    Phone,
    MapPin,
    Camera,
    Loader2,
    Globe,
    Save,
    Pencil,
    X,
    Network
} from 'lucide-react'
import { countries, countryPhoneCodes, selectCurrentOrganization, selectUser } from '@/app/features/auth/AuthSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useUpdateOrganizationMutation } from '../../organizationApi'
import { useUpdateUserMutation } from '@/app/features/auth/userApi'
import { apiHostname } from '@/config/api'
import { toast } from 'react-toastify'

const ProfileTab = () => {
    // State for active tab
    const [activeTab, setActiveTab] = useState("admin")

    // Upload states
    const [isUploading, setIsUploading] = useState(false)

    // Edit mode states
    const [isEditingAdmin, setIsEditingAdmin] = useState(false)
    const [isEditingOrg, setIsEditingOrg] = useState(false)

    // Form data
    const [adminFormData, setAdminFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        countryCode: "",
        timezone: "",
        gender: "",
        address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: ""
        }
    })

    const [orgFormData, setOrgFormData] = useState({
        name: "",
        type: "",
        email: "",
        phone: "",
        countryCode: "",
        websiteUrl: "",
        address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: ""
        }
    })

    // Loading states
    const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false)
    const [isSubmittingOrg, setIsSubmittingOrg] = useState(false)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)


    // Refs
    const fileInputRef = useRef(null);
    const logoInputRef = useRef<HTMLInputElement>(null)

    // Redux
    const userState = useSelector(selectUser)
    const currentOrganization = useSelector(selectCurrentOrganization)
    const dispatch = useDispatch()

    const [updateOrg, { isLoading: updateOrgLoading }] = useUpdateOrganizationMutation()

    const [
        updateUser,
        { isLoading: updateUserLoading }

    ] = useUpdateUserMutation();

    // Initialize form data from state
    useEffect(() => {
        if (userState) {
            setAdminFormData({
                firstName: userState?.firstName || "",
                lastName: userState?.lastName || "",
                email: userState?.email || "",
                phone: userState?.phone || "",
                countryCode: userState?.countryCode || "",
                timezone: userState?.timezone || "",
                gender: userState?.gender || "",
                address: {
                    street: userState?.address?.street || "",
                    city: userState?.address?.city || "",
                    state: userState?.address?.state || "",
                    zipCode: userState?.address?.zipCode || "",
                    country: userState?.address?.country || ""
                }
            })
        }

        if (currentOrganization) {
            setOrgFormData({
                name: currentOrganization?.name || "",
                type: currentOrganization?.type || "",
                email: currentOrganization?.email || "",
                phone: currentOrganization?.phone || "",
                countryCode: currentOrganization?.countryCode || "",
                websiteUrl: currentOrganization?.websiteUrl || "",
                address: {
                    street: currentOrganization?.address?.street || "",
                    city: currentOrganization?.address?.city || "",
                    state: currentOrganization?.address?.state || "",
                    zipCode: currentOrganization?.address?.zipCode || "",
                    country: currentOrganization?.address?.country || ""
                }
            })
        }
    }, [userState])

    const handleOrganizationLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploadingLogo(true)
        const formData = new FormData()
        const fileExtension = file.name.substr(file.name.lastIndexOf('.'))
        const newFileName = `organization_logo_${currentOrganization?._id}_${Date.now()}${fileExtension}`
        const renamedFile = new File([file], newFileName, { type: file.type })
        formData.append('file', renamedFile)

        try {
            const response = await axios.post(
                `${apiHostname}/api/v1/pictures/organization/${currentOrganization?._id}/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            if (response.data.success) {
                // dispatch(showSnack({
                //     message: 'Organization logo updated successfully',
                //     color: 'success'
                // }))
                // dispatch(_setOrganizationLogo(response.data?.data?.logoUrl))
                toast.success('Organization logo updated successfully', {})
            }
        } catch (error) {
            // dispatch(showSnack({
            //     message: 'Failed to update organization logo',
            //     color: 'error'
            // }))
            toast.error(
                'Failed to update organization logo'
            )
        } finally {
            setIsUploadingLogo(false)
        }
    }

    // Handle profile picture upload
    const handleProfilePictureUpload = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        const fileExtension = file.name.substr(file.name.lastIndexOf('.'))
        const newFileName = `profile_picture_${userState?._id}_${Date.now()}${fileExtension}`
        const renamedFile = new File([file], newFileName, { type: file.type })
        formData.append('file', renamedFile)

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
            )

            if (response.data.success) {
                // dispatch(showSnack({
                //     message: 'Profile picture updated successfully',
                //     color: 'success'
                // }))
                // dispatch(_setAvatar(response.data?.data?.avatarUrl))
                toast.success('Picture updated successfully', {})
            }
        } catch (error) {
            toast.error(
                'Failed to update picture'
            )
        } finally {
            setIsUploading(false)
        }
    }

    // Form change handlers
    const handleAdminFormChange = (e) => {
        const { name, value } = e.target

        if (name.includes('.')) {
            const [parent, child] = name.split('.')
            setAdminFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }))
        } else {
            setAdminFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    const handleOrgFormChange = (e) => {
        const { name, value } = e.target

        if (name.includes('.')) {
            const [parent, child] = name.split('.')
            setOrgFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }))
        } else {
            setOrgFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    // Select change handlers
    const handleAdminSelectChange = (value, field) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.')
            setAdminFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }))
        } else {
            setAdminFormData(prev => ({
                ...prev,
                [field]: value
            }))
        }
    }

    const handleOrgSelectChange = (value, field) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.')
            setOrgFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }))
        } else {
            setOrgFormData(prev => ({
                ...prev,
                [field]: value
            }))
        }
    }

    // Form submissions
    const handleSubmitAdminProfile = async (e) => {
        e.preventDefault()
        setIsSubmittingAdmin(true)

        try {
            const result = await updateUser({
                firstName: adminFormData.firstName,
                lastName: adminFormData.lastName,
                email: adminFormData.email,
                phone: adminFormData.phone,
                countryCode: adminFormData.countryCode,
                timezone: adminFormData.timezone,
                gender: adminFormData.gender,
                address: {
                    street: adminFormData.address.street,
                    city: adminFormData.address.city,
                    state: adminFormData.address.state,
                    zipCode: adminFormData.address.zipCode,
                    country: adminFormData.address.country
                }
            }).unwrap()

            // dispatch(showSnack({
            //     message: 'Administrator profile updated successfully',
            //     color: 'success'
            // }))
            setIsEditingAdmin(false)
        } catch (error) {
            // dispatch(showSnack({
            //     message: 'Failed to update administrator profile',
            //     color: 'error'
            // }))
        } finally {
            setIsSubmittingAdmin(false)
        }
    }

    const handleSubmitOrgProfile = async (e) => {
        e.preventDefault()
        setIsSubmittingOrg(true)

        try {
            const result = await updateOrg({
                name: orgFormData.name,
                email: orgFormData.email,
                phone: orgFormData.phone,
                countryCode: orgFormData.countryCode,
                websiteUrl: orgFormData.websiteUrl,
                address: {
                    street: orgFormData.address.street,
                    city: orgFormData.address.city,
                    state: orgFormData.address.state,
                    zipCode: orgFormData.address.zipCode,
                    country: orgFormData.address.country
                },
                _id: currentOrganization?._id
            }).unwrap()

            // dispatch(showSnack({
            //     message: 'Organization profile updated successfully',
            //     color: 'success'
            // }))
            setIsEditingOrg(false)
        } catch (error) {
            // dispatch(showSnack({
            //     message: 'Failed to update organization profile',
            //     color: 'error'
            // }))
        } finally {
            setIsSubmittingOrg(false)
        }
    }

    // Toggle edit mode
    const toggleAdminEditMode = () => {
        if (isEditingAdmin) {
            // Reset form data if canceling
            setAdminFormData({
                firstName: userState?.firstName || "",
                lastName: userState?.lastName || "",
                email: userState?.email || "",
                phone: userState?.phone || "",
                countryCode: userState?.countryCode || "",
                timezone: userState?.timezone || "",
                gender: userState?.gender || "",
                address: {
                    street: userState?.address?.street || "",
                    city: userState?.address?.city || "",
                    state: userState?.address?.state || "",
                    zipCode: userState?.address?.zipCode || "",
                    country: userState?.address?.country || ""
                }
            })
        }
        setIsEditingAdmin(!isEditingAdmin)
    }

    const toggleOrgEditMode = () => {
        if (isEditingOrg) {
            // Reset form data if canceling
            setOrgFormData({
                name: currentOrganization?.name || "",
                type: currentOrganization?.type || "",
                email: currentOrganization?.email || "",
                phone: currentOrganization?.phone || "",
                countryCode: currentOrganization?.countryCode || "",
                websiteUrl: currentOrganization?.websiteUrl || "",
                address: {
                    street: currentOrganization?.address?.street || "",
                    city: currentOrganization?.address?.city || "",
                    state: currentOrganization?.address?.state || "",
                    zipCode: currentOrganization?.address?.zipCode || "",
                    country: currentOrganization?.address?.country || ""
                }
            })
        }
        setIsEditingOrg(!isEditingOrg)
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <Tabs
                defaultValue="admin"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full flex flex-col h-full overflow-hidden"
            >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Administrator Profile
                    </TabsTrigger>
                    <TabsTrigger value="organization" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Organization Profile
                    </TabsTrigger>
                </TabsList>
                <div className="flex-1 overflow-hidden">
                    {/* Administrator Profile Tab */}
                    <TabsContent
                        value="admin"
                        className="h-full flex-1 overflow-hidden mt-0 border-0 p-0"
                    >
                        <ScrollArea className="h-full">
                            <div className="space-y-6 p-1">
                                {/* Admin Header with Profile Picture */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleProfilePictureUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            <Avatar
                                                className="h-20 w-20 border-2 border-muted transition-all group-hover:border-primary/50 group-hover:shadow-md"
                                            >
                                                <AvatarImage
                                                    src={userState?.avatarUrl}
                                                    alt={`${userState?.firstName} ${userState?.lastName}`}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                                    {userState?.firstName?.charAt(0)}{userState?.lastName?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>

                                            {isUploading ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        <Camera className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 shadow-md transform translate-x-1 translate-y-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        <Camera className="h-3.5 w-3.5" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <h2 className="text-xl font-bold">
                                                    {userState?.firstName} {userState?.lastName}
                                                </h2>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-primary/5 text-primary">Administrator</Badge>
                                                    <p className="text-sm text-muted-foreground">
                                                        Personal Account
                                                    </p>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                                    Manage your personal details, contact information, and preferences.
                                                </p>
                                            </div>

                                            <div className="flex items-center space-x-2 self-start">
                                                {isEditingAdmin ? (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={toggleAdminEditMode}
                                                            disabled={isSubmittingAdmin}
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={handleSubmitAdminProfile}
                                                            disabled={isSubmittingAdmin}
                                                        >
                                                            {isSubmittingAdmin ? (
                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                            ) : (
                                                                <Save className="h-4 w-4 mr-1" />
                                                            )}
                                                            Save Changes
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={toggleAdminEditMode}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-1" />
                                                        Edit Profile
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmitAdminProfile}>
                                    {/* Personal Information */}
                                    <Card className="border-muted/40 mb-6">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                                <User className="h-4 w-4 text-primary" />
                                                Personal Information
                                            </CardTitle>
                                            <CardDescription>
                                                Your basic personal information used throughout the platform
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="firstName">First Name</Label>
                                                    <Input
                                                        id="firstName"
                                                        name="firstName"
                                                        value={adminFormData.firstName}
                                                        onChange={handleAdminFormChange}
                                                        placeholder="Enter your first name"
                                                        disabled={!isEditingAdmin}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="lastName">Last Name</Label>
                                                    <Input
                                                        id="lastName"
                                                        name="lastName"
                                                        value={adminFormData.lastName}
                                                        onChange={handleAdminFormChange}
                                                        placeholder="Enter your last name"
                                                        disabled={!isEditingAdmin}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="gender">Gender</Label>
                                                    <Select
                                                        disabled={!isEditingAdmin}
                                                        value={adminFormData.gender}
                                                        onValueChange={(value) => handleAdminSelectChange(value, "gender")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="male">Male</SelectItem>
                                                            <SelectItem value="female">Female</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="timezone">Timezone</Label>
                                                    <Select
                                                        disabled={!isEditingAdmin}
                                                        value={adminFormData.timezone}
                                                        onValueChange={(value) => handleAdminSelectChange(value, "timezone")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select timezone" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Europe/London">London (GMT+00:00)</SelectItem>
                                                            <SelectItem value="Europe/Paris">Paris (GMT+01:00)</SelectItem>
                                                            <SelectItem value="America/New_York">New York (GMT-05:00)</SelectItem>
                                                            <SelectItem value="Asia/Tokyo">Tokyo (GMT+09:00)</SelectItem>
                                                            {/* Add more timezones as needed */}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Contact Information */}
                                    <Card className="border-muted/40 mb-6">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-primary" />
                                                Contact Information
                                            </CardTitle>
                                            <CardDescription>
                                                Your personal contact details for communications and login
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    Email Address
                                                    <Badge variant="outline" className="ml-2 text-xs font-normal">Login Email</Badge>
                                                </Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={adminFormData.email}
                                                    onChange={handleAdminFormChange}
                                                    placeholder="your.email@example.com"
                                                    disabled={!isEditingAdmin}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2 md:col-span-1">
                                                    <Label htmlFor="countryCode">Country Code</Label>
                                                    <Select
                                                        disabled={!isEditingAdmin}
                                                        value={adminFormData.countryCode}
                                                        onValueChange={(value) => handleAdminSelectChange(value, "countryCode")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Code" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {countryPhoneCodes?.map((option) => (
                                                                <SelectItem key={option.code} value={option.code}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label htmlFor="phone">Phone Number</Label>
                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        value={adminFormData.phone}
                                                        onChange={handleAdminFormChange}
                                                        placeholder="Enter your phone number"
                                                        disabled={!isEditingAdmin}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Address Information */}
                                    <Card className="border-muted/40 mb-6">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                Address Information
                                            </CardTitle>
                                            <CardDescription>
                                                Your personal address details
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="address.street">Street Address</Label>
                                                <Input
                                                    id="address.street"
                                                    name="address.street"
                                                    value={adminFormData.address.street}
                                                    onChange={handleAdminFormChange}
                                                    placeholder="Enter your street address"
                                                    disabled={!isEditingAdmin}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="address.city">City</Label>
                                                    <Input
                                                        id="address.city"
                                                        name="address.city"
                                                        value={adminFormData.address.city}
                                                        onChange={handleAdminFormChange}
                                                        placeholder="Enter your city"
                                                        disabled={!isEditingAdmin}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="address.state">State/Province</Label>
                                                    <Input
                                                        id="address.state"
                                                        name="address.state"
                                                        value={adminFormData.address.state}
                                                        onChange={handleAdminFormChange}
                                                        placeholder="Enter your state or province"
                                                        disabled={!isEditingAdmin}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="address.zipCode">Postal Code</Label>
                                                    <Input
                                                        id="address.zipCode"
                                                        name="address.zipCode"
                                                        value={adminFormData.address.zipCode}
                                                        onChange={handleAdminFormChange}
                                                        placeholder="Enter your postal code"
                                                        disabled={!isEditingAdmin}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="address.country">Country</Label>
                                                    <Select
                                                        disabled={!isEditingAdmin}
                                                        value={adminFormData.address.country}
                                                        onValueChange={(value) => handleAdminSelectChange(value, "address.country")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select country" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {countries.map((country) => (
                                                                <SelectItem key={country.code} value={country.code}>
                                                                    {country.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </form>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* Organization Profile Tab */}
                    {/* Organization Profile Tab */}
                    <TabsContent
                        value="organization"
                        className="h-full flex-1 overflow-hidden mt-0 border-0 p-0"
                    >
                        <ScrollArea className="h-full">
                            <div className="space-y-6 p-1">
                                {/* Org Header with Logo */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            ref={logoInputRef}
                                            onChange={handleOrganizationLogoUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div
                                            className="cursor-pointer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                logoInputRef.current?.click();
                                            }}
                                        >
                                            <Avatar
                                                className="h-20 w-20 border-2 border-muted transition-all group-hover:border-primary/50 group-hover:shadow-md"
                                            >
                                                <AvatarImage
                                                    src={currentOrganization?.logoUrl}
                                                    alt={currentOrganization?.name}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                                    {currentOrganization?.name?.charAt(0) || "O"}
                                                </AvatarFallback>
                                            </Avatar>

                                            {isUploadingLogo ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        <Camera className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 shadow-md transform translate-x-1 translate-y-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        <Camera className="h-3.5 w-3.5" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <h2 className="text-xl font-bold">
                                                    {currentOrganization?.name}
                                                </h2>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={currentOrganization?.type === 'agency' ? 'secondary' : 'default'}>
                                                        {currentOrganization?.type === 'agency' ? 'Agency' : 'Care Home'}
                                                    </Badge>
                                                    <p className="text-sm text-muted-foreground">
                                                        Organization Account
                                                    </p>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                                    Update your organization details, contact information, and business address.
                                                </p>
                                            </div>

                                            <div className="flex items-center space-x-2 self-start">
                                                {isEditingOrg ? (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={toggleOrgEditMode}
                                                            disabled={isSubmittingOrg}
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={handleSubmitOrgProfile}
                                                            disabled={isSubmittingOrg}
                                                        >
                                                            {isSubmittingOrg ? (
                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                            ) : (
                                                                <Save className="h-4 w-4 mr-1" />
                                                            )}
                                                            Save Changes
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={toggleOrgEditMode}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-1" />
                                                        Edit Organization
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmitOrgProfile}>
                                    {/* Organization Details */}
                                    <Card className="border-muted/40 mb-6">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-primary" />
                                                Organization Details
                                            </CardTitle>
                                            <CardDescription>
                                                Basic information about your organization
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Organization Name</Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        value={orgFormData.name}
                                                        onChange={handleOrgFormChange}
                                                        placeholder="Enter organization name"
                                                        disabled={!isEditingOrg}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="type">Organization Type</Label>
                                                    <Select
                                                        disabled={true} // Organization type cannot be changed
                                                        value={orgFormData.type}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="agency">Agency</SelectItem>
                                                            <SelectItem value="home">Care Home</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-xs text-muted-foreground">Organization type cannot be changed</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="websiteUrl">Website URL</Label>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="websiteUrl"
                                                        name="websiteUrl"
                                                        value={orgFormData.websiteUrl}
                                                        onChange={handleOrgFormChange}
                                                        className="pl-10"
                                                        placeholder="https://your-organization.com"
                                                        disabled={!isEditingOrg}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Contact Information */}
                                    <Card className="border-muted/40 mb-6">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                                <Network className="h-4 w-4 text-primary" />
                                                Contact Information
                                            </CardTitle>
                                            <CardDescription>
                                                How clients and partners can reach your organization
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    Email Address
                                                    <Badge variant="outline" className="ml-2 text-xs font-normal">Business Email</Badge>
                                                </Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        value={orgFormData.email}
                                                        onChange={handleOrgFormChange}
                                                        className="pl-10"
                                                        placeholder="contact@your-organization.com"
                                                        disabled={!isEditingOrg}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2 md:col-span-1">
                                                    <Label htmlFor="countryCode">Country Code</Label>
                                                    <Select
                                                        disabled={!isEditingOrg}
                                                        value={orgFormData.countryCode}
                                                        onValueChange={(value) => handleOrgSelectChange(value, "countryCode")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Code" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {countryPhoneCodes?.map((option) => (
                                                                <SelectItem key={option.code} value={option.code}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label htmlFor="phone">Phone Number</Label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="phone"
                                                            name="phone"
                                                            value={orgFormData.phone}
                                                            onChange={handleOrgFormChange}
                                                            className="pl-10"
                                                            placeholder="Enter business phone number"
                                                            disabled={!isEditingOrg}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Business Address */}
                                    <Card className="border-muted/40 mb-6">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                Business Address
                                            </CardTitle>
                                            <CardDescription>
                                                Your organization's physical location
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="address.street">Street Address</Label>
                                                <Input
                                                    id="address.street"
                                                    name="address.street"
                                                    value={orgFormData.address.street}
                                                    onChange={handleOrgFormChange}
                                                    placeholder="Enter business street address"
                                                    disabled={!isEditingOrg}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="address.city">City</Label>
                                                    <Input
                                                        id="address.city"
                                                        name="address.city"
                                                        value={orgFormData.address.city}
                                                        onChange={handleOrgFormChange}
                                                        placeholder="Enter city"
                                                        disabled={!isEditingOrg}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="address.state">State/Province</Label>
                                                    <Input
                                                        id="address.state"
                                                        name="address.state"
                                                        value={orgFormData.address.state}
                                                        onChange={handleOrgFormChange}
                                                        placeholder="Enter state or province"
                                                        disabled={!isEditingOrg}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="address.zipCode">Postal Code</Label>
                                                    <Input
                                                        id="address.zipCode"
                                                        name="address.zipCode"
                                                        value={orgFormData.address.zipCode}
                                                        onChange={handleOrgFormChange}
                                                        placeholder="Enter postal code"
                                                        disabled={!isEditingOrg}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="address.country">Country</Label>
                                                    <Select
                                                        disabled={!isEditingOrg}
                                                        value={orgFormData.address.country}
                                                        onValueChange={(value) => handleOrgSelectChange(value, "address.country")}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select country" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {countries.map((country) => (
                                                                <SelectItem key={country.code} value={country.code}>
                                                                    {country.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </form>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

export default ProfileTab