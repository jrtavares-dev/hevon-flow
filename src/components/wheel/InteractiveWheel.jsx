'use client';

import { useEffect, useRef, useState } from 'react';
import { dopamineAudio, triggerScreenRumble } from '@/lib/gamification/dopamine-fx';

// Web Audio API Synthesizer para som de cliques dos pinos da roleta
class WheelAudio {
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

  playTick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
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
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.2, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.36);
      });
    } catch {}
  }
}

const wheelAudio = new WheelAudio();

export default function InteractiveWheel({
  slices = [],
  onSpinRequest,
  onSpinEnd,
  size = 380,
  disabled = false,
  soundEnabled = true,
}) {
  const canvasRef = useRef(null);
  const pointerRef = useRef(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const animFrameRef = useRef(null);
  const rotationRef = useRef(0);
  const lastTickSliceRef = useRef(-1);

  wheelAudio.enabled = soundEnabled;

  // Desenha a Roleta no Canvas
  const drawWheel = (rotationAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;
    const radius = center - 16;

    ctx.clearRect(0, 0, width, height);

    const totalSlices = slices.length || 8;
    const arc = (2 * Math.PI) / totalSlices;

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotationAngle * Math.PI) / 180);

    // 1. Anel Externo Dourado
    ctx.beginPath();
    ctx.arc(0, 0, radius + 10, 0, 2 * Math.PI);
    const goldGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.3, '#f59e0b');
    goldGrad.addColorStop(0.7, '#b45309');
    goldGrad.addColorStop(1, '#fef08a');
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Sombra interna do aro
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // 2. Fatias
    slices.forEach((slice, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arc);
      ctx.fillStyle = slice.color_bg || (i % 2 === 0 ? '#10b981' : '#059669');
      ctx.fill();

      // Divisória sutil entre fatias
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto da Fatia
      ctx.save();
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = slice.color_text || '#ffffff';
      ctx.font = 'bold 13px "Outfit", "Plus Jakarta Sans", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;

      // Trunca o texto se for longo
      let text = slice.label || `Fatia ${i + 1}`;
      if (text.length > 17) text = text.substring(0, 16) + '...';

      ctx.fillText(text, radius - 26, 5);
      ctx.restore();
    });

    // 3. Pinos ao redor do aro
    const pinRadius = 4;
    for (let i = 0; i < totalSlices * 2; i++) {
      const pinAngle = (i * Math.PI) / totalSlices;
      const pinX = (radius + 5) * Math.cos(pinAngle);
      const pinY = (radius + 5) * Math.sin(pinAngle);
      ctx.beginPath();
      ctx.arc(pinX, pinY, pinRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // 4. Centro da Roleta (Botão Dourado)
    ctx.beginPath();
    ctx.arc(center, center, 36, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(center, center, 5, center, center, 36);
    centerGrad.addColorStop(0, '#fef08a');
    centerGrad.addColorStop(0.7, '#f59e0b');
    centerGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Núcleo central
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', center, center);
  };

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [slices, size]);

  const handleSpin = async () => {
    if (isSpinning || disabled) return;

    try {
      setIsSpinning(true);
      wheelAudio.playTick();

      // Chama a requisição backend para obter a fatia vencedora
      const spinResult = await onSpinRequest();
      if (!spinResult) {
        setIsSpinning(false);
        return;
      }

      const targetStopAngle = spinResult.target_stop_angle || (360 * 5 + 45);
      const startAngle = rotationRef.current % 360;
      const totalDelta = targetStopAngle + (360 - startAngle);
      const durationMs = 4500; // 4.5 segundos de giro
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        // Curva de desaceleração suave (Cubic Ease Out)
        const easeOut = 1 - Math.pow(1 - progress, 3.5);
        const currentAngle = startAngle + totalDelta * easeOut;

        rotationRef.current = currentAngle;
        drawWheel(currentAngle);

        // Toca som de clique a cada fatia que cruza o topo e vibra o ponteiro
        const totalSlices = slices.length || 8;
        const currentSliceUnderPointer = Math.floor((currentAngle % 360) / (360 / totalSlices));
        if (currentSliceUnderPointer !== lastTickSliceRef.current) {
          wheelAudio.playTick();
          lastTickSliceRef.current = currentSliceUnderPointer;

          // Efeito de mola / recuo físico do ponteiro
          if (pointerRef.current) {
            pointerRef.current.classList.remove('pointer-spring-active');
            void pointerRef.current.offsetWidth;
            pointerRef.current.classList.add('pointer-spring-active');
          }

          // Suspense Heartbeat nos últimos 1.5s de desaceleração
          if (progress > 0.7) {
            dopamineAudio.playHeartbeat(58 + progress * 24, 0.32);
          }
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          // Impacto Sísmico de parada + Tremor na tela
          triggerScreenRumble(500);
          dopamineAudio.playShockwaveBoom();

          setTimeout(() => {
            dopamineAudio.playTriumphantJackpot();
            if (onSpinEnd) onSpinEnd(spinResult);
          }, 350);
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error('Erro no giro da roleta:', err);
      setIsSpinning(false);
    }
  };

  return (
    <div className="position-relative d-inline-flex flex-column align-items-center">
      {/* Ponteiro / Marcador Superior com Mola Física */}
      <div
        ref={pointerRef}
        style={{
          position: 'absolute',
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
          pointerEvents: 'none',
          transformOrigin: 'top center',
        }}
      >
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
          <path
            d="M17 40L4 8C2 4 4.5 0 9 0H25C29.5 0 32 4 30 8L17 40Z"
            fill="url(#pointerGold)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id="pointerGold" x1="17" y1="0" x2="17" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fbbf24" />
              <stop offset="0.6" stopColor="#d97706" />
              <stop offset="1" stopColor="#78350f" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Canvas da Roleta */}
      <div
        onClick={handleSpin}
        style={{
          cursor: isSpinning || disabled ? 'default' : 'pointer',
          borderRadius: '50%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isSpinning && !disabled) e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
        />
      </div>

      {/* Botão de Ação Girar */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || disabled}
        className="btn btn-warning mt-3 px-4 py-2.5 rounded-pill fw-bold shadow-lg d-flex align-items-center gap-2"
        style={{
          background: '#f59e0b',
          color: '#090d16',
          border: 'none',
          fontSize: '14px',
          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
        }}
      >
        {isSpinning ? 'Girando a Roleta...' : '⚡ GIRAR A ROLETA'}
      </button>
    </div>
  );
}
