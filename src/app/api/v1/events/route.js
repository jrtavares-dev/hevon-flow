import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { findSessionByToken } from '@/lib/models/session';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Suporte automático a envio em lote (Batching - Fase 03: EVT-02/EVT-04)
    // Mantém 100% de compatibilidade com chamadas individuais existentes
    const isBatch = Array.isArray(body.events);
    const rawEvents = isBatch ? body.events : [body];

    if (!rawEvents || rawEvents.length === 0) {
      return NextResponse.json({ error: 'Nenhum evento fornecido.' }, { status: 400 });
    }

    // Limite máximo de salvaguarda de 50 eventos por requisição
    const events = rawEvents.slice(0, 50);

    for (const item of events) {
      const { token, event_type, level_id, event_data } = item;
      if (!event_type) continue;

      let sessionId = null;
      let campaignId = null;
      let campaignLevelId = level_id || null;

      if (token) {
        const session = await findSessionByToken(token);
        if (session) {
          sessionId = session.id;
          campaignId = session.campaign_id;
          if (!campaignLevelId) {
            campaignLevelId = session.current_level_id;
          }
        }
      }

      if (!campaignId && campaignLevelId) {
        const lvl = await queryOne('SELECT campaign_id FROM campaign_levels WHERE id = ? LIMIT 1', [campaignLevelId]);
        if (lvl) campaignId = lvl.campaign_id;
      }

      const jsonData = typeof event_data === 'string' ? event_data : JSON.stringify(event_data || {});

      await query(
        `INSERT INTO events (visitor_id, upsell_session_id, campaign_id, campaign_level_id, event_type, event_data, created_at)
         VALUES (NULL, ?, ?, ?, ?, ?, NOW())`,
        [sessionId, campaignId, campaignLevelId, event_type, jsonData]
      );
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (err) {
    console.error('Log event error:', err?.message || err);
    // Mensagem de erro segura sem expor stack traces ou detalhes internos
    return NextResponse.json({ success: false, error: 'Erro ao registrar evento.' }, { status: 500 });
  }
}
