'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Trophy, Gift, ArrowRight } from 'lucide-react';
import { dopamineAudio, triggerScreenRumble } from '@/lib/gamification/dopamine-fx';

// Web Audio API Synthesizer para Efeitos Sonoros de Unboxing
class MysteryBoxAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playHover() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  playSuspense() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 7; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220 + i * 35, now + i * 0.18);
        gain.gain.setValueAtTime(0.12, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.11);
      }
    } catch {}
  }

  playPopOpen() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Explosão de grave + brilho agudo
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch {}
  }

  playFanfare() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.42);
      });
    } catch {}
  }
}

const boxAudio = new MysteryBoxAudio();

export default function InteractiveMysteryBox({
  onOpenRequest,
  onOpenComplete,
  soundEnabled = true,
  disabled = false,
}) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'shaking' | 'revealed'
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [boxesResult, setBoxesResult] = useState(null);

  boxAudio.enabled = soundEnabled;

  const boxesConfig = [
    {
      id: 0,
      title: 'Caixa Dourada',
      subtitle: 'Fortuna & Sorte',
      colorTop: '#fef08a',
      colorBase: '#ca8a04',
      ribbon: '#fef08a',
      glow: 'rgba(234, 179, 8, 0.45)',
      badge: '👑 OURO VIP',
    },
    {
      id: 1,
      title: 'Caixa Rubi',
      subtitle: 'Poder & Mistério',
      colorTop: '#f43f5e',
      colorBase: '#be123c',
      ribbon: '#fde047',
      glow: 'rgba(225, 29, 72, 0.45)',
      badge: '💎 RUBI RARO',
    },
    {
      id: 2,
      title: 'Caixa Esmeralda',
      subtitle: 'Segredo Secreto',
      colorTop: '#34d399',
      colorBase: '#059669',
      ribbon: '#a7f3d0',
      glow: 'rgba(16, 185, 129, 0.45)',
      badge: '⚡ ESMERALDA',
    },
  ];

  const handleBoxClick = async (idx) => {
    if (phase !== 'idle' || disabled) return;

    try {
      setSelectedIdx(idx);
      setPhase('shaking');

      // Suspense Heartbeat em crescendo (tu-dum... tu-dum... TU-DUM!)
      dopamineAudio.playHeartbeat(58, 0.4);
      const hb1 = setTimeout(() => dopamineAudio.playHeartbeat(66, 0.45), 400);
      const hb2 = setTimeout(() => dopamineAudio.playHeartbeat(76, 0.5), 800);
      const hb3 = setTimeout(() => dopamineAudio.playTensionRiser(0.5), 1100);

      // Chama a requisição backend para sortear
      const result = await onOpenRequest(idx);
      if (!result) {
        clearTimeout(hb1);
        clearTimeout(hb2);
        clearTimeout(hb3);
        setPhase('idle');
        setSelectedIdx(null);
        return;
      }

      setBoxesResult(result);

      // 1.45s de suspense tremendo a caixa antes de estourar a tampa
      setTimeout(() => {
        // Impacto Sísmico + Tremor na Tela + Abertura Explosiva
        triggerScreenRumble(500);
        dopamineAudio.playShockwaveBoom();
        setPhase('revealed');

        setTimeout(() => {
          dopamineAudio.playTriumphantJackpot();
          if (onOpenComplete) onOpenComplete(result);
        }, 550);
      }, 1450);
    } catch (err) {
      console.error(err);
      setPhase('idle');
      setSelectedIdx(null);
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setSelectedIdx(null);
    setBoxesResult(null);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '700px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
      }}
    >
      {/* Grid das 3 Caixas Flutuantes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          width: '100%',
          padding: '10px 0',
        }}
      >
        {boxesConfig.map((box, idx) => {
          const isSelected = selectedIdx === idx;
          const isOther = selectedIdx !== null && selectedIdx !== idx;
          const revealedData = boxesResult?.boxes?.[idx];

          return (
            <div
              key={box.id}
              onClick={() => handleBoxClick(idx)}
              onMouseEnter={() => phase === 'idle' && boxAudio.playHover()}
              className={isSelected && phase === 'shaking' ? 'seismic-box-shake' : ''}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: phase === 'idle' ? 'pointer' : 'default',
                opacity: isOther && phase === 'shaking' ? 0.2 : 1,
                filter: isOther && phase === 'shaking' ? 'blur(1px) grayscale(0.8)' : 'none',
                transform: isSelected && phase === 'shaking'
                  ? 'scale(1.12)'
                  : phase === 'idle'
                  ? 'translateY(0)'
                  : 'none',
                transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
              }}
            >
              {/* Badge da Caixa */}
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  color: '#ffffff',
                  background: isSelected && phase === 'revealed' ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: isSelected && phase === 'revealed' ? '1px solid #fef08a' : '1px solid rgba(255,255,255,0.1)',
                  marginBottom: '10px',
                  boxShadow: isSelected && phase === 'revealed' ? '0 0 12px rgba(245, 158, 11, 0.6)' : 'none',
                  letterSpacing: '0.5px',
                }}
              >
                {isSelected && phase === 'revealed' ? '⭐ SUA ESCOLHA' : box.badge}
              </div>

              {/* Caixa 3D de Presente */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '140px',
                  aspectRatio: '1 / 1.15',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                {/* Feixes de Luz Dourada ao Abrir */}
                {phase === 'revealed' && isSelected && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        top: '10%',
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(254, 240, 138, 0.9) 0%, rgba(234, 179, 8, 0.4) 50%, transparent 80%)',
                        filter: 'blur(10px)',
                        animation: 'pulseGlow 1.5s infinite alternate',
                        zIndex: 1,
                        pointerEvents: 'none',
                      }}
                    />
                    <div className="shockwave-ripple" style={{ top: '20%', left: '50%', marginLeft: '-80px' }} />
                  </>
                )}

                {/* Tampa da Caixa (Salta e voa em 3D ao abrir) */}
                <div
                  className={isSelected && phase === 'revealed' ? 'lid-pop-fly' : ''}
                  style={{
                    width: '104%',
                    height: '24px',
                    borderRadius: '8px 8px 3px 3px',
                    background: box.colorBase,
                    border: `2px solid ${box.colorTop}`,
                    boxShadow: `0 4px 15px ${box.glow}`,
                    position: 'relative',
                    zIndex: 4,
                    transform: phase === 'revealed' && !isSelected
                      ? 'translateY(-24px) rotate(-12deg)'
                      : 'translateY(0)',
                    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {/* Fita Central da Tampa */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '14px',
                      height: '100%',
                      background: box.ribbon,
                    }}
                  />
                  {/* Laço da Fita */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '24px',
                      height: '12px',
                      borderRadius: '50%',
                      background: box.ribbon,
                      border: '1px solid rgba(0,0,0,0.15)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>

                {/* Base da Caixa de Presente */}
                <div
                  style={{
                    width: '92%',
                    height: '85px',
                    borderRadius: '0 0 12px 12px',
                    background: box.colorBase,
                    border: `2px solid ${box.colorTop}`,
                    boxShadow: `0 10px 25px -5px ${box.glow}, inset 0 2px 4px rgba(255,255,255,0.2)`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3,
                  }}
                >
                  {/* Fitas verticais e horizontais na base */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '14px',
                      height: '100%',
                      background: box.ribbon,
                      opacity: 0.9,
                    }}
                  />

                  {/* Ícone no Centro da Caixa */}
                  <Gift size={26} color="#ffffff" style={{ zIndex: 2, opacity: 0.9 }} />
                </div>

                {/* Prêmio Flutuando para fora da Caixa Aberta */}
                {phase === 'revealed' && revealedData && (
                  <div
                    className={isSelected ? 'prize-emerge-burst' : ''}
                    style={{
                      position: 'absolute',
                      top: isSelected ? '-55px' : '-35px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: isSelected
                        ? '#1e293b'
                        : 'rgba(15, 23, 42, 0.9)',
                      border: isSelected ? '2px solid #f59e0b' : '1px solid #475569',
                      borderRadius: '12px',
                      padding: '8px 10px',
                      boxShadow: isSelected
                        ? '0 10px 25px rgba(245, 158, 11, 0.5)'
                        : '0 4px 10px rgba(0,0,0,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 10,
                      width: '120px',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '20px', marginBottom: '2px' }}>
                      {revealedData.prize?.symbol}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: isSelected ? '#fef08a' : '#94a3b8',
                        lineHeight: '1.1',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                    >
                      {revealedData.prize?.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Botão de Abrir */}
              {phase === 'idle' && (
                <button
                  type="button"
                  style={{
                    marginTop: '14px',
                    background: box.colorBase,
                    border: `1px solid ${box.colorTop}`,
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '11px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${box.glow}`,
                    transition: 'all 0.2s',
                  }}
                >
                  ABRIR CAIXA
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Mensagem Inferior de Status */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        {phase === 'idle' && (
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            👆 <strong>Clique em 1 das 3 caixas</strong> para destrancar seu presente exclusivo.
          </p>
        )}
        {phase === 'shaking' && (
          <p style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', margin: 0 }}>
            ⏳ Destrancando a caixa misteriosa... aguarde!
          </p>
        )}
        {phase === 'revealed' && (
          <button
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Testar Novamente
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes pulseGlow {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes floatUp {
          0% { transform: translate(-50%, 20px) scale(0.7); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
