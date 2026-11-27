import { notFound, redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { getPresellBySlug } from '@/lib/models/presell';
import { checkCloak } from '@/lib/cloaker';
import {
  logPresellEvent,
  getClientIp,
  getUserAgent,
  detectDeviceType,
  detectOS,
  detectBrowser,
  resolveGeoLocation,
} from '@/lib/tracking';
import PresellPageView from '@/components/PresellPageView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const presell = await getPresellBySlug(slug);
    if (!presell) return { title: 'Página Não Encontrada · UpsellFlow' };

    return {
      title: `${presell.headline || presell.name} - ${presell.badge_text || 'Comunidade Oficial'}`,
      description: presell.subheadline || 'Acesso Exclusivo à Comunidade',
      openGraph: {
        title: presell.headline || presell.name,
        description: presell.subheadline || 'Acesso Exclusivo à Comunidade',
        images: presell.avatar_url ? [presell.avatar_url] : [],
      },
    };
  } catch {
    return { title: 'UpsellFlow · Comunidade Oficial' };
  }
}

export default async function PublicPresellPage({ params, searchParams }) {
  const { slug } = await params;
  const rawParams = await searchParams;
  
  let presell = null;
  try {
    presell = await getPresellBySlug(slug);
  } catch (err) {
    console.error('PublicPresellPage getPresell error:', err);
  }

  if (!presell) {
    notFound();
  }

  // Header and visitor metadata
  const headerList = await headers();
  const cookieStore = await cookies();
  const ua = getUserAgent({ headers: headerList });
  const ip = getClientIp({ headers: headerList });

  const device = detectDeviceType(ua);
  const os = detectOS(ua);
  const browser = detectBrowser(ua);
  const referer = headerList.get('referer');

  // Só aguarda GeoIP antes da renderização se o Cloaker estiver ativo na página
  const geo = presell.cloak_enabled
    ? await resolveGeoLocation(ip, headerList)
    : { city: null, region: null, country: 'Brasil', country_code: 'BR' };

  // Status check
  if (presell.status !== 'active') {
    const adminSession = cookieStore.get('upsellflow_session')?.value;
    if (!adminSession) {
      return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark text-white p-4 text-center">
          <div>
            <h1 className="h4 fw-bold mb-2">Página Temporariamente Indisponível</h1>
            <p className="text-secondary small">Esta página está temporariamente desativada pelo administrador.</p>
          </div>
        </div>
      );
    }
  }

  // 1. Cloaker & Anti-Bot Shield Check
  const isTestingWhite = rawParams?.test_white === '1' || rawParams?.preview_cloak === '1';
  let cloak = checkCloak(presell, ua, ip, geo);
  if (isTestingWhite) {
    cloak = {
      isBlocked: true,
      action: 'white_page',
      reason: 'admin_preview_test',
      whiteUrl: presell.cloak_white_url || '',
      whiteHeadline: presell.cloak_white_headline || 'Portal de Notícias & Informações',
      whiteContent: presell.cloak_white_content || '',
    };
  }

  if (cloak.isBlocked) {
    // Log cloaked bot event
    await logPresellEvent({
      pageId: presell.id,
      eventType: 'view',
      variation: 'A',
      isBot: 1,
      cloakAction: cloak.action,
      params: rawParams,
      device,
      os,
      browser,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      ip,
      userAgent: ua,
      referer: headerList.get('referer'),
    });

    if (cloak.action === 'block_404') {
      notFound();
    }

    if (cloak.action === 'safe_redirect' && cloak.whiteUrl) {
      redirect(cloak.whiteUrl);
    }

    // Default: White Page (Clean editorial article for bots & compliance reviewers)
    return (
      <html lang="pt-BR">
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{`${cloak.whiteHeadline} - ${presell.name}`}</title>
          <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"
            rel="stylesheet"
          />
          <style>{`
            * { box-sizing: border-box; }
            .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              background-color: #f8fafc;
              color: #334155;
              line-height: 1.7;
            }
            .navbar { background: #ffffff; border-bottom: 1px solid #e2e8f0; }
            .article-container {
              max-width: 800px;
              margin: 40px auto;
              background: #ffffff;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .badge-category {
              background-color: #e0e7ff;
              color: #4338ca;
              font-weight: 700;
              font-size: 12px;
              padding: 6px 12px;
              border-radius: 20px;
              text-transform: uppercase;
            }
            footer {
              margin-top: 60px;
              padding: 30px 0;
              border-top: 1px solid #e2e8f0;
              color: #94a3b8;
              font-size: 13px;
            }
          `}</style>
        </head>
        <body>
          <nav className="navbar navbar-light">
            <div className="container" style={{ maxWidth: '800px' }}>
              <span className="navbar-brand mb-0 h1 fw-bold text-dark">{presell.name}</span>
              <span className="text-muted small">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </nav>
          <main className="container">
            <div className="article-container">
              <span className="badge-category mb-3 d-inline-block">Informativo Oficial</span>
              <h1 className="fw-bold mb-3 text-dark">{cloak.whiteHeadline}</h1>
              <div className="d-flex align-items-center mb-4 text-muted small pb-3 border-bottom">
                <span>Por <strong>Redação Editorial</strong></span>
                <span className="mx-2">&bull;</span>
                <span>Leitura de 3 min</span>
              </div>
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: cloak.whiteContent }}
              />
            </div>
          </main>
          <footer className="text-center">
            <div className="container">
              &copy; {new Date().getFullYear()} {presell.name} &bull; Todos os direitos reservados.
            </div>
          </footer>
        </body>
      </html>
    );
  }

  // 2. A/B Testing Rotation (50/50 Split)
  let variation = 'A';
  if (presell.ab_test_enabled) {
    const abCookieKey = `ps_ab_${presell.id}`;
    const existingVariant = cookieStore.get(abCookieKey)?.value;
    if (existingVariant === 'A' || existingVariant === 'B') {
      variation = existingVariant;
    } else {
      variation = Math.random() < 0.5 ? 'A' : 'B';
    }
  }

  // Apply Variation B overrides
  const effectivePresell = { ...presell };
  if (variation === 'B') {
    if (presell.ab_headline_b) effectivePresell.headline = presell.ab_headline_b;
    if (presell.ab_subheadline_b) effectivePresell.subheadline = presell.ab_subheadline_b;
    if (presell.ab_avatar_url_b) effectivePresell.avatar_url = presell.ab_avatar_url_b;
  }

  // Process buttons list
  let buttons = effectivePresell.buttons_list || [];
  if (buttons.length === 0) {
    buttons = [
      {
        id: 'btn_1',
        type: 'primary',
        main_text: effectivePresell.button_text || 'ENTRAR NA COMUNIDADE',
        sub_text: effectivePresell.button_subtext || '100% gratuito · direto no WhatsApp',
        url: effectivePresell.destination_url || '',
        icon: 'whatsapp',
        bg_color: effectivePresell.button_color || '#22c55e',
        text_color: effectivePresell.button_text_color || '#000000',
        animation: effectivePresell.button_animation || 'pulse',
        pass_utm: 1,
      },
    ];
  }

  // If Variation B has button overrides, apply to primary button
  if (variation === 'B' && buttons[0]) {
    buttons[0] = {
      ...buttons[0],
      main_text: presell.ab_button_text_b || buttons[0].main_text,
      sub_text: presell.ab_button_subtext_b || buttons[0].sub_text,
      bg_color: presell.ab_button_color_b || buttons[0].bg_color,
      text_color: presell.ab_button_text_color_b || buttons[0].text_color,
    };
  }

  // Build tracking URL for each button: /p/{slug}/go?btn={idx}&v={variation}&...queryParams
  const trackingButtons = buttons
    .filter((btn) => !btn.hidden && !btn.is_hidden && btn.visible !== false)
    .map((btn, idx) => {
    const params = new URLSearchParams(rawParams || {});
    params.set('btn', String(idx));
    params.set('v', variation);
    return {
      ...btn,
      track_url: `/p/${slug}/go?${params.toString()}`,
    };
  });

  // 3. Log view event 100% em background (não bloqueia a renderização da página na live)
  (async () => {
    try {
      const resolvedGeo = presell.cloak_enabled
        ? geo
        : await resolveGeoLocation(ip, headerList);
      await logPresellEvent({
        pageId: presell.id,
        eventType: 'view',
        variation,
        isBot: 0,
        cloakAction: 'allowed',
        params: rawParams,
        device,
        os,
        browser,
        city: resolvedGeo.city,
        region: resolvedGeo.region,
        country: resolvedGeo.country,
        ip,
        userAgent: ua,
        referer,
      });
    } catch (err) {
      console.error('logPresellEvent bg error:', err);
    }
  })();

  return (
    <>
      {effectivePresell.custom_head_code && (
        <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: effectivePresell.custom_head_code }} />
      )}
      <PresellPageView
        presell={effectivePresell}
        buttons={trackingButtons}
        variation={variation}
        queryParams={rawParams}
      />
      {effectivePresell.custom_body_code && (
        <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: effectivePresell.custom_body_code }} />
      )}
    </>
  );
}
