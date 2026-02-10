import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../auth/useAuthStore';

const CreatorGuard = ({ children }) => {
    const { isAuthenticated, role, isChecking } = useAuthStore();
    const location = useLocation();

    if (isChecking) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/masuk" state={{ from: location }} replace />;
    }

    if (role !== 'creator') {
        return <Navigate to="/masuk" replace />;
    }

    return children;
};

export default CreatorGuard;
