import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { query, queryOne, isPostgres } from '@/lib/db';
import DashboardRevenueChart from '@/components/DashboardRevenueChart';
import PeriodDateFilter from '@/components/PeriodDateFilter';
import { parseCustomDatePeriod } from '@/lib/models/presell';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatTimeBR,
} from '@/lib/formatters';
import {
  HevonPageHeader,
  HevonMetricCard,
  HevonStatusBadge,
  HevonEmptyState,
  HevonLiveAutoRefresh,
} from '@/components/hevon';
import {
  Plus,
  ExternalLink,
  ChevronRight,
  Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Cache curto com deduplicação (evita divergência entre os 4 workers do PM2 em produção)
const dashboardCache = globalThis._dashboardCache || (globalThis._dashboardCache = new Map());
const dashboardInFlight = globalThis._dashboardInFlight || (globalThis._dashboardInFlight = new Map());
const DASHBOARD_CACHE_TTL_MS = 5 * 1000; // 5 segundos rígidos (sem servir dado velho de 20 minutos)

function getBrazilDateString(daysAgo = 0) {
  const nowBR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  nowBR.setDate(nowBR.getDate() - daysAgo);
  const pad = (n) => String(n).padStart(2, '0');
  return `${nowBR.getFullYear()}-${pad(nowBR.getMonth() + 1)}-${pad(nowBR.getDate())}`;
}

// Função isolada de carregamento do bundle analítico
async function fetchDashboardBundle(period) {
  const pgMode = isPostgres();
  const tz = pgMode ? '-03' : '';
  const todayStr = getBrazilDateString(0);
  const yesterdayStr = getBrazilDateString(1);
  const start7dStr = getBrazilDateString(6); // 7 dias corridos (início do dia 00:00 BRT) — nunca cai ao dar F5
  const start30dStr = getBrazilDateString(29); // 30 dias corridos (início do dia 00:00 BRT)
  const startMonthStr = `${todayStr.slice(0, 7)}-01`;

  let dateCondition = '1=1';
  let visitorsCondition = '1=1';
  let presellDateCondition = '1=1';
  let linkClickDateCondition = '1=1';

  const makeRange = (col, startStr, endStr = null) =>
    endStr
      ? `${col} >= '${startStr} 00:00:00${tz}' AND ${col} <= '${endStr} 23:59:59${tz}'`
      : `${col} >= '${startStr} 00:00:00${tz}'`;

  if (period === 'hoje') {
    dateCondition = makeRange('created_at', todayStr);
    visitorsCondition = makeRange('e.created_at', todayStr);
    presellDateCondition = makeRange('e.created_at', todayStr);
    linkClickDateCondition = makeRange('clicked_at', todayStr);
  } else if (period === 'ontem') {
    dateCondition = makeRange('created_at', yesterdayStr, yesterdayStr);
    visitorsCondition = makeRange('e.created_at', yesterdayStr, yesterdayStr);
    presellDateCondition = makeRange('e.created_at', yesterdayStr, yesterdayStr);
    linkClickDateCondition = makeRange('clicked_at', yesterdayStr, yesterdayStr);
  } else if (period === '7d') {
    dateCondition = makeRange('created_at', start7dStr);
    visitorsCondition = makeRange('e.created_at', start7dStr);
    presellDateCondition = makeRange('e.created_at', start7dStr);
    linkClickDateCondition = makeRange('clicked_at', start7dStr);
  } else if (period === '30d') {
    dateCondition = makeRange('created_at', start30dStr);
    visitorsCondition = makeRange('e.created_at', start30dStr);
    presellDateCondition = makeRange('e.created_at', start30dStr);
    linkClickDateCondition = makeRange('clicked_at', start30dStr);
  } else if (period === 'mes') {
    dateCondition = makeRange('created_at', startMonthStr);
    visitorsCondition = makeRange('e.created_at', startMonthStr);
    presellDateCondition = makeRange('e.created_at', startMonthStr);
    linkClickDateCondition = makeRange('clicked_at', startMonthStr);
  } else {
    const custom = parseCustomDatePeriod(period);
    if (custom) {
      dateCondition = makeRange('created_at', custom.startDate, custom.endDate);
      visitorsCondition = makeRange('e.created_at', custom.startDate, custom.endDate);
      presellDateCondition = makeRange('e.created_at', custom.startDate, custom.endDate);
      linkClickDateCondition = makeRange('clicked_at', custom.startDate, custom.endDate);
    }
  }

  const chartStartStr =
    period === '30d'
      ? start30dStr
      : period === 'mes'
      ? startMonthStr
      : period === 'hoje'
      ? todayStr
      : period === 'ontem'
      ? yesterdayStr
      : start7dStr;

  const formatSql = pgMode
    ? "TO_CHAR(e.created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM')"
    : "DATE_FORMAT(e.created_at, '%d/%m')";
  const dayGroupSql = pgMode
    ? "DATE(e.created_at AT TIME ZONE 'America/Sao_Paulo')"
    : 'DATE(e.created_at)';
  const chartWhereSql =
    period === 'tudo'
      ? `e.created_at >= '${start30dStr} 00:00:00${tz}'`
      : period === 'ontem'
      ? makeRange('e.created_at', yesterdayStr, yesterdayStr)
      : `e.created_at >= '${chartStartStr} 00:00:00${tz}'`;

  return Promise.all([
    // 1. Visitantes Únicos Reais (via presell_events IP distinct no período)
    queryOne(
      `SELECT COUNT(DISTINCT e.ip_address) as count FROM presell_events e WHERE ${visitorsCondition}`
    ).catch(() => ({ count: 0 })),

    // 2. Presell total views & clicks no período
    queryOne(`
      SELECT 
        COUNT(CASE WHEN e.event_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN e.event_type = 'click' THEN 1 END) as clicks
      FROM presell_events e
      WHERE ${presellDateCondition}
    `).catch(() => ({ views: 0, clicks: 0 })),

    // 3. Total de Funis Ativos
    queryOne(
      "SELECT COUNT(1) as count FROM campaigns WHERE status = 'active'"
    ).catch(() => ({ count: 0 })),

    // 4. Total de Páginas Presell Ativas
    queryOne(
      "SELECT COUNT(1) as count FROM presell_pages WHERE status = 'active'"
    ).catch(() => ({ count: 0 })),

    // 5. Resumo de Funis
    queryOne(`
      SELECT 
        COUNT(1) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        COALESCE(SUM(revenue), 0) as totalRevenue
      FROM upsell_sessions
      WHERE ${dateCondition}
    `).catch(() => ({ total: 0, completed: 0, totalRevenue: 0 })),

    // 6. Série temporal de tráfego diário (Visualizações & Cliques)
    query(`
      SELECT ${formatSql} as day_label, 
        COUNT(CASE WHEN e.event_type = 'view' THEN 1 END) as daily_views,
        COUNT(CASE WHEN e.event_type = 'click' THEN 1 END) as daily_clicks
      FROM presell_events e
      WHERE ${chartWhereSql}
      GROUP BY ${formatSql}, ${dayGroupSql}
      ORDER BY ${dayGroupSql} ASC
    `).catch(() => []),

    // 7. Top Páginas Presell (Otimizado via CTE - 50x mais rápido)
    isPostgres() ? query(`
      WITH top_events AS (
        SELECT 
          presell_page_id,
          COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views,
          COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks
        FROM presell_events
        WHERE ${presellDateCondition.replace(/e\./g, '')}
        GROUP BY presell_page_id
        ORDER BY views DESC
        LIMIT 5
      )
      SELECT 
        p.id, p.name, p.slug, p.status,
        COALESCE(te.views, 0) as views,
        COALESCE(te.clicks, 0) as clicks
      FROM top_events te
      JOIN presell_pages p ON p.id = te.presell_page_id
      ORDER BY te.views DESC
    `).catch(() => []) : query(`
      SELECT 
        p.id, p.name, p.slug, p.status,
        COUNT(CASE WHEN e.event_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN e.event_type = 'click' THEN 1 END) as clicks
      FROM presell_pages p
      LEFT JOIN presell_events e ON e.presell_page_id = p.id AND ${presellDateCondition}
      GROUP BY p.id, p.name, p.slug, p.status
      ORDER BY views DESC
      LIMIT 5
    `).catch(() => []),

    // 8. Origem de Tráfego (Top UTM Sources)
    query(`
      SELECT 
        COALESCE(NULLIF(e.utm_source, ''), 'Direto / Orgânico') as source,
        COUNT(1) as total
      FROM presell_events e
      WHERE e.event_type = 'view' AND ${presellDateCondition}
      GROUP BY COALESCE(NULLIF(e.utm_source, ''), 'Direto / Orgânico')
      ORDER BY total DESC
      LIMIT 6
    `).catch(() => []),

    // 9. Dispositivos dos Visitantes
    query(`
      SELECT LOWER(e.device_type) as device_type, COUNT(1) as total
      FROM presell_events e
      WHERE e.device_type IS NOT NULL AND e.device_type != '' AND ${presellDateCondition}
      GROUP BY LOWER(e.device_type)
      ORDER BY total DESC
    `).catch(() => []),

    // 10. Engajamento de Gamificação
    Promise.all([
      queryOne("SELECT COUNT(1) as count FROM wheel_spins").catch(() => ({ count: 0 })),
      queryOne("SELECT COUNT(1) as count FROM scratch_games").catch(() => ({ count: 0 })),
      queryOne("SELECT COUNT(1) as count FROM mystery_box_plays").catch(() => ({ count: 0 })),
      queryOne("SELECT COUNT(1) as count FROM puzzle_participations").catch(() => ({ count: 0 })),
    ]).then(([w, s, m, p]) => ({
      wheel: Number(w?.count || 0),
      scratch: Number(s?.count || 0),
      box: Number(m?.count || 0),
      puzzle: Number(p?.count || 0),
      total: Number(w?.count || 0) + Number(s?.count || 0) + Number(m?.count || 0) + Number(p?.count || 0),
    })),

    // 11. Feed de Atividade Recente em Tempo Real
    query(`
      SELECT 
        id, event_type, utm_source, device_type, city, region, created_at, variation
      FROM presell_events
      ORDER BY created_at DESC
      LIMIT 8
    `).catch(() => []),
  ]);
}

// Pré-aquecimento do cache em background no boot do servidor
if (typeof window === 'undefined') {
  setTimeout(() => {
    fetchDashboardBundle('7d')
      .then((data) => dashboardCache.set('7d', { timestamp: Date.now(), data }))
      .catch(() => {});
  }, 200);
}

export default async function AdminDashboardPage({ searchParams }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  const resolvedParams = await searchParams;
  const period = resolvedParams?.period || '7d';

  // Cache rígido de 5s com deduplicação in-flight (garante números sincronizados entre todos os workers do PM2)
  let bundle = null;
  const cached = dashboardCache.get(period);
  const now = Date.now();

  if (cached && now - cached.timestamp < DASHBOARD_CACHE_TTL_MS) {
    bundle = cached.data;
  } else if (dashboardInFlight.has(period)) {
    bundle = await dashboardInFlight.get(period);
  } else {
    const promise = fetchDashboardBundle(period)
      .then((fresh) => {
        dashboardCache.set(period, { timestamp: Date.now(), data: fresh });
        return fresh;
      })
      .finally(() => dashboardInFlight.delete(period));
    dashboardInFlight.set(period, promise);
    bundle = await promise;
  }

  const [
    visitorsRow,
    presellSummaryRow,
    linkClicksRow,
    activeSessionsRow,
    sessionsSummaryRow,
    trafficChartRows,
    topPresellPages,
    topUtms,
    devicesStats,
    gamesStats,
    recentEvents,
  ] = bundle;

  // Números consolidados
  const presellViews = Number(presellSummaryRow?.views || 0);
  const presellClicks = Number(presellSummaryRow?.clicks || 0);
  const presellCtrNum = presellViews > 0 ? (presellClicks / presellViews) * 100 : 0;

  const uniqueVisitors = Number(visitorsRow?.count || 0);
  const totalLinkClicks = Number(linkClicksRow?.count || 0);
  const activeSessions = Number(activeSessionsRow?.count || 0);
  const totalRevenue = Number(sessionsSummaryRow?.totalRevenue || 0);

  // Dados do gráfico de tráfego (série principal + comparação)
  const chartLabels = trafficChartRows.map((r) => r.day_label);
  const chartValues = trafficChartRows.map((r) => Number(r.daily_views || 0));
  const chartClickValues = trafficChartRows.map((r) => Number(r.daily_clicks || 0));

  // Total consolidado da tabela analítica de Top Presells
  const topPresellTotals = topPresellPages.reduce(
    (acc, pg) => {
      acc.views += Number(pg.views || 0);
      acc.clicks += Number(pg.clicks || 0);
      return acc;
    },
    { views: 0, clicks: 0 }
  );
  const topPresellTotalCtr =
    topPresellTotals.views > 0 ? (topPresellTotals.clicks / topPresellTotals.views) * 100 : 0;

  // Cálculo de dispositivos
  const totalDevicesRaw = devicesStats.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const mobileCount = Number(devicesStats.find((d) => d.device_type === 'mobile')?.total || 0);
  const tabletCount = Number(devicesStats.find((d) => d.device_type === 'tablet')?.total || 0);
  const desktopCount = Number(devicesStats.find((d) => d.device_type === 'desktop')?.total || 0);

  const mobilePct = totalDevicesRaw > 0 ? Math.round((mobileCount / totalDevicesRaw) * 100) : 0;
  const tabletPct = totalDevicesRaw > 0 ? Math.round((tabletCount / totalDevicesRaw) * 100) : 0;
  const desktopPct = totalDevicesRaw > 0 ? Math.round((desktopCount / totalDevicesRaw) * 100) : 0;

  // Períodos disponíveis para o seletor
  const periods = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'ontem', label: 'Ontem' },
    { id: '7d', label: '7 Dias' },
    { id: '30d', label: '30 Dias' },
    { id: 'mes', label: 'Este Mês' },
    { id: 'tudo', label: 'Tudo' },
  ];

  const customPeriodObj = parseCustomDatePeriod(period);
  const currentPeriodLabel = customPeriodObj
    ? customPeriodObj.label
    : (periods.find((p) => p.id === period)?.label || '7 Dias');

  const updatedAtLabel = formatTimeBR(new Date());

  return (
    <div className="w-100">
      {/* BASELINE 4 — Cabeçalho Minimalista */}
      <HevonPageHeader
        title="Painel Executivo"
        subtitle="Desempenho consolidado de tráfego, links e conversão."
        actions={
          <>
            <div className="responsive-toolbar-scroll" role="group" aria-label="Filtro de período">
              {periods.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/dashboard?period=${p.id}`}
                  className={`period-pill ${period === p.id ? 'active' : ''}`}
                >
                  {p.label}
                </Link>
              ))}
              <PeriodDateFilter basePath="/admin/dashboard" currentPeriod={period} />
            </div>

            <HevonLiveAutoRefresh intervalMs={5000} initialTime={updatedAtLabel} />

            <Link
              href="/admin/presells/create"
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Nova Presell</span>
            </Link>
          </>
        }
      />

      {/* ANDAR 1 — Faixa de 4 KPIs Executivos (sem ícones decorativos, 3 linhas cada) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <HevonMetricCard
            label="Visualizações"
            value={formatNumber(presellViews)}
            context={`Presells · janela ${currentPeriodLabel}`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <HevonMetricCard
            label="Cliques no CTA"
            value={formatNumber(presellClicks)}
            context={`${formatPercent(presellCtrNum)} de CTR no período`}
            tone="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <HevonMetricCard
            label="Pessoas Únicas"
            value={formatNumber(uniqueVisitors)}
            context={`${formatNumber(totalLinkClicks)} funis ativos · ${formatNumber(activeSessions)} presells ativas`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <HevonMetricCard
            label="Engajamento Jogos"
            value={formatNumber(gamesStats.total)}
            context="Jogadas acumuladas nos 4 jogos interativos"
            tone="success"
          />
        </div>
      </div>

      {/* ANDAR 2 — Visual Principal Minimalista + Feed Recente */}
      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <div className="hevon-card h-100 d-flex flex-column">
            <div
              className="px-4 py-3 d-flex justify-content-between align-items-center"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
            >
              <div>
                <div className="hevon-eyebrow mb-0.5">Série Temporal</div>
                <h2 className="hevon-section-title">
                  Curva de Tráfego ({currentPeriodLabel})
                </h2>
              </div>
              <span className="hevon-data-secondary hevon-tabular">
                {formatNumber(presellViews)} visitas · {formatNumber(presellClicks)} cliques
              </span>
            </div>
            <div className="p-4 flex-grow-1 d-flex flex-column justify-content-center">
              <DashboardRevenueChart
                labels={chartLabels}
                values={chartValues}
                secondaryValues={chartClickValues}
                height={240}
                unitLabel="Visualizações"
                secondaryLabel="Cliques CTA"
                valuePrefix=""
                valueSuffix=""
                decimals={0}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="hevon-card h-100 d-flex flex-column">
            <div
              className="px-4 py-3 d-flex justify-content-between align-items-center"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
            >
              <div>
                <div className="hevon-eyebrow mb-0.5">Operação</div>
                <h2 className="hevon-section-title">Atividade Recente</h2>
              </div>
              <HevonStatusBadge variant="neutral">Últimos {recentEvents.length}</HevonStatusBadge>
            </div>
            <div className="p-3 flex-grow-1" style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {recentEvents.length === 0 ? (
                <HevonEmptyState
                  icon={Clock}
                  title="Sem atividade recente"
                  description="Novos acessos e cliques aparecerão aqui."
                />
              ) : (
                <div className="d-flex flex-column">
                  {recentEvents.map((event, idx) => {
                    const isClick = event.event_type === 'click' || event.event_type === 'cta_click';
                    const timeStr = formatTimeBR(event.created_at);
                    const locationLabel = event.city
                      ? `${event.city}${event.region ? `, ${event.region}` : ''}`
                      : event.device_type || 'Visitante';

                    return (
                      <div
                        key={event.id || idx}
                        className="d-flex align-items-center justify-content-between py-2 px-2"
                        style={{
                          borderBottom:
                            idx < recentEvents.length - 1
                              ? '1px solid hsl(var(--border) / 0.5)'
                              : 'none',
                        }}
                      >
                        <div className="text-truncate pe-2" style={{ minWidth: 0 }}>
                          <div className="d-flex align-items-center gap-2">
                            <HevonStatusBadge variant={isClick ? 'primary' : 'neutral'} dot>
                              {isClick ? 'Clique' : 'Visita'}
                            </HevonStatusBadge>
                            <span className="hevon-body fw-medium text-truncate">
                              {locationLabel}
                            </span>
                          </div>
                          {event.utm_source && (
                            <div className="hevon-data-secondary hevon-mono mt-0.5 text-truncate">
                              utm: {event.utm_source}
                            </div>
                          )}
                        </div>
                        <span className="hevon-data-secondary hevon-mono hevon-tabular flex-shrink-0">
                          {timeStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ANDAR 3 — Tabela Analítica Respirável (com linha Total) + Origem de Tráfego */}
      <div className="row g-3 mb-4">
        <div className="col-lg-7">
          <div className="hevon-card h-100 overflow-hidden d-flex flex-column">
            <div
              className="px-4 py-3 d-flex justify-content-between align-items-center"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
            >
              <div>
                <div className="hevon-eyebrow mb-0.5">Desempenho por Página</div>
                <h2 className="hevon-section-title">Top Páginas Presell</h2>
              </div>
              <Link
                href="/admin/presells"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
              >
                <span>Ver todas</span>
                <ChevronRight size={13} />
              </Link>
            </div>
            <div className="table-responsive flex-grow-1">
              <table className="table table-hover align-middle mb-0 hevon-table-standard">
                <thead>
                  <tr>
                    <th>Página</th>
                    <th className="text-end">Visualizações</th>
                    <th className="text-end">Cliques</th>
                    <th className="text-end">CTR</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {topPresellPages.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <HevonEmptyState
                          title="Nenhuma página com tráfego no período"
                          description="Crie ou compartilhe uma presell para acompanhar a conversão aqui."
                        />
                      </td>
                    </tr>
                  ) : (
                    <>
                      {topPresellPages.map((pg) => {
                        const v = Number(pg.views || 0);
                        const c = Number(pg.clicks || 0);
                        const ctrVal = v > 0 ? (c / v) * 100 : 0;

                        return (
                          <tr key={pg.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '9999px',
                                    background:
                                      pg.status === 'active'
                                        ? 'hsl(var(--success))'
                                        : 'hsl(var(--muted-foreground))',
                                    flexShrink: 0,
                                  }}
                                />
                                <div>
                                  <div className="hevon-data-primary">{pg.name}</div>
                                  <div className="hevon-data-secondary hevon-mono">/{pg.slug}</div>
                                </div>
                              </div>
                            </td>
                            <td className="text-end hevon-tabular">{formatNumber(v)}</td>
                            <td className="text-end hevon-tabular">{formatNumber(c)}</td>
                            <td className="text-end hevon-tabular">
                              <HevonStatusBadge variant={ctrVal >= 20 ? 'success' : 'neutral'}>
                                {formatPercent(ctrVal)}
                              </HevonStatusBadge>
                            </td>
                            <td className="text-end">
                              <div className="d-inline-flex align-items-center gap-1.5">
                                <Link
                                  href={`/admin/presells/analytics/${pg.id}?period=${period}`}
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  Analytics
                                </Link>
                                <a
                                  href={`/p/${pg.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hevon-icon-btn"
                                  title="Abrir página publicada"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="hevon-table-total-row">
                        <td>Total (Top {topPresellPages.length})</td>
                        <td className="text-end hevon-tabular">{formatNumber(topPresellTotals.views)}</td>
                        <td className="text-end hevon-tabular">{formatNumber(topPresellTotals.clicks)}</td>
                        <td className="text-end hevon-tabular">{formatPercent(topPresellTotalCtr)}</td>
                        <td />
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="hevon-card h-100 d-flex flex-column">
            <div
              className="px-4 py-3"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
            >
              <div className="hevon-eyebrow mb-0.5">Aquisição</div>
              <h2 className="hevon-section-title">Origem de Tráfego (UTMs)</h2>
            </div>
            <div className="p-4 flex-grow-1">
              {topUtms.length === 0 ? (
                <HevonEmptyState
                  title="Sem origens registradas"
                  description="As fontes UTM do período aparecerão aqui."
                />
              ) : (
                <div className="d-flex flex-column gap-3">
                  {topUtms.map((u, idx) => {
                    const maxUtm = Math.max(1, Number(topUtms[0]?.total || 1));
                    const totalAllUtms =
                      topUtms.reduce((acc, curr) => acc + Number(curr.total || 0), 0) || 1;
                    const pctOfMax = Math.round((Number(u.total || 0) / maxUtm) * 100);
                    const pctOfTotal = Math.round((Number(u.total || 0) / totalAllUtms) * 100);

                    return (
                      <div key={idx}>
                        <div className="d-flex justify-content-between align-items-baseline mb-1.5">
                          <span className="hevon-body fw-medium text-truncate pe-2">
                            {u.source}
                          </span>
                          <span className="hevon-data-secondary hevon-tabular flex-shrink-0">
                            <strong style={{ color: 'hsl(var(--foreground))' }}>
                              {formatNumber(u.total)}
                            </strong>{' '}
                            ({pctOfTotal}%)
                          </span>
                        </div>
                        <div className="progress" style={{ height: '5px' }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${pctOfMax}%` }}
                          />
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

      {/* Distribuição de Dispositivos & Engajamento em Gamificação */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="hevon-card h-100">
            <div
              className="px-4 py-3"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
            >
              <div className="hevon-eyebrow mb-0.5">Audiência</div>
              <h2 className="hevon-section-title">Dispositivos dos Visitantes</h2>
            </div>
            <div className="p-4">
              <div className="row g-3 mb-3">
                <div className="col-4">
                  <div className="hevon-metric-label">Celular</div>
                  <div className="hevon-kpi-value mt-1" style={{ fontSize: '20px' }}>
                    {formatNumber(mobileCount)}
                  </div>
                  <div className="hevon-data-secondary hevon-tabular">{mobilePct}%</div>
                </div>
                <div className="col-4">
                  <div className="hevon-metric-label">Computador</div>
                  <div className="hevon-kpi-value mt-1" style={{ fontSize: '20px' }}>
                    {formatNumber(desktopCount)}
                  </div>
                  <div className="hevon-data-secondary hevon-tabular">{desktopPct}%</div>
                </div>
                <div className="col-4">
                  <div className="hevon-metric-label">Tablet</div>
                  <div className="hevon-kpi-value mt-1" style={{ fontSize: '20px' }}>
                    {formatNumber(tabletCount)}
                  </div>
                  <div className="hevon-data-secondary hevon-tabular">{tabletPct}%</div>
                </div>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div
                  className="progress-bar"
                  style={{ width: `${mobilePct}%`, background: 'hsl(var(--primary))' }}
                />
                <div
                  className="progress-bar"
                  style={{ width: `${desktopPct}%`, background: 'hsl(var(--muted-foreground) / 0.45)' }}
                />
                <div
                  className="progress-bar"
                  style={{ width: `${tabletPct}%`, background: 'hsl(var(--muted-foreground) / 0.25)' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="hevon-card h-100">
            <div
              className="px-4 py-3 d-flex justify-content-between align-items-center"
              style={{ borderBottom: '1px solid hsl(var(--border) / 0.65)' }}
            >
              <div>
                <div className="hevon-eyebrow mb-0.5">Gamificação</div>
                <h2 className="hevon-section-title">Engajamento Acumulado</h2>
              </div>
              <Link
                href="/admin/games"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
              >
                <span>Central de Jogos</span>
                <ChevronRight size={13} />
              </Link>
            </div>
            <div className="p-4">
              <div className="row g-3 mb-3">
                <div className="col-6 col-sm-3">
                  <div className="hevon-metric-label">Roleta</div>
                  <div className="hevon-kpi-value mt-1" style={{ fontSize: '20px' }}>
                    {formatNumber(gamesStats.wheel)}
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="hevon-metric-label">Raspadinha</div>
                  <div className="hevon-kpi-value mt-1" style={{ fontSize: '20px' }}>
                    {formatNumber(gamesStats.scratch)}
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="hevon-metric-label">Caixa</div>
                  <div className="hevon-kpi-value mt-1" style={{ fontSize: '20px' }}>
                    {formatNumber(gamesStats.box)}
                  </div>
                </div>
                <div className="col-6 col-sm-3">
                  <div className="hevon-metric-label">Quebra-Cabeça</div>
                  <div className="hevon-kpi-value mt-1" style={{ fontSize: '20px' }}>
                    {formatNumber(gamesStats.puzzle)}
                  </div>
                </div>
              </div>
              <div
                className="pt-2.5 d-flex align-items-center justify-content-between"
                style={{ borderTop: '1px solid hsl(var(--border) / 0.55)' }}
              >
                <span className="hevon-data-secondary">Total acumulado nos 4 jogos</span>
                <span className="hevon-data-primary hevon-tabular">
                  {formatNumber(gamesStats.total)} jogadas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé Metodológico Discreto (Baseline 4) */}
      <footer className="hevon-methodology-footer">
        Fontes: <span className="hevon-mono">presell_events</span>, <span className="hevon-mono">campaigns</span> e módulos de gamificação · Janela selecionada:{' '}
        <strong>{currentPeriodLabel}</strong> · Pessoas únicas calculadas por IP distinto no período · Fuso{' '}
        <span className="hevon-mono">America/Sao_Paulo</span>.
      </footer>
    </div>
  );
}
