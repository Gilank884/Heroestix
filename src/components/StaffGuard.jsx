import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { StaffSession } from '../utils/staffSession';
import useAuthStore from '../auth/useAuthStore';

const StaffGuard = ({ children }) => {
    const { id: eventId } = useParams();
    const { user } = useAuthStore();
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            console.log('🔐 StaffGuard: Checking access for event:', eventId);
            console.log('🔐 User:', user);

            // Check 1: Regular creator authentication
            if (user) {
                console.log('✅ User is authenticated, checking creator/staff status...');
                // Check if user is the event creator
                const { data } = await supabase
                    .from('events')
                    .select('creator_id')
                    .eq('id', eventId)
                    .single();

                if (data && data.creator_id === user.id) {
                    console.log('✅ User is event creator, granting access');
                    setIsAuthorized(true);
                    setLoading(false);
                    return;
                }

                // Check if user is a staff member (with account)
                const { data: staffData } = await supabase
                    .from('event_staffs')
                    .select('*')
                    .eq('event_id', eventId)
                    .eq('staff_id', user.id)
                    .single();

                if (staffData) {
                    console.log('✅ User is event staff, granting access');
                    setIsAuthorized(true);
                    setLoading(false);
                    return;
                }

                console.log('⚠️ User authenticated but not creator/staff');
            }

            // Check 2: Staff token session (passwordless)
            console.log('🔍 Checking for staff token session...');
            const hasStaffAccess = StaffSession.hasAccessTo(eventId);
            console.log('🔍 Has staff access to event?', hasStaffAccess);

            if (hasStaffAccess) {
                console.log('🔍 Validating token in database...');
                // Validate token is still valid in database
                const isValid = await StaffSession.validateToken(supabase);
                console.log('🔍 Token valid?', isValid);

                if (isValid) {
                    console.log('✅ Token validated, granting access');
                    setIsAuthorized(true);
                    setLoading(false);
                    return;
                }
            }

            // No access found
            console.log('❌ No access found, redirecting to login');
            setIsAuthorized(false);
            setLoading(false);
        };

        checkAccess();
    }, [user, eventId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memverifikasi akses...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return <Navigate to="/masuk" replace />;
    }

    return children;
};

export default StaffGuard;
