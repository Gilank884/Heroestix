import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../auth/useAuthStore';

const DevGuard = ({ children }) => {
    const { isAuthenticated, role } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/masuk" state={{ from: location }} replace />;
    }

    if (role !== 'developer') {
        return <Navigate to="/masuk" replace />;
    }

    return children;
};

export default DevGuard;
