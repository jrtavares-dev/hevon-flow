import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import {
  getPresellById,
  getPresellFullAnalytics,
  parseCustomDatePeriod,
} from '@/lib/models/presell';
import BrazilMap from '@/components/BrazilMap';
import PeriodDateFilter from '@/components/PeriodDateFilter';
import PresellLiveMetricsClient from '@/components/presells/PresellLiveMetricsClient';
import { HevonStatusBadge } from '@/components/hevon';
import {
  ArrowLeft,
  FileSpreadsheet,
  Pencil,
  ExternalLink,
  Eye,
  Users,
  MousePointerClick,
  Zap,
  Shuffle,
  Trophy,
  TrendingUp,
  MessageCircle,
  Target,
  Filter,
  Link2,
  Smartphone,
  Laptop,
  Tablet,
  Building2,
  MapPin,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Bot,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function PresellAnalyticsPage({ params, searchParams }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const period = resolvedSearchParams?.period || 'tudo';

  const page = await getPresellById(id);
  if (!page) notFound();

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

  // Load analytics with in-memory caching and optimized parallel execution
  const {
    summary,
    timeSeries,
    buttonStats,
    utmStats,
    deviceStats,
    geoStats,
    abStats,
    recentEvents,
    heatmap,
    cloakStats,
  } = await getPresellFullAnalytics(page, period);

  const pageUrl = `/p/${page.slug}`;
  const avatar = page.avatar_url || '/uploads/presells/cherminho_avatar.jpg';

  // A/B stats variables
  const statA = abStats?.A || { views: 0, clicks: 0, uniques: 0, ctr: 0, is_winner: false };
  const statB = abStats?.B || { views: 0, clicks: 0, uniques: 0, ctr: 0, is_winner: false };
  const totalAbViews = statA.views + statB.views;
  const shareA = totalAbViews > 0 ? Math.round((statA.views / totalAbViews) * 100) : 50;
  const shareB = totalAbViews > 0 ? Math.round((statB.views / totalAbViews) * 100) : 50;

  const maxChartVal = Math.max(...timeSeries.views, ...timeSeries.clicks, 10);

  return (
    <div className="w-100">
      {/* Header / Navigation (HEVON Baseline 4) */}
      <div className="hevon-page-header">
        <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
          <Link
            href={`/admin/presells?period=${period}`}
            className="hevon-icon-btn flex-shrink-0"
            style={{ width: '36px', height: '36px' }}
            title="Voltar para Presells"
          >
            <ArrowLeft size={16} />
          </Link>
          <div
            className="rounded-circle overflow-hidden flex-shrink-0"
            style={{
              width: '38px',
              height: '38px',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <img
              src={avatar}
              alt="Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className="text-truncate">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <h1 className="hevon-page-title text-truncate">{page.name}</h1>
              <HevonStatusBadge variant={page.status === 'active' ? 'success' : 'neutral'} dot>
                {page.status === 'active' ? 'Ativa' : 'Inativa'}
              </HevonStatusBadge>
            </div>
            <div className="hevon-data-secondary text-truncate mt-0.5">
              Headline: <strong style={{ color: 'hsl(var(--foreground))' }}>{page.headline || page.subheadline || 'Sem título'}</strong> · Slug:{' '}
              <span className="hevon-mono text-primary">/p/{page.slug}</span>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
          {/* Period Filters */}
          <div className="responsive-toolbar-scroll" role="group" aria-label="Filtro de período">
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
                href={`/admin/presells/analytics/${page.id}?period=${p.id}`}
                className={`period-pill ${period === p.id ? 'active' : ''}`}
                prefetch={true}
              >
                {p.label}
              </Link>
            ))}
            <PeriodDateFilter
              basePath={`/admin/presells/analytics/${page.id}`}
              currentPeriod={period}
            />
          </div>

          {/* Action Buttons (1 única ação primária HEVON) */}
          <div className="d-flex align-items-center gap-1.5">
            <a
              href={`/admin/presells/export/${page.id}?period=${period}`}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
              title="Baixar relatório CSV"
            >
              <FileSpreadsheet size={13} /> <span>CSV</span>
            </a>
            <Link
              href={`/admin/presells/edit/${page.id}`}
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
            >
              <Pencil size={13} /> <span>Editar</span>
            </Link>
            <a
              href={pageUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5"
            >
              <ExternalLink size={13} /> <span>Ver Página</span>
            </a>
          </div>
        </div>
      </div>

      {/* ANDARES 1 & 2 — 4 KPIs + Gráfico Temporal + Desempenho por Botão em TEMPO REAL automático (3s, sem F5) */}
      <PresellLiveMetricsClient
        pageId={page.id}
        period={period}
        currentPeriodLabel={currentPeriodLabel}
        initialSummary={summary}
        initialTimeSeries={timeSeries}
        initialButtonStats={buttonStats}
        intervalMs={3000}
      />

      {/* A/B Testing Head-to-Head Comparison Card */}
      {(Boolean(page.ab_test_enabled) || (statB.views || 0) > 0) && (
        <div className="card shadow-sm border mb-4" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
          <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center border-bottom flex-wrap gap-2" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: '34px',
                  height: '34px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <Shuffle size={18} />
              </div>
              <div>
                <h5 className="mb-0 fs-6 fw-bold" style={{ color: 'var(--text-main)' }}>Teste A/B Automático (Divisão 50% / 50%)</h5>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  Comparativo de performance e conversão em tempo real entre as duas versões
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill fw-bold" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '11px', padding: '4px 8px' }}>
                Divisão 50/50 Cookie
              </span>
              {statA.is_winner ? (
                <span className="badge rounded-pill fw-bold d-inline-flex align-items-center gap-1" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '11px', padding: '4px 8px' }}>
                  <Trophy size={13} /> Vencedor: Variação A (+
                  {Math.round(statA.ctr - statB.ctr)}% CTR)
                </span>
              ) : statB.is_winner ? (
                <span className="badge rounded-pill fw-bold d-inline-flex align-items-center gap-1" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '11px', padding: '4px 8px' }}>
                  <Trophy size={13} /> Vencedor: Variação B (+
                  {Math.round(statB.ctr - statA.ctr)}% CTR)
                </span>
              ) : (
                <span className="badge rounded-pill fw-bold" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '11px', padding: '4px 8px' }}>
                  Em Coleta de Dados
                </span>
              )}
            </div>
          </div>

          <div className="card-body p-4">
            <div className="row g-4">
              {/* Variação A */}
              <div className="col-md-6">
                <div
                  className="p-3 rounded-4 border h-100 position-relative"
                  style={{
                    background: statA.is_winner ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface-subtle)',
                    borderColor: statA.is_winner ? '#10b981' : 'var(--border-subtle)',
                  }}
                >
                  {statA.is_winner && (
                    <div className="position-absolute top-0 end-0 translate-middle-y me-3">
                      <span className="badge rounded-pill fw-bold d-inline-flex align-items-center gap-1 px-3 py-1" style={{ background: '#10b981', color: '#ffffff' }}>
                        <Trophy size={13} /> MELHOR CONVERSÃO
                      </span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge font-monospace px-2 py-1 fw-bold rounded-pill" style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        Variação A
                      </span>
                      <span className="fw-bold" style={{ color: 'var(--text-main)' }}>Padrão / Original</span>
                    </div>
                    <span className="text-muted small">{shareA}% do tráfego</span>
                  </div>
                  <div className="small mb-3">
                    <div className="text-muted" style={{ fontSize: '11px' }}>Headline A:</div>
                    <div className="fw-semibold text-truncate" style={{ color: 'var(--text-main)' }}>{page.headline || 'Sem título'}</div>
                    {page.button_text && (
                      <>
                        <div className="text-muted mt-1" style={{ fontSize: '11px' }}>Botão A:</div>
                        <div className="fw-semibold text-truncate" style={{ color: '#10b981' }}>{page.button_text}</div>
                      </>
                    )}
                  </div>
                  <div className="row text-center g-2">
                    <div className="col-4">
                      <div className="p-2 border rounded-3" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                        <div className="text-muted" style={{ fontSize: '10.5px' }}>Views</div>
                        <div className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>{Number(statA.views).toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 border rounded-3" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                        <div className="text-muted" style={{ fontSize: '10.5px' }}>Cliques</div>
                        <div className="fw-bold fs-5" style={{ color: '#10b981' }}>{Number(statA.clicks).toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 border rounded-3" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                        <div className="text-muted" style={{ fontSize: '10.5px' }}>Taxa CTR</div>
                        <div className="fw-bold fs-5" style={{ color: '#10b981' }}>
                          {Number(statA.ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variação B */}
              <div className="col-md-6">
                <div
                  className="p-3 rounded-4 border h-100 position-relative"
                  style={{
                    background: statB.is_winner ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface-subtle)',
                    borderColor: statB.is_winner ? '#10b981' : 'var(--border-subtle)',
                  }}
                >
                  {statB.is_winner && (
                    <div className="position-absolute top-0 end-0 translate-middle-y me-3">
                      <span className="badge rounded-pill fw-bold d-inline-flex align-items-center gap-1 px-3 py-1" style={{ background: '#10b981', color: '#ffffff' }}>
                        <Trophy size={13} /> MELHOR CONVERSÃO
                      </span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="badge font-monospace px-2 py-1 fw-bold rounded-pill"
                        style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                      >
                        Variação B
                      </span>
                      <span className="fw-bold" style={{ color: 'var(--text-main)' }}>Versão Alternativa</span>
                    </div>
                    <span className="text-muted small">{shareB}% do tráfego</span>
                  </div>
                  <div className="small mb-3">
                    <div className="text-muted" style={{ fontSize: '11px' }}>Headline B:</div>
                    <div className="fw-semibold text-truncate" style={{ color: 'var(--text-main)' }}>
                      {page.ab_headline_b || page.headline || 'Mesma headline da A'}
                    </div>
                    {page.ab_button_text_b && (
                      <>
                        <div className="text-muted mt-1" style={{ fontSize: '11px' }}>Botão B:</div>
                        <div className="fw-semibold text-truncate" style={{ color: '#10b981' }}>
                          {page.ab_button_text_b}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="row text-center g-2">
                    <div className="col-4">
                      <div className="p-2 border rounded-3" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                        <div className="text-muted" style={{ fontSize: '10.5px' }}>Views</div>
                        <div className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>{Number(statB.views).toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 border rounded-3" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                        <div className="text-muted" style={{ fontSize: '10.5px' }}>Cliques</div>
                        <div className="fw-bold fs-5" style={{ color: '#10b981' }}>{Number(statB.clicks).toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 border rounded-3" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                        <div className="text-muted" style={{ fontSize: '10.5px' }}>Taxa CTR</div>
                        <div className="fw-bold fs-5" style={{ color: '#10b981' }}>
                          {Number(statB.ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UTM Traffic Sources & Tech Devices Row */}
      <div className="row g-4 mb-4">
        {/* UTM Sources Table */}
        <div className="col-lg-7">
          <div className="card h-100 shadow-sm border" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
            <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center border-bottom" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <h5 className="mb-0 fs-6 fw-bold" style={{ color: 'var(--text-main)' }}>Origens de Tráfego (UTMs & Campanhas)</h5>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  Rastreamento por canal de anúncio e criativo
                </div>
              </div>
              <span className="badge rounded-pill fw-bold px-2.5 d-inline-flex align-items-center" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '11px', height: '24px' }}>
                {currentPeriodLabel}
              </span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-subtle)' }}>
                    <th style={{ color: 'var(--text-muted)', fontWeight: 700, paddingLeft: '16px' }}>Fonte (`utm_source`)</th>
                    <th className="text-center" style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Views</th>
                    <th className="text-center" style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Cliques</th>
                    <th className="text-center" style={{ color: 'var(--text-muted)', fontWeight: 700, paddingRight: '16px' }}>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {utmStats.sources.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted small">
                        <Filter size={28} className="opacity-50 text-secondary d-block mx-auto mb-1" />
                        Nenhuma origem de tráfego registrada no período.
                      </td>
                    </tr>
                  ) : (
                    utmStats.sources.map((src, idx) => (
                      <tr key={idx} style={{ borderColor: 'var(--border-subtle)' }}>
                        <td style={{ paddingLeft: '16px' }}>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: '26px', height: '26px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.15)' }}
                            >
                              <Link2 size={13} />
                            </div>
                            <span className="fw-bold fs-6" style={{ color: 'var(--text-main)' }}>{src.source}</span>
                          </div>
                        </td>
                        <td className="text-center fw-semibold" style={{ color: 'var(--text-main)' }}>
                          {Number(src.views_count).toLocaleString('pt-BR')}
                        </td>
                        <td className="text-center fw-bold" style={{ color: '#10b981' }}>
                          {Number(src.clicks_count).toLocaleString('pt-BR')}
                        </td>
                        <td className="text-center" style={{ paddingRight: '16px' }}>
                          <span
                            className="badge rounded-pill fw-bold d-inline-flex align-items-center justify-content-center"
                            style={{
                              height: '22px',
                              fontSize: '11px',
                              padding: '0 8px',
                              background: src.ctr > 20 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                              color: src.ctr > 20 ? '#10b981' : 'var(--text-muted)',
                              border: `1px solid ${src.ctr > 20 ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`,
                            }}
                          >
                            {Number(src.ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Devices & Technology */}
        <div className="col-lg-5">
          <div className="card h-100 shadow-sm border" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
            <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center border-bottom" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <h5 className="mb-0 fs-6 fw-bold" style={{ color: 'var(--text-main)' }}>Dispositivos & Sistemas</h5>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  Aparelhos e plataformas dos visitantes
                </div>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="row g-2 text-center mb-4">
                <div className="col-4">
                  <div className="p-3 border rounded-3" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <Smartphone size={22} style={{ color: '#10b981' }} className="d-block mx-auto mb-1" />
                    <div className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>{Number(deviceStats.devices.mobile || 0).toLocaleString('pt-BR')}</div>
                    <div className="text-muted small">Celular</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 border rounded-3" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <Laptop size={22} style={{ color: '#94a3b8' }} className="d-block mx-auto mb-1" />
                    <div className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>{Number(deviceStats.devices.desktop || 0).toLocaleString('pt-BR')}</div>
                    <div className="text-muted small">Computador</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 border rounded-3" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <Tablet size={22} style={{ color: '#10b981' }} className="d-block mx-auto mb-1" />
                    <div className="fw-bold fs-5" style={{ color: 'var(--text-main)' }}>{Number(deviceStats.devices.tablet || 0).toLocaleString('pt-BR')}</div>
                    <div className="text-muted small">Tablet</div>
                  </div>
                </div>
              </div>

              <div className="fw-bold small mb-2.5" style={{ color: 'var(--text-main)' }}>Sistemas Operacionais:</div>
              {deviceStats.os.length === 0 ? (
                <div className="text-muted small text-center py-2">Nenhum dado de sistema registrado.</div>
              ) : (
                <div className="d-flex flex-column gap-2.5">
                  {deviceStats.os.map((os, idx) => {
                    const totalOs = deviceStats.os.reduce((acc, curr) => acc + Number(curr.qty), 0) || 1;
                    const pct = Math.round((Number(os.qty) / totalOs) * 100);
                    return (
                      <div key={idx} className="d-flex align-items-center justify-content-between small">
                        <span className="fw-semibold" style={{ color: 'var(--text-main)', width: '80px' }}>{os.os_name}</span>
                        <div className="d-flex align-items-center gap-2.5 flex-grow-1" style={{ maxWidth: '65%' }}>
                          <div className="progress flex-grow-1" style={{ height: '6px', background: 'rgba(255, 255, 255, 0.06)' }}>
                            <div className="progress-bar" style={{ width: `${pct}%`, background: '#10b981', borderRadius: '999px' }}></div>
                          </div>
                          <span className="text-muted fw-bold text-end" style={{ width: '38px', fontSize: '11px' }}>{pct}%</span>
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

      {/* Brazil Interactive Heatmap Row */}
      <BrazilMap heatmap={heatmap} />

      {/* Top Cities Grid Row */}
      <div className="card shadow-sm border mb-4" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center border-bottom" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
          <div>
            <h5 className="mb-0 fs-6 fw-bold" style={{ color: 'var(--text-main)' }}>Top Cidades dos Visitantes & Conversão</h5>
            <div className="text-muted" style={{ fontSize: '11px' }}>
              Cidades com maior volume de tráfego e cliques
            </div>
          </div>
          <span className="badge rounded-pill fw-bold px-2.5 d-inline-flex align-items-center" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '11px', height: '24px' }}>
            {currentPeriodLabel}
          </span>
        </div>
        <div className="card-body p-4">
          {geoStats.cities.length === 0 ? (
            <div className="text-center text-muted py-4 small">
              <Building2 size={28} className="opacity-50 text-secondary d-block mx-auto mb-1" />
              Nenhuma cidade registrada para esta página no período.
            </div>
          ) : (
            <div className="row g-3">
              {geoStats.cities.map((ct, idx) => {
                const maxClicks = Math.max(1, Number(geoStats.cities[0]?.clicks_count || 1));
                const pct = Math.round((Number(ct.clicks_count) / maxClicks) * 100);

                return (
                  <div key={idx} className="col-12 col-sm-6 col-xl-3">
                    <div
                      className="p-3 border rounded-3 h-100 d-flex flex-column justify-content-between"
                      style={{
                        background: 'var(--surface-subtle, #162032)',
                        borderColor: 'var(--border-subtle, #1e293b)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      {/* Top Header: City Name + UF Badge + CTR Badge */}
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-subtle, rgba(255,255,255,0.06))' }}>
                        <div className="d-flex align-items-center gap-2 text-truncate">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10b981',
                            }}
                          >
                            <MapPin size={14} />
                          </div>
                          <div className="text-truncate">
                            <span className="fw-bold d-block text-truncate" style={{ fontSize: '13.5px', color: 'var(--text-main, #f8fafc)' }}>
                              {ct.city_name}
                            </span>
                            {ct.state_code && (
                              <span
                                className="badge rounded-pill font-monospace"
                                style={{
                                  fontSize: '9.5px',
                                  padding: '1px 6px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  color: 'var(--text-muted, #94a3b8)',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                {ct.state_code}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className="badge rounded-pill fw-bold flex-shrink-0"
                          style={{
                            fontSize: '11px',
                            background: ct.ctr > 20 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            color: ct.ctr > 20 ? '#10b981' : 'var(--text-muted)',
                            border: `1px solid ${ct.ctr > 20 ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`,
                          }}
                        >
                          {Number(ct.ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% CTR
                        </span>
                      </div>

                      {/* Middle Stats: Views & Cliques with crisp spacing */}
                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ fontSize: '12px' }}>
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <Eye size={13} style={{ color: '#10b981' }} /> Visualizações:
                          </span>
                          <strong style={{ color: 'var(--text-main, #f8fafc)', fontSize: '12.5px' }}>
                            {Number(ct.views_count).toLocaleString('pt-BR')}
                          </strong>
                        </div>
                        <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '12px' }}>
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <MousePointerClick size={13} style={{ color: '#10b981' }} /> Cliques:
                          </span>
                          <strong style={{ color: '#10b981', fontSize: '12.5px' }}>
                            {Number(ct.clicks_count).toLocaleString('pt-BR')}
                          </strong>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="progress mt-1" style={{ height: '4px', background: 'rgba(255, 255, 255, 0.06)' }}>
                        <div className="progress-bar" role="progressbar" style={{ width: `${pct}%`, background: '#10b981', borderRadius: '999px' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CLOAKER SHIELD AUDIT CARD */}
      <div className="card shadow-sm border mb-4" style={{ background: 'var(--surface-card, #ffffff)', borderColor: 'var(--border-subtle, #e2e8f0)' }}>
        <div className="card-header bg-transparent py-3 px-4 d-flex justify-content-between align-items-center border-bottom flex-wrap gap-2" style={{ borderColor: 'var(--border-subtle, #e2e8f0)' }}>
          <div className="d-flex align-items-center gap-2">
            <div
              className="kpi-icon-box"
              style={{
                width: '36px',
                height: '36px',
                background: Boolean(cloakStats?.enabled) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                color: Boolean(cloakStats?.enabled) ? '#059669' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fs-6 fw-bold" style={{ color: 'var(--text-main, #0f172a)' }}>
                  Auditoria do Cloaker Shield (Proteção Anti-Bot)
                </h5>
                <span
                  className={`badge rounded-pill fw-bold ${
                    Boolean(cloakStats?.enabled) ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border'
                  }`}
                  style={{ fontSize: '10.5px' }}
                >
                  {Boolean(cloakStats?.enabled) ? 'ESCUDO ATIVO' : 'ESCUDO DESATIVADO'}
                </span>
              </div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                Detecção em tempo real de robôs de anúncios, crawlers e tráfego camuflado no período ({currentPeriodLabel})
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '11px' }}>
              Modo:{' '}
              <strong style={{ color: 'var(--text-main, #0f172a)' }}>
                {cloakStats?.mode === 'white_page'
                  ? 'Página White Segura'
                  : cloakStats?.mode === 'safe_redirect'
                  ? 'Redirecionamento Externo'
                  : 'Bloqueio 404'}
              </strong>
            </span>
            <Link
              href={`/admin/presells/edit/${page.id}#tab-cloak`}
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-1 px-2.5"
              style={{ fontSize: '11px', borderRadius: '8px' }}
              title="Ajustar configurações do Cloaker"
            >
              <Pencil size={12} /> Configurar
            </Link>
          </div>
        </div>

        <div className="card-body p-4">
          {/* 4 Mini-KPIs de Segurança */}
          <div className="row g-3 mb-4">
            {/* Robôs Bloqueados / Camuflados */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="p-3 rounded-3 border h-100"
                style={{
                  background: 'var(--surface-subtle, #f8fafc)',
                  borderColor: 'var(--border-subtle, #e2e8f0)',
                  borderLeft: '4px solid #ef4444',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                    Robôs & Revisores
                  </span>
                  <Bot size={16} className="text-danger" />
                </div>
                <div className="h3 fw-bold mb-0 text-danger" style={{ letterSpacing: '-0.02em' }}>
                  {Number(cloakStats?.bot_views || 0).toLocaleString('pt-BR')}
                </div>
                <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>
                  {summary.views > 0
                    ? `${((Number(cloakStats?.bot_views || 0) / summary.views) * 100).toFixed(1)}% do tráfego total`
                    : 'Nenhum robô detectado'}
                </div>
              </div>
            </div>

            {/* Página White Exibida */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="p-3 rounded-3 border h-100"
                style={{
                  background: 'var(--surface-subtle, #f8fafc)',
                  borderColor: 'var(--border-subtle, #e2e8f0)',
                  borderLeft: '4px solid #3b82f6',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                    Página White Exibida
                  </span>
                  <FileSpreadsheet size={16} className="text-primary" />
                </div>
                <div className="h3 fw-bold mb-0 text-primary" style={{ letterSpacing: '-0.02em' }}>
                  {Number(cloakStats?.white_page_views || 0).toLocaleString('pt-BR')}
                </div>
                <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>
                  revisores direcionados ao artigo
                </div>
              </div>
            </div>

            {/* Tráfego Humano Limpo */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="p-3 rounded-3 border h-100"
                style={{
                  background: 'var(--surface-subtle, #f8fafc)',
                  borderColor: 'var(--border-subtle, #e2e8f0)',
                  borderLeft: '4px solid #10b981',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                    Tráfego Humano Real
                  </span>
                  <UserCheck size={16} className="text-success" />
                </div>
                <div className="h3 fw-bold mb-0 text-success" style={{ letterSpacing: '-0.02em' }}>
                  {Number(cloakStats?.human_views || (summary.views - (cloakStats?.bot_views || 0))).toLocaleString('pt-BR')}
                </div>
                <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>
                  compradores viram a presell real
                </div>
              </div>
            </div>

            {/* CTR Humano Real */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="p-3 rounded-3 border h-100"
                style={{
                  background: 'var(--surface-subtle, #f8fafc)',
                  borderColor: 'var(--border-subtle, #e2e8f0)',
                  borderLeft: '4px solid #f59e0b',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                    CTR Humano Real
                  </span>
                  <Zap size={16} className="text-warning" />
                </div>
                <div className="h3 fw-bold mb-0" style={{ color: '#d97706', letterSpacing: '-0.02em' }}>
                  {Number(cloakStats?.human_ctr || summary.ctr).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                </div>
                <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>
                  {summary.ctr !== (cloakStats?.human_ctr || summary.ctr) ? (
                    <span className="text-success fw-semibold">
                      +{((cloakStats?.human_ctr || summary.ctr) - summary.ctr).toFixed(1)}% acima do CTR bruto
                    </span>
                  ) : (
                    'conversão 100% autêntica'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Robôs e Crawlers Detectados */}
          {cloakStats?.top_bots && cloakStats.top_bots.length > 0 ? (
            <div className="pt-3 border-top" style={{ borderColor: 'var(--border-subtle, #e2e8f0)' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main, #0f172a)' }}>
                  <Bot size={15} className="text-danger" />
                  <span>Principais Robôs & Ferramentas Detectadas no Período</span>
                </span>
                <span className="badge bg-light text-muted border small" style={{ fontSize: '11px' }}>
                  Total: {Number(cloakStats?.bot_views || 0).toLocaleString('pt-BR')} requisições
                </span>
              </div>

              <div className="row g-2.5">
                {cloakStats.top_bots.map((bot, idx) => {
                  const botShare = cloakStats.bot_views > 0 ? Math.round((bot.count / cloakStats.bot_views) * 100) : 0;
                  return (
                    <div key={`bot-${idx}`} className="col-12 col-md-6">
                      <div
                        className="p-2.5 rounded-2 border"
                        style={{ background: 'var(--surface-subtle, #f8fafc)', borderColor: 'var(--border-subtle, #e2e8f0)' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold small text-truncate" style={{ color: 'var(--text-main, #0f172a)', maxWidth: '75%', fontSize: '12px' }}>
                            {bot.label}
                          </span>
                          <span className="badge rounded-pill fw-bold" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '11px' }}>
                            {bot.count.toLocaleString('pt-BR')} ({botShare}%)
                          </span>
                        </div>
                        <div className="progress mb-1.5" style={{ height: '4px', background: 'var(--surface-muted, #e2e8f0)' }}>
                          <div
                            className="progress-bar bg-danger"
                            role="progressbar"
                            style={{ width: `${botShare}%`, borderRadius: '999px' }}
                          />
                        </div>
                        <div className="text-muted font-monospace text-truncate" style={{ fontSize: '10px' }} title={bot.user_agent}>
                          {bot.user_agent}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-muted small rounded-2 border" style={{ background: 'var(--surface-subtle, #f8fafc)', borderColor: 'var(--border-subtle, #e2e8f0)' }}>
              Nenhum robô ou crawler de anúncio detectado neste período selecionado ({currentPeriodLabel}).
            </div>
          )}
        </div>
      </div>

      {/* Recent Events Log Table */}
      <div className="card shadow-sm border mb-4" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center border-bottom" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
          <div>
            <h5 className="mb-0 fs-6 fw-bold" style={{ color: 'var(--text-main)' }}>Feed de Acessos Recentes em Tempo Real</h5>
            <div className="text-muted" style={{ fontSize: '11px' }}>
              Últimas visualizações e cliques registrados
            </div>
          </div>
          <span className="badge rounded-pill fw-bold d-inline-flex align-items-center gap-1.5" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '11px', height: '24px', padding: '0 10px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Live Stream
          </span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ borderColor: 'var(--border-subtle)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-subtle)' }}>
                <th style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px', paddingLeft: '16px' }}>Data / Hora</th>
                <th style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px' }}>Tipo de Evento</th>
                <th style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px' }}>Variação</th>
                <th style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px' }}>Dispositivo / SO</th>
                <th style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px' }}>Localização</th>
                <th style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px', paddingRight: '16px' }}>IP / Bot</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted small">
                    Nenhum evento registrado recentemente.
                  </td>
                </tr>
              ) : (
                recentEvents.map((ev, idx) => (
                  <tr key={idx} style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="small text-muted font-monospace" style={{ paddingLeft: '16px' }}>
                      {ev.created_at ? new Date(ev.created_at).toLocaleString('pt-BR') : ''}
                    </td>
                    <td>
                      <span
                        className="badge rounded-pill fw-bold px-2.5 py-1 d-inline-flex align-items-center gap-1"
                        style={{
                          fontSize: '11px',
                          background: ev.event_type === 'click' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                          color: ev.event_type === 'click' ? '#10b981' : '#94a3b8',
                          border: `1px solid ${ev.event_type === 'click' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                        }}
                      >
                        {ev.event_type === 'click' ? 'Clique em Botão' : 'Visualização'}
                      </span>
                    </td>
                    <td>
                      <span className="badge rounded-pill font-monospace fw-bold px-2 py-0.5" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                        {ev.variation || 'A'}
                      </span>
                    </td>
                    <td>
                      <span className="small fw-semibold" style={{ color: 'var(--text-main)' }}>{ev.device_type}</span>
                      {ev.os && <span className="small text-muted ms-1">({ev.os})</span>}
                    </td>
                    <td>
                      <span className="small" style={{ color: 'var(--text-main)' }}>{ev.city || 'Desconhecida'}</span>
                      {ev.region && <span className="small text-muted ms-1">/ {ev.region}</span>}
                    </td>
                    <td style={{ paddingRight: '16px' }}>
                      <span className="font-monospace small text-muted">{ev.ip_address}</span>
                      {Boolean(ev.is_bot) && (
                        <span className="badge rounded-pill fw-bold px-2 py-0.5 ms-1" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '10px' }}>
                          BOT
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="hevon-methodology-footer">
        Fonte: <span className="hevon-mono">presell_events</span> (página <span className="hevon-mono">/p/{page.slug}</span>) ·
        Janela: <strong>{currentPeriodLabel}</strong> · Atualização automática em tempo real a cada 5s (cache deduplicado 3s) ·
        Fuso <span className="hevon-mono">America/Sao_Paulo</span>.
      </footer>
    </div>
  );
}
