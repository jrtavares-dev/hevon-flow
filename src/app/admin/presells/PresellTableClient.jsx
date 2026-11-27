'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Copy,
  Check,
  BarChart2,
  ExternalLink,
  CopyPlus,
  Pencil,
  Trash2,
  Shuffle,
  Eye,
  MousePointerClick,
  Smartphone,
  Layers,
  Loader2,
} from 'lucide-react';

export default function PresellTableClient({ pages, period, currentPeriodLabel }) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [navigatingId, setNavigatingId] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const copyLink = (slug, id) => {
    const fullUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/p/${slug}`
      : `/p/${slug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    });
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Tem certeza que deseja excluir a página "${name}"? Todos os eventos e métricas serão removidos permanentemente.`)) {
      return;
    }
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/admin/presells/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Erro ao excluir página presell.');
      }
    } catch {
      alert('Erro de conexão.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleClone = async (id) => {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/admin/presells/${id}/clone`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Erro ao duplicar página.');
      }
    } catch {
      alert('Erro de conexão.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Client-side quick filter
  const filteredPages = useMemo(() => {
    if (!filterQuery.trim()) return pages;
    const q = filterQuery.toLowerCase().trim();
    return pages.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q) ||
        (p.headline || '').toLowerCase().includes(q)
    );
  }, [pages, filterQuery]);

  return (
    <div className="card shadow-sm border-0 mb-4">
      {navigatingId && <div className="top-route-progress" />}
      {/* Table Header & Quick Search Bar */}
      <div className="card-header bg-white py-3 px-4 border-bottom d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: 36, height: 36, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
          >
            <Smartphone size={20} />
          </div>
          <div>
            <h5 className="mb-0 fs-6 fw-bold text-dark">Páginas de Alta Conversão</h5>
            <div className="text-muted" style={{ fontSize: '11px' }}>
              Métricas calculadas para o período: <strong>{currentPeriodLabel}</strong>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 w-100 w-md-auto">
          {/* Client Filter Input */}
          <div className="position-relative" style={{ minWidth: '240px', maxWidth: '320px', width: '100%' }}>
            <Search size={14} className="position-absolute text-muted" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control form-control-sm ps-4 rounded-3 border-subtle"
              style={{ fontSize: '12px', height: '34px' }}
              placeholder="Filtrar por nome ou slug..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
          <span
            className="badge rounded-pill fw-bold"
            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontSize: '11px', whiteSpace: 'nowrap' }}
          >
            {filteredPages.length} de {pages.length}
          </span>
        </div>
      </div>

      {/* Mobile Card View (Screens < 768px) */}
      <div className="d-block d-md-none p-3">
        {filteredPages.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{ width: '56px', height: '56px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}
            >
              <Smartphone size={26} />
            </div>
            <h6 className="fw-bold text-dark mb-1">Nenhuma página encontrada</h6>
            <p className="small text-muted mb-3">
              {filterQuery ? 'Nenhum resultado corresponde à sua busca.' : 'Você ainda não possui páginas presell configuradas.'}
            </p>
            {!filterQuery && (
              <Link href="/admin/presells/create" className="btn btn-sm btn-primary">
                Criar Primeira Presell
              </Link>
            )}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredPages.map((p) => {
              const publicUrl = origin ? `${origin}/p/${p.slug}` : `/p/${p.slug}`;
              return (
                <div
                  key={`mobile-${p.id}`}
                  className="card border shadow-sm rounded-4 overflow-hidden"
                  style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}
                >
                  {/* Card Header */}
                  <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <div className="d-flex align-items-center gap-2.5">
                      {p.avatar_url ? (
                        <div
                          className="rounded-circle overflow-hidden shadow-sm border"
                          style={{ width: '38px', height: '38px', flexShrink: 0 }}
                        >
                          <img
                            src={p.avatar_url}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                          style={{
                            width: '38px',
                            height: '38px',
                            background: 'var(--brand-gradient)',
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {(p.name || 'P').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h6 className="mb-0 fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '170px' }}>
                          {p.name}
                        </h6>
                        <span className="badge rounded-pill bg-white text-muted border font-monospace mt-0.5" style={{ fontSize: '10px' }}>
                          /{p.slug}
                        </span>
                      </div>
                    </div>
                    {p.status === 'active' ? (
                      <span
                        className="badge badge-pulse px-2 py-1 rounded-pill fw-bold"
                        style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontSize: '10.5px',
                        }}
                      >
                        Ativa
                      </span>
                    ) : (
                      <span
                        className="badge px-2 py-1 rounded-pill fw-bold"
                        style={{
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0',
                          fontSize: '10.5px',
                        }}
                      >
                        Inativa
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-3">
                    {p.headline && (
                      <div className="small text-muted mb-2.5 text-truncate" style={{ fontSize: '12px' }}>
                        {p.headline}
                      </div>
                    )}

                    {/* Stats 3-Column Grid */}
                    <div className="row g-2 mb-3 text-center">
                      <div className="col-4">
                        <div className="p-2 rounded-3 border bg-light-subtle">
                          <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                            Views
                          </div>
                          <div className="fw-bold text-dark fs-6 mt-0.5">
                            {p.period_views.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 rounded-3 border bg-light-subtle">
                          <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                            Cliques
                          </div>
                          <div className="fw-bold text-success fs-6 mt-0.5">
                            {p.period_clicks.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 rounded-3 border bg-light-subtle">
                          <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                            CTR
                          </div>
                          <div className="fw-bold text-primary fs-6 mt-0.5">
                            {Number(p.period_ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Button Stats Pills */}
                    {p.button_stats && p.button_stats.length > 0 && (
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {p.button_stats.map((btn, bIdx) => (
                          <span
                            key={bIdx}
                            className="badge rounded-pill fw-semibold border d-inline-flex align-items-center gap-1"
                            style={{
                              background: '#f8fafc',
                              color: '#334155',
                              borderColor: '#e2e8f0',
                              fontSize: '10px',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: btn.bg_color || '#22c55e' }}></span>
                            <span className="text-truncate" style={{ maxWidth: '90px' }}>{btn.main_text}</span>: <strong>{btn.clicks.toLocaleString('pt-BR')}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Public URL Box */}
                    <div className="mb-3">
                      <label className="text-muted small fw-semibold mb-1" style={{ fontSize: '11px' }}>
                        Link da Presell:
                      </label>
                      <div className="d-flex align-items-center gap-1.5">
                        <input
                          type="text"
                          className="form-control form-control-sm bg-light text-secondary font-monospace"
                          style={{ fontSize: '11px', height: '34px' }}
                          readOnly
                          value={publicUrl}
                        />
                        <button
                          className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '34px', height: '34px', flexShrink: 0 }}
                          type="button"
                          onClick={() => copyLink(p.slug, p.id)}
                          title="Copiar Link"
                        >
                          {copiedId === p.id ? (
                            <Check size={15} className="text-success" />
                          ) : (
                            <Copy size={15} className="text-muted" />
                          )}
                        </button>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-primary p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '34px', height: '34px', flexShrink: 0 }}
                          title="Abrir Presell"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    </div>

                    {/* Touch-Friendly Action Buttons */}
                    <div className="d-flex align-items-center gap-2 pt-2 border-top">
                      <Link
                        href={`/admin/presells/analytics/${p.id}?period=${period || 'hoje'}`}
                        prefetch={true}
                        onClick={() => setNavigatingId(p.id)}
                        className={`btn btn-sm btn-primary d-inline-flex align-items-center justify-content-center gap-1.5 flex-grow-1 py-2 rounded-3 fw-bold ${
                          navigatingId === p.id ? 'opacity-75 disabled' : ''
                        }`}
                        style={{ fontSize: '12.5px' }}
                      >
                        {navigatingId === p.id ? (
                          <>
                            <span className="spinner-border spinner-border-sm text-white" style={{ width: '13px', height: '13px', borderWidth: '2px' }} role="status" />
                            <span>Abrindo...</span>
                          </>
                        ) : (
                          <>
                            <BarChart2 size={14} />
                            <span>Analytics</span>
                          </>
                        )}
                      </Link>

                      <Link
                        href={`/admin/presells/edit/${p.id}`}
                        prefetch={false}
                        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-1.5 py-2 px-2.5 rounded-3 fw-bold"
                        style={{ fontSize: '12px' }}
                      >
                        <Pencil size={14} className="text-primary" />
                        <span>Editar</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleClone(p.id)}
                        disabled={loadingAction}
                        className="btn btn-sm btn-light border py-2 px-2.5 rounded-3 text-secondary"
                        title="Duplicar Página"
                      >
                        <CopyPlus size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={loadingAction}
                        className="btn btn-sm btn-outline-danger py-2 px-2.5 rounded-3"
                        title="Excluir Página"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table Content (Screens >= 768px) */}
      <div className="table-responsive d-none d-md-block custom-table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="table table-hover align-middle mb-0" style={{ minWidth: '860px' }}>
          <thead>
            <tr>
              <th style={{ width: '56px', color: '#1e293b', fontWeight: 800 }}>Avatar</th>
              <th style={{ color: '#1e293b', fontWeight: 800, minWidth: '150px' }}>Página / Headline</th>
              <th style={{ color: '#1e293b', fontWeight: 800, minWidth: '145px' }}>Link Público</th>
              <th className="text-center" style={{ color: '#1e293b', fontWeight: 800, whiteSpace: 'nowrap' }}>
                Visualizações ({currentPeriodLabel})
              </th>
              <th className="text-center" style={{ color: '#1e293b', fontWeight: 800, whiteSpace: 'nowrap' }}>
                Cliques ({currentPeriodLabel})
              </th>
              <th className="text-center" style={{ color: '#1e293b', fontWeight: 800, whiteSpace: 'nowrap', width: '85px' }}>
                CTR (%)
              </th>
              <th style={{ color: '#1e293b', fontWeight: 800, whiteSpace: 'nowrap', width: '85px' }}>Status</th>
              <th
                className="text-end presell-sticky-actions-header"
                style={{
                  color: '#1e293b',
                  fontWeight: 800,
                  width: '185px',
                  minWidth: '185px',
                  position: 'sticky',
                  right: 0,
                  backgroundColor: '#ffffff',
                  boxShadow: '-6px 0 10px -3px rgba(0, 0, 0, 0.07)',
                  borderLeft: '1px solid #e2e8f0',
                  zIndex: 10,
                }}
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPages.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: '56px', height: '56px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}
                  >
                    <Smartphone size={26} />
                  </div>
                  <h6 className="fw-bold text-dark mb-1">Nenhuma página encontrada</h6>
                  <p className="small text-muted mb-3">
                    {filterQuery ? 'Nenhum resultado corresponde à sua busca.' : 'Você ainda não possui páginas presell configuradas.'}
                  </p>
                  {!filterQuery && (
                    <Link href="/admin/presells/create" className="btn btn-sm btn-primary">
                      Criar Primeira Presell
                    </Link>
                  )}
                </td>
              </tr>
            ) : (
              filteredPages.map((p) => {
                return (
                  <tr key={p.id}>
                    <td>
                      {p.avatar_url ? (
                        <div
                          className="rounded-circle overflow-hidden shadow-sm border"
                          style={{ width: '38px', height: '38px', flexShrink: 0 }}
                        >
                          <img
                            src={p.avatar_url}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                          style={{
                            width: '38px',
                            height: '38px',
                            background: 'var(--brand-gradient)',
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {(p.name || 'P').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '200px' }}>{p.name}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: '200px', fontSize: '11.5px' }}>
                        {p.headline || p.subheadline || 'Sem headline principal'}
                      </div>
                      <div className="d-flex align-items-center gap-1 mt-1">
                        <span
                          className="badge rounded-pill fw-semibold font-monospace"
                          style={{ background: '#f1f5f9', color: '#475569', fontSize: '10.5px' }}
                        >
                          /{p.slug}
                        </span>
                        {Boolean(p.ab_test_enabled) && (
                          <span
                            className="badge rounded-pill fw-bold d-inline-flex align-items-center gap-1"
                            style={{
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#d97706',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              fontSize: '10px',
                            }}
                            title="Teste A/B 50/50 Ativo"
                          >
                            <Shuffle size={10} /> Teste A/B
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1" style={{ maxWidth: '175px' }}>
                        <input
                          type="text"
                          className="form-control form-control-sm bg-light text-secondary font-monospace"
                          style={{ fontSize: '11px', height: '30px' }}
                          readOnly
                          value={origin ? `${origin}/p/${p.slug}` : `/p/${p.slug}`}
                          suppressHydrationWarning
                        />
                        <button
                          className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: '30px', height: '30px' }}
                          type="button"
                          onClick={() => copyLink(p.slug, p.id)}
                          title="Copiar Link da Presell"
                        >
                          {copiedId === p.id ? (
                            <Check size={14} className="text-success" />
                          ) : (
                            <Copy size={14} className="text-muted" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="text-center fw-bold text-dark">
                      <div className="d-inline-flex align-items-center gap-1">
                        <Eye size={14} className="text-primary opacity-75" />
                        <span>{p.period_views.toLocaleString('pt-BR')}</span>
                      </div>
                      {period !== 'tudo' && (
                        <div className="text-muted fw-normal" style={{ fontSize: '10.5px' }}>
                          Total: {Number(p.views_count || 0).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="fw-bold text-success d-inline-flex align-items-center gap-1">
                        <MousePointerClick size={14} className="text-success opacity-85" />
                        <span>{p.period_clicks.toLocaleString('pt-BR')}</span>
                      </div>
                      {p.button_stats && p.button_stats.length > 1 ? (
                        <div className="d-flex flex-wrap gap-1 justify-content-center mt-1">
                          {p.button_stats.map((b) => (
                            <span
                              key={b.index}
                              className="badge bg-light text-dark border px-1 py-0 fw-semibold"
                              style={{ fontSize: '9.5px' }}
                              title={`${b.main_text}: ${Number(b.clicks || 0).toLocaleString('pt-BR')} cliques`}
                            >
                              <span
                                className="d-inline-block rounded-circle me-1"
                                style={{ width: '6px', height: '6px', background: b.bg_color }}
                              ></span>
                              {b.main_text.substring(0, 12)}
                              {b.main_text.length > 12 ? '...' : ''}:{' '}
                              <strong className="text-success">{Number(b.clicks || 0).toLocaleString('pt-BR')}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        period !== 'tudo' && (
                          <div className="text-muted fw-normal" style={{ fontSize: '10.5px' }}>
                            Total: {Number(p.clicks_count || 0).toLocaleString('pt-BR')}
                          </div>
                        )
                      )}
                    </td>
                    <td className="text-center">
                      <span
                        className="badge px-2 py-1 rounded-pill fw-bold"
                        style={{
                          background:
                            p.period_ctr > 0
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(255, 255, 255, 0.05)',
                          color:
                            p.period_ctr > 0
                              ? '#10b981'
                              : 'var(--text-muted)',
                          border: `1px solid ${
                            p.period_ctr > 0
                              ? 'rgba(16, 185, 129, 0.25)'
                              : 'var(--border-subtle)'
                          }`,
                          fontSize: '11px',
                        }}
                      >
                        {Number(p.period_ctr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </span>
                    </td>
                    <td>
                      {p.status === 'active' ? (
                        <span
                          className="badge badge-pulse px-2 py-1 rounded-pill fw-bold"
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontSize: '11px',
                          }}
                        >
                          Ativa
                        </span>
                      ) : (
                        <span
                          className="badge px-2 py-1 rounded-pill fw-bold"
                          style={{
                            background: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            fontSize: '11px',
                          }}
                        >
                          Inativa
                        </span>
                      )}
                    </td>
                    <td
                      className="text-end presell-sticky-actions-cell"
                      style={{
                        position: 'sticky',
                        right: 0,
                        backgroundColor: '#ffffff',
                        boxShadow: '-6px 0 10px -3px rgba(0, 0, 0, 0.07)',
                        borderLeft: '1px solid #e2e8f0',
                        zIndex: 5,
                        width: '185px',
                        minWidth: '185px',
                      }}
                    >
                      <div className="d-inline-flex align-items-center gap-1 flex-nowrap">
                        <Link
                          href={`/admin/presells/analytics/${p.id}?period=${period || 'hoje'}`}
                          prefetch={true}
                          onClick={() => setNavigatingId(p.id)}
                          className={`btn btn-sm btn-outline-secondary p-1 position-relative d-flex align-items-center justify-content-center ${
                            navigatingId === p.id ? 'active bg-primary-subtle border-primary' : ''
                          }`}
                          style={{ width: '31px', height: '31px', flexShrink: 0 }}
                          title={navigatingId === p.id ? 'Abrindo Analytics...' : 'Ver Analytics Completo'}
                        >
                          {navigatingId === p.id ? (
                            <span className="spinner-border spinner-border-sm text-primary" style={{ width: '13px', height: '13px', borderWidth: '2px' }} role="status" />
                          ) : (
                            <BarChart2 size={14} className="text-primary" />
                          )}
                        </Link>
                        <a
                          href={`/p/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '31px', height: '31px', flexShrink: 0 }}
                          title="Abrir Página ao Vivo"
                        >
                          <ExternalLink size={14} className="text-muted" />
                        </a>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '31px', height: '31px', flexShrink: 0 }}
                          onClick={() => handleClone(p.id)}
                          title="Duplicar Página"
                          disabled={loadingAction}
                        >
                          <CopyPlus size={14} className="text-muted" />
                        </button>
                        <Link
                          href={`/admin/presells/edit/${p.id}`}
                          prefetch={false}
                          className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '31px', height: '31px', flexShrink: 0 }}
                          title="Editar Página"
                        >
                          <Pencil size={14} className="text-primary" />
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '31px', height: '31px', flexShrink: 0 }}
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Excluir Página"
                          disabled={loadingAction}
                        >
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
