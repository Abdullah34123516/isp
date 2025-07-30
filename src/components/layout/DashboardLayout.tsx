'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Router as RouterIcon,
  Wifi
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  role: 'super-admin' | 'sub-admin' | 'isp-owner' | 'customer';
  user: any;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export function DashboardLayout({ children, title, role, user }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUserProfile(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        title: 'Dashboard',
        href: `/dashboard/${role}`,
        icon: LayoutDashboard
      }
    ];

    switch (role) {
      case 'super-admin':
        return [
          ...baseItems,
          {
            title: 'Users',
            href: `/dashboard/${role}/users`,
            icon: Users
          },
          {
            title: 'ISP Owners',
            href: `/dashboard/${role}/isp-owners`,
            icon: Building2
          },
          {
            title: 'System Stats',
            href: `/dashboard/${role}/stats`,
            icon: FileText
          }
        ];
      case 'sub-admin':
        return [
          ...baseItems,
          {
            title: 'ISP Owners',
            href: `/dashboard/${role}/isp-owners`,
            icon: Building2
          },
          {
            title: 'Users',
            href: `/dashboard/${role}/users`,
            icon: Users
          }
        ];
      case 'isp-owner':
        return [
          ...baseItems,
          {
            title: 'Routers',
            href: `/dashboard/${role}/routers`,
            icon: RouterIcon
          },
          {
            title: 'PPPoE Users',
            href: `/dashboard/${role}/pppoe-users`,
            icon: Wifi
          },
          {
            title: 'Plans',
            href: `/dashboard/${role}/plans`,
            icon: FileText
          },
          {
            title: 'Invoices',
            href: `/dashboard/${role}/invoices`,
            icon: FileText,
            badge: '5'
          },
          {
            title: 'Payments',
            href: `/dashboard/${role}/payments`,
            icon: CreditCard
          }
        ];
      case 'customer':
        return [
          ...baseItems,
          {
            title: 'My Plan',
            href: `/dashboard/${role}/plan`,
            icon: FileText
          },
          {
            title: 'Invoices',
            href: `/dashboard/${role}/invoices`,
            icon: FileText
          },
          {
            title: 'Payments',
            href: `/dashboard/${role}/payments`,
            icon: CreditCard
          }
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'SUB_ADMIN': return 'Sub Admin';
      case 'ISP_OWNER': return 'ISP Owner';
      case 'CUSTOMER': return 'Customer';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-500';
      case 'SUB_ADMIN': return 'bg-blue-500';
      case 'ISP_OWNER': return 'bg-green-500';
      case 'CUSTOMER': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r">
        <div className="flex items-center justify-center p-6 border-b">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-2">
              <img
                src="/logo.svg"
                alt="ISP Billing"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-lg font-semibold">ISP Billing</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push(item.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500">Welcome back, {userProfile.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userProfile.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{userProfile.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {getRoleDisplayName(userProfile.role)}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}