import { NextResponse } from 'next/server';
import { RewardService } from '@/lib/puzzle/RewardService';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const mode = searchParams.get('mode') || 'user';
    const status = searchParams.get('status') || null;

    if (mode === 'admin') {
      const rewards = await RewardService.getAllRewards(status);
      return NextResponse.json({ success: true, rewards });
    }

    const rewards = await RewardService.getUserRewards(email || 'joao@silva.com.br');
    return NextResponse.json({ success: true, rewards, total_won: rewards.length });
  } catch (err) {
    console.error('Error fetching rewards:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const action = body.action || 'claim';

    if (action === 'claim') {
      const result = await RewardService.claimReward({
        rewardId: parseInt(body.reward_id),
        customerEmail: body.email || 'joao@silva.com.br',
        claimType: body.claim_type || 'pix',
        pixKey: body.pix_key || '',
        shippingAddress: body.shipping_address || '',
      });
      return NextResponse.json(result);
    }

    if (action === 'update_status') {
      await RewardService.updateRewardStatus(
        parseInt(body.reward_id),
        body.status,
        body.notes || ''
      );
      return NextResponse.json({ success: true, message: 'Status do prêmio atualizado com sucesso!' });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida' }, { status: 400 });
  } catch (err) {
    console.error('Error processing reward:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
