'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  DollarSign,
  Search,
  Filter,
  AlertCircle,
  User,
  CreditCard,
  MessageSquare,
  Sparkles,
  Gamepad2,
  ExternalLink,
  X,
} from 'lucide-react';

export default function RewardsManagerClient({ initialRewards = [] }) {
  const [rewards, setRewards] = useState(initialRewards);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReward, setSelectedReward] = useState(null);
  const [actionStatus, setActionStatus] = useState('approved');
  const [actionNotes, setActionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredRewards = rewards.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.customer_email || '').toLowerCase().includes(q) ||
        (r.reward_code || '').toLowerCase().includes(q) ||
        (r.prize_name || '').toLowerCase().includes(q) ||
        (r.pix_key || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReward) return;
    setLoading(true);

    try {
      const res = await fetch('/api/puzzle/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          reward_id: selectedReward.id,
          status: actionStatus,
          notes: actionNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Status do prêmio atualizado com sucesso!');
      setRewards(
        rewards.map((r) =>
          r.id === selectedReward.id ? { ...r, status: actionStatus, notes: actionNotes } : r
        )
      );
      setSelectedReward(null);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'claimed':
        return (
          <span className="badge px-2.5 py-1 rounded-pill fw-bold bg-warning-subtle text-warning-emphasis border border-warning-subtle">
            Solicitado / Chave Enviada
          </span>
        );
      case 'approved':
        return (
          <span className="badge px-2.5 py-1 rounded-pill fw-bold bg-info-subtle text-info-emphasis border border-info-subtle">
            Aprovado
          </span>
        );
      case 'delivered':
        return (
          <span className="badge px-2.5 py-1 rounded-pill fw-bold bg-success-subtle text-success border border-success-subtle">
            Pago / Concluído
          </span>
        );
      case 'rejected':
        return (
          <span className="badge px-2.5 py-1 rounded-pill fw-bold bg-danger-subtle text-danger border border-danger-subtle">
            Rejeitado
          </span>
        );
      default:
        return (
          <span className="badge px-2.5 py-1 rounded-pill fw-bold bg-light text-secondary border">
            Aguardando Chave
          </span>
        );
    }
  };

  return (
    <div className="w-100">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`position-fixed top-0 end-0 m-4 p-3 rounded-4 shadow-lg text-white d-flex align-items-center gap-2`}
          style={{
            zIndex: 9999,
            background: toastMessage.isError ? '#ef4444' : '#10b981',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toastMessage.isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="fw-medium small">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2.5">
            <h1 className="page-title mb-0 fs-3 fw-bold text-dark" style={{ margin: 0, lineHeight: 1.2 }}>
              Prêmios Conquistados & Resgates
            </h1>
            <span
              className="badge px-2.5 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '11px',
                height: '24px',
                lineHeight: 1,
                alignSelf: 'center',
              }}
            >
              <Trophy size={12} />
              Ganhadores Instantâneos
            </span>
          </div>
          <div className="text-muted small mt-1" style={{ fontSize: '12.5px' }}>
            Acompanhe os clientes que completaram álbuns e realize pagamentos PIX ou envio de produtos.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            href="/admin/games"
            className="btn btn-sm btn-outline-secondary shadow-sm d-inline-flex align-items-center gap-1.5"
            style={{ height: '36px', fontSize: '12px' }}
          >
            <Gamepad2 size={15} />
            <span>Central de Jogos</span>
          </Link>
          <Link
            href="/admin/puzzles"
            className="btn btn-sm btn-primary shadow-sm d-inline-flex align-items-center gap-1.5"
            style={{ height: '36px', fontSize: '12px' }}
          >
            <span>Ver Quebra-Cabeças</span>
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card border shadow-sm rounded-4 p-3 mb-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5 rounded-3 bg-light border-0"
                placeholder="Buscar por nome, e-mail, código ou chave PIX..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '13px', height: '40px' }}
              />
            </div>
          </div>

          <div className="col-12 col-md-7 d-flex gap-2 flex-wrap justify-content-md-end">
            <button
              onClick={() => setFilterStatus('all')}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${filterStatus === 'all' ? 'btn-primary shadow-sm' : 'btn-light border text-secondary'}`}
              style={{ fontSize: '12px', height: '34px' }}
            >
              Todos ({rewards.length})
            </button>
            <button
              onClick={() => setFilterStatus('claimed')}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${filterStatus === 'claimed' ? 'btn-warning text-dark shadow-sm' : 'btn-light border text-secondary'}`}
              style={{ fontSize: '12px', height: '34px' }}
            >
              Aguardando Pagamento ({rewards.filter(r => r.status === 'claimed').length})
            </button>
            <button
              onClick={() => setFilterStatus('delivered')}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${filterStatus === 'delivered' ? 'btn-success shadow-sm' : 'btn-light border text-secondary'}`}
              style={{ fontSize: '12px', height: '34px' }}
            >
              Pagos / Concluídos ({rewards.filter(r => r.status === 'delivered').length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${filterStatus === 'pending' ? 'btn-secondary shadow-sm' : 'btn-light border text-secondary'}`}
              style={{ fontSize: '12px', height: '34px' }}
            >
              Pendentes ({rewards.filter(r => r.status === 'pending').length})
            </button>
          </div>
        </div>
      </div>

      {/* Table of Rewards */}
      <div className="card border shadow-sm rounded-4 overflow-hidden bg-white" style={{ borderColor: '#e2e8f0' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: 'var(--surface-subtle, #f8fafc)', borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
              <tr>
                <th className="py-3 px-4" style={{ color: 'var(--text-secondary, #1e293b)', fontWeight: 800, fontSize: '12px' }}>CÓDIGO & DATA</th>
                <th className="py-3 px-4" style={{ color: 'var(--text-secondary, #1e293b)', fontWeight: 800, fontSize: '12px' }}>GANHADOR</th>
                <th className="py-3 px-4" style={{ color: 'var(--text-secondary, #1e293b)', fontWeight: 800, fontSize: '12px' }}>PRÊMIO DO ÁLBUM</th>
                <th className="py-3 px-4" style={{ color: 'var(--text-secondary, #1e293b)', fontWeight: 800, fontSize: '12px' }}>DADOS DE RESGATE (PIX)</th>
                <th className="py-3 px-4" style={{ color: 'var(--text-secondary, #1e293b)', fontWeight: 800, fontSize: '12px' }}>STATUS</th>
                <th className="py-3 px-4 text-end" style={{ color: 'var(--text-secondary, #1e293b)', fontWeight: 800, fontSize: '12px' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filteredRewards.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted small">
                    Nenhum prêmio encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredRewards.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-4">
                      <div className="fw-bold text-dark font-monospace fs-6">{r.reward_code}</div>
                      <div className="text-muted small" style={{ fontSize: '11px' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-dark fw-bold">{r.customer_name || 'Cliente'}</div>
                      <div className="text-secondary small">{r.customer_email}</div>
                      {r.customer_phone && <div className="text-muted fs-xxs">{r.customer_phone}</div>}
                    </td>

                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={`/images/puzzles/${r.puzzle_image || 'iphone.svg'}`}
                          alt=""
                          style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                        />
                        <div>
                          <div className="text-dark fw-bold">{r.prize_name}</div>
                          <div className="text-primary fw-semibold small">
                            R$ {parseFloat(r.prize_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {r.pix_key ? (
                        <div>
                          <span className="badge bg-success-subtle text-success border border-success-subtle mb-1" style={{ fontSize: '10px' }}>
                            Chave PIX
                          </span>
                          <div className="text-dark font-monospace fw-semibold small text-truncate" style={{ maxWidth: '220px' }} title={r.pix_key}>
                            {r.pix_key}
                          </div>
                        </div>
                      ) : r.shipping_address ? (
                        <div>
                          <span className="badge bg-info-subtle text-info border border-info-subtle mb-1" style={{ fontSize: '10px' }}>
                            Envio Físico
                          </span>
                          <div className="text-dark small text-truncate" style={{ maxWidth: '220px' }} title={r.shipping_address}>
                            {r.shipping_address}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted small font-italic">Aguardando chave do cliente</span>
                      )}
                    </td>

                    <td className="py-3 px-4">{getStatusBadge(r.status)}</td>

                    <td className="py-3 px-4 text-end">
                      <button
                        onClick={() => {
                          setSelectedReward(r);
                          setActionStatus(r.status === 'claimed' ? 'delivered' : r.status);
                          setActionNotes(r.notes || '');
                        }}
                        className="btn btn-sm btn-outline-primary rounded-3 px-3 shadow-sm"
                        style={{ height: '32px', fontSize: '12px' }}
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Gerenciar Prêmio */}
      {selectedReward && (
        <div
          className="uf-modal-backdrop"
          onClick={() => setSelectedReward(null)}
        >
          <div
            className="uf-modal-card"
            style={{ maxWidth: '720px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="uf-modal-header">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '42px',
                    height: '42px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#f59e0b',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
                  }}
                >
                  <Trophy size={20} />
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark fs-5 mb-0">
                    Gerenciar Resgate: {selectedReward.reward_code}
                  </h5>
                  <span className="text-muted small" style={{ fontSize: '12.5px' }}>
                    Atualize o status da premiação e adicione notas de entrega ou PIX
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="uf-modal-close-btn"
                onClick={() => setSelectedReward(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
              <div className="uf-modal-body-scrollable p-4 p-md-5 overflow-y-auto flex-grow-1" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
                <div className="d-flex flex-column gap-4">
                  {/* Summary Box */}
                  <div className="uf-modal-section-card d-flex flex-column gap-2.5">
                    <div className="text-secondary small">
                      Ganhador: <strong className="text-dark fs-6">{selectedReward.customer_name}</strong> <span className="text-muted">({selectedReward.customer_email})</span>
                    </div>
                    <div className="text-secondary small">
                      Prêmio: <strong className="text-primary fs-6">{selectedReward.prize_name}</strong> — <span className="fw-bold text-dark">R$ {parseFloat(selectedReward.prize_value || 0).toFixed(2)}</span>
                    </div>
                    {selectedReward.pix_key && (
                      <div className="text-secondary small mt-1 pt-2 border-top">
                        Chave PIX: <strong className="text-success font-monospace fs-6">{selectedReward.pix_key}</strong>
                      </div>
                    )}
                    {selectedReward.shipping_address && (
                      <div className="text-secondary small mt-1 pt-2 border-top">
                        Endereço de Envio: <strong className="text-dark">{selectedReward.shipping_address}</strong>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label text-dark small fw-bold mb-2">Alterar Status</label>
                    <select
                      className="form-select rounded-3"
                      style={{ height: '48px', borderRadius: '12px' }}
                      value={actionStatus}
                      onChange={(e) => setActionStatus(e.target.value)}
                    >
                      <option value="pending">Pendente (Aguardando Chave)</option>
                      <option value="claimed">Solicitado (Chave informada)</option>
                      <option value="approved">Aprovado pelo Suporte</option>
                      <option value="delivered">Pago / Entregue (Concluído)</option>
                      <option value="rejected">Rejeitado</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label text-dark small fw-bold mb-2">Comprovante / Notas Internas</label>
                    <textarea
                      className="form-control rounded-3 p-3"
                      rows="3"
                      style={{ borderRadius: '12px' }}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Ex: Pago via PIX às 14h30 - ID da transação: E1234567..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="uf-modal-footer">
                <button
                  type="button"
                  className="uf-btn-cancel"
                  onClick={() => setSelectedReward(null)}
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="uf-btn-save"
                >
                  {loading ? 'Salvando...' : 'Atualizar Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
