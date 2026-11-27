import { NextResponse } from 'next/server';
import { execute, queryOne, query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const campaign = await queryOne('SELECT id FROM campaigns WHERE id = ? LIMIT 1', [id]);
    if (!campaign) {
      return NextResponse.redirect(new URL('/admin/campaigns', request.url));
    }

    const levels = await query('SELECT id FROM campaign_levels WHERE campaign_id = ?', [id]);
    const nextOrder = levels.length + 1;

    await execute(
      `INSERT INTO campaign_levels 
       (campaign_id, name, internal_name, level_order, enabled, headline, subheadline, cta_text, badge, progress_value, price, timer_duration)
       VALUES (?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?, 300)`,
      [
        id,
        `Oferta Nível ${nextOrder}`,
        `Nível ${nextOrder} (Upsell ${nextOrder})`,
        nextOrder,
        `Oferta Especial Nível ${nextOrder}`,
        'Condição exclusiva adicional para você.',
        'QUERO APROVEITAR AGORA!',
        'OFERTA ESPECIAL',
        90,
        47.0,
      ]
    );

    return NextResponse.redirect(new URL(`/admin/campaigns/edit/${id}`, request.url));
  } catch (err) {
    console.error('Add level route error:', err);
    return NextResponse.redirect(new URL('/admin/campaigns', request.url));
  }
}
