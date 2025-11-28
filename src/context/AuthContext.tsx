// src/context/AuthContext.tsx
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';
import { useRouter } from 'next/navigation'; // Import useRouter

interface User { id: number; name: string; roleName: string; }
interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
    logout: () => void; // <-- 1. Add the function type

}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
    const router = useRouter(); // Initialize router


  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);
    const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null); // Clear the user from the state
      router.push('/'); // Redirect to the login page
    }
  };


  return (
    <AuthContext.Provider value={{ user, setUser, loading,logout  }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}