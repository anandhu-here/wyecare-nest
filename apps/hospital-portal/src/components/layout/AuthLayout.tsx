import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left panel with gradient background and branding */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 to-purple-500 p-10 flex-col justify-between text-white">
                <div>
                    <h1 className="text-3xl font-bold">Hospital Portal</h1>
                    <p className="mt-2 text-white/80">Streamlining healthcare management</p>
                </div>

                <div className="space-y-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-2">Efficient Staff Management</h3>
                        <p className="text-white/80">Seamlessly manage schedules, roles, and permissions across departments.</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-2">Secure Multi-Level Access</h3>
                        <p className="text-white/80">Role-based permissions ensure that staff only access appropriate information.</p>
                    </div>
                </div>

                <div className="text-white/60 text-sm">
                    © 2025 Hospital Portal. All rights reserved.
                </div>
            </div>

            {/* Right panel with auth forms */}
            <div className="flex-1 flex flex-col p-4 md:p-0">
                <div className="md:hidden py-4">
                    <h1 className="text-2xl font-bold text-primary-500">Hospital Portal</h1>
                    <p className="text-sm text-muted-foreground">Streamlining healthcare management</p>
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-md px-6 py-8">
                        <Outlet />
                    </div>
                </div>

                <div className="md:hidden text-center py-4 text-xs text-muted-foreground">
                    © 2025 Hospital Portal. All rights reserved.
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;