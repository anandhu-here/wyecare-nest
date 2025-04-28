import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { calculateMenuItems, MenuItem } from './menuItems';
import { useSelector } from 'react-redux';
import { selectCurrentOrganization, selectUser } from '@/app/features/auth/AuthSlice';

interface SidebarMenuContextProps {
    menuItems: MenuItem[];
    selectedPath: string;
    handleItemClick: (item: MenuItem) => void;
}

const SidebarMenuContext = createContext<SidebarMenuContextProps>({
    menuItems: [],
    selectedPath: '',
    handleItemClick: () => { },
});

export const useSidebarMenu = () => useContext(SidebarMenuContext);

interface SidebarMenuProviderProps {
    children: ReactNode;
}

export const SidebarMenuProvider = ({ children }: SidebarMenuProviderProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector(selectUser);
    const currentOrganization = useSelector(selectCurrentOrganization);
    const homeSettings = { allowResident3rdParty: false };


    const [selectedPath, setSelectedPath] = useState('/dashboard');

    // Update selected path when location changes
    useEffect(() => {
        setSelectedPath(location.pathname);
    }, [location.pathname]);

    const menuItems = calculateMenuItems(
        user,
        currentOrganization,
        homeSettings
    );

    const handleItemClick = (item: MenuItem) => {
        if (item.link) {
            setSelectedPath(item.link);
            navigate(item.link);
        }
    };

    return (
        <SidebarMenuContext.Provider value={{ menuItems, selectedPath, handleItemClick }}>
            {children}
        </SidebarMenuContext.Provider>
    );
};