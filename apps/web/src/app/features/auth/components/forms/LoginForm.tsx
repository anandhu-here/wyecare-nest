import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLoginMutation, useProfileQuery } from '../../authApi';

const LoginForm = React.memo(() => {
    const [showPassword, setShowPassword] = React.useState(false);
    const navigate = useNavigate();
    const [openRequestDialog, setOpenRequestDialog] = useState(false);
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const dispatch = useDispatch();

    // Replace direct fetch with RTK Query mutation
    const [login, { isLoading, error: loginError }] = useLoginMutation();

    // This will fetch the profile once authenticated
    const { data: profileData, isLoading: profileLoading } = useProfileQuery(undefined, {
        skip: !localStorage.getItem('token')
    });

    // Navigate based on redirectUrl when profile is loaded
    useEffect(() => {
        if (profileData?.redirectUrl) {
            navigate(profileData.redirectUrl);
        }
    }, [profileData, navigate]);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors }
    } = useForm({
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false
        }
    });

    const onSubmit = async (data: any) => {
        try {
            // Use the login mutation instead of direct fetch
            await login({
                email: data.email.trim(),
                password: data.password.trim()
            }).unwrap();

            // The token storage and redirect will be handled by Redux
        } catch (error: any) {
            // Handle RTK Query error
            setError('root', {
                type: 'manual',
                message: error.data?.message || 'Login failed'
            });
        }
    };

    // Rest of your component remains the same
    return (
        <div className="w-full h-full flex items-center justify-center p-0 md:p-6 lg:p-6">
            <div className="w-full">
                <div className="mb-8 text-start space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent pb-2">
                        Sign in
                    </h1>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Form fields remain the same */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            className={`h-11 ${errors.email ? 'ring-1 ring-destructive' : ''}`}
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            })}
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password
                            </Label>
                            <Button
                                type="button"
                                variant="link"
                                className="text-xs font-medium p-0 h-auto"
                                onClick={() => setOpenRequestDialog(true)}
                            >
                                Forgot password?
                            </Button>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                className={`h-11 ${errors.password ? 'ring-1 ring-destructive' : ''}`}
                                {...register('password', {
                                    required: 'Password is required'
                                })}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-11 px-3 py-0 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="rememberMe"
                            {...register('rememberMe')}
                        />
                        <Label htmlFor="rememberMe" className="text-sm font-normal">
                            Remember me
                        </Label>
                    </div>

                    {/* Display either form validation errors or RTK Query errors */}
                    {(errors.root || loginError) && (
                        <div className="rounded-md bg-destructive/15 p-3">
                            <p className="text-sm text-destructive text-center">
                                {errors.root?.message || loginError?.data?.message || 'Login failed'}
                            </p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                        disabled={isLoading || profileLoading}
                    >
                        {(isLoading || profileLoading) ? (
                            <>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                Signing in
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </Button>

                    <div className="text-center w-full text-sm pt-2">
                        <span>Don't have an account?</span>{' '}
                        <a href="/signup" className="font-medium text-primary hover:underline">
                            Sign up
                        </a>
                    </div>
                </form>

                {/* Dialog components would go here */}
            </div>
        </div>
    );
});

const AuthLogin = () => {
    return <LoginForm />;
};

export default AuthLogin;