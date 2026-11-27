import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { Layers, Filter, Pencil, Trash2, Tag, CheckCircle2, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLevelsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const levels = await query(`
    SELECT cl.*, c.name as campaign_name, c.slug as campaign_slug 
    FROM campaign_levels cl 
    LEFT JOIN campaigns c ON cl.campaign_id = c.id 
    ORDER BY cl.campaign_id ASC, cl.level_order ASC
  `);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2.5 mb-1">
            <h1 className="h3 fw-bold mb-0" style={{ color: 'var(--text-main, #0f172a)', margin: 0, lineHeight: 1.2 }}>Níveis de Upsell</h1>
            <span className="badge rounded-pill" style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', fontWeight: 600, height: '24px', lineHeight: 1, alignSelf: 'center' }}>
              {levels.length} etapas
            </span>
          </div>
          <p className="text-muted small mb-0">
            Gerencie todos os níveis e etapas sequenciais de upsell configurados nas suas campanhas.
          </p>
        </div>
        <div className="btn-toolbar gap-2 mt-2 mt-md-0">
          <Link href="/admin/campaigns" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm">
            <Filter size={15} /> Ver Campanhas
          </Link>
        </div>
      </div>

      {/* Table Card */}
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden" style={{ background: 'var(--surface-card, #ffffff)' }}>
            {/* Mobile Cards (Screens < 768px) */}
            <div className="d-block d-md-none p-3">
              {levels.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Layers size={36} className="mb-2 opacity-50" />
                  <div>Nenhum nível de upsell encontrado.</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {levels.map((lvl) => (
                    <div
                      key={`mob-lvl-${lvl.id}`}
                      className="card border rounded-3 p-3 shadow-sm"
                      style={{ background: 'var(--surface-subtle, #f8fafc)', borderColor: 'var(--border-subtle, #e2e8f0)' }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge rounded-pill fw-semibold" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.74rem' }}>
                          Nível {lvl.level_order}
                        </span>
                        {lvl.enabled ? (
                          <span className="badge rounded-pill d-inline-flex align-items-center gap-1" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.72rem' }}>
                            <CheckCircle2 size={11} /> Ativo
                          </span>
                        ) : (
                          <span className="badge rounded-pill d-inline-flex align-items-center gap-1" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.72rem' }}>
                            <XCircle size={11} /> Inativo
                          </span>
                        )}
                      </div>

                      <div className="fw-bold fs-6 mb-1" style={{ color: 'var(--text-main, #0f172a)' }}>
                        {lvl.internal_name || lvl.name}
                      </div>
                      {lvl.headline && (
                        <div className="text-muted small mb-2 text-truncate">
                          {lvl.headline}
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center small py-2 border-top border-bottom my-2" style={{ borderColor: 'var(--border-subtle, #e2e8f0)' }}>
                        <div>
                          <span className="text-muted">Campanha: </span>
                          <Link href={`/admin/campaigns/edit/${lvl.campaign_id}`} className="fw-semibold text-decoration-none text-primary">
                            {lvl.campaign_name || `#${lvl.campaign_id}`}
                          </Link>
                        </div>
                        <div>
                          <span className="fw-bold text-success fs-6">
                            R$ {Number(lvl.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-1">
                        <span className="badge rounded-pill text-secondary bg-light border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                          <Tag size={11} className="me-1 d-inline" />
                          {lvl.theme_name || 'default'}
                        </span>
                        <div className="d-flex gap-1.5">
                          <Link
                            href={`/admin/campaigns/edit/${lvl.campaign_id}`}
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-1 px-2.5 rounded-2"
                            style={{ fontSize: '12px' }}
                          >
                            <Pencil size={12} /> Editar
                          </Link>
                          <a
                            href={`/admin/levels/delete/${lvl.id}`}
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center py-1 px-2 rounded-2"
                            style={{ fontSize: '12px' }}
                          >
                            <Trash2 size={12} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table (Screens >= 768px) */}
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ width: '90px' }} className="ps-3">Ordem</th>
                    <th>Campanha</th>
                    <th>Nome Interno & Headline</th>
                    <th>Preço</th>
                    <th>Tema</th>
                    <th>Status</th>
                    <th className="text-end pe-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <div className="d-flex flex-column align-items-center justify-content-center">
                          <div className="p-3 rounded-circle mb-3" style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}>
                            <Layers size={36} />
                          </div>
                          <div className="fw-semibold">Nenhum nível de upsell encontrado</div>
                          <div className="small text-muted mt-1">Crie uma nova campanha para adicionar níveis de oferta.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    levels.map((lvl) => (
                      <tr key={lvl.id}>
                        <td className="ps-3">
                          <span className="badge rounded-pill fw-semibold" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.74rem' }}>
                            Nível {lvl.level_order}
                          </span>
                        </td>
                        <td>
                          <Link href={`/admin/campaigns/edit/${lvl.campaign_id}`} className="fw-bold text-decoration-none text-primary hover-underline">
                            {lvl.campaign_name || `Campanha #${lvl.campaign_id}`}
                          </Link>
                          <div className="small text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                            /c/{lvl.campaign_slug || lvl.campaign_id}
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{lvl.internal_name || lvl.name}</div>
                          <div className="text-muted small text-truncate" style={{ maxWidth: '320px' }}>
                            Exibe: {lvl.headline || lvl.name}
                          </div>
                        </td>
                        <td>
                          <span className="fw-bold text-success" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            R$ {Number(lvl.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>
                          <span className="badge rounded-pill text-secondary bg-light border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                            <Tag size={11} className="me-1 d-inline" />
                            {lvl.theme_name || 'default'}
                          </span>
                        </td>
                        <td>
                          {lvl.enabled ? (
                            <span className="badge rounded-pill d-inline-flex align-items-center gap-1" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.74rem' }}>
                              <CheckCircle2 size={12} /> Ativo
                            </span>
                          ) : (
                            <span className="badge rounded-pill d-inline-flex align-items-center gap-1" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.74rem' }}>
                              <XCircle size={12} /> Inativo
                            </span>
                          )}
                        </td>
                        <td className="text-end pe-3">
                          <div className="d-flex justify-content-end gap-1">
                            <Link
                              href={`/admin/campaigns/edit/${lvl.campaign_id}`}
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                              title="Editar no Editor de Campanha"
                            >
                              <Pencil size={13} /> Editar
                            </Link>
                            <a
                              href={`/admin/levels/delete/${lvl.id}`}
                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                              title="Excluir Nível"
                            >
                              <Trash2 size={13} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        );
}
