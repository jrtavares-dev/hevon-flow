import { NextResponse } from 'next/server';
import { createSession } from '@/lib/models/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const { campaign_id, customer_name, customer_email, customer_phone, customer_doc } = body;

    if (!campaign_id) {
      return NextResponse.json({ success: false, message: 'campaign_id é obrigatório.' }, { status: 400 });
    }

    const session = await createSession(campaign_id, body);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Falha ao criar sessão de upsell.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session_id: session.id,
      token: session.token,
      url: `/o/${session.token}`,
    });
  } catch (err) {
    console.error('Create Session API error:', err);
    return NextResponse.json({ success: false, message: 'Erro interno ao criar sessão.' }, { status: 500 });
  }
}
