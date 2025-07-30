'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  FileText, 
  CreditCard, 
  Download, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface CustomerPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  speed: string;
  dataLimit: string;
  validity: number;
  status: 'active' | 'expired' | 'cancelled';
  nextBillingDate: string;
}

interface CustomerInvoice {
  id: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
}

interface CustomerPayment {
  id: string;
  invoiceNo: string;
  amount: number;
  paymentDate: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function CustomerDashboard() {
  const [currentPlan, setCurrentPlan] = useState<CustomerPlan | null>(null);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Fetch stats
      const statsResponse = await fetch('/api/customer/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch invoices
      const invoicesResponse = await fetch('/api/customer/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch payments
      const paymentsResponse = await fetch('/api/customer/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok && invoicesResponse.ok && paymentsResponse.ok) {
        const statsData = await statsResponse.json();
        const invoicesData = await invoicesResponse.json();
        const paymentsData = await paymentsResponse.json();
        
        // Set current plan if available
        if (statsData.currentPlan) {
          const plan = statsData.currentPlan;
          setCurrentPlan({
            ...plan,
            nextBillingDate: new Date(Date.now() + plan.validity * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }
        
        setInvoices(invoicesData);
        setPayments(paymentsData);
      } else {
        // Fallback to mock data if API fails
        const mockPlan: CustomerPlan = {
          id: '1',
          name: 'Premium Fiber',
          description: 'High-speed fiber internet with unlimited data',
          price: 89.99,
          speed: '1 Gbps',
          dataLimit: 'Unlimited',
          validity: 30,
          status: 'active',
          nextBillingDate: '2024-02-15'
        };

        const mockInvoices: CustomerInvoice[] = [
          {
            id: '1',
            invoiceNo: 'INV-001234',
            amount: 89.99,
            dueDate: '2024-01-15',
            status: 'pending',
            createdAt: '2024-01-01'
          },
          {
            id: '2',
            invoiceNo: 'INV-001233',
            amount: 89.99,
            dueDate: '2023-12-15',
            status: 'paid',
            createdAt: '2023-12-01'
          }
        ];

        const mockPayments: CustomerPayment[] = [
          {
            id: '1',
            invoiceNo: 'INV-001233',
            amount: 89.99,
            paymentDate: '2023-12-10',
            method: 'Credit Card',
            status: 'completed'
          }
        ];

        setCurrentPlan(mockPlan);
        setInvoices(mockInvoices);
        setPayments(mockPayments);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      // Fallback to mock data
      const mockPlan: CustomerPlan = {
        id: '1',
        name: 'Premium Fiber',
        description: 'High-speed fiber internet with unlimited data',
        price: 89.99,
        speed: '1 Gbps',
        dataLimit: 'Unlimited',
        validity: 30,
        status: 'active',
        nextBillingDate: '2024-02-15'
      };

      const mockInvoices: CustomerInvoice[] = [
        {
          id: '1',
          invoiceNo: 'INV-001234',
          amount: 89.99,
          dueDate: '2024-01-15',
          status: 'pending',
          createdAt: '2024-01-01'
        }
      ];

      const mockPayments: CustomerPayment[] = [
        {
          id: '1',
          invoiceNo: 'INV-001233',
          amount: 89.99,
          paymentDate: '2023-12-10',
          method: 'Credit Card',
          status: 'completed'
        }
      ];

      setCurrentPlan(mockPlan);
      setInvoices(mockInvoices);
      setPayments(mockPayments);
    } finally {
      setLoading(false);
    }
  };

  const getPlanStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const downloadInvoice = (invoiceId: string) => {
    // In a real app, this would download the PDF
    console.log('Downloading invoice:', invoiceId);
    alert('Invoice download would start here in a real application');
  };

  const makePayment = (invoiceId: string) => {
    // In a real app, this would redirect to payment gateway
    console.log('Making payment for invoice:', invoiceId);
    alert('Payment process would start here in a real application');
  };

  if (loading) {
    return (
      <DashboardLayout title="Customer Dashboard" role="customer" user={{}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Customer Dashboard" role="customer" user={{}}>
      <div className="space-y-6">
        {/* Current Plan Overview */}
        {currentPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="h-5 w-5" />
                <span>Current Plan</span>
              </CardTitle>
              <CardDescription>Your active internet service plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Plan Name</div>
                  <div className="font-semibold text-lg">{currentPlan.name}</div>
                  {getPlanStatusBadge(currentPlan.status)}
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Speed</div>
                  <div className="font-semibold text-lg">{currentPlan.speed}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Data Limit</div>
                  <div className="font-semibold text-lg">{currentPlan.dataLimit}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Monthly Cost</div>
                  <div className="font-semibold text-lg">${currentPlan.price}</div>
                  <div className="text-sm text-gray-500">
                    Next billing: {new Date(currentPlan.nextBillingDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{currentPlan.description}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$269.97</div>
              <p className="text-xs text-muted-foreground">Last 3 months</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Requires payment</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Success</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">On-time payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Invoices</span>
            </CardTitle>
            <CardDescription>Your billing history and upcoming payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">{invoice.invoiceNo}</div>
                      <div className="text-sm text-gray-500">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Created: {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">${invoice.amount}</div>
                      {getInvoiceStatusBadge(invoice.status)}
                    </div>
                    <div className="flex space-x-2">
                      {invoice.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => makePayment(invoice.id)}
                        >
                          Pay Now
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadInvoice(invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment History</span>
            </CardTitle>
            <CardDescription>Your recent payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{payment.invoiceNo}</div>
                      <div className="text-sm text-gray-500">{payment.method}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-green-600">${payment.amount}</div>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common customer tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <CreditCard className="h-6 w-6 mb-2" />
                <span>Make Payment</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Download className="h-6 w-6 mb-2" />
                <span>Download Invoices</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Wifi className="h-6 w-6 mb-2" />
                <span>Upgrade Plan</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                <span>View Schedule</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}