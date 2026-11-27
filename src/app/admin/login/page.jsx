import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect('/admin/dashboard');
  }

  return <LoginForm />;
}
