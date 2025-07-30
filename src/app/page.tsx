'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, User, Shield, Wifi } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: 'super-admin',
      title: 'Super Admin',
      description: 'Manage the entire platform',
      icon: Shield,
      color: 'bg-red-500',
      path: '/login/super-admin'
    },
    {
      id: 'sub-admin',
      title: 'Sub Admin',
      description: 'Assist Super Admin, manage ISP Owners',
      icon: Users,
      color: 'bg-blue-500',
      path: '/login/sub-admin'
    },
    {
      id: 'isp-owner',
      title: 'ISP Owner',
      description: 'Manage customers, plans, and invoices',
      icon: Building2,
      color: 'bg-green-500',
      path: '/login/isp-owner'
    },
    {
      id: 'customer',
      title: 'Customer',
      description: 'View invoices and payment status',
      icon: User,
      color: 'bg-purple-500',
      path: '/login/customer'
    },
    {
      id: 'pppoe-customer',
      title: 'PPPoE Customer',
      description: 'Login with PPPoE credentials',
      icon: Wifi,
      color: 'bg-orange-500',
      path: '/pppoe-login'
    }
  ];

  const handleRoleSelect = (role: typeof roles[0]) => {
    setSelectedRole(role.id);
    setTimeout(() => {
      router.push(role.path);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <img
              src="/logo.svg"
              alt="ISP Billing Platform"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">ISP Billing Platform</h1>
          <p className="text-xl text-gray-600">Multi-tenant SaaS solution for Internet Service Providers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  selectedRole === role.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleRoleSelect(role)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="w-full justify-center">
                    Select to Login
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Select your role to continue to the login page</p>
        </div>
      </div>
    </div>
  );
}