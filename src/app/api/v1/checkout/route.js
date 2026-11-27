import { NextResponse } from 'next/server';
import {
  findSessionByToken,
  createOrder,
  updateOrderStatus,
  addSessionRevenue,
  advanceSessionToNextLevel,
} from '@/lib/models/session';
import { queryOne } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, level_id, price, product_id } = body;

    if (!token || !level_id) {
      return NextResponse.json({ success: false, message: 'Token e level_id são obrigatórios.' }, { status: 400 });
    }

    const session = await findSessionByToken(token);
    if (!session || session.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Sessão inválida ou já finalizada.' }, { status: 400 });
    }

    const level = await queryOne('SELECT * FROM campaign_levels WHERE id = ? LIMIT 1', [level_id]);
    if (!level) {
      return NextResponse.json({ success: false, message: 'Nível não encontrado.' }, { status: 404 });
    }

    const offerPrice = parseFloat(price ?? level.price) || 0;

    // Create order as paid (or pending if redirecting to external gateway)
    const orderId = await createOrder({
      sessionId: session.id,
      levelId: level.id,
      productId: product_id || level.product_id,
      amount: offerPrice,
      status: 'paid', // 1-click upsell accepted
    });

    // Add revenue to session
    await addSessionRevenue(session.id, offerPrice);

    // Advance session to next level or complete
    const hasNextLevel = await advanceSessionToNextLevel(session.id);

    // Get updated session to determine redirect
    const updatedSession = await findSessionByToken(token);

    let redirectUrl = `/o/${token}`;
    if (!hasNextLevel || updatedSession.status === 'completed') {
      const campaign = await queryOne('SELECT final_redirect_url FROM campaigns WHERE id = ? LIMIT 1', [
        session.campaign_id,
      ]);
      redirectUrl = campaign?.final_redirect_url || '/finalizado';
    }

    return NextResponse.json({
      success: true,
      message: 'Oferta aceita com sucesso!',
      order_id: orderId,
      redirect_url: redirectUrl,
      status: updatedSession.status,
    });
  } catch (err) {
    console.error('Checkout API error:', err);
    return NextResponse.json({ success: false, message: 'Erro ao processar compra.' }, { status: 500 });
  }
}
