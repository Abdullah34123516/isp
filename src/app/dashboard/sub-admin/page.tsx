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
  CheckCircle,
  Plus,
  Eye,
  Edit
} from 'lucide-react';

interface SubAdminStats {
  managedISPOwners: number;
  totalCustomers: number;
  totalInvoices: number;
  totalPayments: number;
  totalRevenue: number;
  pendingInvoices: number;
  activeISPOwners: number;
}

interface ISPOwner {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  customers: number;
  revenue: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export default function SubAdminDashboard() {
  const [stats, setStats] = useState<SubAdminStats>({
    managedISPOwners: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    activeISPOwners: 0
  });
  const [ispOwners, setIspOwners] = useState<ISPOwner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Fetch stats
      const statsResponse = await fetch('/api/sub-admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch ISP owners
      const ispOwnersResponse = await fetch('/api/sub-admin/isp-owners', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok && ispOwnersResponse.ok) {
        const statsData = await statsResponse.json();
        const ispOwnersData = await ispOwnersResponse.json();
        
        setStats(statsData);
        setIspOwners(ispOwnersData);
      } else {
        // Fallback to mock data if API fails
        const mockStats: SubAdminStats = {
          managedISPOwners: 25,
          totalCustomers: 680,
          totalInvoices: 1920,
          totalPayments: 1650,
          totalRevenue: 680000,
          pendingInvoices: 270,
          activeISPOwners: 22
        };

        const mockISPOwners: ISPOwner[] = [
          {
            id: '1',
            companyName: 'TechNet Solutions',
            email: 'contact@technet.com',
            phone: '+1-555-0123',
            customers: 45,
            revenue: 45000,
            status: 'active',
            createdAt: '2024-01-15'
          },
          {
            id: '2',
            companyName: 'FastISP',
            email: 'info@fastisp.com',
            phone: '+1-555-0124',
            customers: 38,
            revenue: 38000,
            status: 'active',
            createdAt: '2024-02-20'
          }
        ];

        setStats(mockStats);
        setIspOwners(mockISPOwners);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data
      const mockStats: SubAdminStats = {
        managedISPOwners: 25,
        totalCustomers: 680,
        totalInvoices: 1920,
        totalPayments: 1650,
        totalRevenue: 680000,
        pendingInvoices: 270,
        activeISPOwners: 22
      };

      const mockISPOwners: ISPOwner[] = [
        {
          id: '1',
          companyName: 'TechNet Solutions',
          email: 'contact@technet.com',
          phone: '+1-555-0123',
          customers: 45,
          revenue: 45000,
          status: 'active',
          createdAt: '2024-01-15'
        }
      ];

      setStats(mockStats);
      setIspOwners(mockISPOwners);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Managed ISP Owners',
      value: stats.managedISPOwners.toLocaleString(),
      description: 'Under your supervision',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      description: 'Across all ISP Owners',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+22%',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue',
      value: `$${(stats.totalRevenue / 1000).toFixed(0)}K`,
      description: 'From managed ISPs',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+18%',
      changeType: 'positive'
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices.toLocaleString(),
      description: 'Requiring attention',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '-8%',
      changeType: 'positive'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Sub Admin Dashboard" role="sub-admin" user={{}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Sub Admin Dashboard" role="sub-admin" user={{}}>
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

        {/* ISP Owners Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Managed ISP Owners</CardTitle>
                <CardDescription>ISP businesses under your supervision</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add ISP Owner
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Customers</th>
                    <th className="text-left p-2">Revenue</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ispOwners.map((owner) => (
                    <tr key={owner.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{owner.companyName}</div>
                          <div className="text-sm text-gray-500">
                            Since {new Date(owner.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <div className="text-sm">{owner.email}</div>
                          <div className="text-sm text-gray-500">{owner.phone}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{owner.customers}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">${owner.revenue.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        {getStatusBadge(owner.status)}
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
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

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue from managed ISPs</CardDescription>
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

          {/* ISP Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing ISPs</CardTitle>
              <CardDescription>Based on revenue and customer growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ispOwners.slice(0, 5).map((owner, index) => (
                  <div key={owner.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{owner.companyName}</div>
                        <div className="text-sm text-gray-500">{owner.customers} customers</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${owner.revenue.toLocaleString()}</div>
                      <div className="text-sm text-green-600">+12%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for Sub Admin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Plus className="h-6 w-6 mb-2" />
                <span>Add ISP Owner</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => window.location.href = '/dashboard/sub-admin/users'}
              >
                <Users className="h-6 w-6 mb-2" />
                <span>View All Users</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span>Generate Reports</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <CreditCard className="h-6 w-6 mb-2" />
                <span>Billing Overview</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}