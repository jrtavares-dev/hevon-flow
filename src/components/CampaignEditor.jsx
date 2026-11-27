'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  Layers,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  Tag,
  Sparkles,
  Clock,
  Flame,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Shuffle,
  Save,
  Check,
  Tv,
  Activity,
  DollarSign,
  ShieldAlert,
  PhoneCall,
  Video,
  Gift,
  Palette,
  Volume2,
  User,
  Smartphone,
  Code2,
} from 'lucide-react';
import VideoCallOfferView, { DEFAULT_VIDEOCALL_CONFIG } from '@/components/VideoCallOfferView';
import OfferView from '@/components/OfferView';

function createDefaultLevel(campaignId = 0, order = 1, template = 'videocall') {
  if (template === 'videocall') {
    return {
      id: 0,
      campaign_id: campaignId,
      name: 'Oferta Chamada de Vídeo',
      internal_name: `Etapa ${order} (Chamada de Vídeo)`,
      level_order: order,
      enabled: 1,
      theme_name: 'videocall',
      headline: 'Achou a premiada comprando por aqui?',
      subheadline: 'Você leva o super bônus junto do prêmio.',
      cta_text: 'GARANTIR AGORA',
      badge: 'PRÓXIMA RASPADINHA DA MOTO',
      progress_value: 86,
      price: 20.0,
      original_price: 97.0,
      timer_enabled: 1,
      timer_duration: 180,
      social_proof_enabled: 0,
      social_proof_text: '{name} de {city} acabou de garantir +50 cotas!',
      exit_intent_enabled: 0,
      exit_intent_title: 'ESPERE! Liberei um desconto secreto exclusivo para você:',
      exit_intent_discount_price: 14.9,
      exit_intent_cta_text: 'SIM! QUERO APROVEITAR COM ESSE DESCONTO',
      ab_testing_enabled: 0,
      ab_variant_b_headline: '',
      ab_variant_b_price: '',
      ab_variant_b_video: '',
      video:
        'https://midia.dxhost.com.br/media/01a0deef-957a-78d8-9792-286bb12567e5/37d01e0fc10e08485b7268bb3e045bdd297faf77fa77fc986f7dad8115f6181f.mp4',
      image: '/uploads/images/img_1793306564746_lkt5pk.jpg',
      external_checkout_url: '',
      benefits: {
        ...DEFAULT_VIDEOCALL_CONFIG,
        caller_name: 'Cherminho',
        caller_handle: '@cherminhopremiacoes',
        caller_avatar: '/uploads/images/img_1793306564746_lkt5pk.jpg',
        call_visitor_name: 'FULANO',
        offer_template: 'videocall',
      },
    };
  }

  return {
    id: 0,
    campaign_id: campaignId,
    name: '15 IPHONE 17 PRO MAX + 10 BOOMBOX 4 OU R$120 MIL 🤩',
    internal_name: `Etapa ${order} (Oferta VSL)`,
    level_order: order,
    enabled: 1,
    theme_name: 'green',
    headline: 'EI, ESPERE! Oferta Especial Exclusiva',
    subheadline: 'Aproveite esta condição única e exclusiva adicionando ao seu pedido com apenas 1 clique.',
    cta_text: 'SIM! QUERO APROVEITAR ESSA OFERTA',
    badge: 'PRÊMIO PRINCIPAL',
    progress_value: 86,
    price: 97.0,
    original_price: 197.0,
    timer_enabled: 1,
    timer_duration: 300,
    social_proof_enabled: 1,
    social_proof_text: '{name} de {city} acabou de garantir +50 cotas!',
    exit_intent_enabled: 1,
    exit_intent_title: 'ESPERE! Liberei um desconto secreto exclusivo para você:',
    exit_intent_discount_price: 63.05,
    exit_intent_cta_text: 'SIM! QUERO APROVEITAR COM ESSE DESCONTO',
    ab_testing_enabled: 0,
    ab_variant_b_headline: '',
    ab_variant_b_price: '',
    ab_variant_b_video: '',
    video: '',
    image: '/uploads/images/img_1793306564746_lkt5pk.jpg',
    external_checkout_url: '',
    benefits: {
      offer_template: 'classic',
      eyebrow_text: 'OFERTA ESPECIAL',
      luck_badge: '⚡ MÁXIMO DE SORTE ATIVADO',
      live_badge: 'AO VIVO',
      progress_title: 'Sua chance de achar uma cota premiada',
      progress_desc: 'Por esta página, achar cota premiada está muito mais provável.',
      cta_subtext: 'Aproveite a condição especial, MUITO MAIOR',
      decline_text: 'Não, obrigado. Quero recusar esta oferta.',
    },
  };
}

export default function CampaignEditor({ initialCampaign = null, initialLevels = [], isCreate = false }) {
  const router = useRouter();

  const [campaign, setCampaign] = useState(
    initialCampaign || {
      id: 0,
      name: '',
      slug: '',
      status: 'active',
      description: '',
      final_redirect_url: '',
      created_at: new Date().toISOString().slice(0, 16),
      start_at: '',
      end_at: '',
      meta_pixel_id: '',
      ga4_measurement_id: '',
      gtm_id: '',
    }
  );

  const [levels, setLevels] = useState(
    initialLevels && initialLevels.length > 0
      ? initialLevels
      : [createDefaultLevel(initialCampaign?.id || 0, 1, 'videocall')]
  );

  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('setup');
  const [vcPreviewStage, setVcPreviewStage] = useState('call'); // 'call' | 'video' | 'offer' | 'redirect'
  const [showAdvancedSetup, setShowAdvancedSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingField, setUploadingField] = useState(null);

  const currentLevel = levels[activeLevelIndex] || levels[0] || {};

  const getLevelBenefits = (lvl) => {
    if (!lvl) return {};
    if (typeof lvl.benefits === 'object' && lvl.benefits !== null) return lvl.benefits;
    if (typeof lvl.benefits === 'string' && lvl.benefits.trim()) {
      try {
        return JSON.parse(lvl.benefits);
      } catch {
        return {};
      }
    }
    return {};
  };

  const currentBenefits = getLevelBenefits(currentLevel);
  const isVideoCallTemplate =
    currentBenefits.offer_template === 'videocall' || currentLevel.theme_name === 'videocall';

  const handleUpdateCurrentLevel = (field, value) => {
    setLevels((prev) => {
      const copy = [...prev];
      const lvl = copy[activeLevelIndex] || {};
      const currentB = getLevelBenefits(lvl);
      const updatedLevel = { ...lvl, [field]: value };
      if (field === 'external_checkout_url') {
        updatedLevel.benefits = { ...currentB, external_checkout_url: value };
      }
      copy[activeLevelIndex] = updatedLevel;
      return copy;
    });
  };

  const handleUpdateBenefit = (key, value) => {
    setLevels((prev) => {
      const copy = [...prev];
      const lvl = copy[activeLevelIndex] || {};
      const currentB = getLevelBenefits(lvl);
      const updatedLevel = {
        ...lvl,
        benefits: { ...currentB, [key]: value },
      };
      if (key === 'external_checkout_url') {
        updatedLevel.external_checkout_url = value;
      }
      copy[activeLevelIndex] = updatedLevel;
      return copy;
    });
  };

  const handleUpdateMultipleBenefits = (updatesObj, levelFieldUpdates = {}) => {
    setLevels((prev) => {
      const copy = [...prev];
      const lvl = copy[activeLevelIndex] || {};
      const currentB = getLevelBenefits(lvl);
      copy[activeLevelIndex] = {
        ...lvl,
        ...levelFieldUpdates,
        benefits: { ...currentB, ...updatesObj },
      };
      return copy;
    });
  };

  const handleApplyRaspVipPreset = () => {
    handleUpdateMultipleBenefits(
      {
        ...DEFAULT_VIDEOCALL_CONFIG,
        caller_name: 'Cherminho',
        caller_handle: '@cherminhopremiacoes',
        caller_avatar: '/uploads/images/img_1793306564746_lkt5pk.jpg',
        call_visitor_name: 'FULANO',
        offer_template: 'videocall',
      },
      {
        theme_name: 'videocall',
        image: '/uploads/images/img_1793306564746_lkt5pk.jpg',
        video:
          'https://midia.dxhost.com.br/media/01a0deef-957a-78d8-9792-286bb12567e5/37d01e0fc10e08485b7268bb3e045bdd297faf77fa77fc986f7dad8115f6181f.mp4',
        cta_text: 'GARANTIR AGORA',
        timer_enabled: 1,
        timer_duration: 180,
      }
    );
  };

  const handleAddLevel = async () => {
    const nextOrder = levels.length + 1;
    const newLvl = createDefaultLevel(campaign.id || 0, nextOrder, isVideoCallTemplate ? 'videocall' : 'classic');

    if (campaign.id && campaign.id > 0) {
      try {
        const res = await fetch(`/api/admin/campaigns/${campaign.id}/levels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLvl),
        });
        const data = await res.json();
        if (data.success && data.id) {
          setLevels([...levels, { ...newLvl, id: data.id }]);
          setActiveLevelIndex(levels.length);
          return;
        }
      } catch {
        // fallback local
      }
    }

    setLevels([...levels, { ...newLvl, id: 0 }]);
    setActiveLevelIndex(levels.length);
  };

  const handleDeleteCurrentLevel = async () => {
    if (levels.length <= 1) {
      alert('A campanha precisa ter pelo menos uma etapa.');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir esta etapa do funil?')) return;

    const levelToDelete = levels[activeLevelIndex];
    if (campaign.id && levelToDelete.id && levelToDelete.id > 0) {
      try {
        await fetch(`/api/admin/campaigns/${campaign.id}/levels/${levelToDelete.id}`, {
          method: 'DELETE',
        });
      } catch {
        // ignore
      }
    }

    const filtered = levels.filter((_, idx) => idx !== activeLevelIndex);
    setLevels(filtered);
    setActiveLevelIndex(Math.max(0, activeLevelIndex - 1));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingField(field);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', field === 'video' ? 'videos' : 'images');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (field === 'caller_avatar') {
          handleUpdateMultipleBenefits({ caller_avatar: data.url }, { image: data.url });
        } else {
          handleUpdateCurrentLevel(field, data.url);
        }
      } else {
        alert(data.message || 'Erro ao enviar arquivo.');
      }
    } catch {
      alert('Erro de conexão ao enviar arquivo.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveAll = async (e, saveAndClose = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!campaign.name || !campaign.name.trim()) {
      setErrorMsg('Por favor, preencha o Nome da Campanha na aba "1. Campanha & Modelo".');
      setActiveTab('setup');
      return;
    }

    setLoading(true);
    setSavedSuccess('');
    setErrorMsg('');

    try {
      let targetCampaignId = campaign.id;

      // 1. Create or Update Campaign
      if (!targetCampaignId || targetCampaignId === 0) {
        const res = await fetch('/api/admin/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...campaign, skip_default_level: true }),
        });
        const data = await res.json();
        if (!res.ok || !data.success || !data.id) {
          setErrorMsg(data.message || 'Erro ao criar a campanha.');
          setLoading(false);
          return;
        }
        targetCampaignId = data.id;
        setCampaign((prev) => ({ ...prev, id: targetCampaignId }));
      } else {
        await fetch(`/api/admin/campaigns/${targetCampaignId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaign),
        });
      }

      // 2. Save all levels
      if (levels && levels.length > 0) {
        const updatedLevels = await Promise.all(
          levels.map(async (lvl) => {
            if (lvl.id && lvl.id > 0) {
              await fetch(`/api/admin/campaigns/${targetCampaignId}/levels/${lvl.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lvl),
              });
              return lvl;
            } else {
              const res = await fetch(`/api/admin/campaigns/${targetCampaignId}/levels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...lvl, campaign_id: targetCampaignId }),
              });
              const data = await res.json();
              if (data.success && data.id) {
                return { ...lvl, id: data.id, campaign_id: targetCampaignId };
              }
              return lvl;
            }
          })
        );
        setLevels(updatedLevels);
      }

      setSavedSuccess(isCreate ? 'Campanha criada e publicada com sucesso!' : 'Alterações salvas com sucesso!');

      if (saveAndClose) {
        router.push('/admin/campaigns');
      } else if (isCreate && targetCampaignId) {
        router.push(`/admin/campaigns/edit/${targetCampaignId}`);
      } else {
        router.refresh();
      }
      setTimeout(() => setSavedSuccess(''), 4000);
    } catch {
      setErrorMsg('Erro de conexão ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  // Tab Definitions based on selected template
  const editorTabs = isVideoCallTemplate
    ? [
      { id: 'setup', label: '1. Campanha & Modelo', icon: Settings, color: '#10b981' },
      { id: 'vc_call', label: '2. Tela 1: Ligação', icon: PhoneCall, color: '#e11d48', stage: 'call' },
      { id: 'vc_video', label: '3. Tela 2: Vídeo', icon: Video, color: '#dc2626', stage: 'video' },
      { id: 'vc_offer', label: '4. Tela 3: Oferta & Bônus', icon: Gift, color: '#d97706', stage: 'offer' },
      { id: 'vc_colors', label: '5. Cores & Estilo', icon: Palette, color: '#059669' },
      { id: 'pixels', label: '6. Pixels & Datas', icon: Code2, color: '#10b981' },
    ]
    : [
      { id: 'setup', label: '1. Campanha & Modelo', icon: Settings, color: '#10b981' },
      { id: 'content', label: '2. Vídeo & Textos', icon: Tv, color: '#059669' },
      { id: 'probability', label: '3. Sorte & Prêmio', icon: Activity, color: '#d97706' },
      { id: 'pricing', label: '4. Preço & Botão CTA', icon: DollarSign, color: '#16a34a' },
      { id: 'exit', label: '5. Pop-up & Prova Social', icon: ShieldAlert, color: '#dc2626' },
      { id: 'pixels', label: '6. Pixels & Datas', icon: Code2, color: '#10b981' },
    ];

  const currentTabIndex = editorTabs.findIndex((t) => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? editorTabs[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex >= 0 && currentTabIndex < editorTabs.length - 1 ? editorTabs[currentTabIndex + 1] : null;

  const selectTab = (tab) => {
    setActiveTab(tab.id);
    if (tab.stage) {
      setVcPreviewStage(tab.stage);
    }
  };

  const campaignUrl = campaign.slug ? `/o/${campaign.slug}` : null;

  return (
    <>
      {/* TOP HEADER (Idêntico ao Editor Visual de Presells) */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Link href="/admin/campaigns" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
              <ArrowLeft size={14} /> Voltar
            </Link>
            <h1 className="h3 fw-bold text-dark mb-0">
              {isCreate && !campaign.id ? 'Criar Nova Campanha' : `Editar Campanha: ${campaign.name || 'Sem Nome'}`}
            </h1>
            <span
              className="badge rounded-pill"
              style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', fontWeight: 600 }}
            >
              Editor Visual
            </span>
          </div>
          <div className="text-muted small mt-1">
            Configure a experiência passo a passo nas abas abaixo e acompanhe o resultado ao vivo no celular à direita.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0 flex-shrink-0">
          {campaignUrl && (
            <a
              href={campaignUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-outline-primary shadow-sm d-inline-flex align-items-center gap-1.5"
              title="Abrir funil ao vivo em nova aba"
            >
              <ExternalLink size={14} />
              <span>Abrir Funil</span>
            </a>
          )}
          <button
            type="button"
            onClick={(e) => handleSaveAll(e, true)}
            className="btn btn-sm btn-secondary shadow-sm d-inline-flex align-items-center gap-1.5"
            disabled={loading}
          >
            <ArrowLeft size={14} />
            <span>Salvar e Voltar</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleSaveAll(e, false)}
            className="btn btn-sm btn-primary shadow-sm px-3 d-inline-flex align-items-center gap-1.5 fw-bold"
            disabled={loading}
          >
            <Save size={14} />
            <span>{loading ? 'Salvando...' : isCreate && !campaign.id ? 'Publicar Campanha' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {savedSuccess && (
        <div
          className="alert alert-success alert-dismissible fade show rounded-4 shadow-sm border-0 d-flex align-items-center mb-4 p-3"
          role="alert"
        >
          <CheckCircle2 size={20} className="text-success me-2 flex-shrink-0" />
          <div className="fw-semibold small">{savedSuccess}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setSavedSuccess('')} />
        </div>
      )}

      {errorMsg && (
        <div
          className="alert alert-danger alert-dismissible fade show rounded-4 shadow-sm border-0 d-flex align-items-center mb-4 p-3"
          role="alert"
        >
          <AlertCircle size={20} className="text-danger me-2 flex-shrink-0" />
          <div className="fw-semibold small">{errorMsg}</div>
          <button type="button" className="btn-close ms-auto" onClick={() => setErrorMsg('')} />
        </div>
      )}

      <div className="row g-4">
        {/* =====================================================================
            COLUNA ESQUERDA: EDITOR EM ABAS PASSO A PASSO (col-xl-7)
           ===================================================================== */}
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm border rounded-4 mb-4 overflow-hidden">
            {/* BARRA DE ABAS NUMERADAS NO TOPO DO CARD */}
            <div className="p-2 border-bottom" style={{ background: 'var(--surface-subtle)' }}>
              <div
                className="d-flex align-items-center gap-1 overflow-x-auto"
                style={{ scrollbarWidth: 'none', padding: '2px' }}
                role="tablist"
              >
                {editorTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => selectTab(tab)}
                      className="btn btn-sm d-inline-flex align-items-center gap-1.5 text-nowrap rounded-3 px-3 py-1.5 fw-semibold border-0"
                      style={{
                        fontSize: '12.5px',
                        background: isActive ? 'var(--surface-card)' : 'transparent',
                        color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                        boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--border-subtle)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={14} style={{ color: isActive ? 'var(--brand-primary, #10b981)' : 'var(--text-dim)' }} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BARRA DISCRETA DE ETAPAS DO FUNIL (Se houver múltiplas etapas ou quiser adicionar) */}
            <div
              className="px-4 py-2 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2"
              style={{ background: 'var(--surface-hover)' }}
            >
              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                <span className="small text-muted fw-semibold me-1 d-inline-flex align-items-center gap-1">
                  <Layers size={13} /> Etapas:
                </span>
                {levels.map((lvl, index) => (
                  <button
                    type="button"
                    key={lvl.id || index}
                    onClick={() => setActiveLevelIndex(index)}
                    className={`btn btn-sm rounded-pill px-2.5 py-1 fw-semibold ${index === activeLevelIndex ? 'btn-primary shadow-sm' : 'btn-outline-secondary border-0'
                      }`}
                    style={{ fontSize: '11.5px' }}
                  >
                    {lvl.internal_name || `Etapa ${index + 1}`}
                  </button>
                ))}
              </div>
              <div className="d-flex align-items-center gap-1.5">
                {levels.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDeleteCurrentLevel}
                    className="btn btn-sm btn-outline-danger py-1 px-2 d-inline-flex align-items-center gap-1"
                    style={{ fontSize: '11px' }}
                  >
                    <Trash2 size={12} /> Excluir Etapa
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddLevel}
                  className="btn btn-sm btn-outline-primary py-1 px-2.5 d-inline-flex align-items-center gap-1 fw-semibold"
                  style={{ fontSize: '11.5px' }}
                >
                  <Plus size={12} /> Nova Etapa
                </button>
              </div>
            </div>

            <div className="card-body p-4">
              {/* =========================================================
                  ABA 1: IDENTIFICAÇÃO DA CAMPANHA & MODELO
                 ========================================================= */}
              {activeTab === 'setup' && (
                <div>
                  {/* Passo 1: Escolha do Modelo */}
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <Sparkles size={16} className="text-primary" />
                        <span>1. Escolha o Estilo da sua Oferta</span>
                      </h6>
                      <p className="uf-section-desc">
                        Selecione a experiência interativa que o visitante terá no celular.
                      </p>
                    </div>
                    {isVideoCallTemplate && (
                      <button
                        type="button"
                        onClick={handleApplyRaspVipPreset}
                        className="btn btn-sm btn-outline-danger py-1 px-2.5 d-inline-flex align-items-center gap-1 fw-semibold"
                        style={{ fontSize: '11.5px' }}
                      >
                        <PhoneCall size={12} /> Restaurar Padrão
                      </button>
                    )}
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          const hasVcDefaults = Boolean(currentBenefits.caller_name);
                          if (!hasVcDefaults) {
                            handleApplyRaspVipPreset();
                          } else {
                            handleUpdateMultipleBenefits({ offer_template: 'videocall' }, { theme_name: 'videocall' });
                          }
                        }}
                        className="uf-form-block h-100 transition-all"
                        style={{
                          cursor: 'pointer',
                          borderColor: isVideoCallTemplate ? '#ff1030' : 'var(--border-subtle)',
                          borderWidth: isVideoCallTemplate ? '2px' : '1px',
                          background: isVideoCallTemplate ? 'rgba(255, 16, 48, 0.06)' : 'var(--surface-subtle)',
                        }}
                      >
                        <div className="d-flex align-items-start gap-2.5">
                          <div className="p-2.5 rounded-3 bg-danger text-white flex-shrink-0">
                            <PhoneCall size={20} />
                          </div>
                          <div>
                            <div className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                              Chamada de Vídeo + Bônus
                              <span className="badge bg-danger text-white" style={{ fontSize: '10px' }}>
                                MAIS CONVERTE
                              </span>
                            </div>
                            <div className="text-muted mt-1" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                              Recebe ligação ao vivo com foto e som → Toca vídeo vertical → Abre oferta do Super Bônus com relógio.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          handleUpdateMultipleBenefits(
                            {
                              offer_template: 'classic',
                              eyebrow_text: currentBenefits.eyebrow_text || 'OFERTA ESPECIAL',
                              luck_badge: currentBenefits.luck_badge || '⚡ MÁXIMO DE SORTE ATIVADO',
                              live_badge: currentBenefits.live_badge || 'AO VIVO',
                              progress_title: currentBenefits.progress_title || 'Sua chance de achar uma cota premiada',
                              progress_desc: currentBenefits.progress_desc || 'Por esta página, achar cota premiada está muito mais provável.',
                              cta_subtext: currentBenefits.cta_subtext || 'Aproveite a condição especial, MUITO MAIOR',
                              decline_text: currentBenefits.decline_text || 'Não, obrigado. Quero recusar esta oferta.',
                            },
                            {
                              theme_name: 'green',
                              video:
                                currentLevel.video ===
                                'https://midia.dxhost.com.br/media/01a0deef-957a-78d8-9792-286bb12567e5/37d01e0fc10e08485b7268bb3e045bdd297faf77fa77fc986f7dad8115f6181f.mp4'
                                  ? ''
                                  : (currentLevel.video || ''),
                              headline:
                                !currentLevel.headline || currentLevel.headline === 'Achou a premiada comprando por aqui?'
                                  ? 'EI, ESPERE! Oferta Especial Exclusiva'
                                  : currentLevel.headline,
                              subheadline:
                                !currentLevel.subheadline || currentLevel.subheadline === 'Você leva o super bônus junto do prêmio.'
                                  ? 'Aproveite esta condição única e exclusiva adicionando ao seu pedido com apenas 1 clique.'
                                  : currentLevel.subheadline,
                              cta_text:
                                !currentLevel.cta_text || currentLevel.cta_text === 'GARANTIR AGORA'
                                  ? 'SIM! QUERO APROVEITAR ESSA OFERTA'
                                  : currentLevel.cta_text,
                            }
                          );
                        }}
                        className="uf-form-block h-100 transition-all"
                        style={{
                          cursor: 'pointer',
                          borderColor: !isVideoCallTemplate ? '#10b981' : 'var(--border-subtle)',
                          borderWidth: !isVideoCallTemplate ? '2px' : '1px',
                          background: !isVideoCallTemplate ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-subtle)',
                        }}
                      >
                        <div className="d-flex align-items-start gap-2.5">
                          <div className="p-2.5 rounded-3 bg-primary text-white flex-shrink-0">
                            <Tv size={20} />
                          </div>
                          <div>
                            <div className="fw-bold small" style={{ color: 'var(--text-main)' }}>Oferta Clássica (VSL + Termômetro)</div>
                            <div className="text-muted mt-1" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                              Página única com vídeo no topo, barra de probabilidade de sorte, card de prêmio e botão fixo.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passo 2: Dados Básicos Essenciais */}
                  <div className="uf-section-header mt-4">
                    <div>
                      <h6 className="uf-section-title">
                        <span>2. Dados Principais da Oferta</span>
                      </h6>
                      <p className="uf-section-desc">
                        Defina o nome da sua campanha e o link onde o cliente concluirá a compra.
                      </p>
                    </div>
                  </div>

                  <div className="uf-form-block mb-3">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="uf-form-label mb-0">Nome da sua Campanha</label>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10px' }}>Obrigatório</span>
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Ex: Campanha Cherminho WhatsApp"
                        value={campaign.name || ''}
                        onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                      />
                      <div className="uf-form-hint">Nome usado para você identificar esta campanha no seu painel.</div>
                    </div>

                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="uf-form-label mb-0">Para onde vai quem clicar no botão de compra?</label>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10px' }}>Obrigatório</span>
                      </div>
                      <div className="input-group">
                        <span className="input-group-text" style={{ background: 'var(--surface-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                          🔗
                        </span>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="Cole seu link da Kiwify, PerfectPay ou WhatsApp"
                          value={currentLevel.external_checkout_url || ''}
                          onChange={(e) => handleUpdateCurrentLevel('external_checkout_url', e.target.value)}
                        />
                      </div>
                      <div className="uf-form-hint">💡 Quando a pessoa aceitar a oferta na página, ela será direcionada diretamente para este link.</div>
                    </div>
                  </div>

                  {/* Passo 3: Configurações Avançadas (Recolhível sem bugs) */}
                  <div className="uf-form-block mt-3" style={{ padding: '0.9rem 1.15rem' }}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowAdvancedSetup(!showAdvancedSetup)}
                      className="d-flex align-items-center justify-content-between"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span>⚙️</span>
                        <span className="fw-bold small" style={{ color: 'var(--text-main)' }}>Configurações Avançadas</span>
                        <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10px' }}>
                          Status e Nome Interno
                        </span>
                      </div>
                      <span className="small fw-bold" style={{ color: 'var(--text-muted)' }}>
                        {showAdvancedSetup ? '▲ Recolher' : '▼ Expandir'}
                      </span>
                    </div>

                    {showAdvancedSetup && (
                      <div className="pt-3 mt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="uf-form-label">Status da Publicação</label>
                            <select
                              className="form-select"
                              value={campaign.status || 'active'}
                              onChange={(e) => setCampaign({ ...campaign, status: e.target.value })}
                            >
                              <option value="active">🟢 Ativa (Disponível no link público)</option>
                              <option value="inactive">🟡 Pausada (Rascunho)</option>
                            </select>
                            <div className="uf-form-hint">Se pausada, visitantes verão página de oferta finalizada.</div>
                          </div>

                          <div className="col-md-6">
                            <label className="uf-form-label">Identificação Interna desta Etapa</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Ex: Etapa 1 (Chamada)"
                              value={currentLevel.internal_name || ''}
                              onChange={(e) => handleUpdateCurrentLevel('internal_name', e.target.value)}
                            />
                            <div className="uf-form-hint">Nome que aparece apenas para você no topo das abas.</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =========================================================
                  ABA 2 (CHAMADA DE VÍDEO): TELA 1 - RECEBENDO LIGAÇÃO
                 ========================================================= */}
              {isVideoCallTemplate && activeTab === 'vc_call' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <PhoneCall size={16} className="text-danger" />
                        <span>Tela 1: Chamada de Vídeo Recebida</span>
                      </h6>
                      <p className="uf-section-desc">
                        Configure a foto, nome, arroba e botões de atender/recusar a chamada ao vivo.
                      </p>
                    </div>
                  </div>

                  {/* Bloco 1: Foto de Perfil & Identidade */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <User size={14} className="text-danger" /> Quem Está Ligando (Foto, Nome e @)
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Perfil
                      </span>
                    </div>
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-3 pb-3 border-bottom">
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: `3px solid ${currentBenefits.vc_accent_color || '#ff1030'}`,
                            background: '#1a0b10',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: '20px',
                            flexShrink: 0,
                          }}
                        >
                          {currentLevel.image || currentBenefits.caller_avatar ? (
                            <img
                              src={currentLevel.image || currentBenefits.caller_avatar}
                              alt="Avatar"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span>{currentBenefits.caller_initials || 'MA'}</span>
                          )}
                        </div>

                        <div className="flex-grow-1">
                          <label className="uf-form-label">
                            <span className="d-flex align-items-center gap-1">
                              <Upload size={13} /> Enviar Foto de Perfil
                            </span>
                          </label>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="file"
                              className="form-control"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              disabled={uploadingField === 'caller_avatar'}
                              onChange={(e) => handleFileUpload(e, 'caller_avatar')}
                            />
                            {uploadingField === 'caller_avatar' && (
                              <div className="spinner-border spinner-border-sm text-primary" role="status" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-md-7">
                          <label className="uf-form-label">Ou URL Direta da Foto</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="/images/caller-avatar-default.jpg ou https://..."
                            value={currentLevel.image ?? currentBenefits.caller_avatar ?? '/images/caller-avatar-default.jpg'}
                            onChange={(e) =>
                              handleUpdateMultipleBenefits({ caller_avatar: e.target.value }, { image: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-md-5 d-flex align-items-end gap-1.5">
                          <button
                            type="button"
                            className="btn btn-outline-secondary w-100"
                            onClick={() =>
                              handleUpdateMultipleBenefits(
                                { caller_avatar: '/images/caller-avatar-default.jpg' },
                                { image: '/images/caller-avatar-default.jpg' }
                              )
                            }
                          >
                            Foto Padrão
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger w-100"
                            onClick={() => handleUpdateMultipleBenefits({ caller_avatar: '' }, { image: '' })}
                          >
                            Só Iniciais
                          </button>
                        </div>
                      </div>

                      <div className="row g-2">
                        <div className="col-md-5">
                          <label className="uf-form-label">Nome de Quem Liga</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ex: Cherminho"
                            value={currentBenefits.caller_name ?? DEFAULT_VIDEOCALL_CONFIG.caller_name}
                            onChange={(e) => handleUpdateBenefit('caller_name', e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="uf-form-label">@ (Arroba abaixo do nome)</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ex: @cherminhopremiacoes"
                            value={currentBenefits.caller_handle ?? DEFAULT_VIDEOCALL_CONFIG.caller_handle}
                            onChange={(e) => handleUpdateBenefit('caller_handle', e.target.value)}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="uf-form-label">Selo Verificado</label>
                          <div className="form-check form-switch mt-1">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="caller_verified"
                              checked={currentBenefits.caller_verified ?? true}
                              onChange={(e) => handleUpdateBenefit('caller_verified', e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="caller_verified" style={{ color: 'var(--text-main)' }}>
                              Ativo
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Textos do Topo e Saudação */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Tag size={14} className="text-primary" /> Textos da Chamada & Nome do Visitante
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Textos
                      </span>
                    </div>
                    <div>
                      <div className="row g-2 mb-2">
                        <div className="col-md-6">
                          <label className="uf-form-label">Selo Superior (Badge)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.call_badge_text ?? DEFAULT_VIDEOCALL_CONFIG.call_badge_text}
                            onChange={(e) => handleUpdateBenefit('call_badge_text', e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="uf-form-label">Status Abaixo do Selo</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.call_status_text ?? DEFAULT_VIDEOCALL_CONFIG.call_status_text}
                            onChange={(e) => handleUpdateBenefit('call_status_text', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="row g-2">
                        <div className="col-md-7">
                          <label className="uf-form-label">Frase de Convite</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.call_greeting_prefix ?? DEFAULT_VIDEOCALL_CONFIG.call_greeting_prefix}
                            onChange={(e) => handleUpdateBenefit('call_greeting_prefix', e.target.value)}
                          />
                        </div>
                        <div className="col-md-5">
                          <label className="uf-form-label">Nome Exemplo do Cliente</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ex: FULANO"
                            value={currentBenefits.call_visitor_name ?? DEFAULT_VIDEOCALL_CONFIG.call_visitor_name}
                            onChange={(e) => handleUpdateBenefit('call_visitor_name', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Botões Atender & Recusar */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <PhoneCall size={14} className="text-success" /> Botões Atender & Recusar
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Ações
                      </span>
                    </div>
                    <div>
                      <div className="row g-2 mb-2">
                        <div className="col-md-6">
                          <label className="uf-form-label">Texto do Botão Verde (Atender)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.call_accept_text ?? DEFAULT_VIDEOCALL_CONFIG.call_accept_text}
                            onChange={(e) => handleUpdateBenefit('call_accept_text', e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="uf-form-label">Texto do Botão Vermelho (Recusar)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.call_decline_text ?? DEFAULT_VIDEOCALL_CONFIG.call_decline_text}
                            onChange={(e) => handleUpdateBenefit('call_decline_text', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row g-2">
                        <div className="col-md-12">
                          <label className="form-label small fw-bold mb-1">Se a pessoa clicar em "Recusar", o que acontece?</label>
                          <select
                            className="form-select form-select-sm"
                            value={currentBenefits.call_decline_behavior || 'missed_call'}
                            onChange={(e) => handleUpdateBenefit('call_decline_behavior', e.target.value)}
                          >
                            <option value="missed_call">
                              📲 Mostrar tela estilo WhatsApp "Não atendida" + Transição automática para o vídeo (Recomendado)
                            </option>
                            <option value="go_to_offer">🎁 Ir direto para a Tela 3 (Oferta de Bônus)</option>
                            <option value="answer_anyway">🎥 Atender a chamada mesmo assim</option>
                            <option value="decline_funnel">🚪 Sair da oferta</option>
                          </select>
                        </div>

                        {(currentBenefits.call_decline_behavior || 'missed_call') === 'missed_call' && (
                          <div className="col-md-12 mt-2 p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                            <div className="d-flex align-items-center gap-2 mb-2.5 pb-2 border-bottom">
                              <span style={{ fontSize: '15px' }}>💬</span>
                              <span className="small fw-bold" style={{ color: 'var(--text-main)' }}>Configurações da Tela "Não Atendida" (Estilo WhatsApp)</span>
                            </div>

                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="uf-form-label">Tempo na Tela (Segundos) ⏱️</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="60"
                                  className="form-control form-control-sm"
                                  value={currentBenefits.missed_call_delay ?? 4}
                                  onChange={(e) => handleUpdateBenefit('missed_call_delay', parseInt(e.target.value, 10) || 4)}
                                />
                                <div className="uf-form-hint">Tempo até o vídeo começar automaticamente.</div>
                              </div>

                              <div className="col-md-4">
                                <label className="uf-form-label">Avatar na Tela</label>
                                <select
                                  className="form-select form-select-sm"
                                  value={currentBenefits.missed_call_avatar_mode || 'auto'}
                                  onChange={(e) => handleUpdateBenefit('missed_call_avatar_mode', e.target.value)}
                                >
                                  <option value="auto">Foto do Perfil (ou Iniciais se não houver)</option>
                                  <option value="initials">Sempre Iniciais (Ex: João Carlos = JC)</option>
                                </select>
                                <div className="uf-form-hint">Exibe o círculo com as iniciais do chamador.</div>
                              </div>

                              <div className="col-md-4">
                                <label className="uf-form-label">Texto do Status</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={currentBenefits.missed_call_status_text ?? 'Não atendida'}
                                  onChange={(e) => handleUpdateBenefit('missed_call_status_text', e.target.value)}
                                />
                                <div className="uf-form-hint">Exibido abaixo do nome (padrão: Não atendida).</div>
                              </div>

                              <div className="col-md-12">
                                <label className="uf-form-label">Vídeo de Recado (Opcional) 🎥</label>
                                <input
                                  type="url"
                                  className="form-control form-control-sm"
                                  placeholder="Cole a URL do vídeo de recado (se deixar vazio, usa o vídeo principal da chamada)"
                                  value={currentBenefits.missed_call_video_url || ''}
                                  onChange={(e) => handleUpdateBenefit('missed_call_video_url', e.target.value)}
                                />
                                <div className="uf-form-hint">💡 Se deixar vazio, o sistema toca o vídeo principal da chamada automaticamente.</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="d-flex flex-wrap gap-3 mt-3 pt-2 border-top">
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="call_ringtone_enabled"
                            checked={currentBenefits.call_ringtone_enabled ?? true}
                            onChange={(e) => handleUpdateBenefit('call_ringtone_enabled', e.target.checked)}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="call_ringtone_enabled">
                            Som de Toque da Ligação
                          </label>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="call_vibration_enabled"
                            checked={currentBenefits.call_vibration_enabled ?? true}
                            onChange={(e) => handleUpdateBenefit('call_vibration_enabled', e.target.checked)}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="call_vibration_enabled">
                            Vibrar no Celular
                          </label>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="call_blur_avatar_bg"
                            checked={currentBenefits.call_blur_avatar_bg ?? true}
                            onChange={(e) => handleUpdateBenefit('call_blur_avatar_bg', e.target.checked)}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="call_blur_avatar_bg">
                            Fundo Borrado com a Foto
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  ABA 3 (CHAMADA DE VÍDEO): TELA 2 - VÍDEO EM LIGAÇÃO
                 ========================================================= */}
              {isVideoCallTemplate && activeTab === 'vc_video' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <Video size={16} className="text-danger" />
                        <span>Tela 2: Vídeo da Chamada & Botão Flutuante</span>
                      </h6>
                      <p className="uf-section-desc">
                        Defina o vídeo vertical da chamada e o botão de ação que aparece sobre o vídeo.
                      </p>
                    </div>
                  </div>

                  {/* Bloco 1: Arquivo ou Link do Vídeo */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Video size={14} className="text-danger" /> Vídeo Vertical da Chamada (.MP4)
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Mídia
                      </span>
                    </div>
                    <div>
                      <div className="mb-3">
                        <label className="uf-form-label">
                          <span className="d-flex align-items-center gap-1">
                            <Upload size={13} /> Enviar Vídeo (.mp4, .mov, .webm)
                          </span>
                        </label>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="file"
                            className="form-control"
                            accept="video/mp4,video/webm,video/quicktime"
                            disabled={uploadingField === 'video'}
                            onChange={(e) => handleFileUpload(e, 'video')}
                          />
                          {uploadingField === 'video' && (
                            <div className="spinner-border spinner-border-sm text-primary" role="status" />
                          )}
                        </div>
                      </div>

                      <div className="row g-2 align-items-end">
                        <div className="col-md-8">
                          <label className="uf-form-label">Ou Cole a URL Direta do Vídeo</label>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="https://seusite.com/video.mp4"
                            value={currentLevel.video || ''}
                            onChange={(e) => handleUpdateCurrentLevel('video', e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <button
                            type="button"
                            className="btn btn-outline-danger w-100"
                            onClick={() =>
                              handleUpdateCurrentLevel(
                                'video',
                                'https://midia.dxhost.com.br/media/01a0deef-957a-78d8-9792-286bb12567e5/37d01e0fc10e08485b7268bb3e045bdd297faf77fa77fc986f7dad8115f6181f.mp4'
                              )
                            }
                          >
                            Vídeo Padrão
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Botão Flutuante sobre o Vídeo */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Sparkles size={14} className="text-warning" /> Botão que Aparece em Cima do Vídeo
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Delay & CTA
                      </span>
                    </div>
                    <div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <label className="uf-form-label">Demora para Aparecer</label>
                          <div className="input-group">
                            <input
                              type="number"
                              min="0"
                              max="120"
                              className="form-control"
                              value={currentBenefits.video_cta_delay ?? DEFAULT_VIDEOCALL_CONFIG.video_cta_delay}
                              onChange={(e) => handleUpdateBenefit('video_cta_delay', e.target.value)}
                            />
                            <span className="input-group-text">segundos</span>
                          </div>
                        </div>
                        <div className="col-md-8">
                          <label className="uf-form-label">Selo Acima do Botão no Vídeo</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="COROLLA + MOTO só por esta página"
                            value={currentBenefits.video_cta_badge ?? DEFAULT_VIDEOCALL_CONFIG.video_cta_badge}
                            onChange={(e) => handleUpdateBenefit('video_cta_badge', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="uf-form-label">Texto do Botão no Vídeo</label>
                          <input
                            type="text"
                            className="form-control fw-bold"
                            placeholder="PARTICIPAR AGORA"
                            value={currentBenefits.video_cta_text ?? DEFAULT_VIDEOCALL_CONFIG.video_cta_text}
                            onChange={(e) => handleUpdateBenefit('video_cta_text', e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="uf-form-label">Ao Clicar nesse Botão</label>
                          <select
                            className="form-select"
                            value={currentBenefits.video_cta_action || 'go_to_offer'}
                            onChange={(e) => handleUpdateBenefit('video_cta_action', e.target.value)}
                          >
                            <option value="go_to_offer">Abrir Tela 3 (Resumo do Bônus)</option>
                            <option value="direct_checkout">Ir Direto para o Link de Compra</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  ABA 4 (CHAMADA DE VÍDEO): TELA 3 - OFERTA & SUPER BÔNUS
                 ========================================================= */}
              {isVideoCallTemplate && activeTab === 'vc_offer' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <Gift size={16} className="text-warning" />
                        <span>Tela 3: Oferta Especial de Bônus</span>
                      </h6>
                      <p className="uf-section-desc">
                        Configure a headline, o destaque do bônus gigante dourado e o botão final com relógio.
                      </p>
                    </div>
                  </div>

                  {/* Bloco 1: Topo e Headline */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Tag size={14} className="text-warning" /> Selo Dourado & Título da Oferta
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Topo
                      </span>
                    </div>
                    <div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="uf-form-label">Selo Dourado no Topo</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="PRÓXIMA RASPADINHA DA MOTO"
                            value={currentBenefits.offer_top_badge ?? DEFAULT_VIDEOCALL_CONFIG.offer_top_badge}
                            onChange={(e) => handleUpdateBenefit('offer_top_badge', e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="uf-form-label">Prêmio Normal (riscado)</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ex: a moto"
                            value={currentBenefits.offer_normal_prize ?? DEFAULT_VIDEOCALL_CONFIG.offer_normal_prize}
                            onChange={(e) => handleUpdateBenefit('offer_normal_prize', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="uf-form-label">Verbo Inicial</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.offer_headline_prefix ?? DEFAULT_VIDEOCALL_CONFIG.offer_headline_prefix}
                            onChange={(e) => handleUpdateBenefit('offer_headline_prefix', e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="uf-form-label">Conector</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.offer_headline_mid ?? DEFAULT_VIDEOCALL_CONFIG.offer_headline_mid}
                            onChange={(e) => handleUpdateBenefit('offer_headline_mid', e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="uf-form-label">Destaque em Dourado</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.offer_headline_highlight ?? DEFAULT_VIDEOCALL_CONFIG.offer_headline_highlight}
                            onChange={(e) => handleUpdateBenefit('offer_headline_highlight', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Card Central do Super Bônus */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Sparkles size={14} className="text-warning" /> Card Central do Super Bônus Dourado
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Destaque Principal
                      </span>
                    </div>
                    <div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="uf-form-label">Super Bônus Gigante Dourado 🏆</label>
                          <input
                            type="text"
                            className="form-control fw-bold"
                            placeholder="Ex: COROLLA + MOTO"
                            value={currentBenefits.offer_bonus_main ?? DEFAULT_VIDEOCALL_CONFIG.offer_bonus_main}
                            onChange={(e) => handleUpdateBenefit('offer_bonus_main', e.target.value)}
                          />
                          <div className="uf-form-hint">
                            O que vier depois do <code>+</code> fica menor embaixo automaticamente.
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="uf-form-label">Condição / Compra Mínima</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="com compra de qualquer valor"
                            value={currentBenefits.offer_min_purchase ?? DEFAULT_VIDEOCALL_CONFIG.offer_min_purchase}
                            onChange={(e) => handleUpdateBenefit('offer_min_purchase', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-12">
                          <label className="uf-form-label">Regra / Observação Abaixo do Card</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.offer_disclaimer_text ?? DEFAULT_VIDEOCALL_CONFIG.offer_disclaimer_text}
                            onChange={(e) => handleUpdateBenefit('offer_disclaimer_text', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Botão Final, Link e Cronômetro */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Clock size={14} className="text-danger" /> Botão de Compra Final & Cronômetro
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Conversão
                      </span>
                    </div>
                    <div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-5">
                          <label className="uf-form-label">Texto do Botão Final (CTA)</label>
                          <input
                            type="text"
                            className="form-control fw-bold"
                            placeholder="GARANTIR AGORA"
                            value={currentLevel.cta_text || ''}
                            onChange={(e) => handleUpdateCurrentLevel('cta_text', e.target.value)}
                          />
                        </div>
                        <div className="col-md-7">
                          <label className="uf-form-label">Link de Destino ao Clicar no Botão 🔗</label>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="https://seusite.com/checkout"
                            value={currentLevel.external_checkout_url || ''}
                            onChange={(e) => handleUpdateCurrentLevel('external_checkout_url', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="uf-form-label">Tempo do Relógio (Segundos)</label>
                          <input
                            type="number"
                            min="10"
                            className="form-control"
                            value={currentLevel.timer_duration ?? 180}
                            onChange={(e) =>
                              handleUpdateCurrentLevel('timer_duration', parseInt(e.target.value, 10) || 180)
                            }
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="uf-form-label">Texto do Relógio</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.offer_timer_label ?? DEFAULT_VIDEOCALL_CONFIG.offer_timer_label}
                            onChange={(e) => handleUpdateBenefit('offer_timer_label', e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="uf-form-label">Texto do Link de Saída</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentBenefits.offer_decline_btn_text ?? DEFAULT_VIDEOCALL_CONFIG.offer_decline_btn_text}
                            onChange={(e) => handleUpdateBenefit('offer_decline_btn_text', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  ABA 5 (CHAMADA DE VÍDEO): CORES & ESTILO
                 ========================================================= */}
              {isVideoCallTemplate && activeTab === 'vc_colors' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <Palette size={16} className="text-primary" />
                        <span>Cores, Botões & Transição</span>
                      </h6>
                      <p className="uf-section-desc">
                        Ajuste as cores da página, temas rápidos em 1 clique e dimensões do card.
                      </p>
                    </div>
                  </div>

                  {/* Bloco 1: Paletas Prontas */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Sparkles size={14} className="text-primary" /> Temas Prontos com 1 Clique
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Rápido
                      </span>
                    </div>
                    <div>
                      <div className="d-flex flex-wrap gap-2">
                        {[
                          {
                            label: '🔴 Original',
                            accent: '#ff1030',
                            bg: '#0c0608',
                            pageBg: '#050203',
                            gold: '#ffc531',
                            accept: '#25d366',
                          },
                          {
                            label: '🟢 Verde Sorte / Pix',
                            accent: '#10b981',
                            bg: '#06100c',
                            pageBg: '#020806',
                            gold: '#fbbf24',
                            accept: '#22c55e',
                          },
                          {
                            label: '🟡 Ouro Imperial VIP',
                            accent: '#f59e0b',
                            bg: '#100c05',
                            pageBg: '#080502',
                            gold: '#fde047',
                            accept: '#25d366',
                          },
                          {
                            label: '🟣 Roxo Neon Premium',
                            accent: '#9333ea',
                            bg: '#0b0614',
                            pageBg: '#05020a',
                            gold: '#facc15',
                            accept: '#25d366',
                          },
                          {
                            label: '🔵 Azul Royal',
                            accent: '#2563eb',
                            bg: '#060a14',
                            pageBg: '#02050a',
                            gold: '#ffc531',
                            accept: '#25d366',
                          },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            className="btn btn-sm btn-outline-secondary fw-semibold"
                            style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }}
                            onClick={() =>
                              handleUpdateMultipleBenefits({
                                vc_accent_color: p.accent,
                                vc_bg_color: p.bg,
                                vc_page_bg_color: p.pageBg,
                                vc_gold_color: p.gold,
                                call_accept_color: p.accept,
                              })
                            }
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Seletores Individuais de Cores */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Palette size={14} className="text-danger" /> Cores Personalizadas
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        100% Editável
                      </span>
                    </div>
                    <div>
                      <div className="row g-3">
                        {[
                          { key: 'vc_accent_color', label: 'Cor Principal (Botão CTA e Anel)', def: '#ff1030' },
                          { key: 'vc_gold_color', label: 'Cor do Bônus Dourado', def: '#ffc531' },
                          { key: 'vc_bg_color', label: 'Fundo do Card', def: '#0c0608' },
                          { key: 'call_accept_color', label: 'Botão Atender Ligação', def: '#25d366' },
                          { key: 'call_decline_color', label: 'Botão Recusar / Desligar', def: '#e5223a' },
                          { key: 'vc_text_color', label: 'Cor dos Textos', def: '#ffffff' },
                        ].map((item) => (
                          <div className="col-md-4" key={item.key}>
                            <label className="uf-form-label">{item.label}</label>
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="color"
                                className="form-control form-control-color border-0"
                                value={currentBenefits[item.key] || item.def}
                                onChange={(e) => handleUpdateBenefit(item.key, e.target.value)}
                              />
                              <input
                                type="text"
                                className="form-control font-monospace"
                                value={currentBenefits[item.key] || item.def}
                                onChange={(e) => handleUpdateBenefit(item.key, e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="col-md-6">
                          <label className="uf-form-label">
                            Largura do Card no Desktop ({currentBenefits.vc_card_max_width || 360}px)
                          </label>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="range"
                              className="form-range flex-grow-1"
                              min="300"
                              max="460"
                              step="5"
                              value={currentBenefits.vc_card_max_width || 360}
                              onChange={(e) => handleUpdateBenefit('vc_card_max_width', Number(e.target.value))}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-1 px-2 text-nowrap"
                              onClick={() => handleUpdateBenefit('vc_card_max_width', 360)}
                            >
                              360px (Padrão)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Tela 4 de Redirecionamento */}
                  <div className="uf-form-block">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Clock size={14} className="text-primary" /> Tela 4: Animação ao Clicar no Botão Final
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Transição
                      </span>
                    </div>
                    <div>
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="redirect_screen_enabled"
                          checked={currentBenefits.redirect_screen_enabled ?? true}
                          onChange={(e) => handleUpdateBenefit('redirect_screen_enabled', e.target.checked)}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="redirect_screen_enabled" style={{ color: 'var(--text-main)' }}>
                          Mostrar tela "Confirmando seu acesso..." antes de abrir o checkout
                        </label>
                      </div>
                      <div className="row g-2">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={currentBenefits.redirect_step1_text ?? DEFAULT_VIDEOCALL_CONFIG.redirect_step1_text}
                            onChange={(e) => handleUpdateBenefit('redirect_step1_text', e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={currentBenefits.redirect_step2_text ?? DEFAULT_VIDEOCALL_CONFIG.redirect_step2_text}
                            onChange={(e) => handleUpdateBenefit('redirect_step2_text', e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={currentBenefits.redirect_step3_text ?? DEFAULT_VIDEOCALL_CONFIG.redirect_step3_text}
                            onChange={(e) => handleUpdateBenefit('redirect_step3_text', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  ABAS DO MODO CLÁSSICO (VSL)
                 ========================================================= */}
              {!isVideoCallTemplate && activeTab === 'content' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <Tv size={16} className="text-success" />
                        <span>Mídia & Textos Principais (Oferta Clássica)</span>
                      </h6>
                      <p className="uf-section-desc">
                        Defina o vídeo da oferta, headline de impacto e subtítulo explicativo.
                      </p>
                    </div>
                  </div>

                  <div className="uf-form-block mb-3">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <Video size={14} className="text-danger" /> Vídeo da Oferta
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                        Topo
                      </span>
                    </div>
                    <div>
                      <div className="mb-3">
                        <label className="uf-form-label">Vídeo Vertical (.mp4)</label>
                        <input
                          type="file"
                          className="form-control mb-2"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={(e) => handleFileUpload(e, 'video')}
                        />
                        <input
                          type="url"
                          className="form-control"
                          placeholder="Ou cole a URL direta do vídeo (.mp4)"
                          value={currentLevel.video || ''}
                          onChange={(e) => handleUpdateCurrentLevel('video', e.target.value)}
                        />
                      </div>
                      <div className="row g-3">
                        <div className="col-md-12">
                          <label className="uf-form-label">Headline Principal</label>
                          <input
                            type="text"
                            className="form-control"
                            value={currentLevel.headline || ''}
                            onChange={(e) => handleUpdateCurrentLevel('headline', e.target.value)}
                          />
                        </div>
                        <div className="col-md-12">
                          <label className="uf-form-label">Subtítulo</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            value={currentLevel.subheadline || ''}
                            onChange={(e) => handleUpdateCurrentLevel('subheadline', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isVideoCallTemplate && activeTab === 'probability' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <Activity size={16} className="text-warning" />
                        <span>Termômetro de Sorte & Card de Prêmio</span>
                      </h6>
                      <p className="uf-section-desc">
                        Ajuste a probabilidade exibida e as informações do prêmio em destaque.
                      </p>
                    </div>
                  </div>

                  <div className="uf-form-block mb-3">
                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <label className="uf-form-label">Porcentagem (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="form-control"
                          value={currentLevel.progress_value ?? 86}
                          onChange={(e) =>
                            handleUpdateCurrentLevel('progress_value', parseInt(e.target.value, 10) || 86)
                          }
                        />
                      </div>
                      <div className="col-md-8">
                        <label className="uf-form-label">Título do Prêmio</label>
                        <input
                          type="text"
                          className="form-control"
                          value={currentLevel.name || ''}
                          onChange={(e) => handleUpdateCurrentLevel('name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="uf-form-label">Imagem do Prêmio</label>
                      <input
                        type="file"
                        className="form-control mb-2"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'image')}
                      />
                      <input
                        type="url"
                        className="form-control"
                        placeholder="Ou cole a URL da imagem"
                        value={currentLevel.image || ''}
                        onChange={(e) => handleUpdateCurrentLevel('image', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isVideoCallTemplate && activeTab === 'pricing' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <DollarSign size={16} className="text-success" />
                        <span>Preço, Cronômetro & Botão CTA</span>
                      </h6>
                      <p className="uf-section-desc">
                        Configure o valor cobrado, urgência do relógio e texto de chamada para ação.
                      </p>
                    </div>
                  </div>

                  <div className="uf-form-block mb-3">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="uf-form-label">Preço (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={currentLevel.price ?? 97}
                          onChange={(e) => handleUpdateCurrentLevel('price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="uf-form-label">Cronômetro (Segundos)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={currentLevel.timer_duration ?? 300}
                          onChange={(e) =>
                            handleUpdateCurrentLevel('timer_duration', parseInt(e.target.value, 10) || 300)
                          }
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="uf-form-label">Texto do Botão CTA</label>
                        <input
                          type="text"
                          className="form-control"
                          value={currentLevel.cta_text || ''}
                          onChange={(e) => handleUpdateCurrentLevel('cta_text', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isVideoCallTemplate && activeTab === 'exit' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <ShieldAlert size={16} className="text-danger" />
                        <span>Pop-up de Saída & Prova Social</span>
                      </h6>
                      <p className="uf-section-desc">
                        Recupere vendas de quem tenta sair da página e aumente a conversão com prova social.
                      </p>
                    </div>
                  </div>

                  <div className="uf-form-block mb-3">
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="exit_intent_enabled"
                        checked={Boolean(currentLevel.exit_intent_enabled)}
                        onChange={(e) => handleUpdateCurrentLevel('exit_intent_enabled', e.target.checked ? 1 : 0)}
                      />
                      <label className="form-check-label uf-form-label mb-0" htmlFor="exit_intent_enabled">
                        Ativar Pop-up de Desconto na Saída
                      </label>
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-md-8">
                        <label className="uf-form-label">Título do Pop-up</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Título do Pop-up"
                          value={currentLevel.exit_intent_title || ''}
                          onChange={(e) => handleUpdateCurrentLevel('exit_intent_title', e.target.value)}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="uf-form-label">Preço com Desconto</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="Preço com Desconto"
                          value={currentLevel.exit_intent_discount_price ?? 63.05}
                          onChange={(e) =>
                            handleUpdateCurrentLevel('exit_intent_discount_price', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>

                    <div className="form-check form-switch mb-3 pt-3 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="social_proof_enabled"
                        checked={Boolean(currentLevel.social_proof_enabled)}
                        onChange={(e) => handleUpdateCurrentLevel('social_proof_enabled', e.target.checked ? 1 : 0)}
                      />
                      <label className="form-check-label uf-form-label mb-0" htmlFor="social_proof_enabled">
                        Ativar Notificações de Prova Social Ao Vivo
                      </label>
                    </div>
                    <div>
                      <label className="uf-form-label">Mensagem da Prova Social</label>
                      <input
                        type="text"
                        className="form-control"
                        value={currentLevel.social_proof_text || ''}
                        onChange={(e) => handleUpdateCurrentLevel('social_proof_text', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  ABA 6: PIXELS DE RASTREAMENTO & DATAS
                 ========================================================= */}
              {activeTab === 'pixels' && (
                <div>
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-1.5">
                    <Code2 size={16} className="text-primary" />
                    <span>Pixels de Rastreamento, Redirecionamento & Agendamento</span>
                  </h6>

                  <div className="card mb-3 border bg-light shadow-sm">
                    <div className="card-header bg-white py-2 px-3 d-flex align-items-center justify-content-between">
                      <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                        <BarChart2 size={15} className="text-primary" /> Integrações de Marketing (Pixels)
                      </span>
                      <span className="badge bg-light text-muted border small">Tracking</span>
                    </div>
                    <div className="card-body p-3">
                      <div className="row g-2">
                        <div className="col-md-4">
                          <label className="form-label small fw-bold mb-1">Meta Pixel ID (Facebook)</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Ex: 123456789012345"
                            value={campaign.meta_pixel_id || ''}
                            onChange={(e) => setCampaign({ ...campaign, meta_pixel_id: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold mb-1">Google Analytics 4 (GA4)</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Ex: G-XXXXXXXXXX"
                            value={campaign.ga4_measurement_id || ''}
                            onChange={(e) => setCampaign({ ...campaign, ga4_measurement_id: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold mb-1">Google Tag Manager (GTM)</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Ex: GTM-XXXXXXX"
                            value={campaign.gtm_id || ''}
                            onChange={(e) => setCampaign({ ...campaign, gtm_id: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card mb-3 border bg-light shadow-sm">
                    <div className="card-header bg-white py-2 px-3 d-flex align-items-center justify-content-between">
                      <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                        <Calendar size={15} className="text-primary" /> URL Final & Agendamento (Opcional)
                      </span>
                      <span className="badge bg-light text-muted border small">Avançado</span>
                    </div>
                    <div className="card-body p-3">
                      <div className="mb-2">
                        <label className="form-label small fw-bold mb-1">URL de Redirecionamento Final do Funil</label>
                        <input
                          type="url"
                          className="form-control form-control-sm"
                          placeholder="https://exemplo.com/obrigado"
                          value={campaign.final_redirect_url || ''}
                          onChange={(e) => setCampaign({ ...campaign, final_redirect_url: e.target.value })}
                        />
                      </div>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold mb-1">Início do Agendamento</label>
                          <input
                            type="datetime-local"
                            className="form-control form-control-sm"
                            value={campaign.start_at ? new Date(campaign.start_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setCampaign({ ...campaign, start_at: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold mb-1">Término (Expiração)</label>
                          <input
                            type="datetime-local"
                            className="form-control form-control-sm"
                            value={campaign.end_at ? new Date(campaign.end_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setCampaign({ ...campaign, end_at: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RODAPÉ DO CARD COM NAVEGAÇÃO PASSO A PASSO + BOTÃO SALVAR */}
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-3 mt-3 border-top">
                <div className="d-flex align-items-center gap-2">
                  {prevTab && (
                    <button
                      type="button"
                      onClick={() => selectTab(prevTab)}
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                    >
                      <ChevronLeft size={14} /> Anterior
                    </button>
                  )}
                  {nextTab && (
                    <button
                      type="button"
                      onClick={() => selectTab(nextTab)}
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 fw-semibold"
                    >
                      Próximo: {nextTab.label} <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleSaveAll(e, false)}
                  disabled={loading}
                  className="btn btn-primary px-4 d-inline-flex align-items-center gap-1.5 fw-bold shadow-sm"
                >
                  <Check size={15} />
                  <span>{loading ? 'Salvando...' : isCreate && !campaign.id ? 'Publicar Campanha' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            COLUNA DIREITA: PRÉ-VISUALIZAÇÃO AO VIVO NO CELULAR (col-xl-5)
           ===================================================================== */}
        <div className="col-12 col-xl-5">
          <div className="sticky-top" style={{ top: '85px', zIndex: 10 }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                <Smartphone size={16} className="text-primary" /> PRÉ-VISUALIZAÇÃO AO VIVO
              </span>
              <span className="badge bg-success-subtle text-success border border-success-subtle badge-pulse">
                Live Preview
              </span>
            </div>

            {/* SELETOR DE TELAS DO PREVIEW (Quando no modo Chamada de Vídeo) */}
            {isVideoCallTemplate && (
              <div
                className="d-flex gap-1 p-1 rounded-3 border mb-2.5 mx-auto"
                style={{ maxWidth: '350px', background: 'var(--surface-card)' }}
              >
                {[
                  { id: 'call', label: '📞 Ligação' },
                  { id: 'missed', label: '📵 Recusada' },
                  { id: 'video', label: '🎥 Vídeo' },
                  { id: 'offer', label: '🎁 Oferta' },
                  { id: 'redirect', label: '⏳ Final' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setVcPreviewStage(st.id)}
                    className={`btn btn-sm flex-fill py-1 px-1.5 fw-bold rounded-2 border-0 ${vcPreviewStage === st.id ? 'bg-danger text-white shadow-sm' : 'text-muted bg-transparent'
                      }`}
                    style={{ fontSize: '11px' }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}

            {/* MOCKUP DO CELULAR IPHONE (350x640px) */}
            <div
              className="phone-mockup-wrapper mx-auto shadow-lg position-relative"
              style={{
                maxWidth: '350px',
                height: '640px',
                background: '#000',
                border: '10px solid #1e293b',
                borderRadius: '40px',
                overflow: 'hidden',
                transform: 'translateZ(0)',
                contain: 'paint',
              }}
            >
              {/* Dynamic Island / Notch */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '110px',
                  height: '16px',
                  background: '#1e293b',
                  borderBottomLeftRadius: '12px',
                  borderBottomRightRadius: '12px',
                  zIndex: 100,
                }}
              />

              {/* CONTEÚDO DA TELA DO CELULAR */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollbarWidth: 'none',
                  background: '#050203',
                }}
              >
                {isVideoCallTemplate ? (
                  <VideoCallOfferView
                    session={{ customer_name: currentBenefits.call_visitor_name || 'FULANO' }}
                    campaign={campaign}
                    level={currentLevel}
                    benefits={currentBenefits}
                    isPreview={true}
                    previewStage={vcPreviewStage}
                    onAcceptCheckout={() => setVcPreviewStage('redirect')}
                    onDeclineOffer={() => setVcPreviewStage('offer')}
                  />
                ) : (
                  <OfferView
                    session={{
                      token: 'preview-token',
                      customer_name: currentBenefits.call_visitor_name || 'FULANO',
                    }}
                    campaign={{
                      name: campaign.name || 'Teste',
                      ...campaign,
                    }}
                    level={{
                      ...currentLevel,
                      benefits: currentBenefits,
                    }}
                    isPreview={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
