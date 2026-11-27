import { redirect } from 'next/navigation';
import { findSessionByToken, createSession } from '@/lib/models/session';
import { getCampaignById, getCampaignBySlug, getCampaignLevelById, getCampaignLevels } from '@/lib/models/campaign';
import { queryOne } from '@/lib/db';
import OfferView from '@/components/OfferView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  try {
    const { token } = await params;
    let title = 'Oferta Exclusiva de Upsell · UpsellFlow';
    if (!token) return { title, description: 'Oferta exclusiva adicionada com 1 clique ao seu pedido.' };
    const session = await findSessionByToken(token);
    if (session) {
      const level = await getCampaignLevelById(session.current_level_id);
      if (level) title = `${level.headline || level.name} · Condição Especial`;
    }
    return { title, description: 'Oferta exclusiva adicionada com 1 clique ao seu pedido.' };
  } catch {
    return { title: 'Oferta Exclusiva · UpsellFlow', description: 'Oferta exclusiva adicionada com 1 clique ao seu pedido.' };
  }
}

export default async function PublicOfferPage({ params }) {
  const { token } = await params;

  let session = null;
  let campaign = null;

  try {
    session = await findSessionByToken(token);

    // If token is not an existing session, check if it's a campaign slug or id
    if (!session) {
      campaign = (await getCampaignBySlug(token)) || (await getCampaignById(token));
      if (!campaign) {
        redirect('/expired');
      }

      // Auto-create a guest session for preview / direct traffic
      session = await createSession(campaign.id, {
        name: 'Visitante Oferta',
        utm_source: 'direct',
      });
    } else {
      campaign = await getCampaignById(session.campaign_id);
    }
  } catch (err) {
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
    console.error('PublicOfferPage error:', err);
    redirect('/expired');
  }

  if (!campaign || campaign.status === 'paused') {
    redirect('/expired');
  }

  if (session.status === 'completed') {
    redirect(campaign.final_redirect_url || '/finalizado');
  }

  // Fetch current level
  let level = session.current_level_id ? await getCampaignLevelById(session.current_level_id) : null;

  if (!level) {
    const levels = await getCampaignLevels(campaign.id);
    level = levels[0] || null;
  }

  if (!level) {
    redirect(campaign.final_redirect_url || '/finalizado');
  }

  return <OfferView session={session} campaign={campaign} level={level} />;
}
