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
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Zap, 
  Users, 
  DollarSign, 
  Edit,
  Trash2,
  Activity,
  Wifi,
  Calendar,
  HardDrive
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  speed: string;
  dataLimit?: string;
  validity: number;
  isActive: boolean;
  createdAt: string;
  pppoeUsers: PPPoEUser[];
}

interface PPPoEUser {
  id: string;
  username: string;
  status: string;
  customer: {
    name: string;
  };
}

interface PlanFormData {
  name: string;
  description?: string;
  price: number;
  speed: string;
  dataLimit?: string;
  validity: number;
}

export default function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: 0,
    speed: '',
    dataLimit: '',
    validity: 30
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns { plans: [...], pagination: {...} }
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
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

      const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans';
      const method = editingPlan ? 'PUT' : 'POST';

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
        // For POST, the response is { message: ..., plan: {...} }
        // For PUT, the response is { message: ..., plan: {...} }
        await fetchPlans();
        setIsDialogOpen(false);
        resetForm();
        alert(editingPlan ? 'Plan updated successfully!' : 'Plan created successfully!');
      } else {
        alert(`Error: ${data.error || 'Failed to save plan'}`);
        console.error('Plan save error:', data);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Network error. Please try again.');
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        const data = await response.json();
        await fetchPlans();
      }
    } catch (error) {
      console.error('Error updating plan status:', error);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This will affect all PPPoE users using this plan.')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        await fetchPlans();
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const editPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      speed: plan.speed,
      dataLimit: plan.dataLimit || '',
      validity: plan.validity
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      speed: '',
      dataLimit: '',
      validity: 30
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Plans Management" role="isp-owner" user={{}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Plans Management" role="isp-owner" user={{}}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Internet Plans</h1>
            <p className="text-gray-600">Manage your internet service plans and packages</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Edit Plan' : 'Add New Plan'}
                </DialogTitle>
                <DialogDescription>
                  Create a new internet service plan for your customers
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="speed">Speed</Label>
                  <Input
                    id="speed"
                    value={formData.speed}
                    onChange={(e) => setFormData({...formData, speed: e.target.value})}
                    placeholder="e.g., 100 Mbps"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dataLimit">Data Limit (Optional)</Label>
                  <Input
                    id="dataLimit"
                    value={formData.dataLimit}
                    onChange={(e) => setFormData({...formData, dataLimit: e.target.value})}
                    placeholder="e.g., 100 GB"
                  />
                </div>
                <div>
                  <Label htmlFor="validity">Validity (Days)</Label>
                  <Input
                    id="validity"
                    type="number"
                    value={formData.validity}
                    onChange={(e) => setFormData({...formData, validity: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingPlan ? 'Update Plan' : 'Add Plan'}
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
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
              <p className="text-xs text-gray-500">
                {plans.filter(p => p.isActive).length} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans.reduce((sum, plan) => sum + plan.pppoeUsers.length, 0)}
              </div>
              <p className="text-xs text-gray-500">Across all plans</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans.length > 0 ? `$${(plans.reduce((sum, plan) => sum + plan.price, 0) / plans.length).toFixed(2)}` : '$0'}
              </div>
              <p className="text-xs text-gray-500">Per month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Popular Plan</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plans.length > 0 ? plans.reduce((max, plan) => 
                  plan.pppoeUsers.length > max.pppoeUsers.length ? plan : max
                ).name : 'N/A'}
              </div>
              <p className="text-xs text-gray-500">Most users</p>
            </CardContent>
          </Card>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Internet Plans</CardTitle>
            <CardDescription>Manage your internet service plans and their configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Data Limit</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-500">{plan.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{plan.speed}</TableCell>
                    <TableCell>{plan.dataLimit || 'Unlimited'}</TableCell>
                    <TableCell>${plan.price}</TableCell>
                    <TableCell>{plan.validity} days</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={plan.isActive}
                          onCheckedChange={(checked) => togglePlanStatus(plan.id, checked)}
                        />
                        {getStatusBadge(plan.isActive)}
                      </div>
                    </TableCell>
                    <TableCell>{plan.pppoeUsers.length}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePlan(plan.id)}
                          disabled={plan.pppoeUsers.length > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {plans.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No internet plans configured yet</p>
                <p className="text-sm">Add your first plan to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Usage Overview</CardTitle>
            <CardDescription>See how your plans are being used by customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.slice(0, 6).map((plan) => (
                <div key={plan.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{plan.name}</div>
                    {getStatusBadge(plan.isActive)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Zap className="h-3 w-3 mr-1" />
                      {plan.speed}
                    </div>
                    <div className="flex items-center">
                      <HardDrive className="h-3 w-3 mr-1" />
                      {plan.dataLimit || 'Unlimited'}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${plan.price}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {plan.pppoeUsers.length} users
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Usage</span>
                      <span>{plan.pppoeUsers.length} users</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((plan.pppoeUsers.length / Math.max(1, plans.reduce((max, p) => Math.max(max, p.pppoeUsers.length), 0))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
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