import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import ProfileForm from '@/components/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  return <ProfileForm admin={admin} />;
}
