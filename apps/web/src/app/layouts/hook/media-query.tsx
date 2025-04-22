// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export interface Breakpoints {
    isMobile: boolean;  // < 768px
    isTablet: boolean;  // >= 768px and < 1024px
    isDesktop: boolean; // >= 1024px
}

/**
 * Custom hook that returns boolean flags for different device breakpoints
 * 
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: >= 768px and < 1024px
 * - Desktop: >= 1024px
 */
export function useMediaQuery(): Breakpoints {
    // Initialize with defaults based on common viewport sizes
    const [breakpoints, setBreakpoints] = useState<Breakpoints>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
    });

    useEffect(() => {
        // Define our media queries
        const mobileQuery = window.matchMedia('(max-width: 767px)');
        const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
        const desktopQuery = window.matchMedia('(min-width: 1024px)');

        // Function to update the state based on media query matches
        const updateBreakpoints = () => {
            setBreakpoints({
                isMobile: mobileQuery.matches,
                isTablet: tabletQuery.matches,
                isDesktop: desktopQuery.matches,
            });
        };

        // Initial call to set the state
        updateBreakpoints();

        // Set up event listeners for changes
        mobileQuery.addEventListener('change', updateBreakpoints);
        tabletQuery.addEventListener('change', updateBreakpoints);
        desktopQuery.addEventListener('change', updateBreakpoints);

        // Clean up event listeners
        return () => {
            mobileQuery.removeEventListener('change', updateBreakpoints);
            tabletQuery.removeEventListener('change', updateBreakpoints);
            desktopQuery.removeEventListener('change', updateBreakpoints);
        };
    }, []);

    return breakpoints;
}

// Example usage:
// const { isMobile, isTablet, isDesktop } = useMediaQuery();