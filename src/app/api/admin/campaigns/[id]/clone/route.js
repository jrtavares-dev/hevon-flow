import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const original = await queryOne('SELECT * FROM campaigns WHERE id = ? LIMIT 1', [id]);
    if (!original) {
      return NextResponse.json({ success: false, message: 'Campanha não encontrada.' }, { status: 404 });
    }

    const newSlug = `${original.slug}-copia-${crypto.randomBytes(3).toString('hex')}`;
    const newName = `${original.name} (Cópia)`;

    const result = await query(
      `INSERT INTO campaigns (name, slug, status, description, final_redirect_url, meta_pixel_id, ga4_measurement_id, gtm_id, created_at, updated_at)
       VALUES (?, ?, 'active', ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        newName,
        newSlug,
        original.description,
        original.final_redirect_url,
        original.meta_pixel_id,
        original.ga4_measurement_id,
        original.gtm_id,
      ]
    );

    const newCampaignId = result.insertId;

    // Clone levels
    const levels = await query('SELECT * FROM campaign_levels WHERE campaign_id = ? ORDER BY level_order ASC', [id]);
    for (const lvl of levels) {
      await query(
        `INSERT INTO campaign_levels (
          campaign_id, name, internal_name, level_order, enabled, headline, subheadline, cta_text,
          badge, progress_value, price, original_price, timer_duration, video, image, product_id,
          social_proof_enabled, social_proof_text, exit_intent_enabled, exit_intent_title,
          exit_intent_discount_price, exit_intent_cta_text, ab_testing_enabled, ab_variant_b_headline,
          ab_variant_b_price, ab_variant_b_video, finish_funnel, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          newCampaignId,
          lvl.name,
          lvl.internal_name,
          lvl.level_order,
          lvl.enabled,
          lvl.headline,
          lvl.subheadline,
          lvl.cta_text,
          lvl.badge,
          lvl.progress_value,
          lvl.price,
          lvl.original_price,
          lvl.timer_duration,
          lvl.video,
          lvl.image,
          lvl.product_id,
          lvl.social_proof_enabled,
          lvl.social_proof_text,
          lvl.exit_intent_enabled,
          lvl.exit_intent_title,
          lvl.exit_intent_discount_price,
          lvl.exit_intent_cta_text,
          lvl.ab_testing_enabled,
          lvl.ab_variant_b_headline,
          lvl.ab_variant_b_price,
          lvl.ab_variant_b_video,
          lvl.finish_funnel,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campanha clonada com sucesso!',
      campaign_id: newCampaignId,
      slug: newSlug,
    });
  } catch (err) {
    console.error('Clone campaign error:', err);
    return NextResponse.json({ success: false, message: 'Erro ao clonar campanha.' }, { status: 500 });
  }
}
