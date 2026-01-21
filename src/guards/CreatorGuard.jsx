import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../auth/useAuthStore';

const CreatorGuard = ({ children }) => {
    const { isAuthenticated, role } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/masuk" state={{ from: location }} replace />;
    }

    if (role !== 'creator') {
        return <Navigate to="/masuk" replace />;
    }

    return children;
};

export default CreatorGuard;
