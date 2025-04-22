import { createContext, useState, ReactNode } from 'react';

interface SidebarContextProps {
    sidebarToggle: boolean;
    toggleSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextProps>({
    sidebarToggle: false,
    toggleSidebar: () => { },
});

interface SidebarProviderProps {
    children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
    const [sidebarToggle, setSidebarToggle] = useState(false);

    const toggleSidebar = () => {
        setSidebarToggle(!sidebarToggle);
    };

    return (
        <SidebarContext.Provider value={{ sidebarToggle, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};