/**
 * Anti-Bot Cloaker & Traffic Shield
 * 100% Parity with legacy PHP Cloaker.php
 */

const BOT_SIGNATURES = [
  'facebookexternalhit',
  'facebot',
  'meta-externalagent',
  'facebookcatalog',
  'meta-crawler',
  'googlebot',
  'adsbot-google',
  'mediapartners-google',
  'apis-google',
  'feedfetcher-google',
  'google-read-aloud',
  'bytedancespider',
  'tiktokbot',
  'bytedance',
  'twitterbot',
  'telegrambot',
  'whatsapp',
  'linkedinbot',
  'pinterestbot',
  'slackbot',
  'applebot',
  'bingbot',
  'msnbot',
  'yandex',
  'duckduckbot',
  'baiduspider',
  'sogou',
  'exabot',
  'adbeat',
  'adheart',
  'adspy',
  'bigspy',
  'dropispy',
  'anstrex',
  'semrushbot',
  'ahrefsbot',
  'dotbot',
  'rogerbot',
  'screaming frog',
  'headlesschrome',
  'phantomjs',
  'selenium',
  'puppeteer',
  'playwright',
  'webdriver',
  'python-requests',
  'python-urllib',
  'aiohttp',
  'curl/',
  'wget/',
  'httpclient',
  'guzzlehttp',
  'postmanruntime',
  'insomnia',
  'go-http-client',
  'java/',
  'apache-httpclient',
  'libwww-perl',
  'okhttp',
];

const DATA_CENTER_SIGNATURES = [
  'amazon',
  'aws',
  'google',
  'microsoft',
  'azure',
  'digitalocean',
  'hetzner',
  'ovh',
  'linode',
  'leaseweb',
  'vultr',
  'choopa',
  'alibaba',
  'tencent',
  'oracle',
  'facebook',
  'meta',
  'fastly',
  'akamai',
  'cloudflare',
  'm247',
  'cogent',
  'quadranet',
  'contabo',
  'kamatera',
];

export function isBot(userAgent = '') {
  if (!userAgent || userAgent.length < 10) return true;
  const ua = userAgent.toLowerCase();
  for (const sig of BOT_SIGNATURES) {
    if (ua.includes(sig)) {
      return true;
    }
  }
  return false;
}

export function isDataCenter(org = '') {
  if (!org) return false;
  const lower = org.toLowerCase();
  for (const dc of DATA_CENTER_SIGNATURES) {
    if (lower.includes(dc)) {
      return true;
    }
  }
  return false;
}

/**
 * Evaluates request against Cloaker & Anti-Bot shield rules
 * @param {Object} presell - presell page database record
 * @param {string} userAgent - User Agent header
 * @param {string} ip - Client IP
 * @param {Object} geoInfo - Geolocation info object
 * @returns {Object} { isBlocked, action, reason, whiteUrl, whiteHeadline, whiteContent }
 */
export function checkCloak(presell, userAgent = '', ip = '', geoInfo = {}) {
  // If cloaker is not enabled on this page, allow immediately
  if (!presell?.cloak_enabled) {
    return {
      isBlocked: false,
      action: 'allow',
      reason: 'cloaker_disabled',
    };
  }

  const ua = (userAgent || '').toLowerCase();

  // 1. Bot User-Agent Filter
  if (presell.cloak_filter_bots) {
    if (!ua || ua.length < 10) {
      return blockResult(presell, 'empty_or_suspicious_ua');
    }

    for (const sig of BOT_SIGNATURES) {
      if (ua.includes(sig)) {
        return blockResult(presell, `bot_user_agent (${sig})`);
      }
    }
  }

  // 2. Data Center / Hosting ASN Filter
  if (presell.cloak_filter_vpn) {
    const org = (geoInfo?.org || geoInfo?.isp || geoInfo?.as || '').toLowerCase();
    if (isDataCenter(org)) {
      return blockResult(presell, `datacenter_ip (${org})`);
    }
  }

  // 3. Country Filter
  const allowed = (presell.cloak_allowed_countries || '').trim();
  if (allowed) {
    const allowedList = allowed.split(',').map((c) => c.trim().toUpperCase());
    const userCountry = (geoInfo?.country_code || 'BR').toUpperCase();

    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');

    if (!isLocal && !allowedList.includes(userCountry)) {
      return blockResult(presell, `country_mismatch (${userCountry})`);
    }
  }

  return {
    isBlocked: false,
    action: 'allow',
    reason: 'verified_human',
  };
}

function blockResult(presell, reason) {
  const mode = presell.cloak_mode || 'white_page';
  return {
    isBlocked: true,
    action: mode, // 'white_page' | 'safe_redirect' | 'block_404'
    reason,
    whiteUrl: presell.cloak_white_url || '',
    whiteHeadline: presell.cloak_white_headline || 'Portal de Notícias & Informações',
    whiteContent: presell.cloak_white_content || getDefaultWhiteContent(presell),
  };
}

export function getDefaultWhiteContent(presell) {
  const name = presell?.name || 'Informativo Oficial';
  const headline = presell?.cloak_white_headline || 'Tendências e Dicas Exclusivas';
  const date = new Date().toLocaleDateString('pt-BR');

  return `
    <p class="lead">Bem-vindo ao canal oficial de comunicação e artigos informativos de <strong>${name}</strong>. Atualizado em ${date}.</p>
    <h3 class="fw-bold mt-4 mb-2">Sobre a Nossa Iniciativa</h3>
    <p>Nossa plataforma tem como objetivo compartilhar conhecimento, dicas práticas e conteúdo educativo para nossa comunidade. Todos os materiais são rigorosamente revisados e preparados de acordo com as melhores práticas e diretrizes éticas da web.</p>
    <h3 class="fw-bold mt-4 mb-2">Termos de Uso e Transparência</h3>
    <p>Valorizamos a privacidade e a segurança de todos os nossos visitantes. Todas as informações veiculadas neste portal destinam-se exclusivamente a fins informativos e de engajamento comunitário saudável.</p>
    <p>Para dúvidas, suporte ou sugestões de pautas, entre em contato através dos nossos canais de atendimento oficiais.</p>
  `;
}

export default {
  isBot,
  isDataCenter,
  checkCloak,
  getDefaultWhiteContent,
};
