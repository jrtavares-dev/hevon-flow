import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import Link from 'next/link';
import {
  TrendingUp,
  Eye,
  CheckCircle2,
  XCircle,
  Shuffle,
  MapPin,
  Receipt,
  Users,
  DollarSign,
  Percent,
  Pencil,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CampaignAnalyticsPage({ params }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const { id } = await params;
  const campaign = await queryOne('SELECT * FROM campaigns WHERE id = ? LIMIT 1', [id]);
  if (!campaign) redirect('/admin/campaigns');

  // KPI Calculations
  const totalSessionsRow = await queryOne(
    'SELECT COUNT(*) as count FROM upsell_sessions WHERE campaign_id = ?',
    [id]
  );
  const totalSessions = Number(totalSessionsRow?.count || 0);

  const completedSessionsRow = await queryOne(
    "SELECT COUNT(*) as count FROM upsell_sessions WHERE campaign_id = ? AND status = 'completed'",
    [id]
  );
  const completedSessions = Number(completedSessionsRow?.count || 0);

  const totalRevenueRow = await queryOne(
    'SELECT SUM(revenue) as total FROM upsell_sessions WHERE campaign_id = ?',
    [id]
  );
  const totalRevenue = Number(totalRevenueRow?.total || 0);

  const arpu = totalSessions > 0 ? (totalRevenue / totalSessions).toFixed(2) : '0,00';
  const globalConversionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : '0';

  // Level Waterfall Stats
  const levels = await query(
    'SELECT * FROM campaign_levels WHERE campaign_id = ? ORDER BY level_order ASC',
    [id]
  );

  const levelStats = [];
  for (const lvl of levels) {
    const viewsRow = await queryOne(
      "SELECT COUNT(*) as count FROM events WHERE campaign_id = ? AND campaign_level_id = ? AND event_type = 'page_view'",
      [id, lvl.id]
    );
    const views = Number(viewsRow?.count || 0);

    const acceptsRow = await queryOne(
      "SELECT COUNT(*) as count FROM events WHERE campaign_id = ? AND campaign_level_id = ? AND event_type IN ('cta_click', 'checkout')",
      [id, lvl.id]
    );
    const accepts = Number(acceptsRow?.count || 0);

    const declinesRow = await queryOne(
      "SELECT COUNT(*) as count FROM events WHERE campaign_id = ? AND campaign_level_id = ? AND event_type = 'cta_decline'",
      [id, lvl.id]
    );
    const declines = Number(declinesRow?.count || 0);

    const conversionRate = views > 0 ? ((accepts / views) * 100).toFixed(1) : '0';

    levelStats.push({
      level: lvl,
      views,
      accepts,
      declines,
      conversion_rate: conversionRate,
    });
  }

  // UTM Sources Breakdown
  const utmStats = await query(
    `SELECT COALESCE(NULLIF(utm_source, ''), 'Direto / Desconhecido') as source,
            COUNT(*) as sessions_count,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
            COALESCE(SUM(revenue), 0) as total_revenue
     FROM upsell_sessions
     WHERE campaign_id = ?
     GROUP BY COALESCE(NULLIF(utm_source, ''), 'Direto / Desconhecido')
     ORDER BY total_revenue DESC, sessions_count DESC
     LIMIT 5`,
    [id]
  );

  // Recent Orders
  const recentOrders = await query(
    `SELECT o.*, cl.name as level_name, s.customer_name, s.token as session_token
     FROM orders o
     JOIN campaign_levels cl ON o.campaign_level_id = cl.id
     JOIN upsell_sessions s ON o.upsell_session_id = s.id
     WHERE s.campaign_id = ?
     ORDER BY o.created_at DESC
     LIMIT 8`,
    [id]
  );

  // A/B Variant Metrics
  const abRaw = await query(
    `SELECT COALESCE(NULLIF(variant, ''), 'A') as variant_code,
            COUNT(*) as sessions_count,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
            COALESCE(SUM(revenue), 0) as total_revenue
     FROM upsell_sessions
     WHERE campaign_id = ?
     GROUP BY COALESCE(NULLIF(variant, ''), 'A')`,
    [id]
  );

  const abStats = {
    A: { sessions: 0, completed: 0, revenue: 0, cr: 0 },
    B: { sessions: 0, completed: 0, revenue: 0, cr: 0 },
  };

  for (const row of abRaw) {
    const v = row.variant_code || 'A';
    const sCount = Number(row.sessions_count || 0);
    const cCount = Number(row.completed_count || 0);
    const rev = Number(row.total_revenue || 0);
    const cr = sCount > 0 ? ((cCount / sCount) * 100).toFixed(1) : 0;
    if (abStats[v]) {
      abStats[v] = { sessions: sCount, completed: cCount, revenue: rev, cr };
    }
  }

  const campaignUrl = `/o/${campaign.slug}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2.5 mb-1">
            <h1 className="h3 fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ margin: 0, lineHeight: 1.2 }}>
              <TrendingUp size={24} className="text-primary" />
              Métricas do Funil: {campaign.name}
            </h1>
            <span className="badge rounded-pill" style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', fontWeight: 600, height: '24px', lineHeight: 1, alignSelf: 'center' }}>
              /o/{campaign.slug}
            </span>
          </div>
          <div className="text-muted small">
            Acompanhe a retenção em cascata, drop-off por etapa, origens de tráfego UTM e variantes A/B.
          </div>
        </div>
        <div className="btn-toolbar gap-2 mt-2 mt-md-0">
          <Link href={`/admin/campaigns/edit/${campaign.id}`} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm">
            <Pencil size={13} /> Editar Campanha
          </Link>
          <a href={campaignUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm">
            <ExternalLink size={13} /> Abrir Funil
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-5 g-3 mb-4">
        <div className="col">
          <div className="card shadow-sm border-0 rounded-4 h-100 p-3" style={{ background: 'var(--surface-card)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                Sessões
              </span>
              <div className="p-2 rounded-3" style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}>
                <Users size={16} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {totalSessions.toLocaleString('pt-BR')}
            </h3>
            <span className="text-muted small mt-1" style={{ fontSize: '0.74rem' }}>Iniciadas</span>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-0 rounded-4 h-100 p-3" style={{ background: 'var(--surface-card)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                Concluídos
              </span>
              <div className="p-2 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-success" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {completedSessions.toLocaleString('pt-BR')}
            </h3>
            <span className="text-muted small mt-1" style={{ fontSize: '0.74rem' }}>Funis finalizados</span>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-0 rounded-4 h-100 p-3" style={{ background: 'var(--surface-card)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                Taxa de Conversão
              </span>
              <div className="p-2 rounded-3" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
                <Percent size={16} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {globalConversionRate}%
            </h3>
            <span className="text-muted small mt-1" style={{ fontSize: '0.74rem' }}>Global</span>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-0 rounded-4 h-100 p-3" style={{ background: '#059669', color: '#ffffff' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-white text-opacity-75 small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                Receita Total
              </span>
              <div className="p-2 rounded-3 bg-white bg-opacity-20 text-white">
                <DollarSign size={16} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-white text-opacity-75 small mt-1" style={{ fontSize: '0.74rem' }}>Faturado</span>
          </div>
        </div>

        <div className="col">
          <div className="card shadow-sm border-0 rounded-4 h-100 p-3" style={{ background: 'var(--surface-card)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                ARPU (Médio)
              </span>
              <div className="p-2 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Sparkles size={16} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark" style={{ fontVariantNumeric: 'tabular-nums' }}>
              R$ {Number(arpu).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-muted small mt-1" style={{ fontSize: '0.74rem' }}>Por visitante</span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Waterfall Funnel Breakdown (Left Column) */}
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm border-0 rounded-4 h-100 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <Layers size={18} className="text-primary" />
                <h2 className="card-title mb-0 fs-6 fw-bold">Fluxo de Etapas (Retenção & Drop-Off)</h2>
              </div>
              <span className="badge rounded-pill bg-light text-secondary border">
                {levelStats.length} etapas
              </span>
            </div>
            <div className="card-body p-4">
              {levelStats.length === 0 ? (
                <p className="text-muted text-center py-4">Nenhum nível cadastrado nesta campanha.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {levelStats.map((stat, idx) => (
                    <div
                      key={stat.level.id}
                      className="p-3 rounded-4 border position-relative"
                      style={{ background: '#f8fafc', transition: 'all 0.2s ease' }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="badge rounded-pill text-white fw-bold"
                            style={{ background: 'var(--brand-primary)', fontSize: '0.72rem' }}
                          >
                            Etapa {idx + 1}
                          </span>
                          <span className="fw-bold text-dark">{stat.level.name || stat.level.internal_name}</span>
                          <span className="text-muted small font-monospace">
                            (R$ {Number(stat.level.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                          </span>
                        </div>
                        <span
                          className="badge rounded-pill fw-bold px-2 py-1"
                          style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.75rem' }}
                        >
                          {stat.conversion_rate}% Conversão
                        </span>
                      </div>

                      {/* Visual progress bar */}
                      <div className="progress rounded-pill my-2" style={{ height: '10px', background: '#e2e8f0', overflow: 'hidden' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${Math.min(100, Number(stat.conversion_rate))}%`,
                            background: 'var(--brand-primary)',
                            borderRadius: '999px',
                          }}
                          title="Aceitos"
                        />
                        <div
                          className="progress-bar"
                          style={{
                            width: `${stat.views > 0 ? Math.round((stat.declines / stat.views) * 100) : 0}%`,
                            background: '#ef4444',
                          }}
                          title="Recusas"
                        />
                      </div>

                      <div className="row text-center small text-muted pt-2 g-0">
                        <div className="col-4 border-end">
                          <Eye size={12} className="me-1 d-inline text-secondary" />
                          Views: <strong className="text-dark">{stat.views}</strong>
                        </div>
                        <div className="col-4 border-end">
                          <CheckCircle2 size={12} className="me-1 d-inline text-success" />
                          Aceitos: <strong className="text-success">{stat.accepts}</strong>
                        </div>
                        <div className="col-4">
                          <XCircle size={12} className="me-1 d-inline text-danger" />
                          Recusas: <strong className="text-danger">{stat.declines}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* A/B Test Variant Metrics */}
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Shuffle size={16} className="text-primary" />
                  <span className="fw-bold small text-uppercase text-secondary" style={{ letterSpacing: '0.04em' }}>
                    Teste A/B (Variante A vs Variante B)
                  </span>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="p-3 bg-white border rounded-4 shadow-2xs">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="text-dark small">Variante A (Original)</strong>
                        <span className="badge rounded-pill bg-light text-secondary border">50%</span>
                      </div>
                      <div className="small text-muted mb-1">Sessões: <strong className="text-dark">{abStats.A.sessions}</strong></div>
                      <div className="small text-muted mb-1">
                        Conversão: <strong className="text-success">{abStats.A.cr}%</strong>
                      </div>
                      <div className="small text-muted">
                        Receita: <strong className="text-dark">R$ {abStats.A.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-white border rounded-4 shadow-2xs">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="text-dark small">Variante B (Alternativa)</strong>
                        <span className="badge rounded-pill" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>50%</span>
                      </div>
                      <div className="small text-muted mb-1">Sessões: <strong className="text-dark">{abStats.B.sessions}</strong></div>
                      <div className="small text-muted mb-1">
                        Conversão: <strong className="text-primary">{abStats.B.cr}%</strong>
                      </div>
                      <div className="small text-muted">
                        Receita: <strong className="text-dark">R$ {abStats.B.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: UTMs & Recent Orders */}
        <div className="col-12 col-xl-5 space-y-4">
          {/* UTM Sources */}
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <h2 className="card-title mb-0 fs-6 fw-bold">Top Origens de Tráfego (UTM)</h2>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th className="ps-3">Origem</th>
                      <th>Sessões</th>
                      <th>Concluídos</th>
                      <th className="text-end pe-3">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utmStats.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          Nenhuma origem registrada.
                        </td>
                      </tr>
                    ) : (
                      utmStats.map((u, i) => (
                        <tr key={i}>
                          <td className="ps-3 fw-semibold text-truncate text-dark" style={{ maxWidth: '140px' }}>
                            {u.source}
                          </td>
                          <td>{u.sessions_count}</td>
                          <td>
                            <span className="badge rounded-pill" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.72rem' }}>
                              {u.completed_count}
                            </span>
                          </td>
                          <td className="text-end pe-3 fw-bold text-success">
                            R$ {Number(u.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center gap-2">
              <Receipt size={16} className="text-primary" />
              <h2 className="card-title mb-0 fs-6 fw-bold">Últimos Pedidos Aprovados</h2>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th className="ps-3">Cliente</th>
                      <th>Oferta</th>
                      <th>Valor</th>
                      <th className="text-end pe-3">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          Nenhum pedido registrado ainda.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="ps-3">
                            <div className="fw-semibold text-dark">{o.customer_name || 'Anônimo'}</div>
                            <div className="text-muted font-monospace" style={{ fontSize: '10px' }}>
                              {o.session_token ? `${o.session_token.substring(0, 8)}...` : ''}
                            </div>
                          </td>
                          <td>
                            <span className="badge rounded-pill bg-light text-secondary border">{o.level_name}</span>
                          </td>
                          <td className="fw-bold text-success">
                            R$ {Number(o.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="text-end pe-3 text-muted" style={{ fontSize: '11px' }}>
                            {o.created_at ? new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
