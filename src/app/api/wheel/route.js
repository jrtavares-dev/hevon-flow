import { NextResponse } from 'next/server';
import { WheelService } from '@/lib/wheel/WheelService';
import { sendHevonWebhookAsync, syncHevonCatalogAsync } from '@/lib/hevon';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'player';
    const wheelId = searchParams.get('wheel_id') ? parseInt(searchParams.get('wheel_id')) : null;

    if (mode === 'admin') {
      const wheel = await WheelService.getWheelForAdmin(wheelId);
      const recentSpins = await WheelService.getRecentSpins(wheelId, 20);
      return NextResponse.json({ success: true, wheel, recent_spins: recentSpins });
    }

    const wheel = await WheelService.getActiveWheel();
    return NextResponse.json({ success: true, wheel });
  } catch (err) {
    console.error('Error fetching wheel data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const action = body.action || 'spin';

    // 1. Giro da Roleta (Player)
    if (action === 'spin') {
      const { customer_email, customer_name, wheel_id } = body;
      if (!customer_email) {
        return NextResponse.json({ success: false, error: 'E-mail do jogador obrigatório' }, { status: 400 });
      }

      const result = await WheelService.spinWheel({
        customer_email,
        customer_name: customer_name || 'Comprador',
        wheel_id: wheel_id ? parseInt(wheel_id) : null,
      });

      // HEVON Fase 1: Disparo assíncrono de game_interacted e reward_granted
      const customerData = {
        email: customer_email,
        name: customer_name || 'Comprador',
        phone: body.customer_phone || body.phone || '',
        document: body.customer_cpf || body.document || '',
        gender: body.gender || '',
      };

      sendHevonWebhookAsync({
        event: 'game_interacted',
        req,
        game_type: 'roleta',
        page_url: body.page_url || req.headers.get('referer') || null,
        parent_order_id: body.parent_order_id || body.order_id || null,
        action_id: body.action_id || null,
        customer: customerData,
        interaction: {
          action: 'wheel_spun',
          slice_index: result.slice_index,
          slice_label: result.label,
        },
      });

      if (result.reward_type && result.reward_type !== 'no_prize') {
        const mappedRewardType =
          result.reward_type === 'cash_pix'
            ? 'pix_cash'
            : result.reward_type.startsWith('discount')
            ? 'discount_link'
            : 'bonus_tickets';

        sendHevonWebhookAsync({
          event: 'reward_granted',
          req,
          game_type: 'roleta',
          page_url: body.page_url || req.headers.get('referer') || null,
          parent_order_id: body.parent_order_id || body.order_id || null,
          action_id: body.action_id || null,
          customer: customerData,
          reward: {
            type: mappedRewardType,
            title: result.label || 'Prêmio Roleta',
            bonus_quantity: mappedRewardType === 'bonus_tickets' ? Number(result.reward_value || 0) : 0,
            cash_value: mappedRewardType === 'pix_cash' ? Number(result.reward_value || 0) : 0,
            coupon_code: result.coupon_code || null,
            special_checkout_url: body.special_checkout_url || null,
          },
        });
      }

      return NextResponse.json({ success: true, data: result });
    }

    // 2. Atualização das Configurações Gerais da Roleta (Admin)
    if (action === 'update_wheel') {
      const id = parseInt(body.id);
      if (!id) return NextResponse.json({ success: false, error: 'ID da roleta inválido' }, { status: 400 });
      await WheelService.updateWheel(id, body);
      syncHevonCatalogAsync();
      return NextResponse.json({ success: true, message: 'Configurações da roleta atualizadas com sucesso!' });
    }

    // 3. Atualizar Fatia (Admin)
    if (action === 'update_slice') {
      const sliceId = parseInt(body.slice_id);
      if (!sliceId) return NextResponse.json({ success: false, error: 'ID da fatia inválido' }, { status: 400 });
      await WheelService.updateSlice(sliceId, body);
      return NextResponse.json({ success: true, message: 'Fatia atualizada com sucesso!' });
    }

    // 4. Adicionar Nova Fatia (Admin)
    if (action === 'add_slice') {
      const wheelId = parseInt(body.wheel_id);
      if (!wheelId) return NextResponse.json({ success: false, error: 'ID da roleta inválido' }, { status: 400 });
      await WheelService.addSlice(wheelId, body);
      return NextResponse.json({ success: true, message: 'Nova fatia adicionada com sucesso!' });
    }

    // 5. Excluir Fatia (Admin)
    if (action === 'delete_slice') {
      const sliceId = parseInt(body.slice_id);
      const wheelId = parseInt(body.wheel_id);
      if (!sliceId || !wheelId) return NextResponse.json({ success: false, error: 'Parâmetros inválidos' }, { status: 400 });
      await WheelService.deleteSlice(sliceId, wheelId);
      return NextResponse.json({ success: true, message: 'Fatia removida com sucesso!' });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida' }, { status: 400 });
  } catch (err) {
    console.error('Error processing wheel request:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
