import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import your logo and images
import Logo from '@/assets/logo/wyecare-white-icon.png';
// import careHome1 from '@wyecare/frontend/assets/images/care_homes_illus/care home_1.jpg';
// import careHome2 from '@wyecare/frontend/assets/images/care_homes_illus/care home_2.jpg';
// import careHome3 from '@wyecare/frontend/assets/images/care_homes_illus/care home_3.jpg';

import careHome1 from '@/assets/images/auth-carousel/care home_1.jpg';
import careHome2 from '@/assets/images/auth-carousel/care home_2.jpg';
import careHome3 from '@/assets/images/auth-carousel/care home_3.jpg';

const careHomeImages = [
    careHome1,
    careHome2,
    careHome3
];

const ImageCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % careHomeImages.length);
        }, 7000);

        return () => clearInterval(timer);
    }, []);

    const handlePrevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + careHomeImages.length) % careHomeImages.length);
    };

    const handleNextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % careHomeImages.length);
    };

    return (
        <div className="relative h-full w-full overflow-hidden">
            {careHomeImages.map((image, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${currentIndex === index ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <img
                        src={image}
                        alt={`Care home ${index + 1}`}
                        className="h-full w-full object-cover object-center"
                    />
                </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
        </div>
    );
};

// This is the wrapper component - use it to wrap your existing login/signup component
const AuthWrapper = ({ children }: {
    children: React.ReactNode;
}) => {
    return (
        <div className="flex overflow-hidden h-screen bg-gray-50 dark:bg-gray-900 shadow-md">
            {/* Left Panel - Image Carousel (hidden on mobile/tablet) */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                <ImageCarousel />

                {/* Company branding overlay */}
                <div className="absolute top-0 left-0 right-0 p-8 z-10">
                    <div className="w-16 h-16 mb-2 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white w-10 h-10">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg> */}
                        <img src={Logo} alt="Wyecare Solutions" className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Wyecare Solutions</h1>
                    <p className="text-white/80 text-sm mt-1">Empowering your digital care management</p>
                </div>
            </div>

            {/* Right Panel - This is where your existing login component will be mounted */}
            <div className="w-full lg:w-1/2 flex justify-center items-center bg-background rounded-r-xl">
                <div className="w-full px-6 py-12 md:px-8 md:py-16">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthWrapper;