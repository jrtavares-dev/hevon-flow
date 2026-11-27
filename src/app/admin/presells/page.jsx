import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import {
  getAllPresells,
  getPresellSummaryMetrics,
  getPresellTimeSeriesStats,
  getPresellUtmStats,
  getPresellDeviceStats,
  getPresellGeoStats,
  getAllPagesMetrics,
  getAllPagesButtonStats,
  parseCustomDatePeriod,
} from '@/lib/models/presell';
import PresellTableClient from './PresellTableClient';
import AnalyticsChart from '@/components/AnalyticsChart';
import PeriodDateFilter from '@/components/PeriodDateFilter';
import { formatNumber, formatPercent } from '@/lib/formatters';
import {
  HevonPageHeader,
  HevonMetricCard,
  HevonStatusBadge,
  HevonLiveAutoRefresh,
} from '@/components/hevon';
import {
  Smartphone,
  Laptop,
  Tablet,
  Eye,
  Users,
  MousePointerClick,
  TrendingUp,
  PieChart,
  Plus,
  FileSpreadsheet,
  RotateCw,
  Sparkles,
  BarChart2,
  Target,
  Filter,
  MapPin,
  Building2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Cache curto com deduplicação (evita divergência entre os 4 workers do PM2 em produção)
const presellsCache = globalThis._presellsCache || (globalThis._presellsCache = new Map());
const presellsInFlight = globalThis._presellsInFlight || (globalThis._presellsInFlight = new Map());
const PRESELLS_CACHE_TTL_MS = 5 * 1000; // 5 segundos rígidos

async function fetchPresellsBundle(period) {
  return Promise.all([
    getAllPresells(),
    getPresellSummaryMetrics(null, period),
    getPresellTimeSeriesStats(null, period),
    getPresellUtmStats(null, period, 5),
    getPresellDeviceStats(null, period),
    getPresellGeoStats(null, period, 5),
    getAllPagesMetrics(period),
    getAllPagesButtonStats(period),
  ]);
}

// Pré-aquecimento do cache em background no boot do servidor
if (typeof window === 'undefined') {
  setTimeout(() => {
    fetchPresellsBundle('tudo')
      .then((data) => presellsCache.set('tudo', { timestamp: Date.now(), data }))
      .catch(() => {});
  }, 400);
}

export default async function AdminPresellsPage({ searchParams }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const resolvedParams = await searchParams;
  const period = resolvedParams?.period || 'tudo';

  const customDateObj = parseCustomDatePeriod(period);
  const periodLabels = {
    hoje: 'Hoje',
    ontem: 'Ontem',
    '7d': 'Últimos 7 Dias',
    '30d': 'Últimos 30 Dias',
    mes: 'Este Mês',
    tudo: 'Todo o Período',
  };

  const currentPeriodLabel = customDateObj
    ? customDateObj.label
    : (periodLabels[period] || 'Todo o Período');

  // Cache rígido de 5s com deduplicação in-flight (consistência entre workers do cluster PM2)
  let dataBundle = null;
  const cached = presellsCache.get(period);
  const now = Date.now();

  if (cached && now - cached.timestamp < PRESELLS_CACHE_TTL_MS) {
    dataBundle = cached.data;
  } else if (presellsInFlight.has(period)) {
    dataBundle = await presellsInFlight.get(period);
  } else {
    const promise = fetchPresellsBundle(period)
      .then((fresh) => {
        presellsCache.set(period, { timestamp: Date.now(), data: fresh });
        return fresh;
      })
      .finally(() => presellsInFlight.delete(period));
    presellsInFlight.set(period, promise);
    dataBundle = await promise;
  }

  const [
    pages,
    summary,
    timeSeries,
    utmStats,
    deviceStats,
    geoStats,
    allPagesStats,
    allPagesButtonStats,
  ] = dataBundle;

  // Match period metrics to each page in memory
  const processedPages = pages.map((p) => {
    const pStats = allPagesStats[p.id];
    let pViews, pClicks, pUniques, pCtr;

    if (pStats) {
      pViews = period === 'tudo' ? Math.max(pStats.views, Number(p.views_count || 0)) : pStats.views;
      pClicks = period === 'tudo' ? Math.max(pStats.clicks, Number(p.clicks_count || 0)) : pStats.clicks;
      pCtr = pViews > 0 ? Number(((pClicks / pViews) * 100).toFixed(1)) : 0;
      pUniques = period === 'tudo' ? Math.max(pStats.uniques, pViews) : pStats.uniques;
    } else {
      pViews = period === 'tudo' ? Number(p.views_count || 0) : 0;
      pClicks = period === 'tudo' ? Number(p.clicks_count || 0) : 0;
      pUniques = pViews;
      pCtr = pViews > 0 ? Number(((pClicks / pViews) * 100).toFixed(1)) : 0;
    }

    const buttons = p.buttons_list || [];
    const pButtonStats = buttons.map((btn, idx) => ({
      index: idx,
      main_text: btn.main_text || `Botão ${idx + 1}`,
      bg_color: btn.bg_color || '#22c55e',
      clicks: allPagesButtonStats[p.id]?.[idx] || 0,
    }));

    return {
      ...p,
      period_views: pViews,
      period_clicks: pClicks,
      period_uniques: pUniques,
      period_ctr: pCtr,
      button_stats: pButtonStats,
    };
  });

  const maxVal = Math.max(...timeSeries.views, ...timeSeries.clicks, 10);

  return (
    <div className="w-100">
      {/* HEVON Page Header (Baseline 4 + 1) */}
      <HevonPageHeader
        title="Páginas Presell"
        subtitle="Conversão de comunidades, cliques por botão e origens de tráfego."
        badge={<HevonStatusBadge variant="primary">{formatNumber(pages.length)} páginas</HevonStatusBadge>}
        actions={
          <>
            <div className="responsive-toolbar-scroll" role="group" aria-label="Período">
              {[
                { id: 'hoje', label: 'Hoje' },
                { id: 'ontem', label: 'Ontem' },
                { id: '7d', label: '7 Dias' },
                { id: '30d', label: '30 Dias' },
                { id: 'mes', label: 'Este Mês' },
                { id: 'tudo', label: 'Tudo' },
              ].map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/presells?period=${p.id}`}
                  className={`period-pill ${period === p.id ? 'active' : ''}`}
                >
                  {p.label}
                </Link>
              ))}
              <PeriodDateFilter basePath="/admin/presells" currentPeriod={period} />
            </div>

            <HevonLiveAutoRefresh intervalMs={5000} />

            <Link
              href={`/api/admin/presells/export?period=${period}`}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
              title="Exportar CSV"
            >
              <FileSpreadsheet size={14} />
              <span>CSV</span>
            </Link>

            <Link
              href="/admin/presells/create"
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Nova Página</span>
            </Link>
          </>
        }
      />

      {/* 4 KPI Cards Executivos HEVON (sem ícones decorativos, 3 linhas cada) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <HevonMetricCard
            label="Visualizações"
            value={formatNumber(summary.views)}
            context={`${currentPeriodLabel} · ${formatNumber(pages.length)} páginas cadastradas`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <HevonMetricCard
            label="Visitantes Únicos"
            value={formatNumber(summary.uniques)}
            context="Audiência distinta por IP no período"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <HevonMetricCard
            label="Cliques em Botões"
            value={formatNumber(summary.clicks)}
            context="Total de cliques em CTAs de presell"
            tone="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <HevonMetricCard
            label="Conversão (CTR)"
            value={formatPercent(Number(summary.ctr || 0))}
            context={
              summary.mobileRate > 0
                ? `${formatPercent(Number(summary.mobileRate))} tráfego mobile`
                : 'Taxa média de cliques sobre visitas'
            }
            tone="success"
          />
        </div>
      </div>

      {/* Charts & Traffic Distribution Row */}
      <div className="row g-3 mb-4">
        {/* Time Series Line Chart */}
        <div className="col-lg-8">
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
                {formatNumber(summary.views)} views · {formatNumber(summary.clicks)} cliques
              </span>
            </div>
            <div className="p-4 flex-grow-1" style={{ minHeight: '260px' }}>
              <AnalyticsChart timeSeries={timeSeries} periodLabel={currentPeriodLabel} height={230} />
            </div>
          </div>
        </div>

        {/* Traffic Sources & Devices Breakdown */}
        <div className="col-lg-4">
          <div className="hevon-card h-100">
            <div
              className="px-4 py-3 d-flex justify-content-between align-items-center"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
            >
              <div>
                <div className="hevon-eyebrow mb-0.5">Distribuição</div>
                <h2 className="hevon-section-title">Origens &amp; Dispositivos</h2>
              </div>
              <HevonStatusBadge variant="neutral">{currentPeriodLabel}</HevonStatusBadge>
            </div>
            <div className="p-3">
              {/* Device Badges */}
              <div className="d-flex align-items-center justify-content-around p-2 bg-light rounded-3 mb-3 border">
                <div className="text-center">
                  <Smartphone size={18} className="text-primary d-block mx-auto mb-1" />
                  <span className="small fw-bold text-dark">{Number(deviceStats.devices.mobile || 0).toLocaleString('pt-BR')}</span>
                  <span className="d-block text-muted" style={{ fontSize: '10px' }}>
                    Mobile
                  </span>
                </div>
                <div className="border-end" style={{ height: '30px' }}></div>
                <div className="text-center">
                  <Laptop size={18} className="text-secondary d-block mx-auto mb-1" />
                  <span className="small fw-bold text-dark">{Number(deviceStats.devices.desktop || 0).toLocaleString('pt-BR')}</span>
                  <span className="d-block text-muted" style={{ fontSize: '10px' }}>
                    Desktop
                  </span>
                </div>
                <div className="border-end" style={{ height: '30px' }}></div>
                <div className="text-center">
                  <Tablet size={18} className="text-info d-block mx-auto mb-1" />
                  <span className="small fw-bold text-dark">{Number(deviceStats.devices.tablet || 0).toLocaleString('pt-BR')}</span>
                  <span className="d-block text-muted" style={{ fontSize: '10px' }}>
                    Tablet
                  </span>
                </div>
              </div>

              {/* Top UTM Sources */}
              <div className="fw-bold small text-dark mb-2 d-flex justify-content-between">
                <span>
                  <Target size={14} className="text-primary me-1" style={{ verticalAlign: 'middle' }} /> Top Fontes (UTM Source)
                </span>
                <span className="text-muted" style={{ fontSize: '10.5px' }}>
                  Cliques / CTR
                </span>
              </div>

              {utmStats.sources.length === 0 ? (
                <div className="text-center text-muted py-4 small">
                  <Filter size={28} className="opacity-50 text-secondary d-block mx-auto mb-1" />
                  Nenhum acesso com UTM registrado no período.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {utmStats.sources.slice(0, 4).map((source, idx) => {
                    const maxClicks = Math.max(1, utmStats.sources[0]?.clicks_count || 1);
                    const pct = Math.round((source.clicks_count / maxClicks) * 100);
                    return (
                      <div key={idx} className="p-2 border rounded-2 bg-white">
                        <div className="d-flex justify-content-between align-items-center small mb-1">
                          <span className="fw-bold text-truncate text-dark" style={{ maxWidth: '140px' }}>
                            {source.source}
                          </span>
                          <div>
                            <span className="fw-bold text-success me-1">{Number(source.clicks_count || 0).toLocaleString('pt-BR')} cliques</span>
                            <span className="badge bg-light text-dark border">
                              {Number(source.ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% CTR
                            </span>
                          </div>
                        </div>
                        <div className="progress" style={{ height: '5px' }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${pct}%` }}
                          ></div>
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

      {/* Geolocation & Demographics Row */}
      <div className="row g-4 mb-4">
        {/* Top Brazilian States */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div className="kpi-icon-box kpi-icon-amber" style={{ width: '32px', height: '32px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={16} />
                </div>
                <div>
                  <h5 className="mb-0 fs-6 fw-bold text-dark">Top Estados (Localização Brasil)</h5>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    Onde estão os visitantes e cliques mais frequentes
                  </div>
                </div>
              </div>
              <span className="badge bg-light text-dark border">{currentPeriodLabel}</span>
            </div>
            <div className="card-body p-3">
              {geoStats.states.length === 0 ? (
                <div className="text-center text-muted py-4 small">
                  <MapPin size={28} className="opacity-50 text-secondary d-block mx-auto mb-1" />
                  Nenhuma localização registrada neste período ainda.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {geoStats.states.map((st, idx) => {
                    const maxStateClicks = Math.max(1, geoStats.states[0]?.clicks_count || 1);
                    const pct = Math.round((st.clicks_count / maxStateClicks) * 100);
                    return (
                      <div key={idx} className="p-2 border rounded-2 bg-white">
                        <div className="d-flex justify-content-between align-items-center small mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="badge bg-primary text-white font-monospace px-2 py-1 fw-bold"
                              style={{ fontSize: '11px', minWidth: '32px', textAlign: 'center' }}
                            >
                              {st.state_code}
                            </span>
                            <span className="fw-bold text-dark text-truncate" style={{ maxWidth: '170px' }}>
                              {st.state_name}
                            </span>
                          </div>
                          <div className="text-end">
                            <span className="text-muted me-2" style={{ fontSize: '11px' }}>
                              {Number(st.views_count || 0).toLocaleString('pt-BR')} views
                            </span>
                            <span className="fw-bold text-success me-1">{Number(st.clicks_count || 0).toLocaleString('pt-BR')} cliques</span>
                            <span
                              className={`badge ${
                                st.ctr > 20
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : 'bg-light text-dark border'
                              }`}
                            >
                              {Number(st.ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% CTR
                            </span>
                          </div>
                        </div>
                        <div className="progress" style={{ height: '5px' }}>
                          <div
                            className="progress-bar bg-warning"
                            role="progressbar"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Cities */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div className="kpi-icon-box kpi-icon-blue" style={{ width: '32px', height: '32px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={16} />
                </div>
                <div>
                  <h5 className="mb-0 fs-6 fw-bold text-dark">Top Cidades & Conversão</h5>
                  <div className="text-muted" style={{ fontSize: '11px' }}>
                    Cidades com maior volume de tráfego e cliques
                  </div>
                </div>
              </div>
              <span className="badge bg-light text-dark border">{currentPeriodLabel}</span>
            </div>
            <div className="card-body p-3">
              {geoStats.cities.length === 0 ? (
                <div className="text-center text-muted py-4 small">
                  <Building2 size={28} className="opacity-50 text-secondary d-block mx-auto mb-1" />
                  Nenhuma cidade registrada no período selecionado.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {geoStats.cities.map((ct, idx) => {
                    const maxCityClicks = Math.max(1, geoStats.cities[0]?.clicks_count || 1);
                    const pct = Math.round((ct.clicks_count / maxCityClicks) * 100);
                    return (
                      <div key={idx} className="p-2 border rounded-2 bg-white">
                        <div className="d-flex justify-content-between align-items-center small mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-light border d-flex align-items-center justify-content-center text-primary"
                              style={{ width: '26px', height: '26px', fontSize: '11px' }}
                            >
                              <MapPin size={13} />
                            </div>
                            <div>
                              <span className="fw-bold text-dark">{ct.city_name}</span>
                              {ct.state_code && (
                                <span className="text-muted small ms-1">({ct.state_code})</span>
                              )}
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="text-muted me-2" style={{ fontSize: '11px' }}>
                              {Number(ct.views_count || 0).toLocaleString('pt-BR')} views
                            </span>
                            <span className="fw-bold text-success me-1">{Number(ct.clicks_count || 0).toLocaleString('pt-BR')} cliques</span>
                            <span
                              className={`badge ${
                                ct.ctr > 20
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : 'bg-light text-dark border'
                              }`}
                            >
                              {Number(ct.ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% CTR
                            </span>
                          </div>
                        </div>
                        <div className="progress" style={{ height: '5px' }}>
                          <div className="progress-bar bg-info" role="progressbar" style={{ width: `${pct}%` }}></div>
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

      {/* Table Card (Páginas de Alta Conversão) */}
      <PresellTableClient pages={processedPages} period={period} currentPeriodLabel={currentPeriodLabel} />

      <footer className="hevon-methodology-footer">
        Fontes: <span className="hevon-mono">presell_pages</span> e <span className="hevon-mono">presell_events</span> ·
        Janela: <strong>{currentPeriodLabel}</strong> · Fuso <span className="hevon-mono">America/Sao_Paulo</span>.
      </footer>
    </div>
  );
}
