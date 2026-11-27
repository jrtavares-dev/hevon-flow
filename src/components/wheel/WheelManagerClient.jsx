'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CircleDot,
  Plus,
  Sparkles,
  Trophy,
  Sliders,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  DollarSign,
  Gift,
  Gamepad2,
  ShieldAlert,
  Percent,
  Truck,
  RotateCcw,
  Zap,
  X,
  Play,
} from 'lucide-react';
import InteractiveWheel from './InteractiveWheel';
import OfferConfigForm from '@/components/games/OfferConfigForm';
import '../puzzle/puzzle-admin.css';

export default function WheelManagerClient({ initialWheel = null, initialRecentSpins = [] }) {
  const [wheel, setWheel] = useState(initialWheel);
  const [slices, setSlices] = useState(initialWheel?.slices || []);
  const [recentSpins, setRecentSpins] = useState(initialRecentSpins);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modais
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('geral');
  const [offerConfig, setOfferConfig] = useState({});
  const [sliceModalOpen, setSliceModalOpen] = useState(false);
  const [editingSlice, setEditingSlice] = useState(null);
  const [simResult, setSimResult] = useState(null);

  // Form State para Configurações Gerais
  const [wheelForm, setWheelForm] = useState({
    id: initialWheel?.id || 1,
    name: initialWheel?.name || 'Roleta da Sorte Oficial',
    description: initialWheel?.description || '',
    trigger_type: initialWheel?.trigger_type || 'post_purchase',
    theme: initialWheel?.theme || 'gold_dark',
    daily_budget: initialWheel?.daily_budget || 1500.00,
    status: initialWheel?.status || 'active',
  });

  // Form State para Fatia (Criar/Editar)
  const [sliceForm, setSliceForm] = useState({
    slice_id: null,
    label: '',
    sublabel: '',
    reward_type: 'discount_percentage',
    reward_value: 20,
    color_bg: '#10b981',
    color_text: '#ffffff',
    weight: 20,
  });

  const totalWeight = slices.reduce((acc, curr) => acc + Math.max(1, Number(curr.weight || 10)), 0);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenSettings = async () => {
    setActiveSettingsTab('geral');
    setWheelForm({
      id: wheel?.id || 1,
      name: wheel?.name || 'Roleta da Sorte Oficial',
      description: wheel?.description || '',
      trigger_type: wheel?.trigger_type || 'post_purchase',
      theme: wheel?.theme || 'gold_dark',
      daily_budget: wheel?.daily_budget || 1500.00,
      status: wheel?.status || 'active',
    });

    let oc = wheel?.offer_config || {};
    if (typeof oc === 'string') {
      try { oc = JSON.parse(oc); } catch (e) { oc = {}; }
    }
    if (!oc || Object.keys(oc).length === 0) {
      try {
        const res = await fetch('/api/games/config?game=roleta');
        const json = await res.json();
        if (json.success && json.offer_config) {
          oc = json.offer_config;
        }
      } catch (err) {
        console.error('Erro ao carregar offer_config:', err);
      }
    }
    setOfferConfig(oc);
    setSettingsModalOpen(true);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/wheel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_wheel',
          ...wheelForm,
          offer_config: offerConfig,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Configurações da roleta e da oferta salvas com sucesso!');
      setWheel({ ...wheel, ...wheelForm, offer_config: offerConfig });
      setSettingsModalOpen(false);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddSlice = () => {
    setEditingSlice(null);
    setSliceForm({
      slice_id: null,
      label: 'Novo Prêmio',
      sublabel: 'Válido no upsell',
      reward_type: 'discount_percentage',
      reward_value: 20,
      color_bg: '#10b981',
      color_text: '#ffffff',
      weight: 15,
    });
    setSliceModalOpen(true);
  };

  const handleOpenEditSlice = (slice) => {
    setEditingSlice(slice);
    setSliceForm({
      slice_id: slice.id,
      label: slice.label,
      sublabel: slice.sublabel || '',
      reward_type: slice.reward_type,
      reward_value: slice.reward_value,
      color_bg: slice.color_bg || '#10b981',
      color_text: slice.color_text || '#ffffff',
      weight: slice.weight || 10,
    });
    setSliceModalOpen(true);
  };

  const handleSaveSlice = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const action = sliceForm.slice_id ? 'update_slice' : 'add_slice';
      const res = await fetch('/api/wheel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          wheel_id: wheel.id,
          ...sliceForm,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(data.message || 'Fatia salva!');
      setSliceModalOpen(false);

      // Recarregar fatias
      const refRes = await fetch(`/api/wheel?mode=admin&wheel_id=${wheel.id}`);
      const refData = await refRes.json();
      if (refData.success && refData.wheel) {
        setWheel(refData.wheel);
        setSlices(refData.wheel.slices || []);
      }
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlice = async (sliceId) => {
    if (slices.length <= 4) {
      alert('A roleta precisa ter no mínimo 4 fatias para manter o equilíbrio visual.');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir esta fatia?')) return;

    try {
      const res = await fetch('/api/wheel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_slice',
          slice_id: sliceId,
          wheel_id: wheel.id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Fatia excluída!');
      setSlices(slices.filter(s => s.id !== sliceId));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Simulação de giro direto pelo componente interativo no admin
  const handleSimulateSpin = async () => {
    setSimResult(null);
    const res = await fetch('/api/wheel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'spin',
        customer_email: 'admin@upsellflow.com',
        customer_name: 'Admin Teste',
        wheel_id: wheel.id,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  };

  const handleSimulateSpinEnd = (result) => {
    setSimResult(result);
    // Atualiza histórico recente
    fetch(`/api/wheel?mode=admin&wheel_id=${wheel.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.recent_spins) setRecentSpins(d.recent_spins);
      });
  };

  return (
    <div className="w-100 pb-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`position-fixed bottom-0 end-0 m-4 p-3 rounded-4 shadow-xl d-flex align-items-center gap-2 text-white ${
            toastMessage.isError ? 'bg-danger' : 'bg-success'
          }`}
          style={{ zIndex: 10000, maxWidth: '380px' }}
        >
          {toastMessage.isError ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="fw-semibold small">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2.5">
            <h1 className="page-title mb-0 fs-3 fw-bold text-dark" style={{ margin: 0, lineHeight: 1.2 }}>
              Roleta da Sorte (Spin to Win)
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
              <Sparkles size={12} />
              Conversão Instantânea
            </span>
          </div>
          <div className="text-muted small mt-1" style={{ fontSize: '12.5px' }}>
            Configure as fatias, cupons de 1-clique, probabilidades matemáticas e teto diário de segurança.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            href="/roleta"
            target="_blank"
            className="btn btn-sm btn-outline-secondary shadow-xs d-inline-flex align-items-center gap-1.5"
            style={{ height: '35px', fontSize: '12px' }}
            title="Abrir tela do comprador para testar"
          >
            <ExternalLink size={14} />
            <span>Ver Tela do Jogador</span>
          </Link>
          <button
            onClick={handleOpenSettings}
            className="btn btn-sm btn-outline-secondary shadow-xs d-inline-flex align-items-center gap-1.5"
            style={{ height: '35px', fontSize: '12px' }}
          >
            <Settings size={14} />
            <span>Configurar Roleta</span>
          </button>
          <button
            onClick={handleOpenAddSlice}
            className="btn btn-sm btn-primary shadow-xs d-inline-flex align-items-center gap-1.5"
            style={{ height: '35px', fontSize: '12.5px' }}
          >
            <Plus size={15} />
            <span>Nova Fatia</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {/* Total Giros */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-xs rounded-3 p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '11px' }}>
                Total de Giros
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
              >
                <CircleDot size={18} />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold mb-0 fs-3" style={{ color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                {wheel?.stats?.total_spins || recentSpins.length}
              </h3>
              <span className="text-muted small">giros</span>
            </div>
          </div>
        </div>

        {/* Jogadores Únicos */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-xs rounded-3 p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '11px' }}>
                Jogadores Únicos
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}
              >
                <Trophy size={18} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 fs-3" style={{ color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
              {wheel?.stats?.unique_players || 1}
            </h3>
            <div className="text-success small fw-semibold mt-1">● Compradores engajados</div>
          </div>
        </div>

        {/* Orçamento Diário */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            onClick={handleOpenSettings}
            className="card shadow-xs rounded-3 p-3 h-100 cursor-pointer"
            role="button"
            title="Clique para ajustar o teto diário"
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '11px' }}>
                Teto Diário
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}
              >
                <DollarSign size={18} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 fs-3" style={{ color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
              R$ {parseFloat(wheel?.daily_budget || 1500).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <div className="text-muted small mt-1 d-flex justify-content-between align-items-center">
              <span>Limite diário</span>
              <span className="text-primary small" style={{ fontSize: '11px' }}>Editar ➔</span>
            </div>
          </div>
        </div>

        {/* Fatias Ativas */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-xs rounded-3 p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '11px' }}>
                Fatias na Roleta
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px', background: 'rgba(236, 72, 153, 0.1)', color: '#db2777' }}
              >
                <Zap size={20} />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">{slices.length}</h3>
              <span className="text-muted small">fatias no disco</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Simulador Interativo à Esquerda + Gerenciador de Fatias à Direita */}
      <div className="row g-4 mb-4">
        {/* COLUNA ESQUERDA: Simulador Live da Roleta com Canvas Real */}
        <div className="col-12 col-xl-5">
          <div className="card shadow-xs rounded-3 p-4 h-100 d-flex flex-column align-items-center justify-content-between text-center">
            <div className="w-100 d-flex align-items-center justify-content-between mb-3">
              <div className="text-start">
                <h5 className="fw-bold mb-0 fs-6" style={{ color: 'var(--text-main)' }}>Simulador em Tempo Real</h5>
                <span className="text-muted small" style={{ fontSize: '11.5px' }}>
                  Gire para testar a física, o som dos pinos e o sorteio
                </span>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold" style={{ fontSize: '10.5px' }}>
                ● Física Ativa
              </span>
            </div>

            {/* Componente Canvas da Roleta Interativa */}
            <div className="my-2 py-2">
              <InteractiveWheel
                slices={slices}
                onSpinRequest={handleSimulateSpin}
                onSpinEnd={handleSimulateSpinEnd}
                size={340}
              />
            </div>

            {/* Banner de Resultado da Simulação */}
            {simResult ? (
              <div className="w-100 p-3 rounded-3 mt-3 text-start" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="badge bg-success text-white fw-bold">🎉 RESULTADO DO GIRO</span>
                  <span className="text-muted small" style={{ fontSize: '10px' }}>Fatia #{simResult.slice_index + 1}</span>
                </div>
                <h6 className="fw-bold mb-0 fs-6" style={{ color: 'var(--text-main)' }}>{simResult.label}</h6>
                <div className="text-secondary small mt-0.5" style={{ fontSize: '11px' }}>
                  {simResult.sublabel} {simResult.coupon_code && `• Cupom: ${simResult.coupon_code}`}
                </div>
              </div>
            ) : (
              <div className="w-100 p-2.5 rounded-3 mt-3 text-muted small" style={{ fontSize: '11.5px', background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)' }}>
                💡 Clique em <strong>"GIRAR A ROLETA"</strong> para disparar a física real de desaceleração.
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: Editor das Fatias & Probabilidades */}
        <div className="col-12 col-xl-7">
          <div className="card shadow-xs rounded-3 p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h5 className="fw-bold mb-0 fs-6" style={{ color: 'var(--text-main)' }}>Fatias Configuradas ({slices.length})</h5>
                  <span className="text-muted small" style={{ fontSize: '11.5px' }}>
                    Probabilidades calculadas proporcionalmente pelo peso de cada fatia
                  </span>
                </div>
                <button
                  onClick={handleOpenAddSlice}
                  className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 shadow-xs fw-semibold"
                  style={{ borderRadius: '8px' }}
                >
                  <Plus size={14} />
                  <span>Adicionar Fatia</span>
                </button>
              </div>

              {/* Lista das Fatias */}
              <div className="d-flex flex-column gap-2 mb-3">
                {slices.map((s, idx) => {
                  const prob = totalWeight > 0 ? ((Number(s.weight || 10) / totalWeight) * 100).toFixed(1) : 0;

                  return (
                    <div
                      key={s.id || idx}
                      className="p-3 rounded-3 border d-flex align-items-center justify-content-between transition"
                      style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="d-flex align-items-center gap-3 min-w-0">
                        {/* Cor Preview da Fatia */}
                        <div
                          className="rounded-3 shadow-xs flex-shrink-0 d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{
                            width: '36px',
                            height: '36px',
                            background: s.color_bg || '#10b981',
                            fontSize: '12px',
                          }}
                        >
                          #{idx + 1}
                        </div>

                        {/* Label & Tipo */}
                        <div className="min-w-0">
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="fw-bold mb-0 text-truncate fs-6" style={{ color: 'var(--text-main)' }}>{s.label}</h6>
                            <span
                              className="badge rounded-pill"
                              style={{
                                fontSize: '10px',
                                background: s.reward_type === 'cash_pix' ? 'rgba(16, 185, 129, 0.15)' : s.reward_type.startsWith('discount') ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: s.reward_type === 'cash_pix' ? '#34d399' : s.reward_type.startsWith('discount') ? '#a5b4fc' : '#fbbf24',
                              }}
                            >
                              {s.reward_type === 'discount_percentage' ? `${s.reward_value}% OFF` : s.reward_type === 'cash_pix' ? `R$ ${s.reward_value} PIX` : s.reward_type === 'puzzle_pieces' ? `+${s.reward_value} Peças` : s.reward_type === 'free_shipping' ? 'Frete Grátis' : 'Sem Prêmio'}
                            </span>
                          </div>
                          <div className="text-muted small mt-0.5 text-truncate" style={{ fontSize: '11.5px' }}>
                            {s.sublabel || 'Prêmio imediato'}
                          </div>
                        </div>
                      </div>

                      {/* Probabilidade & Ações */}
                      <div className="d-flex align-items-center gap-3 flex-shrink-0">
                        <div className="text-end">
                          <span className="fw-bold small" style={{ color: 'var(--text-main)' }}>{prob}%</span>
                          <div className="text-muted" style={{ fontSize: '10px' }}>Peso {s.weight || 10}</div>
                        </div>

                        <div className="d-flex align-items-center gap-1">
                          <button
                            onClick={() => handleOpenEditSlice(s)}
                            className="btn btn-sm btn-outline-secondary p-1.5 rounded-2"
                            title="Editar Fatia"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteSlice(s.id)}
                            className="btn btn-sm btn-outline-danger p-1.5 rounded-2"
                            title="Excluir Fatia"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dica da Estratégia de Roleta */}
            <div className="p-3 rounded-3 border d-flex align-items-start gap-2.5 mt-2" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
              <ShieldAlert size={17} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="small text-muted" style={{ fontSize: '11.5px', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--text-main)' }}>Estratégia recomendada:</strong> Configure a maior probabilidade (ex: 60% a 80%) para o cupom do seu <strong>Upsell 1</strong>. Isso gera efeito de conquista e conversão imediata.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico Recente de Giros */}
      <div className="card shadow-xs rounded-3 p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="fw-bold text-dark mb-0 fs-6">Últimos Giros Registrados</h5>
            <span className="text-muted small" style={{ fontSize: '11.5px' }}>
              Histórico de clientes que giraram e prêmios concedidos
            </span>
          </div>
          <span className="text-muted small" style={{ fontSize: '11.5px' }}>Mostrando os últimos {recentSpins.length} giros</span>
        </div>

        {recentSpins.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            Nenhum giro registrado ainda. Use o simulador acima para realizar o primeiro giro de teste!
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '12.5px' }}>
              <thead className="table-light">
                <tr>
                  <th className="py-2.5">Cliente</th>
                  <th>Prêmio Concedido</th>
                  <th>Tipo</th>
                  <th>Cupom Gerado</th>
                  <th>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {recentSpins.map((spin) => (
                  <tr key={spin.id}>
                    <td className="fw-semibold text-dark">
                      <div>{spin.customer_name || 'Comprador'}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{spin.customer_email}</div>
                    </td>
                    <td className="fw-bold text-dark">{spin.reward_label}</td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                        {spin.reward_type}
                      </span>
                    </td>
                    <td>
                      {spin.coupon_code ? (
                        <span className="font-monospace text-primary fw-bold" style={{ fontSize: '11.5px' }}>
                          {spin.coupon_code}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-muted" style={{ fontSize: '11px' }}>
                      {new Date(spin.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: CONFIGURAÇÃO GERAL DA ROLETA & TETO DIÁRIO
          ========================================================================= */}
      {settingsModalOpen && (
        <div
          className="uf-modal-backdrop"
          onClick={() => setSettingsModalOpen(false)}
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
                  style={{ width: '42px', height: '42px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)' }}
                >
                  <Settings size={20} />
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0 fs-5">Configurar Roleta da Sorte</h5>
                  <div className="text-muted small" style={{ fontSize: '12.5px' }}>Ajuste regras, status e a segunda tela de oferta</div>
                </div>
              </div>
              <button
                type="button"
                className="uf-modal-close-btn"
                onClick={() => setSettingsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="uf-modal-tabs">
              <button
                type="button"
                onClick={() => setActiveSettingsTab('geral')}
                className={`uf-modal-tab-btn ${activeSettingsTab === 'geral' ? 'active' : ''}`}
              >
                ⚙️ Regras da Roleta
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('oferta')}
                className={`uf-modal-tab-btn ${activeSettingsTab === 'oferta' ? 'active' : ''}`}
              >
                🎁 Tela de Oferta / Bônus (Etapa 2)
                <span className="badge bg-warning text-dark px-1.5 py-0.5 rounded-pill" style={{ fontSize: '9px' }}>
                  VIP
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="d-flex flex-column flex-grow-1 overflow-hidden">
              <div className="uf-modal-body-scrollable p-4 p-md-5 overflow-y-auto flex-grow-1" style={{ maxHeight: '74vh' }}>
                {activeSettingsTab === 'geral' ? (
                  <div className="puzzle-admin-grid-form">
                    {/* Nome */}
                    <div>
                      <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Nome da Roleta *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={wheelForm.name}
                        onChange={(e) => setWheelForm({ ...wheelForm, name: e.target.value })}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Status</label>
                      <select
                        className="form-select"
                        value={wheelForm.status}
                        onChange={(e) => setWheelForm({ ...wheelForm, status: e.target.value })}
                      >
                        <option value="active">● Ativa (Disponível)</option>
                        <option value="inactive">⏸️ Pausada</option>
                      </select>
                    </div>

                    {/* Gatilho de Disparo */}
                    <div>
                      <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Gatilho no Funil</label>
                      <select
                        className="form-select"
                        value={wheelForm.trigger_type}
                        onChange={(e) => setWheelForm({ ...wheelForm, trigger_type: e.target.value })}
                      >
                        <option value="post_purchase">Pós-Compra Imediato (Antes do Upsell 1)</option>
                        <option value="exit_intent">Exit-Intent (Tentativa de Sair da Página)</option>
                        <option value="manual">Manual / Link Direto</option>
                      </select>
                    </div>

                    {/* Teto do Orçamento Diário */}
                    <div>
                      <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>🛡️ Teto Diário em Dinheiro (R$)</label>
                      <input
                        type="number"
                        step="50"
                        min="0"
                        className="form-control"
                        value={wheelForm.daily_budget}
                        onChange={(e) => setWheelForm({ ...wheelForm, daily_budget: e.target.value })}
                      />
                      <div className="text-muted small mt-2" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                        Limite diário para prêmios que exigem pagamento em dinheiro/PIX.
                      </div>
                    </div>

                    {/* Descrição Promocional */}
                    <div className="full-width">
                      <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Texto de Boas-Vindas da Roleta</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={wheelForm.description}
                        onChange={(e) => setWheelForm({ ...wheelForm, description: e.target.value })}
                        placeholder="Ex: Gire a roleta e ganhe descontos imperdíveis no seu próximo upsell!"
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-light border d-flex align-items-center gap-3 mb-4 p-3.5 rounded-3">
                      <Sparkles size={18} className="text-warning flex-shrink-0" />
                      <div className="small text-muted" style={{ fontSize: '12.5px', lineHeight: 1.45 }}>
                        Esta tela aparece imediatamente após o comprador girar a roleta e clicar em <strong>"PEGAR MEU BÔNUS AGORA"</strong>.
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
                  onClick={() => setSettingsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="uf-btn-save">
                  {loading ? 'Salvando...' : 'Salvar Roleta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CRIAR OU EDITAR FATIA
          ========================================================================= */}
      {sliceModalOpen && (
        <div
          className="uf-modal-backdrop"
          onClick={() => setSliceModalOpen(false)}
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
                  style={{ width: '42px', height: '42px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                  <Plus size={20} />
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0 fs-5">
                    {editingSlice ? 'Editar Fatia da Roleta' : 'Nova Fatia da Roleta'}
                  </h5>
                  <div className="text-muted small" style={{ fontSize: '12.5px' }}>
                    Defina o texto, tipo de prêmio e peso da probabilidade
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="uf-modal-close-btn"
                onClick={() => setSliceModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSlice} className="d-flex flex-column flex-grow-1 overflow-hidden">
              <div className="uf-modal-body-scrollable p-4 p-md-5 overflow-y-auto flex-grow-1" style={{ maxHeight: '74vh' }}>
                <div className="puzzle-admin-grid-form">
                  {/* Rótulo da Fatia */}
                  <div className="full-width">
                    <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Texto Visível na Fatia *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Ex: 50% OFF no Upsell ou R$ 50 no PIX"
                      value={sliceForm.label}
                      onChange={(e) => setSliceForm({ ...sliceForm, label: e.target.value })}
                    />
                  </div>

                  {/* Tipo de Prêmio */}
                  <div>
                    <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Tipo de Prêmio</label>
                    <select
                      className="form-select"
                      value={sliceForm.reward_type}
                      onChange={(e) => setSliceForm({ ...sliceForm, reward_type: e.target.value })}
                    >
                      <option value="discount_percentage">🏷️ Desconto Percentual (% OFF no Upsell)</option>
                      <option value="discount_fixed">💵 Desconto em R$ (R$ OFF no Upsell)</option>
                      <option value="puzzle_pieces">🧩 Peças do Quebra-Cabeça (Ganha Peças)</option>
                      <option value="cash_pix">💸 Prêmio em Dinheiro / PIX</option>
                      <option value="free_shipping">🚚 Frete Grátis</option>
                      <option value="no_prize">❌ Sem Prêmio (Tente Novamente)</option>
                    </select>
                  </div>

                  {/* Valor do Prêmio */}
                  <div>
                    <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Valor do Prêmio</label>
                    <input
                      type="number"
                      step="1"
                      className="form-control"
                      value={sliceForm.reward_value}
                      onChange={(e) => setSliceForm({ ...sliceForm, reward_value: e.target.value })}
                    />
                    <div className="text-muted small mt-2" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                      {sliceForm.reward_type === 'discount_percentage' ? 'Porcentagem de desconto (ex: 50 para 50%)' : sliceForm.reward_type === 'puzzle_pieces' ? 'Quantidade de peças concedidas (ex: 2)' : 'Valor numérico'}
                    </div>
                  </div>

                  {/* Peso da Probabilidade */}
                  <div>
                    <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Peso da Probabilidade (1 - 100)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="form-control"
                      value={sliceForm.weight}
                      onChange={(e) => setSliceForm({ ...sliceForm, weight: parseInt(e.target.value) || 10 })}
                    />
                    <div className="text-muted small mt-2" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                      Quanto maior o peso, mais frequente é a saída desta fatia.
                    </div>
                  </div>

                  {/* Cor de Fundo */}
                  <div>
                    <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Cor da Fatia</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        style={{ width: '54px', height: '48px', padding: '4px' }}
                        value={sliceForm.color_bg}
                        onChange={(e) => setSliceForm({ ...sliceForm, color_bg: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={sliceForm.color_bg}
                        onChange={(e) => setSliceForm({ ...sliceForm, color_bg: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Subtítulo / Detalhe */}
                  <div className="full-width">
                    <label className="form-label text-dark small fw-bold mb-2" style={{ fontSize: '13px' }}>Subtítulo / Instrução</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Aplicado automaticamente no 1º Upsell"
                      value={sliceForm.sublabel}
                      onChange={(e) => setSliceForm({ ...sliceForm, sublabel: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="uf-modal-footer">
                <button
                  type="button"
                  className="uf-btn-cancel"
                  onClick={() => setSliceModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="uf-btn-save">
                  {loading ? 'Salvando...' : 'Salvar Fatia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
