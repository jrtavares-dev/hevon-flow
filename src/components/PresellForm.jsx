'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Type,
  LayoutGrid,
  Palette,
  Video,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Code2,
  BellRing,
  Tag,
  Heading,
  AlignLeft,
  FileText,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Clock,
  Play,
  PlayCircle,
  SlidersHorizontal,
  Users,
  X,
  Smartphone,
  ChevronRight,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Target,
  RotateCcw,
  Globe,
} from 'lucide-react';
import { DEFAULT_PRESELL_BUYERS, EXTRA_PRESELL_BUYERS } from '@/lib/constants/presellBuyers';
import { WHITE_PAGE_TEMPLATES } from '@/lib/constants/whitePageTemplates';

export default function PresellForm({ initialData = {}, isEdit = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [testProofVisible, setTestProofVisible] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState({});
  const [showAdvancedTypography, setShowAdvancedTypography] = useState(false);

  const toggleCollapse = (idx) => {
    setCollapsedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Parse initial buttons
  const rawButtons = Array.isArray(initialData.buttons_list) && initialData.buttons_list.length > 0
    ? initialData.buttons_list
    : [
        {
          id: 'btn_1',
          type: 'primary',
          main_text: initialData.button_text || 'ENTRAR NA COMUNIDADE',
          main_text_size: '15px',
          text_color: initialData.button_text_color || '#ffffff',
          sub_text: initialData.button_subtext || '100% gratuito · direto no WhatsApp',
          sub_text_size: '11px',
          sub_text_color: '#ffffff',
          url: initialData.destination_url || '',
          icon: 'whatsapp',
          bg_color: initialData.button_color || '#22c55e',
          animation: initialData.button_animation || 'pulse',
          pass_utm: 1,
          hidden: false,
        },
      ];

  const initialButtons = rawButtons.map((btn, idx) => ({
    id: btn.id || `btn_${idx + 1}`,
    type: btn.type || 'primary',
    main_text: btn.main_text || '',
    main_text_size: btn.main_text_size || '15px',
    text_color: btn.text_color || '#ffffff',
    sub_text: btn.sub_text || '',
    sub_text_size: btn.sub_text_size || '11px',
    sub_text_color: btn.sub_text_color || '#ffffff',
    url: btn.url || '',
    icon: btn.icon || 'whatsapp',
    bg_color: btn.bg_color || '#22c55e',
    animation: btn.animation || 'pulse',
    pass_utm: btn.pass_utm ?? 1,
    hidden: Boolean(btn.hidden || btn.is_hidden),
  }));

  const initialStyles = (initialData && typeof initialData.page_styles === 'object' && initialData.page_styles !== null)
    ? initialData.page_styles
    : {};

  const [form, setForm] = useState({
    name: initialData.name || '',
    slug: initialData.slug || '',
    status: initialData.status || 'active',
    pass_utm_params: initialData.pass_utm_params ? 1 : 0,

    // Typography & Texts
    badge_text: initialData.badge_text || 'COMUNIDADE OFICIAL',
    badge_font_size: initialStyles.badge_font_size || '10px',
    badge_text_color: initialStyles.badge_text_color || (initialData.accent_color || '#22c55e'),
    badge_bg_color: initialStyles.badge_bg_color || '',

    headline: initialData.headline || 'Cherminho',
    headline_font_size: initialStyles.headline_font_size || '30px',
    headline_color: initialStyles.headline_color || '#ffffff',

    subheadline: initialData.subheadline || 'ACESSO EXCLUSIVO',
    subheadline_font_size: initialStyles.subheadline_font_size || '12px',
    subheadline_color: initialStyles.subheadline_color || '#94a3b8',

    footer_text: initialData.footer_text || 'CONTEÚDO EM PRIMEIRA MÃO SÓ PRA QUEM ESTÁ DENTRO',
    footer_font_size: initialStyles.footer_font_size || '11px',
    footer_text_color: initialStyles.footer_text_color || '#64748b',

    // Buttons List
    buttons: initialButtons,

    // Visuals & Media
    avatar_url: initialData.avatar_url || '',
    background_url: initialData.background_url || '',
    bg_overlay_opacity: initialData.bg_overlay_opacity ?? 75,
    accent_color: initialData.accent_color || '#22c55e',
    glow_color: initialData.glow_color || '#22c55e',

    // Video VSL
    video_type: initialData.video_type || 'none',
    video_url: initialData.video_url || '',
    video_autoplay: initialData.video_autoplay ? 1 : 0,
    video_sound_banner: initialData.video_sound_banner ? 1 : 0,
    pitch_delay_enabled: initialData.pitch_delay_enabled ? 1 : 0,
    pitch_delay_seconds: Number(initialData.pitch_delay_seconds || 0),
    pitch_delay_resume: initialData.pitch_delay_resume ? 1 : 0,

    // Cloaker Anti-Bot
    cloak_enabled: initialData.cloak_enabled ? 1 : 0,
    cloak_mode: initialData.cloak_mode || 'white_page',
    cloak_white_url: initialData.cloak_white_url || '',
    cloak_white_headline: initialData.cloak_white_headline || 'Tendências e Dicas Exclusivas de Engajamento',
    cloak_white_content: initialData.cloak_white_content || '',
    cloak_allowed_countries: initialData.cloak_allowed_countries || 'BR',
    cloak_filter_bots: initialData.cloak_filter_bots ? 1 : 0,
    cloak_filter_vpn: initialData.cloak_filter_vpn ? 1 : 0,

    // A/B Test
    ab_test_enabled: initialData.ab_test_enabled ? 1 : 0,
    ab_headline_b: initialData.ab_headline_b || '',
    ab_subheadline_b: initialData.ab_subheadline_b || '',
    ab_button_text_b: initialData.ab_button_text_b || '',
    ab_button_subtext_b: initialData.ab_button_subtext_b || '',
    ab_button_color_b: initialData.ab_button_color_b || '#16a34a',
    ab_button_text_color_b: initialData.ab_button_text_color_b || '#ffffff',
    ab_avatar_url_b: initialData.ab_avatar_url_b || '',

    // Pixels
    meta_pixel_id: initialData.meta_pixel_id || '',
    ga4_measurement_id: initialData.ga4_measurement_id || '',
    tiktok_pixel_id: initialData.tiktok_pixel_id || '',
    custom_head_code: initialData.custom_head_code || '',
    custom_body_code: initialData.custom_body_code || '',

    // Social Proof
    social_proof_enabled: initialData.social_proof_enabled !== undefined && initialData.social_proof_enabled !== null ? Number(initialData.social_proof_enabled) : 1,
    social_proof_interval: initialData.social_proof_interval || 'normal',
    social_proof_text: initialData.social_proof_text || 'acabou de comprar',
    social_proof_position: initialData.social_proof_position || 'bottom-left',
    social_proof_buyers: Array.isArray(initialData.social_proof_buyers) && initialData.social_proof_buyers.length > 0
      ? initialData.social_proof_buyers
      : DEFAULT_PRESELL_BUYERS,
  });

  const [newBuyerName, setNewBuyerName] = useState('');
  const [newBuyerCity, setNewBuyerCity] = useState('');
  const [bulkBuyersText, setBulkBuyersText] = useState('');
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [currentTestBuyer, setCurrentTestBuyer] = useState(null);

  const [uploadingField, setUploadingField] = useState(null);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const inputEl = e.target;
    try {
      setUploadingField(field);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'presells');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        updateField(field, data.url);
        if (inputEl) inputEl.value = '';
      } else {
        alert(data.message || 'Erro ao enviar arquivo.');
      }
    } catch {
      alert('Erro de conexão ao enviar arquivo.');
    } finally {
      setUploadingField(null);
    }
  };

  // Button management
  const addButton = () => {
    const newBtn = {
      id: `btn_${Date.now()}`,
      type: 'primary',
      main_text: 'ENTRAR NO GRUPO VIP',
      main_text_size: '15px',
      text_color: '#ffffff',
      sub_text: 'Acesso imediato · Gratuito',
      sub_text_size: '11px',
      sub_text_color: '#ffffff',
      url: '',
      icon: 'whatsapp',
      bg_color: '#22c55e',
      animation: 'pulse',
      pass_utm: 1,
      hidden: false,
    };
    setForm((prev) => ({ ...prev, buttons: [...prev.buttons, newBtn] }));
  };

  const removeButton = (idx) => {
    if (form.buttons.length <= 1) {
      alert('A página precisa ter pelo menos 1 botão.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== idx),
    }));
  };

  const moveButton = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= form.buttons.length) return;
    const newBtns = [...form.buttons];
    const [moved] = newBtns.splice(idx, 1);
    newBtns.splice(targetIdx, 0, moved);
    setForm((prev) => ({ ...prev, buttons: newBtns }));
  };

  const updateButtonField = (idx, field, val) => {
    const newBtns = [...form.buttons];
    newBtns[idx] = { ...newBtns[idx], [field]: val };
    setForm((prev) => ({ ...prev, buttons: newBtns }));
  };

  const triggerTestSocialProof = () => {
    const buyers = form.social_proof_buyers?.length > 0 ? form.social_proof_buyers : DEFAULT_PRESELL_BUYERS;
    const picked = buyers[Math.floor(Math.random() * buyers.length)] || DEFAULT_PRESELL_BUYERS[0];
    const initials = (picked.name || 'C')
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    setCurrentTestBuyer({ ...picked, initials });
    setTestProofVisible(true);
    setTimeout(() => setTestProofVisible(false), 4000);
  };

  const handleAddBuyer = (e) => {
    if (e) e.preventDefault();
    const name = newBuyerName.trim();
    const city = newBuyerCity.trim() || 'Brasil';
    if (!name) return;
    setForm((prev) => ({
      ...prev,
      social_proof_buyers: [...(prev.social_proof_buyers || []), { name, city }],
    }));
    setNewBuyerName('');
    setNewBuyerCity('');
  };

  const handleRemoveBuyer = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      social_proof_buyers: (prev.social_proof_buyers || []).filter((_, i) => i !== indexToRemove),
    }));
  };

  const handleAddExtraBatch = () => {
    setForm((prev) => {
      const current = prev.social_proof_buyers || [];
      const currentNames = new Set(current.map((b) => b.name.toLowerCase()));
      const toAdd = EXTRA_PRESELL_BUYERS.filter((b) => !currentNames.has(b.name.toLowerCase()));
      const additions = toAdd.length > 0 ? toAdd : EXTRA_PRESELL_BUYERS;
      return {
        ...prev,
        social_proof_buyers: [...current, ...additions],
      };
    });
  };

  const handleResetBuyers = () => {
    setForm((prev) => ({
      ...prev,
      social_proof_buyers: DEFAULT_PRESELL_BUYERS,
    }));
  };

  const handleClearBuyers = () => {
    if (confirm('Deseja limpar todos os compradores para cadastrar apenas os seus?')) {
      setForm((prev) => ({
        ...prev,
        social_proof_buyers: [],
      }));
    }
  };

  const handleApplyBulkBuyers = () => {
    if (!bulkBuyersText.trim()) return;
    const lines = bulkBuyersText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed = lines.map((line) => {
      if (line.includes(' - ')) {
        const [name, city] = line.split(' - ');
        return { name: name.trim(), city: (city || 'Brasil').trim() };
      } else if (line.includes('(') && line.includes(')')) {
        const match = line.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          return { name: match[1].trim(), city: match[2].trim() };
        }
      }
      return { name: line, city: 'Brasil' };
    });

    setForm((prev) => ({
      ...prev,
      social_proof_buyers: [...(prev.social_proof_buyers || []), ...parsed],
    }));
    setBulkBuyersText('');
    setShowBulkMode(false);
  };

  const handleApplyWhiteTemplate = (templateKey) => {
    const tmpl = WHITE_PAGE_TEMPLATES[templateKey];
    if (!tmpl) return;
    setForm((prev) => ({
      ...prev,
      cloak_white_headline: tmpl.headline,
      cloak_white_content: tmpl.content,
    }));
  };

  const handleSetCountryPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      cloak_allowed_countries: preset,
    }));
  };

  const handleSetRedirectPreset = (url) => {
    setForm((prev) => ({
      ...prev,
      cloak_white_url: url,
    }));
  };

  const handleSubmit = async (e, saveAndClose = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setFeedback({ message: '', type: '' });

    try {
      const url = isEdit ? `/api/admin/presells/${initialData.id}` : '/api/admin/presells';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...form,
        destination_url: form.buttons[0]?.url || '',
        button_text: form.buttons[0]?.main_text || '',
        button_subtext: form.buttons[0]?.sub_text || '',
        button_color: form.buttons[0]?.bg_color || '#22c55e',
        button_text_color: form.buttons[0]?.text_color || '#ffffff',
        button_animation: form.buttons[0]?.animation || 'pulse',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ message: data.message || 'Erro ao salvar.', type: 'danger' });
        setLoading(false);
        return;
      }

      setFeedback({
        message: isEdit ? 'Alterações salvas com sucesso!' : 'Página criada com sucesso!',
        type: 'success',
      });

      if (saveAndClose) {
        router.push('/admin/presells');
      } else if (!isEdit && data.id) {
        router.push(`/admin/presells/edit/${data.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setFeedback({ message: 'Erro de conexão com o servidor.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const avatarDisplay = form.avatar_url || '/uploads/presells/cherminho_avatar.jpg';

  return (
    <>
      {/* Page Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/presells" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
              <ArrowLeft size={14} /> Voltar
            </Link>
            <h1 className="h3 fw-bold text-dark mb-0">
              {isEdit ? 'Editar Página Presell' : 'Criar Nova Página Presell'}
            </h1>
            <span className="badge rounded-pill" style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', fontWeight: 600 }}>
              Editor Visual
            </span>
          </div>
          <div className="text-muted small mt-1">
            Configure todos os detalhes da página com controle total de textos, fontes, cores e botões ilimitados.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0 flex-shrink-0">
          {isEdit && (
            <>
              <a
                href={`/p/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline-primary shadow-sm"
                title="Abrir página ao vivo em nova aba"
              >
                <ExternalLink size={14} />
                <span>Abrir Página</span>
              </a>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="btn btn-sm btn-secondary shadow-sm"
                disabled={loading}
              >
                <ArrowLeft size={14} />
                <span>Salvar e Voltar</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            className="btn btn-sm btn-primary shadow-sm px-3"
            disabled={loading}
          >
            <Save size={14} />
            <span>{loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Publicar Página'}</span>
          </button>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`alert alert-${feedback.type} alert-dismissible fade show rounded-4 shadow-sm border-0 d-flex align-items-center mb-4 p-3`}
          role="alert"
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={20} className="text-success me-2 flex-shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-danger me-2 flex-shrink-0" />
          )}
          <div className="fw-semibold small">{feedback.message}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setFeedback({ message: '', type: '' })}
          ></button>
        </div>
      )}

      <div className="row g-4">
        {/* FORM TABS (Left Column) */}
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm border rounded-4 mb-4 overflow-hidden">
            <div className="p-2 border-bottom" style={{ background: 'var(--surface-subtle)' }}>
              <div
                className="d-flex align-items-center gap-1 overflow-x-auto"
                style={{ scrollbarWidth: 'none', padding: '2px' }}
                role="tablist"
              >
                {[
                  { id: 'general', label: '1. Textos', icon: Type, color: '#10b981' },
                  { id: 'buttons', label: `2. Botões (${form.buttons.length})`, icon: LayoutGrid, color: '#059669' },
                  { id: 'visual', label: '3. Cores', icon: Palette, color: '#d97706' },
                  { id: 'video', label: '4. Vídeo', icon: Video, color: '#dc2626' },
                  { id: 'cloak', label: '5. Cloaker', icon: ShieldAlert, color: '#0891b2' },
                  { id: 'ab', label: '6. Teste A/B', icon: Shuffle, color: '#475569' },
                  { id: 'pixels', label: '7. Pixels', icon: Code2, color: '#10b981' },
                  { id: 'socialproof', label: '8. Prova Social', icon: BellRing, color: '#d97706' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
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

            <div className="card-body p-4">
              {/* TAB 1: GERAL & TEXTOS */}
              {activeTab === 'general' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <span>Identificação da Página</span>
                      </h6>
                      <p className="uf-section-desc">
                        Defina o nome da sua página e o link de acesso público.
                      </p>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-7">
                      <label className="uf-form-label">
                        Nome da Página <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Ex: Comunidade Oficial"
                      />
                      <div className="uf-form-hint">Nome interno para você identificar esta página no painel.</div>
                    </div>
                    <div className="col-md-5">
                      <label className="uf-form-label">Endereço da Página (Link)</label>
                      <div className="input-group">
                        <span className="input-group-text small">/p/</span>
                        <input
                          type="text"
                          className="form-control"
                          value={form.slug}
                          onChange={(e) => updateField('slug', e.target.value)}
                          placeholder="ex: comunidade"
                        />
                      </div>
                      <div className="uf-form-hint">Deixe vazio para gerar automaticamente com base no nome.</div>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="uf-form-label">Status da Página</label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) => updateField('status', e.target.value)}
                      >
                        <option value="active">🟢 Ativa (Pública e acessível)</option>
                        <option value="inactive">🔴 Inativa (Página pausada)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="uf-form-label">Rastreamento de Tráfego</label>
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="switch-utm"
                          checked={Boolean(form.pass_utm_params)}
                          onChange={(e) => updateField('pass_utm_params', e.target.checked ? 1 : 0)}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="switch-utm" style={{ color: 'var(--text-main)' }}>
                          Repassar parâmetros UTMs nos botões
                        </label>
                      </div>
                      <div className="uf-form-hint">Preserva UTMs de anúncios nos links dos botões.</div>
                    </div>
                  </div>

                  {/* Section 2: Textos da Página */}
                  <div className="uf-section-header mt-4">
                    <div>
                      <h6 className="uf-section-title">
                        <Type size={16} className="text-primary" />
                        <span>Textos Principais da Página</span>
                      </h6>
                      <p className="uf-section-desc">
                        Defina o selo, título, subtítulo e rodapé exibidos para o visitante.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    {/* Campo 1: Título Principal */}
                    <div className="uf-form-block">
                      <div className="uf-form-block-header">
                        <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                          <Heading size={14} className="text-primary" /> Título Principal
                        </span>
                        <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                          Destaque
                        </span>
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-control fw-bold"
                          value={form.headline}
                          onChange={(e) => updateField('headline', e.target.value)}
                          placeholder="Ex: Cherminho"
                          style={{ fontSize: '1.05rem' }}
                        />
                        <div className="uf-form-hint">O nome ou frase que mais chama atenção no topo da página.</div>
                      </div>
                    </div>

                    {/* Campo 2: Subtítulo */}
                    <div className="uf-form-block">
                      <div className="uf-form-block-header">
                        <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                          <AlignLeft size={14} className="text-primary" /> Subtítulo da Página
                        </span>
                        <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                          Abaixo do Título
                        </span>
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-control"
                          value={form.subheadline}
                          onChange={(e) => updateField('subheadline', e.target.value)}
                          placeholder="Ex: ACESSO EXCLUSIVO"
                        />
                        <div className="uf-form-hint">Texto explicativo logo abaixo do título principal.</div>
                      </div>
                    </div>

                    {/* Campo 3: Selo Superior */}
                    <div className="uf-form-block">
                      <div className="uf-form-block-header">
                        <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                          <Tag size={14} className="text-primary" /> Selo Superior (Opcional)
                        </span>
                        <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                          Topo
                        </span>
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-control"
                          value={form.badge_text}
                          onChange={(e) => updateField('badge_text', e.target.value)}
                          placeholder="Ex: COMUNIDADE OFICIAL"
                        />
                        <div className="uf-form-hint">Pequena tag no topo do card. Deixe vazio se não quiser usar.</div>
                      </div>
                    </div>

                    {/* Campo 4: Rodapé */}
                    <div className="uf-form-block">
                      <div className="uf-form-block-header">
                        <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                          <FileText size={14} className="text-primary" /> Frase de Rodapé (Opcional)
                        </span>
                        <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10.5px' }}>
                          Rodapé
                        </span>
                      </div>
                      <div>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={form.footer_text}
                          onChange={(e) => updateField('footer_text', e.target.value)}
                          placeholder="Ex: CONTEÚDO EM PRIMEIRA MÃO SÓ PRA QUEM ESTÁ DENTRO"
                        />
                        <div className="uf-form-hint">Texto exibido abaixo dos botões no rodapé.</div>
                      </div>
                    </div>

                    {/* Accordion: Tipografia e Cores Individuais (Recolhível) */}
                    <div className="uf-form-block mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedTypography(!showAdvancedTypography)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          outline: 'none',
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span>⚙️</span>
                          <span className="fw-bold small" style={{ color: 'var(--text-main)' }}>Tamanhos de Fonte e Cores Específicas</span>
                          <span className="badge rounded-pill" style={{ background: 'var(--surface-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '10px' }}>
                            Opcional
                          </span>
                        </div>
                        <span className="small fw-bold" style={{ color: 'var(--text-muted)' }}>{showAdvancedTypography ? '▲ Recolher' : '▼ Expandir'}</span>
                      </button>

                      {showAdvancedTypography && (
                        <div className="pt-3 mt-3 border-top d-flex flex-column gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                          {/* Ajustes do Título */}
                          <div>
                            <span className="small fw-bold d-block mb-2" style={{ color: 'var(--text-main)' }}>Título Principal:</span>
                            <div className="row g-2">
                              <div className="col-md-6">
                                <label className="uf-form-label">Tamanho da Fonte</label>
                                <select
                                  className="form-select"
                                  value={form.headline_font_size}
                                  onChange={(e) => updateField('headline_font_size', e.target.value)}
                                >
                                  <option value="20px">20px (Compacto)</option>
                                  <option value="24px">24px (Médio)</option>
                                  <option value="28px">28px (Grande)</option>
                                  <option value="30px">30px (Padrão)</option>
                                  <option value="34px">34px (Extra Grande)</option>
                                  <option value="38px">38px (Super Destaque)</option>
                                  <option value="42px">42px (Gigante)</option>
                                </select>
                              </div>
                              <div className="col-md-6">
                                <label className="uf-form-label">Cor do Título</label>
                                <div className="uf-color-picker-box">
                                  <input
                                    type="color"
                                    value={form.headline_color}
                                    onChange={(e) => updateField('headline_color', e.target.value)}
                                  />
                                  <span className="small font-monospace" style={{ color: 'var(--text-main)' }}>{form.headline_color}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Ajustes do Subtítulo */}
                          <div className="pt-2 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                            <span className="small fw-bold d-block mb-2" style={{ color: 'var(--text-main)' }}>Subtítulo:</span>
                            <div className="row g-2">
                              <div className="col-md-6">
                                <label className="uf-form-label">Tamanho da Fonte</label>
                                <select
                                  className="form-select"
                                  value={form.subheadline_font_size}
                                  onChange={(e) => updateField('subheadline_font_size', e.target.value)}
                                >
                                  <option value="10px">10px (Pequeno)</option>
                                  <option value="11px">11px (Compacto)</option>
                                  <option value="12px">12px (Padrão)</option>
                                  <option value="13px">13px (Médio)</option>
                                  <option value="14px">14px (Grande)</option>
                                  <option value="16px">16px (Extra Grande)</option>
                                </select>
                              </div>
                              <div className="col-md-6">
                                <label className="uf-form-label">Cor do Subtítulo</label>
                                <div className="uf-color-picker-box">
                                  <input
                                    type="color"
                                    value={form.subheadline_color}
                                    onChange={(e) => updateField('subheadline_color', e.target.value)}
                                  />
                                  <span className="small font-monospace" style={{ color: 'var(--text-main)' }}>{form.subheadline_color}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Ajustes do Selo */}
                          <div className="pt-2 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                            <span className="small fw-bold d-block mb-2" style={{ color: 'var(--text-main)' }}>Selo Superior:</span>
                            <div className="row g-2 mb-2">
                              <div className="col-md-6">
                                <label className="uf-form-label">Tamanho da Fonte</label>
                                <select
                                  className="form-select"
                                  value={form.badge_font_size}
                                  onChange={(e) => updateField('badge_font_size', e.target.value)}
                                >
                                  <option value="8.5px">8.5px (Muito Pequeno)</option>
                                  <option value="9.5px">9.5px (Pequeno)</option>
                                  <option value="10px">10px (Padrão)</option>
                                  <option value="11px">11px (Médio)</option>
                                  <option value="12px">12px (Grande)</option>
                                  <option value="13px">13px (Extra Grande)</option>
                                </select>
                              </div>
                              <div className="col-md-6">
                                <label className="uf-form-label">Cor do Texto</label>
                                <div className="uf-color-picker-box">
                                  <input
                                    type="color"
                                    value={form.badge_text_color}
                                    onChange={(e) => updateField('badge_text_color', e.target.value)}
                                  />
                                  <span className="small font-monospace" style={{ color: 'var(--text-main)' }}>{form.badge_text_color}</span>
                                </div>
                              </div>
                            </div>
                            <div className="row g-2">
                              <div className="col-12">
                                <label className="uf-form-label">Fundo Personalizado do Selo (Opcional)</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={form.badge_bg_color}
                                  onChange={(e) => updateField('badge_bg_color', e.target.value)}
                                  placeholder="Ex: rgba(0,0,0,0.85)"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Ajustes do Rodapé */}
                          <div className="pt-2 border-top" style={{ borderColor: 'var(--border-subtle)' }}>
                            <span className="small fw-bold d-block mb-2" style={{ color: 'var(--text-main)' }}>Rodapé:</span>
                            <div className="row g-2">
                              <div className="col-md-6">
                                <label className="uf-form-label">Tamanho da Fonte</label>
                                <select
                                  className="form-select"
                                  value={form.footer_font_size}
                                  onChange={(e) => updateField('footer_font_size', e.target.value)}
                                >
                                  <option value="8px">8px (Micro)</option>
                                  <option value="9px">9px (Muito Pequeno)</option>
                                  <option value="10px">10px (Pequeno)</option>
                                  <option value="11px">11px (Padrão)</option>
                                  <option value="12px">12px (Médio)</option>
                                  <option value="13px">13px (Grande)</option>
                                </select>
                              </div>
                              <div className="col-md-6">
                                <label className="uf-form-label">Cor do Texto</label>
                                <div className="uf-color-picker-box">
                                  <input
                                    type="color"
                                    value={form.footer_text_color}
                                    onChange={(e) => updateField('footer_text_color', e.target.value)}
                                  />
                                  <span className="small font-monospace" style={{ color: 'var(--text-main)' }}>{form.footer_text_color}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BOTÕES DINÂMICOS */}
              {activeTab === 'buttons' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <span>Botões de Ação & Links</span>
                      </h6>
                      <p className="uf-section-desc">
                        Adicione e personalize os botões que direcionam para WhatsApp, Telegram ou Checkout.
                      </p>
                    </div>
                    <button type="button" className="btn btn-sm btn-success shadow-sm d-flex align-items-center gap-1.5" onClick={addButton}>
                      <Plus size={15} /> Adicionar Botão
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    {form.buttons.map((btn, idx) => {
                      const isHidden = Boolean(btn.hidden || btn.is_hidden);
                      const isCollapsed = Boolean(collapsedCards[idx]);

                      return (
                        <div
                          key={btn.id || idx}
                          className="uf-form-block"
                          style={{
                            borderStyle: isHidden ? 'dashed' : 'solid',
                            borderColor: isHidden ? '#fbbf24' : 'var(--border-subtle)',
                            opacity: isHidden ? 0.85 : 1,
                          }}
                        >
                          {/* Toolbar do Botão */}
                          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-light border p-1 d-flex align-items-center justify-content-center"
                                style={{ width: '28px', height: '28px', background: 'var(--surface-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }}
                                onClick={() => toggleCollapse(idx)}
                                title={isCollapsed ? 'Expandir campos deste botão' : 'Recolher campos deste botão'}
                              >
                                {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                              </button>

                              <span className="badge bg-primary rounded-pill">#{idx + 1}</span>
                              <span className="fw-bold small" style={{ color: 'var(--text-main)' }}>{btn.main_text || `Botão ${idx + 1}`}</span>

                              {isHidden && (
                                <span
                                  className="badge rounded-pill fw-bold d-inline-flex align-items-center gap-1"
                                  style={{
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: '#b45309',
                                    border: '1px solid rgba(245, 158, 11, 0.35)',
                                    fontSize: '10.5px',
                                  }}
                                  title="Este botão está oculto na página pública"
                                >
                                  <EyeOff size={11} /> Oculto na Página
                                </span>
                              )}
                            </div>

                            <div className="d-flex align-items-center gap-1">
                              {/* Botão de Ocultar / Exibir */}
                              <button
                                type="button"
                                className={`btn btn-sm p-1 px-2.5 border d-inline-flex align-items-center gap-1.5 rounded-2 ${
                                  isHidden
                                    ? 'btn-warning text-dark fw-bold shadow-sm'
                                    : 'btn-outline-secondary'
                                }`}
                                onClick={() => updateButtonField(idx, 'hidden', !isHidden)}
                                title={
                                  isHidden
                                    ? 'Botão Oculto: Clique para reexibir na página pública'
                                    : 'Ocultar Botão: Não será exibido na página pública para os visitantes'
                                }
                              >
                                {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                                <span style={{ fontSize: '11px' }}>{isHidden ? 'Oculto' : 'Ocultar'}</span>
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-light border p-1 px-2"
                                style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }}
                                onClick={() => moveButton(idx, -1)}
                                title="Subir Posição"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-light border p-1 px-2"
                                style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }}
                                onClick={() => moveButton(idx, 1)}
                                title="Descer Posição"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger border-0 p-1 ms-1"
                                onClick={() => removeButton(idx)}
                                title="Remover Botão"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Card Body (Collapsible) */}
                          {!isCollapsed && (
                            <div className="pt-1">
                              {/* Linha 1 */}
                              <div className="row g-2 mb-2">
                                <div className="col-md-6">
                                  <label className="form-label small fw-bold mb-1">
                                    Texto Principal <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={btn.main_text}
                                    onChange={(e) => updateButtonField(idx, 'main_text', e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small fw-bold mb-1">Tam. Fonte</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={btn.main_text_size || '15px'}
                                    onChange={(e) => updateButtonField(idx, 'main_text_size', e.target.value)}
                                  >
                                    <option value="12px">12px</option>
                                    <option value="13px">13px</option>
                                    <option value="14px">14px</option>
                                    <option value="15px">15px (Padrão)</option>
                                    <option value="16px">16px</option>
                                    <option value="17px">17px</option>
                                    <option value="18px">18px</option>
                                    <option value="20px">20px</option>
                                  </select>
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small fw-bold mb-1">Cor do Texto</label>
                                  <input
                                    type="color"
                                    className="form-control form-control-color form-control-sm border-0 w-100"
                                    value={btn.text_color || '#ffffff'}
                                    onChange={(e) => updateButtonField(idx, 'text_color', e.target.value)}
                                  />
                                </div>
                              </div>

                              {/* Linha 2 */}
                              <div className="row g-2 mb-2">
                                <div className="col-md-6">
                                  <label className="form-label small fw-bold mb-1">Subtexto (Opcional)</label>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={btn.sub_text || ''}
                                    onChange={(e) => updateButtonField(idx, 'sub_text', e.target.value)}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small fw-bold mb-1">Tam. Subtexto</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={btn.sub_text_size || '11px'}
                                    onChange={(e) => updateButtonField(idx, 'sub_text_size', e.target.value)}
                                  >
                                    <option value="9px">9px</option>
                                    <option value="10px">10px</option>
                                    <option value="11px">11px (Padrão)</option>
                                    <option value="12px">12px</option>
                                    <option value="13px">13px</option>
                                    <option value="14px">14px</option>
                                  </select>
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small fw-bold mb-1">Cor Subtexto</label>
                                  <input
                                    type="color"
                                    className="form-control form-control-color form-control-sm border-0 w-100"
                                    value={btn.sub_text_color || '#ffffff'}
                                    onChange={(e) => updateButtonField(idx, 'sub_text_color', e.target.value)}
                                  />
                                </div>
                              </div>

                              {/* Linha 3 */}
                              <div className="row g-2 mb-2">
                                <div className="col-md-6">
                                  <label className="form-label small fw-bold mb-1">
                                    Link de Destino <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="url"
                                    className="form-control form-control-sm"
                                    value={btn.url}
                                    onChange={(e) => updateButtonField(idx, 'url', e.target.value)}
                                    placeholder="https://chat.whatsapp.com/..."
                                    required
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small fw-bold mb-1">Ícone</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={btn.icon || 'whatsapp'}
                                    onChange={(e) => updateButtonField(idx, 'icon', e.target.value)}
                                  >
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="telegram">Telegram</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="cart">Carrinho / Compra</option>
                                    <option value="star">VIP / Estrela</option>
                                    <option value="globe">Site / Link</option>
                                  </select>
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small fw-bold mb-1">Estilo</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={btn.type || 'primary'}
                                    onChange={(e) => updateButtonField(idx, 'type', e.target.value)}
                                  >
                                    <option value="primary">⭐ Principal</option>
                                    <option value="secondary">🌙 Dark Glass</option>
                                    <option value="outline">✨ Outline</option>
                                  </select>
                                </div>
                              </div>

                              {/* Linha 4 */}
                              <div className="row g-2 align-items-end">
                                <div className="col-md-6">
                                  <label className="form-label small fw-bold mb-1">Efeito / Animação</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={btn.animation || 'pulse'}
                                    onChange={(e) => updateButtonField(idx, 'animation', e.target.value)}
                                  >
                                    <option value="pulse">Pulso Suave (Cor do Botão)</option>
                                    <option value="glow">Brilho Glow</option>
                                    <option value="bounce">Bounce / Salto</option>
                                    <option value="none">Nenhuma</option>
                                  </select>
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label small fw-bold mb-1">Cor do Fundo / Destaque</label>
                                  <div className="d-flex align-items-center gap-2">
                                    <input
                                      type="color"
                                      className="form-control form-control-color form-control-sm border-0 w-100"
                                      value={btn.bg_color || '#22c55e'}
                                      onChange={(e) => updateButtonField(idx, 'bg_color', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: MÍDIAS & CORES */}
              {activeTab === 'visual' && (
                <div>
                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <span>Foto de Perfil (Avatar)</span>
                      </h6>
                      <p className="uf-section-desc">
                        A foto central do perfil que aparece em destaque no topo da página presell.
                      </p>
                    </div>
                  </div>

                  <div className="row g-3 mb-4 align-items-center">
                    <div className="col-md-7">
                      <label className="uf-form-label">URL da Imagem do Avatar</label>
                      <input
                        type="text"
                        className="form-control mb-2"
                        value={form.avatar_url}
                        onChange={(e) => updateField('avatar_url', e.target.value)}
                        placeholder="https://exemplo.com/avatar.jpg"
                      />
                      <label className="uf-form-label" style={{ color: 'var(--text-muted)' }}>Ou upload do computador / celular:</label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          disabled={uploadingField === 'avatar_url'}
                          onChange={(e) => handleFileUpload(e, 'avatar_url')}
                        />
                        {uploadingField === 'avatar_url' && (
                          <div className="spinner-border spinner-border-sm text-primary" role="status" />
                        )}
                      </div>
                    </div>
                    <div className="col-md-5 text-center">
                      <div className="p-3 rounded-4 d-inline-block border" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                        <div
                          className="rounded-circle overflow-hidden mx-auto shadow-sm"
                          style={{
                            width: '80px',
                            height: '80px',
                            border: `3px solid ${form.glow_color}`,
                          }}
                        >
                          <img
                            src={avatarDisplay}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.src = '/uploads/presells/cherminho_avatar.jpg';
                            }}
                          />
                        </div>
                        <div className="small text-muted mt-2">Prévia do Avatar</div>
                      </div>
                    </div>
                  </div>

                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <span>Plano de Fundo (Wallpaper)</span>
                      </h6>
                      <p className="uf-section-desc">
                        Personalize a imagem de fundo e controle a opacidade para garantir leitura perfeita.
                      </p>
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-7">
                      <label className="uf-form-label">URL da Imagem de Fundo</label>
                      <input
                        type="text"
                        className="form-control mb-2"
                        value={form.background_url}
                        onChange={(e) => updateField('background_url', e.target.value)}
                        placeholder="https://exemplo.com/fundo.jpg ou /uploads/..."
                      />
                      <label className="uf-form-label" style={{ color: 'var(--text-muted)' }}>Ou upload de imagem de fundo:</label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          disabled={uploadingField === 'background_url'}
                          onChange={(e) => handleFileUpload(e, 'background_url')}
                        />
                        {uploadingField === 'background_url' && (
                          <div className="spinner-border spinner-border-sm text-primary" role="status" />
                        )}
                      </div>

                      {/* Prévia do Wallpaper Carregado */}
                      {form.background_url && (
                        <div className="mt-3 p-2.5 rounded-3 border d-flex align-items-center gap-3" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                          <div
                            style={{
                              width: '54px',
                              height: '54px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1px solid var(--border-subtle)',
                              flexShrink: 0,
                              background: '#090d16',
                            }}
                          >
                            <img
                              src={form.background_url}
                              alt="Fundo"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <div className="small fw-bold text-success d-flex align-items-center gap-1">
                              <CheckCircle2 size={13} /> Imagem Ativa
                            </div>
                            <div className="text-muted small text-truncate" style={{ fontSize: '11px', maxWidth: '240px' }}>
                              {form.background_url}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger border-0 px-2 py-1"
                            onClick={() => updateField('background_url', '')}
                            title="Remover imagem de fundo"
                            style={{ fontSize: '12px' }}
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="col-md-5">
                      <label className="uf-form-label">Opacidade do Fundo Escuro</label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="range"
                          className="form-range"
                          min={0}
                          max={95}
                          value={form.bg_overlay_opacity}
                          onChange={(e) => updateField('bg_overlay_opacity', parseInt(e.target.value, 10))}
                        />
                        <span className="badge bg-dark px-2.5 py-1">{form.bg_overlay_opacity}%</span>
                      </div>
                      <div className="uf-form-hint">Dica: entre 40% e 70% dá o contraste ideal para ler os botões.</div>
                    </div>
                  </div>

                  <div className="uf-section-header">
                    <div>
                      <h6 className="uf-section-title">
                        <span>Cores Globais & Destaques</span>
                      </h6>
                      <p className="uf-section-desc">
                        Cores de destaque geral e brilho do avatar.
                      </p>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="uf-form-label">Cor de Destaque Geral</label>
                      <div className="uf-color-picker-box">
                        <input
                          type="color"
                          value={form.accent_color}
                          onChange={(e) => updateField('accent_color', e.target.value)}
                        />
                        <span className="small font-monospace" style={{ color: 'var(--text-main)' }}>{form.accent_color}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <label className="uf-form-label">Brilho do Avatar (Glow)</label>
                      <div className="uf-color-picker-box">
                        <input
                          type="color"
                          value={form.glow_color}
                          onChange={(e) => updateField('glow_color', e.target.value)}
                        />
                        <span className="small font-monospace" style={{ color: 'var(--text-main)' }}>{form.glow_color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: VÍDEO & DELAY */}
              {activeTab === 'video' && (
                <div>
                  <div className="uf-section-header">
                    <div className="uf-section-title">
                      <PlayCircle size={18} className="text-danger" />
                      <span>Player de Vídeo (VSL)</span>
                    </div>
                    <div className="uf-section-desc">
                      Configure o vídeo principal exibido aos visitantes no topo da presell.
                    </div>
                  </div>

                  <div className="uf-form-block">
                    <div className="row g-3">
                      <div className="col-md-5">
                        <label className="uf-form-label">Tipo de Vídeo</label>
                        <select
                          className="form-select"
                          value={form.video_type}
                          onChange={(e) => updateField('video_type', e.target.value)}
                        >
                          <option value="none">Nenhum (Apenas Imagem/Avatar)</option>
                          <option value="youtube">YouTube (Camuflado / No-Cookie)</option>
                          <option value="vimeo">Vimeo (Player Sem Controles)</option>
                          <option value="mp4">MP4 Direto (Hospedado / URL)</option>
                          <option value="embed">Código Embed (Panda Video, VTurb, etc.)</option>
                        </select>
                      </div>
                      <div className="col-md-7">
                        <label className="uf-form-label">URL ou Código Embed do Vídeo</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.video_url}
                          onChange={(e) => updateField('video_url', e.target.value)}
                          placeholder="https://youtu.be/... ou link direto"
                        />
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <div className="form-check form-switch p-3 border rounded-3" style={{ background: 'var(--surface-input)', borderColor: 'var(--border-subtle)' }}>
                          <input
                            className="form-check-input ms-0 me-2"
                            type="checkbox"
                            id="sw-autoplay"
                            checked={Boolean(form.video_autoplay)}
                            onChange={(e) => updateField('video_autoplay', e.target.checked ? 1 : 0)}
                          />
                          <label className="form-check-label uf-form-label mb-0" htmlFor="sw-autoplay">
                            Autoplay com Áudio Mudo
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch p-3 border rounded-3" style={{ background: 'var(--surface-input)', borderColor: 'var(--border-subtle)' }}>
                          <input
                            className="form-check-input ms-0 me-2"
                            type="checkbox"
                            id="sw-sound"
                            checked={Boolean(form.video_sound_banner)}
                            onChange={(e) => updateField('video_sound_banner', e.target.checked ? 1 : 0)}
                          />
                          <label className="form-check-label uf-form-label mb-0" htmlFor="sw-sound">
                            Banner "Clique para Ouvir / Ativar Som"
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="uf-section-header mt-4">
                    <div className="uf-section-title">
                      <Clock size={18} className="text-warning" />
                      <span>Delay dos Botões (Pitch de Vendas)</span>
                    </div>
                    <div className="uf-section-desc">
                      Segure a exibição dos botões de ação até o momento certo da apresentação.
                    </div>
                  </div>

                  <div className="uf-form-block">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-check form-switch p-3 border rounded-3 h-100" style={{ background: 'var(--surface-input)', borderColor: 'var(--border-subtle)' }}>
                          <input
                            className="form-check-input ms-0 me-2"
                            type="checkbox"
                            id="sw-pitch"
                            checked={Boolean(form.pitch_delay_enabled)}
                            onChange={(e) => updateField('pitch_delay_enabled', e.target.checked ? 1 : 0)}
                          />
                          <label className="form-check-label uf-form-label mb-1" htmlFor="sw-pitch">
                            Ativar Delay dos Botões
                          </label>
                          <div className="uf-form-hint">
                            Esconde os botões e exibe quando o tempo programado for atingido.
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 border rounded-3" style={{ background: 'var(--surface-input)', borderColor: 'var(--border-subtle)' }}>
                          <label className="uf-form-label mb-1">Tempo de Espera (Segundos)</label>
                          <div className="input-group input-group-sm mb-2">
                            <input
                              type="number"
                              className="form-control"
                              min={0}
                              value={form.pitch_delay_seconds}
                              onChange={(e) => updateField('pitch_delay_seconds', parseInt(e.target.value, 10))}
                            />
                            <span className="input-group-text">segundos</span>
                          </div>
                          <div className="form-check form-switch small">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="sw-resume"
                              checked={Boolean(form.pitch_delay_resume)}
                              onChange={(e) => updateField('pitch_delay_resume', e.target.checked ? 1 : 0)}
                            />
                            <label className="form-check-label text-muted" htmlFor="sw-resume">
                              <strong>Retomada Inteligente:</strong> Se o visitante recarregar, não atrasar novamente.
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CLOAKER */}
              {activeTab === 'cloak' && (
                <div>
                  <h6 className="fw-bold border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between" style={{ color: 'var(--text-main)', borderColor: 'var(--border-subtle)' }}>
                    <span className="d-flex align-items-center gap-1.5">
                      <ShieldCheck size={18} className="text-info" />
                      <span>Proteção Anti-Bot Avançada (Cloaker Shield)</span>
                    </span>
                    <span className={`badge ${form.cloak_enabled ? 'bg-success' : 'bg-secondary'} px-2.5 py-1.5 fw-bold`} style={{ fontSize: '11px' }}>
                      {form.cloak_enabled ? 'ESCUDO ATIVO' : 'ESCUDO DESATIVADO'}
                    </span>
                  </h6>

                  {/* Master Cloaker Switch Card */}
                  <div
                    className="p-3 border rounded-3 mb-4 shadow-xs"
                    style={{
                      background: form.cloak_enabled ? 'rgba(59, 130, 246, 0.08)' : 'var(--surface-subtle)',
                      borderColor: form.cloak_enabled ? 'rgba(59, 130, 246, 0.35)' : 'var(--border-subtle)',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input ms-0 me-2.5"
                          type="checkbox"
                          id="sw-cloak"
                          checked={Boolean(form.cloak_enabled)}
                          onChange={(e) => updateField('cloak_enabled', e.target.checked ? 1 : 0)}
                          style={{ cursor: 'pointer', width: '2.5em', height: '1.3em' }}
                        />
                        <label className="form-check-label fw-bold" htmlFor="sw-cloak" style={{ color: 'var(--text-main)', cursor: 'pointer' }}>
                          Ativar Camuflador Anti-Bot (Cloaker Shield)
                        </label>
                        <div className="text-muted small mt-0.5">
                          Filtra requisições de robôs, crawlers de anúncios e ferramentas espiãs, direcionando revisores para uma página segura pré-aprovada.
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-1.5 mt-2.5 pt-2 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                      <span className="badge bg-light text-muted border small">Meta Ads (Facebook/Instagram)</span>
                      <span className="badge bg-light text-muted border small">Googlebot & AdsBot</span>
                      <span className="badge bg-light text-muted border small">TikTok Bot</span>
                      <span className="badge bg-light text-muted border small">AdHeart & AdSpy</span>
                      <span className="badge bg-light text-muted border small">Semrush & Ahrefs</span>
                      <span className="badge bg-light text-muted border small">Puppeteer / Selenium</span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="mb-4">
                    <label className="form-label small fw-bold mb-1.5" style={{ color: 'var(--text-main)' }}>
                      Ação quando Detectar Robô / Revisor de Anúncios
                    </label>
                    <div className="row g-2">
                      {[
                        {
                          id: 'white_page',
                          icon: FileText,
                          title: 'Página White Segura',
                          desc: 'Exibe um artigo editorial institucional seguro no mesmo domínio (Ideal para aprovação rápida).',
                        },
                        {
                          id: 'safe_redirect',
                          icon: ExternalLink,
                          title: 'Redirecionamento Externo',
                          desc: 'Envia revisores e robôs para um portal externo confiável (ex: G1, Wikipedia, CNN).',
                        },
                        {
                          id: 'block_404',
                          icon: ShieldAlert,
                          title: 'Bloquear com Erro 404',
                          desc: 'Simula que a página foi excluída ou não existe para despistar ferramentas espiãs.',
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = form.cloak_mode === item.id;
                        return (
                          <div key={item.id} className="col-12 col-md-4">
                            <div
                              onClick={() => updateField('cloak_mode', item.id)}
                              className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between"
                              style={{
                                cursor: 'pointer',
                                background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-card)',
                                borderColor: isSelected ? '#10b981' : 'var(--border-subtle)',
                                boxShadow: isSelected ? '0 0 0 1px #10b981' : 'none',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div>
                                <div className="d-flex align-items-center justify-content-between mb-1.5">
                                  <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: isSelected ? '#10b981' : 'var(--text-main)' }}>
                                    <Icon size={16} />
                                    <span>{item.title}</span>
                                  </span>
                                  {isSelected && <span className="badge bg-primary text-white rounded-circle p-1"><Check size={10} /></span>}
                                </div>
                                <div className="text-muted small" style={{ fontSize: '11px', lineHeight: 1.4 }}>
                                  {item.desc}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CONDITIONAL SECTION 1: White Page Content */}
                  {form.cloak_mode === 'white_page' && (
                    <div className="border rounded-3 p-3 mb-4 shadow-xs" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 pb-2 mb-3 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                          <FileText size={15} className="text-primary" />
                          <span>Conteúdo da Página Segura (White Page)</span>
                        </span>
                        {isEdit && form.slug && (
                          <a
                            href={`/p/${form.slug}?test_white=1`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-xs btn-outline-primary d-inline-flex align-items-center gap-1 py-1 px-2.5"
                            style={{ fontSize: '11px', borderRadius: '6px' }}
                            title="Abre a visualização exata do que o robô do Facebook/Google enxerga"
                          >
                            <Eye size={12} /> Testar Visão do Revisor
                          </a>
                        )}
                      </div>

                      {/* Templates rápidos com 1 clique */}
                      <div className="mb-3 p-2.5 rounded-2 border" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                        <div className="small fw-bold mb-1.5 d-flex align-items-center gap-1" style={{ color: 'var(--text-main)', fontSize: '11.5px' }}>
                          <Sparkles size={13} className="text-warning" />
                          <span>Preencher Artigo Pré-Aprovado com 1 Clique (Modelos Prontos):</span>
                        </div>
                        <div className="d-flex flex-wrap gap-1.5">
                          {Object.values(WHITE_PAGE_TEMPLATES).map((tmpl) => (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => handleApplyWhiteTemplate(tmpl.id)}
                              className="btn btn-xs btn-outline-secondary py-1 px-2.5"
                              style={{ fontSize: '11px', borderRadius: '6px' }}
                            >
                              {tmpl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="uf-form-label">Título do Artigo / Notícia Segura</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.cloak_white_headline}
                          onChange={(e) => updateField('cloak_white_headline', e.target.value)}
                          placeholder="Ex: Como a Transformação Digital e Ferramentas Inteligentes Otimizam o Dia a Dia"
                        />
                      </div>

                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <label className="uf-form-label mb-0">Texto Editorial Seguro (HTML Permitido)</label>
                          <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                            Pode conter títulos &lt;h3&gt;, parágrafos &lt;p&gt; e listas &lt;ul&gt;
                          </span>
                        </div>
                        <textarea
                          className="form-control font-monospace small"
                          rows={6}
                          value={form.cloak_white_content}
                          onChange={(e) => updateField('cloak_white_content', e.target.value)}
                          placeholder="Conteúdo informativo editorial pré-aprovado..."
                        />
                      </div>
                    </div>
                  )}

                  {/* CONDITIONAL SECTION 2: Safe External Redirect */}
                  {form.cloak_mode === 'safe_redirect' && (
                    <div className="border rounded-3 p-3 mb-4 shadow-xs" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                      <span className="fw-bold small d-flex align-items-center gap-1.5 mb-2 pb-2 border-bottom" style={{ color: 'var(--text-main)', borderColor: 'var(--border-subtle)' }}>
                        <ExternalLink size={15} className="text-primary" />
                        <span>URL de Redirecionamento Seguro</span>
                      </span>

                      <div className="mb-3">
                        <label className="uf-form-label">Destino Externo para Robôs e Revisores</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.cloak_white_url}
                          onChange={(e) => updateField('cloak_white_url', e.target.value)}
                          placeholder="https://g1.globo.com ou portal institucional confiável"
                        />
                      </div>

                      {/* Quick URL Suggestions */}
                      <div>
                        <span className="small text-muted d-block mb-1.5" style={{ fontSize: '11px' }}>
                          Sugestões Rápidas de Portais de Alta Confiança:
                        </span>
                        <div className="d-flex flex-wrap gap-1.5">
                          {[
                            { label: 'G1 Globo', url: 'https://g1.globo.com' },
                            { label: 'Wikipedia Brasil', url: 'https://pt.wikipedia.org' },
                            { label: 'CNN Brasil', url: 'https://www.cnnbrasil.com.br' },
                            { label: 'TechTudo', url: 'https://www.techtudo.com.br' },
                          ].map((sug) => (
                            <button
                              key={sug.label}
                              type="button"
                              onClick={() => handleSetRedirectPreset(sug.url)}
                              className="btn btn-xs btn-outline-secondary py-1 px-2.5"
                              style={{ fontSize: '11px', borderRadius: '6px' }}
                            >
                              {sug.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONDITIONAL SECTION 3: 404 Block Info */}
                  {form.cloak_mode === 'block_404' && (
                    <div className="border rounded-3 p-3 mb-4 text-center" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                      <ShieldAlert size={28} className="text-danger mb-2" />
                      <div className="fw-bold small mb-1" style={{ color: 'var(--text-main)' }}>
                        Modo de Bloqueio Rígido HTTP 404 (Not Found)
                      </div>
                      <p className="text-muted small mb-0 mx-auto" style={{ maxWidth: '520px', fontSize: '11.5px' }}>
                        Qualquer visitante detectado como robô, crawler de anúncio ou IP suspeito receberá um erro 404 real do servidor, como se o link nunca tivesse existido. Ideal para despistar concorrentes e robôs de espionagem.
                      </p>
                    </div>
                  )}

                  {/* FILTROS AVANÇADOS: GEO & CRITÉRIOS DE SEGURANÇA */}
                  <div className="border rounded-3 p-3 shadow-xs" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                    <div className="fw-bold small d-flex align-items-center gap-1.5 mb-3 pb-2 border-bottom" style={{ color: 'var(--text-main)', borderColor: 'var(--border-subtle)' }}>
                      <Globe size={15} className="text-info" />
                      <span>Filtros Geográficos e Critérios de Bloqueio</span>
                    </div>

                    <div className="row g-3">
                      {/* Países Permitidos */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text-main)' }}>
                          Países Permitidos (Siglas ISO separadas por vírgula)
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm mb-1.5"
                          value={form.cloak_allowed_countries}
                          onChange={(e) => updateField('cloak_allowed_countries', e.target.value)}
                          placeholder="Ex: BR ou BR, PT"
                        />
                        <div className="d-flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetCountryPreset('BR')}
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '10.5px', borderRadius: '4px' }}
                          >
                            🇧🇷 Apenas Brasil (BR)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetCountryPreset('BR, PT')}
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '10.5px', borderRadius: '4px' }}
                          >
                            🇧🇷 🇵🇹 Brasil & Portugal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetCountryPreset('')}
                            className="btn btn-xs btn-outline-secondary py-0.5 px-2"
                            style={{ fontSize: '10.5px', borderRadius: '4px' }}
                          >
                            🌍 Sem Restrição (Todos)
                          </button>
                        </div>
                      </div>

                      {/* Switches de Segurança */}
                      <div className="col-12 col-md-6">
                        <div className="d-flex flex-column gap-2">
                          <div
                            className="p-2.5 border rounded-2 d-flex align-items-center justify-content-between"
                            style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}
                          >
                            <div>
                              <div className="fw-bold small" style={{ color: 'var(--text-main)', fontSize: '12px' }}>
                                Filtrar Robôs de Anúncios
                              </div>
                              <div className="text-muted" style={{ fontSize: '10.5px' }}>
                                Bloqueia crawlers do Meta, Google, TikTok e Spy Tools
                              </div>
                            </div>
                            <div className="form-check form-switch mb-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="sw-filter-bots"
                                checked={Boolean(form.cloak_filter_bots)}
                                onChange={(e) => updateField('cloak_filter_bots', e.target.checked ? 1 : 0)}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                          </div>

                          <div
                            className="p-2.5 border rounded-2 d-flex align-items-center justify-content-between"
                            style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}
                          >
                            <div>
                              <div className="fw-bold small" style={{ color: 'var(--text-main)', fontSize: '12px' }}>
                                Filtrar VPNs & Data Centers
                              </div>
                              <div className="text-muted" style={{ fontSize: '10.5px' }}>
                                Bloqueia IPs de servidores da AWS, Google Cloud, Hetzner, etc.
                              </div>
                            </div>
                            <div className="form-check form-switch mb-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="sw-filter-vpn"
                                checked={Boolean(form.cloak_filter_vpn)}
                                onChange={(e) => updateField('cloak_filter_vpn', e.target.checked ? 1 : 0)}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: TESTE A/B */}
              {activeTab === 'ab' && (
                <div>
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-1.5">
                    <Shuffle size={16} className="text-primary" />
                    <span>Teste A/B Automático (Divisão 50% / 50%)</span>
                  </h6>
                  <div className="mb-4">
                    <div className="form-check form-switch p-3 border rounded bg-light">
                      <input
                        className="form-check-input ms-0 me-2"
                        type="checkbox"
                        id="sw-ab"
                        checked={Boolean(form.ab_test_enabled)}
                        onChange={(e) => updateField('ab_test_enabled', e.target.checked ? 1 : 0)}
                      />
                      <label className="form-check-label fw-bold text-dark" htmlFor="sw-ab">
                        Ativar Teste A/B nesta Página
                      </label>
                    </div>
                  </div>

                  <div className="uf-form-block mb-3">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <SlidersHorizontal size={15} className="text-success" />
                        <span>Configuração da Variação B</span>
                      </span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        Alternativa B
                      </span>
                    </div>
                    <div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="uf-form-label">Título Principal (Headline B)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.ab_headline_b}
                            onChange={(e) => updateField('ab_headline_b', e.target.value)}
                            placeholder="Deixe em branco para usar o mesmo"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="uf-form-label">Subtítulo (Subheadline B)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.ab_subheadline_b}
                            onChange={(e) => updateField('ab_subheadline_b', e.target.value)}
                            placeholder="Deixe em branco para usar o mesmo"
                          />
                        </div>
                      </div>

                      {/* Avatar Alternativo B */}
                      <div className="row g-3 mb-3 align-items-center">
                        <div className="col-md-7">
                          <label className="uf-form-label">Foto de Perfil B (Avatar Alternativo)</label>
                          <input
                            type="text"
                            className="form-control mb-2"
                            value={form.ab_avatar_url_b}
                            onChange={(e) => updateField('ab_avatar_url_b', e.target.value)}
                            placeholder="Deixe em branco para usar o mesmo da Variação A"
                          />
                          <label className="uf-form-label" style={{ color: 'var(--text-muted)' }}>Ou upload do computador / celular:</label>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="file"
                              className="form-control form-control-sm"
                              accept="image/*"
                              disabled={uploadingField === 'ab_avatar_url_b'}
                              onChange={(e) => handleFileUpload(e, 'ab_avatar_url_b')}
                            />
                            {uploadingField === 'ab_avatar_url_b' && (
                              <div className="spinner-border spinner-border-sm text-primary" role="status" />
                            )}
                          </div>
                        </div>
                        <div className="col-md-5 text-center">
                          <div className="p-3 bg-light rounded-3 d-inline-block border">
                            <div
                              className="rounded-circle overflow-hidden mx-auto shadow-sm"
                              style={{
                                width: '70px',
                                height: '70px',
                                border: `3px solid ${form.glow_color}`,
                              }}
                            >
                              <img
                                src={form.ab_avatar_url_b || avatarDisplay}
                                alt="Preview B"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.src = '/uploads/presells/cherminho_avatar.jpg';
                                }}
                              />
                            </div>
                            <div className="small text-muted mt-1">Prévia Avatar B</div>
                          </div>
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold">Texto Principal do Botão (Variação B)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.ab_button_text_b}
                            onChange={(e) => updateField('ab_button_text_b', e.target.value)}
                            placeholder="Ex: QUERO ENTRAR AGORA"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold">Subtexto do Botão (Variação B)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.ab_button_subtext_b}
                            onChange={(e) => updateField('ab_button_subtext_b', e.target.value)}
                            placeholder="Ex: Vagas limitadas no grupo VIP"
                          />
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold">Cor de Fundo do Botão B</label>
                          <input
                            type="color"
                            className="form-control form-control-color border-0 w-100"
                            value={form.ab_button_color_b}
                            onChange={(e) => updateField('ab_button_color_b', e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold">Cor do Texto do Botão B</label>
                          <input
                            type="color"
                            className="form-control form-control-color border-0 w-100"
                            value={form.ab_button_text_color_b}
                            onChange={(e) => updateField('ab_button_text_color_b', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: PIXELS */}
              {activeTab === 'pixels' && (
                <div>
                  <div className="uf-section-header">
                    <div className="uf-section-title">
                      <Target size={18} className="text-info" />
                      <span>Rastreamento & Pixels de Tráfego</span>
                    </div>
                    <div className="uf-section-desc">
                      Monitore acessos e conversões integrando seus pixels das principais plataformas.
                    </div>
                  </div>

                  <div className="uf-form-block mb-4">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="uf-form-label">Meta Pixel ID (Facebook)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.meta_pixel_id}
                          onChange={(e) => updateField('meta_pixel_id', e.target.value)}
                          placeholder="Ex: 123456789012345"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="uf-form-label">Google Analytics 4 (GA4)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.ga4_measurement_id}
                          onChange={(e) => updateField('ga4_measurement_id', e.target.value)}
                          placeholder="Ex: G-XXXXXXXXXX"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="uf-form-label">TikTok Pixel ID</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.tiktok_pixel_id}
                          onChange={(e) => updateField('tiktok_pixel_id', e.target.value)}
                          placeholder="Ex: C1234567890"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="uf-section-header">
                    <div className="uf-section-title">
                      <Code2 size={18} className="text-primary" />
                      <span>Scripts Customizados</span>
                    </div>
                    <div className="uf-section-desc">
                      Insira tags adicionais ou scripts JS customizados.
                    </div>
                  </div>

                  <div className="uf-form-block">
                    <div className="mb-3">
                      <label className="uf-form-label">Código no cabeçalho (&lt;head&gt;)</label>
                      <textarea
                        className="form-control font-monospace small"
                        rows={3}
                        value={form.custom_head_code}
                        onChange={(e) => updateField('custom_head_code', e.target.value)}
                        placeholder="<!-- Scripts inseridos no <head> -->"
                      />
                    </div>
                    <div>
                      <label className="uf-form-label">Código no final da página (&lt;body&gt;)</label>
                      <textarea
                        className="form-control font-monospace small"
                        rows={3}
                        value={form.custom_body_code}
                        onChange={(e) => updateField('custom_body_code', e.target.value)}
                        placeholder="<!-- Scripts inseridos antes de </body> -->"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: PROVA SOCIAL */}
              {activeTab === 'socialproof' && (
                <div>
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-1.5">
                    <BellRing size={16} className="text-warning" />
                    <span>Notificações de Prova Social (Compras Fictícias)</span>
                  </h6>
                  <div className="mb-4">
                    <div className="form-check form-switch p-3 border rounded bg-light d-flex align-items-center justify-content-between">
                      <div>
                        <input
                          className="form-check-input ms-0 me-2"
                          type="checkbox"
                          id="sw-sp"
                          checked={Boolean(form.social_proof_enabled)}
                          onChange={(e) => updateField('social_proof_enabled', e.target.checked ? 1 : 0)}
                        />
                        <label className="form-check-label fw-bold text-dark" htmlFor="sw-sp">
                          Ativar Notificações de Pessoas que Compraram
                        </label>
                      </div>
                      <span
                        className={`badge ${form.social_proof_enabled ? 'bg-success' : 'bg-secondary'} px-3 py-2 fw-bold`}
                      >
                        {form.social_proof_enabled ? 'ATIVADO' : 'DESATIVADO'}
                      </span>
                    </div>
                  </div>

                  <div className="uf-form-block mb-3">
                    <div className="uf-form-block-header">
                      <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                        <SlidersHorizontal size={15} className="text-primary" />
                        <span>Frequência & Teste</span>
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-1 px-3 small fw-bold d-inline-flex align-items-center gap-1"
                        onClick={triggerTestSocialProof}
                      >
                        <PlayCircle size={14} />
                        <span>Testar no Celular ao Lado</span>
                      </button>
                    </div>
                    <div>
                      <div className="mb-3">
                        <label className="uf-form-label">Velocidade de Aparição dos Alertas</label>
                        <select
                          className="form-select"
                          value={form.social_proof_interval}
                          onChange={(e) => updateField('social_proof_interval', e.target.value)}
                        >
                          <option value="fast">⚡ Rápido (a cada 4 a 7 segundos)</option>
                          <option value="normal">⏱️ Equilibrado (a cada 6 a 11 segundos) — Recomendado</option>
                          <option value="slow">⏳ Discreto (a cada 12 a 20 segundos)</option>
                        </select>
                      </div>

                      <div className="border rounded-3 p-3 mt-3 shadow-xs" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                        {/* Top bar with count and bulk action buttons */}
                        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
                          <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                            <Users size={16} className="text-success" />
                            <span>{(form.social_proof_buyers || []).length} Compradores Ativos na Rotação</span>
                          </span>
                          <div className="d-flex flex-wrap align-items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleAddExtraBatch}
                              className="btn btn-xs btn-outline-primary d-inline-flex align-items-center gap-1 py-1 px-2"
                              style={{ fontSize: '11px', borderRadius: '6px' }}
                              title="Adicionar mais 25 nomes brasileiros reais à rotação"
                            >
                              <Sparkles size={12} /> +25 Compradores
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowBulkMode(!showBulkMode)}
                              className="btn btn-xs btn-outline-secondary d-inline-flex align-items-center gap-1 py-1 px-2"
                              style={{ fontSize: '11px', borderRadius: '6px' }}
                            >
                              <FileText size={12} /> {showBulkMode ? 'Ocultar Lote' : 'Colar em Massa'}
                            </button>
                            <button
                              type="button"
                              onClick={handleResetBuyers}
                              className="btn btn-xs btn-outline-secondary d-inline-flex align-items-center gap-1 py-1 px-2"
                              style={{ fontSize: '11px', borderRadius: '6px' }}
                              title="Restaurar lista padrão original com 20 pessoas"
                            >
                              <RotateCcw size={12} /> Padrão
                            </button>
                            <button
                              type="button"
                              onClick={handleClearBuyers}
                              className="btn btn-xs btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2"
                              style={{ fontSize: '11px', borderRadius: '6px' }}
                              title="Limpar todos os compradores"
                            >
                              <Trash2 size={12} /> Limpar
                            </button>
                          </div>
                        </div>

                        {/* Bulk Input Box */}
                        {showBulkMode && (
                          <div className="p-3 mb-3 rounded-2 border" style={{ background: 'var(--surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                            <label className="uf-form-label mb-1 fw-bold" style={{ fontSize: '12px' }}>
                              Colar Compradores em Massa (1 por linha)
                            </label>
                            <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                              Formatos aceitos: <code>Nome Sobrenome - Cidade, UF</code> ou <code>Nome Sobrenome (Cidade, UF)</code> ou apenas <code>Nome Sobrenome</code>.
                            </p>
                            <textarea
                              rows={4}
                              className="form-control font-monospace mb-2"
                              style={{ fontSize: '12px' }}
                              placeholder={`Carlos Eduardo - Campinas, SP\nMariana Lima - Curitiba, PR\nJuliana Rocha - Salvador, BA\nPedro Henrique (Belo Horizonte, MG)`}
                              value={bulkBuyersText}
                              onChange={(e) => setBulkBuyersText(e.target.value)}
                            />
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                onClick={() => setShowBulkMode(false)}
                                className="btn btn-xs btn-outline-secondary py-1 px-2.5"
                                style={{ fontSize: '11.5px' }}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={handleApplyBulkBuyers}
                                className="btn btn-xs btn-success py-1 px-3 text-white fw-bold"
                                style={{ fontSize: '11.5px' }}
                              >
                                + Adicionar Todos à Rotação
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Quick Add Person Form */}
                        <form onSubmit={handleAddBuyer} className="row g-2 align-items-center mb-3">
                          <div className="col-12 col-sm-5">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Nome completo (Ex: João Carlos)"
                              value={newBuyerName}
                              onChange={(e) => setNewBuyerName(e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-sm-4">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Cidade, UF (Ex: Curitiba, PR)"
                              value={newBuyerCity}
                              onChange={(e) => setNewBuyerCity(e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-sm-3">
                            <button
                              type="submit"
                              disabled={!newBuyerName.trim()}
                              className="btn btn-sm btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-1"
                              style={{ height: '31px', fontSize: '12px' }}
                            >
                              <Plus size={14} /> Adicionar
                            </button>
                          </div>
                        </form>

                        {/* Interactive Badges Pool with scroll */}
                        <div
                          className="d-flex flex-wrap gap-1.5 p-2 rounded-2 border"
                          style={{
                            background: 'var(--surface-subtle)',
                            borderColor: 'var(--border-subtle)',
                            maxHeight: '220px',
                            overflowY: 'auto',
                          }}
                        >
                          {(form.social_proof_buyers || []).length === 0 ? (
                            <div className="text-center w-100 py-3 text-muted small">
                              Nenhum comprador na rotação. Clique em <strong>&quot;Padrão&quot;</strong> ou cadastre novas pessoas acima.
                            </div>
                          ) : (
                            (form.social_proof_buyers || []).map((buyer, idx) => (
                              <span
                                key={`buyer-${idx}-${buyer.name}`}
                                className="badge d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill shadow-xs"
                                style={{
                                  background: 'var(--surface-card, #ffffff)',
                                  color: 'var(--text-main, #0f172a)',
                                  border: '1px solid var(--border-subtle, #cbd5e1)',
                                  fontSize: '11.5px',
                                  fontWeight: 500,
                                }}
                              >
                                <span>
                                  {buyer.name}{' '}
                                  <span className="text-muted" style={{ fontSize: '10.5px' }}>
                                    ({buyer.city})
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBuyer(idx)}
                                  className="btn p-0 border-0 text-muted d-inline-flex align-items-center justify-content-center"
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    marginLeft: '2px',
                                    cursor: 'pointer',
                                    lineHeight: 1,
                                    opacity: 0.7,
                                  }}
                                  title={`Remover ${buyer.name}`}
                                >
                                  <X size={11} />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card-footer bg-light p-3 d-flex justify-content-between align-items-center border-top">
              <Link href="/admin/presells" className="btn btn-outline-secondary d-inline-flex align-items-center gap-1">
                <X size={14} /> Cancelar
              </Link>
              <div className="d-flex gap-2">
                {isEdit && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
                    disabled={loading}
                  >
                    <ArrowLeft size={14} /> Salvar e Voltar
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  className="btn btn-primary px-4 d-inline-flex align-items-center gap-1"
                  disabled={loading}
                >
                  <Check size={15} />
                  <span>{loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Página'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE PREVIEW MOCKUP (Right Column) */}
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

            {/* PHONE CONTAINER */}
            <div
              className="phone-mockup-wrapper mx-auto shadow-lg position-relative"
              style={{
                maxWidth: '350px',
                height: '640px',
                background: '#000',
                border: '10px solid #1e293b',
                borderRadius: '40px',
                overflow: 'hidden',
              }}
            >
              {/* Dynamic Island / Notch */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '120px',
                  height: '18px',
                  background: '#1e293b',
                  borderBottomLeftRadius: '12px',
                  borderBottomRightRadius: '12px',
                  zIndex: 100,
                }}
              ></div>

              {/* PHONE SCREEN */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '30px 18px',
                  boxSizing: 'border-box',
                  backgroundColor: '#06090e',
                  backgroundImage: form.background_url ? `url('${form.background_url}')` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  gap: '10px',
                }}
              >
                {/* Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `rgba(5, 7, 12, ${form.bg_overlay_opacity / 100})`,
                    zIndex: 1,
                  }}
                ></div>

                {/* Content Stack */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {/* Badge */}
                  <div
                    className="badge-beam-wrapper"
                    style={{
                      '--beam-color': form.badge_text_color,
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        background: form.badge_bg_color || 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: form.badge_text_color,
                          boxShadow: `0 0 8px ${form.badge_text_color}`,
                        }}
                      ></span>
                      <span
                        style={{
                          color: form.badge_text_color,
                          fontSize: form.badge_font_size,
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {form.badge_text}
                      </span>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div
                    className="av-wrapper"
                    style={{
                      '--glow-color': form.glow_color,
                      marginBottom: '10px',
                    }}
                  >
                    <img
                      src={avatarDisplay}
                      alt="Avatar"
                      onError={(e) => {
                        e.currentTarget.src = '/uploads/presells/cherminho_avatar.jpg';
                      }}
                    />
                  </div>

                  {/* Headline */}
                  <h1
                    style={{
                      color: form.headline_color,
                      fontSize: form.headline_font_size,
                      fontWeight: 900,
                      marginBottom: '4px',
                      lineHeight: 1.15,
                    }}
                  >
                    {form.headline}
                  </h1>

                  {/* Divider */}
                  <div
                    style={{
                      width: '40px',
                      height: '3px',
                      backgroundColor: form.accent_color,
                      borderRadius: '2px',
                      margin: '6px auto 8px auto',
                      boxShadow: `0 0 10px ${form.accent_color}`,
                    }}
                  ></div>

                  {/* Subheadline */}
                  <div
                    style={{
                      color: form.subheadline_color,
                      fontSize: form.subheadline_font_size,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginBottom: '14px',
                    }}
                  >
                    {form.subheadline}
                  </div>

                  {/* Buttons List */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {form.buttons.filter((b) => !b.hidden && !b.is_hidden).length === 0 && (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '14px',
                          border: '1.5px dashed rgba(255, 255, 255, 0.25)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#94a3b8',
                          fontSize: '11px',
                          textAlign: 'center',
                        }}
                      >
                        ⚠️ Todos os botões estão configurados como ocultos
                      </div>
                    )}
                    {form.buttons
                      .filter((b) => !b.hidden && !b.is_hidden)
                      .map((btn, idx) => {
                      let iconClass = 'bi-whatsapp';
                      if (btn.icon === 'telegram') iconClass = 'bi-telegram';
                      else if (btn.icon === 'instagram') iconClass = 'bi-instagram';
                      else if (btn.icon === 'youtube') iconClass = 'bi-youtube';
                      else if (btn.icon === 'cart') iconClass = 'bi-cart-fill';
                      else if (btn.icon === 'star') iconClass = 'bi-star-fill';
                      else if (btn.icon === 'globe') iconClass = 'bi-globe';

                      const animClass =
                        btn.animation === 'pulse'
                          ? 'dynamicButtonPulse'
                          : btn.animation === 'glow'
                          ? 'dynamicButtonGlow'
                          : btn.animation === 'bounce'
                          ? 'buttonBounce'
                          : '';

                      return (
                        <div
                          key={idx}
                          style={{
                            width: '100%',
                            minHeight: '56px',
                            borderRadius: '16px',
                            background:
                              btn.type === 'secondary'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : btn.type === 'outline'
                                ? 'transparent'
                                : btn.bg_color || '#22c55e',
                            color: btn.text_color || '#ffffff',
                            border: btn.type === 'outline' ? `1.5px solid ${btn.bg_color || '#22c55e'}` : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: '46px',
                              alignSelf: 'stretch',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(0, 0, 0, 0.16)',
                              fontSize: '18px',
                            }}
                          >
                            <i className={`bi ${iconClass}`}></i>
                          </div>
                          <div
                            style={{
                              flex: 1,
                              textAlign: 'left',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                            }}
                          >
                            <b
                              style={{
                                fontSize: btn.main_text_size || '15px',
                                textTransform: 'uppercase',
                                color: btn.text_color || '#ffffff',
                              }}
                            >
                              {btn.main_text}
                            </b>
                            {btn.sub_text && (
                              <small
                                style={{
                                  fontSize: btn.sub_text_size || '11px',
                                  color: btn.sub_text_color || btn.text_color || '#ffffff',
                                  opacity: 0.9,
                                }}
                              >
                                {btn.sub_text}
                              </small>
                            )}
                          </div>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'rgba(0, 0, 0, 0.16)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '12px',
                            }}
                          >
                            <ChevronRight size={14} color="#ffffff" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Tagline */}
                  <div
                    style={{
                      fontSize: form.footer_font_size,
                      color: form.footer_text_color,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginTop: '16px',
                      lineHeight: 1.3,
                    }}
                  >
                    {form.footer_text}
                  </div>
                </div>

                {/* Simulated Floating Social Proof Toast */}
                {testProofVisible && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '12px',
                      right: '12px',
                      zIndex: 99,
                      background: 'rgba(10, 15, 20, 0.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderLeft: `4px solid ${form.accent_color}`,
                      borderRadius: '12px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#fff',
                        fontSize: '13px',
                      }}
                    >
                      {currentTestBuyer ? currentTestBuyer.initials : 'M'}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                        {currentTestBuyer ? `${currentTestBuyer.name} (${currentTestBuyer.city})` : 'Matheus Silva (São Paulo)'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                        {form.social_proof_text || 'acabou de comprar'} &bull; há 1 minuto
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
