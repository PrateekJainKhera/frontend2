// src/app/dashboard/page.tsx
'use client';

import { useAuthContext } from '@/context/AuthContext';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import ManagerDashboard from './ManagerDashboard';
import { AsmDashboard } from './AsmDashboard';

export default function DashboardHomePage() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in.</div>;
  }

  // --- ROLE-BASED RENDERING ---
  switch (user.roleName) {
    case 'Executive':
      return <ExecutiveDashboard />;
    case 'ASM':
      return <AsmDashboard />;
    case 'Admin':
      return <ManagerDashboard />;
    default:
      return <div>Invalid user role.</div>;
  }
}