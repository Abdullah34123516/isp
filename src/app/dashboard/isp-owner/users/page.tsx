'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserManagement } from '@/components/admin/UserManagement';

export default function ISPOwnerUsersPage() {
  return (
    <DashboardLayout title="Customer Management" role="isp-owner" user={{}}>
      <UserManagement currentUserRole="ISP_OWNER" />
    </DashboardLayout>
  );
}