'use client';

import { ExecutiveStockTable } from '@/components/ExecutiveStockTable';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StockOverviewPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (user.roleName !== 'Admin' && user.roleName !== 'ASM'))) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || (user.roleName !== 'Admin' && user.roleName !== 'ASM')) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor inventory distribution across all sales executives</p>
        </div>
      </div>

      <ExecutiveStockTable />
    </div>
  );
}
