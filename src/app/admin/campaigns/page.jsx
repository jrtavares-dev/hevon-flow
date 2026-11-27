import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { getAllCampaigns } from '@/lib/models/campaign';
import CampaignTableClient from '@/components/CampaignTableClient';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { HevonPageHeader, HevonStatusBadge } from '@/components/hevon';

export const dynamic = 'force-dynamic';

export default async function AdminCampaignsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  let campaigns = [];
  try {
    campaigns = (await getAllCampaigns()) || [];
  } catch (err) {
    console.error('Error loading campaigns:', err);
    campaigns = [];
  }

  return (
    <div className="w-100">
      <HevonPageHeader
        title="Funis & Campanhas"
        subtitle="Gerencie funis de upsell, downsell e fluxos de oferta de 1 clique."
        badge={<HevonStatusBadge variant="primary">1-Click Upsell</HevonStatusBadge>}
        actions={
          <Link href="/admin/campaigns/create" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5">
            <Plus size={14} />
            <span>Nova Campanha</span>
          </Link>
        }
      />

      <CampaignTableClient initialCampaigns={campaigns} baseUrl="" />
    </div>
  );
}
