import { LoginForm } from '@/components/auth/LoginForm';

export default function SubAdminLoginPage() {
  return (
    <LoginForm
      role="sub-admin"
      title="Sub Admin Login"
      description="Sign in to assist Super Admin and manage ISP Owners"
    />
  );
}