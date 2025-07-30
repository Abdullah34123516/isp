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
import { 
  Plus, 
  Settings, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle,
  Edit,
  Trash2,
  Activity,
  Users,
  Router as RouterIcon
} from 'lucide-react';

interface Router {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  username: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  location?: string;
  model?: string;
  firmware?: string;
  lastConnected?: string;
  pppoeUsers: PPPoEUser[];
  createdAt: string;
}

interface PPPoEUser {
  id: string;
  username: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISABLED' | 'EXPIRED';
  customer: {
    name: string;
    email: string;
  };
  plan: {
    name: string;
    speed: string;
  };
}

interface RouterFormData {
  name: string;
  ipAddress: string;
  port: number;
  username: string;
  password: string;
  location?: string;
  model?: string;
  firmware?: string;
}

export default function RouterManagement() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState<Router | null>(null);
  const [formData, setFormData] = useState<RouterFormData>({
    name: '',
    ipAddress: '',
    port: 8728,
    username: '',
    password: '',
    location: '',
    model: '',
    firmware: ''
  });
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/routers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRouters(data);
      } else {
        const errorData = await response.json();
        console.error('Error fetching routers:', errorData.error);
        // Only show alert for non-401 errors (401 might be normal during logout)
        if (response.status !== 401) {
          alert(`Error loading routers: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error fetching routers:', error);
      alert('Network error while loading routers. Please refresh the page.');
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

      const url = editingRouter ? `/api/routers/${editingRouter.id}` : '/api/routers';
      const method = editingRouter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        await fetchRouters();
        setIsDialogOpen(false);
        resetForm();
        alert(editingRouter ? 'Router updated successfully!' : 'Router added successfully!');
      } else {
        alert(`Error: ${data.error || 'Failed to save router'}`);
      }
    } catch (error) {
      console.error('Error saving router:', error);
      alert('Network error. Please try again.');
    }
  };

  const testConnection = async (routerId: string, routerData: Router) => {
    setTestingConnection(routerId);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to continue');
        setTestingConnection(null);
        return;
      }

      const response = await fetch('/api/routers/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          routerId,
          ipAddress: routerData.ipAddress,
          port: routerData.port,
          username: routerData.username,
          password: routerData.password
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is empty
      const text = await response.text();
      console.log('Response text:', text);

      if (!text) {
        throw new Error('Empty response from server');
      }

      // Parse JSON only if there's content
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (response.ok) {
        if (result.success) {
          await fetchRouters(); // Refresh to update status
          alert('Connection successful! Router is online.');
        } else {
          alert(`Connection failed: ${result.message}`);
        }
      } else {
        alert(`Error: ${result.error || result.message || 'Connection test failed'}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert(`Network error during connection test: ${error.message || 'Please try again.'}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const deleteRouter = async (routerId: string) => {
    if (!confirm('Are you sure you want to delete this router?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to continue');
        return;
      }

      const response = await fetch(`/api/routers/${routerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        await fetchRouters();
        alert('Router deleted successfully!');
      } else {
        alert(`Error: ${data.error || 'Failed to delete router'}`);
      }
    } catch (error) {
      console.error('Error deleting router:', error);
      alert('Network error. Please try again.');
    }
  };

  const editRouter = (router: Router) => {
    setEditingRouter(router);
    setFormData({
      name: router.name,
      ipAddress: router.ipAddress,
      port: router.port,
      username: router.username,
      password: '', // Don't pre-fill password for security
      location: router.location || '',
      model: router.model || '',
      firmware: router.firmware || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRouter(null);
    setFormData({
      name: '',
      ipAddress: '',
      port: 8728,
      username: '',
      password: '',
      location: '',
      model: '',
      firmware: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'OFFLINE':
        return <Badge variant="secondary">Offline</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'OFFLINE':
        return <WifiOff className="h-4 w-4 text-gray-600" />;
      case 'MAINTENANCE':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Router Management" role="isp-owner" user={{}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Router Management" role="isp-owner" user={{}}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Router Management</h1>
            <p className="text-gray-600">Manage your MicroTik routers and PPPoE configurations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Router
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRouter ? 'Edit Router' : 'Add New Router'}
                </DialogTitle>
                <DialogDescription>
                  Configure your MicroTik router for PPPoE user management
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Router Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ipAddress">IP Address</Label>
                  <Input
                    id="ipAddress"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.port}
                    onChange={(e) => {
                      const value = e.target.value;
                      const portValue = value === '' ? 8728 : parseInt(value) || 8728;
                      setFormData({...formData, port: portValue});
                    }}
                    min="1"
                    max="65535"
                    required
                  />
                </div>
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
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model (Optional)</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="firmware">Firmware (Optional)</Label>
                  <Input
                    id="firmware"
                    value={formData.firmware}
                    onChange={(e) => setFormData({...formData, firmware: e.target.value})}
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingRouter ? 'Update Router' : 'Add Router'}
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
              <CardTitle className="text-sm font-medium">Total Routers</CardTitle>
              <RouterIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{routers.length}</div>
              <p className="text-xs text-gray-500">
                {routers.filter(r => r.status === 'ONLINE').length} online
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PPPoE Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routers.reduce((sum, router) => sum + router.pppoeUsers.length, 0)}
              </div>
              <p className="text-xs text-gray-500">Active connections</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Routers</CardTitle>
              <Wifi className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routers.filter(r => r.status === 'ONLINE').length}
              </div>
              <p className="text-xs text-gray-500">
                {routers.length > 0 ? Math.round((routers.filter(r => r.status === 'ONLINE').length / routers.length) * 100) : 0}% uptime
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline Routers</CardTitle>
              <WifiOff className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {routers.filter(r => r.status === 'OFFLINE').length}
              </div>
              <p className="text-xs text-gray-500">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Routers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Router List</CardTitle>
            <CardDescription>Manage your MicroTik routers and their configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Connected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routers.map((router) => (
                  <TableRow key={router.id}>
                    <TableCell className="font-medium">{router.name}</TableCell>
                    <TableCell>{router.ipAddress}:{router.port}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(router.status)}
                        {getStatusBadge(router.status)}
                      </div>
                    </TableCell>
                    <TableCell>{router.pppoeUsers.length}</TableCell>
                    <TableCell>{router.location || 'N/A'}</TableCell>
                    <TableCell>
                      {router.lastConnected ? new Date(router.lastConnected).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(router.id, router)}
                          disabled={testingConnection === router.id}
                        >
                          {testingConnection === router.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          ) : (
                            <Activity className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editRouter(router)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRouter(router.id)}
                          disabled={router.pppoeUsers.length > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {routers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <RouterIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No routers configured yet</p>
                <p className="text-sm">Add your first router to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}