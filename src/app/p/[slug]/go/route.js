import { NextResponse } from 'next/server';
import { getPresellBySlug } from '@/lib/models/presell';
import { getSafeRedirectUrl } from '@/lib/urlHelper';
import {
  logPresellEvent,
  getClientIp,
  getUserAgent,
  detectDeviceType,
  detectOS,
  detectBrowser,
  resolveGeoLocation,
} from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  const { slug } = await params;
  const presell = await getPresellBySlug(slug);

  if (!presell) {
    return NextResponse.redirect(getSafeRedirectUrl('/', request));
  }

  const { searchParams } = new URL(request.url);
  const btnParam = searchParams.get('btn') || searchParams.get('btn_id') || '0';
  const btnIndex = parseInt(btnParam, 10) || 0;
  const variation = searchParams.get('v') || 'A';

  const buttons = presell.buttons_list || [];
  let destination = presell.destination_url || 'https://chat.whatsapp.com/';
  let btnText = presell.button_text || 'Botão';

  if (buttons[btnIndex] && buttons[btnIndex].url) {
    destination = buttons[btnIndex].url;
    btnText = buttons[btnIndex].main_text || `Botão ${btnIndex + 1}`;
  } else if (searchParams.get('dest')) {
    destination = decodeURIComponent(searchParams.get('dest'));
  }

  // Extract client metadata (sem aguardar rede externa antes do redirect)
  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  const device = detectDeviceType(ua);
  const os = detectOS(ua);
  const browser = detectBrowser(ua);
  const referer = request.headers.get('referer') || null;

  // Convert searchParams to plain object
  const queryParamsObj = {};
  searchParams.forEach((val, key) => {
    queryParamsObj[key] = val;
  });

  // Resolve GeoIP e grava o clique 100% em background (redirect instantâneo em 0ms na live)
  (async () => {
    try {
      const geo = await resolveGeoLocation(ip, request);
      await logPresellEvent({
        pageId: presell.id,
        eventType: 'click',
        btnIndex,
        btnText,
        params: queryParamsObj,
        variation,
        isBot: 0,
        cloakAction: 'allowed',
        device,
        os,
        browser,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        ip,
        userAgent: ua,
        referer,
      });
    } catch (err) {
      console.error('logPresellEvent click bg error:', err);
    }
  })();

  // Append query params if pass_utm_params is enabled + preserva/garante UTM para checkouts
  const isWhatsappDest = /(?:chat\.whatsapp\.com|wa\.me|api\.whatsapp\.com)/i.test(destination);
  if (presell.pass_utm_params || !isWhatsappDest) {
    const forwardParams = new URLSearchParams();
    searchParams.forEach((val, key) => {
      if (!['btn', 'btn_id', 'dest', 'v'].includes(key)) {
        forwardParams.append(key, val);
      }
    });

    try {
      const destUrl = new URL(destination);
      forwardParams.forEach((val, key) => {
        if (!destUrl.searchParams.has(key)) {
          destUrl.searchParams.set(key, val);
        }
      });
      if (!isWhatsappDest) {
        if (!destUrl.searchParams.get('utm_source')) {
          destUrl.searchParams.set('utm_source', 'upsellflow');
        }
        if (!destUrl.searchParams.get('utm_campaign')) {
          destUrl.searchParams.set('utm_campaign', slug);
        }
      }
      destination = destUrl.toString();
    } catch {
      const queryString = forwardParams.toString();
      if (queryString) {
        const sep = destination.includes('?') ? '&' : '?';
        destination = `${destination}${sep}${queryString}`;
      }
    }
  }

  const response = NextResponse.redirect(destination, { status: 302 });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}
