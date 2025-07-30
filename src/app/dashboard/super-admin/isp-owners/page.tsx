'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Building2, 
  Users, 
  Router as RouterIcon, 
  Wifi, 
  DollarSign,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface ISPOwner {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  customers: number;
  routers: number;
  pppoeUsers: number;
  revenue: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export default function ISPOwnersManagement() {
  const [ispOwners, setIspOwners] = useState<ISPOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchISPOwners();
  }, []);

  const fetchISPOwners = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/super-admin/isp-owners', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIspOwners(data);
      } else {
        console.error('Failed to fetch ISP owners');
      }
    } catch (error) {
      console.error('Error fetching ISP owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateISPOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/super-admin/isp-owners', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchISPOwners();
        setIsCreateDialogOpen(false);
        setFormData({
          email: '',
          password: '',
          name: '',
          companyName: '',
          phone: '',
          address: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create ISP owner');
      }
    } catch (error) {
      console.error('Error creating ISP owner:', error);
      alert('Failed to create ISP owner');
    }
  };

  const filteredISPOwners = ispOwners.filter(owner =>
    owner.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="ISP Owners Management" role="super-admin" user={{}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="ISP Owners Management" role="super-admin" user={{}}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ISP Owners</h1>
            <p className="text-gray-600">Manage all ISP businesses on the platform</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add ISP Owner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New ISP Owner</DialogTitle>
                <DialogDescription>
                  Add a new ISP business to the platform
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateISPOwner} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Admin Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create ISP Owner</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total ISP Owners
              </CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ispOwners.length}</div>
              <p className="text-xs text-gray-500">
                {ispOwners.filter(o => o.status === 'active').length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ispOwners.reduce((sum, owner) => sum + owner.customers, 0)}
              </div>
              <p className="text-xs text-gray-500">
                Across all ISPs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(ispOwners.reduce((sum, owner) => sum + owner.revenue, 0))}
              </div>
              <p className="text-xs text-gray-500">
                Lifetime revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Devices
              </CardTitle>
              <RouterIcon className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ispOwners.reduce((sum, owner) => sum + owner.routers + owner.pppoeUsers, 0)}
              </div>
              <p className="text-xs text-gray-500">
                Routers + PPPoE Users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>ISP Owners List</CardTitle>
            <CardDescription>
              View and manage all ISP businesses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by company name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredISPOwners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{owner.companyName}</div>
                          <div className="text-sm text-gray-500">{owner.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {owner.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {owner.phone}
                            </div>
                          )}
                          {owner.address && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[200px]">{owner.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {owner.customers}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(owner.revenue)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <RouterIcon className="h-3 w-3 mr-1 text-gray-400" />
                            {owner.routers} routers
                          </div>
                          <div className="flex items-center text-sm">
                            <Wifi className="h-3 w-3 mr-1 text-gray-400" />
                            {owner.pppoeUsers} PPPoE
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={owner.status === 'active' ? 'default' : 'secondary'}>
                          {owner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatDate(owner.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredISPOwners.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No ISP owners found matching your search criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}