import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import PresellForm from '@/components/PresellForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function CreatePresellPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  return <PresellForm isEdit={false} />;
}
