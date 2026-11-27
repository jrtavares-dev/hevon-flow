import { query, queryOne, execute, isPostgres } from '../db.js';
import { slugify } from './campaign.js';

export function normalizePresellData(item) {
  if (!item) return null;

  item.buttons_list = [];
  item.page_styles = {
    badge_font_size: '10px',
    badge_text_color: item.accent_color || '#22c55e',
    badge_bg_color: '',
    headline_font_size: '30px',
    headline_color: '#ffffff',
    subheadline_font_size: '12px',
    subheadline_color: '#94a3b8',
    footer_font_size: '11px',
    footer_text_color: '#64748b',
  };

  item.social_proof_enabled = item.social_proof_enabled !== undefined && item.social_proof_enabled !== null
    ? Number(item.social_proof_enabled)
    : 1;
  item.social_proof_text = item.social_proof_text || '{name} de {city} acabou de comprar';
  item.social_proof_interval = item.social_proof_interval || 'balanced';
  item.social_proof_position = item.social_proof_position || 'bottom-left';

  if (item.buttons) {
    try {
      const decoded = typeof item.buttons === 'string' ? JSON.parse(item.buttons) : item.buttons;
      if (Array.isArray(decoded)) {
        item.buttons_list = decoded;
      } else if (decoded && typeof decoded === 'object') {
        if (Array.isArray(decoded.buttons)) {
          item.buttons_list = decoded.buttons;
        }
        if (decoded.styles && typeof decoded.styles === 'object') {
          item.page_styles = { ...item.page_styles, ...decoded.styles };
        }
        if (decoded.social_proof && typeof decoded.social_proof === 'object') {
          if (decoded.social_proof.enabled !== undefined) item.social_proof_enabled = Number(decoded.social_proof.enabled);
          if (decoded.social_proof.text) item.social_proof_text = decoded.social_proof.text;
          if (decoded.social_proof.interval) item.social_proof_interval = decoded.social_proof.interval;
          if (decoded.social_proof.position) item.social_proof_position = decoded.social_proof.position;
          if (Array.isArray(decoded.social_proof.buyers)) item.social_proof_buyers = decoded.social_proof.buyers;
        }
      }
    } catch {
      item.buttons_list = [];
    }
  }

  if (item.buttons_list.length === 0) {
    item.buttons_list = [
      {
        id: 'btn_1',
        type: 'primary',
        main_text: item.button_text || 'ENTRAR NA COMUNIDADE',
        main_text_size: '15px',
        text_color: item.button_text_color || '#ffffff',
        sub_text: item.button_subtext || '100% gratuito · direto no WhatsApp',
        sub_text_size: '11px',
        sub_text_color: item.button_text_color || '#ffffff',
        url: item.destination_url || '',
        icon: 'whatsapp',
        bg_color: item.button_color || '#22c55e',
        animation: item.button_animation || 'pulse',
        pass_utm: 1,
      },
    ];
  }

  return item;
}

export function parseCustomDatePeriod(period) {
  if (!period || typeof period !== 'string') return null;
  const singleMatch = period.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (singleMatch) {
    const d = singleMatch[1];
    const [y, m, day] = d.split('-');
    return {
      isSingleDay: true,
      startDate: d,
      endDate: d,
      daysCount: 1,
      cleanPeriod: d,
      label: `Dia ${day}/${m}/${y}`,
      shortLabel: `${day}/${m}/${y}`,
    };
  }
  const rangeMatch = period.match(/^(\d{4}-\d{2}-\d{2})[_~](\d{4}-\d{2}-\d{2})$/);
  if (rangeMatch) {
    let [, d1, d2] = rangeMatch;
    if (d1 > d2) {
      const tmp = d1;
      d1 = d2;
      d2 = tmp;
    }
    if (d1 === d2) {
      const [y, m, day] = d1.split('-');
      return {
        isSingleDay: true,
        startDate: d1,
        endDate: d1,
        daysCount: 1,
        cleanPeriod: d1,
        label: `Dia ${day}/${m}/${y}`,
        shortLabel: `${day}/${m}/${y}`,
      };
    }
    const t1 = new Date(`${d1}T12:00:00`).getTime();
    const t2 = new Date(`${d2}T12:00:00`).getTime();
    const diffDays = Math.max(1, Math.min(366, Math.round((t2 - t1) / 86400000) + 1));
    const [y1, m1, day1] = d1.split('-');
    const [y2, m2, day2] = d2.split('-');
    const sameYear = y1 === y2;
    return {
      isSingleDay: false,
      startDate: d1,
      endDate: d2,
      daysCount: diffDays,
      cleanPeriod: `${d1}_${d2}`,
      label: sameYear ? `${day1}/${m1} até ${day2}/${m2}/${y2}` : `${day1}/${m1}/${y1} até ${day2}/${m2}/${y2}`,
      shortLabel: `${day1}/${m1} a ${day2}/${m2}`,
    };
  }
  return null;
}

export function getPeriodCondition(period, dateCol = 'created_at') {
  const tz = isPostgres() ? '-03' : '';

  const custom = parseCustomDatePeriod(period);
  if (custom) {
    return [
      `${dateCol} >= '${custom.startDate} 00:00:00${tz}' AND ${dateCol} <= '${custom.endDate} 23:59:59${tz}'`,
      custom.daysCount,
      custom.cleanPeriod,
    ];
  }

  // Calcular datas no fuso horário do Brasil (America/Sao_Paulo) para evitar virada após 21h UTC
  // e manter janelas fixas a partir de 00:00:00 (evitando queda de contagem ao dar F5)
  const nowBR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const pad = (n) => String(n).padStart(2, '0');
  const formatBR = (daysAgo) => {
    const d = new Date(nowBR.getTime());
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const today = formatBR(0);
  const yesterday = formatBR(1);
  const start7d = formatBR(6);
  const start30d = formatBR(29);

  switch (period) {
    case 'hoje':
      return [`${dateCol} >= '${today} 00:00:00${tz}' AND ${dateCol} <= '${today} 23:59:59${tz}'`, 1, 'hoje'];
    case 'ontem':
      return [`${dateCol} >= '${yesterday} 00:00:00${tz}' AND ${dateCol} <= '${yesterday} 23:59:59${tz}'`, 1, 'ontem'];
    case '30d':
      return [`${dateCol} >= '${start30d} 00:00:00${tz}'`, 30, '30d'];
    case 'mes': {
      const startOfMonth = `${today.slice(0, 7)}-01 00:00:00${tz}`;
      return [`${dateCol} >= '${startOfMonth}'`, 30, 'mes'];
    }
    case 'tudo':
      return ['1=1', 30, 'tudo'];
    case '7d':
    default:
      return [`${dateCol} >= '${start7d} 00:00:00${tz}'`, 7, '7d'];
  }
}

export async function getAllPresells() {
  const rows = await query('SELECT * FROM presell_pages ORDER BY created_at DESC');
  return rows.map(normalizePresellData);
}

// Cache em memória de curta duração para entidades de Presell (3s garante sincronização imediata entre múltiplos processos PM2 no cluster e proteção contra picos)
const presellEntityCache = globalThis._presellEntityCache || (globalThis._presellEntityCache = new Map());
const PRESELL_ENTITY_CACHE_TTL_MS = 3 * 1000; // 3 segundos (sincronização imediata entre instâncias PM2)

export function clearPresellEntityCache(idOrSlug = null) {
  if (!idOrSlug) {
    presellEntityCache.clear();
  } else {
    for (const [k] of presellEntityCache.entries()) {
      if (k.includes(String(idOrSlug))) {
        presellEntityCache.delete(k);
      }
    }
  }
}

export async function getPresellById(id) {
  if (!id) return null;
  const cacheKey = `id:${id}`;
  const cached = presellEntityCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < PRESELL_ENTITY_CACHE_TTL_MS)) {
    return cached.data;
  }
  try {
    const row = await queryOne('SELECT * FROM presell_pages WHERE id = ? LIMIT 1', [id]);
    const data = normalizePresellData(row);
    if (data) {
      presellEntityCache.set(cacheKey, { timestamp: Date.now(), data });
      if (data.slug) presellEntityCache.set(`slug:${data.slug}`, { timestamp: Date.now(), data });
    }
    return data;
  } catch (err) {
    console.error('getPresellById DB Error:', err?.message || err);
    if (cached?.data) {
      console.warn('Falling back to stale presell cache for id:', id);
      return cached.data;
    }
    return null;
  }
}

export async function getPresellBySlug(slug) {
  if (!slug) return null;
  const cacheKey = `slug:${slug}`;
  const cached = presellEntityCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < PRESELL_ENTITY_CACHE_TTL_MS)) {
    return cached.data;
  }
  try {
    const row = await queryOne('SELECT * FROM presell_pages WHERE slug = ? LIMIT 1', [slug]);
    const data = normalizePresellData(row);
    if (data) {
      presellEntityCache.set(cacheKey, { timestamp: Date.now(), data });
      if (data.id) presellEntityCache.set(`id:${data.id}`, { timestamp: Date.now(), data });
    }
    return data;
  } catch (err) {
    console.error('getPresellBySlug DB Error:', err?.message || err);
    if (cached?.data) {
      console.warn('Falling back to stale presell cache for slug:', slug);
      return cached.data;
    }
    return null;
  }
}

// Cache em memória de curta duração para otimizar requisições simultâneas sem dessincronizar workers do PM2
const presellAnalyticsCache = globalThis._presellAnalyticsCache || (globalThis._presellAnalyticsCache = new Map());
export const ANALYTICS_CACHE_TTL_MS = 5 * 1000; // 5 segundos para períodos históricos

export function getAnalyticsCacheTtl(period) {
  if (period === 'hoje' || period === 'tudo') return 2 * 1000; // 2 segundos para tempo real automático (com deduplicação in-flight)
  return ANALYTICS_CACHE_TTL_MS;
}

export function clearPresellAnalyticsCache(pageId = null) {
  if (!pageId) {
    presellAnalyticsCache.clear();
  } else {
    for (const key of presellAnalyticsCache.keys()) {
      if (key.includes(String(pageId))) {
        presellAnalyticsCache.delete(key);
      }
    }
  }
}

export async function getPresellSummaryMetrics(pageId = null, period = '7d') {
  const cacheKey = `summary:${pageId || 'all'}:${period}`;
  const cached = presellAnalyticsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < getAnalyticsCacheTtl(period))) {
    return cached.data;
  }

  const [periodSql, daysCount, cleanPeriod] = getPeriodCondition(period, 'created_at');
  const pageWhere = pageId ? ` AND presell_page_id = ${parseInt(pageId, 10)}` : '';

  const metrics = await queryOne(`
    SELECT 
      COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
      COUNT(DISTINCT CASE WHEN event_type = 'view' THEN visitor_id END) as unique_visitors,
      COUNT(CASE WHEN event_type = 'click' THEN 1 END) as total_clicks,
      COUNT(CASE WHEN event_type = 'view' AND device_type = 'mobile' THEN 1 END) as mobile_views
    FROM presell_events 
    WHERE ${periodSql} ${pageWhere}
  `).catch(() => ({ total_views: 0, unique_visitors: 0, total_clicks: 0, mobile_views: 0 }));

  let views = Number(metrics?.total_views || 0);
  let uniques = Number(metrics?.unique_visitors || 0);
  let clicks = Number(metrics?.total_clicks || 0);
  const mobileViews = Number(metrics?.mobile_views || 0);

  if (cleanPeriod === 'tudo') {
    if (pageId) {
      const page = await getPresellById(pageId);
      views = Math.max(views, Number(page?.views_count || 0));
      clicks = Math.max(clicks, Number(page?.clicks_count || 0));
    } else {
      const totalRow = await queryOne('SELECT SUM(views_count) as v, SUM(clicks_count) as c FROM presell_pages');
      views = Math.max(views, Number(totalRow?.v || 0));
      clicks = Math.max(clicks, Number(totalRow?.c || 0));
    }
    uniques = Math.max(uniques, views);
  }

  const mobileRate = views > 0 ? Number(((mobileViews / views) * 100).toFixed(1)) : 0;
  const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0;

  const result = {
    views,
    clicks,
    uniques: uniques || views,
    ctr,
    mobileRate,
  };

  presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

export async function getPresellTimeSeriesStats(pageId = null, period = '7d') {
  const cacheKey = `timeSeries:${pageId || 'all'}:${period}`;
  const cached = presellAnalyticsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < getAnalyticsCacheTtl(period))) {
    return cached.data;
  }

  const [periodSql, daysCount, cleanPeriod] = getPeriodCondition(period, 'created_at');
  const pageWhere = pageId ? ` AND presell_page_id = ${parseInt(pageId, 10)}` : '';

  if (cleanPeriod === 'hoje' || cleanPeriod === 'ontem' || /^\d{4}-\d{2}-\d{2}$/.test(cleanPeriod)) {
    const nowBR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const pad = (n) => String(n).padStart(2, '0');
    const today = `${nowBR.getFullYear()}-${pad(nowBR.getMonth() + 1)}-${pad(nowBR.getDate())}`;
    const yesterdayDate = new Date(nowBR.getTime() - 86400000);
    const yesterday = `${yesterdayDate.getFullYear()}-${pad(yesterdayDate.getMonth() + 1)}-${pad(yesterdayDate.getDate())}`;

    let targetDate = cleanPeriod === 'ontem' ? yesterday : (cleanPeriod === 'hoje' ? today : cleanPeriod);
    const tz = isPostgres() ? '-03' : '';

    const rows = await query(`
      SELECT 
        HOUR(created_at) as hr, 
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_qty,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_qty
      FROM presell_events 
      WHERE created_at >= '${targetDate} 00:00:00${tz}' AND created_at <= '${targetDate} 23:59:59${tz}' ${pageWhere}
      GROUP BY HOUR(created_at)
    `).catch(() => []);

    const viewsByHr = {};
    const clicksByHr = {};
    for (const r of rows) {
      viewsByHr[r.hr] = Number(r.views_qty);
      clicksByHr[r.hr] = Number(r.clicks_qty);
    }

    const labels = [];
    const views = [];
    const clicks = [];
    for (let h = 0; h <= 23; h++) {
      labels.push(`${String(h).padStart(2, '0')}h`);
      views.push(viewsByHr[h] || 0);
      clicks.push(clicksByHr[h] || 0);
    }

    return { labels, views, clicks };
  }

  if (cleanPeriod === 'tudo') {
    const rows = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as dt, 
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_qty,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_qty
      FROM presell_events 
      WHERE 1=1 ${pageWhere}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY dt ASC
    `).catch(() => []);

    if (rows.length > 0) {
      const viewsByDay = {};
      const clicksByDay = {};
      for (const r of rows) {
        viewsByDay[r.dt] = Number(r.views_qty);
        clicksByDay[r.dt] = Number(r.clicks_qty);
      }

      const activeDates = rows.filter((r) => Number(r.views_qty) > 0 || Number(r.clicks_qty) > 0).map((r) => r.dt);
      const minActiveStr = activeDates[0] || rows[0].dt;
      const maxActiveStr = activeDates[activeDates.length - 1] || rows[rows.length - 1].dt;

      const startDate = new Date(new Date(minActiveStr).getTime() - 86400000);
      const todayDate = new Date();
      const maxActiveTime = new Date(maxActiveStr).getTime();
      const endPaddingDays = Math.min(3, Math.max(1, Math.round((todayDate.getTime() - maxActiveTime) / 86400000)));
      const endDate = new Date(maxActiveTime + endPaddingDays * 86400000);

      const totalDays = Math.max(1, Math.min(60, Math.round((endDate.getTime() - startDate.getTime()) / 86400000)));
      const labels = [];
      const views = [];
      const clicks = [];

      for (let i = 0; i <= totalDays; i++) {
        const d = new Date(startDate.getTime() + i * 86400000);
        const dtStr = d.toISOString().slice(0, 10);
        const [_, month, day] = dtStr.split('-');
        labels.push(`${day}/${month}`);
        views.push(viewsByDay[dtStr] || 0);
        clicks.push(clicksByDay[dtStr] || 0);
      }

      const result = { labels, views, clicks };
      presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    }
  }

  const customRange = parseCustomDatePeriod(cleanPeriod);
  if (customRange && !customRange.isSingleDay) {
    const tz = isPostgres() ? '-03' : '';
    const rows = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as dt, 
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_qty,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_qty
      FROM presell_events 
      WHERE created_at >= '${customRange.startDate} 00:00:00${tz}' AND created_at <= '${customRange.endDate} 23:59:59${tz}' ${pageWhere}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY dt ASC
    `).catch(() => []);

    const viewsByDay = {};
    const clicksByDay = {};
    for (const r of rows) {
      viewsByDay[r.dt] = Number(r.views_qty);
      clicksByDay[r.dt] = Number(r.clicks_qty);
    }

    const labels = [];
    const views = [];
    const clicks = [];
    const startMs = new Date(`${customRange.startDate}T12:00:00`).getTime();
    for (let i = 0; i < customRange.daysCount; i++) {
      const d = new Date(startMs + i * 86400000);
      const dtStr = d.toISOString().slice(0, 10);
      const [_, month, day] = dtStr.split('-');
      labels.push(`${day}/${month}`);
      views.push(viewsByDay[dtStr] || 0);
      clicks.push(clicksByDay[dtStr] || 0);
    }

    const result = { labels, views, clicks };
    presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }

  const intervalDays = Math.max(6, Math.min(30, daysCount - 1));
  const rows = await query(`
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') as dt, 
      COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_qty,
      COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_qty
    FROM presell_events 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${intervalDays} DAY) ${pageWhere}
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
  `).catch(() => []);

  const viewsByDay = {};
  const clicksByDay = {};
  for (const r of rows) {
    viewsByDay[r.dt] = Number(r.views_qty);
    clicksByDay[r.dt] = Number(r.clicks_qty);
  }

  const labels = [];
  const views = [];
  const clicks = [];
  for (let i = intervalDays; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dtStr = d.toISOString().slice(0, 10);
    const [_, month, day] = dtStr.split('-');
    labels.push(`${day}/${month}`);
    views.push(viewsByDay[dtStr] || 0);
    clicks.push(clicksByDay[dtStr] || 0);
  }

  const result = { labels, views, clicks };
  presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

export async function getPresellButtonStats(pageId, period = '7d') {
  const [periodSql] = getPeriodCondition(period, 'created_at');
  const page = await getPresellById(pageId);
  if (!page) return [];

  const buttons = page.buttons_list || [];
  const clicksData = await query(`
    SELECT btn_index, COUNT(*) as click_count
    FROM presell_events
    WHERE presell_page_id = ? AND event_type = 'click' AND ${periodSql}
    GROUP BY btn_index
  `, [pageId]).catch(() => []);

  const clickMap = {};
  let totalClicks = 0;
  for (const row of clicksData) {
    const idx = row.btn_index !== null ? Number(row.btn_index) : 0;
    const cnt = Number(row.click_count);
    clickMap[idx] = (clickMap[idx] || 0) + cnt;
    totalClicks += cnt;
  }

  const viewsRow = await queryOne(`
    SELECT COUNT(*) as c FROM presell_events 
    WHERE presell_page_id = ? AND event_type = 'view' AND ${periodSql}
  `, [pageId]).catch(() => ({ c: 0 }));
  const views = Number(viewsRow?.c || 0);

  return buttons.map((btn, idx) => {
    const clicks = clickMap[idx] || 0;
    const share_pct = totalClicks > 0 ? Number(((clicks / totalClicks) * 100).toFixed(1)) : 0;
    const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0;

    return {
      index: idx,
      main_text: btn.main_text || `Botão ${idx + 1}`,
      sub_text: btn.sub_text || '',
      url: btn.url || '',
      icon: btn.icon || 'whatsapp',
      bg_color: btn.bg_color || '#22c55e',
      clicks,
      share_pct,
      ctr,
    };
  });
}

export async function getPresellUtmStats(pageId = null, period = '7d', limit = 8) {
  const cacheKey = `utm:${pageId || 'all'}:${period}:${limit}`;
  const cached = presellAnalyticsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < getAnalyticsCacheTtl(period))) {
    return cached.data;
  }

  const [periodSql] = getPeriodCondition(period, 'created_at');
  const pageWhere = pageId ? ` AND presell_page_id = ${parseInt(pageId, 10)}` : '';

  const sources = await query(`
    SELECT 
      COALESCE(NULLIF(utm_source, ''), 'Direto / Orgânico') as source,
      COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_count,
      COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_count
    FROM presell_events
    WHERE ${periodSql} ${pageWhere}
    GROUP BY COALESCE(NULLIF(utm_source, ''), 'Direto / Orgânico')
    ORDER BY clicks_count DESC, views_count DESC
    LIMIT ${parseInt(limit, 10)}
  `).catch(() => []);

  for (const s of sources) {
    const v = Number(s.views_count || 0);
    const c = Number(s.clicks_count || 0);
    s.ctr = v > 0 ? Number(((c / v) * 100).toFixed(1)) : 0;
  }

  const result = { sources, campaigns: [] };
  presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

export async function getPresellDeviceStats(pageId = null, period = '7d') {
  const cacheKey = `device:${pageId || 'all'}:${period}`;
  const cached = presellAnalyticsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < getAnalyticsCacheTtl(period))) {
    return cached.data;
  }

  const [periodSql] = getPeriodCondition(period, 'created_at');
  const pageWhere = pageId ? ` AND presell_page_id = ${parseInt(pageId, 10)}` : '';

  const rows = await query(`
    SELECT device_type, COUNT(*) as qty
    FROM presell_events
    WHERE event_type = 'view' AND ${periodSql} ${pageWhere}
    GROUP BY device_type
  `).catch(() => []);

  const deviceMap = { mobile: 0, desktop: 0, tablet: 0 };
  for (const r of rows) {
    const key = (r.device_type || 'desktop').toLowerCase();
    if (deviceMap[key] !== undefined) deviceMap[key] += Number(r.qty);
    else deviceMap.desktop += Number(r.qty);
  }

  const osList = await query(`
    SELECT os as os_name, COUNT(*) as qty
    FROM presell_events
    WHERE event_type = 'view' AND ${periodSql} ${pageWhere} AND os IS NOT NULL AND os != ''
    GROUP BY os
    ORDER BY qty DESC
    LIMIT 5
  `).catch(() => []);

  const result = { devices: deviceMap, os: osList };
  presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

export async function getPresellGeoStats(pageId = null, period = '7d', limit = 6) {
  const cacheKey = `geo:${pageId || 'all'}:${period}:${limit}`;
  const cached = presellAnalyticsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < getAnalyticsCacheTtl(period))) {
    return cached.data;
  }

  const [periodSql] = getPeriodCondition(period, 'created_at');
  const pageWhere = pageId ? ` AND presell_page_id = ${parseInt(pageId, 10)}` : '';

  const ufNames = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
    BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
    GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
    PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
    SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
  };

  const statesPromise = (async () => {
    const rows = await query(`
      SELECT 
        region as state_code,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_count,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_count
      FROM presell_events
      WHERE ${periodSql} ${pageWhere} AND region IS NOT NULL AND region != ''
      GROUP BY region
      ORDER BY clicks_count DESC, views_count DESC
      LIMIT ${parseInt(limit, 10)}
    `).catch(() => []);

    for (const st of rows) {
      const uf = (st.state_code || '').toUpperCase();
      st.state_name = ufNames[uf] || uf;
      const v = Number(st.views_count || 0);
      const c = Number(st.clicks_count || 0);
      st.ctr = v > 0 ? Number(((c / v) * 100).toFixed(1)) : 0;
    }
    return rows;
  })();

  const citiesPromise = (async () => {
    const topClicks = await query(`
      SELECT city, region, COUNT(*) as clicks_count
      FROM presell_events
      WHERE event_type = 'click' AND city IS NOT NULL AND city != '' AND city != 'Desconhecida' ${periodSql !== '1=1' ? `AND ${periodSql}` : ''} ${pageWhere}
      GROUP BY city, region
      ORDER BY clicks_count DESC
      LIMIT ${parseInt(limit, 10)}
    `).catch(() => []);

    if (topClicks.length === 0) return [];

    const cityConditions = topClicks
      .map((c) => `(city = '${c.city.replace(/'/g, "\\'")}' AND region = '${c.region.replace(/'/g, "\\'")}')`)
      .join(' OR ');

    const viewsRows = await query(`
      SELECT city, region, COUNT(*) as views_count
      FROM presell_events
      WHERE event_type = 'view' AND (${cityConditions}) ${periodSql !== '1=1' ? `AND ${periodSql}` : ''} ${pageWhere}
      GROUP BY city, region
    `).catch(() => []);

    const viewsMap = {};
    for (const r of viewsRows) {
      viewsMap[`${r.city}:${r.region}`] = Number(r.views_count || 0);
    }

    return topClicks.map((c) => {
      const v = viewsMap[`${c.city}:${c.region}`] || 0;
      const clk = Number(c.clicks_count || 0);
      return {
        city_name: c.city,
        state_code: c.region,
        views_count: v,
        clicks_count: clk,
        ctr: v > 0 ? Number(((clk / v) * 100).toFixed(1)) : 0,
      };
    });
  })();

  const [states, cities] = await Promise.all([statesPromise, citiesPromise]);
  const result = { states, cities };
  presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

export async function getPresellAbTestStats(pageId, period = '7d', abEnabled = true) {
  if (abEnabled === false || abEnabled === 0) {
    return {
      A: { views: 0, clicks: 0, uniques: 0, ctr: 0, is_winner: false },
      B: { views: 0, clicks: 0, uniques: 0, ctr: 0, is_winner: false },
    };
  }
  const [periodSql] = getPeriodCondition(period, 'created_at');
  const rows = await query(`
    SELECT 
      variation as var_name,
      COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_count,
      COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_count,
      COUNT(DISTINCT CASE WHEN event_type = 'view' THEN visitor_id END) as uniques_count
    FROM presell_events
    WHERE ${periodSql} AND presell_page_id = ?
    GROUP BY variation
  `, [pageId]).catch(() => []);

  const stats = {
    A: { views: 0, clicks: 0, uniques: 0, ctr: 0, is_winner: false },
    B: { views: 0, clicks: 0, uniques: 0, ctr: 0, is_winner: false },
  };

  for (const r of rows) {
    const v = (r.var_name || 'A').toUpperCase() === 'B' ? 'B' : 'A';
    const views = Number(r.views_count || 0);
    const clicks = Number(r.clicks_count || 0);
    const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0;
    stats[v] = {
      views,
      clicks,
      uniques: Number(r.uniques_count || 0),
      ctr,
      is_winner: false,
    };
  }

  if (stats.A.views >= 5 || stats.B.views >= 5) {
    if (stats.A.ctr > stats.B.ctr) stats.A.is_winner = true;
    else if (stats.B.ctr > stats.A.ctr) stats.B.is_winner = true;
  }

  return stats;
}

export async function getPresellRecentEvents(pageId = null, limit = 12) {
  const pageWhere = pageId ? ` WHERE p.presell_page_id = ${parseInt(pageId, 10)}` : '';
  return await query(`
    SELECT p.*, pg.name as page_name, pg.slug as page_slug
    FROM presell_events p
    LEFT JOIN presell_pages pg ON p.presell_page_id = pg.id
    ${pageWhere}
    ORDER BY p.id DESC
    LIMIT ${parseInt(limit, 10)}
  `).catch(() => []);
}

export async function getAllPagesMetrics(period = '7d') {
  const cacheKey = `allPages:${period}`;
  const cached = presellAnalyticsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < getAnalyticsCacheTtl(period))) {
    return cached.data;
  }

  const [periodSql] = getPeriodCondition(period, 'created_at');
  const rows = await query(`
    SELECT 
      presell_page_id,
      COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views,
      COUNT(DISTINCT CASE WHEN event_type = 'view' THEN visitor_id END) as uniques,
      COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,
      COUNT(CASE WHEN event_type = 'view' AND device_type = 'mobile' THEN 1 END) as mobile_views
    FROM presell_events
    WHERE ${periodSql}
    GROUP BY presell_page_id
  `).catch(() => []);

  const byPage = {};
  for (const r of rows) {
    const views = Number(r.views, 10) || 0;
    const clicks = Number(r.clicks, 10) || 0;
    const uniques = Number(r.uniques, 10) || views;
    byPage[r.presell_page_id] = {
      views,
      clicks,
      uniques,
      ctr: views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0,
    };
  }

  presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: byPage });
  return byPage;
}

export async function getAllPagesButtonStats(period = '7d') {
  const cacheKey = `allButtons:${period}`;
  const cached = presellAnalyticsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < getAnalyticsCacheTtl(period))) {
    return cached.data;
  }

  const [periodSql] = getPeriodCondition(period, 'created_at');
  const rows = await query(`
    SELECT 
      presell_page_id, 
      btn_index, 
      COUNT(*) as click_count
    FROM presell_events
    WHERE event_type = 'click' AND ${periodSql}
    GROUP BY presell_page_id, btn_index
  `).catch(() => []);

  const byPage = {};
  for (const r of rows) {
    const pageId = r.presell_page_id;
    const idx = r.btn_index !== null ? Number(r.btn_index) : 0;
    if (!byPage[pageId]) byPage[pageId] = {};
    byPage[pageId][idx] = Number(r.click_count);
  }

  presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: byPage });
  return byPage;
}

export async function createPresell(data) {
  let baseSlug = data.slug ? slugify(data.slug) : slugify(data.name || 'presell');
  let slug = baseSlug;
  let counter = 1;

  while (await getPresellBySlug(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const buttonsArray = Array.isArray(data.buttons) ? data.buttons : (data.buttons_list || []);
  const stylesArray = {
    badge_font_size: data.badge_font_size || '10px',
    badge_text_color: data.badge_text_color || (data.accent_color || '#22c55e'),
    badge_bg_color: data.badge_bg_color || '',
    headline_font_size: data.headline_font_size || '30px',
    headline_color: data.headline_color || '#ffffff',
    subheadline_font_size: data.subheadline_font_size || '12px',
    subheadline_color: data.subheadline_color || '#94a3b8',
    footer_font_size: data.footer_font_size || '11px',
    footer_text_color: data.footer_text_color || '#64748b',
  };

  const buttonsJson = JSON.stringify({
    buttons: buttonsArray,
    styles: stylesArray,
    social_proof: {
      enabled: data.social_proof_enabled ? 1 : 0,
      text: data.social_proof_text || '{name} de {city} acabou de comprar',
      interval: data.social_proof_interval || 'balanced',
      position: data.social_proof_position || 'bottom-left',
      buyers: Array.isArray(data.social_proof_buyers) ? data.social_proof_buyers : [],
    },
  });

  const result = await execute(`
    INSERT INTO presell_pages (
      name, slug, status, avatar_url, background_url, bg_overlay_opacity,
      accent_color, glow_color, button_color, button_text_color,
      badge_text, headline, subheadline, button_text, button_subtext, footer_text,
      destination_url, pass_utm_params, button_animation, buttons,
      meta_pixel_id, ga4_measurement_id, tiktok_pixel_id, custom_head_code, custom_body_code,
      video_type, video_url, video_autoplay, video_sound_banner,
      pitch_delay_enabled, pitch_delay_seconds, pitch_delay_resume,
      cloak_enabled, cloak_mode, cloak_white_url, cloak_white_headline, cloak_white_content,
      cloak_allowed_countries, cloak_filter_bots, cloak_filter_vpn,
      ab_test_enabled, ab_headline_b, ab_subheadline_b, ab_button_text_b, ab_button_subtext_b,
      ab_button_color_b, ab_button_text_color_b, ab_avatar_url_b,
      social_proof_enabled, social_proof_text, social_proof_interval, social_proof_position,
      views_count, clicks_count, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      0, 0, NOW()
    )
  `, [
    data.name,
    slug,
    data.status || 'active',
    data.avatar_url || null,
    data.background_url || null,
    parseInt(data.bg_overlay_opacity ?? 75, 10) || 75,
    data.accent_color || '#22c55e',
    data.glow_color || '#22c55e',
    data.button_color || '#22c55e',
    data.button_text_color || '#000000',
    data.badge_text || 'COMUNIDADE OFICIAL',
    data.headline || '',
    data.subheadline || '',
    data.button_text || 'ENTRAR NA COMUNIDADE',
    data.button_subtext || '100% gratuito · direto no WhatsApp',
    data.footer_text || null,
    data.destination_url || '',
    Boolean(data.pass_utm_params),
    data.button_animation || 'pulse',
    buttonsJson,
    data.meta_pixel_id || null,
    data.ga4_measurement_id || null,
    data.tiktok_pixel_id || null,
    data.custom_head_code || null,
    data.custom_body_code || null,
    data.video_type || 'none',
    data.video_url || null,
    Boolean(data.video_autoplay),
    Boolean(data.video_sound_banner),
    Boolean(data.pitch_delay_enabled),
    parseInt(data.pitch_delay_seconds || 0, 10) || 0,
    Boolean(data.pitch_delay_resume),
    Boolean(data.cloak_enabled),
    data.cloak_mode || 'white_page',
    data.cloak_white_url || null,
    data.cloak_white_headline || 'Artigo Informativo',
    data.cloak_white_content || null,
    data.cloak_allowed_countries || 'BR',
    Boolean(data.cloak_filter_bots),
    Boolean(data.cloak_filter_vpn),
    Boolean(data.ab_test_enabled),
    data.ab_headline_b || null,
    data.ab_subheadline_b || null,
    data.ab_button_text_b || null,
    data.ab_button_subtext_b || null,
    data.ab_button_color_b || null,
    data.ab_button_text_color_b || null,
    data.ab_avatar_url_b || null,
    Boolean(data.social_proof_enabled),
    data.social_proof_text || '{name} de {city} acabou de comprar',
    data.social_proof_interval || 'balanced',
    data.social_proof_position || 'bottom-left',
  ]);

  return result.insertId;
}

export async function updatePresell(id, data) {
  let slug = data.slug ? slugify(data.slug) : slugify(data.name || 'presell');
  const existing = await queryOne('SELECT id FROM presell_pages WHERE slug = ? AND id != ? LIMIT 1', [slug, id]);
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const buttonsArray = Array.isArray(data.buttons) ? data.buttons : (data.buttons_list || []);
  const stylesArray = {
    badge_font_size: data.badge_font_size || '10px',
    badge_text_color: data.badge_text_color || (data.accent_color || '#22c55e'),
    badge_bg_color: data.badge_bg_color || '',
    headline_font_size: data.headline_font_size || '30px',
    headline_color: data.headline_color || '#ffffff',
    subheadline_font_size: data.subheadline_font_size || '12px',
    subheadline_color: data.subheadline_color || '#94a3b8',
    footer_font_size: data.footer_font_size || '11px',
    footer_text_color: data.footer_text_color || '#64748b',
  };

  const buttonsJson = JSON.stringify({
    buttons: buttonsArray,
    styles: stylesArray,
    social_proof: {
      enabled: data.social_proof_enabled ? 1 : 0,
      text: data.social_proof_text || '{name} de {city} acabou de comprar',
      interval: data.social_proof_interval || 'balanced',
      position: data.social_proof_position || 'bottom-left',
      buyers: Array.isArray(data.social_proof_buyers) ? data.social_proof_buyers : [],
    },
  });

  await execute(`
    UPDATE presell_pages SET
      name = ?, slug = ?, status = ?, avatar_url = ?, background_url = ?, bg_overlay_opacity = ?,
      accent_color = ?, glow_color = ?, button_color = ?, button_text_color = ?,
      badge_text = ?, headline = ?, subheadline = ?, button_text = ?, button_subtext = ?, footer_text = ?,
      destination_url = ?, pass_utm_params = ?, button_animation = ?, buttons = ?,
      meta_pixel_id = ?, ga4_measurement_id = ?, tiktok_pixel_id = ?, custom_head_code = ?, custom_body_code = ?,
      video_type = ?, video_url = ?, video_autoplay = ?, video_sound_banner = ?,
      pitch_delay_enabled = ?, pitch_delay_seconds = ?, pitch_delay_resume = ?,
      cloak_enabled = ?, cloak_mode = ?, cloak_white_url = ?, cloak_white_headline = ?, cloak_white_content = ?,
      cloak_allowed_countries = ?, cloak_filter_bots = ?, cloak_filter_vpn = ?,
      ab_test_enabled = ?, ab_headline_b = ?, ab_subheadline_b = ?, ab_button_text_b = ?, ab_button_subtext_b = ?,
      ab_button_color_b = ?, ab_button_text_color_b = ?, ab_avatar_url_b = ?,
      social_proof_enabled = ?, social_proof_text = ?, social_proof_interval = ?, social_proof_position = ?
    WHERE id = ?
  `, [
    data.name,
    slug,
    data.status || 'active',
    data.avatar_url || null,
    data.background_url || null,
    parseInt(data.bg_overlay_opacity ?? 75, 10) || 75,
    data.accent_color || '#22c55e',
    data.glow_color || '#22c55e',
    data.button_color || '#22c55e',
    data.button_text_color || '#000000',
    data.badge_text || 'COMUNIDADE OFICIAL',
    data.headline || '',
    data.subheadline || '',
    data.button_text || 'ENTRAR NA COMUNIDADE',
    data.button_subtext || '100% gratuito · direto no WhatsApp',
    data.footer_text || null,
    data.destination_url || '',
    Boolean(data.pass_utm_params),
    data.button_animation || 'pulse',
    buttonsJson,
    data.meta_pixel_id || null,
    data.ga4_measurement_id || null,
    data.tiktok_pixel_id || null,
    data.custom_head_code || null,
    data.custom_body_code || null,
    data.video_type || 'none',
    data.video_url || null,
    Boolean(data.video_autoplay),
    Boolean(data.video_sound_banner),
    Boolean(data.pitch_delay_enabled),
    parseInt(data.pitch_delay_seconds || 0, 10) || 0,
    Boolean(data.pitch_delay_resume),
    Boolean(data.cloak_enabled),
    data.cloak_mode || 'white_page',
    data.cloak_white_url || null,
    data.cloak_white_headline || 'Artigo Informativo',
    data.cloak_white_content || null,
    data.cloak_allowed_countries || 'BR',
    Boolean(data.cloak_filter_bots),
    Boolean(data.cloak_filter_vpn),
    Boolean(data.ab_test_enabled),
    data.ab_headline_b || null,
    data.ab_subheadline_b || null,
    data.ab_button_text_b || null,
    data.ab_button_subtext_b || null,
    data.ab_button_color_b || null,
    data.ab_button_text_color_b || null,
    data.ab_avatar_url_b || null,
    Boolean(data.social_proof_enabled),
    data.social_proof_text || '{name} de {city} acabou de comprar',
    data.social_proof_interval || 'balanced',
    data.social_proof_position || 'bottom-left',
    id,
  ]);

  clearPresellEntityCache(id);
  if (slug) clearPresellEntityCache(slug);

  return true;
}

export async function deletePresell(id) {
  await execute('DELETE FROM presell_pages WHERE id = ?', [id]);
  await execute('DELETE FROM presell_events WHERE presell_page_id = ?', [id]);
  clearPresellEntityCache(id);
  return true;
}

export async function clonePresell(id) {
  const original = await getPresellById(id);
  if (!original) return null;

  return await createPresell({
    ...original,
    name: `${original.name} (Cópia)`,
    slug: `${original.slug}-copia-${Math.random().toString(36).substring(2, 6)}`,
  });
}

export async function getAllStatesHeatmap(pageId = null, period = '7d') {
  const [periodSql] = getPeriodCondition(period, 'created_at');
  const pageWhere = pageId ? ` AND presell_page_id = ${parseInt(pageId, 10)}` : '';

  const allUfs = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
    BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
    GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
    PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
    SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
  };

  const rows = await query(`
    SELECT 
      region as uf,
      COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_count,
      COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_count
    FROM presell_events
    WHERE ${periodSql} ${pageWhere} AND region IS NOT NULL AND region != ''
    GROUP BY region
  `).catch(() => []);

  const dataByUf = {};
  let maxViews = 1;

  for (const r of rows) {
    const uf = (r.uf || '').trim().toUpperCase();
    const v = Number(r.views_count || 0);
    const c = Number(r.clicks_count || 0);
    dataByUf[uf] = {
      views: v,
      clicks: c,
      ctr: v > 0 ? Number(((c / v) * 100).toFixed(1)) : 0,
    };
    if (v > maxViews) maxViews = v;
  }

  const heatmap = {};
  for (const [uf, name] of Object.entries(allUfs)) {
    const v = dataByUf[uf]?.views || 0;
    const c = dataByUf[uf]?.clicks || 0;
    const ctr = dataByUf[uf]?.ctr || 0;
    const intensity = maxViews > 0 ? Number(((v / maxViews) * 100).toFixed(1)) : 0;

    heatmap[uf] = {
      name,
      views: v,
      clicks: c,
      ctr,
      intensity,
    };
  }

  return {
    states: heatmap,
    max_views: maxViews,
  };
}

export async function getEventsForExport(pageId = null, period = 'tudo', limit = 5000) {
  const [periodSql] = getPeriodCondition(period, 'p.created_at');
  const pageWhere = pageId ? ` AND p.presell_page_id = ${parseInt(pageId, 10)}` : '';
  const limitClause = limit ? ` LIMIT ${parseInt(limit, 10)}` : '';

  return await query(`
    SELECT 
      p.id,
      p.created_at,
      pg.name as page_name,
      pg.slug as page_slug,
      p.event_type,
      p.variation,
      p.btn_index,
      p.btn_text,
      p.device_type,
      p.os,
      p.browser,
      p.city,
      p.region as state_uf,
      p.country,
      p.ip_address,
      p.utm_source,
      p.utm_medium,
      p.utm_campaign,
      p.utm_content,
      p.utm_term,
      p.src,
      p.referer,
      p.is_bot,
      p.cloak_action
    FROM presell_events p
    LEFT JOIN presell_pages pg ON p.presell_page_id = pg.id
    WHERE ${periodSql} ${pageWhere}
    ORDER BY p.created_at DESC
    ${limitClause}
  `).catch(() => []);
}


const presellAnalyticsInFlight = globalThis._presellAnalyticsInFlight || (globalThis._presellAnalyticsInFlight = new Map());

export async function getPresellFullAnalytics(pageOrId, period = '7d') {
  const pageId = typeof pageOrId === 'object' && pageOrId !== null ? pageOrId.id : pageOrId;
  const cacheKey = `${pageId}:${period}`;
  const cached = presellAnalyticsCache.get(cacheKey);
  const ttl = getAnalyticsCacheTtl(period);

  if (cached && (Date.now() - cached.timestamp < ttl)) {
    return cached.data;
  }

  const fetchFresh = async () => {
    if (presellAnalyticsInFlight.has(cacheKey)) {
      return presellAnalyticsInFlight.get(cacheKey);
    }
    const promise = (async () => {
      try {
        const page = typeof pageOrId === 'object' && pageOrId !== null ? pageOrId : await getPresellById(pageId);
        if (!page) return null;

        const [periodSql, daysCount, cleanPeriod] = getPeriodCondition(period, 'created_at');
        const pageWhere = ` AND presell_page_id = ${parseInt(pageId, 10)}`;
        const useIdx = (cleanPeriod === 'hoje' || cleanPeriod === 'ontem') ? 'USE INDEX (idx_comp_page_created)' : '';

  // Run all optimized queries in parallel
  const [
    summaryData,
    timeSeriesData,
    clicksData,
    sources,
    deviceRows,
    osList,
    stateRows,
    cityRows,
    abStats,
    recentEvents,
    botRows,
  ] = await Promise.all([
    // 1. Summary (Split counts and distinct for 6x MySQL speedup)
    (async () => {
      const [counts, uniquesRow] = await Promise.all([
        queryOne(`
          SELECT 
            COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
            COUNT(CASE WHEN event_type = 'click' THEN 1 END) as total_clicks,
            COUNT(CASE WHEN event_type = 'view' AND device_type = 'mobile' THEN 1 END) as mobile_views,
            COUNT(CASE WHEN event_type = 'view' AND (is_bot = 0 OR is_bot IS NULL OR is_bot = false) THEN 1 END) as human_views,
            COUNT(CASE WHEN event_type = 'view' AND (is_bot = 1 OR is_bot = true) THEN 1 END) as bot_views,
            COUNT(CASE WHEN event_type = 'view' AND (is_bot = 1 OR is_bot = true) AND cloak_action = 'white_page' THEN 1 END) as white_page_views,
            COUNT(CASE WHEN event_type = 'view' AND (is_bot = 1 OR is_bot = true) AND cloak_action = 'safe_redirect' THEN 1 END) as safe_redirect_views,
            COUNT(CASE WHEN event_type = 'view' AND (is_bot = 1 OR is_bot = true) AND cloak_action = 'block_404' THEN 1 END) as block_404_views
          FROM presell_events ${useIdx}
          WHERE ${periodSql} ${pageWhere}
        `).catch(() => ({ total_views: 0, total_clicks: 0, mobile_views: 0, human_views: 0, bot_views: 0, white_page_views: 0, safe_redirect_views: 0, block_404_views: 0 })),
        queryOne(`
          SELECT COUNT(DISTINCT visitor_id) as unique_visitors 
          FROM presell_events 
          WHERE ${periodSql} ${pageWhere} AND event_type = 'view'
        `).catch(() => ({ unique_visitors: 0 }))
      ]);

      let views = Number(counts?.total_views || 0);
      let uniques = Number(uniquesRow?.unique_visitors || 0);
      let clicks = Number(counts?.total_clicks || 0);
      const mobileViews = Number(counts?.mobile_views || 0);
      let humanViews = Number(counts?.human_views || 0);
      let botViews = Number(counts?.bot_views || 0);
      const whitePageViews = Number(counts?.white_page_views || 0);
      const safeRedirectViews = Number(counts?.safe_redirect_views || 0);
      const block404Views = Number(counts?.block_404_views || 0);

      if (views === 0 && clicks === 0 && cleanPeriod === 'tudo') {
        views = Number(page?.views_count || 0);
        clicks = Number(page?.clicks_count || 0);
        uniques = views;
        humanViews = views;
      }

      if (humanViews === 0 && botViews === 0 && views > 0) {
        humanViews = views;
      }

      const mobileRate = views > 0 ? Number(((mobileViews / views) * 100).toFixed(1)) : 0;
      const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0;
      const humanCtr = humanViews > 0 ? Number(((clicks / humanViews) * 100).toFixed(1)) : ctr;

      return {
        views,
        clicks,
        uniques: uniques || views,
        ctr,
        mobileRate,
        human_views: humanViews,
        bot_views: botViews,
        human_ctr: humanCtr,
        white_page_views: whitePageViews,
        safe_redirect_views: safeRedirectViews,
        block_404_views: block404Views,
      };
    })(),

    // 2. Time Series
    (async () => {
      if (cleanPeriod === 'hoje' || cleanPeriod === 'ontem' || /^\d{4}-\d{2}-\d{2}$/.test(cleanPeriod)) {
        const nowBR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const pad = (n) => String(n).padStart(2, '0');
        const today = `${nowBR.getFullYear()}-${pad(nowBR.getMonth() + 1)}-${pad(nowBR.getDate())}`;
        const yesterdayDate = new Date(nowBR.getTime() - 86400000);
        const yesterday = `${yesterdayDate.getFullYear()}-${pad(yesterdayDate.getMonth() + 1)}-${pad(yesterdayDate.getDate())}`;

        let targetDate = cleanPeriod === 'ontem' ? yesterday : (cleanPeriod === 'hoje' ? today : cleanPeriod);
        const tz = isPostgres() ? '-03' : '';

        const rows = await query(`
          SELECT 
            HOUR(created_at) as hr, 
            COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_qty,
            COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_qty
          FROM presell_events ${useIdx}
          WHERE created_at >= '${targetDate} 00:00:00${tz}' AND created_at <= '${targetDate} 23:59:59${tz}' ${pageWhere}
          GROUP BY HOUR(created_at)
        `).catch(() => []);

        const viewsByHr = {};
        const clicksByHr = {};
        for (const r of rows) {
          viewsByHr[r.hr] = Number(r.views_qty);
          clicksByHr[r.hr] = Number(r.clicks_qty);
        }

        const labels = [];
        const views = [];
        const clicks = [];
        for (let h = 0; h <= 23; h++) {
          labels.push(`${String(h).padStart(2, '0')}h`);
          views.push(viewsByHr[h] || 0);
          clicks.push(clicksByHr[h] || 0);
        }

        return { labels, views, clicks };
      }

      if (cleanPeriod === 'tudo') {
        const rows = await query(`
          SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d') as dt, 
            COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_qty,
            COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_qty
          FROM presell_events 
          WHERE 1=1 ${pageWhere}
          GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
          ORDER BY dt ASC
        `).catch(() => []);

        if (rows.length > 0) {
          const viewsByDay = {};
          const clicksByDay = {};
          for (const r of rows) {
            viewsByDay[r.dt] = Number(r.views_qty);
            clicksByDay[r.dt] = Number(r.clicks_qty);
          }

          const activeDates = rows.filter((r) => Number(r.views_qty) > 0 || Number(r.clicks_qty) > 0).map((r) => r.dt);
          const minActiveStr = activeDates[0] || rows[0].dt;
          const maxActiveStr = activeDates[activeDates.length - 1] || rows[rows.length - 1].dt;

          const startDate = new Date(new Date(minActiveStr).getTime() - 86400000);
          const todayDate = new Date();
          const maxActiveTime = new Date(maxActiveStr).getTime();
          const endPaddingDays = Math.min(3, Math.max(1, Math.round((todayDate.getTime() - maxActiveTime) / 86400000)));
          const endDate = new Date(maxActiveTime + endPaddingDays * 86400000);

          const totalDays = Math.max(1, Math.min(60, Math.round((endDate.getTime() - startDate.getTime()) / 86400000)));
          const labels = [];
          const views = [];
          const clicks = [];

          for (let i = 0; i <= totalDays; i++) {
            const d = new Date(startDate.getTime() + i * 86400000);
            const dtStr = d.toISOString().slice(0, 10);
            const [_, month, day] = dtStr.split('-');
            labels.push(`${day}/${month}`);
            views.push(viewsByDay[dtStr] || 0);
            clicks.push(clicksByDay[dtStr] || 0);
          }

          return { labels, views, clicks };
        }
      }

      const customRange = parseCustomDatePeriod(cleanPeriod);
      if (customRange && !customRange.isSingleDay) {
        const tz = isPostgres() ? '-03' : '';
        const rows = await query(`
          SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d') as dt, 
            COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_qty,
            COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_qty
          FROM presell_events ${useIdx}
          WHERE created_at >= '${customRange.startDate} 00:00:00${tz}' AND created_at <= '${customRange.endDate} 23:59:59${tz}' ${pageWhere}
          GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
          ORDER BY dt ASC
        `).catch(() => []);

        const viewsByDay = {};
        const clicksByDay = {};
        for (const r of rows) {
          viewsByDay[r.dt] = Number(r.views_qty);
          clicksByDay[r.dt] = Number(r.clicks_qty);
        }

        const labels = [];
        const views = [];
        const clicks = [];
        const startMs = new Date(`${customRange.startDate}T12:00:00`).getTime();
        for (let i = 0; i < customRange.daysCount; i++) {
          const d = new Date(startMs + i * 86400000);
          const dtStr = d.toISOString().slice(0, 10);
          const [_, month, day] = dtStr.split('-');
          labels.push(`${day}/${month}`);
          views.push(viewsByDay[dtStr] || 0);
          clicks.push(clicksByDay[dtStr] || 0);
        }

        return { labels, views, clicks };
      }

      const intervalDays = Math.max(6, Math.min(30, daysCount - 1));
      const rows = await query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as dt, 
          COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_qty,
          COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_qty
        FROM presell_events 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${intervalDays} DAY) ${pageWhere}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      `).catch(() => []);

      const viewsByDay = {};
      const clicksByDay = {};
      for (const r of rows) {
        viewsByDay[r.dt] = Number(r.views_qty);
        clicksByDay[r.dt] = Number(r.clicks_qty);
      }

      const labels = [];
      const views = [];
      const clicks = [];
      for (let i = intervalDays; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dtStr = d.toISOString().slice(0, 10);
        const [_, month, day] = dtStr.split('-');
        labels.push(`${day}/${month}`);
        views.push(viewsByDay[dtStr] || 0);
        clicks.push(clicksByDay[dtStr] || 0);
      }

      return { labels, views, clicks };
    })(),

    // 3. Button stats
    query(`
      SELECT btn_index, COUNT(*) as click_count
      FROM presell_events
      WHERE presell_page_id = ${parseInt(pageId, 10)} AND event_type = 'click' AND ${periodSql}
      GROUP BY btn_index
    `).catch(() => []),

    // 4. UTM Sources
    query(`
      SELECT 
        COALESCE(NULLIF(utm_source, ''), 'Direto / Orgânico') as source,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_count,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_count
      FROM presell_events
      WHERE ${periodSql} ${pageWhere}
      GROUP BY COALESCE(NULLIF(utm_source, ''), 'Direto / Orgânico')
      ORDER BY clicks_count DESC, views_count DESC
      LIMIT 8
    `).catch(() => []),

    // 5. Device distribution
    query(`
      SELECT device_type, COUNT(*) as qty
      FROM presell_events ${useIdx}
      WHERE event_type = 'view' AND ${periodSql} ${pageWhere}
      GROUP BY device_type
    `).catch(() => []),

    // 6. OS distribution
    query(`
      SELECT os as os_name, COUNT(*) as qty
      FROM presell_events
      WHERE event_type = 'view' AND ${periodSql} ${pageWhere} AND os IS NOT NULL AND os != ''
      GROUP BY os
      ORDER BY qty DESC
      LIMIT 5
    `).catch(() => []),

    // 7. States (Unified: feeds both top states and full Brazil heatmap in one scan!)
    query(`
      SELECT 
        region as uf,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_count,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_count
      FROM presell_events ${useIdx}
      WHERE ${periodSql} ${pageWhere} AND region IS NOT NULL AND region != ''
      GROUP BY region
      ORDER BY clicks_count DESC, views_count DESC
    `).catch(() => []),

    // 8. Cities
    query(`
      SELECT 
        city as city_name,
        region as state_code,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views_count,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks_count
      FROM presell_events ${useIdx}
      WHERE ${periodSql} ${pageWhere} AND city IS NOT NULL AND city != '' AND city != 'Desconhecida'
      GROUP BY city, region
      ORDER BY clicks_count DESC, views_count DESC
      LIMIT 8
    `).catch(() => []),

    // 9. A/B Test Stats - bypassed if ab_test_enabled is false!
    (async () => {
      if (!page.ab_test_enabled) {
        return {
          A: { views: 0, clicks: 0, uniques: 0, ctr: 0, is_winner: false },
          B: { views: 0, clicks: 0, uniques: 0, ctr: 0, is_winner: false },
        };
      }
      return getPresellAbTestStats(pageId, period, true);
    })(),

    // 10. Recent Events
    query(`
      SELECT p.*, pg.name as page_name, pg.slug as page_slug
      FROM presell_events p
      LEFT JOIN presell_pages pg ON p.presell_page_id = pg.id
      WHERE p.presell_page_id = ${parseInt(pageId, 10)}
      ORDER BY p.id DESC
      LIMIT 15
    `).catch(() => []),

    // 11. Cloaker Bot Breakdown
    query(`
      SELECT 
        user_agent,
        COUNT(*) as count
      FROM presell_events
      WHERE ${periodSql} ${pageWhere} AND event_type = 'view' AND (is_bot = 1 OR is_bot = true)
      GROUP BY user_agent
      ORDER BY count DESC
      LIMIT 8
    `).catch(() => []),
  ]);

  // Process Buttons
  const buttons = page.buttons_list || [];
  const clickMap = {};
  let totalBtnClicks = 0;
  for (const row of clicksData) {
    const idx = row.btn_index !== null ? Number(row.btn_index) : 0;
    const cnt = Number(row.click_count);
    clickMap[idx] = (clickMap[idx] || 0) + cnt;
    totalBtnClicks += cnt;
  }
  const buttonStats = buttons.map((btn, idx) => {
    const btnClicks = clickMap[idx] || 0;
    const share_pct = totalBtnClicks > 0 ? Number(((btnClicks / totalBtnClicks) * 100).toFixed(1)) : 0;
    const btnCtr = summaryData.views > 0 ? Number(((btnClicks / summaryData.views) * 100).toFixed(1)) : 0;
    return {
      index: idx,
      main_text: btn.main_text || `Botão ${idx + 1}`,
      sub_text: btn.sub_text || '',
      url: btn.url || '',
      icon: btn.icon || 'whatsapp',
      bg_color: btn.bg_color || '#22c55e',
      clicks: btnClicks,
      share_pct,
      ctr: btnCtr,
    };
  });

  // Process UTM
  for (const s of sources) {
    const v = Number(s.views_count || 0);
    const c = Number(s.clicks_count || 0);
    s.ctr = v > 0 ? Number(((c / v) * 100).toFixed(1)) : 0;
  }
  const utmStats = { sources, campaigns: [] };

  // Process Devices
  const deviceMap = { mobile: 0, desktop: 0, tablet: 0 };
  for (const r of deviceRows) {
    const key = (r.device_type || 'desktop').toLowerCase();
    if (deviceMap[key] !== undefined) deviceMap[key] += Number(r.qty);
    else deviceMap.desktop += Number(r.qty);
  }
  const deviceStats = { devices: deviceMap, os: osList };

  // Process States & Heatmap
  const allUfs = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
    BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
    GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
    PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
    SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
  };
  const dataByUf = {};
  let maxViews = 1;
  const statesFormatted = [];

  for (const r of stateRows) {
    const uf = (r.uf || '').trim().toUpperCase();
    const v = Number(r.views_count || 0);
    const c = Number(r.clicks_count || 0);
    const stateCtr = v > 0 ? Number(((c / v) * 100).toFixed(1)) : 0;
    dataByUf[uf] = { views: v, clicks: c, ctr: stateCtr };
    if (v > maxViews) maxViews = v;

    if (statesFormatted.length < 8) {
      statesFormatted.push({
        state_code: uf,
        state_name: allUfs[uf] || uf,
        views_count: v,
        clicks_count: c,
        ctr: stateCtr,
      });
    }
  }

  const heatmapStates = {};
  for (const [uf, name] of Object.entries(allUfs)) {
    const v = dataByUf[uf]?.views || 0;
    const c = dataByUf[uf]?.clicks || 0;
    const sCtr = dataByUf[uf]?.ctr || 0;
    const intensity = maxViews > 0 ? Number(((v / maxViews) * 100).toFixed(1)) : 0;
    heatmapStates[uf] = { name, views: v, clicks: c, ctr: sCtr, intensity };
  }
  const heatmap = { states: heatmapStates, max_views: maxViews };

  // Process Cities
  for (const ct of cityRows) {
    const v = Number(ct.views_count || 0);
    const c = Number(ct.clicks_count || 0);
    ct.ctr = v > 0 ? Number(((c / v) * 100).toFixed(1)) : 0;
  }
  const geoStats = { states: statesFormatted, cities: cityRows };

  // Process Cloaker Stats
  const topBots = (botRows || []).map((r) => {
    let label = 'Robô / Crawler Desconhecido';
    const ua = (r.user_agent || '').toLowerCase();
    if (ua.includes('facebook') || ua.includes('facebot') || ua.includes('meta-external')) {
      label = 'Meta Ads (Facebook / Instagram Crawler)';
    } else if (ua.includes('googlebot') || ua.includes('adsbot-google') || ua.includes('mediapartners-google')) {
      label = 'Googlebot / Google AdsBot';
    } else if (ua.includes('bytedance') || ua.includes('tiktok')) {
      label = 'TikTok / ByteDance Bot';
    } else if (ua.includes('adheart') || ua.includes('adspy') || ua.includes('bigspy') || ua.includes('adbeat')) {
      label = 'Ferramenta Espiã (AdHeart / AdSpy)';
    } else if (ua.includes('headless') || ua.includes('puppeteer') || ua.includes('selenium') || ua.includes('playwright')) {
      label = 'Scraper Automatizado (Headless / Puppeteer)';
    } else if (ua.includes('curl') || ua.includes('python') || ua.includes('wget') || ua.includes('guzzle')) {
      label = 'Script / HTTP Client Automatizado';
    }
    return {
      label,
      user_agent: r.user_agent || '',
      count: Number(r.count || 0),
    };
  });

  const cloakStats = {
    enabled: Boolean(page.cloak_enabled),
    mode: page.cloak_mode || 'white_page',
    bot_views: summaryData.bot_views,
    human_views: summaryData.human_views,
    white_page_views: summaryData.white_page_views,
    safe_redirect_views: summaryData.safe_redirect_views,
    block_404_views: summaryData.block_404_views,
    human_ctr: summaryData.human_ctr,
    top_bots: topBots,
  };

  const fullData = {
    page,
    summary: summaryData,
    timeSeries: timeSeriesData,
    buttonStats,
    utmStats,
    deviceStats,
    geoStats,
    abStats,
    recentEvents,
    heatmap,
    cloakStats,
  };

        presellAnalyticsCache.set(cacheKey, { timestamp: Date.now(), data: fullData });
        return fullData;
      } finally {
        presellAnalyticsInFlight.delete(cacheKey);
      }
    })();
    presellAnalyticsInFlight.set(cacheKey, promise);
    return promise;
  };

  if (cached) {
    fetchFresh().catch(() => {});
    return cached.data;
  }

  return fetchFresh();
}
