'use client';

// ==============================================================================
// UpsellFlow Dopamine & Gamification FX Engine
// High-energy Web Audio Synthesizer, 3D Canvas Coin Cannon & Screen Rumbles
// 100% Zero external dependencies • Pure Browser APIs
// ==============================================================================

class DopamineAudioEngine {
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

  // Batimento cardíaco de suspense crescente (sub-bass heartbeat)
  playHeartbeat(freq = 60, intensity = 0.3) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Duplo golpe: tu-dum
      [0, 0.12].forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq - idx * 10, now + offset);
        osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.15);

        gain.gain.setValueAtTime(intensity * (idx === 0 ? 0.7 : 1), now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.17);
      });
    } catch {}
  }

  // Riser de tensão / redemoinho antes da revelação
  playTensionRiser(duration = 1.2) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + duration);

      // Lowpass filter para suavizar
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(2800, now + duration);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + duration * 0.9);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {}
  }

  // Impacto sísmico / estalo de abertura (Shockwave Boom)
  playShockwaveBoom() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Sub-boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);

      // Ruído de explosão / ar estalando
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.25, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
    } catch {}
  }

  // Cascata de Moedas de Ouro (Ting-ting-ting arcade jackpot)
  playCoinShower() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const pitches = [1864.66, 2093.0, 2349.32, 2793.83, 3135.96, 3729.31];

      for (let i = 0; i < 9; i++) {
        const time = now + i * 0.07 + Math.random() * 0.03;
        const pitch = pitches[Math.floor(Math.random() * pitches.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.16);
      }
    } catch {}
  }

  // Fanfarra Épica Triunfal com acordes maiores e sino de vitória
  playTriumphantJackpot() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Acorde triunfal em 4 passos progressivos
      const chordSequence = [
        { time: 0.0, notes: [523.25, 659.25, 783.99], dur: 0.2 }, // C5
        { time: 0.18, notes: [587.33, 739.99, 880.0], dur: 0.2 }, // D5
        { time: 0.36, notes: [659.25, 830.61, 987.77], dur: 0.22 }, // E5
        { time: 0.58, notes: [1046.5, 1318.51, 1567.98, 2093.0], dur: 0.8 }, // C6 Grand
      ];

      chordSequence.forEach((step) => {
        step.notes.forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + step.time);

          gain.gain.setValueAtTime(0.16, now + step.time);
          gain.gain.exponentialRampToValueAtTime(0.001, now + step.time + step.dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + step.time);
          osc.stop(now + step.time + step.dur + 0.05);
        });
      });

      // Moedas e sino concomitantes
      setTimeout(() => this.playCoinShower(), 600);
    } catch {}
  }

  // Estalo de brilho mágico / estrelas
  playSparkle() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.06);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }
}

export const dopamineAudio = new DopamineAudioEngine();

// ==============================================================================
// 3D Canvas Coin Cannon & Mega Confetti Launcher
// Dispara moedas douradas 3D girando + estrelas brilhantes + confetes metalizados
// ==============================================================================
export function launchMegaCelebration(canvasElement) {
  if (!canvasElement || typeof window === 'undefined') return;
  const ctx = canvasElement.getContext('2d');
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;

  const particles = [];
  const W = canvasElement.width;
  const H = canvasElement.height;
  const centerX = W / 2;
  const centerY = H / 2;

  // 1. Moedas de Ouro 3D Giratórias (35 moedas)
  for (let i = 0; i < 35; i++) {
    const angle = (Math.PI * 2 * i) / 35 + (Math.random() - 0.5) * 0.5;
    const speed = Math.random() * 14 + 10;
    particles.push({
      type: 'coin',
      x: centerX,
      y: centerY + 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 12,
      gravity: 0.42,
      radius: Math.random() * 5 + 9,
      rotAngle: Math.random() * Math.PI,
      rotSpeed: Math.random() * 0.15 + 0.08,
      alpha: 1,
    });
  }

  // 2. Estrelas cintilantes douradas (30 estrelas)
  for (let i = 0; i < 30; i++) {
    particles.push({
      type: 'star',
      x: centerX + (Math.random() - 0.5) * 120,
      y: centerY + (Math.random() - 0.5) * 120,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 18 - 4,
      gravity: 0.32,
      size: Math.random() * 6 + 6,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.12,
      color: Math.random() > 0.5 ? '#fef08a' : '#f59e0b',
      alpha: 1,
    });
  }

  // 3. Confetes Metalizados Multicores (80 fitas)
  const colors = ['#f59e0b', '#fbbf24', '#6366f1', '#10b981', '#ec4899', '#38bdf8', '#ffffff'];
  for (let i = 0; i < 80; i++) {
    particles.push({
      type: 'confetti',
      x: centerX,
      y: centerY,
      vx: (Math.random() - 0.5) * 22,
      vy: (Math.random() - 0.8) * 24,
      gravity: 0.26,
      w: Math.random() * 7 + 4,
      h: Math.random() * 12 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
      rotSpeedX: Math.random() * 0.1 + 0.04,
      rotSpeedY: Math.random() * 0.08 + 0.03,
      alpha: 1,
    });
  }

  let frames = 0;
  const maxFrames = 130;

  function render() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.985;

      if (frames > 85) {
        p.alpha = Math.max(0, 1 - (frames - 85) / 45);
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'coin') {
        p.rotAngle += p.rotSpeed;
        const scaleX = Math.cos(p.rotAngle);

        ctx.translate(p.x, p.y);
        ctx.scale(scaleX, 1);

        // Borda externa dourada
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        const grad = ctx.createLinearGradient(-p.radius, -p.radius, p.radius, p.radius);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#eab308');
        grad.addColorStop(1, '#a16207');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(234, 179, 8, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fill();

        // Face interna
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.78, 0, Math.PI * 2);
        ctx.fillStyle = '#fde047';
        ctx.fill();

        // Símbolo $ ou estrela no centro
        if (Math.abs(scaleX) > 0.4) {
          ctx.fillStyle = '#854d0e';
          ctx.font = `bold ${Math.round(p.radius * 0.85)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 1);
        }
      } else if (p.type === 'star') {
        p.rot += p.rotSpeed;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;

        // Desenha estrela de 4 pontas cintilante
        ctx.beginPath();
        for (let s = 0; s < 8; s++) {
          const r = s % 2 === 0 ? p.size : p.size * 0.38;
          const a = (s * Math.PI) / 4;
          const sx = Math.cos(a) * r;
          const sy = Math.sin(a) * r;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'confetti') {
        p.rotX += p.rotSpeedX;
        p.rotY += p.rotSpeedY;

        ctx.translate(p.x, p.y);
        ctx.scale(Math.cos(p.rotX), Math.sin(p.rotY));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }

      ctx.restore();
    });

    frames++;
    if (frames < maxFrames) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  }

  requestAnimationFrame(render);
}

// Tremor de câmera na tela (Screen Rumble)
export function triggerScreenRumble(duration = 500) {
  if (typeof document === 'undefined') return;
  document.body.classList.add('screen-rumble-active');
  setTimeout(() => {
    document.body.classList.remove('screen-rumble-active');
  }, duration);
}
