import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getAllCampaigns, createCampaign, createCampaignLevel } from '@/lib/models/campaign';
import { DEFAULT_VIDEOCALL_CONFIG } from '@/components/VideoCallOfferView';
import { syncHevonCatalogAsync } from '@/lib/hevon';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const campaigns = await getAllCampaigns();
  return NextResponse.json({ success: true, data: campaigns });
}

export async function POST(request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, message: 'Nome da campanha é obrigatório.' }, { status: 400 });
    }

    const id = await createCampaign(body);

    if (!body.skip_default_level) {
      if (body.initial_template === 'videocall') {
        await createCampaignLevel(id, {
          name: body.name,
          internal_name: 'Nível 1 (Chamada de Vídeo)',
          level_order: 1,
          enabled: 1,
          theme_name: 'videocall',
          image: '/images/caller-avatar-default.jpg',
          video:
            'https://midia.dxhost.com.br/media/01a0deef-957a-78d8-9792-286bb12567e5/37d01e0fc10e08485b7268bb3e045bdd297faf77fa77fc986f7dad8115f6181f.mp4',
          cta_text: 'GARANTIR AGORA',
          timer_enabled: 1,
          timer_duration: 180,
          benefits: {
            ...DEFAULT_VIDEOCALL_CONFIG,
            offer_template: 'videocall',
          },
        });
      } else {
        await createCampaignLevel(id, {
          name: body.name,
          internal_name: 'Nível 1 (Upsell 1)',
          level_order: 1,
          enabled: 1,
          theme_name: 'green',
        });
      }
    }

    syncHevonCatalogAsync();
    return NextResponse.json({ success: true, message: 'Campanha criada com sucesso!', id });
  } catch (err) {
    console.error('Error creating campaign:', err);
    return NextResponse.json({ success: false, message: 'Erro ao criar campanha.' }, { status: 500 });
  }
}
