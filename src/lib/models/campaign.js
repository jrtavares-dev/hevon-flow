import { query, queryOne, execute } from '../db.js';

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getAllCampaigns() {
  const campaigns = await query(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM campaign_levels cl WHERE cl.campaign_id = c.id) as levels_count,
      (SELECT COUNT(*) FROM upsell_sessions s WHERE s.campaign_id = c.id) as sessions_count,
      (SELECT COALESCE(SUM(revenue), 0) FROM upsell_sessions s WHERE s.campaign_id = c.id) as total_revenue
    FROM campaigns c
    ORDER BY c.created_at DESC
  `);
  return campaigns;
}

// Cache em memória de alta performance para Campanhas e Níveis (Upsells)
const campaignCache = globalThis._campaignCache || (globalThis._campaignCache = new Map());
const CAMPAIGN_CACHE_TTL_MS = 20 * 1000; // 20 segundos

export function clearCampaignCache(key = null) {
  if (!key) {
    campaignCache.clear();
  } else {
    for (const [k] of campaignCache.entries()) {
      if (k.includes(String(key))) {
        campaignCache.delete(k);
      }
    }
  }
}

export async function getCampaignById(id) {
  if (!id) return null;
  if (isNaN(Number(id))) return null;
  const cacheKey = `c:id:${id}`;
  const cached = campaignCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CAMPAIGN_CACHE_TTL_MS)) {
    return cached.data;
  }
  const row = await queryOne('SELECT * FROM campaigns WHERE id = ? LIMIT 1', [id]);
  if (row) {
    campaignCache.set(cacheKey, { timestamp: Date.now(), data: row });
    if (row.slug) campaignCache.set(`c:slug:${row.slug}`, { timestamp: Date.now(), data: row });
  }
  return row;
}

export async function getCampaignBySlug(slug) {
  if (!slug) return null;
  const cacheKey = `c:slug:${slug}`;
  const cached = campaignCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CAMPAIGN_CACHE_TTL_MS)) {
    return cached.data;
  }
  const row = await queryOne('SELECT * FROM campaigns WHERE slug = ? LIMIT 1', [slug]);
  if (row) {
    campaignCache.set(cacheKey, { timestamp: Date.now(), data: row });
    if (row.id) campaignCache.set(`c:id:${row.id}`, { timestamp: Date.now(), data: row });
  }
  return row;
}

export async function createCampaign(data) {
  let baseSlug = data.slug ? slugify(data.slug) : slugify(data.name || 'campanha');
  let slug = baseSlug;
  let counter = 1;

  while (await getCampaignBySlug(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const result = await execute(
    `INSERT INTO campaigns (name, slug, status, description, final_redirect_url, meta_pixel_id, ga4_measurement_id, gtm_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      data.name,
      slug,
      data.status || 'active',
      data.description || '',
      data.final_redirect_url || null,
      data.meta_pixel_id || null,
      data.ga4_measurement_id || null,
      data.gtm_id || null,
    ]
  );

  clearCampaignCache();
  return result.insertId;
}

export async function updateCampaign(id, data) {
  await execute(
    `UPDATE campaigns 
     SET name = ?, status = ?, description = ?, final_redirect_url = ?,
         meta_pixel_id = ?, ga4_measurement_id = ?, gtm_id = ?
     WHERE id = ?`,
    [
      data.name,
      data.status,
      data.description || '',
      data.final_redirect_url || null,
      data.meta_pixel_id || null,
      data.ga4_measurement_id || null,
      data.gtm_id || null,
      id,
    ]
  );
  clearCampaignCache(id);
  return true;
}

export async function deleteCampaign(id) {
  await execute('DELETE FROM campaigns WHERE id = ?', [id]);
  clearCampaignCache(id);
  return true;
}

export async function cloneCampaign(id) {
  const original = await getCampaignById(id);
  if (!original) return null;

  const newId = await createCampaign({
    name: `${original.name} (Cópia)`,
    status: 'active',
    description: original.description,
    final_redirect_url: original.final_redirect_url,
    meta_pixel_id: original.meta_pixel_id,
    ga4_measurement_id: original.ga4_measurement_id,
    gtm_id: original.gtm_id,
  });

  // Clone levels
  const levels = await getCampaignLevels(id);
  for (const lvl of levels) {
    await createCampaignLevel(newId, {
      ...lvl,
      name: lvl.name,
    });
  }

  return newId;
}

export async function getCampaignLevels(campaignId) {
  if (!campaignId) return [];
  const cacheKey = `lvls:${campaignId}`;
  const cached = campaignCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CAMPAIGN_CACHE_TTL_MS)) {
    return cached.data;
  }
  const rows = await query(
    'SELECT * FROM campaign_levels WHERE campaign_id = ? ORDER BY level_order ASC, id ASC',
    [campaignId]
  );
  campaignCache.set(cacheKey, { timestamp: Date.now(), data: rows || [] });
  return rows || [];
}

export async function getCampaignLevelById(levelId) {
  if (!levelId) return null;
  const cacheKey = `lvl:${levelId}`;
  const cached = campaignCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CAMPAIGN_CACHE_TTL_MS)) {
    return cached.data;
  }
  const row = await queryOne('SELECT * FROM campaign_levels WHERE id = ? LIMIT 1', [levelId]);
  if (row) {
    campaignCache.set(cacheKey, { timestamp: Date.now(), data: row });
  }
  return row;
}

export async function createCampaignLevel(campaignId, data) {
  const maxOrderRow = await queryOne(
    'SELECT MAX(level_order) as max_order FROM campaign_levels WHERE campaign_id = ?',
    [campaignId]
  );
  const nextOrder = (maxOrderRow?.max_order ?? 0) + 1;

  const result = await execute(
    `INSERT INTO campaign_levels (
      campaign_id, name, internal_name, level_order, enabled, theme_name,
      badge, headline, subheadline, description, image, video, benefits,
      progress_value, progress_text, cta_text, external_checkout_url, price, original_price,
      timer_enabled, timer_duration, timer_mode, timer_expiration_action,
      social_proof_enabled, social_proof_text,
      exit_intent_enabled, exit_intent_title, exit_intent_discount_price, exit_intent_cta_text,
      ab_testing_enabled, ab_variant_b_headline, ab_variant_b_price, ab_variant_b_video,
      next_level_id, redirect_after_payment, finish_funnel, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, NOW()
    )`,
    [
      campaignId,
      data.name || 'Nova Oferta de Upsell',
      data.internal_name || 'Nível ' + nextOrder,
      data.level_order ?? nextOrder,
      data.enabled ?? 1,
      data.theme_name || 'green',
      data.badge || 'PRÊMIO PRINCIPAL',
      data.headline || 'ESPERE! Oferta Especial Exclusiva de Upsell',
      data.subheadline || 'Aproveite esta condição única adicionando ao seu pedido com 1 clique.',
      data.description || '',
      data.image || null,
      data.video || null,
      typeof data.benefits === 'object' ? JSON.stringify(data.benefits) : data.benefits || null,
      data.progress_value ?? 86,
      data.progress_text || null,
      data.cta_text || 'SIM! QUERO APROVEITAR ESSA OFERTA',
      data.external_checkout_url || null,
      data.price ?? 97.0,
      data.original_price ?? 197.0,
      data.timer_enabled ?? 1,
      data.timer_duration ?? 300,
      data.timer_mode || 'session',
      data.timer_expiration_action || 'keep_page',
      data.social_proof_enabled ?? 1,
      data.social_proof_text || null,
      data.exit_intent_enabled ?? 1,
      data.exit_intent_title || 'ESPERE! Liberei um desconto secreto exclusivo para você:',
      data.exit_intent_discount_price ?? 63.05,
      data.exit_intent_cta_text || 'SIM! QUERO APROVEITAR COM ESSE DESCONTO',
      data.ab_testing_enabled ? 1 : 0,
      data.ab_variant_b_headline || null,
      data.ab_variant_b_price || null,
      data.ab_variant_b_video || null,
      data.next_level_id || null,
      data.redirect_after_payment ?? 1,
      data.finish_funnel ?? 0,
    ]
  );

  clearCampaignCache();
  return result.insertId;
}

export async function updateCampaignLevel(id, data) {
  await execute(
    `UPDATE campaign_levels SET
      name = ?, internal_name = ?, level_order = ?, enabled = ?, theme_name = ?,
      badge = ?, headline = ?, subheadline = ?, description = ?, image = ?, video = ?, benefits = ?,
      progress_value = ?, progress_text = ?, cta_text = ?, external_checkout_url = ?, price = ?, original_price = ?,
      timer_enabled = ?, timer_duration = ?, timer_mode = ?, timer_expiration_action = ?,
      social_proof_enabled = ?, social_proof_text = ?,
      exit_intent_enabled = ?, exit_intent_title = ?, exit_intent_discount_price = ?, exit_intent_cta_text = ?,
      ab_testing_enabled = ?, ab_variant_b_headline = ?, ab_variant_b_price = ?, ab_variant_b_video = ?,
      next_level_id = ?, redirect_after_payment = ?, finish_funnel = ?
     WHERE id = ?`,
    [
      data.name,
      data.internal_name,
      data.level_order ?? 0,
      data.enabled ?? 1,
      data.theme_name || 'green',
      data.badge || null,
      data.headline,
      data.subheadline,
      data.description || '',
      data.image || null,
      data.video || null,
      typeof data.benefits === 'object' ? JSON.stringify(data.benefits) : data.benefits || null,
      data.progress_value ?? 86,
      data.progress_text || null,
      data.cta_text,
      data.external_checkout_url || null,
      data.price,
      data.original_price,
      data.timer_enabled ? 1 : 0,
      data.timer_duration || 300,
      data.timer_mode || 'session',
      data.timer_expiration_action || 'keep_page',
      data.social_proof_enabled ? 1 : 0,
      data.social_proof_text || null,
      data.exit_intent_enabled ? 1 : 0,
      data.exit_intent_title || null,
      data.exit_intent_discount_price || null,
      data.exit_intent_cta_text || null,
      data.ab_testing_enabled ? 1 : 0,
      data.ab_variant_b_headline || null,
      data.ab_variant_b_price || null,
      data.ab_variant_b_video || null,
      data.next_level_id || null,
      data.redirect_after_payment ? 1 : 0,
      data.finish_funnel ? 1 : 0,
      id,
    ]
  );
  clearCampaignCache();
  return true;
}

export async function deleteCampaignLevel(id) {
  await execute('DELETE FROM campaign_levels WHERE id = ?', [id]);
  clearCampaignCache();
  return true;
}
