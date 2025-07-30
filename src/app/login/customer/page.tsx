import { LoginForm } from '@/components/auth/LoginForm';

export default function CustomerLoginPage() {
  return (
    <LoginForm
      role="customer"
      title="Customer Login"
      description="Sign in to view your invoices and payment status"
    />
  );
}