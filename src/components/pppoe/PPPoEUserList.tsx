'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Loader2, Plus, Edit, Trash2, User, Wifi, WifiOff, Clock, Activity } from 'lucide-react'
import { PPPoEUser, PPPoEStatus, Router, Plan, Customer } from '@/lib/db'

interface PPPoEUserListProps {
  customerId?: string
  routerId?: string
  ispOwnerId?: string
  showControls?: boolean
}

export default function PPPoEUserList({ customerId, routerId, ispOwnerId, showControls = true }: PPPoEUserListProps) {
  const [pppoeUsers, setPppoeUsers] = useState<PPPoEUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<PPPoEUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [routers, setRouters] = useState<Router[]>([])
  const [plans, setPlans] = useState<Plan[]>([])

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    customerId: '',
    routerId: '',
    planId: '',
    downloadSpeed: '',
    uploadSpeed: '',
    dataLimit: '',
    expiresAt: '',
    status: PPPoEStatus.ACTIVE
  })

  useEffect(() => {
    fetchPPPoEUsers()
    if (showControls) {
      fetchCustomers()
      fetchRouters()
      fetchPlans()
    }
  }, [customerId, routerId, ispOwnerId, showControls])

  const fetchPPPoEUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (customerId) params.append('customerId', customerId)
      if (routerId) params.append('routerId', routerId)
      if (ispOwnerId) params.append('ispOwnerId', ispOwnerId)
      
      const response = await fetch(`/api/pppoe-users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPppoeUsers(data)
      }
    } catch (error) {
      console.error('Error fetching PPPoE users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams()
      if (ispOwnerId) params.append('ispOwnerId', ispOwnerId)
      
      const response = await fetch(`/api/customers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchRouters = async () => {
    try {
      const params = new URLSearchParams()
      if (ispOwnerId) params.append('ispOwnerId', ispOwnerId)
      
      const response = await fetch(`/api/routers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRouters(data)
      }
    } catch (error) {
      console.error('Error fetching routers:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const params = new URLSearchParams()
      if (ispOwnerId) params.append('ispOwnerId', ispOwnerId)
      
      const response = await fetch(`/api/plans?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const handleInputChange = (field: string, value: string | PPPoEStatus) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingUser ? `/api/pppoe-users/${editingUser.id}` : '/api/pppoe-users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchPPPoEUsers()
        setIsDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save PPPoE user')
      }
    } catch (error) {
      console.error('Error saving PPPoE user:', error)
      alert('Failed to save PPPoE user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (user: PPPoEUser) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: user.password,
      customerId: user.customerId,
      routerId: user.routerId,
      planId: user.planId,
      downloadSpeed: user.downloadSpeed || '',
      uploadSpeed: user.uploadSpeed || '',
      dataLimit: user.dataLimit || '',
      expiresAt: user.expiresAt ? new Date(user.expiresAt).toISOString().split('T')[0] : '',
      status: user.status
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/pppoe-users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchPPPoEUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete PPPoE user')
      }
    } catch (error) {
      console.error('Error deleting PPPoE user:', error)
      alert('Failed to delete PPPoE user')
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      customerId: '',
      routerId: '',
      planId: '',
      downloadSpeed: '',
      uploadSpeed: '',
      dataLimit: '',
      expiresAt: '',
      status: PPPoEStatus.ACTIVE
    })
    setEditingUser(null)
  }

  const getStatusBadge = (status: PPPoEStatus) => {
    const variants = {
      [PPPoEStatus.ACTIVE]: 'default',
      [PPPoEStatus.INACTIVE]: 'secondary',
      [PPPoEStatus.DISABLED]: 'destructive',
      [PPPoEStatus.EXPIRED]: 'outline'
    } as const

    const icons = {
      [PPPoEStatus.ACTIVE]: <Activity className="w-3 h-3 mr-1" />,
      [PPPoEStatus.INACTIVE]: <WifiOff className="w-3 h-3 mr-1" />,
      [PPPoEStatus.DISABLED]: <WifiOff className="w-3 h-3 mr-1" />,
      [PPPoEStatus.EXPIRED]: <Clock className="w-3 h-3 mr-1" />
    }

    return (
      <Badge variant={variants[status]}>
        {icons[status]}
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showControls && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">PPPoE User Management</h2>
            <p className="text-muted-foreground">Manage PPPoE users and their connections</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add PPPoE User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Edit PPPoE User' : 'Add New PPPoE User'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser 
                    ? 'Update PPPoE user configuration'
                    : 'Create a new PPPoE user for network access'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <Select value={formData.customerId} onValueChange={(value) => handleInputChange('customerId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routerId">Router</Label>
                    <Select value={formData.routerId} onValueChange={(value) => handleInputChange('routerId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select router" />
                      </SelectTrigger>
                      <SelectContent>
                        {routers.map((router) => (
                          <SelectItem key={router.id} value={router.id}>
                            {router.name} ({router.ipAddress})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planId">Plan</Label>
                    <Select value={formData.planId} onValueChange={(value) => handleInputChange('planId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} ({plan.speed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="downloadSpeed">Download Speed</Label>
                    <Input
                      id="downloadSpeed"
                      value={formData.downloadSpeed}
                      onChange={(e) => handleInputChange('downloadSpeed', e.target.value)}
                      placeholder="10M"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uploadSpeed">Upload Speed</Label>
                    <Input
                      id="uploadSpeed"
                      value={formData.uploadSpeed}
                      onChange={(e) => handleInputChange('uploadSpeed', e.target.value)}
                      placeholder="10M"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataLimit">Data Limit</Label>
                    <Input
                      id="dataLimit"
                      value={formData.dataLimit}
                      onChange={(e) => handleInputChange('dataLimit', e.target.value)}
                      placeholder="100 GB"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expires At</Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as PPPoEStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PPPoEStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={PPPoEStatus.INACTIVE}>Inactive</SelectItem>
                        <SelectItem value={PPPoEStatus.DISABLED}>Disabled</SelectItem>
                        <SelectItem value={PPPoEStatus.EXPIRED}>Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {editingUser ? 'Update User' : 'Add User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>PPPoE Users</CardTitle>
          <CardDescription>
            List of all PPPoE users and their connection details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pppoeUsers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No PPPoE users found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first PPPoE user to get started
              </p>
              {showControls && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add PPPoE User
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Router</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Expires</TableHead>
                  {showControls && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pppoeUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-4 h-4" />
                        <span>{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.customer?.name || 'Unknown'}</TableCell>
                    <TableCell>{user.router?.name || 'Unknown'}</TableCell>
                    <TableCell>{user.plan?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      {user.downloadSpeed || user.plan?.speed || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : 'Never'}
                    </TableCell>
                    {showControls && (
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete PPPoE User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{user.username}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}