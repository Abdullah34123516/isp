import { LoginForm } from '@/components/auth/LoginForm';

export default function SuperAdminLoginPage() {
  return (
    <LoginForm
      role="super-admin"
      title="Super Admin Login"
      description="Sign in to manage the entire platform"
    />
  );
}