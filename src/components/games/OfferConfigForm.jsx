'use client';

import React, { useState } from 'react';
import {
  Video,
  Trophy,
  ListOrdered,
  Clock,
  Sparkles,
  Link2,
  Upload,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

export default function OfferConfigForm({ config, onChange }) {
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const currentConfig = config && typeof config === 'object' ? config : {};

  const handleChange = (field, value) => {
    if (onChange) {
      onChange({
        ...currentConfig,
        [field]: value,
      });
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = ['mp4', 'webm', 'mov', 'm4v'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      alert(`Formato de vídeo inválido (.${ext}). Por favor, envie um arquivo .mp4, .webm ou .mov.`);
      return;
    }

    try {
      setUploadingVideo(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'videos');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        handleChange('videoUrl', data.url);
        alert('Vídeo enviado com sucesso!');
      } else {
        alert(data.message || 'Erro ao enviar o vídeo.');
      }
    } catch (err) {
      console.error('Erro no upload do vídeo:', err);
      alert('Erro ao enviar o arquivo de vídeo: ' + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  config = currentConfig;

  return (
    <div className="d-flex flex-column gap-5 py-2">
      {/* 0. COR SÓLIDA DE DESTAQUE DA TELA 2 */}
      <div className="uf-modal-section-card">
        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '42px',
              height: '42px',
              background: 'rgba(16, 185, 129, 0.14)',
              color: '#059669',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-1 fs-6">Cor Sólida da Tela 2 (Oferta & Bônus VIP)</h6>
            <span className="text-muted small" style={{ fontSize: '12.5px' }}>
              Define a cor sólida dos botões, badges, círculos de benefícios, cronômetro e destaques desta tela
            </span>
          </div>
        </div>

        <div className="row g-3 align-items-center">
          <div className="col-12 col-sm-6">
            <div className="d-flex align-items-center gap-2">
              <input
                type="color"
                value={config.tela2Color || '#10b981'}
                onChange={(e) => handleChange('tela2Color', e.target.value)}
                style={{ width: '48px', height: '48px', padding: '3px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #cbd5e1' }}
              />
              <input
                type="text"
                value={config.tela2Color || '#10b981'}
                onChange={(e) => handleChange('tela2Color', e.target.value)}
                className="form-control rounded-3"
                style={{ height: '48px', fontSize: '14px', fontFamily: 'monospace', fontWeight: 600 }}
                placeholder="#10b981"
              />
            </div>
          </div>
          <div className="col-12 col-sm-6">
            <div className="d-flex gap-1.5 flex-wrap">
              {[
                { label: '🟢 Verde', color: '#10b981' },
                { label: '🔴 Vermelho', color: '#e52e2e' },
                { label: '🟡 Dourado', color: '#f59e0b' },
                { label: '🔵 Azul', color: '#2563eb' },
                { label: '🟣 Roxo', color: '#9333ea' },
                { label: '🟠 Laranja', color: '#ea580c' },
              ].map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => handleChange('tela2Color', preset.color)}
                  className="btn btn-sm btn-light border py-1 px-2.5 rounded-2"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1. TÍTULO E BÔNUS PRINCIPAL */}
      <div className="uf-modal-section-card">
        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '42px',
              height: '42px',
              background: 'rgba(245, 158, 11, 0.14)',
              color: '#d97706',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
            }}
          >
            <Trophy size={20} />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-1 fs-6">1. Prêmio e Bônus em Destaque</h6>
            <span className="text-muted small" style={{ fontSize: '12.5px' }}>
              Textos de alto impacto que aparecem no topo da tela logo após o jogador desbloquear o prêmio
            </span>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-sm-6">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Nome do Prêmio Principal
            </label>
            <input
              type="text"
              value={config.premio || ''}
              onChange={(e) => handleChange('premio', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: MT - 03 ou iPhone 17 Pro"
            />
          </div>

          <div className="col-12 col-sm-6">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Bônus / Destaque Dourado
            </label>
            <input
              type="text"
              value={config.bonus || ''}
              onChange={(e) => handleChange('bonus', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: + R$30.000 ou + 50 Cotas"
            />
          </div>

          <div className="col-12 col-sm-4">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Artigo Gramatical
            </label>
            <select
              value={config.artigo || 'a'}
              onChange={(e) => handleChange('artigo', e.target.value)}
              className="form-select rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
            >
              <option value="a">A (a cota premiada / a moto)</option>
              <option value="o">O (o número premiado / o carro)</option>
            </select>
          </div>

          <div className="col-12 col-sm-8">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Frase Explicativa Abaixo do Título
            </label>
            <input
              type="text"
              value={config.subtitulo || config.step2TextSub || 'se a cota premiada sair pra você comprando por aqui'}
              onChange={(e) => handleChange('subtitulo', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: se a cota premiada sair pra você comprando por aqui"
            />
          </div>

          <div className="col-12">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Foto do Prêmio / Quebra-Cabeça (PNG, JPG, WEBP)
            </label>
            <div className="d-flex align-items-center gap-3">
              <input
                type="text"
                value={config.puzzleImage || config.image || ''}
                onChange={(e) => handleChange('puzzleImage', e.target.value)}
                className="form-control rounded-3"
                style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                placeholder="Ex: /uploads/images/foto_premio.jpg ou https://..."
              />
              <label
                className="btn btn-outline-primary rounded-3 d-inline-flex align-items-center gap-1.5 flex-shrink-0"
                style={{ height: '48px', padding: '0 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <Upload size={16} />
                <span>Subir Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('type', 'images');
                      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
                      const d = await res.json();
                      if (d.success && d.url) {
                        handleChange('puzzleImage', d.url);
                      } else {
                        alert(d.message || 'Erro no envio da imagem');
                      }
                    } catch (err) {
                      alert('Erro ao enviar imagem: ' + err.message);
                    }
                  }}
                />
              </label>
              {(config.puzzleImage || config.image) && (
                <div
                  className="rounded-3 border overflow-hidden flex-shrink-0"
                  style={{ width: '48px', height: '48px', background: '#0f172a' }}
                >
                  <img
                    src={config.puzzleImage || config.image}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
            <span className="text-muted small d-block mt-2" style={{ fontSize: '12px' }}>
              Esta foto será dividida matematicamente em 9 peças de quebra-cabeça com encaixes perfeitos na tela do cliente.
            </span>
          </div>
        </div>
      </div>

      {/* 2. VÍDEO DE APRESENTAÇÃO */}
      <div className="uf-modal-section-card">
        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
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
            <Video size={20} />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-1 fs-6">2. Vídeo de Apresentação (MP4)</h6>
            <span className="text-muted small" style={{ fontSize: '12.5px' }}>
              Substitua o vídeo demonstrativo do produto ou oferta
            </span>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-sm-8">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Link ou Upload do Vídeo (.mp4)
            </label>
            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                value={config.videoUrl || ''}
                onChange={(e) => handleChange('videoUrl', e.target.value)}
                className="form-control rounded-3"
                style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                placeholder="https://sua-cdn.com/video.mp4 ou suba um arquivo ao lado"
              />
              <label
                className={`btn ${uploadingVideo ? 'btn-secondary disabled' : 'btn-outline-danger'} rounded-3 d-inline-flex align-items-center gap-1.5 flex-shrink-0 fw-bold shadow-xs`}
                style={{ height: '48px', padding: '0 18px', fontSize: '13px', cursor: uploadingVideo ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {uploadingVideo ? <Loader2 size={16} className="spinner-border spinner-border-sm" /> : <Upload size={16} />}
                <span>{uploadingVideo ? 'Enviando...' : 'Subir Vídeo'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  hidden
                  disabled={uploadingVideo}
                  onChange={handleVideoUpload}
                />
              </label>
            </div>
            <div className="d-flex align-items-center justify-content-between mt-2.5">
              <span className="text-muted small" style={{ fontSize: '12px', lineHeight: 1.5 }}>
                {uploadingVideo
                  ? 'Aguarde... Fazendo upload do arquivo de vídeo para o servidor.'
                  : 'Cole uma URL direta (.mp4) ou clique no botão "Subir Vídeo" para enviar do seu computador.'}
              </span>
              {config.videoUrl && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-muted p-0"
                  style={{ fontSize: '12px' }}
                  onClick={() => handleChange('videoUrl', '')}
                >
                  Limpar Vídeo
                </button>
              )}
            </div>

            {/* Video Preview Box */}
            {config.videoUrl && (
              <div className="mt-3 p-3 rounded-3 border bg-light d-flex align-items-center gap-3">
                <div
                  style={{
                    width: '110px',
                    height: '62px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#000000',
                    border: '1px solid #cbd5e1',
                    position: 'relative',
                  }}
                >
                  <video
                    src={config.videoUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.35)',
                      color: '#ffffff',
                      fontSize: '18px',
                    }}
                  >
                    ▶
                  </div>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '13px' }}>
                    Vídeo Carregado com Sucesso
                  </div>
                  <div className="text-muted small text-truncate" style={{ fontSize: '11.5px', fontFamily: 'monospace' }}>
                    {config.videoUrl}
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle mt-1" style={{ fontSize: '10px' }}>
                    Ativo na Etapa 2
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="col-12 col-sm-4">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Badge Sobre o Vídeo
            </label>
            <input
              type="text"
              value={config.badgeVideo || 'PRA VOCÊ'}
              onChange={(e) => handleChange('badgeVideo', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: PRA VOCÊ ou EXCLUSIVO"
            />
          </div>

          <div className="col-12">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Faixa de Destaques / Prova Social (Abaixo do Vídeo)
            </label>
            <div className="row g-2">
              <div className="col-12 col-sm-4">
                <input
                  type="text"
                  value={config.ribbon1 || 'MÁXIMO DE SORTE'}
                  onChange={(e) => handleChange('ribbon1', e.target.value)}
                  className="form-control rounded-3"
                  style={{ height: '44px', fontSize: '13px' }}
                  placeholder="🏆 MÁXIMO DE SORTE"
                />
              </div>
              <div className="col-12 col-sm-4">
                <input
                  type="text"
                  value={config.ribbon2 || 'SÓ POR ESTA PÁGINA'}
                  onChange={(e) => handleChange('ribbon2', e.target.value)}
                  className="form-control rounded-3"
                  style={{ height: '44px', fontSize: '13px' }}
                  placeholder="⚡ SÓ POR ESTA PÁGINA"
                />
              </div>
              <div className="col-12 col-sm-4">
                <input
                  type="text"
                  value={config.ribbon3 || 'SÓ POR HOJE'}
                  onChange={(e) => handleChange('ribbon3', e.target.value)}
                  className="form-control rounded-3"
                  style={{ height: '44px', fontSize: '13px' }}
                  placeholder="🎁 SÓ POR HOJE"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. OS 3 PASSOS / BENEFÍCIOS */}
      <div className="uf-modal-section-card">
        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '42px',
              height: '42px',
              background: 'rgba(16, 185, 129, 0.14)',
              color: '#059669',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
            }}
          >
            <ListOrdered size={20} />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-1 fs-6">3. Os 3 Passos Numerados (Ao Lado do Vídeo)</h6>
            <span className="text-muted small" style={{ fontSize: '12.5px' }}>
              Instruções passo-a-passo persuasivas que convencem o comprador a finalizar o pedido
            </span>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Passo 1 (Compra Mínima)
            </label>
            <input
              type="text"
              value={config.step1Text || ''}
              onChange={(e) => handleChange('step1Text', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: Compra por esta página fezinha acima de R$20"
            />
          </div>

          <div className="col-12">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Passo 2 (Sorteio / Regra)
            </label>
            <input
              type="text"
              value={config.step2Text || ''}
              onChange={(e) => handleChange('step2Text', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: A cota premiada sai pra você"
            />
          </div>

          <div className="col-12 col-sm-7">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Passo 3 (Destaque do Prêmio)
            </label>
            <input
              type="text"
              value={config.step3Title || ''}
              onChange={(e) => handleChange('step3Title', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: Leva a MT - 03 + R$30.000"
            />
          </div>

          <div className="col-12 col-sm-5">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Passo 3 (Observação Menor)
            </label>
            <input
              type="text"
              value={config.step3Sub || ''}
              onChange={(e) => handleChange('step3Sub', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: no site: só a MT - 03"
            />
          </div>
        </div>
      </div>

      {/* 4. CRONÔMETRO E BOTÃO DE AÇÃO (CTA) */}
      <div className="uf-modal-section-card">
        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '42px',
              height: '42px',
              background: 'rgba(239, 68, 68, 0.14)',
              color: '#dc2626',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-1 fs-6">4. Urgência & Link de Redirecionamento</h6>
            <span className="text-muted small" style={{ fontSize: '12.5px' }}>
              Configuração do cronômetro regressivo e destino do botão de checkout
            </span>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-sm-3">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Tempo (Minutos)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={config.prazoMinutos || 3}
              onChange={(e) => handleChange('prazoMinutos', parseInt(e.target.value) || 3)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
            />
          </div>

          <div className="col-12 col-sm-4">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Texto do Cronômetro
            </label>
            <input
              type="text"
              value={config.timerLabel || 'ÚLTIMO MINUTO'}
              onChange={(e) => handleChange('timerLabel', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: ÚLTIMO MINUTO"
            />
          </div>

          <div className="col-12 col-sm-5">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Texto do Botão CTA
            </label>
            <input
              type="text"
              value={config.btnText || 'GARANTIR AGORA ➔'}
              onChange={(e) => handleChange('btnText', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: GARANTIR AGORA ➔"
            />
          </div>

          <div className="col-12 col-sm-8">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Link de Destino / Checkout (URL)
            </label>
            <div className="input-group">
              <span
                className="input-group-text rounded-start-3"
                style={{
                  height: '48px',
                  background: 'var(--surface-subtle, #f8fafc)',
                  borderColor: 'var(--border-subtle, #cbd5e1)',
                  color: 'var(--text-muted, #94a3b8)',
                  padding: '0 16px',
                }}
              >
                <Link2 size={18} />
              </span>
              <input
                type="url"
                required
                value={config.dest || ''}
                onChange={(e) => handleChange('dest', e.target.value)}
                className="form-control rounded-end-3"
                style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
                placeholder="https://sua-loja.com/checkout/oferta"
              />
            </div>
            <span className="text-muted small d-block mt-2.5" style={{ fontSize: '12px', lineHeight: 1.5 }}>
              Para onde o comprador é enviado ao clicar em GARANTIR AGORA.
            </span>
          </div>

          <div className="col-12 col-sm-4">
            <label className="form-label small fw-bold text-dark mb-2 d-block" style={{ fontSize: '13px' }}>
              Texto do Link de Rodapé
            </label>
            <input
              type="text"
              value={config.footerText || 'mostrar meus números'}
              onChange={(e) => handleChange('footerText', e.target.value)}
              className="form-control rounded-3"
              style={{ height: '48px', fontSize: '14px', padding: '11px 16px' }}
              placeholder="Ex: mostrar meus números"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
