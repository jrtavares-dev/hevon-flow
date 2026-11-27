import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { getCampaignById, getCampaignLevels } from '@/lib/models/campaign';
import CampaignEditor from '@/components/CampaignEditor';

export const dynamic = 'force-dynamic';

export default async function EditCampaignPage({ params }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const { id } = await params;
  const campaign = await getCampaignById(id);

  if (!campaign) {
    redirect('/admin/campaigns');
  }

  const levels = await getCampaignLevels(id);

  return <CampaignEditor initialCampaign={campaign} initialLevels={levels} />;
}
