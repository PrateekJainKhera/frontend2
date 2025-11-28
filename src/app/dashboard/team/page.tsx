// src/app/dashboard/team/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Search, Pencil, Route,Eye,ChevronLeft, ChevronRight,Users, UserCheck, UserCog, UserX  } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { AddEditUserModal } from './AddEditUserModal';
import { ViewUserModal } from './ViewUserModal';
import { useRouter } from 'next/navigation';
// --- YEH HAI FIX: Interface ko poora update karein --- 
export interface TeamMember {
  id: number;
  name: string;
  username: string;
  roleId: number;
  roleName: string;
  address: string | null;
  assignedArea: string | null;
  mobileNumber: string;
  status: number;
  taRatePerKm: number;
  daAmount: number;
  managerId: number | null;
    managerName: string | null;
  // Nayi fields jo modal me hain, yahan bhi honi chahiye
  dateOfBirth: string | null;
  alternatePhone: string | null;
  aadharNumber: string | null;
  panNumber: string | null;
  accountHolderName: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankBranch: string | null;
  ifscCode: string | null;
    password: string; 
}
export default function TeamManagementPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deactivated'>('active');
  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/executives');
      setTeamMembers(response.data);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);
  const handleStatusToggle = async (userId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 2 : 1;
    try {
     // await api.patch(`/executives/${userId}/status`, newStatus, {
         await api.post(`/executives/${userId}/status`, newStatus, {

        headers: { 'Content-Type': 'application/json' }
      });
      fetchTeamMembers();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (member: TeamMember) => {
    setEditingUser(member);
    setIsModalOpen(true);
  };
   const handleOpenViewModal = (member: TeamMember) => {
    setViewingUser(member);
    setIsViewModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };
  const handleSuccess = () => {
    fetchTeamMembers();
    handleModalClose();
  };
  const getRoleBadgeColor = (role: string) => {
    if (role === 'Admin') return 'bg-red-100 text-red-800';
    return role === 'ASM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };
  const getStatusBadgeColor = (status: number) => {
    if (status === 1) return 'bg-green-100 text-green-800';
    if (status === 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };
  const getStatusText = (status: number) => {
    if (status === 1) return 'Active';
    if (status === 0) return 'Pending';
    return 'Deactivated';
  };
  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.assignedArea && member.assignedArea.toLowerCase().includes(searchTerm.toLowerCase())) ||
    member.mobileNumber.includes(searchTerm)
  );
 const teamCounts = useMemo(() => {
    return {
      total: teamMembers.length,
      asm: teamMembers.filter(m => m.roleName === 'ASM').length,
      executive: teamMembers.filter(m => m.roleName === 'Executive').length,
        deactivated: teamMembers.filter(m => m.status === 2).length,
    };
  }, [teamMembers]);
  const activeAndPendingMembers = useMemo(() => 
    filteredMembers.filter(m => m.status === 1 || m.status === 0), 
    [filteredMembers]
  );
  const deactivatedMembers = useMemo(() => 
    filteredMembers.filter(m => m.status === 2), 
    [filteredMembers]
  );
  if (isLoading) return <div>Loading team members...</div>;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
        <Button onClick={handleOpenAddModal} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Member
        </Button>
      </div>
<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Summary Cards */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:col-span-3">
          <SummaryCard title="Total Members" count={teamCounts.total} icon={Users} color="text-blue-600" />
          <SummaryCard title="ASMs" count={teamCounts.asm} icon={UserCog} color="text-purple-600" />
          <SummaryCard title="Executives" count={teamCounts.executive} icon={UserCheck} color="text-green-600" />
     <SummaryCard title="Deactivated" count={teamCounts.deactivated} icon={UserX} color="text-red-600" />
        </div>
        
        {/* Search Bar */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, area, or contact number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>
      {/* <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, area, or contact number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card> */}
       <Card>
        <CardHeader className="p-0">
          {/* --- NAYA CHANGE: Tabs UI add karein --- */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === 'active'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Active & Pending ({activeAndPendingMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('deactivated')}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === 'deactivated'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Deactivated ({deactivatedMembers.length})
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Role</th>
                  <th className="text-left p-3 font-semibold">Assigned Area</th>
                  <th className="text-left p-3 font-semibold">Contact Number</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* --- NAYA CHANGE: Sahi list ko render karein --- */}
                {(activeTab === 'active' ? activeAndPendingMembers : deactivatedMembers).map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">@{member.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getRoleBadgeColor(member.roleName)}>
                        {member.roleName}
                      </Badge>
                    </td>
                    <td className="p-3">{member.assignedArea || 'N/A'}</td>
                    <td className="p-3">{member.mobileNumber}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={member.status === 1}
                          onCheckedChange={() => handleStatusToggle(member.id, member.status)}
                          aria-label={member.status === 1 ? 'Deactivate user' : 'Activate user'}
                        />
                        <Badge className={getStatusBadgeColor(member.status)}>
                          {getStatusText(member.status)}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1">
                         <Button onClick={() => handleOpenViewModal(member)} variant="ghost" size="icon" className="h-8 w-8" title="View Details">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button onClick={() => handleOpenEditModal(member)} variant="ghost" size="icon" className="h-8 w-8" title="Edit User">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => router.push(`/dashboard/team/${member.id}/route-replay`)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View Route Replay"
                        >
                          <Route className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <AddEditUserModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        editingUser={editingUser}
        currentUserRole={user?.roleName || ''} />
         <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user={viewingUser}
      />
    </div>
  );
}
function SummaryCard({ title, count, icon: Icon, color }: { title: string; count: number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold">{count}</p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </CardContent>
    </Card>
  );
  }
