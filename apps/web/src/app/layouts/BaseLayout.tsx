// libs/web/features/src/lib/routing/layouts/BaseLayout.tsx
import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface BaseLayoutProps {
    children?: ReactNode;
}

export const BaseLayout = ({ children }: BaseLayoutProps) => {
    return (
        <div className="flex min-h-screen flex-col">
            {/* You can add header, footer, etc. here */}
            <main className="flex-grow">
                {children || <Outlet />}
            </main>
        </div>
    );
};

export default BaseLayout;