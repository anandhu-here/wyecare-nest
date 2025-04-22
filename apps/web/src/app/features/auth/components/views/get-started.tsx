// libs/web/features/src/lib/auth/views/get-started.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface GetStartedProps {
    onStart: () => void;
    invitationType?: 'organization' | 'staff';
}

const GetStarted: React.FC<GetStartedProps> = ({
    onStart,
    invitationType = 'organization'
}) => {
    const navigate = useNavigate();

    const containerVariants = {
        initial: { opacity: 0, y: 20 },
        in: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.2
            }
        },
        out: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.4
            }
        }
    };

    const itemVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 }
    };

    // Content based on invitation type
    const getContent = () => {
        if (invitationType === 'staff') {
            return {
                heading: "Join Your Organization",
                description: "You've been invited to join as a staff member. Let's get you set up with an account first."
            };
        }

        return {
            heading: "Welcome to Your New Organization",
            description: "You've been invited to create an organization. Let's get you set up with an account first."
        };
    };

    const content = getContent();

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={containerVariants}
            className="flex flex-col items-center justify-center w-full"
        >
            <Card className="w-full bg-background shadow-none border-none">
                <CardContent className="px-6 py-8 space-y-8">
                    <motion.div variants={itemVariants}>
                        <h1 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-center">
                            {content.heading}
                        </h1>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <p className="text-lg text-muted-foreground mb-8 text-center">
                            {content.description}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Button
                            size="lg"
                            className="w-full h-11"
                            onClick={onStart}
                        >
                            Get Started
                        </Button>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <p className="text-muted-foreground">
                                Already have an account?
                            </p>
                            <button
                                onClick={() => navigate('/auth/login')}
                                className="text-primary font-medium hover:underline transition-colors"
                            >
                                Log in
                            </button>
                        </div>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default GetStarted;