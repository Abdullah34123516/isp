import { LoginForm } from '@/components/auth/LoginForm';

export default function ISPOwnerLoginPage() {
  return (
    <LoginForm
      role="isp-owner"
      title="ISP Owner Login"
      description="Sign in to manage your customers, plans, and invoices"
    />
  );
}