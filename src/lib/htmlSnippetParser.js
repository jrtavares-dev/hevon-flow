/**
 * Utilitários puros para extração e parsing seguro de meta tags e snippets HTML
 * injetados nas Configurações Globais do UpsellFlow.
 */

const REACT_ATTR_MAP = {
  charset: 'charSet',
  'http-equiv': 'httpEquiv',
  crossorigin: 'crossOrigin',
  referrerpolicy: 'referrerPolicy',
  fetchpriority: 'fetchPriority',
  nomodule: 'noModule',
  class: 'className',
  for: 'htmlFor',
  itemprop: 'itemProp',
  imagesrcset: 'imageSrcSet',
  imagesizes: 'imageSizes',
};

const BOOLEAN_ATTRS = new Set(['async', 'defer', 'noModule', 'disabled']);

/**
 * Extrai apenas o valor do atributo `content="..."` caso o usuário cole uma tag
 * `<meta name="..." content="..." />` inteira no campo de verificação de domínio.
 * Se o usuário colar apenas o código puro, retorna o código limpo.
 */
export function extractMetaVerificationContent(rawInput) {
  if (typeof rawInput !== 'string') return '';
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  // Se parece uma tag HTML <meta ...>
  if (trimmed.includes('<') && /<meta\b/i.test(trimmed)) {
    const contentMatch = trimmed.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`\/]+))/i);
    if (contentMatch) {
      const extracted = (contentMatch[1] ?? contentMatch[2] ?? contentMatch[3] ?? '').trim();
      if (extracted) return extracted;
    }
  }

  // Remove eventuais aspas externas acidentais
  return trimmed.replace(/^["']+|["']+$/g, '').trim();
}

/**
 * Faz o parse dos atributos de uma tag HTML (ex: name="foo" content="bar" async)
 * e converte os nomes de atributos para o padrão esperado pelo React JSX.
 */
export function parseHtmlAttributes(attrString = '') {
  const attrs = {};
  if (!attrString || !attrString.trim()) return attrs;

  const attrRegex = /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = attrRegex.exec(attrString)) !== null) {
    const rawName = match[1];
    if (!rawName || rawName === '/') continue;

    const lowerName = rawName.toLowerCase();
    // Evita atributos de evento inline perigosos ou inválidos no JSX do servidor
    if (lowerName.startsWith('on')) continue;

    const reactName = REACT_ATTR_MAP[lowerName] || (lowerName.startsWith('data-') || lowerName.startsWith('aria-') ? lowerName : lowerName);
    const hasValue = match[2] !== undefined || match[3] !== undefined || match[4] !== undefined;
    const rawValue = match[2] ?? match[3] ?? match[4] ?? '';

    if (BOOLEAN_ATTRS.has(reactName)) {
      attrs[reactName] = true;
    } else if (!hasValue) {
      attrs[reactName] = '';
    } else {
      attrs[reactName] = rawValue;
    }
  }

  return attrs;
}

/**
 * Remove comentários HTML <!-- ... -->
 */
export function stripHtmlComments(html = '') {
  if (typeof html !== 'string') return '';
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Faz o parse de um bloco de HTML voltado para o `<head>`:
 * - `headTags`: `<meta>`, `<link>`, `<style>` (renderizados diretamente no `<head>` via SSR)
 * - `scriptTags`: `<script>` (renderizados pelo injetor de scripts respeitando escopo admin/público)
 * - `noscriptTags`: `<noscript>` (renderizados no body)
 */
export function parseHeadSnippets(rawHtml = '') {
  const headTags = [];
  const scriptTags = [];
  const noscriptTags = [];

  if (typeof rawHtml !== 'string' || !rawHtml.trim()) {
    return { headTags, scriptTags, noscriptTags };
  }

  const cleaned = stripHtmlComments(rawHtml);

  // Captura <script ...>...</script>, <style ...>...</style>, <noscript ...>...</noscript>, <meta ...>, <link ...>
  const tokenRegex =
    /<(script|style|noscript)\b([^>]*)>([\s\S]*?)<\/\1>|<(meta|link)\b([^>]*?)\s*\/?>/gi;

  let match;
  while ((match = tokenRegex.exec(cleaned)) !== null) {
    if (match[1]) {
      const tag = match[1].toLowerCase();
      const attrs = parseHtmlAttributes(match[2] || '');
      const content = (match[3] || '').trim();

      if (tag === 'script') {
        scriptTags.push({ tag: 'script', attrs, content });
      } else if (tag === 'style') {
        headTags.push({ tag: 'style', attrs, content });
      } else if (tag === 'noscript') {
        noscriptTags.push({ tag: 'noscript', attrs, content });
      }
    } else if (match[4]) {
      const tag = match[4].toLowerCase();
      const attrs = parseHtmlAttributes(match[5] || '');
      headTags.push({ tag, attrs, content: '' });
    }
  }

  return { headTags, scriptTags, noscriptTags };
}

/**
 * Sanitiza IDs simples de analytics/pixels removendo espaços e tags acidentais
 */
export function sanitizeTrackingId(rawValue = '') {
  if (typeof rawValue !== 'string') return '';
  return rawValue.trim().replace(/\s+/g, '');
}
