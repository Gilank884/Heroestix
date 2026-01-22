import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../auth/useAuthStore';

const DevGuard = ({ children }) => {
    const { isAuthenticated, role, isChecking } = useAuthStore();
    const location = useLocation();

    if (isChecking) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/masuk" state={{ from: location }} replace />;
    }

    if (role !== 'developer') {
        return <Navigate to="/masuk" replace />;
    }

    return children;
};

export default DevGuard;
