'use client';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Toaster } from "@/components/ui/toaster";
import { LanguageToggle } from '@/components/LanguageToggle';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Map, Truck, ClipboardCheck, BarChart2, Users, Menu, X, Home, BookCopy, IndianRupee, ShoppingCart, Route, LogOut,ListChecks ,UploadCloud, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function DashboardLayout({ children }: { children: ReactNode; }) {
  const { user, loading, logout } = useAuthContext();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('auth.loadingSession')}</p>
      </div>
    );
  }
  const adminNavItems = [
    { title: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { title: t('nav.liveTracking'), href: '/dashboard/live-tracking', icon: Map },
    { title: 'Stock Overview', href: '/dashboard/stock-overview', icon: Package },
    { title: t('nav.dispatchTransport'), href: '/dashboard/dispatch', icon: Truck },
    { title: t('nav.bookManagement'), href: '/dashboard/books', icon: BookCopy },
    // { title: 'Master Data', href: '/dashboard/master-data', icon: Database },
    { title: t('nav.approvals'), href: '/dashboard/approvals', icon: ClipboardCheck },
    { title: t('nav.orders'), href: '/dashboard/orders', icon: ShoppingCart },
    { title: t('nav.reports'), href: '/dashboard/reports', icon: BarChart2 },
    { title: t('nav.teamManagement'), href: '/dashboard/team', icon: Users },
    //  { title: t('Beat Assignment'), href: '/dashboard/beat-assignment', icon: ListChecks },
      { title: 'View Assignments', href: '/dashboard/view-assignments', icon: ListChecks },

        { title:t( 'Bulk Beat Assign'), href: '/dashboard/bulk-assign', icon: UploadCloud },


  ];
  const asmNavItems = [
    { title: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { title: t('nav.liveTracking'), href: '/dashboard/live-tracking', icon: Map },
    { title: 'Stock Overview', href: '/dashboard/stock-overview', icon: Package },
    { title: t('nav.reports'), href: '/dashboard/reports', icon: BarChart2 },
    { title: t('nav.myTeam'), href: '/dashboard/team', icon: Users },
  ];
  const executiveNavItems = [
    { title: t('nav.myDay'), href: '/dashboard', icon: Home },
    { title: t('nav.routePlan'), href: '/dashboard/route-plan', icon: Route },
    { title: t('nav.myStock'), href: '/dashboard/stock', icon: BookCopy },
    { title: t('nav.myExpenses'), href: '/dashboard/expenses', icon: IndianRupee },
    { title: t('nav.myOrders'), href: '/dashboard/my-orders', icon: ShoppingCart },
    { title: 'My Visits', href: '/dashboard/my-visits', icon: ClipboardCheck },
  ];
  const getNavItems = () => {
    switch (user.roleName) {
      case 'Admin': return adminNavItems;
      case 'ASM': return asmNavItems;
      case 'Executive': return executiveNavItems;
      default: return [];
    }
  };
  const navItems = getNavItems();
  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className={`px-4 pt-4 mb-8 ${isCollapsed ? 'text-center' : ''}`}>
        <h1 className={`text-2xl font-bold text-blue-600 transition-all duration-300 ${isCollapsed ? 'text-3xl' : ''}`}>
          <span className={isCollapsed ? 'hidden' : 'inline'}>GPH Portal</span>
          <span className={!isCollapsed ? 'hidden' : 'inline font-extrabold'}>G</span>
        </h1>
      </div>
      
      {/* FIXED: 'flex-grow' class has been removed from here */}
      <nav className="flex flex-col space-y-2 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.title : ''}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === item.href ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            } ${isCollapsed ? 'justify-center' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
            <span className={isCollapsed ? 'hidden' : 'inline'}>{item.title}</span>
          </Link>
        ))}
      </nav>
      {/* This div now sits right below the nav */}
      <div className={`my-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <Button 
          variant="outline" 
          className={`w-full text-red-600 hover:bg-red-50 hover:text-red-700 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          onClick={logout}
          title={isCollapsed ? t('common.logout') : ''}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
          <span className={isCollapsed ? 'hidden' : 'inline'}>{t('common.logout')}</span>
        </Button>
      </div>
      {/* FIXED: 'mt-auto' pushes this entire block to the bottom */}
      <div className={`mt-auto p-2 border-t ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={isCollapsed ? 'hidden' : 'block'}>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-gray-500">{user.roleName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title={t('common.logout')}>
            <LogOut className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {user.roleName !== 'Executive' && (
        <aside className={`hidden lg:flex flex-col bg-white border-r transition-all duration-300 ease-in-out ${isDesktopSidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <SidebarContent isCollapsed={isDesktopSidebarCollapsed} />
        </aside>
      )}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
          <aside className="relative w-64 bg-white flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden sticky top-0 bg-white border-b p-4 flex items-center justify-between z-30">
          <h1 className="text-xl font-bold text-blue-600">GPH Portal</h1>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </header>
        {user.roleName !== 'Executive' && (
          <header className="hidden lg:flex sticky top-0 bg-white border-b px-4 py-2 justify-between items-center z-30">
            <Button variant="ghost" size="icon" onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}>
              <Menu className="h-6 w-6" />
            </Button>
            <LanguageToggle />
          </header>
        )}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
        {user.roleName === 'Executive' && (
          <nav className="lg:hidden sticky bottom-0 bg-white border-t p-2 flex justify-around">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center w-full py-1 rounded-md ${
                  pathname === item.href ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.title}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
      <Toaster />
    </div>
  );
}