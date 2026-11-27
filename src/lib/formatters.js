/**
 * HEVON Design System v2.0 — Formatadores Canônicos de Dados
 * Regras:
 * - Zero ≠ Vazio ≠ Carregando (nunca inventa fallback "0" quando dado é null/undefined/NaN; exibe "—")
 * - Dinheiro sempre pt-BR com exatamente 2 casas decimais
 * - Quantidades com separador de milhar pt-BR
 * - Datas e horas no fuso padrão America/Sao_Paulo (DD/MM/YYYY e HH:MM)
 */

const BR_TIMEZONE = 'America/Sao_Paulo';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

export function isMissingMetric(value) {
  return value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value));
}

export function formatCurrency(value) {
  if (isMissingMetric(value)) return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return currencyFormatter.format(num);
}

export function formatNumber(value) {
  if (isMissingMetric(value)) return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return integerFormatter.format(num);
}

export function formatPercent(value, decimals = 1) {
  if (isMissingMetric(value)) return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function formatDateBR(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', {
    timeZone: BR_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTimeBR(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('pt-BR', {
    timeZone: BR_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTimeBR(value) {
  if (!value) return '—';
  const dateStr = formatDateBR(value);
  const timeStr = formatTimeBR(value);
  if (dateStr === '—' || timeStr === '—') return '—';
  return `${dateStr} ${timeStr}`;
}
