'use client';

import React, { useState, useId, useRef, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import HevonEmptyState from '@/components/hevon/HevonEmptyState';

function getSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const tension = 0.2;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Gráfico Analítico HEVON (Baseline 4):
 * - Sem gridlines e sem poluição de eixo Y
 * - Máximo de 2 cores: hsl(var(--primary)) + hsl(var(--muted-foreground) / 0.28)
 * - Legenda discreta no canto inferior esquerdo + tooltip sob demanda
 */
export default function DashboardRevenueChart({
  labels = [],
  values = [],
  secondaryValues = null,
  height = 240,
  unitLabel = 'Visualizações',
  secondaryLabel = 'Cliques',
  valuePrefix = '',
  valueSuffix = '',
  decimals = 0,
}) {
  const chartId = useId().replace(/:/g, '');
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const measured = containerRef.current.clientWidth;
        if (measured > 0) setContainerWidth(measured);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const totalPoints = labels.length;

  if (totalPoints === 0) {
    return (
      <div style={{ minHeight: height }} className="d-flex align-items-center justify-content-center">
        <HevonEmptyState
          icon={BarChart3}
          title="Nenhum registro no período selecionado"
          description="Os dados da série temporal aparecerão automaticamente assim que houver atividade."
        />
      </div>
    );
  }

  const hasSecondary = Array.isArray(secondaryValues) && secondaryValues.length === totalPoints;
  const maxVal = Math.max(...values, ...(hasSecondary ? secondaryValues : [0]), 1);
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 8;
  const padRight = 8;
  const plotWidth = Math.max(containerWidth - padLeft - padRight, 120);
  const plotHeight = height - padTop - padBottom;

  const points = values.map((v, i) => {
    const x =
      totalPoints === 1
        ? padLeft + plotWidth / 2
        : padLeft + (i / (totalPoints - 1)) * plotWidth;
    const y = padTop + plotHeight - (Number(v || 0) / maxVal) * plotHeight;
    const secVal = hasSecondary ? Number(secondaryValues[i] || 0) : null;
    const secY =
      hasSecondary ? padTop + plotHeight - (secVal / maxVal) * plotHeight : null;
    return { x, y, v: Number(v || 0), secVal, secY, label: labels[i] };
  });

  const linePath = getSmoothPath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotHeight).toFixed(1)} Z`
      : '';

  const secLinePath = hasSecondary
    ? getSmoothPath(points.map((p) => ({ x: p.x, y: p.secY })))
    : '';

  const targetLabelCount = Math.min(Math.max(Math.floor(containerWidth / 100), 3), 7);
  const labelIndices = [];
  if (totalPoints <= targetLabelCount) {
    for (let i = 0; i < totalPoints; i++) labelIndices.push(i);
  } else {
    labelIndices.push(0);
    const step = (totalPoints - 1) / (targetLabelCount - 1);
    for (let i = 1; i < targetLabelCount - 1; i++) {
      labelIndices.push(Math.round(i * step));
    }
    labelIndices.push(totalPoints - 1);
  }

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  const formatVal = (val) =>
    `${valuePrefix}${Number(val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${valueSuffix}`;

  return (
    <div
      ref={containerRef}
      className="position-relative w-100 user-select-none"
      style={{ overflow: 'visible' }}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg
        viewBox={`0 0 ${containerWidth} ${height}`}
        style={{ width: '100%', height, display: 'block', overflow: 'visible' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          if (points.length === 0) return;
          let closestIdx = 0;
          let minDist = Infinity;
          points.forEach((pt, idx) => {
            const dist = Math.abs(pt.x - mouseX);
            if (dist < minDist) {
              minDist = dist;
              closestIdx = idx;
            }
          });
          setHoverIndex(closestIdx);
        }}
      >
        <defs>
          <linearGradient id={`hevonArea-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.14" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Baseline discreta (sem gridlines no corpo do gráfico) */}
        <line
          x1={padLeft}
          y1={padTop + plotHeight}
          x2={containerWidth - padRight}
          y2={padTop + plotHeight}
          stroke="hsl(var(--border) / 0.7)"
          strokeWidth="1"
        />

        {/* Série secundária (comparação/base) */}
        {hasSecondary && secLinePath && (
          <path
            d={secLinePath}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.35)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 4"
          />
        )}

        {/* Área e linha principal (hsl(var(--primary))) */}
        {areaPath && <path d={areaPath} fill={`url(#hevonArea-${chartId})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Crosshair vertical no hover */}
        {activePoint && (
          <line
            x1={activePoint.x}
            y1={padTop}
            x2={activePoint.x}
            y2={padTop + plotHeight}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Pontos ativos */}
        {activePoint && (
          <g>
            {hasSecondary && (
              <circle
                cx={activePoint.x}
                cy={activePoint.secY}
                r="3.5"
                fill="hsl(var(--muted-foreground))"
                stroke="hsl(var(--card))"
                strokeWidth="2"
              />
            )}
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--card))"
              strokeWidth="2"
            />
          </g>
        )}

        {/* Rótulos do eixo X (piso 10px) */}
        {labelIndices.map((idx) => {
          const pt = points[idx];
          if (!pt) return null;
          return (
            <text
              key={idx}
              x={pt.x}
              y={height - 6}
              textAnchor={idx === 0 ? 'start' : idx === totalPoints - 1 ? 'end' : 'middle'}
              fill="hsl(var(--muted-foreground))"
              fontSize="11"
              fontWeight="500"
              fontFamily="inherit"
            >
              {pt.label}
            </text>
          );
        })}
      </svg>

      {/* Legenda discreta no canto inferior esquerdo */}
      <div className="d-flex align-items-center gap-3 mt-2 pt-1">
        <span className="d-inline-flex align-items-center gap-1.5 hevon-data-secondary">
          <span
            style={{
              width: 10,
              height: 3,
              borderRadius: 2,
              background: 'hsl(var(--primary))',
              display: 'inline-block',
            }}
          />
          <span>{unitLabel}</span>
        </span>
        {hasSecondary && (
          <span className="d-inline-flex align-items-center gap-1.5 hevon-data-secondary">
            <span
              style={{
                width: 10,
                height: 2,
                borderTop: '2px dashed hsl(var(--muted-foreground) / 0.55)',
                display: 'inline-block',
              }}
            />
            <span>{secondaryLabel}</span>
          </span>
        )}
      </div>

      {/* Tooltip sob demanda */}
      {activePoint && (
        <div
          className="position-absolute pointer-events-none"
          style={{
            left: `${Math.min(Math.max(activePoint.x, 80), containerWidth - 80)}px`,
            top: `${Math.max(activePoint.y - 14, 0)}px`,
            transform: 'translate(-50%, -100%)',
            background: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-md)',
            padding: '8px 12px',
            fontSize: '11.5px',
            zIndex: 30,
            whiteSpace: 'nowrap',
          }}
        >
          <div className="hevon-data-secondary mb-1">{activePoint.label}</div>
          <div className="d-flex align-items-center justify-content-between gap-3 hevon-tabular">
            <span style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{unitLabel}</span>
            <span className="fw-semibold">{formatVal(activePoint.v)}</span>
          </div>
          {hasSecondary && (
            <div className="d-flex align-items-center justify-content-between gap-3 mt-0.5 hevon-tabular">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{secondaryLabel}</span>
              <span className="fw-medium">{Number(activePoint.secVal || 0).toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
