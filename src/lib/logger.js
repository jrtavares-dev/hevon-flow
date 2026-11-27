import crypto from 'crypto';

/**
 * Logger estruturado e sanitizado para produção (Fase 05: OBS-02)
 * Garante conformidade com LGPD e segurança: nunca loga senhas, cartões, CPFs ou tokens completos.
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'card',
  'cvv',
  'card_number',
  'document',
  'cpf',
  'key',
  'authorization',
];

export function sanitizeLogData(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    // Mascarar CPFs básicos ou cartões se passados em string
    return data.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '***.***.***-**');
  }
  if (typeof data !== 'object') return data;

  try {
    const copy = Array.isArray(data) ? [...data] : { ...data };
    for (const [k, v] of Object.entries(copy)) {
      const lower = k.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
        copy[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        copy[k] = sanitizeLogData(v);
      }
    }
    return copy;
  } catch {
    return '[Unserializable]';
  }
}

export function generateCorrelationId() {
  return crypto.randomBytes(8).toString('hex');
}

export const logger = {
  info(message, context = {}) {
    const payload = {
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...sanitizeLogData(context),
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(payload));
    } else {
      console.log(`[INFO] ${message}`, Object.keys(context).length ? context : '');
    }
  },

  warn(message, context = {}) {
    const payload = {
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...sanitizeLogData(context),
    };
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(payload));
    } else {
      console.warn(`[WARN] ${message}`, Object.keys(context).length ? context : '');
    }
  },

  error(message, error = null, context = {}) {
    const payload = {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error_message: error?.message || String(error || ''),
      error_code: error?.code || 'UNKNOWN_ERROR',
      ...sanitizeLogData(context),
    };
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(payload));
    } else {
      console.error(`[ERROR] ${message}`, error?.message || error, context);
    }
  },
};
