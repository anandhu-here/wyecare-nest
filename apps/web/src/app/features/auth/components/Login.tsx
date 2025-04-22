import * as React from 'react';
import { useNavigate } from 'react-router-dom'; import AuthWrapper from './AuthWrapper';
import AuthLogin from './forms/LoginForm';


interface LoginProps { }

const Login: React.FC<LoginProps> = () => {
    const navigate = useNavigate();

    const handleSignUpClick = () => {
        navigate('/signup');
    };

    return (
        <AuthWrapper>
            <AuthLogin />
        </AuthWrapper>
    );
};

export default Login;
