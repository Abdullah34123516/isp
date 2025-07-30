'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserManagement } from '@/components/admin/UserManagement';

export default function SuperAdminUsersPage() {
  return (
    <DashboardLayout title="User Management" role="super-admin" user={{}}>
      <UserManagement currentUserRole="SUPER_ADMIN" />
    </DashboardLayout>
  );
}