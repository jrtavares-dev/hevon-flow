import { NextResponse } from 'next/server';
import { findSessionByToken, advanceSessionToNextLevel } from '@/lib/models/session';
import { queryOne } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token obrigatório.' }, { status: 400 });
    }

    const session = await findSessionByToken(token);
    if (!session || session.status !== 'active') {
      return NextResponse.json({ success: false, message: 'Sessão inválida ou já finalizada.' }, { status: 400 });
    }

    // Advance session without adding revenue
    const hasNext = await advanceSessionToNextLevel(session.id);
    const updated = await findSessionByToken(token);

    let redirectUrl = `/o/${token}`;
    if (!hasNext || updated.status === 'completed') {
      const campaign = await queryOne('SELECT final_redirect_url FROM campaigns WHERE id = ? LIMIT 1', [
        session.campaign_id,
      ]);
      redirectUrl = campaign?.final_redirect_url || '/finalizado';
    }

    return NextResponse.json({
      success: true,
      message: 'Oferta recusada. Avançando funil...',
      redirect_url: redirectUrl,
      status: updated.status,
    });
  } catch (err) {
    console.error('Decline API error:', err);
    return NextResponse.json({ success: false, message: 'Erro ao recusar oferta.' }, { status: 500 });
  }
}
