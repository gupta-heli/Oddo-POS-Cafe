import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/index.ts';

interface AuthState {
  user: User | null;
  token: string | null;
  activeSessionId: string | null;
  setAuth: (user: User, token: string) => void;
  setSession: (sessionId: string | null) => void;
  clearAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      activeSessionId: null,
      setAuth: (user, token) => set({ user, token }),
      setSession: (sessionId) => set({ activeSessionId: sessionId }),
      clearAuth: () => set({ user: null, token: null, activeSessionId: null }),
      logout: () => set({ user: null, token: null, activeSessionId: null }),
    }),
    {
      name: 'cafe-pos-auth',
    }
  )
);
