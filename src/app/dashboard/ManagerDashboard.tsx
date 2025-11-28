
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useInterval } from '../../hooks/useInterval';
import { TimeAgo } from '@/components/TimeAgo';
import {
  MapPin, IndianRupee, Users, ClipboardCheck, BookCopy, TrendingUp, TrendingDown, Clock, MoveRight, Package
} from 'lucide-react';

// --- Interfaces ---
interface KpiCardData { title: string; value: string; changePercentage: number; isIncrease: boolean; }
interface ChartData { name: string; value: number; [key: string]: string | number; }
interface DailyTrendData { date: string; visits: number; orders: number; revenue: number; }
interface DashboardAnalytics { 
  totalVisits: KpiCardData; 
  totalExpenses: KpiCardData; 
  activeSalesmen: KpiCardData; 
  pendingApprovals: KpiCardData; 
  stockDistributed: KpiCardData; 
  // NEW: Revenue & Orders KPIs
  totalRevenue: KpiCardData;
  totalOrders: KpiCardData;
  conversionRate: KpiCardData;
  // Charts
  topPerformingSalesmen: ChartData[]; 
  areaWiseVisitDistribution: ChartData[]; 
  // NEW: Additional Charts
  visitsByLocationType: ChartData[];
  dailyTrend: DailyTrendData[];
}
interface LiveLocation { salesExecutiveId: number; executiveName: string; latitude: number; longitude: number; lastUpdated: string; }
interface ActivityFeedItem { timestamp: string; description: string; }

// --- Enhanced Sub-component for KPI Cards (Reduced Size) ---
function KPICard({ title, value, icon: Icon, change, color }: { title: string; value: string; icon: React.ElementType; change: { value: number; type: string; period: string; }; color: string; }) {
    const isIncrease = change.type === 'increase';
    const TrendIcon = isIncrease ? TrendingUp : TrendingDown;
    const isConversionRate = title.toLowerCase().includes('conversion rate');

    // Add formula to title if it's conversion rate
    const displayTitle = isConversionRate ? `${title} ((Orders ÷ Visits) × 100)` : title;

    return (
      <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4" style={{ borderLeftColor: color.replace('bg-', '#').replace('-500', '') }}>
        <CardContent className="p-2 md:p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{displayTitle}</p>
              <p className="text-lg md:text-xl font-bold text-gray-900 truncate">{value}</p>
              {change.value > 0 && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{change.value}%</span>
                  <span className="text-[10px] text-gray-500 font-normal">{change.period}</span>
                </div>
              )}
            </div>
            <div className={`${color} p-2 rounded-lg shadow-md shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
}

// --- Sub-component for the Live Map Widget ---
function LiveMapWidget({ liveLocations }: { liveLocations: LiveLocation[] }) {
  const router = useRouter();
  return (
    <Card className="col-span-1 lg:col-span-3 row-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Live Team Map ({liveLocations.length} Active)</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/live-tracking')}>
          View Full Map <MoveRight className="h-4 w-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent className="h-[300px] p-0">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
          <Map defaultCenter={{ lat: 22.7196, lng: 75.8577 }} defaultZoom={11} mapId="main-dashboard-map" gestureHandling="none" disableDefaultUI={true}>
            {liveLocations.map(exec => (
              <AdvancedMarker key={exec.salesExecutiveId} position={{ lat: exec.latitude, lng: exec.longitude }} title={exec.executiveName}>
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-md" />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </CardContent>
    </Card>
  );
}

// --- Sub-component for the Activity Feed ---
function ActivityFeedWidget({ feed }: { feed: ActivityFeedItem[] }) {
  return (
    <Card className="shadow-md">
      <CardHeader className="border-b"><CardTitle className="text-lg font-semibold text-gray-800">Live Activity Feed</CardTitle></CardHeader>
      <CardContent className="space-y-3 h-72 overflow-y-auto pt-6">
        {feed.length > 0 ? feed.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="bg-gray-100 p-2 rounded-full mt-1"><Clock className="h-4 w-4 text-gray-500" /></div>
            <div>
              <p className="text-sm font-medium">{item.description}</p>
              <p className="text-xs text-gray-500">
                <TimeAgo timestamp={item.timestamp} />
              </p>
            </div>
          </div>
        )) : <p className="text-sm text-gray-500 text-center py-10">No recent activity.</p>}
      </CardContent>
    </Card>
  );
}
// --- Main Dashboard Component ---
export default function ManagerDashboard() {
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<DashboardAnalytics | null>(null);
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const fetchData = async (period: 'today' | 'week' | 'month' = 'today') => {
    try {
      const [analyticsRes, liveRes, feedRes] = await Promise.all([
        api.get(`/dashboard/analytics?period=${period}`),
        api.get('/tracking/live'),
        api.get('/dashboard/activity-feed')
      ]);
      setAnalyticsData(analyticsRes.data);
      setLiveLocations(liveRes.data);
      setActivityFeed(feedRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(selectedPeriod); }, [selectedPeriod]);
  useInterval(() => fetchData(selectedPeriod), 30000);

  if (isLoading) return <div>Loading Mission Control...</div>;
  if (!analyticsData) return <div>Could not load dashboard data.</div>;

  // Existing KPI Cards (keeping all)
  const kpiCards = [
    { data: analyticsData.totalVisits, icon: MapPin, color: 'bg-blue-500' },
    { data: analyticsData.totalExpenses, icon: IndianRupee, color: 'bg-green-500' },
    { data: analyticsData.activeSalesmen, icon: Users, color: 'bg-purple-500' },
    { data: analyticsData.pendingApprovals, icon: ClipboardCheck, color: 'bg-orange-500' },
    { data: analyticsData.stockDistributed, icon: BookCopy, color: 'bg-indigo-500' },
        { data: analyticsData.totalRevenue, icon: IndianRupee, color: 'bg-emerald-500' },
    { data: analyticsData.totalOrders, icon: ClipboardCheck, color: 'bg-sky-500' },
    { data: analyticsData.conversionRate, icon: TrendingUp, color: 'bg-violet-500' },
  ];

  // NEW: Revenue & Sales KPI Cards

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as 'today' | 'week' | 'month')}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Act 1: Existing KPI Cards */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, index) =>  <KPICard 
            key={index} 
            title={kpi.data.title} 
            value={kpi.data.value} 
            icon={kpi.icon} 
            change={{
              value: Math.abs(kpi.data.changePercentage), 
              type: kpi.data.isIncrease ? 'increase' : 'decrease', 
              period: selectedPeriod === 'today' ? 'vs yesterday' : selectedPeriod === 'week' ? 'vs last week' : 'vs last month'
            }} 
            color={kpi.color} 
          />)}
      </div>



      {/* Act 2: Live Activity Feed and Location Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeedWidget feed={activityFeed} />
        
        {/* Visit Distribution by Location Type */}
        {analyticsData.visitsByLocationType && analyticsData.visitsByLocationType.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                📍 Visits by Location Type
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.visitsByLocationType}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.visitsByLocationType.map((entry, index) => {
                      const COLORS = ['#3b82f6', '#10b981', '#f97316', '#6366f1', '#0ea5e9', '#10b981'];
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* NEW: Enhanced Daily Trend Chart */}
      {analyticsData.dailyTrend && analyticsData.dailyTrend.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              📈 Daily Performance Trend
              <span className="text-sm font-normal text-gray-500">({selectedPeriod === 'today' ? 'Last 7 Days' : selectedPeriod === 'week' ? 'Last 7 Days' : 'Last 30 Days'})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [`₹${value.toLocaleString()}`, 'Revenue'];
                    if (name === 'visits') return [value, 'Visits'];
                    if (name === 'orders') return [value, 'Orders'];
                    return value;
                  }} 
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Visits"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Act 3: Top Performing Salesmen */}
      <Card className="shadow-md">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            🏆 Top 5 Performing Salesmen
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72 pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.topPerformingSalesmen} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              />
              <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]} name="Visits" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}