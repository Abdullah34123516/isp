'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserManagement } from '@/components/admin/UserManagement';

export default function SubAdminUsersPage() {
  return (
    <DashboardLayout title="User Management" role="sub-admin" user={{}}>
      <UserManagement currentUserRole="SUB_ADMIN" />
    </DashboardLayout>
  );
}