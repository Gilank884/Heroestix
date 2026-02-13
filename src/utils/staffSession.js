// Staff session utilities
export const StaffSession = {
    // Get current staff session
    get: () => {
        try {
            const session = localStorage.getItem('staff_session');
            if (!session) return null;

            const parsed = JSON.parse(session);

            // Check if expired
            if (Date.now() > parsed.expiresAt) {
                StaffSession.clear();
                return null;
            }

            return parsed;
        } catch (error) {
            console.error('Error reading staff session:', error);
            return null;
        }
    },

    // Check if user has staff access to specific event
    hasAccessTo: (eventId) => {
        const session = StaffSession.get();
        return session && session.eventId === eventId;
    },

    // Clear staff session
    clear: () => {
        localStorage.removeItem('staff_session');
    },

    // Validate token is still valid in database
    validateToken: async (supabase) => {
        const session = StaffSession.get();
        if (!session) return false;

        try {
            const { data, error } = await supabase
                .from('event_staff_invitations')
                .select('*')
                .eq('token', session.token)
                .eq('event_id', session.eventId)
                .single();

            if (error || !data) {
                StaffSession.clear();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            StaffSession.clear();
            return false;
        }
    }
};
