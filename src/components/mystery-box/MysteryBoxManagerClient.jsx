'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Gift,
  Trophy,
  Users,
  Percent,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Settings,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Package,
  X,
} from 'lucide-react';
import InteractiveMysteryBox from './InteractiveMysteryBox';
import OfferConfigForm from '@/components/games/OfferConfigForm';

export default function MysteryBoxManagerClient({ initialCampaign, initialRecentPlays }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [prizes, setPrizes] = useState(initialCampaign?.prizes || []);
  const [recentPlays, setRecentPlays] = useState(initialRecentPlays || []);
  const [loading, setLoading] = useState(false);

  // Modais
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState('geral');
  const [offerConfig, setOfferConfig] = useState({});
  const [editingPrize, setEditingPrize] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);

  // Resultado do Simulador no Admin
  const [simResult, setSimResult] = useState(null);

  // Form Campanha
  const [campaignForm, setCampaignForm] = useState({
    name: initialCampaign?.name || 'Caixa Misteriosa VIP Oficial',
    description: initialCampaign?.description || '',
    trigger_type: initialCampaign?.trigger_type || 'post_purchase',
    box_theme: initialCampaign?.box_theme || 'gold_luxury',
    daily_budget: initialCampaign?.daily_budget || 1000,
    status: initialCampaign?.status || 'active',
  });

  // Form Prêmio
  const [prizeForm, setPrizeForm] = useState({
    label: '',
    symbol: '🎁',
    reward_type: 'discount_percentage',
    reward_value: 30,
    weight: 20,
    max_daily_winners: 999,
  });

  const totalWeight = prizes.reduce((acc, curr) => acc + (curr.weight || 1), 0);

  const reloadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mystery-box?mode=admin&campaign_id=${campaign?.id || 1}`);
      const data = await res.json();
      if (data.success && data.campaign) {
        setCampaign(data.campaign);
        setPrizes(data.campaign.prizes || []);
        setRecentPlays(data.recent_plays || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Salvar Configurações
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/mystery-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_campaign',
          id: campaign?.id,
          ...campaignForm,
          offer_config: offerConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConfigModal(false);
        await reloadData();
        alert('Configurações da campanha e da oferta salvas com sucesso!');
      } else {
        alert(data.error || 'Erro ao salvar campanha.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Salvar Prêmio
  const handleSavePrize = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const isEdit = !!editingPrize;
      const res = await fetch('/api/mystery-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEdit ? 'update_prize' : 'add_prize',
          campaign_id: campaign?.id,
          prize_id: editingPrize?.id,
          ...prizeForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPrizeModal(false);
        setEditingPrize(null);
        await reloadData();
      } else {
        alert(data.error || 'Erro ao salvar prêmio.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Excluir Prêmio
  const handleDeletePrize = async (prizeId) => {
    if (!confirm('Deseja realmente excluir este prêmio da Caixa Misteriosa?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/mystery-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_prize',
          prize_id: prizeId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await reloadData();
      } else {
        alert(data.error || 'Erro ao excluir prêmio.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Disparo do Simulador no Admin
  const handleSimulateOpen = async (boxIndex) => {
    const res = await fetch('/api/mystery-box', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'open_box',
        customer_email: 'admin.simulador@upsellflow.local',
        customer_name: 'Simulador Admin',
        campaign_id: campaign?.id,
        chosen_box_index: boxIndex,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    setSimResult(data.data);
    return data.data;
  };

  return (
    <div className="w-100 pb-5">
      {/* Top Header */}
      <div className="d-flex justify-content-between flex-wrap align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2.5">
            <h1 className="page-title mb-0 fs-3 fw-bold text-dark" style={{ margin: 0, lineHeight: 1.2 }}>
              Caixa Misteriosa (Mystery Box)
            </h1>
            <span
              className="badge px-2.5 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '11px',
                height: '24px',
                lineHeight: 1,
                alignSelf: 'center',
              }}
            >
              <Sparkles size={12} />
              Surpresa & Alta Conversão
            </span>
          </div>
          <div className="text-muted small mt-1" style={{ fontSize: '12.5px' }}>
            O comprador escolhe 1 entre 3 caixas surpresa e desbloqueia prêmios instantâneos para upsells de alta conversão.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={async () => {
              setActiveConfigTab('geral');
              setCampaignForm({
                name: campaign?.name || '',
                description: campaign?.description || '',
                trigger_type: campaign?.trigger_type || 'post_purchase',
                box_theme: campaign?.box_theme || 'gold_luxury',
                daily_budget: campaign?.daily_budget || 1000,
                status: campaign?.status || 'active',
              });

              let oc = campaign?.offer_config || {};
              if (typeof oc === 'string') {
                try { oc = JSON.parse(oc); } catch (e) { oc = {}; }
              }
              if (!oc || Object.keys(oc).length === 0) {
                try {
                  const res = await fetch('/api/games/config?game=caixa');
                  const json = await res.json();
                  if (json.success && json.offer_config) {
                    oc = json.offer_config;
                  }
                } catch (err) {
                  console.error('Erro ao carregar offer_config:', err);
                }
              }
              setOfferConfig(oc);
              setShowConfigModal(true);
            }}
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
          >
            <Settings size={16} />
            <span>Configurações & Orçamento</span>
          </button>

          <Link
            href="/caixa-misteriosa"
            target="_blank"
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <ExternalLink size={16} />
            <span>Ver Tela do Jogador (PWA)</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 g-lg-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 p-3 h-100 bg-white" style={{ borderColor: '#e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '11px' }}>
                Total Caixas Abertas
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}
              >
                <Gift size={20} />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">{campaign?.stats?.total_plays || 0}</h3>
              <span className="text-muted small">unboxings feitos</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 p-3 h-100 bg-white" style={{ borderColor: '#e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '11px' }}>
                Jogadores Únicos
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
              >
                <Users size={20} />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">{campaign?.stats?.unique_players || 0}</h3>
              <span className="text-muted small">clientes alcançados</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 p-3 h-100 bg-white" style={{ borderColor: '#e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '11px' }}>
                Cupons Concedidos
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}
              >
                <Percent size={20} />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">{campaign?.stats?.total_coupons_awarded || 0}</h3>
              <span className="text-muted small">prontos para upsell</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 p-3 h-100 bg-white" style={{ borderColor: '#e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '11px' }}>
                Teto Diário PIX
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}
              >
                <DollarSign size={20} />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">
                R$ {Number(campaign?.daily_budget || 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-muted small">limite por dia</span>
            </div>
            <div className="progress mt-2" style={{ height: '6px' }}>
              <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{
                  width: `${Math.min(
                    100,
                    ((campaign?.current_daily_awarded || 0) / (campaign?.daily_budget || 1000)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 2 Colunas */}
      <div className="row g-4">
        {/* Coluna Esquerda: Simulador Interativo */}
        <div className="col-12 col-xl-5">
          <div className="card border shadow-sm rounded-4 p-4 bg-white mb-4" style={{ borderColor: '#e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold mb-0">Simulador de Unboxing</h5>
                <span className="text-muted small">Clique em uma das caixas para testar</span>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold" style={{ fontSize: '10px' }}>
                ● Física 3D Ativa
              </span>
            </div>

            <div className="py-2">
              <InteractiveMysteryBox
                onOpenRequest={handleSimulateOpen}
                soundEnabled={true}
              />
            </div>

            {simResult && (
              <div
                className="p-3 rounded-3 mt-3 border"
                style={{ background: 'var(--surface-subtle, #f8fafc)', borderColor: 'var(--border-subtle, #e2e8f0)' }}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-warning" />
                  <strong className="text-dark">Resultado da Abertura:</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center small text-muted">
                  <span>Prêmio Revelado:</span>
                  <strong className="text-success">{simResult.winning_prize?.label}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center small text-muted mt-1">
                  <span>Cupom Gerado:</span>
                  <code className="text-danger fw-bold">{simResult.coupon_code}</code>
                </div>
              </div>
            )}
          </div>

          {/* Histórico Recente de Jogadas */}
          <div className="card border shadow-sm rounded-4 p-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
            <h5 className="fw-bold mb-1">Últimos Unboxings</h5>
            <p className="text-muted small mb-3">Logs em tempo real de clientes que abriram caixas</p>

            <div className="table-responsive" style={{ maxHeight: '340px' }}>
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Comprador</th>
                    <th>Caixa</th>
                    <th>Prêmio</th>
                    <th>Cupom</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {recentPlays.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-3 text-muted">
                        Nenhuma abertura registrada ainda.
                      </td>
                    </tr>
                  ) : (
                    recentPlays.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '110px' }}>
                            {p.customer_name || 'Comprador'}
                          </div>
                          <div className="text-muted text-truncate" style={{ maxWidth: '110px', fontSize: '10px' }}>
                            {p.customer_email}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            Caixa #{p.chosen_box_index + 1}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            {p.reward_label}
                          </span>
                        </td>
                        <td>
                          <code className="small">{p.coupon_code || '---'}</code>
                        </td>
                        <td className="text-muted small">
                          {new Date(p.created_at).toLocaleDateString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Gerenciador de Prêmios */}
        <div className="col-12 col-xl-7">
          <div className="card border shadow-sm rounded-4 p-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold mb-0">Prêmios da Caixa Misteriosa ({prizes.length})</h5>
                <span className="text-muted small">
                  Recompensas disponíveis para sorteio e probabilidades ponderadas
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingPrize(null);
                  setPrizeForm({
                    label: '',
                    symbol: '🎁',
                    reward_type: 'discount_percentage',
                    reward_value: 40,
                    weight: 20,
                    max_daily_winners: 999,
                  });
                  setShowPrizeModal(true);
                }}
                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
              >
                <Plus size={16} />
                <span>Novo Prêmio</span>
              </button>
            </div>

            {/* Lista de Prêmios */}
            <div className="d-flex flex-column gap-3">
              {prizes.map((p) => {
                const probability = totalWeight > 0 ? ((p.weight / totalWeight) * 100).toFixed(1) : 0;
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-3 bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          fontSize: '28px',
                          width: '50px',
                          height: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--surface-subtle, #f8fafc)',
                          borderRadius: '12px',
                          border: '1px solid var(--border-subtle, #e2e8f0)',
                        }}
                      >
                        {p.symbol}
                      </div>
                      <div>
                        <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                          <span>{p.label}</span>
                          <span
                            className="badge bg-success-subtle text-success border border-success-subtle"
                            style={{ fontSize: '10px' }}
                          >
                            {p.reward_type === 'discount_percentage' && `${p.reward_value}% OFF`}
                            {p.reward_type === 'discount_fixed' && `R$ ${p.reward_value} OFF`}
                            {p.reward_type === 'cash_pix' && `R$ ${p.reward_value} no PIX`}
                            {p.reward_type === 'puzzle_pieces' && `+${p.reward_value} Peças Puzzle`}
                            {p.reward_type === 'free_shipping' && 'Frete Grátis'}
                          </span>
                        </div>
                        <div className="small text-muted d-flex align-items-center gap-3">
                          <span>
                            Probabilidade: <strong className="text-dark">{probability}%</strong> (peso {p.weight})
                          </span>
                          <span>•</span>
                          <span>
                            Limite diário: <strong>{p.max_daily_winners} ganhadores</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPrize(p);
                          setPrizeForm({
                            label: p.label,
                            symbol: p.symbol,
                            reward_type: p.reward_type,
                            reward_value: p.reward_value,
                            weight: p.weight,
                            max_daily_winners: p.max_daily_winners || 999,
                          });
                          setShowPrizeModal(true);
                        }}
                        className="btn btn-sm btn-outline-secondary p-2"
                        title="Editar Prêmio"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePrize(p.id)}
                        className="btn btn-sm btn-outline-danger p-2"
                        title="Excluir Prêmio"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Configurações Gerais da Campanha */}
      {showConfigModal && (
        <div
          className="uf-modal-backdrop"
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="uf-modal-card"
            style={{ maxWidth: '1020px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="uf-modal-header">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '42px', height: '42px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                  <Settings size={20} />
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0 fs-5">Configurações da Caixa Misteriosa</h5>
                  <span className="text-muted small" style={{ fontSize: '12.5px' }}>
                    Ajuste as regras do jogo e a segunda tela de upsell/bônus
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="uf-modal-close-btn"
                onClick={() => setShowConfigModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="uf-modal-tabs">
              <button
                type="button"
                onClick={() => setActiveConfigTab('geral')}
                className={`uf-modal-tab-btn ${activeConfigTab === 'geral' ? 'active' : ''}`}
              >
                ⚙️ Regras da Caixa Misteriosa
              </button>
              <button
                type="button"
                onClick={() => setActiveConfigTab('oferta')}
                className={`uf-modal-tab-btn ${activeConfigTab === 'oferta' ? 'active' : ''}`}
              >
                🎁 Tela de Oferta / Bônus (Etapa 2)
                <span className="badge bg-warning text-dark px-1.5 py-0.5 rounded-pill" style={{ fontSize: '9px' }}>
                  VIP
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="d-flex flex-column flex-grow-1 overflow-hidden">
              <div className="uf-modal-body-scrollable p-4 p-md-5 overflow-y-auto flex-grow-1" style={{ maxHeight: '74vh' }}>
                {activeConfigTab === 'geral' ? (
                  <>
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Nome da Campanha</label>
                      <input
                        type="text"
                        className="form-control"
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                        required
                        placeholder="Ex: Caixa Misteriosa Dourada"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Descrição / Subtítulo</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={campaignForm.description}
                        onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                        placeholder="Texto que convida o comprador a escolher uma caixa..."
                      />
                    </div>

                    <div className="row g-4 mb-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Orçamento Diário PIX (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={campaignForm.daily_budget}
                          onChange={(e) => setCampaignForm({ ...campaignForm, daily_budget: e.target.value })}
                          required
                        />
                        <span className="text-muted small d-block mt-2" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                          Proteção contra gastos excessivos em dinheiro.
                        </span>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Gatilho de Disparo</label>
                        <select
                          className="form-select"
                          value={campaignForm.trigger_type}
                          onChange={(e) => setCampaignForm({ ...campaignForm, trigger_type: e.target.value })}
                        >
                          <option value="post_purchase">Pós-Compra Imediato (Upsell)</option>
                          <option value="exit_intent">Exit-Intent (Ao fechar página)</option>
                          <option value="manual">Manual / Link Direto</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Status da Campanha</label>
                      <select
                        className="form-select"
                        value={campaignForm.status}
                        onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}
                      >
                        <option value="active">🟢 Ativa & Operacional</option>
                        <option value="inactive">⏸️ Pausada</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="alert alert-light border d-flex align-items-center gap-3 mb-4 p-3.5 rounded-3">
                      <Sparkles size={18} className="text-warning flex-shrink-0" />
                      <div className="small text-muted" style={{ fontSize: '12.5px', lineHeight: 1.45 }}>
                        Esta tela aparece imediatamente após o jogador abrir a caixa e clicar em <strong>"PEGAR MEU BÔNUS AGORA"</strong>.
                      </div>
                    </div>
                    <OfferConfigForm config={offerConfig} onChange={setOfferConfig} />
                  </div>
                )}
              </div>

              <div className="uf-modal-footer">
                <button
                  type="button"
                  className="uf-btn-cancel"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="uf-btn-save">
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar / Editar Prêmio */}
      {showPrizeModal && (
        <div
          className="uf-modal-backdrop"
          onClick={() => setShowPrizeModal(false)}
        >
          <div
            className="uf-modal-card"
            style={{ maxWidth: '680px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="uf-modal-header">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '42px', height: '42px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                  <Gift size={20} />
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0 fs-5">
                    {editingPrize ? 'Editar Prêmio da Caixa' : 'Novo Prêmio da Caixa Misteriosa'}
                  </h5>
                  <span className="text-muted small" style={{ fontSize: '12.5px' }}>
                    Configure o símbolo, tipo e probabilidade deste prêmio
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="uf-modal-close-btn"
                onClick={() => setShowPrizeModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePrize} className="d-flex flex-column flex-grow-1 overflow-hidden">
              <div className="uf-modal-body-scrollable p-4 p-md-5 overflow-y-auto flex-grow-1" style={{ maxHeight: '74vh' }}>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Nome do Prêmio (Exibição)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 60% OFF no Upsell VIP"
                    value={prizeForm.label}
                    onChange={(e) => setPrizeForm({ ...prizeForm, label: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-4">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Símbolo (Emoji)</label>
                    <input
                      type="text"
                      className="form-control text-center fs-4"
                      value={prizeForm.symbol}
                      onChange={(e) => setPrizeForm({ ...prizeForm, symbol: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-8">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Tipo de Recompensa</label>
                    <select
                      className="form-select"
                      value={prizeForm.reward_type}
                      onChange={(e) => setPrizeForm({ ...prizeForm, reward_type: e.target.value })}
                    >
                      <option value="discount_percentage">🏷️ Desconto Percentual (%)</option>
                      <option value="discount_fixed">💵 Desconto Fixo (R$)</option>
                      <option value="cash_pix">💸 Prêmio em Dinheiro (PIX)</option>
                      <option value="puzzle_pieces">🧩 Peças de Quebra-Cabeça</option>
                      <option value="free_shipping">🚚 Frete Grátis</option>
                    </select>
                  </div>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Valor do Prêmio</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={prizeForm.reward_value}
                      onChange={(e) => setPrizeForm({ ...prizeForm, reward_value: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>Peso (Probabilidade)</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      className="form-control"
                      value={prizeForm.weight}
                      onChange={(e) => setPrizeForm({ ...prizeForm, weight: e.target.value })}
                      required
                    />
                    <span className="text-muted small d-block mt-2" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                      Quanto maior o peso, mais chances de ser sorteado.
                    </span>
                  </div>
                </div>
              </div>

              <div className="uf-modal-footer">
                <button
                  type="button"
                  className="uf-btn-cancel"
                  onClick={() => setShowPrizeModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="uf-btn-save">
                  {editingPrize ? 'Atualizar Prêmio' : 'Criar Prêmio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
