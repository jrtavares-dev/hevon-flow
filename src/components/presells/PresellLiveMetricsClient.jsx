'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Pause, Play } from 'lucide-react';
import AnalyticsChart from '@/components/AnalyticsChart';
import { HevonMetricCard, HevonStatusBadge } from '@/components/hevon';
import { formatNumber, formatPercent } from '@/lib/formatters';

function getBrazilClockHMS() {
  try {
    return new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}

/**
 * PresellLiveMetricsClient — Atualização 100% automática em tempo real (sem F5)
 * Faz polling leve em /api/admin/presells/[id]/analytics a cada 3s, atualizando:
 * - Os 4 KPIs (Visualizações, Visitantes Únicos, Cliques em Botões, CTR)
 * - O gráfico Evolução de Tráfego & Cliques
 * - O card Desempenho por Botão
 * - Sincroniza o resto da página (UTMs, Dispositivos, Mapa, Eventos) quando há novos acessos/cliques
 */
export default function PresellLiveMetricsClient({
  pageId,
  period,
  currentPeriodLabel,
  initialSummary = {},
  initialTimeSeries = { labels: [], views: [], clicks: [] },
  initialButtonStats = [],
  intervalMs = 3000,
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [summary, setSummary] = useState(initialSummary);
  const [timeSeries, setTimeSeries] = useState(initialTimeSeries);
  const [buttonStats, setButtonStats] = useState(initialButtonStats);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [changedKeys, setChangedKeys] = useState({});

  const prevCountsRef = useRef({
    views: Number(initialSummary?.views || 0),
    uniques: Number(initialSummary?.uniques || 0),
    clicks: Number(initialSummary?.clicks || 0),
    ctr: Number(initialSummary?.ctr || 0),
  });
  const inFlightRef = useRef(false);

  // Sincroniza quando o usuário troca o filtro de período
  useEffect(() => {
    setSummary(initialSummary);
    setTimeSeries(initialTimeSeries);
    setButtonStats(initialButtonStats);
    prevCountsRef.current = {
      views: Number(initialSummary?.views || 0),
      uniques: Number(initialSummary?.uniques || 0),
      clicks: Number(initialSummary?.clicks || 0),
      ctr: Number(initialSummary?.ctr || 0),
    };
    setLastUpdated(getBrazilClockHMS());
  }, [pageId, period, initialSummary, initialTimeSeries, initialButtonStats]);

  const fetchLiveMetrics = useCallback(async ({ manual = false } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (manual) setIsFetching(true);

    try {
      const url = `/api/admin/presells/${pageId}/analytics?period=${encodeURIComponent(period)}&_t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.success) return;

      const nextSummary = data.summary || {};
      const nextViews = Number(nextSummary.views || 0);
      const nextUniques = Number(nextSummary.uniques || 0);
      const nextClicks = Number(nextSummary.clicks || 0);
      const nextCtr = Number(nextSummary.ctr || 0);

      const prev = prevCountsRef.current;
      const diff = {};
      if (nextViews !== prev.views) diff.views = true;
      if (nextUniques !== prev.uniques) diff.uniques = true;
      if (nextClicks !== prev.clicks) diff.clicks = true;
      if (nextCtr !== prev.ctr) diff.ctr = true;

      setSummary(nextSummary);
      if (data.timeSeries) setTimeSeries(data.timeSeries);
      if (Array.isArray(data.buttonStats)) setButtonStats(data.buttonStats);
      setLastUpdated(data.updatedAt || getBrazilClockHMS());

      if (Object.keys(diff).length > 0) {
        prevCountsRef.current = {
          views: nextViews,
          uniques: nextUniques,
          clicks: nextClicks,
          ctr: nextCtr,
        };
        setChangedKeys(diff);
        setTimeout(() => setChangedKeys({}), 1200);

        // Atualiza silenciosamente UTMs, Dispositivos, Mapa e Atividade Recente abaixo
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      // mantém os últimos dados exibidos sem quebrar a tela
    } finally {
      inFlightRef.current = false;
      if (manual) setIsFetching(false);
    }
  }, [pageId, period, router]);

  useEffect(() => {
    if (!liveEnabled) return;

    const timer = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchLiveMetrics();
      }
    }, intervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [liveEnabled, intervalMs, fetchLiveMetrics]);

  const humanViewsCount = Number(
    summary.human_views ?? (Number(summary.views || 0) - Number(summary.bot_views || 0))
  );
  const botViewsCount = Number(summary.bot_views || 0);
  const intervalSec = Math.round(intervalMs / 1000);

  const pulseStyle = (key) =>
    changedKeys[key]
      ? {
          borderColor: 'hsl(var(--primary))',
          boxShadow: '0 0 0 2px hsl(var(--primary) / 0.16)',
          transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        }
      : { transition: 'border-color 0.4s ease, box-shadow 0.4s ease' };

  return (
    <>
      {/* Barra discreta de status Tempo Real */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => setLiveEnabled((prev) => !prev)}
            className={`hevon-badge ${liveEnabled ? 'hevon-badge-success' : 'hevon-badge-neutral'}`}
            style={{ height: '26px', padding: '0 10px', fontSize: '11px', cursor: 'pointer' }}
            title={liveEnabled ? 'Clique para pausar atualização automática' : 'Clique para ativar tempo real'}
          >
            <span
              className="hevon-badge-dot"
              style={liveEnabled ? { animation: 'pulseDot 1.4s infinite' } : { opacity: 0.4 }}
            />
            <span>{liveEnabled ? `Tempo Real automático (${intervalSec}s)` : 'Tempo Real pausado'}</span>
            {liveEnabled ? <Pause size={10} /> : <Play size={10} />}
          </button>

          {lastUpdated && (
            <span className="hevon-data-secondary hevon-mono hevon-tabular">
              Atualizado às {lastUpdated}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => fetchLiveMetrics({ manual: true })}
          disabled={isFetching}
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
          style={{ height: '28px', minHeight: '28px', padding: '0 10px', fontSize: '11px' }}
        >
          <RefreshCw size={12} className={isFetching ? 'uf-spinner' : ''} />
          <span>{isFetching ? 'Atualizando...' : 'Atualizar agora'}</span>
        </button>
      </div>

      {/* ANDAR 1 — 4 KPIs Executivos HEVON (em Tempo Real automático, zero F5) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div style={pulseStyle('views')} className="rounded-3 h-100">
            <HevonMetricCard
              label={`Visualizações de Página · ${currentPeriodLabel}`}
              value={formatNumber(summary.views)}
              context={
                botViewsCount > 0
                  ? `${formatNumber(humanViewsCount)} humanos · ${formatNumber(botViewsCount)} bots filtrados`
                  : `${formatNumber(humanViewsCount)} acessos humanos`
              }
            />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div style={pulseStyle('uniques')} className="rounded-3 h-100">
            <HevonMetricCard
              label="Visitantes Únicos"
              value={formatNumber(summary.uniques)}
              context="IPs únicos na janela selecionada"
            />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div style={pulseStyle('clicks')} className="rounded-3 h-100">
            <HevonMetricCard
              label="Cliques em Botões"
              value={formatNumber(summary.clicks)}
              context="Interações de saída nos CTAs"
              tone="primary"
            />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div style={pulseStyle('ctr')} className="rounded-3 h-100">
            <HevonMetricCard
              label="Conversão (CTR Geral)"
              value={formatPercent(Number(summary.ctr || 0))}
              context={`CTR Humano: ${formatPercent(Number(summary.human_ctr ?? summary.ctr ?? 0))}`}
              tone="success"
            />
          </div>
        </div>
      </div>

      {/* ANDAR 2 — Gráfico Temporal + Desempenho por Botão (em Tempo Real) */}
      <div className="row g-3 mb-4">
        <div className="col-lg-7">
          <div className="hevon-card h-100 d-flex flex-column">
            <div
              className="px-4 py-3 d-flex justify-content-between align-items-center"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
            >
              <div>
                <div className="hevon-eyebrow mb-0.5">Série Temporal</div>
                <h2 className="hevon-section-title">Evolução de Tráfego &amp; Cliques ({currentPeriodLabel})</h2>
              </div>
              <span className="hevon-data-secondary hevon-tabular">
                {formatNumber(summary.views)} visualizações · {formatNumber(summary.clicks)} cliques
              </span>
            </div>
            <div className="p-4 flex-grow-1">
              <AnalyticsChart timeSeries={timeSeries} periodLabel={currentPeriodLabel} height={250} />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="hevon-card h-100 d-flex flex-column">
            <div
              className="px-4 py-3 d-flex justify-content-between align-items-center"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
            >
              <div>
                <div className="hevon-eyebrow mb-0.5">Conversão por CTA</div>
                <h2 className="hevon-section-title">Desempenho por Botão</h2>
              </div>
              <HevonStatusBadge variant="neutral">
                {buttonStats.length} botão(ões)
              </HevonStatusBadge>
            </div>
            <div className="p-3 flex-grow-1">
              {buttonStats.length === 0 ? (
                <div className="text-center text-muted py-4 small">
                  Nenhum clique registrado neste período.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {buttonStats.map((btn, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-3"
                      style={{
                        background: 'hsl(var(--muted) / 0.35)',
                        border: '1px solid hsl(var(--border) / 0.65)',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div style={{ minWidth: 0 }}>
                          <div className="hevon-data-primary text-truncate">{btn.main_text}</div>
                          {btn.sub_text && (
                            <div className="hevon-data-secondary text-truncate">{btn.sub_text}</div>
                          )}
                        </div>
                        <div className="text-end flex-shrink-0">
                          <div className="hevon-data-primary hevon-tabular" style={{ color: 'hsl(var(--primary))' }}>
                            {formatNumber(btn.clicks)} cliques
                          </div>
                          <div className="hevon-data-secondary hevon-tabular">
                            {formatPercent(Number(btn.ctr || 0))} CTR da página
                          </div>
                        </div>
                      </div>
                      <div className="progress" style={{ height: '5px' }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${Math.min(100, btn.share_pct || 0)}%` }}
                        />
                      </div>
                      <div className="d-flex justify-content-between hevon-data-secondary mt-1.5">
                        <span className="text-truncate pe-2">
                          Destino: <span className="hevon-mono">{(btn.url || '').substring(0, 34)}...</span>
                        </span>
                        <span className="hevon-tabular flex-shrink-0">
                          {formatPercent(Number(btn.share_pct || 0))} dos cliques
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
