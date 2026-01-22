import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            role: null, // 'user', 'creator', 'developer'
            isAuthenticated: false,
            isChecking: true,

            setChecking: (val) => set({ isChecking: val }),

            login: (userData, token, role) => set({
                user: userData,
                token: token,
                role: role,
                isAuthenticated: true,
                isChecking: false
            }),

            logout: () => set({
                user: null,
                token: null,
                role: null,
                isAuthenticated: false,
                isChecking: false
            }),

            updateProfile: (userData) => set((state) => ({
                user: { ...state.user, ...userData }
            })),
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;
