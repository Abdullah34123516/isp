'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Loader2, Plus, Edit, Trash2, RefreshCw, Wifi, WifiOff, Settings, Users } from 'lucide-react'
import { Router, RouterStatus } from '@/lib/db'

interface RouterListProps {
  ispOwnerId?: string
}

export default function RouterList({ ispOwnerId }: RouterListProps) {
  const [routers, setRouters] = useState<Router[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRouter, setEditingRouter] = useState<Router | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState<{[key: string]: boolean}>({})

  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    port: 8728,
    username: '',
    password: '',
    location: '',
    model: '',
    firmware: ''
  })

  useEffect(() => {
    fetchRouters()
  }, [ispOwnerId])

  const fetchRouters = async () => {
    try {
      const params = new URLSearchParams()
      if (ispOwnerId) {
        params.append('ispOwnerId', ispOwnerId)
      }
      
      const response = await fetch(`/api/routers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRouters(data)
      }
    } catch (error) {
      console.error('Error fetching routers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingRouter ? `/api/routers/${editingRouter.id}` : '/api/routers'
      const method = editingRouter ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchRouters()
        setIsDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save router')
      }
    } catch (error) {
      console.error('Error saving router:', error)
      alert('Failed to save router')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (router: Router) => {
    setEditingRouter(router)
    setFormData({
      name: router.name,
      ipAddress: router.ipAddress,
      port: router.port,
      username: router.username,
      password: router.password,
      location: router.location || '',
      model: router.model || '',
      firmware: router.firmware || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (routerId: string) => {
    try {
      const response = await fetch(`/api/routers/${routerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchRouters()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete router')
      }
    } catch (error) {
      console.error('Error deleting router:', error)
      alert('Failed to delete router')
    }
  }

  const checkRouterStatus = async (routerId: string) => {
    setCheckingStatus(prev => ({ ...prev, [routerId]: true }))
    
    try {
      const response = await fetch(`/api/routers/${routerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'check_status' })
      })

      if (response.ok) {
        const updatedRouter = await response.json()
        setRouters(prev => 
          prev.map(router => 
            router.id === routerId ? updatedRouter : router
          )
        )
      }
    } catch (error) {
      console.error('Error checking router status:', error)
    } finally {
      setCheckingStatus(prev => ({ ...prev, [routerId]: false }))
    }
  }

  const syncPPPoEUsers = async (routerId: string) => {
    try {
      const response = await fetch(`/api/routers/${routerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'sync_pppoe' })
      })

      if (response.ok) {
        alert('PPPoE users synced successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to sync PPPoE users')
      }
    } catch (error) {
      console.error('Error syncing PPPoE users:', error)
      alert('Failed to sync PPPoE users')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      ipAddress: '',
      port: 8728,
      username: '',
      password: '',
      location: '',
      model: '',
      firmware: ''
    })
    setEditingRouter(null)
  }

  const getStatusBadge = (status: RouterStatus) => {
    const variants = {
      [RouterStatus.ONLINE]: 'default',
      [RouterStatus.OFFLINE]: 'destructive',
      [RouterStatus.MAINTENANCE]: 'secondary'
    } as const

    return (
      <Badge variant={variants[status]}>
        {status === RouterStatus.ONLINE ? (
          <Wifi className="w-3 h-3 mr-1" />
        ) : (
          <WifiOff className="w-3 h-3 mr-1" />
        )}
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Router Management</h2>
          <p className="text-muted-foreground">Manage your RouterOS devices</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Router
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingRouter ? 'Edit Router' : 'Add New Router'}
              </DialogTitle>
              <DialogDescription>
                {editingRouter 
                  ? 'Update router configuration'
                  : 'Add a new RouterOS device to your network'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Router Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Main Router"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipAddress">IP Address</Label>
                  <Input
                    id="ipAddress"
                    value={formData.ipAddress}
                    onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                    placeholder="192.168.1.1"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.port}
                    onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                    placeholder="8728"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="admin"
                    required
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="RB4011iGS+5HacQ2HnD"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firmware">Firmware</Label>
                  <Input
                    id="firmware"
                    value={formData.firmware}
                    onChange={(e) => handleInputChange('firmware', e.target.value)}
                    placeholder="6.47.10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Data Center Room 1"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {editingRouter ? 'Update Router' : 'Add Router'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Router Devices</CardTitle>
          <CardDescription>
            List of all RouterOS devices in your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {routers.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No routers found</h3>
              <p className="text-muted-foreground mb-4">
                Add your first RouterOS device to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Router
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>PPPoE Users</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routers.map((router) => (
                  <TableRow key={router.id}>
                    <TableCell className="font-medium">{router.name}</TableCell>
                    <TableCell>{router.ipAddress}:{router.port}</TableCell>
                    <TableCell>
                      {getStatusBadge(router.actualStatus || router.status)}
                    </TableCell>
                    <TableCell>{router.model || 'Unknown'}</TableCell>
                    <TableCell>{router.location || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{router.pppoeUsers?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => checkRouterStatus(router.id)}
                          disabled={checkingStatus[router.id]}
                        >
                          {checkingStatus[router.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncPPPoEUsers(router.id)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(router)}
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
                              <AlertDialogTitle>Delete Router</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{router.name}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(router.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
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