'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  User, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle,
  Edit,
  Trash2,
  Activity,
  Users,
  Router as RouterIcon,
  Calendar,
  Zap
} from 'lucide-react';

interface PPPoEUser {
  id: string;
  username: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISABLED' | 'EXPIRED';
  ipAddress?: string;
  macAddress?: string;
  uptime?: string;
  downloadSpeed?: string;
  uploadSpeed?: string;
  dataLimit?: string;
  dataUsed?: string;
  expiresAt?: string;
  lastConnected?: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  router: {
    id: string;
    name: string;
    ipAddress: string;
  };
  plan: {
    id: string;
    name: string;
    speed: string;
    dataLimit?: string;
  };
  createdAt: string;
}

interface Router {
  id: string;
  name: string;
  ipAddress: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  speed: string;
  dataLimit?: string;
}

interface PPPoEUserFormData {
  username: string;
  password: string;
  customerId: string;
  routerId: string;
  planId: string;
  downloadSpeed?: string;
  uploadSpeed?: string;
  dataLimit?: string;
  expiresAt?: string;
}

export default function PPPoEUserManagement() {
  const [pppoeUsers, setPPPoEUsers] = useState<PPPoEUser[]>([]);
  const [routers, setRouters] = useState<Router[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PPPoEUser | null>(null);
  const [formData, setFormData] = useState<PPPoEUserFormData>({
    username: '',
    password: '',
    customerId: '',
    routerId: '',
    planId: '',
    downloadSpeed: '',
    uploadSpeed: '',
    dataLimit: '',
    expiresAt: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Fetch PPPoE users
      const usersResponse = await fetch('/api/pppoe-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch routers
      const routersResponse = await fetch('/api/routers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch customers
      const customersResponse = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch plans
      const plansResponse = await fetch('/api/plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setPPPoEUsers(usersData);
      }

      if (routersResponse.ok) {
        const routersData = await routersResponse.json();
        setRouters(routersData);
      }

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setCustomers(customersData.customers || []);
      }

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.plans || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to continue');
        return;
      }

      const response = await fetch('/api/pppoe-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        await fetchData();
        setIsDialogOpen(false);
        resetForm();
        alert('PPPoE user created successfully!');
      } else {
        alert(`Error: ${data.error || 'Failed to create PPPoE user'}`);
        console.error('PPPoE user creation error:', data);
      }
    } catch (error) {
      console.error('Error saving PPPoE user:', error);
      alert('Network error. Please try again.');
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/pppoe-users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this PPPoE user?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/pppoe-users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting PPPoE user:', error);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      customerId: '',
      routerId: '',
      planId: '',
      downloadSpeed: '',
      uploadSpeed: '',
      dataLimit: '',
      expiresAt: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'DISABLED':
        return <Badge className="bg-red-100 text-red-800">Disabled</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'INACTIVE':
        return <WifiOff className="h-4 w-4 text-gray-600" />;
      case 'DISABLED':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'EXPIRED':
        return <Calendar className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="PPPoE User Management" role="isp-owner" user={{}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="PPPoE User Management" role="isp-owner" user={{}}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">PPPoE User Management</h1>
            <p className="text-gray-600">Manage PPPoE users and their internet connections</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add PPPoE User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New PPPoE User</DialogTitle>
                <DialogDescription>
                  Create a new PPPoE user for internet access
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerId">Customer</Label>
                  <Select value={formData.customerId} onValueChange={(value) => setFormData({...formData, customerId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(customers) && customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="routerId">Router</Label>
                  <Select value={formData.routerId} onValueChange={(value) => setFormData({...formData, routerId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select router" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(routers) && routers.map((router) => (
                        <SelectItem key={router.id} value={router.id}>
                          {router.name} ({router.ipAddress})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="planId">Internet Plan</Label>
                  <Select value={formData.planId} onValueChange={(value) => setFormData({...formData, planId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(plans) && plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {plan.speed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Add User
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pppoeUsers.length}</div>
              <p className="text-xs text-gray-500">
                {pppoeUsers.filter(u => u.status === 'ACTIVE').length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Wifi className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pppoeUsers.filter(u => u.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-gray-500">Currently online</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <WifiOff className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pppoeUsers.filter(u => u.status === 'INACTIVE').length}
              </div>
              <p className="text-xs text-gray-500">Offline users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Users</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pppoeUsers.filter(u => u.status === 'EXPIRED').length}
              </div>
              <p className="text-xs text-gray-500">Need renewal</p>
            </CardContent>
          </Card>
        </div>

        {/* PPPoE Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>PPPoE Users</CardTitle>
            <CardDescription>Manage your PPPoE users and their connections</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Router</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pppoeUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.customer.name}</TableCell>
                    <TableCell>{user.router.name}</TableCell>
                    <TableCell>{user.plan.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(user.status)}
                        {getStatusBadge(user.status)}
                      </div>
                    </TableCell>
                    <TableCell>{user.ipAddress || 'N/A'}</TableCell>
                    <TableCell>
                      {user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatus(user.id, 'INACTIVE')}
                          >
                            <WifiOff className="h-4 w-4" />
                          </Button>
                        )}
                        {user.status === 'INACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatus(user.id, 'ACTIVE')}
                          >
                            <Wifi className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pppoeUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No PPPoE users configured yet</p>
                <p className="text-sm">Add your first PPPoE user to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}