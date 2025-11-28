// src/app/dashboard/view-assignments/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterX, Download, Search, Users, MapPin, CheckCircle, Clock, School, GraduationCap, Store } from 'lucide-react';
import api from '@/services/api';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// --- Interfaces ---
interface Executive { id: number; name: string; }
interface Assignment {
  id: number;
  executiveId: number;
  executiveName: string;
  locationName: string;
  area: string | null;
  district: string | null;
  address: string | null;
  isCompleted: boolean;
  locationType: number;
  assignedMonth: string;
}

interface ExecutiveSummary {
  executiveId: number;
  executiveName: string;
  totalAssignments: number;
  schools: number;
  coaching: number;
  shopkeepers: number;
  completed: number;
  pending: number;
}

interface SummaryResponse {
  month: string;
  totalExecutives: number;
  totalAssignments: number;
  summary: ExecutiveSummary[];
}

const locationTypeNames: { [key: number]: string } = {
  0: 'School',
  1: 'Coaching',
  2: 'Shopkeeper'
};

export default function ViewAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Filter States ---
  const [filters, setFilters] = useState({
    month: new Date().toISOString().substring(0, 7), // YYYY-MM format for month input
    executiveId: 'all',
    locationType: 'all',
    district: 'all',
    area: 'all',
  });

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const monthDate = new Date(filters.month + '-01');
      const response = await api.get(`/beat-assignments/summary?month=${monthDate.toISOString()}`);
      setSummary(response.data);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      toast({
        title: "Error",
        description: "Failed to fetch beat assignment summary.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const monthDate = new Date(filters.month + '-01');
      const params = new URLSearchParams({
        month: monthDate.toISOString(),
      });

      if (filters.executiveId !== 'all') params.append('executiveId', filters.executiveId);
      if (filters.locationType !== 'all') params.append('locationType', filters.locationType);
      if (filters.district !== 'all') params.append('district', filters.district);
      if (filters.area !== 'all') params.append('area', filters.area);

      const response = await api.get(`/beat-assignments?${params.toString()}`);
      setAssignments(response.data);
      setViewMode('detailed');
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch assignments.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToCSV = () => {
    if (viewMode === 'detailed' && assignments.length > 0) {
      const headers = ['Executive', 'Location Name', 'Type', 'Area', 'District', 'Address', 'Status'];
      const rows = filteredAssignments.map(a => [
        a.executiveName,
        a.locationName,
        locationTypeNames[a.locationType],
        a.area || '',
        a.district || '',
        a.address || '',
        a.isCompleted ? 'Completed' : 'Pending'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beat-assignments-${filters.month}.csv`;
      a.click();

      toast({
        title: "Success",
        description: "Assignments exported to CSV successfully."
      });
    } else if (summary) {
      const headers = ['Executive', 'Total', 'Schools', 'Coaching', 'Shopkeepers', 'Completed', 'Pending'];
      const rows = summary.summary.map(s => [
        s.executiveName,
        s.totalAssignments,
        s.schools,
        s.coaching,
        s.shopkeepers,
        s.completed,
        s.pending
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beat-summary-${filters.month}.csv`;
      a.click();

      toast({
        title: "Success",
        description: "Summary exported to CSV successfully."
      });
    }
  };

  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const response = await api.get('/executives');
        setExecutives(response.data.filter((e: any) => e.roleName === 'Executive'));
      } catch (error) {
        console.error("Failed to fetch executives:", error);
      }
    };
    fetchExecutives();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [filters.month]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      month: new Date().toISOString().substring(0, 7),
      executiveId: 'all',
      locationType: 'all',
      district: 'all',
      area: 'all',
    });
    setViewMode('summary');
    fetchSummary();
  };

  const filteredAssignments = assignments.filter(a =>
    a.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.executiveName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">View Beat Assignments</h2>
          <p className="text-gray-500">Review and monitor monthly beat assignments</p>
        </div>
        <Button onClick={handleExportToCSV} variant="outline" disabled={!summary && assignments.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select criteria to view beat assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Input
                type="month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Executive</Label>
              <Select value={filters.executiveId} onValueChange={(v) => handleFilterChange('executiveId', v)}>
                <SelectTrigger><SelectValue placeholder="All Executives" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Executives</SelectItem>
                  {executives.map(e => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location Type</Label>
              <Select value={filters.locationType} onValueChange={(v) => handleFilterChange('locationType', v)}>
                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="0">Schools</SelectItem>
                  <SelectItem value="1">Coaching Centers</SelectItem>
                  <SelectItem value="2">Shopkeepers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2 md:col-span-2">
              <Button onClick={fetchAssignments} className="flex-1" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'View Details'}
              </Button>
              <Button onClick={resetFilters} variant="outline">
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'summary' && summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Executives</p>
                    <p className="text-2xl font-bold">{summary.totalExecutives}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Assignments</p>
                    <p className="text-2xl font-bold">{summary.totalAssignments}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Month</p>
                    <p className="text-2xl font-bold">{format(new Date(summary.month), 'MMM yyyy')}</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Executive-wise Summary</CardTitle>
              <CardDescription>Overview of beat assignments per executive</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Executive Name</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right"><School className="h-4 w-4 inline mr-1" />Schools</TableHead>
                    <TableHead className="text-right"><GraduationCap className="h-4 w-4 inline mr-1" />Coaching</TableHead>
                    <TableHead className="text-right"><Store className="h-4 w-4 inline mr-1" />Shops</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.summary.map((exec) => (
                    <TableRow key={exec.executiveId}>
                      <TableCell className="font-medium">{exec.executiveName}</TableCell>
                      <TableCell className="text-right font-semibold">{exec.totalAssignments}</TableCell>
                      <TableCell className="text-right">{exec.schools}</TableCell>
                      <TableCell className="text-right">{exec.coaching}</TableCell>
                      <TableCell className="text-right">{exec.shopkeepers}</TableCell>
                      <TableCell className="text-right text-green-600">{exec.completed}</TableCell>
                      <TableCell className="text-right text-orange-600">{exec.pending}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${exec.totalAssignments > 0 ? (exec.completed / exec.totalAssignments) * 100 : 0}%`
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {exec.totalAssignments > 0 ? Math.round((exec.completed / exec.totalAssignments) * 100) : 0}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === 'detailed' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Detailed Assignments</CardTitle>
                <CardDescription>
                  Showing {filteredAssignments.length} of {assignments.length} assignments
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => { setViewMode('summary'); fetchSummary(); }}>
                Back to Summary
              </Button>
            </div>
            <div className="relative pt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by location or executive name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Executive</TableHead>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No assignments found for the selected criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.executiveName}</TableCell>
                        <TableCell>{assignment.locationName}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {locationTypeNames[assignment.locationType]}
                          </span>
                        </TableCell>
                        <TableCell>{assignment.area || '-'}</TableCell>
                        <TableCell>{assignment.district || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{assignment.address || '-'}</TableCell>
                        <TableCell>
                          {assignment.isCompleted ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-4 w-4" />
                              Pending
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}