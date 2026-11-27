import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import CampaignEditor from '@/components/CampaignEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreateCampaignPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  return <CampaignEditor isCreate={true} />;
}
