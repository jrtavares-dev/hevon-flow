'use client';

/**
 * Utilitário client-side para anexar UTMs de atribuição nos links de checkout.
 */
export function appendUpsellFlowUtm(rawUrl, campaignName = 'funnel') {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('javascript:')) return trimmed;

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
    const isAbsolute = /^https?:\/\//i.test(trimmed);
    const url = new URL(trimmed, base);
    if (!url.searchParams.get('utm_source')) {
      url.searchParams.set('utm_source', 'hevonflow');
    }
    if (campaignName && !url.searchParams.get('utm_campaign')) {
      url.searchParams.set('utm_campaign', String(campaignName));
    }
    return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return trimmed;
  }
}

export function getHevonClientContext() {
  return {};
}

export function buildHevonClientIdentity() {
  return {};
}

export function trackHevonClientEvent() {
  return Promise.resolve({ skipped: true });
}

export function trackHevonGameStartedOnce() {
  return Promise.resolve({ skipped: true });
}
