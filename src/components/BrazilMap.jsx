'use client';

import { useState, useRef, useEffect } from 'react';
import { Flame, Eye, MousePointerClick, Zap, Trophy, MapPin } from 'lucide-react';

const STATE_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
  BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

const STATE_PATHS = {
  AC: 'M 45,280 L 75,275 L 85,290 L 80,305 L 55,315 L 30,305 L 30,290 Z',
  AM: 'M 65,185 L 140,155 L 180,185 L 205,210 L 195,270 L 155,270 L 130,285 L 85,290 L 75,275 L 45,280 L 40,250 L 55,210 Z',
  RR: 'M 145,110 L 175,95 L 190,135 L 180,185 L 140,155 Z',
  AP: 'M 285,110 L 310,100 L 320,135 L 295,155 L 280,135 Z',
  PA: 'M 205,210 L 180,185 L 190,135 L 280,135 L 295,155 L 285,180 L 320,195 L 335,245 L 305,285 L 275,295 L 245,295 L 235,260 L 195,270 Z',
  RO: 'M 130,285 L 155,270 L 175,295 L 165,340 L 130,340 L 115,315 Z',
  TO: 'M 305,285 L 335,245 L 345,260 L 340,345 L 315,355 L 300,325 Z',
  MA: 'M 320,195 L 360,185 L 375,220 L 365,265 L 335,245 Z',
  PI: 'M 360,185 L 385,190 L 395,245 L 375,285 L 365,265 L 375,220 Z',
  CE: 'M 385,190 L 420,195 L 420,230 L 395,245 Z',
  RN: 'M 420,195 L 450,200 L 445,225 L 420,220 Z',
  PB: 'M 420,220 L 450,225 L 445,240 L 415,240 Z',
  PE: 'M 395,245 L 445,240 L 445,255 L 375,265 Z',
  AL: 'M 425,255 L 445,255 L 435,270 L 420,265 Z',
  SE: 'M 415,270 L 435,270 L 425,285 L 410,280 Z',
  BA: 'M 375,285 L 395,245 L 415,270 L 425,285 L 420,345 L 385,380 L 355,360 L 340,345 L 345,260 L 365,265 Z',
  MT: 'M 195,270 L 235,260 L 245,295 L 275,295 L 285,345 L 270,390 L 215,385 L 195,355 L 175,295 L 155,270 Z',
  GO: 'M 285,345 L 315,355 L 320,410 L 285,420 L 270,390 Z',
  DF: 'M 310,375 L 325,375 L 325,388 L 310,388 Z',
  MS: 'M 215,385 L 270,390 L 285,420 L 260,470 L 210,445 L 205,405 Z',
  MG: 'M 315,355 L 355,360 L 385,380 L 395,430 L 365,455 L 315,445 L 285,420 L 320,410 Z',
  ES: 'M 395,405 L 415,410 L 410,440 L 395,430 Z',
  RJ: 'M 365,455 L 395,440 L 390,465 L 360,465 Z',
  SP: 'M 260,470 L 285,420 L 315,445 L 360,465 L 330,490 L 275,490 Z',
  PR: 'M 260,470 L 275,490 L 320,500 L 290,530 L 240,510 Z',
  SC: 'M 240,510 L 290,530 L 285,550 L 245,545 Z',
  RS: 'M 245,545 L 285,550 L 275,595 L 225,590 L 220,545 Z',
};

const STATE_LABELS = [
  { uf: 'AC', x: 55, y: 295, size: 9 },
  { uf: 'AM', x: 110, y: 235, size: 11 },
  { uf: 'RR', x: 165, y: 145, size: 9 },
  { uf: 'AP', x: 295, y: 130, size: 9 },
  { uf: 'PA', x: 250, y: 220, size: 11 },
  { uf: 'RO', x: 145, y: 310, size: 9 },
  { uf: 'TO', x: 325, y: 300, size: 10 },
  { uf: 'MA', x: 350, y: 225, size: 10 },
  { uf: 'PI', x: 380, y: 235, size: 10 },
  { uf: 'CE', x: 405, y: 215, size: 10 },
  { uf: 'RN', x: 435, y: 210, size: 8.5 },
  { uf: 'PB', x: 432, y: 230, size: 8.5 },
  { uf: 'PE', x: 415, y: 250, size: 9.5 },
  { uf: 'AL', x: 435, y: 262, size: 8 },
  { uf: 'SE', x: 423, y: 277, size: 8 },
  { uf: 'BA', x: 380, y: 330, size: 12 },
  { uf: 'MT', x: 230, y: 330, size: 11 },
  { uf: 'GO', x: 295, y: 390, size: 10 },
  { uf: 'DF', x: 318, y: 382, size: 8 },
  { uf: 'MS', x: 245, y: 435, size: 10 },
  { uf: 'MG', x: 340, y: 410, size: 11 },
  { uf: 'ES', x: 405, y: 425, size: 8.5 },
  { uf: 'RJ', x: 380, y: 460, size: 9 },
  { uf: 'SP', x: 300, y: 465, size: 11 },
  { uf: 'PR', x: 270, y: 505, size: 10 },
  { uf: 'SC', x: 265, y: 530, size: 9.5 },
  { uf: 'RS', x: 250, y: 575, size: 11 },
];

function getHeatColor(intensity, views, isDark = false, isHovered = false) {
  if (!views || views === 0) {
    if (isDark) {
      return isHovered ? '#202636' : '#141722';
    }
    return isHovered ? '#cbd5e1' : '#e2e8f0';
  }

  if (isDark) {
    // Escala monocromática sofisticada Esmeralda (Orven Design System)
    if (intensity >= 80) return isHovered ? '#34d399' : '#10b981';
    if (intensity >= 60) return isHovered ? '#10b981' : 'rgba(16, 185, 129, 0.75)';
    if (intensity >= 40) return isHovered ? 'rgba(16, 185, 129, 0.75)' : 'rgba(16, 185, 129, 0.50)';
    if (intensity >= 20) return isHovered ? 'rgba(16, 185, 129, 0.50)' : 'rgba(16, 185, 129, 0.32)';
    if (intensity >= 1)  return isHovered ? 'rgba(16, 185, 129, 0.32)' : 'rgba(16, 185, 129, 0.18)';
    return isHovered ? '#202636' : '#141722';
  } else {
    // Paleta limpa diurna
    if (intensity >= 80) return isHovered ? '#059669' : '#10b981';
    if (intensity >= 60) return isHovered ? '#10b981' : '#34d399';
    if (intensity >= 40) return isHovered ? '#34d399' : '#6ee7b7';
    if (intensity >= 20) return isHovered ? '#6ee7b7' : '#a7f3d0';
    if (intensity >= 1)  return isHovered ? '#a7f3d0' : '#d1fae5';
    return '#e2e8f0';
  }
}

function getHeatStatus(intensity, views) {
  if (!views || views === 0) return { icon: '●', text: 'Sem Tráfego' };
  if (intensity >= 80) return { icon: '●', text: 'Top Volume' };
  if (intensity >= 60) return { icon: '●', text: 'Alto Volume' };
  if (intensity >= 40) return { icon: '●', text: 'Moderado' };
  return { icon: '●', text: 'Ativo' };
}

export default function BrazilMap({ heatmap = { states: {}, max_views: 1 } }) {
  const [tooltip, setTooltip] = useState(null);
  const [highlightedUf, setHighlightedUf] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const mapContainerRef = useRef(null);

  // Monitora atributo data-theme em tempo real para sincronia com o toggle
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark');
    };

    checkTheme();

    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const statesData = heatmap?.states || {};

  // Rank states by views then clicks
  const rankedStates = Object.entries(statesData)
    .sort(([, a], [, b]) => {
      if (b.views === a.views) return b.clicks - a.clicks;
      return b.views - a.views;
    })
    .slice(0, 7);

  const updateTooltipPosition = (uf, e) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const st = statesData[uf] || { name: STATE_NAMES[uf] || uf, views: 0, clicks: 0, ctr: 0, intensity: 0 };

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const tooltipWidth = 232;
    const tooltipHeight = 186;

    // Smart horizontal placement: floating alongside cursor ("ao lado")
    let x = mouseX + 18;
    if (mouseX > rect.width * 0.48 || mouseX + tooltipWidth + 18 > rect.width) {
      x = mouseX - tooltipWidth - 18;
    }
    x = Math.max(10, Math.min(x, rect.width - tooltipWidth - 10));

    // Vertical placement: center vertically relative to mouse cursor
    let y = mouseY - (tooltipHeight / 2);
    y = Math.max(10, Math.min(y, rect.height - tooltipHeight - 10));

    setHighlightedUf(uf);
    setTooltip({
      uf,
      name: st.name || STATE_NAMES[uf] || uf,
      views: st.views || 0,
      clicks: st.clicks || 0,
      ctr: st.ctr || 0,
      intensity: st.intensity || 0,
      x,
      y,
    });
  };

  const handleMouseLeaveState = () => {
    setHighlightedUf(null);
    setTooltip(null);
  };

  return (
    <div
      className="card shadow-sm mb-4"
      style={{
        background: isDark ? 'var(--surface-card, #111827)' : '#ffffff',
        borderColor: isDark ? 'var(--border-subtle, #1e293b)' : '#e2e8f0',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        className="card-header py-3 px-4 d-flex justify-content-between align-items-center border-bottom flex-wrap gap-2"
        style={{
          background: isDark ? 'var(--surface-card, #111827)' : '#ffffff',
          borderColor: isDark ? 'var(--border-subtle, #1e293b)' : '#e2e8f0',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <div
            className="kpi-icon-box"
            style={{
              width: '34px',
              height: '34px',
              fontSize: '1.1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <Flame size={18} />
          </div>
          <div>
            <h5 className={`mb-0 fs-6 fw-bold ${isDark ? 'text-light' : 'text-dark'}`}>
              Mapa de Calor do Brasil (Heatmap Geográfico)
            </h5>
            <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
              Intensidade de acessos, cliques e taxa de conversão em tempo real por Estado
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill shadow-xs"
            style={{
              fontSize: '11.5px',
              background: isDark ? 'var(--surface-subtle)' : '#f8fafc',
              border: isDark ? '1px solid var(--border-subtle)' : '1px solid #e2e8f0',
            }}
          >
            <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>Intensidade:</span>
            <div className="d-flex align-items-center gap-1.5">
              <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', background: isDark ? '#141722' : '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }} title="0% Sem Acessos" />
              <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', background: 'rgba(16, 185, 129, 0.25)' }} title="Baixa" />
              <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', background: 'rgba(16, 185, 129, 0.50)' }} title="Média" />
              <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', background: 'rgba(16, 185, 129, 0.75)' }} title="Alta" />
              <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', background: '#10b981' }} title="Top Volume" />
            </div>
            <span className="fw-bold ms-1" style={{ color: '#10b981' }}>Top Volume</span>
          </div>
        </div>
      </div>

      <div
        className="card-body p-4"
        style={{
          background: isDark ? 'var(--surface-card, #111827)' : '#ffffff',
        }}
      >
        <div className="row align-items-center g-4">
          {/* SVG Map Column */}
          <div className="col-lg-7 text-center position-relative">
            <div
              ref={mapContainerRef}
              className="position-relative d-inline-block w-100 map-container"
              style={{
                maxWidth: '520px',
                borderRadius: '24px',
                background: isDark
                  ? 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.06) 0%, rgba(37, 99, 235, 0.03) 45%, transparent 70%)'
                  : undefined,
              }}
            >
              <svg
                viewBox="0 0 500 620"
                className="w-100 h-auto"
                onMouseLeave={handleMouseLeaveState}
                style={{
                  maxHeight: '480px',
                  filter: isDark
                    ? 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))'
                    : 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))',
                  transition: 'filter 0.3s ease',
                }}
              >
                <g style={{ cursor: 'pointer' }}>
                  {Object.entries(STATE_PATHS).map(([uf, path]) => {
                    const st = statesData[uf] || { views: 0, intensity: 0 };
                    const isHovered = highlightedUf === uf;
                    const fill = getHeatColor(st.intensity, st.views, isDark, isHovered);

                    return (
                      <path
                        key={uf}
                        d={path}
                        fill={fill}
                        stroke={
                          isHovered
                            ? (isDark ? '#38bdf8' : '#0f172a')
                            : (isDark ? 'rgba(148, 163, 184, 0.35)' : '#ffffff')
                        }
                        strokeWidth={isHovered ? '2.5' : (isDark ? '1.5' : '1.7')}
                        strokeLinejoin="round"
                        style={{
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          filter: isHovered
                            ? (isDark ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.75))' : 'drop-shadow(0 0 6px rgba(0,0,0,0.3))')
                            : undefined,
                        }}
                        onMouseEnter={(e) => updateTooltipPosition(uf, e)}
                        onMouseMove={(e) => updateTooltipPosition(uf, e)}
                        onMouseLeave={handleMouseLeaveState}
                      />
                    );
                  })}
                </g>

                {/* State Text Labels com Alto Contraste & Halo SVG (100% legível no modo escuro) */}
                <g
                  fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
                  pointerEvents="none"
                >
                  {STATE_LABELS.map(({ uf, x, y, size = 10 }) => {
                    const isHovered = highlightedUf === uf;
                    const st = statesData[uf] || { views: 0 };
                    const hasViews = st.views > 0;

                    return (
                      <text
                        key={uf}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={size}
                        fontWeight={isHovered || hasViews ? '800' : '700'}
                        fill={
                          isHovered
                            ? '#ffffff'
                            : hasViews
                              ? (isDark ? '#ffffff' : '#0f172a')
                              : (isDark ? '#cbd5e1' : '#475569')
                        }
                        stroke={
                          isDark
                            ? 'rgba(11, 17, 32, 0.95)'
                            : '#ffffff'
                        }
                        strokeWidth={hasViews ? '3.4' : '2.6'}
                        strokeLinejoin="round"
                        paintOrder="stroke fill"
                        style={{
                          transition: 'all 0.15s ease',
                          letterSpacing: '0.2px',
                        }}
                      >
                        {uf}
                      </text>
                    );
                  })}
                </g>
              </svg>

              {/* Tooltip Popup Flutuante ao Lado */}
              {tooltip && (() => {
                const heatStatus = getHeatStatus(tooltip.intensity, tooltip.views);
                return (
                  <div
                    className="position-absolute text-start"
                    style={{
                      left: 0,
                      top: 0,
                      transform: `translate3d(${tooltip.x}px, ${tooltip.y}px, 0)`,
                      transition: 'transform 0.06s cubic-bezier(0.2, 0, 0, 1)',
                      zIndex: 1050,
                      pointerEvents: 'none',
                      width: '232px',
                      padding: '14px 16px',
                      backdropFilter: 'blur(16px)',
                      background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                      borderRadius: '18px',
                      border: isDark ? '1px solid rgba(56, 189, 248, 0.28)' : '1px solid rgba(226, 232, 240, 0.9)',
                      boxShadow: isDark
                        ? '0 20px 40px -6px rgba(0, 0, 0, 0.75), 0 0 24px rgba(56, 189, 248, 0.14)'
                        : '0 16px 36px -6px rgba(15, 23, 42, 0.16), 0 6px 16px -4px rgba(15, 23, 42, 0.08)',
                    }}
                  >
                    {/* Header: UF Badge + State Name + Dynamic Status Icon/Text */}
                    <div
                      className="d-flex align-items-center justify-content-between mb-2 pb-2"
                      style={{ borderBottom: isDark ? '1px solid var(--border-subtle)' : '1px solid #f1f5f9' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge font-monospace fw-bold d-inline-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            fontSize: '11px',
                            width: '28px',
                            height: '24px',
                            borderRadius: '7px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {tooltip.uf}
                        </span>
                        <div style={{ lineHeight: 1.15 }}>
                          <span
                            className="fw-bold"
                            style={{
                              fontSize: '14px',
                              display: 'block',
                              maxWidth: '105px',
                              color: isDark ? '#f8fafc' : '#0f172a',
                            }}
                          >
                            {tooltip.name}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-center text-center ms-auto" style={{ lineHeight: 1.1 }}>
                        <span style={{ fontSize: '18px', color: '#10b981' }}>{heatStatus.icon}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: isDark ? '#94a3b8' : '#475569',
                            marginTop: '2px',
                          }}
                        >
                          {heatStatus.text}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Body */}
                    <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ fontSize: '12px' }}>
                      <span className="d-flex align-items-center gap-1.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        <Eye size={13} style={{ color: '#10b981' }} /> Visualizações:
                      </span>
                      <strong style={{ fontSize: '12.5px', color: isDark ? '#f8fafc' : '#0f172a' }}>
                        {Number(tooltip.views).toLocaleString('pt-BR')}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ fontSize: '12px' }}>
                      <span className="d-flex align-items-center gap-1.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        <MousePointerClick size={13} style={{ color: '#10b981' }} /> Cliques:
                      </span>
                      <strong style={{ fontSize: '12.5px', color: '#10b981' }}>
                        {Number(tooltip.clicks).toLocaleString('pt-BR')}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '12px' }}>
                      <span className="d-flex align-items-center gap-1.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        <Zap size={13} style={{ color: '#10b981' }} /> Taxa CTR:
                      </span>
                      <strong style={{ fontSize: '12.5px', color: isDark ? '#f8fafc' : '#0f172a' }}>
                        {Number(tooltip.ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </strong>
                    </div>

                    {/* Intensity / Calor Progress */}
                    <div className="mt-2 pt-1">
                      <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                        <span>Calor:</span>
                        <span className="fw-bold" style={{ fontSize: '11.5px', color: '#10b981' }}>
                          {tooltip.intensity}%
                        </span>
                      </div>
                      <div
                        className="progress mt-1"
                        style={{
                          height: '5px',
                          background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${Math.min(100, Math.max(0, tooltip.intensity))}%`,
                            height: '100%',
                            background: '#10b981',
                            borderRadius: '999px',
                            transition: 'width 0.25s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Ranking Column */}
          <div className="col-lg-5">
            <div
              className="p-3 rounded-4"
              style={{
                background: isDark ? 'var(--surface-subtle, #11141b)' : '#f8fafc',
                border: isDark ? '1px solid var(--border-subtle)' : '1px solid #e2e8f0',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className={`fw-bold fs-6 d-flex align-items-center gap-2 ${isDark ? 'text-light' : 'text-dark'}`}>
                  <Trophy size={18} className="text-warning" /> Estados Mais Quentes
                </div>
                <span
                  className="badge rounded-pill border px-2.5 d-inline-flex align-items-center fw-bold"
                  style={{
                    fontSize: '11px',
                    height: '24px',
                    background: isDark ? 'var(--surface-card, #151821)' : '#ffffff',
                    color: isDark ? '#cbd5e1' : '#0f172a',
                    borderColor: isDark ? 'var(--border-subtle)' : '#e2e8f0',
                  }}
                >
                  Top Acessos
                </span>
              </div>

              {rankedStates.length === 0 || rankedStates[0][1].views === 0 ? (
                <div className="text-center py-4 small" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                  <MapPin size={28} className="opacity-50 d-block mx-auto mb-1" style={{ color: isDark ? '#475569' : '#94a3b8' }} />
                  Ainda não há acessos com geolocalização no período selecionado.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {rankedStates.map(([uf, st], index) => {
                    if (st.views === 0) return null;
                    const rank = index + 1;
                    const badgeBg = rank === 1
                      ? '#10b981'
                      : rank === 2
                      ? 'rgba(16, 185, 129, 0.45)'
                      : rank === 3
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(255, 255, 255, 0.06)';
                    const badgeText = rank <= 2 ? '#ffffff' : isDark ? '#94a3b8' : '#475569';

                    const isItemHighlighted = highlightedUf === uf;
                    return (
                      <div
                        key={uf}
                        className="p-3 rounded-3"
                        style={{
                          cursor: 'pointer',
                          background: isDark
                            ? (isItemHighlighted ? 'var(--surface-card-hover, #191d29)' : 'var(--surface-card, #151821)')
                            : (isItemHighlighted ? '#f1f5f9' : '#ffffff'),
                          border: isDark
                            ? `1px solid ${isItemHighlighted ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`
                            : `1px solid ${isItemHighlighted ? '#10b981' : '#e2e8f0'}`,
                          boxShadow: isItemHighlighted
                            ? (isDark ? '0 4px 20px rgba(16, 185, 129, 0.15)' : '0 4px 12px rgba(0,0,0,0.08)')
                            : '0 1px 3px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          marginBottom: '6px',
                        }}
                        onMouseEnter={() => setHighlightedUf(uf)}
                        onMouseLeave={() => setHighlightedUf(null)}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          {/* Left: Rank + State Name + Views */}
                          <div className="d-flex align-items-center gap-2.5">
                            <span
                              className="badge rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                              style={{
                                width: '24px',
                                height: '24px',
                                background: badgeBg,
                                color: badgeText,
                                fontSize: '11px',
                                padding: 0,
                              }}
                            >
                              {rank}
                            </span>
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <span className={`fw-bold fs-6 ${isDark ? 'text-light' : 'text-dark'}`} style={{ letterSpacing: '-0.01em' }}>
                                  {st.name}
                                </span>
                                <span
                                  className="badge rounded-pill font-monospace px-2 py-0.5 d-inline-flex align-items-center fw-semibold"
                                  style={{
                                    fontSize: '10px',
                                    background: isDark ? 'var(--surface-subtle)' : '#f1f5f9',
                                    color: isDark ? '#94a3b8' : '#64748b',
                                    border: isDark ? '1px solid var(--border-subtle)' : '1px solid #e2e8f0',
                                  }}
                                >
                                  {uf}
                                </span>
                              </div>
                              <div className="small mt-1" style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b' }}>
                                {Number(st.views).toLocaleString('pt-BR')} visualizações
                              </div>
                            </div>
                          </div>

                          {/* Right: Cliques, CTR & Calor Badge */}
                          <div className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-2 mb-1.5">
                              <span className="fw-bold" style={{ fontSize: '13px', color: '#10b981' }}>
                                {Number(st.clicks).toLocaleString('pt-BR')} cliques
                              </span>
                              <span
                                className="badge rounded-pill px-2 py-0.5 d-inline-flex align-items-center fw-bold"
                                style={{
                                  fontSize: '10.5px',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                }}
                              >
                                {Number(st.ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% CTR
                              </span>
                            </div>
                            <div className="d-flex align-items-center justify-content-end gap-2">
                              <div
                                style={{
                                  width: '60px',
                                  height: '4px',
                                  background: isDark ? '#1e293b' : '#e2e8f0',
                                  borderRadius: '999px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(100, Math.max(0, st.intensity))}%`,
                                    height: '100%',
                                    background: '#10b981',
                                    borderRadius: '999px',
                                  }}
                                />
                              </div>
                              <span className="fw-semibold" style={{ fontSize: '11px', color: '#10b981' }}>
                                {st.intensity}% calor
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
