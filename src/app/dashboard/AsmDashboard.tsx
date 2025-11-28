// src/app/dashboard/AsmDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapPin, Users, BookCopy, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/services/api';

// --- Interfaces to match the new DTO ---
interface KpiData { value: string; changePercentage: number; isIncrease: boolean; }
interface ChartData { name: string; value: number; }
interface AsmDashboardData {
  totalTeamMembers: number;
  completedToday: number;
  daEarnedPercentage: number;
  totalVisitsToday: KpiData;
  activeSalesmen: KpiData;
  stockDistributed: KpiData;
  topPerformingSalesmen: ChartData[];
  areaWiseVisitDistribution: ChartData[];
}

export function AsmDashboard() {
  const [data, setData] = useState<AsmDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/asm-summary');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch ASM dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div>Loading ASM Dashboard...</div>;
  if (!data) return <div>Could not load data.</div>;

  const kpiCards = [
    { title: 'Total Visits Today', data: data.totalVisitsToday, icon: MapPin },
    { title: 'Active Salesmen', data: data.activeSalesmen, icon: Users },
    { title: 'Stock Distributed', data: data.stockDistributed, icon: BookCopy },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Overview Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle>My Performance Overview (Today)</CardTitle>
          <p className="text-sm text-gray-600">Your DA is based on team performance: {data.completedToday} out of {data.totalTeamMembers} executives have completed their daily targets.</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-lg font-bold">{data.completedToday} / {data.totalTeamMembers} Executives Completed</p>
              <Progress value={data.daEarnedPercentage} className="mt-2" />
            </div>
            <div className="text-right ml-4">
              <p className="text-sm text-gray-600">DA Earned</p>
              <p className="text-3xl font-bold text-purple-700">{data.daEarnedPercentage}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map(kpi => (
          <Card key={kpi.title}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold">{kpi.data.value}</p>
                <div className={`flex items-center text-xs ${kpi.data.isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.data.isIncrease ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(kpi.data.changePercentage)}% vs yesterday
                </div>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <kpi.icon className="h-6 w-6 text-gray-700" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Performing Salesmen (By Visits)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topPerformingSalesmen}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#8884d8" name="Visits" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Area-wise Visit Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
             {/* Placeholder for area chart */}
             <p className="text-center text-gray-500 pt-16">Area chart coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}