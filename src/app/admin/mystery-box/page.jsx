import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { MysteryBoxService } from '@/lib/mystery_box/MysteryBoxService';
import MysteryBoxManagerClient from '@/components/mystery-box/MysteryBoxManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminMysteryBoxPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const campaign = await MysteryBoxService.getCampaignForAdmin();
  const recentPlays = await MysteryBoxService.getRecentPlays();

  return (
    <div className="w-100">
      <MysteryBoxManagerClient initialCampaign={campaign} initialRecentPlays={recentPlays} />
    </div>
  );
}
