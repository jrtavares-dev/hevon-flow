import { NextResponse } from 'next/server';
import { DistributionEngine } from '@/lib/puzzle/DistributionEngine';
import { sendHevonWebhookAsync } from '@/lib/hevon';

export async function POST(req) {
  try {
    const body = await req.json();

    const customerEmail = body.customer_email || body.email || 'joao@silva.com.br';
    const customerName = body.customer_name || body.name || 'João da Silva';
    const customerCpf = body.customer_cpf || body.cpf || '';
    const customerPhone = body.customer_phone || body.phone || '';
    const amount = parseFloat(body.amount || 50.0);
    const campaignId = body.campaign_id ? parseInt(body.campaign_id) : null;
    const source = body.source || 'web_checkout';
    const targetPuzzleId = body.puzzle_id || body.target_puzzle_id || null;
    const externalRef = body.external_reference || `UPFLOW-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const result = await DistributionEngine.processParticipation({
      customerEmail,
      customerName,
      customerCpf,
      customerPhone,
      amount,
      externalReference: externalRef,
      campaignId,
      source,
      targetPuzzleId: targetPuzzleId ? parseInt(targetPuzzleId) : null,
    });

    if (result?.success && result?.data && !result?.is_idempotent) {
      const d = result.data;
      const customerData = {
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        document: customerCpf,
        gender: body.gender || '',
      };
      const parentOrderId = body.parent_order_id || body.order_id || externalRef;
      const origin = req.nextUrl?.origin || 'https://cherminho.app';

      sendHevonWebhookAsync({
        event: 'game_interacted',
        req,
        game_type: 'puzzle',
        page_url: body.page_url || `${origin}/puzzle`,
        parent_order_id: parentOrderId,
        action_id: body.action_id || null,
        customer: customerData,
        interaction: {
          action: 'puzzle_piece_unlocked',
          piece_number: d.piece_number,
          total_pieces_placed: d.pieces_owned,
          is_duplicate: Boolean(d.is_duplicate),
        },
      });

      // Gatilho Near-Miss: faltando exatamente 1 peça para completar o quebra-cabeça
      if (!d.is_completed && d.pieces_total > 1 && d.pieces_owned === d.pieces_total - 1) {
        sendHevonWebhookAsync({
          event: 'near_miss',
          req,
          game_type: 'puzzle',
          page_url: body.page_url || `${origin}/puzzle`,
          parent_order_id: parentOrderId,
          action_id: body.action_id || null,
          customer: customerData,
          progress: {
            target_title: d.puzzle_name || 'Quebra-Cabeça',
            score_achieved: d.pieces_owned,
            score_required: d.pieces_total,
            missing_item: `Última Peça de ${d.puzzle_name || 'Quebra-Cabeça'}`,
            status: 'almost_won',
          },
          recovery_link: `${origin}/puzzle?retry=${encodeURIComponent(parentOrderId)}`,
        });
      }

      // Conquista: quebra-cabeça 100% completo
      if (d.is_completed && d.reward) {
        sendHevonWebhookAsync({
          event: 'reward_granted',
          req,
          game_type: 'puzzle',
          page_url: body.page_url || `${origin}/puzzle`,
          parent_order_id: parentOrderId,
          action_id: body.action_id || null,
          customer: customerData,
          reward: {
            type: Number(d.reward.prize_value || 0) > 0 ? 'pix_cash' : 'bonus_tickets',
            title: d.reward.prize_name || d.puzzle_name || 'Prêmio Quebra-Cabeça',
            bonus_quantity: 0,
            cash_value: Number(d.reward.prize_value || 0),
            reward_code: d.reward.reward_code || null,
            special_checkout_url: body.special_checkout_url || null,
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error processing participation:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
