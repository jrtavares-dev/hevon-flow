import { query, queryOne, execute } from './db.js';
import crypto from 'crypto';

export const VISITOR_COOKIE_NAME = 'uf_visitor_id';

export function getClientIp(req) {
  // Support both Next.js Request (Headers object) and plain object
  const getHeader = (name) => {
    if (!req) return null;
    if (typeof req.headers?.get === 'function') return req.headers.get(name);
    if (req.headers && req.headers[name]) return req.headers[name];
    return null;
  };

  const cfIp = getHeader('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwarded = getHeader('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = getHeader('x-real-ip');
  if (realIp) return realIp.trim();

  return req?.socket?.remoteAddress || '127.0.0.1';
}

export function getUserAgent(req) {
  if (!req) return '';
  if (typeof req.headers?.get === 'function') return req.headers.get('user-agent') || '';
  if (req.headers && req.headers['user-agent']) return req.headers['user-agent'];
  return '';
}

export function detectDeviceType(userAgent = '') {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'desktop';

  // 1. Tablets explícitos (iPad, tablet, playbook, etc.)
  if (/(ipad|tablet|playbook|silk)/i.test(ua)) {
    return 'tablet';
  }

  // 2. Dispositivos móveis (smartphones, Android com mobile, iPhones, etc.)
  if (/(mobi|mobile|ipod|iphone|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|iemobile|fennec|netfront)/i.test(ua)) {
    return 'mobile';
  }

  // 3. Android puro SEM nenhuma menção a mobi/mobile na string inteira é tablet Android
  if (/android/i.test(ua) && !/mobi|mobile/i.test(ua)) {
    return 'tablet';
  }

  // 4. Se tiver Android, é mobile
  if (/android/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

export function detectOS(userAgent = '') {
  const ua = userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Outro';
}

export function detectBrowser(userAgent = '') {
  const ua = userAgent || '';
  if (/Edg/i.test(ua)) return 'Edge';
  if (/OPR|Opera/i.test(ua)) return 'Opera';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  return 'Outro';
}

export function isPrivateIp(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  return ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.');
}

// In-memory cache de alta velocidade para IP GeoIP (elimina gargalo de rate limit da API e do banco)
const ipMemoryCache = globalThis._ipMemoryCache || (globalThis._ipMemoryCache = new Map());
const IP_CACHE_MAX_ENTRIES = 10000;
const IP_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
let geoApiCooldownUntil = 0; // Circuit breaker: evita travar o Node quando ip-api bloquear (45 req/min em lives)

/**
 * Geolocation resolver de altíssima performance:
 * 1. Memória RAM (0ms)
 * 2. Headers de CDN/Cloudflare (0ms)
 * 3. Cache local no banco (ip_cache)
 * 4. Fallback instantâneo padrão Brasil (evita congelar na live em rate-limits de APIs externas)
 */
export async function resolveGeoLocation(ip = '127.0.0.1', reqOrHeaders = null) {
  if (isPrivateIp(ip)) {
    return {
      ip,
      city: 'São Paulo',
      region: 'SP',
      region_name: 'São Paulo',
      country: 'Brasil',
      country_code: 'BR',
      is_local: true,
    };
  }

  // 1. Checar memória RAM (Ultra Rápido - 0ms)
  const memCached = ipMemoryCache.get(ip);
  if (memCached && (Date.now() - memCached.timestamp < IP_CACHE_TTL_MS)) {
    return memCached.data;
  }

  // 2. Checar cabeçalhos de CDN / Cloudflare se fornecidos
  if (reqOrHeaders) {
    const getH = (name) => {
      if (typeof reqOrHeaders.get === 'function') return reqOrHeaders.get(name);
      if (typeof reqOrHeaders.headers?.get === 'function') return reqOrHeaders.headers.get(name);
      if (reqOrHeaders[name]) return reqOrHeaders[name];
      if (reqOrHeaders.headers && reqOrHeaders.headers[name]) return reqOrHeaders.headers[name];
      return null;
    };
    const cfCountry = getH('cf-ipcountry');
    const cfCity = getH('cf-ipcity');
    const cfRegion = getH('cf-region') || getH('cf-region-code');
    // Só usa cabeçalho de região se for válido e não vazio
    if (cfRegion && cfRegion.trim().length > 0) {
      const loc = {
        ip,
        city: cfCity ? decodeURIComponent(cfCity) : null,
        region: cfRegion.toUpperCase().trim(),
        region_name: cfRegion.trim(),
        country: cfCountry === 'BR' ? 'Brasil' : (cfCountry || 'Brasil'),
        country_code: (cfCountry || 'BR').toUpperCase(),
        is_local: false,
      };
      if (ipMemoryCache.size >= IP_CACHE_MAX_ENTRIES) {
        const firstKey = ipMemoryCache.keys().next().value;
        ipMemoryCache.delete(firstKey);
      }
      ipMemoryCache.set(ip, { timestamp: Date.now(), data: loc });
      return loc;
    }
  }

  // 3. Checar cache do banco de dados (ip_cache - Ultra Rápido 1-3ms)
  try {
    const cached = await queryOne(
      'SELECT city, region, region_name, country, country_code FROM ip_cache WHERE ip_address = ? LIMIT 1',
      [ip]
    );
    if (cached && (cached.region || cached.city)) {
      const loc = {
        ip,
        city: cached.city || null,
        region: cached.region ? cached.region.toUpperCase().trim() : null,
        region_name: cached.region_name || cached.region || null,
        country: cached.country || 'Brasil',
        country_code: cached.country_code || 'BR',
        is_local: false,
      };
      if (ipMemoryCache.size >= IP_CACHE_MAX_ENTRIES) {
        const firstKey = ipMemoryCache.keys().next().value;
        ipMemoryCache.delete(firstKey);
      }
      ipMemoryCache.set(ip, { timestamp: Date.now(), data: loc });
      return loc;
    }
  } catch (err) {
    console.warn('GeoIP db cache lookup error:', err?.message || err);
  }

  // 4. Resolução externa protegida por Circuit Breaker (evita travar em lives com >45 req/min no ip-api)
  if (Date.now() > geoApiCooldownUntil) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 300);

      const res = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon`,
        {
          signal: controller.signal,
          headers: { 'User-Agent': 'UpsellFlow-GeoIP/1.0' },
        }
      );
      clearTimeout(timeout);

      if (res.status === 429) {
        geoApiCooldownUntil = Date.now() + 60 * 1000;
      } else if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'success' && data.region) {
          const resolved = {
            ip,
            city: data.city || null,
            region: data.region ? data.region.toUpperCase() : null,
            region_name: data.regionName || data.region || null,
            country: data.country || 'Brasil',
            country_code: data.countryCode ? data.countryCode.toUpperCase() : 'BR',
            is_local: false,
          };

          if (ipMemoryCache.size >= IP_CACHE_MAX_ENTRIES) {
            const firstKey = ipMemoryCache.keys().next().value;
            ipMemoryCache.delete(firstKey);
          }
          ipMemoryCache.set(ip, { timestamp: Date.now(), data: resolved });

          execute(
            `INSERT INTO ip_cache (ip_address, country, country_code, region, region_name, city, latitude, longitude, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              ip,
              resolved.country,
              resolved.country_code,
              resolved.region,
              resolved.region_name,
              resolved.city,
              data.lat || null,
              data.lon || null,
            ]
          ).catch(() => {});

          return resolved;
        }
      }
    } catch {
      geoApiCooldownUntil = Date.now() + 15 * 1000;
    }
  }

  // 5. Fallback limpo imediato (0ms)
  return {
    ip,
    city: null,
    region: null,
    region_name: null,
    country: 'Brasil',
    country_code: 'BR',
    is_local: false,
  };
}

export async function getOrCreateVisitor(req, visitorCookieValue = null) {
  try {
    if (visitorCookieValue) {
      const visitor = await queryOne('SELECT id, visitor_hash FROM visitors WHERE visitor_hash = ? LIMIT 1', [
        visitorCookieValue,
      ]);
      if (visitor) return visitor.id;
    }

    const hash = crypto.randomBytes(32).toString('hex');
    const ip = getClientIp(req);
    const ua = getUserAgent(req);

    const result = await execute(
      'INSERT INTO visitors (visitor_hash, ip_address, user_agent, created_at) VALUES (?, ?, ?, NOW())',
      [hash, ip, ua]
    );

    return result.insertId;
  } catch (err) {
    console.error('Tracking getOrCreateVisitor Error:', err);
    return null;
  }
}

export async function logEvent({
  visitorId = null,
  sessionId = null,
  campaignId = null,
  levelId = null,
  eventType = 'page_view',
  eventData = {},
}) {
  try {
    let finalCampaignId = campaignId;

    if (!finalCampaignId && sessionId) {
      const session = await queryOne('SELECT campaign_id FROM upsell_sessions WHERE id = ? LIMIT 1', [sessionId]);
      if (session) finalCampaignId = session.campaign_id;
    } else if (!finalCampaignId && levelId) {
      const level = await queryOne('SELECT campaign_id FROM campaign_levels WHERE id = ? LIMIT 1', [levelId]);
      if (level) finalCampaignId = level.campaign_id;
    }

    const jsonData = typeof eventData === 'string' ? eventData : JSON.stringify(eventData);

    await execute(
      `INSERT INTO events (visitor_id, upsell_session_id, campaign_id, campaign_level_id, event_type, event_data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [visitorId, sessionId, finalCampaignId, levelId, eventType, jsonData]
    );

    return true;
  } catch (err) {
    console.error('Tracking logEvent Error:', err);
    return false;
  }
}

/**
 * Auto-detects traffic source from Referer string when utm_source is empty
 */
export function detectSourceFromReferer(referer = '') {
  if (!referer) return null;
  const ref = referer.toLowerCase();
  if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) return 'Instagram (Orgânico)';
  if (ref.includes('facebook.com') || ref.includes('l.facebook.com') || ref.includes('fb.com')) return 'Facebook (Orgânico)';
  if (ref.includes('tiktok.com')) return 'TikTok (Orgânico)';
  if (ref.includes('google.')) return 'Google (Orgânico)';
  if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'YouTube (Orgânico)';
  if (ref.includes('whatsapp.com') || ref.includes('wa.me')) return 'WhatsApp (Direto)';
  if (ref.includes('t.co') || ref.includes('twitter.com') || ref.includes('x.com')) return 'X / Twitter';
  return null;
}

/**
 * Granular presell event logger with full 1:1 parity with legacy PHP Tracking::logPresellEvent
 */
export async function logPresellEvent({
  pageId,
  presellId,
  visitorId = null,
  eventType = 'view', // 'view' | 'click'
  btnIndex = null,
  btnText = null,
  params = {},
  variation = 'A',
  isBot = 0,
  cloakAction = 'allowed',
  device = null,
  os = null,
  browser = null,
  city = null,
  region = null,
  country = 'Brasil',
  ip = null,
  userAgent = null,
  referer = null,
}) {
  const targetId = pageId || presellId;
  if (!targetId) return;

  try {
    const finalDevice = device || detectDeviceType(userAgent);
    const finalOs = os || detectOS(userAgent);
    const finalBrowser = browser || detectBrowser(userAgent);

    let utmSource = params.utm_source ? String(params.utm_source).trim() : null;
    const utmMedium = params.utm_medium ? String(params.utm_medium).trim() : null;
    const utmCampaign = params.utm_campaign ? String(params.utm_campaign).trim() : null;
    const utmContent = params.utm_content ? String(params.utm_content).trim() : null;
    const utmTerm = params.utm_term ? String(params.utm_term).trim() : null;
    const src = params.src ? String(params.src).trim() : null;

    if (!utmSource && referer) {
      utmSource = detectSourceFromReferer(referer);
    }

    await execute(
      `INSERT INTO presell_events (
        presell_page_id, visitor_id, event_type, variation, is_bot, cloak_action,
        btn_index, btn_text,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, src,
        device_type, os, browser, city, region, country, ip_address, user_agent, referer, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
      )`,
      [
        targetId,
        visitorId,
        eventType,
        variation ? variation.toUpperCase() : 'A',
        isBot ? 1 : 0,
        cloakAction || 'allowed',
        btnIndex !== null ? Number(btnIndex) : null,
        btnText || null,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        src,
        finalDevice,
        finalOs,
        finalBrowser,
        city || null,
        region || null,
        country || 'Brasil',
        ip || null,
        userAgent || null,
        referer || null,
      ]
    );

    // Keep denormalized counters updated (buffered in memory to eliminate row-lock waits during live traffic)
    if (eventType === 'view') {
      bufferPresellView(targetId);
    } else if (eventType === 'click') {
      bufferPresellClick(targetId);
    }
  } catch (err) {
    console.error('logPresellEvent Error:', err);
  }
}

// In-memory counter buffers for high-traffic presell views and clicks (eliminates row-lock contention on presell_pages)
const presellViewsBuffer = globalThis._presellViewsBuffer || (globalThis._presellViewsBuffer = new Map());
const presellClicksBuffer = globalThis._presellClicksBuffer || (globalThis._presellClicksBuffer = new Map());
let isFlushingViews = false;
let isFlushingClicks = false;

function bufferPresellView(pageId) {
  const current = presellViewsBuffer.get(pageId) || 0;
  presellViewsBuffer.set(pageId, current + 1);

  if (!isFlushingViews && !globalThis._viewsFlushTimer) {
    globalThis._viewsFlushTimer = setTimeout(flushPresellViews, 5000);
  }
}

function bufferPresellClick(pageId) {
  const current = presellClicksBuffer.get(pageId) || 0;
  presellClicksBuffer.set(pageId, current + 1);

  if (!isFlushingClicks && !globalThis._clicksFlushTimer) {
    globalThis._clicksFlushTimer = setTimeout(flushPresellClicks, 3000);
  }
}

async function flushPresellViews() {
  globalThis._viewsFlushTimer = null;
  if (presellViewsBuffer.size === 0 || isFlushingViews) return;
  isFlushingViews = true;

  const entries = Array.from(presellViewsBuffer.entries());
  presellViewsBuffer.clear();

  for (const [pageId, count] of entries) {
    if (count > 0) {
      try {
        await execute('UPDATE presell_pages SET views_count = views_count + ? WHERE id = ?', [count, pageId]);
      } catch (err) {
        console.warn('Buffered views flush error:', err?.message || err);
      }
    }
  }
  isFlushingViews = false;
}

async function flushPresellClicks() {
  globalThis._clicksFlushTimer = null;
  if (presellClicksBuffer.size === 0 || isFlushingClicks) return;
  isFlushingClicks = true;

  const entries = Array.from(presellClicksBuffer.entries());
  presellClicksBuffer.clear();

  for (const [pageId, count] of entries) {
    if (count > 0) {
      try {
        await execute('UPDATE presell_pages SET clicks_count = clicks_count + ? WHERE id = ?', [count, pageId]);
      } catch (err) {
        console.warn('Buffered clicks flush error:', err?.message || err);
      }
    }
  }
  isFlushingClicks = false;
}

export default {
  getClientIp,
  getUserAgent,
  detectDeviceType,
  detectOS,
  detectBrowser,
  isPrivateIp,
  resolveGeoLocation,
  getOrCreateVisitor,
  logEvent,
  detectSourceFromReferer,
  logPresellEvent,
};
