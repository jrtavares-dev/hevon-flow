/**
 * Utilitário seguro para resolução de Origin e Redirecionamentos em Produção
 * Evita vazamento de 0.0.0.0 ou 127.0.0.1 gerados por proxies reversos (LiteSpeed/Nginx/PM2)
 */

export function getPublicOrigin(req) {
  const forwardedHost = req?.headers?.get ? req.headers.get('x-forwarded-host') : req?.headers?.['x-forwarded-host'];
  const host = req?.headers?.get ? req.headers.get('host') : req?.headers?.['host'];
  const forwardedProto = (req?.headers?.get ? req.headers.get('x-forwarded-proto') : req?.headers?.['x-forwarded-proto']) || 'https';

  const isInvalidHost = (h) => !h || h.includes('0.0.0.0') || h.includes('127.0.0.1');

  // 1. Host público repassado pelo proxy reverso (LiteSpeed / Nginx / Cloudflare)
  if (forwardedHost && !isInvalidHost(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // 2. Host do cabeçalho HTTP original se preservado
  if (host && !isInvalidHost(host)) {
    return `${forwardedProto}://${host}`;
  }

  // 3. Variável de ambiente configurada no .env de produção
  if (process.env.APP_URL && !isInvalidHost(process.env.APP_URL) && !process.env.APP_URL.includes('localhost')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  // 4. Extração a partir do req.url se for um domínio válido
  if (req?.url) {
    try {
      const parsed = new URL(req.url);
      if (parsed.hostname && !isInvalidHost(parsed.hostname)) {
        return parsed.origin;
      }
    } catch {}
  }

  // 5. Fallback para APP_URL ou localhost
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function getSafeRedirectUrl(targetPath, req) {
  if (typeof targetPath === 'string' && (targetPath.startsWith('http://') || targetPath.startsWith('https://'))) {
    return targetPath;
  }

  const origin = getPublicOrigin(req);
  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  return `${origin}${cleanPath}`;
}
