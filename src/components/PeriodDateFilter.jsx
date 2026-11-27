'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Check, X } from 'lucide-react';

function getTodayBrazilISO() {
  try {
    const nowBR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const pad = (n) => String(n).padStart(2, '0');
    return `${nowBR.getFullYear()}-${pad(nowBR.getMonth() + 1)}-${pad(nowBR.getDate())}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function parsePeriodDates(period) {
  if (!period || typeof period !== 'string') return null;
  const single = period.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (single) {
    const d = single[1];
    const [y, m, day] = d.split('-');
    return {
      mode: 'single',
      startDate: d,
      endDate: d,
      buttonLabel: `${day}/${m}/${y}`,
    };
  }
  const range = period.match(/^(\d{4}-\d{2}-\d{2})[_~](\d{4}-\d{2}-\d{2})$/);
  if (range) {
    let [, d1, d2] = range;
    if (d1 > d2) {
      const t = d1;
      d1 = d2;
      d2 = t;
    }
    const [y1, m1, day1] = d1.split('-');
    const [, m2, day2] = d2.split('-');
    if (d1 === d2) {
      return {
        mode: 'single',
        startDate: d1,
        endDate: d1,
        buttonLabel: `${day1}/${m1}/${y1}`,
      };
    }
    return {
      mode: 'range',
      startDate: d1,
      endDate: d2,
      buttonLabel: `${day1}/${m1} a ${day2}/${m2}`,
    };
  }
  return null;
}

export default function PeriodDateFilter({ basePath, currentPeriod = 'tudo' }) {
  const router = useRouter();
  const parsed = parsePeriodDates(currentPeriod);
  const isCustomActive = Boolean(parsed);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(parsed?.mode || 'single'); // 'single' | 'range'
  const [startDate, setStartDate] = useState(() => parsed?.startDate || getTodayBrazilISO());
  const [endDate, setEndDate] = useState(() => parsed?.endDate || getTodayBrazilISO());
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const p = parsePeriodDates(currentPeriod);
    if (p) {
      setMode(p.mode);
      setStartDate(p.startDate);
      setEndDate(p.endDate);
    }
  }, [currentPeriod]);

  const updatePosition = () => {
    if (!buttonRef.current || typeof window === 'undefined') return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 285;
    const left = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, rect.right - popoverWidth));
    const top = rect.bottom + 8;
    setPopoverPos({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleApply = (e) => {
    e.preventDefault();
    if (!startDate) return;

    let targetPeriod = startDate;
    if (mode === 'range' && endDate && endDate !== startDate) {
      const d1 = startDate <= endDate ? startDate : endDate;
      const d2 = startDate <= endDate ? endDate : startDate;
      targetPeriod = `${d1}_${d2}`;
    }

    setOpen(false);
    const sep = basePath.includes('?') ? '&' : '?';
    router.push(`${basePath}${sep}period=${targetPeriod}`);
  };

  const handleClear = () => {
    setOpen(false);
    const sep = basePath.includes('?') ? '&' : '?';
    router.push(`${basePath}${sep}period=7d`);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          updatePosition();
          setOpen((prev) => !prev);
        }}
        className={`period-pill d-inline-flex align-items-center gap-1.5 border-0 ${isCustomActive ? 'active' : ''}`}
        style={{
          cursor: 'pointer',
          background: isCustomActive ? undefined : 'transparent',
          whiteSpace: 'nowrap',
        }}
        title="Filtrar por data específica ou intervalo de datas"
      >
        <Calendar size={13} />
        <span>{isCustomActive ? parsed.buttonLabel : 'Data'}</span>
      </button>

      {open && (
        <div
          className="rounded-3 p-3"
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            zIndex: 9999,
            width: '285px',
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--popover-foreground))',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="fw-semibold d-inline-flex align-items-center gap-1.5" style={{ fontSize: '12.5px' }}>
              <Calendar size={14} style={{ color: 'hsl(var(--primary))' }} />
              <span>Filtrar por Data</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-sm p-0 border-0 text-muted bg-transparent"
              style={{ lineHeight: 1, minHeight: 'auto', height: 'auto' }}
              title="Fechar"
            >
              <X size={15} />
            </button>
          </div>

          {/* Seletor Dia Único vs Intervalo */}
          <div
            className="d-flex p-1 rounded-2 mb-3"
            style={{
              background: 'hsl(var(--muted) / 0.65)',
              border: '1px solid hsl(var(--border) / 0.7)',
            }}
          >
            <button
              type="button"
              onClick={() => setMode('single')}
              className="flex-fill border-0 rounded-1 py-1 fw-semibold"
              style={{
                fontSize: '11.5px',
                background: mode === 'single' ? 'hsl(var(--primary))' : 'transparent',
                color: mode === 'single' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                transition: 'all 0.15s ease',
              }}
            >
              Dia Específico
            </button>
            <button
              type="button"
              onClick={() => setMode('range')}
              className="flex-fill border-0 rounded-1 py-1 fw-semibold"
              style={{
                fontSize: '11.5px',
                background: mode === 'range' ? 'hsl(var(--primary))' : 'transparent',
                color: mode === 'range' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                transition: 'all 0.15s ease',
              }}
            >
              Intervalo (De / Até)
            </button>
          </div>

          <form onSubmit={handleApply}>
            <div className="mb-2">
              <label
                className="form-label mb-1 fw-semibold text-muted"
                style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                {mode === 'single' ? 'Selecione o Dia' : 'Data Inicial (De)'}
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                max={getTodayBrazilISO()}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (mode === 'single' || e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                required
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              />
            </div>

            {mode === 'range' && (
              <div className="mb-3">
                <label
                  className="form-label mb-1 fw-semibold text-muted"
                  style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  Data Final (Até)
                </label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={endDate}
                  min={startDate}
                  max={getTodayBrazilISO()}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                />
              </div>
            )}

            <div className="d-flex align-items-center gap-2 mt-3">
              {isCustomActive && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn btn-sm btn-light border flex-shrink-0"
                  style={{ fontSize: '11.5px', fontWeight: 600, height: '32px' }}
                >
                  Limpar
                </button>
              )}
              <button
                type="submit"
                className="btn btn-sm btn-primary flex-fill d-inline-flex align-items-center justify-content-center gap-1.5"
                style={{ fontSize: '12px', fontWeight: 700, height: '32px' }}
              >
                <Check size={14} />
                <span>Aplicar Data</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
