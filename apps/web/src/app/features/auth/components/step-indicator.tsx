// libs/web/features/src/lib/auth/components/step-indicator.tsx
import React from 'react';
import { BadgeCheck, Mail, UserCircle, Building } from 'lucide-react';

interface StepIndicatorProps {
    currentStep: number;
    steps: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
    // Map step names to appropriate icons
    const getStepIcon = (step: string, isActive: boolean) => {
        const className = `h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`;

        switch (step.toLowerCase()) {
            case 'personal':
            case 'account':
                return <UserCircle className={className} />;
            case 'email':
            case 'verification':
                return <Mail className={className} />;
            case 'complete':
                return <BadgeCheck className={className} />;
            default:
                return <Building className={className} />;
        }
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between relative">
                {/* Progress line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-muted -z-10 transform -translate-y-1/2" />

                {steps.map((step, index) => {
                    const isActive = index <= currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <div key={step} className="flex flex-col items-center z-0">
                            <div
                                className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'}
                  transition-colors duration-200
                `}
                            >
                                {getStepIcon(step, isActive)}
                            </div>
                            <span
                                className={`
                  text-xs text-center
                  ${isActive
                                        ? 'text-primary font-medium'
                                        : 'text-muted-foreground'}
                `}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;