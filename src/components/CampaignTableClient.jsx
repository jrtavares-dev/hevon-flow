'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GitFork,
  Search,
  Copy,
  Check,
  ExternalLink,
  BarChart2,
  CopyPlus,
  Pencil,
  Trash2,
  Plus,
  Calendar,
} from 'lucide-react';

export default function CampaignTableClient({ initialCampaigns = [], baseUrl = '' }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [copiedId, setCopiedId] = useState(null);
  const [cloningId, setCloningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyLink = (campaignUrl, id) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const fullUrl =
        campaignUrl.startsWith('http')
          ? campaignUrl
          : `${typeof window !== 'undefined' ? window.location.origin : ''}${campaignUrl.startsWith('/') ? '' : '/'}${campaignUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    }
  };

  const handleClone = async (id) => {
    if (cloningId) return;
    setCloningId(id);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/clone`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.refresh();
        router.push(`/admin/campaigns/edit/${data.campaign_id}`);
      } else {
        alert(data.message || 'Erro ao clonar campanha.');
      }
    } catch {
      alert('Erro de conexão ao clonar.');
    } finally {
      setCloningId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Tem certeza que deseja excluir a campanha "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        alert(data.message || 'Erro ao excluir campanha.');
      }
    } catch {
      alert('Erro de conexão ao excluir.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;
    const q = searchQuery.toLowerCase().trim();
    return campaigns.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.slug || '').toLowerCase().includes(q)
    );
  }, [campaigns, searchQuery]);

  if (campaigns.length === 0) {
    return (
      <div className="card shadow-sm border-0 py-5 text-center text-muted">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
          style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}
        >
          <GitFork size={28} />
        </div>
        <h6 className="fw-bold text-dark fs-5 mb-1">Nenhum funil criado ainda.</h6>
        <p className="small text-muted mb-3">Crie seu primeiro funil de upsell e downsell de 1 clique.</p>
        <div>
          <Link href="/admin/campaigns/create" prefetch={true} className="btn btn-primary px-4 shadow-sm">
            <Plus size={16} />
            <span>Criar Primeira Campanha</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 mb-4">
      {/* Search Header */}
      <div className="card-header bg-white py-3 px-4 border-bottom d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: 36, height: 36, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
          >
            <GitFork size={20} />
          </div>
          <div>
            <h5 className="mb-0 fs-6 fw-bold text-dark">Funis & Campanhas Cadastradas</h5>
            <div className="text-muted" style={{ fontSize: '11px' }}>
              Gerencie a árvore de upsell e monitore a jornada de 1 clique
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 w-100 w-md-auto">
          <div className="position-relative" style={{ minWidth: '240px', maxWidth: '320px', width: '100%' }}>
            <Search size={14} className="position-absolute text-muted" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control form-control-sm ps-4 rounded-3 border-subtle"
              style={{ fontSize: '12px', height: '34px' }}
              placeholder="Filtrar por nome ou slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span
            className="badge rounded-pill fw-bold"
            style={{ background: 'var(--surface-subtle, #f8fafc)', color: 'var(--text-muted, #475569)', border: '1px solid var(--border-subtle, #e2e8f0)', fontSize: '11px', whiteSpace: 'nowrap' }}
          >
            {filteredCampaigns.length} de {campaigns.length}
          </span>
        </div>
      </div>

      {/* Mobile Card View (Screens < 768px) */}
      <div className="d-block d-md-none p-3">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            Nenhum funil encontrado para a busca.
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredCampaigns.map((campaign) => {
              const campaignUrl = `${baseUrl}/o/${campaign.slug}`;
              return (
                <div
                  key={`mobile-${campaign.id}`}
                  className="card border shadow-sm rounded-4 overflow-hidden"
                  style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}
                >
                  {/* Card Header */}
                  <div className="p-3 border-bottom d-flex align-items-center justify-content-between" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge rounded-pill bg-white text-secondary border font-monospace small">
                        #{campaign.id}
                      </span>
                      <h6 className="mb-0 fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '170px' }}>
                        {campaign.name}
                      </h6>
                    </div>
                    {campaign.status === 'active' ? (
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
                    <div className="mb-2.5">
                      <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '11px' }}>
                        /{campaign.slug}
                      </span>
                    </div>

                    {/* Public URL Box */}
                    <div className="mb-3">
                      <label className="text-muted small fw-semibold mb-1" style={{ fontSize: '11px' }}>
                        Link Público do Funil:
                      </label>
                      <div className="d-flex align-items-center gap-1.5">
                        <input
                          type="text"
                          className="form-control form-control-sm bg-light text-secondary font-monospace"
                          style={{ fontSize: '11px', height: '34px' }}
                          readOnly
                          value={campaignUrl}
                        />
                        <button
                          className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '34px', height: '34px', flexShrink: 0 }}
                          type="button"
                          onClick={() => handleCopyLink(campaignUrl, campaign.id)}
                          title="Copiar Link"
                        >
                          {copiedId === campaign.id ? (
                            <Check size={15} className="text-success" />
                          ) : (
                            <Copy size={15} className="text-muted" />
                          )}
                        </button>
                        <a
                          href={campaignUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-primary p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '34px', height: '34px', flexShrink: 0 }}
                          title="Abrir Funil"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1 text-muted mb-3" style={{ fontSize: '11px' }}>
                      <Calendar size={12} />
                      <span>Criado em {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('pt-BR') : '—'}</span>
                    </div>

                    {/* Touch-Friendly Action Buttons */}
                    <div className="d-flex align-items-center gap-2 pt-2 border-top">
                      <Link
                        href={`/admin/campaigns/edit/${campaign.id}`}
                        prefetch={true}
                        className="btn btn-sm btn-primary d-inline-flex align-items-center justify-content-center gap-1.5 flex-grow-1 py-2 rounded-3 fw-bold"
                        style={{ fontSize: '12.5px' }}
                      >
                        <Pencil size={14} />
                        <span>Editar Funil</span>
                      </Link>

                      <Link
                        href={`/admin/campaigns/analytics/${campaign.id}`}
                        prefetch={true}
                        className="btn btn-sm btn-outline-success d-inline-flex align-items-center justify-content-center gap-1.5 py-2 px-2.5 rounded-3 fw-bold"
                        style={{ fontSize: '12px' }}
                      >
                        <BarChart2 size={14} />
                        <span>Analytics</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleClone(campaign.id)}
                        disabled={cloningId === campaign.id}
                        className="btn btn-sm btn-light border py-2 px-2.5 rounded-3 text-secondary"
                        title="Clonar Funil"
                      >
                        <CopyPlus size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(campaign.id, campaign.name)}
                        disabled={deletingId === campaign.id}
                        className="btn btn-sm btn-outline-danger py-2 px-2.5 rounded-3"
                        title="Excluir"
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
      <div className="table-responsive d-none d-md-block">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: '60px', color: '#1e293b', fontWeight: 800 }}>ID</th>
              <th style={{ color: '#1e293b', fontWeight: 800 }}>Campanha & Slug</th>
              <th style={{ color: '#1e293b', fontWeight: 800 }}>Link do Funil</th>
              <th style={{ color: '#1e293b', fontWeight: 800 }}>Status</th>
              <th style={{ color: '#1e293b', fontWeight: 800 }}>Data de Criação</th>
              <th className="text-end" style={{ color: '#1e293b', fontWeight: 800, minWidth: '220px' }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted">
                  Nenhum funil encontrado para a busca especificada.
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((campaign) => {
                const campaignUrl = `${baseUrl}/o/${campaign.slug}`;
                return (
                  <tr key={campaign.id}>
                    <td className="fw-bold text-muted font-monospace">#{campaign.id}</td>
                    <td>
                      <div className="fw-bold text-dark fs-6">{campaign.name}</div>
                      <div className="small font-monospace text-secondary">
                        <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: '10.5px' }}>
                          /{campaign.slug}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1" style={{ maxWidth: '240px' }}>
                        <input
                          type="text"
                          className="form-control form-control-sm bg-light text-secondary font-monospace"
                          style={{ fontSize: '11px', height: '30px' }}
                          readOnly
                          value={campaignUrl}
                        />
                        <button
                          className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '30px', height: '30px' }}
                          type="button"
                          onClick={() => handleCopyLink(campaignUrl, campaign.id)}
                          title="Copiar Link"
                        >
                          {copiedId === campaign.id ? (
                            <Check size={14} className="text-success" />
                          ) : (
                            <Copy size={14} className="text-muted" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td>
                      {campaign.status === 'active' ? (
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
                    <td className="text-muted small">
                      <div className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: '11.5px' }}>
                        <Calendar size={13} className="text-muted" />
                        <span>{campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('pt-BR') : '—'}</span>
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex align-items-center gap-1">
                        <a
                          href={campaignUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-secondary p-1"
                          style={{ width: '32px', height: '32px' }}
                          title="Testar Funil ao Vivo"
                        >
                          <ExternalLink size={15} className="text-primary" />
                        </a>
                        <Link
                          href={`/admin/campaigns/analytics/${campaign.id}`}
                          prefetch={true}
                          className="btn btn-sm btn-outline-secondary p-1"
                          style={{ width: '32px', height: '32px' }}
                          title="Métricas & Drop-off"
                        >
                          <BarChart2 size={15} className="text-success" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleClone(campaign.id)}
                          disabled={cloningId === campaign.id}
                          className="btn btn-sm btn-outline-secondary p-1"
                          style={{ width: '32px', height: '32px' }}
                          title="Clonar Funil"
                        >
                          <CopyPlus size={15} className="text-muted" />
                        </button>
                        <Link
                          href={`/admin/campaigns/edit/${campaign.id}`}
                          prefetch={true}
                          className="btn btn-sm btn-outline-secondary p-1"
                          style={{ width: '32px', height: '32px' }}
                          title="Editar Funil"
                        >
                          <Pencil size={15} className="text-primary" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(campaign.id, campaign.name)}
                          disabled={deletingId === campaign.id}
                          className="btn btn-sm btn-outline-secondary p-1"
                          style={{ width: '32px', height: '32px' }}
                          title="Excluir"
                        >
                          <Trash2 size={15} className="text-danger" />
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
