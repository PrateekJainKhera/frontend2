// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface User {
  id: number;
  name: string;
  roleName: string;
  // Add other user properties as needed
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Call the /api/auth/me endpoint to check for a valid cookie
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        // If it fails, there's no valid session
        setUser(null);
        router.push('/'); // Redirect to login page
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  return { user, loading };
}