import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            role: null, // 'user', 'creator', 'developer'
            isAuthenticated: false,

            login: (userData, token, role) => set({
                user: userData,
                token: token,
                role: role,
                isAuthenticated: true
            }),

            logout: () => set({
                user: null,
                token: null,
                role: null,
                isAuthenticated: false
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
