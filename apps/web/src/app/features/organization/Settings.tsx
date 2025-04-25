"use client"

import React, { useRef, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { App, BackButtonListenerEvent } from '@capacitor/app'
import { agency_items, home_items } from './components/settings/settings-items'

// Shadcn Components
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

// Icons
import {
    ChevronRight,
    Loader2,
    ArrowLeft,
    Menu,
    Settings,
    Building
} from 'lucide-react'
import { selectCurrentOrganization, selectUser } from '../auth/AuthSlice'
import { current } from '@reduxjs/toolkit'

const SettingsLayout = () => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [showDetailPanel, setShowDetailPanel] = useState(false)

    // Track window size for responsive design
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)

    // const orgType = useAppSelector((state) => state.userState.currentOrganization.type)
    // const dispatch = useDispatch()
    // const userState = useAppSelector((state) => state.userState)
    const currentOrganization = useSelector(selectCurrentOrganization)
    const orgType = currentOrganization?.type;
    const userState = useSelector(selectUser);
    // Determine if we're on mobile, tablet, or desktop
    const isMobile = windowWidth < 640
    const isTablet = windowWidth >= 640 && windowWidth < 1024
    const needsSheet = isMobile || isTablet

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        // If desktop, auto-select first item
        if (!needsSheet && selectedIndex === null) {
            setSelectedIndex(0)
            setShowDetailPanel(true)
        }
    }, [needsSheet, selectedIndex])

    // Set up back button handling for mobile/tablet
    useEffect(() => {
        let backButtonListener: any

        const setupBackButtonListener = async () => {
            try {
                backButtonListener = await App.addListener('backButton', (e: BackButtonListenerEvent) => {
                    if (selectedIndex !== null && showDetailPanel) {
                        e.canGoBack = false
                        handleBack()
                    } else {
                        e.canGoBack = true
                    }
                })
            } catch (error) {
                console.log('Back button listener setup failed', error)
            }
        }

        const handleBrowserBack = (e: PopStateEvent) => {
            if (selectedIndex !== null && showDetailPanel && needsSheet) {
                e.preventDefault()
                handleBack()
                window.history.pushState(null, '', window.location.pathname)
            }
        }

        setupBackButtonListener()
        window.history.pushState(null, '', window.location.pathname)
        window.addEventListener('popstate', handleBrowserBack)

        return () => {
            if (backButtonListener) {
                backButtonListener.remove()
            }
            window.removeEventListener('popstate', handleBrowserBack)
        }
    }, [selectedIndex, showDetailPanel, needsSheet])

    const handleSettingSelect = (index: number) => {
        setSelectedIndex(index)
        setShowDetailPanel(true)
    }

    const handleBack = () => {
        setSelectedIndex(null)
        setShowDetailPanel(false)
    }

    const menuItems = orgType === 'agency' ? [...agency_items] : [...home_items]
    const CurrentComponent = selectedIndex !== null ? menuItems[selectedIndex].component : null

    // Mobile/Tablet Layout
    if (needsSheet) {
        return (
            <div className="flex flex-col h-full w-full bg-background">

                {/* Mobile Settings List */}
                <div className={`${showDetailPanel ? 'hidden' : 'block'} flex-1 overflow-auto`}>
                    <div className="p-4 space-y-3">
                        {/* Header card with organization name */}
                        <Card className="bg-white hover:bg-slate-50">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <Building className="h-5 w-5 mr-3 text-primary" />
                                    <div>
                                        <h3 className="font-semibold">{currentOrganization.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {orgType === 'agency' ? 'Agency' : 'Care Home'} Settings
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Settings menu items */}
                        {menuItems.map((item, index) => {
                            const isSelected = selectedIndex === index;
                            return (
                                <Card
                                    key={item.label}
                                    className={`hover:shadow-sm transition-shadow cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'bg-background'
                                        }`}
                                    onClick={() => handleSettingSelect(index)}
                                >
                                    <CardContent className="p-0">
                                        <div className="flex items-center p-3">
                                            <div className={`mr-3 p-2 rounded-full ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {React.cloneElement(item.icon, { className: "h-5 w-5" })}
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="font-medium text-sm">{item.label}</h3>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {item.description || "Manage your settings"}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* User info footer */}
                    <div className="p-4 mt-auto border-t bg-muted/30">
                        <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                                <AvatarImage src={userState?.avatarUrl} alt={`${userState?.firstName} ${userState?.lastName}`} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {userState?.firstName?.charAt(0)}{userState?.lastName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium">{userState?.firstName} {userState?.lastName}</p>
                                <p className="text-xs text-muted-foreground">Administrator</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Detail Panel */}
                {selectedIndex !== null && CurrentComponent && (
                    <Sheet open={showDetailPanel} onOpenChange={setShowDetailPanel}>
                        <SheetContent side="bottom" className="w-full p-0 h-[100dvh] border-none">
                            <SheetHeader className="sticky top-0 bg-background border-b px-4 py-3 flex flex-row items-center">
                                <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <SheetTitle className="text-left">
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            {menuItems[selectedIndex].label}
                                        </h2>
                                        <p className="text-sm text-muted-foreground font-normal">
                                            {menuItems[selectedIndex].description || "Manage your settings"}
                                        </p>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100dvh-4rem)]">
                                <div className="p-6">
                                    <CurrentComponent />
                                </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                )}
            </div>
        );
    }

    // Desktop Layout
    return (
        <div className="flex w-full bg-background h-[calc(100vh-70px)]">
            {/* Left Sidebar with Settings Menu */}
            <div className="w-72 border-r flex flex-col h-full bg-background">
                {/* Organization Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        <div>
                            <h2 className="text-base font-medium truncate max-w-[230px]">
                                {currentOrganization?.name}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {orgType === 'agency' ? 'Agency Settings' : 'Care Home Settings'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Header */}
                <div className="p-4 pb-2">
                    <div className="flex items-center text-xs font-medium text-muted-foreground tracking-wider">
                        <Settings className="h-3.5 w-3.5 mr-2" />
                        SETTINGS
                    </div>
                </div>

                {/* Settings List */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-0.5">
                        {menuItems.map((item, index) => {
                            const isSelected = selectedIndex === index;
                            return (
                                <Button
                                    key={item.label}
                                    variant={isSelected ? "secondary" : "ghost"}
                                    className={`w-full justify-start text-sm h-10 ${isSelected ? 'font-medium' : ''}`}
                                    onClick={() => handleSettingSelect(index)}
                                >
                                    {React.cloneElement(item.icon, {
                                        className: `h-4 w-4 mr-3 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`
                                    })}
                                    {item.label}
                                    {isSelected && (
                                        <ChevronRight className="h-4 w-4 ml-auto text-primary" />
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </ScrollArea>

                {/* User Info Footer */}
                <div className="border-t p-4 bg-muted/30">
                    <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={userState?.avatarUrl} alt={`${userState?.firstName} ${userState?.lastName}`} />
                            <AvatarFallback className="bg-secondary/20 text-secondary-foreground text-xs">
                                {userState?.firstName?.charAt(0)}{userState?.lastName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{userState?.firstName} {userState?.lastName}</p>
                            <p className="text-xs text-muted-foreground">Administrator</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {selectedIndex !== null && CurrentComponent ? (
                    <div className="h-full flex flex-col">
                        {/* Panel Header */}
                        <div className="border-b px-6 py-4">
                            <div className="flex items-center">
                                <div>
                                    <h1 className="text-xl font-semibold">
                                        {menuItems[selectedIndex].label}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {menuItems[selectedIndex].description || "Manage your settings"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 overflow-auto p-6">
                            <div className="mx-auto">
                                <CurrentComponent />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-medium mb-2">Organization Settings</h3>
                            <p className="text-muted-foreground">
                                Select an option from the sidebar to configure your organization settings and preferences.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsLayout