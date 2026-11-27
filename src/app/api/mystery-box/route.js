import { NextResponse } from 'next/server';
import { MysteryBoxService } from '@/lib/mystery_box/MysteryBoxService';
import { sendHevonWebhookAsync, syncHevonCatalogAsync } from '@/lib/hevon';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'player';
    const campaignId = searchParams.get('campaign_id') ? parseInt(searchParams.get('campaign_id')) : null;

    if (mode === 'admin') {
      const campaign = await MysteryBoxService.getCampaignForAdmin(campaignId);
      const recentPlays = await MysteryBoxService.getRecentPlays(campaignId, 25);
      return NextResponse.json({ success: true, campaign, recent_plays: recentPlays });
    }

    const campaign = await MysteryBoxService.getActiveCampaign();
    return NextResponse.json({ success: true, campaign });
  } catch (err) {
    console.error('Error fetching mystery box data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const action = body.action || 'open_box';

    // 1. Abrir Caixa Misteriosa (Player)
    if (action === 'open_box') {
      const { customer_email, customer_name, campaign_id, chosen_box_index } = body;
      if (!customer_email) {
        return NextResponse.json({ success: false, error: 'E-mail do comprador obrigatório' }, { status: 400 });
      }

      const result = await MysteryBoxService.openBox({
        customer_email,
        customer_name: customer_name || 'Comprador VIP',
        campaign_id: campaign_id ? parseInt(campaign_id) : null,
        chosen_box_index: chosen_box_index !== undefined ? parseInt(chosen_box_index) : 1,
      });

      const customerData = {
        email: customer_email,
        name: customer_name || 'Comprador VIP',
        phone: body.customer_phone || body.phone || '',
        document: body.customer_cpf || body.document || '',
        gender: body.gender || '',
      };

      sendHevonWebhookAsync({
        event: 'game_interacted',
        req,
        game_type: 'caixa_misteriosa',
        page_url: body.page_url || req.headers.get('referer') || null,
        parent_order_id: body.parent_order_id || body.order_id || null,
        action_id: body.action_id || null,
        customer: customerData,
        interaction: {
          action: 'mystery_box_opened',
          box_index: result.chosen_box_index,
        },
      });

      if (result.winning_prize) {
        const prize = result.winning_prize;
        const mappedType =
          prize.reward_type === 'cash_pix'
            ? 'pix_cash'
            : String(prize.reward_type || '').startsWith('discount')
            ? 'discount_link'
            : 'bonus_tickets';

        sendHevonWebhookAsync({
          event: 'reward_granted',
          req,
          game_type: 'caixa_misteriosa',
          page_url: body.page_url || req.headers.get('referer') || null,
          parent_order_id: body.parent_order_id || body.order_id || null,
          action_id: body.action_id || null,
          customer: customerData,
          reward: {
            type: mappedType,
            title: prize.label || 'Prêmio Caixa Misteriosa',
            bonus_quantity: mappedType === 'bonus_tickets' ? Number(prize.reward_value || 0) : 0,
            cash_value: mappedType === 'pix_cash' ? Number(prize.reward_value || 0) : 0,
            coupon_code: result.coupon_code || null,
            special_checkout_url: body.special_checkout_url || null,
          },
        });
      }

      return NextResponse.json({ success: true, data: result });
    }

    // 2. Resgatar Prêmio (Player)
    if (action === 'claim_prize') {
      const playId = parseInt(body.play_id);
      await MysteryBoxService.claimPrize(playId);
      return NextResponse.json({ success: true, message: 'Prêmio resgatado com sucesso!' });
    }

    // 3. Atualizar Campanha (Admin)
    if (action === 'update_campaign') {
      const id = parseInt(body.id);
      if (!id) return NextResponse.json({ success: false, error: 'ID da campanha inválido' }, { status: 400 });
      await MysteryBoxService.updateCampaign(id, body);
      syncHevonCatalogAsync();
      return NextResponse.json({ success: true, message: 'Campanha atualizada com sucesso!' });
    }

    // 4. Atualizar Prêmio (Admin)
    if (action === 'update_prize') {
      const prizeId = parseInt(body.prize_id);
      if (!prizeId) return NextResponse.json({ success: false, error: 'ID do prêmio inválido' }, { status: 400 });
      await MysteryBoxService.updatePrize(prizeId, body);
      return NextResponse.json({ success: true, message: 'Prêmio atualizado com sucesso!' });
    }

    // 5. Adicionar Prêmio (Admin)
    if (action === 'add_prize') {
      const campaignId = parseInt(body.campaign_id);
      if (!campaignId) return NextResponse.json({ success: false, error: 'ID da campanha inválido' }, { status: 400 });
      await MysteryBoxService.addPrize(campaignId, body);
      return NextResponse.json({ success: true, message: 'Novo prêmio adicionado com sucesso!' });
    }

    // 6. Excluir Prêmio (Admin)
    if (action === 'delete_prize') {
      const prizeId = parseInt(body.prize_id);
      if (!prizeId) return NextResponse.json({ success: false, error: 'ID do prêmio inválido' }, { status: 400 });
      await MysteryBoxService.deletePrize(prizeId);
      return NextResponse.json({ success: true, message: 'Prêmio removido com sucesso!' });
    }

    return NextResponse.json({ success: false, error: 'Ação desconhecida' }, { status: 400 });
  } catch (err) {
    console.error('Error handling mystery box action:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
