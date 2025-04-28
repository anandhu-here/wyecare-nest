import React, { useState, useEffect } from 'react';
import { App, BackButtonListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/util';
import {
    User,
    ArrowLeft,
    ChevronRight,
    FileText,
    Briefcase,
    Star,
    Calendar,
    CreditCard,
    Info,
    CheckSquare,
} from 'lucide-react';

// Import all the components
import PersonalInfo from './personal-info';
import IdentificationDocuments from './identification-docs';
import ProfessionalInformation from './professional-info';
import Skills from './skills';
import WorkPatternSelector from './work-pattern';
import AvailabilityCalendar from './availability';
import BankDetails from './bank-details';
import AdditionalInfo from './additional-info';
import Consents from './consents';

// import ProfessionalInformation from '../components/proffesional';
// import Skills from '../components/skills';
// import BankDetails from '../components/bank';
// import AdditionalInfo from '../components/additional';
// import Consents from '../components/consents';
// import AvailabilityCalendar from '../components/availability-calendar';
// import { useAppSelector } from 'src/redux/hook';
// import WorkPatternSelector from '../components/work-pattern';

interface Category {
    name: string;
    component: React.ComponentType<any>;
    label: string;
    icon: React.ElementType;
    description: string;
}

const categories: Category[] = [
    {
        name: 'personalInfo',
        component: PersonalInfo,
        label: 'Personal Information',
        icon: User,
        description: 'Your name, contact details and personal information',
    },
    {
        name: 'identificationDocuments',
        component: IdentificationDocuments,
        label: 'Identification Documents',
        icon: FileText,
        description: 'ID documents, verification and legal information',
    },
    {
        name: 'professionalInfo',
        component: ProfessionalInformation,
        label: 'Professional Information',
        icon: Briefcase,
        description: 'Work experience, education and professional details',
    },
    {
        name: 'skills',
        component: Skills,
        label: 'Skills',
        icon: Star,
        description: 'Your professional skills and competencies',
    },
    {
        name: 'workPattern',
        component: WorkPatternSelector,
        label: 'Work Pattern',
        icon: Calendar,
        description: 'Preferred work pattern and availability',
    },
    {
        name: 'availability',
        component: AvailabilityCalendar,
        label: 'Availability',
        icon: Calendar,
        description: 'Working hours and availability preferences',
    },
    {
        name: 'bankDetails',
        component: BankDetails,
        label: 'Bank Details',
        icon: CreditCard,
        description: 'Payment information and bank account details',
    },
    {
        name: 'additionalInfo',
        component: AdditionalInfo,
        label: 'Additional Information',
        icon: Info,
        description: 'Other relevant information about you',
    },
    {
        name: 'consents',
        component: Consents,
        label: 'Consents',
        icon: CheckSquare,
        description: 'Your consent preferences and agreements',
    },
];

interface ProfileTabProps {
    carerApplication: any;
    isCarerApplicationLoading: boolean;
    isMobile: boolean;
    isTablet: boolean;
    callback?: (hide: boolean) => void;
}

const ProfileTab = ({
    carerApplication,
    isCarerApplicationLoading,
    isMobile,
    isTablet,
    callback,
}: ProfileTabProps) => {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    const isIOS = Capacitor.getPlatform() === 'ios';
    useEffect(() => {
        let backButtonListener: any;
        const setupBackButtonListener = async () => {
            backButtonListener = await App.addListener(
                'backButton',
                (e: BackButtonListenerEvent) => {
                    if (selectedCategory !== null) {
                        e.canGoBack = false;
                        setSelectedCategory(null);
                        setShowDetailPanel(false);
                        callback && callback(false);
                    } else {
                        e.canGoBack = true;
                    }
                }
            );
        };
        const handleBrowserBack = (e: PopStateEvent) => {
            if (selectedCategory !== null) {
                e.preventDefault();
                setSelectedCategory(null);
                setShowDetailPanel(false);
                callback && callback(false);
                window.history.pushState(null, '', window.location.pathname);
            }
        };
        setupBackButtonListener();
        window.history.pushState(null, '', window.location.pathname);
        window.addEventListener('popstate', handleBrowserBack);
        return () => {
            if (backButtonListener) {
                backButtonListener.remove();
            }
            window.removeEventListener('popstate', handleBrowserBack);
        };
    }, [selectedCategory, callback]);

    useEffect(() => {
        if (!isMobile && !isTablet) {
            setSelectedCategory(0);
            setShowDetailPanel(true);
        }
    }, [isMobile, isTablet]);

    const handleCategoryChange = (index: number): void => {
        setSelectedCategory(index);
        setShowDetailPanel(true);
        if (isMobile || isTablet) callback?.(true);
    };

    const renderSelectedComponent = () => {
        if (selectedCategory === null || isCarerApplicationLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <p className="text-muted-foreground">
                        Please select a category to get started
                    </p>
                </div>
            );
        }
        const SelectedComponent = categories[selectedCategory].component;
        return (
            <SelectedComponent
                initialData={
                    carerApplication?.data?.[categories[selectedCategory].name] || {}
                }
                selectedSection={categories[selectedCategory].name}
                editable={true}
            />
        );
    };

    const handleBack = () => {
        setSelectedCategory(null);
        setShowDetailPanel(false);
        callback?.(false);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <div
                className={`md:w-${showDetailPanel && (!isMobile || !isTablet) ? '1/3' : 'full'
                    }`}
            >
                {(!showDetailPanel || !isMobile || !isTablet) && (
                    <div className="grid gap-1">
                        {categories.map((category, index) => {
                            const Icon = category.icon;
                            const isComplete =
                                carerApplication?.data?.[category.name] &&
                                Object.keys(carerApplication.data[category.name]).length > 0;
                            return (
                                <Card
                                    key={category.name}
                                    className={`bg-gray-50 md:bg-gray-100 w-full hover:shadow-sm transition-shadow cursor-pointer shadow-md ${selectedCategory === index && (!isMobile || !isTablet)
                                        ? 'border-primary ring-1 ring-primary/20'
                                        : 'border-gray-100'
                                        }`}
                                    onClick={() => handleCategoryChange(index)}
                                >
                                    <CardContent className="p-0">
                                        <div className="flex items-center p-3">
                                            <div
                                                className={`mr-3 p-2 rounded-full ${selectedCategory === index && (!isMobile || !isTablet)
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-gray-50'
                                                    }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="font-medium text-sm">
                                                    {category.label}
                                                </h3>
                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                    {category.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                {isComplete && (
                                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
            {showDetailPanel && (
                <div
                    className={
                        isMobile || isTablet
                            ? 'fixed inset-0 z-40 bg-white'
                            : 'md:w-full bg-gray-50 rounded-lg border border-gray-100 shadow-sm'
                    }
                >
                    {isMobile || isTablet ? (
                        <Sheet open={showDetailPanel} onOpenChange={handleBack}>
                            <SheetContent
                                side="bottom"
                                className={cn(
                                    'w-full p-0 h-[100dvh] border-none',
                                    isIOS && 'pb-[env(safe-area-inset-bottom)]'
                                )}
                            >
                                <SheetHeader
                                    className={cn(
                                        'sticky top-0 bg-white border-b px-4 py-3 flex flex-row items-center',
                                        isIOS && 'pt-[env(safe-area-inset-top)]',
                                        isIOS
                                            ? 'h-[calc(60px+env(safe-area-inset-top))]'
                                            : 'h-[60px]'
                                    )}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleBack}
                                        className="mr-2"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <SheetTitle className="text-left">
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                {selectedCategory !== null
                                                    ? categories[selectedCategory].label
                                                    : ''}
                                            </h2>
                                            <p className="text-sm text-muted-foreground font-normal">
                                                {selectedCategory !== null
                                                    ? categories[selectedCategory].description
                                                    : ''}
                                            </p>
                                        </div>
                                    </SheetTitle>
                                </SheetHeader>
                                <ScrollArea
                                    className={cn(
                                        'flex-grow',
                                        isIOS
                                            ? 'h-[calc(100dvh-60px-env(safe-area-inset-top)-env(safe-area-inset-bottom))]'
                                            : 'h-[calc(100dvh-60px)]'
                                    )}
                                >
                                    <div className="p-4">{renderSelectedComponent()}</div>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    ) : (
                        <div>
                            <div className="border-b px-4 py-3">
                                <div className="flex items-center">
                                    <button
                                        onClick={handleBack}
                                        className="mr-2 p-1 rounded-full hover:bg-gray-100 md:hidden"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            {selectedCategory !== null
                                                ? categories[selectedCategory].label
                                                : ''}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            {selectedCategory !== null
                                                ? categories[selectedCategory].description
                                                : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">{renderSelectedComponent()}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileTab;
