'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Wifi,
  Calendar,
  Router as RouterIcon,
  User as UserIcon
} from 'lucide-react';

interface ISPOwnerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalPlans: number;
  totalInvoices: number;
  totalPayments: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

interface RecentInvoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
}

interface RecentPayment {
  id: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  method: string;
}

export default function ISPOwnerDashboard() {
  const [stats, setStats] = useState<ISPOwnerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalPlans: 0,
    totalInvoices: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Fetch stats
      const statsResponse = await fetch('/api/isp-owner/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch recent invoices
      const invoicesResponse = await fetch('/api/isp-owner/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch recent payments
      const paymentsResponse = await fetch('/api/isp-owner/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok && invoicesResponse.ok && paymentsResponse.ok) {
        const statsData = await statsResponse.json();
        const invoicesData = await invoicesResponse.json();
        const paymentsData = await paymentsResponse.json();
        
        setStats(statsData);
        setRecentInvoices(invoicesData);
        setRecentPayments(paymentsData);
      } else {
        // Fallback to mock data if API fails
        const mockStats: ISPOwnerStats = {
          totalCustomers: 156,
          activeCustomers: 142,
          totalPlans: 8,
          totalInvoices: 486,
          totalPayments: 412,
          totalRevenue: 156000,
          pendingInvoices: 74,
          overdueInvoices: 23
        };

        const mockInvoices: RecentInvoice[] = [
          {
            id: '1',
            invoiceNo: 'INV-001234',
            customerName: 'John Smith',
            amount: 89.99,
            dueDate: '2024-01-15',
            status: 'pending'
          },
          {
            id: '2',
            invoiceNo: 'INV-001235',
            customerName: 'Sarah Johnson',
            amount: 99.99,
            dueDate: '2024-01-14',
            status: 'overdue'
          }
        ];

        const mockPayments: RecentPayment[] = [
          {
            id: '1',
            customerName: 'Emily Davis',
            amount: 89.99,
            paymentDate: '2024-01-12',
            method: 'Credit Card'
          },
          {
            id: '2',
            customerName: 'Mike Wilson',
            amount: 79.99,
            paymentDate: '2024-01-11',
            method: 'Bank Transfer'
          }
        ];

        setStats(mockStats);
        setRecentInvoices(mockInvoices);
        setRecentPayments(mockPayments);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data
      const mockStats: ISPOwnerStats = {
        totalCustomers: 156,
        activeCustomers: 142,
        totalPlans: 8,
        totalInvoices: 486,
        totalPayments: 412,
        totalRevenue: 156000,
        pendingInvoices: 74,
        overdueInvoices: 23
      };

      const mockInvoices: RecentInvoice[] = [
        {
          id: '1',
          invoiceNo: 'INV-001234',
          customerName: 'John Smith',
          amount: 89.99,
          dueDate: '2024-01-15',
          status: 'pending'
        }
      ];

      const mockPayments: RecentPayment[] = [
        {
          id: '1',
          customerName: 'Emily Davis',
          amount: 89.99,
          paymentDate: '2024-01-12',
          method: 'Credit Card'
        }
      ];

      setStats(mockStats);
      setRecentInvoices(mockInvoices);
      setRecentPayments(mockPayments);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      description: `${stats.activeCustomers} active`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats.totalRevenue / 1000).toFixed(1)}K`,
      description: 'This month',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices.toLocaleString(),
      description: `${stats.overdueInvoices} overdue`,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '-12%',
      changeType: 'positive'
    },
    {
      title: 'Active Plans',
      value: stats.totalPlans.toLocaleString(),
      description: 'Service plans',
      icon: Wifi,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '0%',
      changeType: 'neutral'
    }
  ];

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="ISP Owner Dashboard" role="isp-owner" user={{}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="ISP Owner Dashboard" role="isp-owner" user={{}}>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const ChangeIcon = stat.changeType === 'positive' ? TrendingUp : 
                             stat.changeType === 'negative' ? TrendingDown : null;
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
                    {ChangeIcon && (
                      <div className="flex items-center space-x-1">
                        <ChangeIcon className={`h-3 w-3 ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                          {stat.change}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Invoices and Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>Latest invoice activity</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{invoice.invoiceNo}</div>
                        <div className="text-sm text-gray-500">{invoice.customerName}</div>
                        <div className="text-xs text-gray-400">Due {new Date(invoice.dueDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${invoice.amount}</div>
                      {getInvoiceStatusBadge(invoice.status)}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Invoices
              </Button>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment activity</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{payment.customerName}</div>
                        <div className="text-sm text-gray-500">{payment.method}</div>
                        <div className="text-xs text-gray-400">{new Date(payment.paymentDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">${payment.amount}</div>
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Payments
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Overview */}
        <Card>
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for ISP Owners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => window.location.href = '/dashboard/isp-owner/users'}
              >
                <UserIcon className="h-6 w-6 mb-2" />
                <span>Add Customer</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => window.location.href = '/dashboard/isp-owner/routers'}
              >
                <RouterIcon className="h-6 w-6 mb-2" />
                <span>Manage Routers</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => window.location.href = '/dashboard/isp-owner/pppoe-users'}
              >
                <Wifi className="h-6 w-6 mb-2" />
                <span>PPPoE Users</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span>Create Invoice</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Customers with highest revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'John Smith', revenue: 1200, invoices: 15 },
                { name: 'Sarah Johnson', revenue: 980, invoices: 12 },
                { name: 'Mike Wilson', revenue: 850, invoices: 10 }
              ].map((customer, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{customer.name}</div>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Revenue: ${customer.revenue}</div>
                    <div>Invoices: {customer.invoices}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}