'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Puzzle,
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
  Clock,
  Layers,
  Users,
  Zap,
  X,
  Star,
  CheckCircle2,
  Upload,
  Lock,
  Unlock,
  Image as ImageIcon,
} from 'lucide-react';
import InteractiveAlbumSimulator from './InteractiveAlbumSimulator';
import JigsawPuzzleBoard from './JigsawPuzzleBoard';
import OfferConfigForm from '@/components/games/OfferConfigForm';
import './puzzle-admin.css';

export default function PuzzleManagerClient({
  initialPuzzles = [],
  initialCampaign = null,
  initialStats = null,
  initialRecentDrops = [],
}) {
  const [puzzles, setPuzzles] = useState(initialPuzzles);
  const [campaign, setCampaign] = useState(initialCampaign);
  const [stats, setStats] = useState(
    initialStats || {
      total_drops: 0,
      unique_collectors: 0,
      total_rewards: 0,
      total_value: 0,
    }
  );
  const [recentDrops, setRecentDrops] = useState(initialRecentDrops);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modais
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('geral');
  const [offerConfig, setOfferConfig] = useState({});
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState(null);

  // Simulador
  const [selectedPreviewPuzzle, setSelectedPreviewPuzzle] = useState(initialPuzzles[0] || null);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Form State para Configurações Gerais
  const [campaignForm, setCampaignForm] = useState({
    id: initialCampaign?.id || 1,
    name: initialCampaign?.name || 'Álbum de Figurinhas dos Sonhos',
    description: initialCampaign?.description || 'Colecione todas as figurinhas para ganhar prêmios incríveis!',
    daily_budget: initialCampaign?.daily_budget || 2000.0,
    total_budget: initialCampaign?.total_budget || 50000.0,
    status: initialCampaign?.status || 'active',
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State para Figurinha / Prêmio (Criar / Editar)
  const [stickerForm, setStickerForm] = useState({
    id: null,
    name: '',
    description: '',
    prize_name: '',
    prize_value: 100,
    image: '',
    pieces_count: 9,
    distribution_weight: 15,
    max_winners: 10,
    status: 'active',
    last_piece_rule: 'manual',
    last_piece_min_participations: 5,
  });

  const availableImages = [
    { label: 'iPhone 17 Pro', file: 'iphone.svg' },
    { label: 'PIX R$ 500', file: 'pix500.svg' },
    { label: 'PIX R$ 100', file: 'pix100.svg' },
    { label: 'PlayStation 5', file: 'ps5.svg' },
    { label: 'Smart TV 65"', file: 'tv.svg' },
  ];

  const totalWeight = puzzles.reduce(
    (acc, curr) => acc + Math.max(1, Number(curr.distribution_weight || 10)),
    0
  );

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const reloadData = async () => {
    try {
      const res = await fetch('/api/puzzle/puzzles?mode=admin');
      const data = await res.json();
      if (data.success) {
        if (data.puzzles) {
          setPuzzles(data.puzzles);
          if (!selectedPreviewPuzzle && data.puzzles.length > 0) {
            setSelectedPreviewPuzzle(data.puzzles[0]);
          }
        }
        if (data.campaign) setCampaign(data.campaign);
        if (data.stats) setStats(data.stats);
        if (data.recent_drops) setRecentDrops(data.recent_drops);
      }
    } catch (err) {
      console.error('Error reloading puzzle data:', err);
    }
  };

  // Abrir Modal de Configurações Gerais
  const handleOpenSettings = async () => {
    setActiveSettingsTab('geral');
    setCampaignForm({
      id: campaign?.id || 1,
      name: campaign?.name || 'Álbum de Figurinhas dos Sonhos',
      description: campaign?.description || '',
      daily_budget: campaign?.daily_budget || 2000.0,
      total_budget: campaign?.total_budget || 50000.0,
      status: campaign?.status || 'active',
    });

    let oc = campaign?.offer_config || {};
    if (typeof oc === 'string') {
      try { oc = JSON.parse(oc); } catch (e) { oc = {}; }
    }
    if (!oc || Object.keys(oc).length === 0) {
      try {
        const res = await fetch('/api/games/config?game=figurinha');
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
      const res = await fetch('/api/puzzle/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_campaign',
          ...campaignForm,
          offer_config: offerConfig,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Sincroniza diretamente com a API centralizada de jogos
      await fetch('/api/games/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'figurinha',
          campaign_id: campaignForm.id || 1,
          offer_config: offerConfig,
        }),
      }).catch((syncErr) => console.error('Erro ao sincronizar games/config:', syncErr));

      showToast('Configurações do álbum e da oferta salvas com sucesso!');
      if (data.campaign) {
        setCampaign({ ...data.campaign, offer_config: offerConfig });
      }
      setSettingsModalOpen(false);
      await reloadData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Upload direto da foto do quebra-cabeça (dividida em peças)
  const handleUploadStickerPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'images');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Erro no envio da foto');

      setStickerForm((prev) => ({
        ...prev,
        image: data.url,
      }));
      showToast('Foto do prêmio enviada com sucesso!');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Alternar rapidamente a liberação/bloqueio da Peça Final (#9)
  const handleToggleLastPieceRule = async (puzzleId, currentRule) => {
    setLoading(true);
    try {
      const nextRule = currentRule === 'manual' ? 'none' : 'manual';
      const res = await fetch('/api/puzzle/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_last_piece',
          id: puzzleId,
          rule_type: nextRule,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(data.message);
      await reloadData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Abrir Modal de Adicionar Figurinha
  const handleOpenAddSticker = () => {
    setEditingSticker(null);
    setStickerForm({
      id: null,
      name: 'Quebra-cabeça ' + (puzzles.length + 1),
      description: 'Colecione as 9 peças para resgatar este prêmio.',
      prize_name: 'MT - 03',
      prize_value: 30000,
      image: '',
      pieces_count: 9,
      distribution_weight: 15,
      max_winners: 10,
      status: 'active',
      last_piece_rule: 'manual', // 🔒 Bloqueada por padrão (Admin decide quando sai)
      last_piece_min_participations: 5,
    });
    setStickerModalOpen(true);
  };

  // Abrir Modal de Editar Figurinha
  const handleOpenEditSticker = (sticker) => {
    setEditingSticker(sticker);
    let minPart = 5;
    if (sticker.last_piece_rule_data) {
      try {
        const parsed = typeof sticker.last_piece_rule_data === 'string'
          ? JSON.parse(sticker.last_piece_rule_data)
          : sticker.last_piece_rule_data;
        if (parsed?.min_count) minPart = Number(parsed.min_count);
      } catch {}
    }

    setStickerForm({
      id: sticker.id,
      name: sticker.name,
      description: sticker.description || '',
      prize_name: sticker.prize_name,
      prize_value: sticker.prize_value || 0,
      image: sticker.image || '',
      pieces_count: sticker.pieces_count || 9,
      distribution_weight: sticker.distribution_weight || 10,
      max_winners: sticker.max_winners || 10,
      status: sticker.status || 'active',
      last_piece_rule: sticker.last_piece_rule || 'manual',
      last_piece_min_participations: minPart,
    });
    setStickerModalOpen(true);
  };

  // Salvar Figurinha
  const handleSaveSticker = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const action = stickerForm.id ? 'update' : 'create';
      const res = await fetch('/api/puzzle/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...stickerForm,
          campaign_id: campaign?.id || 1,
          last_piece_rule: stickerForm.last_piece_rule || 'manual',
          last_piece_rule_data: stickerForm.last_piece_rule === 'min_participations'
            ? { min_count: Number(stickerForm.last_piece_min_participations || 5) }
            : null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(data.message || 'Quebra-cabeça salvo com sucesso!');
      setStickerModalOpen(false);
      await reloadData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Excluir Figurinha
  const handleDeleteSticker = async (id, name) => {
    if (
      !confirm(
        `Tem certeza que deseja remover "${name}" do álbum? Todas as peças e registros desta coleção serão excluídos.`
      )
    )
      return;

    try {
      const res = await fetch('/api/puzzle/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Figurinha removida do álbum!');
      setPuzzles(puzzles.filter((p) => p.id !== id));
      if (selectedPreviewPuzzle?.id === id) {
        setSelectedPreviewPuzzle(puzzles.find((p) => p.id !== id) || null);
      }
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Simulação de Abertura de Pacote ao Vivo
  const handleSimulatePack = async () => {
    setSimulating(true);
    try {
      const targetId = selectedPreviewPuzzle?.id || (puzzles[0]?.id ?? null);
      const res = await fetch('/api/puzzle/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_pack',
          puzzle_id: targetId,
          campaign_id: campaign?.id || 1,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSimResult(data.data);
      if (data.stats) setStats(data.stats);
      if (data.recent_drops) setRecentDrops(data.recent_drops);
      showToast('Pacote de teste aberto com sucesso!');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="w-100 pt-2 pb-5">
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
            <h1
              className="page-title mb-0 fs-3 fw-bold text-dark"
              style={{ margin: 0, lineHeight: 1.2 }}
            >
              Quebra-cabeça (Puzzle)
            </h1>
            <span
              className="badge px-2.5 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '11px',
                height: '24px',
                lineHeight: 1,
                alignSelf: 'center',
              }}
            >
              <Sparkles size={12} />
              Coleção & Fidelização
            </span>
          </div>
          <div className="text-muted small mt-1" style={{ fontSize: '12.5px' }}>
            Configure as peças do quebra-cabeça, cupons de 1-clique, probabilidades matemáticas e teto
            diário de segurança.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            href="/puzzle"
            target="_blank"
            className="btn btn-outline-primary shadow-sm d-inline-flex align-items-center gap-1.5"
            style={{ height: '36px', fontSize: '12px', borderRadius: '10px' }}
            title="Abrir tela do comprador para testar"
          >
            <ExternalLink size={14} />
            <span>Ver Tela do Jogador</span>
          </Link>
          <button
            onClick={handleOpenSettings}
            className="btn btn-outline-secondary shadow-sm d-inline-flex align-items-center gap-1.5"
            style={{ height: '36px', fontSize: '12px', borderRadius: '10px' }}
          >
            <Settings size={15} />
            <span>Configurar Quebra-cabeça</span>
          </button>
          <button
            onClick={handleOpenAddSticker}
            className="btn btn-primary shadow-sm d-inline-flex align-items-center gap-1.5"
            style={{ height: '36px', fontSize: '12.5px', borderRadius: '10px' }}
          >
            <Plus size={16} />
            <span>Nova Peça</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 g-lg-4 mb-4">
        {/* Total Drops / Figurinhas Entregues */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 p-3 h-100 puzzle-admin-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span
                className="text-muted small fw-bold text-uppercase"
                style={{ letterSpacing: '0.05em', fontSize: '11px' }}
              >
                Peças Entregues
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                }}
              >
                <Puzzle size={20} />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">
                {stats?.total_drops || recentDrops.length}
              </h3>
              <span className="text-muted small">pacotes abertos</span>
            </div>
          </div>
        </div>

        {/* Colecionadores Únicos */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 p-3 h-100 puzzle-admin-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span
                className="text-muted small fw-bold text-uppercase"
                style={{ letterSpacing: '0.05em', fontSize: '11px' }}
              >
                Colecionadores Únicos
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                }}
              >
                <Users size={20} />
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-0 fs-2">
              {stats?.unique_collectors || (recentDrops.length > 0 ? 1 : 0)}
            </h3>
            <div className="text-success small fw-semibold mt-1">● Compradores engajados</div>
          </div>
        </div>

        {/* Teto Diário de Segurança */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            onClick={handleOpenSettings}
            className="card border shadow-sm rounded-4 p-3 h-100 puzzle-admin-card cursor-pointer"
            style={{ cursor: 'pointer' }}
            title="Clique para editar o teto de segurança"
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span
                className="text-muted small fw-bold text-uppercase"
                style={{ letterSpacing: '0.05em', fontSize: '11px' }}
              >
                Teto Diário de Segurança
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#d97706',
                }}
              >
                <DollarSign size={20} />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-1">
              <h3 className="fw-bold text-dark mb-0 fs-2">
                R$ {Number(campaign?.daily_budget || 2000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="text-warning small fw-semibold mt-1 d-flex align-items-center gap-1">
              <ShieldAlert size={13} />
              Trava de margem ativa
            </div>
          </div>
        </div>

        {/* Figurinhas no Álbum */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 p-3 h-100 puzzle-admin-card">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span
                className="text-muted small fw-bold text-uppercase"
                style={{ letterSpacing: '0.05em', fontSize: '11px' }}
              >
                Peças no Quebra-cabeça
              </span>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                }}
              >
                <Trophy size={20} />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold text-dark mb-0 fs-2">{puzzles.length}</h3>
              <span className="text-muted small">coleções ativas</span>
            </div>
            <div className="text-primary small fw-semibold mt-1">● 9 peças por quebra-cabeça</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Esquerda (Vitrine + Simulador), Direita (Figurinhas & Prêmios) */}
      <div className="row g-4 mb-4">
        {/* Coluna Esquerda: Vitrine do Álbum & Simulador de Pacote */}
        <div className="col-12 col-lg-5">
          <InteractiveAlbumSimulator
            puzzles={puzzles}
            selectedPuzzle={selectedPreviewPuzzle}
            onSelectPuzzle={(pz) => setSelectedPreviewPuzzle(pz)}
            onSimulatePack={handleSimulatePack}
            simResult={simResult}
            simulating={simulating}
            onResetSim={() => setSimResult(null)}
          />
        </div>

        {/* Coluna Direita: Lista de Figurinhas / Prêmios Configurados */}
        <div className="col-12 col-lg-7">
          <div className="card border shadow-sm rounded-4 overflow-hidden puzzle-admin-card h-100">
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 puzzle-admin-card-header">
              <div>
                <h6 className="fw-bold text-dark mb-0 fs-6">Peças & Prêmios do Quebra-cabeça</h6>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  {puzzles.length} peças cadastradas • Probabilidade calculada por peso
                </span>
              </div>
              <button
                onClick={handleOpenAddSticker}
                className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 rounded-3 fw-semibold"
                style={{ fontSize: '12px' }}
              >
                <Plus size={14} />
                <span>Adicionar Peça</span>
              </button>
            </div>

            <div className="p-3 p-lg-4">
              {puzzles.length === 0 ? (
                <div className="py-5 text-center text-muted">
                  <Layers size={40} className="mb-2 opacity-50" />
                  <div className="fw-semibold small">Nenhuma peça cadastrada</div>
                  <div className="small mb-3">
                    Adicione prêmios e peças para que seus clientes comecem a montar o quebra-cabeça.
                  </div>
                  <button
                    onClick={handleOpenAddSticker}
                    className="btn btn-sm btn-primary rounded-3 fw-semibold"
                  >
                    + Criar Primeira Peça
                  </button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {puzzles.map((p, idx) => {
                    const weight = Math.max(1, Number(p.distribution_weight || 10));
                    const percentage =
                      totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : 0;

                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-4 border transition-all hover-shadow-sm puzzle-sticker-item"
                      >
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0 overflow-hidden border"
                              style={{
                                width: '48px',
                                height: '48px',
                                background: '#0f172a',
                                color: '#ffffff',
                                fontSize: '14px',
                              }}
                            >
                              {p.image ? (
                                <img
                                  src={p.image.startsWith('/') || p.image.startsWith('http') ? p.image : `/images/puzzles/${p.image}`}
                                  alt={p.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                `#${idx + 1}`
                              )}
                            </div>
                            <div>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <h6 className="fw-bold text-dark mb-0 fs-6">{p.name}</h6>
                                <span
                                  className={`badge rounded-pill fw-semibold ${
                                    p.status === 'active'
                                      ? 'bg-success-subtle text-success border border-success-subtle'
                                      : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                                  }`}
                                  style={{ fontSize: '10px' }}
                                >
                                  {p.status === 'active' ? 'Ativo' : 'Pausado'}
                                </span>

                                {p.last_piece_rule === 'none' ? (
                                  <span
                                    className="badge rounded-pill fw-semibold bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1"
                                    style={{ fontSize: '10px' }}
                                    title="A peça final pode sair normalmente no sorteio"
                                  >
                                    <Unlock size={10} /> Peça #9: Liberada
                                  </span>
                                ) : p.last_piece_rule === 'min_participations' ? (
                                  <span
                                    className="badge rounded-pill fw-semibold bg-info-subtle text-info border border-info-subtle d-inline-flex align-items-center gap-1"
                                    style={{ fontSize: '10px' }}
                                    title="A peça final só sai após atingir meta de compras"
                                  >
                                    🎯 Peça #9: Condicional
                                  </span>
                                ) : (
                                  <span
                                    className="badge rounded-pill fw-semibold bg-warning-subtle text-dark border border-warning-subtle d-inline-flex align-items-center gap-1"
                                    style={{ fontSize: '10px' }}
                                    title="Peça final bloqueada (somente você decide quando sai)"
                                  >
                                    <Lock size={10} /> Peça #9: Bloqueada (Admin)
                                  </span>
                                )}
                              </div>
                              <div className="text-muted small mt-0.5" style={{ fontSize: '12px' }}>
                                Prêmio: <strong className="text-dark">{p.prize_name}</strong>
                                {Number(p.prize_value || 0) > 0 && (
                                  <span className="ms-1.5 text-success fw-bold">
                                    • R$ {Number(p.prize_value).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleToggleLastPieceRule(p.id, p.last_piece_rule || 'manual')}
                              className={`btn btn-sm ${
                                p.last_piece_rule === 'none'
                                  ? 'btn-outline-warning text-dark border-warning'
                                  : 'btn-outline-success border-success'
                              } rounded-3 px-2.5 py-1 d-inline-flex align-items-center gap-1 flex-shrink-0`}
                              style={{ fontSize: '11px', fontWeight: 700, height: '32px' }}
                              title={
                                p.last_piece_rule === 'none'
                                  ? 'Clique para BLOQUEAR a peça #9'
                                  : 'Clique para LIBERAR a peça #9 agora no sorteio'
                              }
                            >
                              {p.last_piece_rule === 'none' ? (
                                <>
                                  <Lock size={12} /> Bloquear #9
                                </>
                              ) : (
                                <>
                                  <Unlock size={12} /> Liberar #9
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedPreviewPuzzle(p);
                                handleOpenEditSticker(p);
                              }}
                              className="puzzle-sticker-btn"
                              title="Editar quebra-cabeça"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteSticker(p.id, p.name)}
                              className="puzzle-sticker-btn danger"
                              title="Excluir quebra-cabeça"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Barra de Probabilidade Matemática */}
                        <div className="mt-3 pt-2.5 border-top d-flex align-items-center justify-content-between gap-3">
                          <div className="w-100">
                            <div className="d-flex justify-content-between small text-muted mb-1" style={{ fontSize: '11px' }}>
                              <span>Probabilidade no Sorteio: <strong>{percentage}%</strong></span>
                              <span>Peso: <strong>{weight}</strong> ({p.pieces_count || 9} peças)</span>
                            </div>
                            <div className="progress" style={{ height: '6px', borderRadius: '4px' }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${percentage}%`,
                                  background: idx === 0 ? '#f59e0b' : '#10b981',
                                }}
                              ></div>
                            </div>
                          </div>
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

      {/* Seção Inferior: Histórico Recente de Peças Entregues (Auditoria & Resgates) */}
      <div className="card border shadow-sm rounded-4 overflow-hidden puzzle-admin-card mt-4">
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 puzzle-admin-card-header">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
              }}
            >
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0 fs-6">
                Histórico Recente de Resgates & Peças
              </h6>
              <span className="text-muted small" style={{ fontSize: '11px' }}>
                Auditoria em tempo real de cupons entregues e quebra-cabeças completados
              </span>
            </div>
          </div>

          <span className="badge bg-light text-muted border px-2.5 py-1 rounded-pill small">
            Últimos 10 resgates
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '12.5px' }}>
            <thead className="puzzle-drops-table-head text-muted fw-bold" style={{ fontSize: '11px' }}>
              <tr>
                <th className="ps-3 py-3">COLECIONADOR</th>
                <th className="py-3">QUEBRA-CABEÇA / PEÇA</th>
                <th className="py-3">CÓDIGO DO CUPOM</th>
                <th className="py-3">VALOR</th>
                <th className="py-3">DATA</th>
                <th className="pe-3 py-3 text-end">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentDrops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    Nenhum resgate registrado ainda. Abra um pacote de teste no simulador para testar!
                  </td>
                </tr>
              ) : (
                recentDrops.map((drop) => (
                  <tr key={drop.id} className="puzzle-drops-table-row">
                    <td className="ps-3 py-3">
                      <div className="fw-bold text-dark">{drop.customer_name || 'Comprador Anônimo'}</div>
                      <div className="text-muted small" style={{ fontSize: '11px' }}>
                        {drop.customer_email || '—'}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="fw-semibold text-dark">{drop.prize_name}</span>
                      {drop.puzzle_name && (
                        <div className="text-muted small" style={{ fontSize: '11px' }}>
                          {drop.puzzle_name}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <code className="bg-light text-dark px-2 py-0.5 rounded border fw-bold small">
                        {drop.reward_code || 'PZ-PROMO'}
                      </code>
                    </td>
                    <td className="py-3 fw-bold text-success">
                      {Number(drop.prize_value || 0) > 0
                        ? `R$ ${Number(drop.prize_value).toFixed(2)}`
                        : 'Prêmio Especial'}
                    </td>
                    <td className="py-3 text-muted small">
                      {drop.created_at ? new Date(drop.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                    </td>
                    <td className="pe-3 py-3 text-end">
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill fw-bold px-2 py-1">
                        {drop.status === 'delivered' ? 'Entregue' : 'Liberado'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIGURAÇÕES GERAIS DO QUEBRA-CABEÇA                           */}
      {/* ========================================================================= */}
      {settingsModalOpen && (
        <div
          className="uf-modal-backdrop"
          onClick={() => setSettingsModalOpen(false)}
        >
          <div
            className="uf-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '1020px' }}
          >
            <div className="uf-modal-header">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '42px',
                    height: '42px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <Settings size={20} />
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark fs-5 mb-0">Configurações do Quebra-cabeça</h5>
                  <span className="text-muted small" style={{ fontSize: '12.5px' }}>
                    Configure as regras do jogo e a segunda tela de upsell/bônus
                  </span>
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
                ⚙️ Regras do Jogo
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

            <form onSubmit={handleSaveSettings} className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
              <div className="uf-modal-body-scrollable p-4 p-md-5 overflow-y-auto flex-grow-1" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
                {activeSettingsTab === 'geral' ? (
                  <>
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                        Nome da Campanha
                      </label>
                      <input
                        type="text"
                        required
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                        className="form-control rounded-3"
                        style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                        placeholder="Ex: Quebra-cabeça Premiado dos Sonhos"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                        Descrição Promocional
                      </label>
                      <textarea
                        rows={3}
                        value={campaignForm.description}
                        onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                        className="form-control rounded-3"
                        style={{ fontSize: '14px', padding: '12px 16px', lineHeight: 1.5 }}
                        placeholder="Texto que convida o comprador a abrir pacotes e montar o quebra-cabeça..."
                      />
                    </div>

                    <div className="row g-4 mb-4">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                          Teto Diário de Segurança (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={campaignForm.daily_budget}
                          onChange={(e) =>
                            setCampaignForm({ ...campaignForm, daily_budget: e.target.value })
                          }
                          className="form-control rounded-3"
                          style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                        />
                        <span className="text-muted small d-block mt-2" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                          Pausa prêmios caros caso o teto diário seja excedido.
                        </span>
                      </div>

                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                          Status da Campanha
                        </label>
                        <select
                          value={campaignForm.status}
                          onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}
                          className="form-select rounded-3"
                          style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                        >
                          <option value="active">🟢 Ativa e Disponível</option>
                          <option value="paused">🟡 Pausada</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="alert alert-light border d-flex align-items-center gap-3 mb-4 p-3.5 rounded-3">
                      <Sparkles size={18} className="text-warning flex-shrink-0" />
                      <div className="small text-muted" style={{ fontSize: '12.5px', lineHeight: 1.45 }}>
                        Esta tela de alta conversão é exibida imediatamente após o jogador encaixar a última peça do quebra-cabeça e clicar em <strong>"PEGAR MEU BÔNUS AGORA"</strong>.
                      </div>
                    </div>
                    <OfferConfigForm config={offerConfig} onChange={setOfferConfig} />
                  </div>
                )}
              </div>

              <div className="uf-modal-footer">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="uf-btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="uf-btn-save"
                >
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADICIONAR / EDITAR PEÇA E PRÊMIO                                 */}
      {/* ========================================================================= */}
      {stickerModalOpen && (
        <div
          className="uf-modal-backdrop"
          onClick={() => setStickerModalOpen(false)}
        >
          <div
            className="uf-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '720px' }}
          >
            <div className="uf-modal-header">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '42px',
                    height: '42px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <Puzzle size={20} />
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark fs-5 mb-0">
                    {stickerForm.id ? 'Editar Peça / Prêmio' : 'Nova Peça / Prêmio no Quebra-cabeça'}
                  </h5>
                  <span className="text-muted small" style={{ fontSize: '12.5px' }}>
                    Defina o prêmio, imagem e probabilidade matemática da peça
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="uf-modal-close-btn"
                onClick={() => setStickerModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSticker} className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
              <div className="uf-modal-body-scrollable p-4 p-md-5 overflow-y-auto flex-grow-1" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
                {/* 1. Nome e Status */}
                <div className="row g-4 mb-4">
                  <div className="col-12 col-sm-8">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                      Nome do Quebra-cabeça / Coleção
                    </label>
                    <input
                      type="text"
                      required
                      value={stickerForm.name}
                      onChange={(e) => setStickerForm({ ...stickerForm, name: e.target.value })}
                      className="form-control rounded-3"
                      style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                      placeholder="Ex: Moto Yamaha MT-03 ou iPhone 17 Pro"
                    />
                  </div>
                  <div className="col-12 col-sm-4">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                      Status da Coleção
                    </label>
                    <select
                      value={stickerForm.status}
                      onChange={(e) => setStickerForm({ ...stickerForm, status: e.target.value })}
                      className="form-select rounded-3"
                      style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                    >
                      <option value="active">🟢 Ativa e Disponível</option>
                      <option value="inactive">🔴 Pausada</option>
                    </select>
                  </div>
                </div>

                {/* 2. Foto que será Dividida no Quebra-Cabeça (Upload + URL + Preview) */}
                <div className="uf-modal-section-card mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label small fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                      <ImageIcon size={16} className="text-primary" />
                      Foto do Quebra-Cabeça (Dividida em 9 Peças)
                    </label>
                    {uploadingImage && (
                      <span className="badge bg-primary-subtle text-primary small">
                        Enviando foto...
                      </span>
                    )}
                  </div>
                  <span className="text-muted small d-block mb-3" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                    Suba a foto real do prêmio (ex: moto, carro, celular). O sistema fatia automaticamente em 9 peças de quebra-cabeça com encaixes perfeitos.
                  </span>

                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-8">
                      <div className="d-flex gap-2">
                        <input
                          type="text"
                          value={stickerForm.image}
                          onChange={(e) => setStickerForm({ ...stickerForm, image: e.target.value })}
                          className="form-control rounded-3"
                          style={{ height: '46px', fontSize: '13.5px', padding: '10px 14px' }}
                          placeholder="Cole a URL ou suba uma imagem..."
                        />
                        <label
                          className="btn btn-primary rounded-3 d-inline-flex align-items-center gap-1.5 flex-shrink-0"
                          style={{ height: '46px', padding: '0 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          <Upload size={16} />
                          <span>{uploadingImage ? 'Enviando...' : 'Subir Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={uploadingImage}
                            onChange={handleUploadStickerPhoto}
                          />
                        </label>
                      </div>

                      {/* Presets Rápidos */}
                      <div className="d-flex align-items-center gap-1.5 flex-wrap mt-2.5">
                        <span className="text-muted small me-1" style={{ fontSize: '11px' }}>Pré-definidos:</span>
                        {availableImages.map((img) => (
                          <button
                            key={img.file}
                            type="button"
                            onClick={() => setStickerForm({ ...stickerForm, image: img.file })}
                            className={`btn btn-xs rounded-pill px-2.5 py-0.5 border ${
                              stickerForm.image === img.file
                                ? 'btn-primary text-white'
                                : 'btn-light text-secondary'
                            }`}
                            style={{ fontSize: '11px' }}
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview visual do Quebra-Cabeça fatiado */}
                    <div className="col-12 col-md-4 text-center">
                      <div
                        className="p-2 rounded-3 border d-flex flex-column align-items-center justify-content-center mx-auto"
                        style={{
                          width: '150px',
                          background: '#090d16',
                          borderColor: '#1e293b',
                        }}
                      >
                        <JigsawPuzzleBoard
                          collectedPieces={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                          isCompleted={true}
                          imageUrl={
                            stickerForm.image?.startsWith('/') || stickerForm.image?.startsWith('http')
                              ? stickerForm.image
                              : stickerForm.image
                              ? `/images/puzzles/${stickerForm.image}`
                              : null
                          }
                          size={130}
                        />
                        <span className="text-muted small mt-1" style={{ fontSize: '10px' }}>
                          Preview do corte 3x3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Prêmio e Valor */}
                <div className="row g-4 mb-4">
                  <div className="col-12 col-sm-8">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                      Nome do Prêmio ao Completar o Quebra-Cabeça
                    </label>
                    <input
                      type="text"
                      required
                      value={stickerForm.prize_name}
                      onChange={(e) =>
                        setStickerForm({ ...stickerForm, prize_name: e.target.value })
                      }
                      className="form-control rounded-3"
                      style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                      placeholder="Ex: Moto Yamaha MT-03 0KM ou 1x iPhone 17 Pro"
                    />
                  </div>
                  <div className="col-12 col-sm-4">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                      Valor Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={stickerForm.prize_value}
                      onChange={(e) =>
                        setStickerForm({ ...stickerForm, prize_value: e.target.value })
                      }
                      className="form-control rounded-3"
                      style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                    />
                  </div>
                </div>

                {/* 4. SEÇÃO CRÍTICA: REGRA DA PEÇA FINAL (#9 - O PRÊMIO) */}
                <div className="uf-modal-highlight-card mb-4">
                  <div className="d-flex align-items-center gap-2.5 mb-2">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', background: '#f59e0b', color: '#ffffff' }}
                    >
                      <Lock size={16} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0 fs-6">
                        Regra da Peça Final (#9) — O Gatilho do Prêmio
                      </h6>
                      <span className="text-muted small" style={{ fontSize: '12px' }}>
                        Controle total de quando o cliente completa a imagem e ganha o prêmio
                      </span>
                    </div>
                  </div>

                  <div className="my-3">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                      Modo de Liberação da Peça #9
                    </label>
                    <select
                      value={stickerForm.last_piece_rule}
                      onChange={(e) =>
                        setStickerForm({ ...stickerForm, last_piece_rule: e.target.value })
                      }
                      className="form-select rounded-3"
                      style={{ height: '48px', fontSize: '14px', padding: '11px 16px', fontWeight: 600 }}
                    >
                      <option value="manual">
                        🔒 Bloqueada (Somente liberação manual pelo Admin — Nunca sai por sorteio)
                      </option>
                      <option value="min_participations">
                        🎯 Liberar após X compras/jogadas do cliente (Gatilho de fidelidade)
                      </option>
                      <option value="none">
                        🎲 Liberada normalmente no sorteio aleatório
                      </option>
                    </select>
                  </div>

                  {stickerForm.last_piece_rule === 'min_participations' && (
                    <div className="uf-modal-section-card p-3 mb-3">
                      <label className="form-label small fw-bold text-dark mb-1.5 d-block" style={{ fontSize: '12.5px' }}>
                        Quantidade Mínima de Compras/Jogadas para Liberar a Peça #9:
                      </label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={stickerForm.last_piece_min_participations}
                          onChange={(e) =>
                            setStickerForm({
                              ...stickerForm,
                              last_piece_min_participations: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="form-control rounded-3"
                          style={{ width: '120px', height: '42px', fontSize: '14px' }}
                        />
                        <span className="text-muted small" style={{ fontSize: '12px' }}>
                          O cliente ganha as peças 1 a 8, e a peça #9 só sai na {stickerForm.last_piece_min_participations}ª compra.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="small text-muted d-flex align-items-start gap-2 pt-1" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                    <Sparkles size={15} className="text-warning flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Mecânica de Retenção Ativa:</strong> As peças 1 a 8 saem nas jogadas iniciais para manter o cliente engajado e querendo comprar mais para completar o álbum. A peça #9 fica retida com segurança sob a regra escolhida acima.
                    </span>
                  </div>
                </div>

                {/* 5. Peso, Total de Peças e Limites */}
                <div className="row g-4 mb-2">
                  <div className="col-12 col-sm-4">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                      Peso de Distribuição
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={stickerForm.distribution_weight}
                      onChange={(e) =>
                        setStickerForm({ ...stickerForm, distribution_weight: e.target.value })
                      }
                      className="form-control rounded-3"
                      style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                    />
                    <span className="text-muted small d-block mt-2" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                      Quanto maior o peso, maior a chance.
                    </span>
                  </div>

                  <div className="col-12 col-sm-4">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                      Total de Peças
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="16"
                      value={stickerForm.pieces_count}
                      onChange={(e) =>
                        setStickerForm({ ...stickerForm, pieces_count: e.target.value })
                      }
                      className="form-control rounded-3"
                      style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                    />
                    <span className="text-muted small d-block mt-2" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                      Padrão recomendado: 9 peças (3x3).
                    </span>
                  </div>

                  <div className="col-12 col-sm-4">
                    <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
                      Máximo de Ganhadores
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={stickerForm.max_winners || 10}
                      onChange={(e) =>
                        setStickerForm({ ...stickerForm, max_winners: e.target.value })
                      }
                      className="form-control rounded-3"
                      style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                    />
                    <span className="text-muted small d-block mt-2" style={{ fontSize: '12px', lineHeight: 1.45 }}>
                      Limite de resgates premiados.
                    </span>
                  </div>
                </div>
              </div>

              <div className="uf-modal-footer">
                <button
                  type="button"
                  onClick={() => setStickerModalOpen(false)}
                  className="uf-btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="uf-btn-save"
                >
                  {loading ? 'Salvando...' : 'Salvar Peça'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
