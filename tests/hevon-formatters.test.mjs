import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDateBR,
  formatTimeBR,
  formatDateTimeBR,
} from '../src/lib/formatters.js';

test('HEVON Formatters: Zero ≠ Vazio (retorna "—" para null/undefined/NaN e valor real para 0)', () => {
  assert.equal(formatCurrency(null), '—');
  assert.equal(formatCurrency(undefined), '—');
  assert.equal(formatCurrency(NaN), '—');
  assert.match(formatCurrency(0), /^R\$\s0,00$/);
  assert.match(formatCurrency(1234567.89), /^R\$\s1\.234\.567,89$/);

  assert.equal(formatNumber(null), '—');
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(176432), '176.432');

  assert.equal(formatPercent(undefined), '—');
  assert.equal(formatPercent(0), '0,0%');
  assert.equal(formatPercent(24.56, 1), '24,6%');
});

test('HEVON Formatters: formata datas e horários no fuso America/Sao_Paulo', () => {
  assert.equal(formatDateBR(null), '—');
  assert.equal(formatTimeBR(null), '—');
  assert.equal(formatDateTimeBR('invalid-date'), '—');

  // 2026-11-26T17:30:00Z = 14:30 BRT (America/Sao_Paulo, UTC-3)
  const iso = '2026-11-26T17:30:00.000Z';
  assert.equal(formatDateBR(iso), '26/11/2026');
  assert.equal(formatTimeBR(iso), '14:30');
  assert.equal(formatDateTimeBR(iso), '26/11/2026 14:30');
});
