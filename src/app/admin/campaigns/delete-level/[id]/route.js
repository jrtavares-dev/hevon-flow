import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const level = await queryOne('SELECT campaign_id FROM campaign_levels WHERE id = ? LIMIT 1', [id]);
    const campaignId = level?.campaign_id;

    await execute('DELETE FROM campaign_levels WHERE id = ?', [id]);

    if (campaignId) {
      return NextResponse.redirect(new URL(`/admin/campaigns/edit/${campaignId}`, request.url));
    }
    return NextResponse.redirect(new URL('/admin/campaigns', request.url));
  } catch (err) {
    console.error('Delete level route error:', err);
    return NextResponse.redirect(new URL('/admin/campaigns', request.url));
  }
}
