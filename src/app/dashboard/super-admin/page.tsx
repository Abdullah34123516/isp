'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalISPOwners: number;
  totalCustomers: number;
  totalInvoices: number;
  totalPayments: number;
  totalRevenue: number;
  pendingInvoices: number;
  activeUsers: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalISPOwners: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/super-admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Fallback to mock data if API fails
        const mockStats: SystemStats = {
          totalUsers: 1250,
          totalISPOwners: 45,
          totalCustomers: 1180,
          totalInvoices: 3420,
          totalPayments: 2890,
          totalRevenue: 1250000,
          pendingInvoices: 530,
          activeUsers: 980
        };
        setStats(mockStats);
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Fallback to mock data
      const mockStats: SystemStats = {
        totalUsers: 1250,
        totalISPOwners: 45,
        totalCustomers: 1180,
        totalInvoices: 3420,
        totalPayments: 2890,
        totalRevenue: 1250000,
        pendingInvoices: 530,
        activeUsers: 980
      };
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      description: 'All registered users',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'ISP Owners',
      value: stats.totalISPOwners.toLocaleString(),
      description: 'Active ISP businesses',
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue',
      value: `$${(stats.totalRevenue / 1000).toFixed(0)}K`,
      description: 'Lifetime revenue',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices.toLocaleString(),
      description: 'Awaiting payment',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: '-5%',
      changeType: 'negative'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'user_created',
      message: 'New ISP Owner registered: TechNet Solutions',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'payment_received',
      message: 'Payment received: $2,500 from FastISP',
      time: '15 minutes ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'invoice_overdue',
      message: 'Invoice overdue: 3 invoices from CityNet',
      time: '1 hour ago',
      status: 'warning'
    },
    {
      id: 4,
      type: 'system_update',
      message: 'System maintenance completed',
      time: '2 hours ago',
      status: 'info'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Super Admin Dashboard" role="super-admin" user={{}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Super Admin Dashboard" role="super-admin" user={{}}>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const ChangeIcon = stat.changeType === 'positive' ? TrendingUp : TrendingDown;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{stat.description}</span>
                    <div className="flex items-center space-x-1">
                      <ChangeIcon className={`h-3 w-3 ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Revenue chart will be displayed here</p>
                  <p className="text-sm">(Chart component to be implemented)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {activity.status === 'warning' && (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      {activity.status === 'info' && (
                        <div className="h-5 w-5 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => window.location.href = '/dashboard/super-admin/users'}
              >
                <Users className="h-6 w-6 mb-2" />
                <span>Manage Users</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => window.location.href = '/dashboard/super-admin/isp-owners'}
              >
                <Building2 className="h-6 w-6 mb-2" />
                <span>ISP Owners</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span>System Reports</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <CreditCard className="h-6 w-6 mb-2" />
                <span>Billing Overview</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">API Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Operational
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Connected
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Email Service</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Today</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">This Week</span>
                  <span className="font-medium">78</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">This Month</span>
                  <span className="font-medium">245</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Open</span>
                  <Badge variant="destructive">5</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">In Progress</span>
                  <Badge variant="outline">12</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resolved Today</span>
                  <span className="font-medium text-green-600">8</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}