import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { WheelService } from '@/lib/wheel/WheelService';
import WheelManagerClient from '@/components/wheel/WheelManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminWheelPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const wheel = await WheelService.getWheelForAdmin();
  const recentSpins = await WheelService.getRecentSpins();

  return (
    <div className="w-100">
      <WheelManagerClient initialWheel={wheel} initialRecentSpins={recentSpins} />
    </div>
  );
}
