'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import JigsawPuzzleBoard from '@/components/puzzle/JigsawPuzzleBoard';
import {
  trackHevonClientEvent,
  prefetchHevonClientIps,
  appendUpsellFlowUtm,
  normalizeClientGameType,
} from '@/lib/hevonClient';
import {
  pickRandomScratchProduct,
  getActiveScratchProducts,
} from '@/lib/scratch/scratchProducts';

// Web Audio API Synthesizer (Zero Latency, no external assets needed)
// Authentic Scratch Card Web Audio Engine (Instant Zero-Latency Coin Scraping)
class DxSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastFrictionTime = 0;
    this.scratchBuffers = [];
    this.userScratchBuffer = null;
    this.continuousSource = null;
    this.continuousGain = null;
    this.continuousTimer = null;
    this.loading = false;
  }

  preload() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch (e) { }
      }
    }
    if (this.ctx && !this.loading && !this.userScratchBuffer) {
      this.loadScratchSounds();
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }
    if (this.ctx && !this.loading && (!this.userScratchBuffer || this.scratchBuffers.length === 0)) {
      this.loadScratchSounds();
    }
  }

  // Pre-generate authentic scratch samples and fetch audio files (including user's SOM DE RASPADINHA)
  async loadScratchSounds() {
    if (this.loading || !this.ctx) return;
    this.loading = true;

    // 1. Instantly synthesize high-fidelity procedural scratch buffers in memory (zero network delay)
    this.generateProceduralScratchBuffers();

    // 2. Fetch user's authentic scratch sound file (/audio/som-de-raspadinha.mp3 and /audio/SOM%20DE%20RASPADINHA.mp3.mpeg)
    const audioFiles = [
      '/audio/som-de-raspadinha.mp3',
      '/audio/SOM%20DE%20RASPADINHA.mp3.mpeg',
      '/audio/scratch-coin.wav',
      '/audio/scratch-1.wav',
      '/audio/scratch-2.wav',
      '/audio/scratch-3.wav'
    ];

    for (const url of audioFiles) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          if (this.ctx) {
            const decoded = await this.ctx.decodeAudioData(ab);
            if (url.includes('raspadinha') || url.includes('RASPADINHA')) {
              this.userScratchBuffer = decoded;
              this.scratchBuffers.unshift(decoded);
              break;
            } else {
              this.scratchBuffers.push(decoded);
            }
          }
        }
      } catch (err) { }
    }
  }

  generateProceduralScratchBuffers() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate || 44100;
    const variations = [
      { duration: 0.09, pitch: 1.05, grit: 1.1 },
      { duration: 0.12, pitch: 0.95, grit: 1.3 },
      { duration: 0.11, pitch: 1.00, grit: 1.0 },
      { duration: 0.14, pitch: 0.92, grit: 1.2 }
    ];

    variations.forEach(({ duration, pitch, grit }) => {
      try {
        const numSamples = Math.floor(sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);

        let hp_y = 0, hp_x = 0;
        let bp1_y1 = 0, bp1_y2 = 0;
        let bp2_y1 = 0, bp2_y2 = 0;
        let bp3_y1 = 0, bp3_y2 = 0;
        let b0 = 0, b1 = 0, b2 = 0;

        // Frequencies of metallic scrape against latex
        const f1 = 3300 * pitch;
        const q1 = 5.5;
        const w1 = 2 * Math.PI * f1 / sampleRate;
        const alpha1 = Math.sin(w1) / (2 * q1);

        const f2 = 720 * pitch;
        const q2 = 3.2;
        const w2 = 2 * Math.PI * f2 / sampleRate;
        const alpha2 = Math.sin(w2) / (2 * q2);

        const f3 = 5400 * pitch;
        const q3 = 4.2;
        const w3 = 2 * Math.PI * f3 / sampleRate;
        const alpha3 = Math.sin(w3) / (2 * q3);

        for (let i = 0; i < numSamples; i++) {
          const t = i / sampleRate;
          const norm = i / numSamples;
          let env = 1;
          if (norm < 0.08) env = norm / 0.08;
          else if (norm > 0.75) env = (1 - norm) / 0.25;

          // Granular micro-bursts simulate coin grating across latex ridges
          const chatter = 0.65 + 0.35 * Math.sin(t * 1400 * (1 + 0.3 * Math.sin(t * 160))) * Math.sin(t * 400 * grit);
          env *= chatter;

          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.055;
          b1 = 0.99332 * b1 + white * 0.075;
          b2 = 0.96900 * b2 + white * 0.153;
          const pink = (b0 + b1 + b2 + white * 0.5) * 0.13;

          // High-pass 450Hz
          const hp_in = white * 0.7 + pink * 0.3;
          hp_y = 0.94 * (hp_y + hp_in - hp_x);
          hp_x = hp_in;

          // Bandpasses (coin edge + card body + latex rip)
          const out1 = alpha1 * hp_y - (-2 * Math.cos(w1)) * bp1_y1 - (1 - alpha1) * bp1_y2;
          bp1_y2 = bp1_y1; bp1_y1 = out1 / (1 + alpha1);

          const out2 = alpha2 * hp_y - (-2 * Math.cos(w2)) * bp2_y1 - (1 - alpha2) * bp2_y2;
          bp2_y2 = bp2_y1; bp2_y1 = out2 / (1 + alpha2);

          const out3 = alpha3 * hp_y - (-2 * Math.cos(w3)) * bp3_y1 - (1 - alpha3) * bp3_y2;
          bp3_y2 = bp3_y1; bp3_y1 = out3 / (1 + alpha3);

          let s = (out1 * 0.44 + out2 * 0.28 + out3 * 0.36 + hp_y * 0.14) * env;
          data[i] = Math.tanh(s * 2.3);
        }

        this.scratchBuffers.push(buffer);
      } catch (e) { }
    });
  }

  // Smooth continuous looping scratch audio while dragging
  startContinuousScratch() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const buf = this.userScratchBuffer || (this.scratchBuffers.length > 0 ? this.scratchBuffers[0] : null);
      if (!buf) return;

      if (!this.continuousSource) {
        this.continuousGain = this.ctx.createGain();
        this.continuousGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.continuousGain.gain.linearRampToValueAtTime(0.65, this.ctx.currentTime + 0.04);

        this.continuousSource = this.ctx.createBufferSource();
        this.continuousSource.buffer = buf;
        this.continuousSource.loop = true;
        this.continuousSource.playbackRate.value = 1.0;

        this.continuousSource.connect(this.continuousGain);
        this.continuousGain.connect(this.ctx.destination);
        const startOffset = Math.random() * Math.max(0, buf.duration - 1.0);
        this.continuousSource.start(0, startOffset);
      } else if (this.continuousGain) {
        this.continuousGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.continuousGain.gain.linearRampToValueAtTime(0.65, this.ctx.currentTime + 0.03);
      }

      this.pingContinuousScratch();
    } catch (e) { }
  }

  pingContinuousScratch() {
    if (this.continuousTimer) clearTimeout(this.continuousTimer);
    this.continuousTimer = setTimeout(() => {
      this.stopContinuousScratch();
    }, 150);
  }

  stopContinuousScratch() {
    if (this.continuousTimer) clearTimeout(this.continuousTimer);
    this.continuousTimer = null;

    if (this.continuousSource && this.continuousGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.continuousGain.gain.cancelScheduledValues(now);
        this.continuousGain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        const oldSrc = this.continuousSource;
        const oldGain = this.continuousGain;
        setTimeout(() => {
          try { oldSrc.stop(); oldSrc.disconnect(); oldGain.disconnect(); } catch (e) { }
        }, 70);
      } catch (e) { }
      this.continuousSource = null;
      this.continuousGain = null;
    }
  }

  // Play full 3s scratch sound for "RASPAR TUDO"
  playFullScratch() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const buf = this.userScratchBuffer || (this.scratchBuffers.length > 0 ? this.scratchBuffers[0] : null);
      if (!buf) return;

      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start();
    } catch (e) { }
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.08, delay = 0) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) { }
  }

  // Authentic Coin Scratch Sound (Physical lottery latex scrape)
  playScratchFriction() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastFrictionTime < 50) return;
    this.lastFrictionTime = now;

    try {
      this.init();
      if (!this.ctx) return;

      if (this.continuousSource) {
        this.pingContinuousScratch();
        return;
      }

      if (this.userScratchBuffer) {
        const buf = this.userScratchBuffer;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = 0.94 + Math.random() * 0.14;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.50 + Math.random() * 0.15, this.ctx.currentTime);

        src.connect(gain);
        gain.connect(this.ctx.destination);

        const maxOffset = Math.max(0, buf.duration - 0.28);
        const offset = Math.random() * maxOffset;
        src.start(0, offset, 0.24);
        return;
      }

      if (this.scratchBuffers.length > 0) {
        const buf = this.scratchBuffers[Math.floor(Math.random() * this.scratchBuffers.length)];
        const source = this.ctx.createBufferSource();
        source.buffer = buf;
        source.playbackRate.value = 0.90 + Math.random() * 0.22;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.40 + Math.random() * 0.15, this.ctx.currentTime);

        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
      }
    } catch (e) { }
  }

  playPop() {
    this.playTone(360, 0.08, 'sine', 0.12);
    this.playTone(720, 0.09, 'triangle', 0.1, 0.03);
  }

  playTick() {
    this.playTone(920, 0.025, 'triangle', 0.07);
  }

  playChestOpen() {
    this.playTone(180, 0.15, 'sawtooth', 0.1);
    this.playTone(480, 0.25, 'sine', 0.12, 0.08);
    this.playTone(960, 0.4, 'triangle', 0.14, 0.18);
  }

  playNearMiss() {
    this.playTone(310, 0.18, 'sawtooth', 0.11, 0);
    this.playTone(220, 0.32, 'sawtooth', 0.13, 0.15);
  }

  playFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 0.28, 'triangle', 0.14, idx * 0.08);
    });
    setTimeout(() => {
      this.playTone(1046.5, 0.7, 'sine', 0.18);
      this.playTone(1318.51, 0.7, 'triangle', 0.15);
    }, 380);
  }
}

const sounds = new DxSoundEngine();

// HIGH-PERFORMANCE 60FPS PARTICLE CANVAS (NO REACT STATE LAG)
class ParticleFx {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animating = false;
  }

  attach(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
  }

  spawn(clientX, clientY, count = 4, baseColor = '#fbbf24') {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const colors = [baseColor, '#fef08a', '#ffffff', '#f59e0b', '#d1d5db'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: px + (Math.random() - 0.5) * 8,
        y: py + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.7) * 5,
        size: Math.random() * 3.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0.92,
        isShaving: false,
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  spawnLatexShavings(clientX, clientY, count = 3) {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const latexColors = ['#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#cbd5e1', '#475569'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: px + (Math.random() - 0.5) * 10,
        y: py + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 2.6,
        vy: Math.random() * 2.2 + 1.2,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.28,
        w: Math.random() * 3.2 + 1.8,
        h: Math.random() * 2.4 + 1.4,
        color: latexColors[Math.floor(Math.random() * latexColors.length)],
        alpha: 0.95,
        life: 0.93,
        isShaving: true,
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  loop() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.isShaving) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.rot += p.vrot;
        p.alpha *= p.life;

        if (p.alpha < 0.05 || p.y > this.canvas.height) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.alpha *= p.life;

        if (p.alpha < 0.04) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.animating = false;
    }
  }
}

const particleEngine = new ParticleFx();

// THEMES CONFIGURATION PER GAME TYPE
const GAME_THEMES = {
  raspadinha: {
    bgGradient: '#0d0202',
    baseBg: '#050101',
    pillBg: 'rgba(20, 5, 5, 0.88)',
    pillBorder: 'rgba(239, 68, 68, 0.6)',
    pillText: '#ffffff',
    primaryColor: '#ef4444',
    primaryGlow: 'rgba(239, 68, 68, 0.65)',
    accentGold: '#fbbf24',
    btnGradient: '#ef4444',
    btnBorder: 'rgba(248, 113, 113, 0.5)',
    btnShadow: '0 8px 25px rgba(239, 68, 68, 0.55)',
    drawerBorder: '#ef4444',
    drawerBg: '#0d0202',
    drawerBadgeBg: '#dc2626',
  },
  caixa: {
    bgGradient: '#11021d',
    baseBg: '#0a0112',
    pillBg: 'rgba(88, 28, 135, 0.8)',
    pillBorder: 'rgba(192, 132, 252, 0.4)',
    pillText: '#f3e8ff',
    primaryColor: '#a855f7',
    primaryGlow: 'rgba(168, 85, 247, 0.6)',
    accentGold: '#fbbf24',
    btnGradient: '#9333ea',
    btnBorder: 'rgba(216, 180, 254, 0.4)',
    btnShadow: '0 0 28px rgba(147, 51, 234, 0.65)',
    drawerBorder: '#a855f7',
    drawerBg: '#11021d',
    drawerBadgeBg: '#9333ea',
  },
  roleta: {
    bgGradient: '#02121e',
    baseBg: '#010c14',
    pillBg: 'rgba(3, 105, 161, 0.8)',
    pillBorder: 'rgba(56, 189, 248, 0.4)',
    pillText: '#e0f2fe',
    primaryColor: '#0ea5e9',
    primaryGlow: 'rgba(14, 165, 233, 0.6)',
    accentGold: '#fbbf24',
    btnGradient: '#0284c7',
    btnBorder: 'rgba(125, 211, 252, 0.4)',
    btnShadow: '0 0 28px rgba(14, 165, 233, 0.65)',
    drawerBorder: '#0ea5e9',
    drawerBg: '#02121e',
    drawerBadgeBg: '#0284c7',
  },
  figurinha: {
    bgGradient: '#090717',
    baseBg: '#05040f',
    pillBg: 'rgba(16, 185, 129, 0.25)',
    pillBorder: 'rgba(16, 185, 129, 0.5)',
    pillText: '#ecfdf5',
    primaryColor: '#10b981',
    primaryGlow: 'rgba(16, 185, 129, 0.7)',
    accentGold: '#fbbf24',
    btnGradient: '#10b981',
    btnBorder: 'rgba(16, 185, 129, 0.5)',
    btnShadow: '0 0 28px rgba(16, 185, 129, 0.5)',
    drawerBorder: '#f59e0b',
    drawerBg: '#090717',
    drawerBadgeBg: '#f59e0b',
  },
  puzzle: {
    bgGradient: '#090717',
    baseBg: '#05040f',
    pillBg: 'rgba(16, 185, 129, 0.25)',
    pillBorder: 'rgba(16, 185, 129, 0.5)',
    pillText: '#ecfdf5',
    primaryColor: '#10b981',
    primaryGlow: 'rgba(16, 185, 129, 0.7)',
    accentGold: '#fbbf24',
    btnGradient: '#10b981',
    btnBorder: 'rgba(16, 185, 129, 0.5)',
    btnShadow: '0 0 28px rgba(16, 185, 129, 0.5)',
    drawerBorder: '#f59e0b',
    drawerBg: '#090717',
    drawerBadgeBg: '#f59e0b',
  },
};

// ROLETA 8 SLICES CONFIGURATION (CLEAN TEXT DIRECTLY ON SLICES)
const WHEEL_SLICES = [
  { id: 0, title: 'BÔNUS', value: 'R$ 30.000', color: '#f59e0b', textColor: '#000000', isWin: true },
  { id: 1, title: '+10', value: 'COTAS', color: '#0284c7', textColor: '#ffffff' },
  { id: 2, title: 'R$ 500', value: 'PIX', color: '#059669', textColor: '#ffffff' },
  { id: 3, title: '+20', value: 'COTAS', color: '#7c3aed', textColor: '#ffffff' },
  { id: 4, title: 'QUASE!', value: 'TENTE', color: '#1e293b', textColor: '#ffffff' },
  { id: 5, title: '+50', value: 'COTAS', color: '#0284c7', textColor: '#ffffff' },
  { id: 6, title: 'R$ 100', value: 'PIX', color: '#be123c', textColor: '#ffffff' },
  { id: 7, title: 'EXTRA', value: '+5 COTAS', color: '#0f766e', textColor: '#ffffff' },
];

// PRELOAD PHOTOREALISTIC SCRATCH-OFF FOIL TEXTURE
let foilTextureImg = null;
let foilTextureReady = false;
const foilListeners = new Set();

if (typeof window !== 'undefined') {
  foilTextureImg = new Image();
  foilTextureImg.src = '/images/scratch-foil-gold.jpg?v=2';
  const notifyFoilLoaded = () => {
    foilTextureReady = true;
    foilListeners.forEach((cb) => {
      try { cb(); } catch (e) { }
    });
    foilListeners.clear();
  };
  foilTextureImg.onload = notifyFoilLoaded;
  foilTextureImg.onerror = notifyFoilLoaded;
}

// Deterministic torn/deckle edge polygon shared identically by SSR <svg> and client <canvas>
function buildTornPolygonPoints(w, h, index) {
  const r = Math.min(18, Math.round(w * 0.16));
  const inset = 2.0;
  const toothPitch = 6.2;
  const toothDepth = 3.4;

  const noise = (seed) => {
    const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return v - Math.floor(v);
  };

  const points = [];

  // Top edge
  const topStartX = inset + r;
  const topEndX = w - inset - r;
  const topY = inset;
  const topCount = Math.max(4, Math.floor((topEndX - topStartX) / toothPitch));
  const actualTopPitch = (topEndX - topStartX) / topCount;
  for (let i = 0; i <= topCount; i++) {
    const px = topStartX + i * actualTopPitch;
    const n = noise(index * 47 + i * 1.7 + 10);
    if (i > 0) {
      const bite = toothDepth * (0.65 + 0.65 * n);
      points.push({ x: px - actualTopPitch * 0.6, y: topY + bite });
      points.push({ x: px - actualTopPitch * 0.15, y: topY + bite * 0.35 });
    }
    points.push({ x: px, y: topY + (n - 0.5) * 0.8 });
  }

  // Top-right corner arc
  const trCx = w - inset - r;
  const trCy = inset + r;
  const arcSteps = 5;
  for (let i = 1; i <= arcSteps; i++) {
    const angle = -Math.PI / 2 + (Math.PI / 2) * (i / arcSteps);
    const n = noise(index * 47 + i * 3.1 + 50);
    const bite = i % 2 === 1 ? -toothDepth * (0.6 + 0.5 * n) : (n - 0.5) * 0.8;
    points.push({
      x: trCx + Math.cos(angle) * (r + bite),
      y: trCy + Math.sin(angle) * (r + bite),
    });
  }

  // Right edge
  const rightStartY = inset + r;
  const rightEndY = h - inset - r;
  const rightX = w - inset;
  const rightCount = Math.max(4, Math.floor((rightEndY - rightStartY) / toothPitch));
  const actualRightPitch = (rightEndY - rightStartY) / rightCount;
  for (let i = 0; i <= rightCount; i++) {
    const py = rightStartY + i * actualRightPitch;
    const n = noise(index * 47 + i * 2.3 + 90);
    if (i > 0) {
      const bite = toothDepth * (0.65 + 0.65 * n);
      points.push({ x: rightX - bite, y: py - actualRightPitch * 0.6 });
      points.push({ x: rightX - bite * 0.35, y: py - actualRightPitch * 0.15 });
    }
    points.push({ x: rightX - (n - 0.5) * 0.8, y: py });
  }

  // Bottom-right corner arc
  const brCx = w - inset - r;
  const brCy = h - inset - r;
  for (let i = 1; i <= arcSteps; i++) {
    const angle = 0 + (Math.PI / 2) * (i / arcSteps);
    const n = noise(index * 47 + i * 2.7 + 130);
    const bite = i % 2 === 1 ? -toothDepth * (0.6 + 0.5 * n) : (n - 0.5) * 0.8;
    points.push({
      x: brCx + Math.cos(angle) * (r + bite),
      y: brCy + Math.sin(angle) * (r + bite),
    });
  }

  // Bottom edge
  const botStartX = w - inset - r;
  const botEndX = inset + r;
  const botY = h - inset;
  const botCount = Math.max(4, Math.floor((botStartX - botEndX) / toothPitch));
  const actualBotPitch = (botStartX - botEndX) / botCount;
  for (let i = 0; i <= botCount; i++) {
    const px = botStartX - i * actualBotPitch;
    const n = noise(index * 47 + i * 1.9 + 170);
    if (i > 0) {
      const bite = toothDepth * (0.65 + 0.65 * n);
      points.push({ x: px + actualBotPitch * 0.6, y: botY - bite });
      points.push({ x: px + actualBotPitch * 0.15, y: botY - bite * 0.35 });
    }
    points.push({ x: px, y: botY - (n - 0.5) * 0.8 });
  }

  // Bottom-left corner arc
  const blCx = inset + r;
  const blCy = h - inset - r;
  for (let i = 1; i <= arcSteps; i++) {
    const angle = Math.PI / 2 + (Math.PI / 2) * (i / arcSteps);
    const n = noise(index * 47 + i * 3.5 + 210);
    const bite = i % 2 === 1 ? -toothDepth * (0.6 + 0.5 * n) : (n - 0.5) * 0.8;
    points.push({
      x: blCx + Math.cos(angle) * (r + bite),
      y: blCy + Math.sin(angle) * (r + bite),
    });
  }

  // Left edge
  const leftStartY = h - inset - r;
  const leftEndY = inset + r;
  const leftX = inset;
  const leftCount = Math.max(4, Math.floor((leftStartY - leftEndY) / toothPitch));
  const actualLeftPitch = (leftStartY - leftEndY) / leftCount;
  for (let i = 0; i <= leftCount; i++) {
    const py = leftStartY - i * actualLeftPitch;
    const n = noise(index * 47 + i * 2.1 + 250);
    if (i > 0) {
      const bite = toothDepth * (0.65 + 0.65 * n);
      points.push({ x: leftX + bite, y: py + actualLeftPitch * 0.6 });
      points.push({ x: leftX + bite * 0.35, y: py + actualLeftPitch * 0.15 });
    }
    points.push({ x: leftX + (n - 0.5) * 0.8, y: py });
  }

  // Top-left corner arc
  const tlCx = inset + r;
  const tlCy = inset + r;
  for (let i = 1; i <= arcSteps; i++) {
    const angle = Math.PI + (Math.PI / 2) * (i / arcSteps);
    const n = noise(index * 47 + i * 2.9 + 290);
    const bite = i % 2 === 1 ? -toothDepth * (0.6 + 0.5 * n) : (n - 0.5) * 0.8;
    points.push({
      x: tlCx + Math.cos(angle) * (r + bite),
      y: tlCy + Math.sin(angle) * (r + bite),
    });
  }

  return points;
}

// REDESIGNED BRAZILIAN 5 CENTAVOS BRONZE COIN (3D Vector Icon)
function BronzeCoin5Centavos({ size = 68, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{
        filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.75)) drop-shadow(0 3px 5px rgba(0, 0, 0, 0.5))',
        transform: 'rotate(-12deg)',
        transformOrigin: 'center center',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    >
      <defs>
        <linearGradient id="bc5c_rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="20%" stopColor="#b45309" />
          <stop offset="48%" stopColor="#78350f" />
          <stop offset="76%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#3d1502" />
        </linearGradient>

        <radialGradient id="bc5c_face" cx="36%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="18%" stopColor="#f59e0b" />
          <stop offset="52%" stopColor="#c2410c" />
          <stop offset="82%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#3d1502" />
        </radialGradient>

        <linearGradient id="bc5c_text" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="30%" stopColor="#fed7aa" />
          <stop offset="68%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>

      {/* 3D Depth Under-Rim Shadow */}
      <circle cx="51.5" cy="52.5" r="46.5" fill="#2e1003" opacity="0.9" />

      {/* Outer Bronze Rim */}
      <circle cx="50" cy="50" r="47" fill="url(#bc5c_rim)" stroke="#3d1502" strokeWidth="1" />

      {/* Reeded / Milled Serrated Edge */}
      <circle
        cx="50"
        cy="50"
        r="45.5"
        fill="none"
        stroke="#78350f"
        strokeWidth="1.8"
        strokeDasharray="1.2,1.2"
        opacity="0.75"
      />

      {/* Inner Recessed Face */}
      <circle cx="50" cy="50" r="43" fill="url(#bc5c_face)" stroke="#fcd34d" strokeWidth="0.8" opacity="0.98" />

      {/* Diagonal Dynamic Stripes (Brazilian Real coin motif) */}
      <g stroke="#9a3412" strokeWidth="1.5" opacity="0.4" strokeLinecap="round">
        <line x1="26" y1="8" x2="92" y2="74" />
        <line x1="34" y1="6" x2="96" y2="68" />
        <line x1="42" y1="6" x2="98" y2="62" />
        <line x1="50" y1="6" x2="98" y2="54" />
        <line x1="58" y1="8" x2="96" y2="46" />
      </g>

      {/* Southern Cross Constellation (Cruzeiro do Sul) */}
      <g fill="#fef3c7" filter="drop-shadow(0 1px 1px #3d1502)">
        <polygon points="76,43 77.2,46 80,46.3 77.8,48.2 78.5,51 76,49.4 73.5,51 74.2,48.2 72,46.3 74.8,46" />
        <polygon points="70,31 71,33.4 73.4,33.6 71.6,35.1 72.2,37.5 70,36.2 67.8,37.5 68.4,35.1 66.6,33.6 69,33.4" />
        <polygon points="77,22 78.2,25 81,25.3 78.8,27.2 79.5,30 77,28.4 74.5,30 75.2,27.2 73,25.3 75.8,25" />
        <polygon points="84,33 84.8,35 87,35.2 85.3,36.6 85.8,38.8 84,37.6 82.2,38.8 82.7,36.6 81,35.2 83.2,35" />
        <polygon points="78,35 78.6,36.4 80,36.5 78.8,37.4 79.2,38.8 78,38 76.8,38.8 77.2,37.4 76,36.5 77.4,36.4" />
      </g>

      {/* Stamped BRASIL Typography */}
      <text
        x="77"
        y="15.5"
        fill="url(#bc5c_text)"
        fontSize="5.2"
        fontWeight="900"
        fontFamily="'Archivo', sans-serif"
        letterSpacing="0.1em"
        textAnchor="middle"
        filter="drop-shadow(0 1px 1px #3d1502)"
      >
        BRASIL
      </text>

      {/* Large Chiseled Numeral "5" */}
      <text
        x="37"
        y="60"
        fill="#2e1003"
        fontSize="43"
        fontWeight="900"
        fontFamily="'Archivo', 'Impact', sans-serif"
        textAnchor="middle"
      >
        5
      </text>
      <text
        x="35"
        y="58"
        fill="url(#bc5c_text)"
        fontSize="43"
        fontWeight="900"
        fontFamily="'Archivo', 'Impact', sans-serif"
        textAnchor="middle"
        filter="drop-shadow(0 1px 1px rgba(255, 255, 255, 0.45))"
      >
        5
      </text>

      {/* "CENTAVOS" below numeral 5 */}
      <text
        x="49"
        y="75.5"
        fill="#2e1003"
        fontSize="8.5"
        fontWeight="900"
        fontFamily="'Archivo', sans-serif"
        letterSpacing="0.16em"
        textAnchor="middle"
      >
        CENTAVOS
      </text>
      <text
        x="48"
        y="74.5"
        fill="url(#bc5c_text)"
        fontSize="8.5"
        fontWeight="900"
        fontFamily="'Archivo', sans-serif"
        letterSpacing="0.16em"
        textAnchor="middle"
        filter="drop-shadow(0 1px 1px rgba(255, 255, 255, 0.35))"
      >
        CENTAVOS
      </text>

      {/* Metallic Specular Curved Sheen */}
      <path
        d="M 17,35 A 42,42 0 0,1 83,35 A 42,30 0 0,0 17,35 Z"
        fill="#ffffff"
        opacity="0.18"
      />
    </svg>
  );
}

// INDIVIDUAL INTERACTIVE CANVAS SCRATCH TILE WITH PHYSICAL REALISM
function ScratchTile({
  index,
  tileData,
  isScratched,
  isDisabled = false,
  onCanStartScratch,
  onReveal,
  onFriction,
  themeColor = '#e52e2e',
  tileText = '',
}) {
  const canvasRef = useRef(null);
  const isScratchingRef = useRef(false);
  const lastPosRef = useRef(null);
  const clearedSamplesRef = useRef(0);
  const strokePointsRef = useRef(0);
  const [foilReady, setFoilReady] = useState(false);

  const callbacksRef = useRef({
    isScratched,
    isDisabled,
    onCanStartScratch,
    onReveal,
    onFriction,
  });
  callbacksRef.current = {
    isScratched,
    isDisabled,
    onCanStartScratch,
    onReveal,
    onFriction,
  };

  // Initialize metallic foil on canvas with authentic Scratch-Off Gold Foil Texture & realistic torn/deckle edges
  const drawFoil = useCallback((forceFallback = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (isScratched) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Never redraw foil over a tile that the user has already started scratching
    if (strokePointsRef.current > 0 || isScratchingRef.current) {
      return;
    }

    // Wait for the photorealistic gold texture before replacing the identical SSR SVG cover
    if (!foilTextureReady && !forceFallback) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 110;
    const h = rect.height || 110;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, w, h);

    // 1. Build Physical Deckle/Torn Edge Path
    const points = buildTornPolygonPoints(w, h, index);

    const traceTornPath = () => {
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
    };

    // 2. Clip and draw Gold Texture strictly within the torn paper shape
    ctx.save();
    traceTornPath();
    ctx.clip();

    if (foilTextureReady && foilTextureImg && foilTextureImg.naturalWidth > 0) {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const srcW = Math.floor(foilTextureImg.naturalWidth / 2.5);
      const srcH = Math.floor(foilTextureImg.naturalHeight / 2.5);
      const srcX = Math.floor(col * (foilTextureImg.naturalWidth - srcW) / 2);
      const srcY = Math.floor(row * (foilTextureImg.naturalHeight - srcH) / 2);
      ctx.filter = 'brightness(1.26) contrast(1.10) saturate(1.32)';
      ctx.drawImage(foilTextureImg, srcX, srcY, srcW, srcH, 0, 0, w, h);
      ctx.filter = 'none';

      // Golden metallic luster sheen overlay
      const sheen = ctx.createLinearGradient(0, 0, w * 0.85, h);
      sheen.addColorStop(0.0, 'rgba(255, 255, 255, 0.32)');
      sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.06)');
      sheen.addColorStop(0.65, 'rgba(255, 240, 170, 0.24)');
      sheen.addColorStop(1.0, 'rgba(255, 255, 255, 0.15)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);
    } else {
      const foilGrad = ctx.createLinearGradient(0, 0, w, h);
      foilGrad.addColorStop(0.00, '#f59e0b');
      foilGrad.addColorStop(0.20, '#fbbf24');
      foilGrad.addColorStop(0.40, '#fef9c3');
      foilGrad.addColorStop(0.60, '#fde047');
      foilGrad.addColorStop(0.85, '#f59e0b');
      foilGrad.addColorStop(1.00, '#d97706');
      ctx.fillStyle = foilGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Micro perforation stippling dots near edges
    ctx.fillStyle = 'rgba(26, 20, 14, 0.45)';
    const dotCoords = [
      [w * 0.08, h * 0.08], [w * 0.14, h * 0.06], [w * 0.22, h * 0.07],
      [w * 0.88, h * 0.08], [w * 0.92, h * 0.14], [w * 0.93, h * 0.24],
      [w * 0.93, h * 0.82], [w * 0.88, h * 0.91], [w * 0.78, h * 0.93],
      [w * 0.12, h * 0.91], [w * 0.07, h * 0.84], [w * 0.06, h * 0.22]
    ];
    for (const [dx, dy] of dotCoords) {
      ctx.beginPath();
      ctx.arc(dx, dy, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Torn Paper Edge Highlights and Contours
    ctx.save();
    traceTornPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    traceTornPath();
    ctx.strokeStyle = 'rgba(28, 18, 10, 0.7)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.restore();

    // 4. Stamped Embossed Letterpress Typography: Number Medallion & Scratch Prompt
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = w / 2;
    const cy = h / 2;
    const tileNum = index + 1;

    if (tileNum) {
      const rMedal = Math.min(w, h) * 0.28;

      ctx.beginPath();
      ctx.arc(cx, cy, rMedal, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(28, 18, 10, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy + 1, rMedal - 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      const smallFontSize = Math.max(9, Math.round(w * 0.11));
      ctx.font = `900 ${smallFontSize}px "Archivo", "Impact", -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText('Nº', cx, cy - rMedal * 0.52 + 1.2);
      ctx.fillStyle = '#202225';
      ctx.fillText('Nº', cx, cy - rMedal * 0.52);

      const numFontSize = Math.max(22, Math.round(w * 0.38));
      ctx.font = `900 ${numFontSize}px "Archivo", "Impact", -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(String(tileNum), cx, cy + rMedal * 0.16 + 1.2);
      ctx.fillStyle = '#1c120a';
      ctx.fillText(String(tileNum), cx, cy + rMedal * 0.16);

      const subFontSize = Math.max(8, Math.round(w * 0.095));
      ctx.font = `900 ${subFontSize}px "Archivo", -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('RASPE', cx, h - Math.round(h * 0.12) + 1.2);
      ctx.fillStyle = '#202225';
      ctx.fillText('RASPE', cx, h - Math.round(h * 0.12));
    }

    ctx.restore();
    setFoilReady(true);
  }, [isScratched, index]);

  useEffect(() => {
    if (foilTextureReady) {
      drawFoil();
    } else {
      const onLoaded = () => drawFoil();
      foilListeners.add(onLoaded);
      return () => {
        foilListeners.delete(onLoaded);
      };
    }
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!isScratched && foilTextureReady) drawFoil();
      });
    }
  }, [drawFoil, isScratched]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const handleResize = () => drawFoil();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFoil, isScratched]);

  // Scratch Action with touch/mouse coordinates
  const scratchAt = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas || callbacksRef.current.isScratched) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;

    ctx.save();
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    const strokeWidth = Math.max(30, Math.round(rect.width * 0.34));
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastPosRef.current) {
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    lastPosRef.current = { x, y };
    strokePointsRef.current += 1;
    callbacksRef.current.onFriction?.();
    particleEngine.spawnLatexShavings(clientX, clientY, 4);

    // Check clearance every 3 moves or when enough strokes accumulated
    clearedSamplesRef.current += 1;
    if (clearedSamplesRef.current % 3 === 0 || strokePointsRef.current >= 12) {
      checkClearedPercentage();
    }
  }, [index]);

  const checkClearedPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || callbacksRef.current.isScratched) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    if (!width || !height) return;

    let percent = 0;
    try {
      const imgData = ctx.getImageData(0, 0, width, height).data;
      let transparentCount = 0;
      let totalSampled = 0;
      const stepX = Math.max(4, Math.floor(width / 6));
      const stepY = Math.max(4, Math.floor(height / 6));

      for (let x = Math.floor(stepX / 2); x < width; x += stepX) {
        for (let y = Math.floor(stepY / 2); y < height; y += stepY) {
          const alphaIdx = (y * width + x) * 4 + 3;
          totalSampled++;
          if (imgData[alphaIdx] < 50) {
            transparentCount += 1;
          }
        }
      }
      percent = totalSampled > 0 ? transparentCount / totalSampled : 0;
    } catch (err) {
      percent = strokePointsRef.current >= 10 ? 0.5 : 0;
    }

    if (percent > 0.24 || strokePointsRef.current >= 14) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.restore();
      isScratchingRef.current = false;
      sounds.stopContinuousScratch();
      callbacksRef.current.onReveal?.(index);
    }
  }, [index]);

  // Native non-passive Touch Event Listeners directly on <canvas> for 100% mobile physical phone support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;

    const handleTouchStart = (e) => {
      if (callbacksRef.current.isScratched || callbacksRef.current.isDisabled) return;
      const canStart = callbacksRef.current.onCanStartScratch
        ? callbacksRef.current.onCanStartScratch(index)
        : true;
      if (!canStart) return;

      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      if (!foilTextureReady) {
        drawFoil(true);
      }

      sounds.init();
      sounds.startContinuousScratch();
      isScratchingRef.current = true;
      strokePointsRef.current = 0;
      lastPosRef.current = null;

      const touch = e.touches[0] || e.changedTouches[0];
      if (touch) {
        scratchAt(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (!isScratchingRef.current || callbacksRef.current.isScratched) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      if (!sounds.continuousSource) {
        sounds.startContinuousScratch();
      } else {
        sounds.pingContinuousScratch();
      }

      const touch = e.touches[0] || e.changedTouches[0];
      if (touch) {
        scratchAt(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e) => {
      if (!isScratchingRef.current) return;
      isScratchingRef.current = false;
      lastPosRef.current = null;
      sounds.stopContinuousScratch();

      // Complete reveal when the user rubbed the tile with their finger
      if (!callbacksRef.current.isScratched) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
        callbacksRef.current.onReveal?.(index);
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isScratched, index, scratchAt]);

  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return; // Handled by native non-passive touch listeners
    if (isScratched || isDisabled) return;

    const canStart = onCanStartScratch ? onCanStartScratch(index) : true;
    if (!canStart) return;

    e.preventDefault();
    if (!foilTextureReady) {
      drawFoil(true);
    }
    sounds.init();
    sounds.startContinuousScratch();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) { }
    isScratchingRef.current = true;
    strokePointsRef.current = 0;
    lastPosRef.current = null;
    scratchAt(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch') return;
    if (!isScratchingRef.current || isScratched) return;
    e.preventDefault();
    if (!sounds.continuousSource) {
      sounds.startContinuousScratch();
    } else {
      sounds.pingContinuousScratch();
    }
    scratchAt(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    if (e && e.pointerType === 'touch') return;
    if (isScratchingRef.current) {
      isScratchingRef.current = false;
      lastPosRef.current = null;
      sounds.stopContinuousScratch();
      if (!isScratched) {
        const canvas = canvasRef.current;
        const ctx = canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;
        if (ctx && canvas) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
        onReveal?.(index);
      }
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`yrm4 ${isScratched ? 'khso' : ''} ${isScratched && tileData.isBonus ? 'heuj' : ''}`}
      style={{
        position: 'relative',
        aspectRatio: '1',
        overflow: 'hidden',
        borderRadius: 'clamp(14px, 3.4cqw, 18px)',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        pointerEvents: isDisabled && !isScratched ? 'none' : 'auto',
        opacity: isDisabled && !isScratched ? 0.52 : 1,
        cursor: isScratched || isDisabled ? 'default' : 'grab',
        background: isScratched && tileData.isBonus
          ? '#ffc531'
          : isScratched
            ? '#121216'
            : 'transparent',
        boxShadow: isScratched && tileData.isBonus
          ? '0 0 24px rgba(251, 191, 36, 0.75), inset 0 2px 2px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(146, 64, 14, 0.5)'
          : isScratched
            ? 'inset 0 3px 8px rgba(0, 0, 0, 0.85), inset 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : 'none',
        border: isScratched && tileData.isBonus
          ? '2px solid #fbbf24'
          : isScratched
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : 'none',
        animation: isScratched && tileData.isBonus ? 'jf57 1.6s ease-in-out infinite' : 'none',
        transition: 'all 0.3s cubic-bezier(0.2, 1, 0.3, 1)',
      }}
    >
      {/* UNDERNEATH PRIZE CONTENT (Hidden until foil canvas is ready so it never flashes) */}
      <div
        className="b9nb"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          textAlign: 'center',
          padding: tileData.image || tileData.isCar ? 0 : '6% 4%',
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 900,
          lineHeight: 1.05,
          userSelect: 'none',
          overflow: 'hidden',
          borderRadius: '14px',
          visibility: foilReady || isScratched ? 'visible' : 'hidden',
          opacity: foilReady || isScratched ? 1 : 0,
          animation: isScratched ? 'cumo 0.45s cubic-bezier(0.2, 1.5, 0.4, 1) both' : 'none',
        }}
      >
        {tileData.image || tileData.isCar ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#0a0a0c',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
            }}
          >
            <img
              src={tileData.image || '/uploads/images/img_1794593368169_3x36rj.png'}
              alt={tileData.label || 'Carro 0KM'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                color: '#ffffff',
                fontSize: 'clamp(7.5px, 2.1cqw, 9px)',
                fontWeight: 900,
                padding: '2px 5px',
                borderRadius: '5px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.7)',
                letterSpacing: '0.04em',
              }}
            >
              ★ PREMIADO
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.65) 65%, transparent 100%)',
                padding: '4px 3px 5px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(8.5px, 2.4cqw, 10.5px)',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                  textTransform: 'uppercase',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}
              >
                {tileData.label || 'SAVEIRO CROSS'}
              </span>
            </div>
          </div>
        ) : tileData.isBonus ? (
          <>
            <span
              style={{
                fontSize: 'clamp(22px, 5.6cqw, 28px)',
                lineHeight: 1,
                marginBottom: '3px',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45))',
              }}
            >
              {tileData.symbol || '🎁'}
            </span>
            <span
              style={{
                fontSize: 'clamp(12px, 3.4cqw, 15px)',
                letterSpacing: '0.03em',
                fontWeight: 900,
                color: '#1a0f00',
                filter: 'drop-shadow(0 1px 0 rgba(255, 255, 255, 0.55))',
                lineHeight: 1.1,
                maxWidth: '94%',
                wordBreak: 'break-word',
                textTransform: 'uppercase',
              }}
            >
              {tileData.label || 'BÔNUS'}
            </span>
          </>
        ) : (
          <>
            <span
              style={{
                fontSize: 'clamp(18px, 4.6cqw, 24px)',
                lineHeight: 1,
                marginBottom: '2px',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
              }}
            >
              {tileData.symbol || '❌'}
            </span>
            <span
              style={{
                fontSize: 'clamp(9px, 2.4cqw, 11px)',
                letterSpacing: '-0.01em',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#cbd5e1',
                lineHeight: 1.15,
                maxWidth: '92%',
                wordBreak: 'break-word',
              }}
            >
              {tileData.label || tileData.sub || tileData.title || 'NÃO FOI DESSA VEZ'}
            </span>
          </>
        )}
      </div>

      {/* OVERLAY SCRATCH CANVAS */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: isScratched ? 'none' : 'block',
          zIndex: 3,
          borderRadius: 'inherit',
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      />

      {/* IDENTICAL TORN-EDGE GOLD FOIL SVG COVER (Matches <canvas> pixel-for-pixel from SSR frame 0) */}
      {!foilReady && !isScratched && (() => {
        const w = 110;
        const h = 110;
        const pts = buildTornPolygonPoints(w, h, index);
        const pointsAttr = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
        const col = index % 3;
        const row = Math.floor(index / 3);
        const cx = 55;
        const cy = 55;
        const rMedal = 30.8;
        const tileNum = index + 1;
        return (
          <svg
            aria-hidden="true"
            viewBox="0 0 110 110"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 4,
              width: '100%',
              height: '100%',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <clipPath id={`dx-foil-clip-${index}`}>
                <polygon points={pointsAttr} />
              </clipPath>
              <linearGradient id={`dx-foil-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="20%" stopColor="#fbbf24" />
                <stop offset="40%" stopColor="#fef9c3" />
                <stop offset="60%" stopColor="#fde047" />
                <stop offset="85%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id={`dx-foil-sheen-${index}`} x1="0%" y1="0%" x2="85%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.32)" />
                <stop offset="35%" stopColor="rgba(255, 255, 255, 0.06)" />
                <stop offset="65%" stopColor="rgba(255, 240, 170, 0.24)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.15)" />
              </linearGradient>
            </defs>

            <g clipPath={`url(#dx-foil-clip-${index})`}>
              <rect x="0" y="0" width="110" height="110" fill={`url(#dx-foil-grad-${index})`} />
              <image
                href="/images/scratch-foil-gold.jpg?v=2"
                x={-col * 82.5}
                y={-row * 82.5}
                width="275"
                height="275"
                preserveAspectRatio="none"
                style={{ filter: 'brightness(1.26) contrast(1.10) saturate(1.32)' }}
              />
              <rect x="0" y="0" width="110" height="110" fill={`url(#dx-foil-sheen-${index})`} />
              <g fill="rgba(26, 20, 14, 0.45)">
                <circle cx={w * 0.08} cy={h * 0.08} r="0.9" />
                <circle cx={w * 0.14} cy={h * 0.06} r="0.9" />
                <circle cx={w * 0.22} cy={h * 0.07} r="0.9" />
                <circle cx={w * 0.88} cy={h * 0.08} r="0.9" />
                <circle cx={w * 0.92} cy={h * 0.14} r="0.9" />
                <circle cx={w * 0.93} cy={h * 0.24} r="0.9" />
                <circle cx={w * 0.93} cy={h * 0.82} r="0.9" />
                <circle cx={w * 0.88} cy={h * 0.91} r="0.9" />
                <circle cx={w * 0.78} cy={h * 0.93} r="0.9" />
                <circle cx={w * 0.12} cy={h * 0.91} r="0.9" />
                <circle cx={w * 0.07} cy={h * 0.84} r="0.9" />
                <circle cx={w * 0.06} cy={h * 0.22} r="0.9" />
              </g>
            </g>

            <polygon points={pointsAttr} fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.3" />
            <polygon points={pointsAttr} fill="none" stroke="rgba(28, 18, 10, 0.7)" strokeWidth="0.9" />

            <circle cx={cx} cy={cy} r={rMedal} fill="none" stroke="rgba(28, 18, 10, 0.55)" strokeWidth="1.6" />
            <circle cx={cx} cy={cy + 1} r={rMedal - 1.2} fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.0" />

            <text
              x={cx}
              y={cy - rMedal * 0.52 + 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Archivo', 'Impact', -apple-system, sans-serif"
              fontWeight="900"
              fontSize="12"
              fill="rgba(255, 255, 255, 0.75)"
            >
              Nº
            </text>
            <text
              x={cx}
              y={cy - rMedal * 0.52}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Archivo', 'Impact', -apple-system, sans-serif"
              fontWeight="900"
              fontSize="12"
              fill="#202225"
            >
              Nº
            </text>

            <text
              x={cx}
              y={cy + rMedal * 0.16 + 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Archivo', 'Impact', -apple-system, sans-serif"
              fontWeight="900"
              fontSize="42"
              fill="rgba(255, 255, 255, 0.85)"
            >
              {tileNum}
            </text>
            <text
              x={cx}
              y={cy + rMedal * 0.16}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Archivo', 'Impact', -apple-system, sans-serif"
              fontWeight="900"
              fontSize="42"
              fill="#1c120a"
            >
              {tileNum}
            </text>

            <text
              x={cx}
              y={h - 13 + 1.2}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Archivo', -apple-system, sans-serif"
              fontWeight="900"
              fontSize="10"
              fill="rgba(255, 255, 255, 0.7)"
            >
              RASPE
            </text>
            <text
              x={cx}
              y={h - 13}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Archivo', -apple-system, sans-serif"
              fontWeight="900"
              fontSize="10"
              fill="#202225"
            >
              RASPE
            </text>
          </svg>
        );
      })()}
    </div>
  );
}

const resolvePuzzleImageUrl = (img) => {
  if (!img) return null;
  const s = String(img).trim();
  if (!s) return null;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') || s.startsWith('data:')) {
    return s;
  }
  return `/images/puzzles/${s}`;
};

// Creates a neutral 3x3 numbered grid (1..9); actual tile outcomes are assigned dynamically upon touch per round rules
function createInitialNeutralGrid(offerConfig = {}) {
  const nonWinningText = offerConfig?.scratchNonWinningText || 'NÃO FOI DESSA VEZ';
  const carImage = offerConfig?.scratchPrizeImage || '/uploads/images/img_1794593368169_3x36rj.png';
  const carTitle = offerConfig?.scratchPrizeTitle || 'SAVEIRO CROSS';

  const grid = [];
  for (let i = 0; i < 9; i++) {
    grid.push({
      tileNumber: i + 1,
      isBonus: false,
      isCar: false,
      image: null,
      label: nonWinningText,
      sub: nonWinningText,
      title: '❌',
      symbol: '❌',
      prize: null,
    });
  }

  return {
    grid,
    winningPrize: { label: carTitle, symbol: '🚗', image: carImage },
  };
}

export default function DxOfferGameLayout({
  gameType = 'raspadinha', // 'raspadinha' | 'caixa' | 'roleta'
  initialConfig = {},
  initialPrizes = [],
}) {
  const theme = GAME_THEMES[gameType] || GAME_THEMES.raspadinha;

  // Query parameters or config values
  const [params, setParams] = useState(() => ({
    premio: 'MT - 03',
    artigo: 'a',
    bonus: 'R$30.000',
    compraMinima: 'R$20',
    dest: '',
    videoUrl:
      'https://midia.dxhost.com.br/media/01a0deef-3837-730c-bd2a-e6528229aea0/502f7bcddef242c20cd2c7ea83f9898c5bde1bb16985441c5bf7e200637ce91c.mp4',
    puzzleImage: '',
    nome: '',
    prazoMinutos: 3,
    raspadinhaBgImage: '/uploads/images/img_1794594245457_jttjin.jpg',
    raspadinhaBgOverlay: 75,
    scratchGameMode: 'numbered',
    scratchPrizeImage: '/uploads/images/img_1794593368169_3x36rj.png',
    scratchPrizeTitle: 'SAVEIRO CROSS',
    ...initialConfig,
  }));
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // HEVON Telemetry Refs (Tempo na página, Vídeo assistido, Exit Intent e Controle de Marcos Únicos)
  const hevonStartTimeRef = useRef(Date.now());
  const hevonMaxVideoPctRef = useRef(0);
  const hevonExitIntentRef = useRef(false);
  const hevonMilestonesSentRef = useRef({
    game_started: false,
    near_miss: false,
    reward_granted: false,
    cta_clicked: false,
  });

  useEffect(() => {
    // Pré-captura IPv4/IPv6 (headers nativos do servidor primeiro; ipify só como fallback 1x/sessão)
    prefetchHevonClientIps();

    const onMouseLeave = (e) => {
      if (e.clientY <= 0) {
        hevonExitIntentRef.current = true;
      }
    };
    document.addEventListener('mouseleave', onMouseLeave);
    return () => document.removeEventListener('mouseleave', onMouseLeave);
  }, []);

  const getTaggedOfferUrl = useCallback(
    (rawDest = '') => {
      const normalizedType = normalizeClientGameType(gameType);
      return appendUpsellFlowUtm(rawDest, normalizedType);
    },
    [gameType]
  );

  const emitHevonEvent = useCallback((eventPayload) => {
    const cfg = paramsRef.current || {};
    const normalizedType = normalizeClientGameType(gameType);
    const defaultNames = {
      puzzle: 'Quebra-Cabeça Premiado',
      raspadinha: 'Raspadinha Premiada',
      roleta: 'Roleta da Sorte',
      caixa_misteriosa: 'Caixa Misteriosa',
    };
    const experienceName =
      cfg.experienceName ||
      (cfg.premio ? `${defaultNames[normalizedType] || normalizedType} · ${cfg.premio}` : defaultNames[normalizedType] || normalizedType);

    trackHevonClientEvent(
      {
        game_type: normalizedType,
        experience_slug: cfg.experienceSlug || normalizedType,
        experience_name: experienceName,
        ...eventPayload,
      },
      {
        destUrl: getTaggedOfferUrl(cfg.dest || ''),
        startTimeMs: hevonStartTimeRef.current,
        videoWatchedPct: hevonMaxVideoPctRef.current,
        exitIntentDetected: hevonExitIntentRef.current,
      }
    );
  }, [gameType, getTaggedOfferUrl]);

  const emitGameStartedOnce = useCallback(
    (extraInteraction = {}) => {
      if (hevonMilestonesSentRef.current.game_started) return;
      hevonMilestonesSentRef.current.game_started = true;
      emitHevonEvent({
        event: 'game_interacted',
        interaction: {
          action: 'game_started',
          ...extraInteraction,
        },
      });
    },
    [emitHevonEvent]
  );

  const [stage, setStage] = useState('game'); // 'game' | 'offer'
  const [showUnlockDrawer, setShowUnlockDrawer] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);

  // Video states (inicia com som ativado; desbloqueado no último gesto do usuário na raspadinha)
  const videoRef = useRef(null);
  const videoUnlockedRef = useRef(false);
  const offerVideoActiveRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('0:00');
  const [durationStr, setDurationStr] = useState('0:00');

  // Desbloqueia o elemento <video> com canal de áudio ativo aproveitando o gesto síncrono do usuário na Etapa 1
  const unlockVideoWithSoundOnGesture = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || videoUnlockedRef.current || offerVideoActiveRef.current) return;
    try {
      vid.muted = false;
      vid.volume = 0.001;
      const playPromise = vid.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            videoUnlockedRef.current = true;
            if (!offerVideoActiveRef.current) {
              vid.pause();
              vid.currentTime = 0;
              vid.volume = 1;
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  // Inicia o vídeo da Etapa 2 já com som ativado
  const startOfferVideoWithSound = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    offerVideoActiveRef.current = true;
    try {
      vid.currentTime = 0;
      vid.muted = false;
      vid.volume = 1;
      setIsMuted(false);
      const p = vid.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        }).catch(() => {
          // Fallback caso o navegador bloqueie áudio sem gesto direto
          vid.muted = true;
          setIsMuted(true);
          vid.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      } else {
        setIsPlaying(true);
      }
    } catch {}
  }, []);

  // Raspadinha 2-Round State & Strict 3-Pick Cap Refs
  const [scratchRound, setScratchRound] = useState(1); // 1 = Car Near-Miss Round, 2 = Guaranteed BÔNUS Round
  const scratchRoundRef = useRef(1);
  const [roundKey, setRoundKey] = useState(0);
  const [pickedOrder, setPickedOrder] = useState([]);
  const pickedOrderRef = useRef([]);
  const activeTileRef = useRef(null);
  const [activeTileIndex, setActiveTileIndex] = useState(null);
  const roundLockedRef = useRef(false);
  const scratchedTilesRef = useRef(Array(9).fill(false));
  const [showSecondChanceModal, setShowSecondChanceModal] = useState(false);

  // Produto sorteado aleatoriamente para esta sessão/carregamento da Raspadinha (sem repetir no F5 seguido)
  const selectedScratchProductRef = useRef(null);
  const scratchProductPickedFromLiveRef = useRef(false);

  const ensureScratchProductSelected = useCallback((cfgSource, { forceRePick = false } = {}) => {
    if (gameType !== 'raspadinha') return null;
    if (selectedScratchProductRef.current && !forceRePick) {
      return selectedScratchProductRef.current;
    }

    const cfg = cfgSource || paramsRef.current || {};
    let lastId = null;
    try {
      if (typeof window !== 'undefined') {
        lastId = window.sessionStorage.getItem('uf_last_scratch_product_id');
      }
    } catch {}

    const chosen = pickRandomScratchProduct(cfg, { lastProductId: lastId });
    selectedScratchProductRef.current = chosen;

    try {
      if (typeof window !== 'undefined' && chosen?.id) {
        window.sessionStorage.setItem('uf_last_scratch_product_id', chosen.id);
      }
      if (typeof window !== 'undefined' && chosen?.image) {
        const preloadImg = new Image();
        preloadImg.src = chosen.image;
      }
    } catch {}

    return chosen;
  }, [gameType]);

  // Sorteia o produto assim que o componente monta no cliente (quando há SSR config)
  useEffect(() => {
    if (gameType !== 'raspadinha') return;
    if (initialConfig?.ssrLoaded && !scratchProductPickedFromLiveRef.current) {
      scratchProductPickedFromLiveRef.current = true;
      ensureScratchProductSelected(initialConfig, { forceRePick: true });
    }
  }, [gameType, initialConfig, ensureScratchProductSelected]);

  // Raspadinha Interactive Tiles
  const [tiles, setTiles] = useState(() => {
    if (gameType === 'raspadinha') {
      const { grid } = createInitialNeutralGrid(initialConfig);
      return grid;
    }
    return [];
  });
  const [tilesLoaded, setTilesLoaded] = useState(() => gameType === 'raspadinha');
  const [wonPrize, setWonPrize] = useState(() => {
    if (gameType === 'raspadinha') {
      const { winningPrize } = createInitialNeutralGrid(initialConfig);
      return winningPrize;
    }
    return null;
  });
  const [wonCarPrize, setWonCarPrize] = useState(null);
  const [scratchedTiles, setScratchedTiles] = useState(Array(9).fill(false));
  const [bonusCount, setBonusCount] = useState(0);

  // Caixa Misteriosa states
  const [openedBoxIndex, setOpenedBoxIndex] = useState(null);
  const [wobblingBox, setWobblingBox] = useState(null);

  // Roleta states
  const [wheelAngle, setWheelAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  // Figurinha / Puzzle states (1 clique = 1 peça gerada; inicia 100% VAZIO)
  const [packOpened, setPackOpened] = useState(false);
  const [rippingPack, setRippingPack] = useState(false);
  const [collectedPieces, setCollectedPieces] = useState([]); // Inicia com 0 peças []
  const [justUnlockedPiece, setJustUnlockedPiece] = useState(null);

  // Root container ref for auto-resize
  const containerRef = useRef(null);
  const canvasConfettiRef = useRef(null);
  const canvasParticlesRef = useRef(null);

  // Preload and unlock audio engine on first gesture
  useEffect(() => {
    sounds.preload();
    const unlockAudio = () => {
      sounds.init();
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Load saved config and prizes from database on mount + merge URL Search Params
  useEffect(() => {
    if (initialConfig?.ssrLoaded) {
      if (typeof window !== 'undefined' && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        setParams((prev) => {
          const merged = { ...prev };
          if (urlParams.get('premio')) merged.premio = urlParams.get('premio');
          if (urlParams.get('bonus')) merged.bonus = urlParams.get('bonus');
          if (urlParams.get('video')) merged.videoUrl = urlParams.get('video');
          if (urlParams.get('dest') || urlParams.get('destino') || urlParams.get('url')) {
            merged.dest = urlParams.get('dest') || urlParams.get('destino') || urlParams.get('url');
          }
          if (urlParams.get('prazo')) merged.prazoMinutos = parseInt(urlParams.get('prazo'), 10) || 3;
          if (urlParams.get('puzzleImage') || urlParams.get('foto') || urlParams.get('imagem')) {
            merged.puzzleImage = urlParams.get('puzzleImage') || urlParams.get('foto') || urlParams.get('imagem');
          }
          return merged;
        });
      }
      if (initialConfig.prazoMinutos) {
        setTimeLeft(parseInt(initialConfig.prazoMinutos, 10) * 60);
      }
      return;
    }

    fetch(`/api/games/config?game=${gameType}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          if (data.offer_config) {
            setParams((prev) => {
              const merged = { ...prev, ...data.offer_config };
              if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('premio')) merged.premio = urlParams.get('premio');
                if (urlParams.get('bonus')) merged.bonus = urlParams.get('bonus');
                if (urlParams.get('video')) merged.videoUrl = urlParams.get('video');
                if (urlParams.get('dest') || urlParams.get('destino') || urlParams.get('url')) {
                  merged.dest = urlParams.get('dest') || urlParams.get('destino') || urlParams.get('url');
                }
                if (urlParams.get('prazo')) merged.prazoMinutos = parseInt(urlParams.get('prazo'), 10) || 3;
                if (urlParams.get('puzzleImage') || urlParams.get('foto') || urlParams.get('imagem')) {
                  merged.puzzleImage = urlParams.get('puzzleImage') || urlParams.get('foto') || urlParams.get('imagem');
                }
              }
              return merged;
            });
            if (data.offer_config.prazoMinutos) {
              setTimeLeft(parseInt(data.offer_config.prazoMinutos) * 60);
            }
          }

          if (gameType === 'raspadinha') {
            if (pickedOrderRef.current.length === 0) {
              scratchProductPickedFromLiveRef.current = true;
              ensureScratchProductSelected(data.offer_config || {}, { forceRePick: true });
              const { grid, winningPrize } = createInitialNeutralGrid(data.offer_config || {});
              setTiles(grid);
              setWonPrize(winningPrize);
              scratchedTilesRef.current = Array(9).fill(false);
              setScratchedTiles(Array(9).fill(false));
              setBonusCount(0);
            }
            setTilesLoaded(true);
          } else {
            setTilesLoaded(true);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching game offer config:', err);
        setTilesLoaded(true);
      });
  }, [gameType]);

  // Fallback para puzzleImage caso não esteja no offer_config
  useEffect(() => {
    if ((gameType === 'figurinha' || gameType === 'puzzle') && !params.puzzleImage) {
      fetch('/api/puzzle/puzzles?mode=user')
        .then((r) => r.json())
        .then((pData) => {
          if (pData.success && pData.puzzles && pData.puzzles.length > 0) {
            const firstImg = pData.puzzles[0].image;
            if (firstImg) {
              setParams((prev) => prev.puzzleImage ? prev : { ...prev, puzzleImage: firstImg });
            }
          }
        })
        .catch(() => { });
    }
  }, [gameType, params.puzzleImage]);

  // Guarantee full page immersion matching the game background theme
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevBodyBg = document.body.style.background;
    const prevBodyBgColor = document.body.style.backgroundColor;
    const prevBodyAttachment = document.body.style.backgroundAttachment;
    const prevHtmlBg = document.documentElement.style.background;
    const prevHtmlBgColor = document.documentElement.style.backgroundColor;
    const prevHtmlAttachment = document.documentElement.style.backgroundAttachment;

    const darkBg = gameType === 'raspadinha' ? '#000000' : theme.bgGradient;
    const darkColor = gameType === 'raspadinha' ? '#000000' : (theme.baseBg || '#05040f');

    document.body.style.background = darkBg;
    document.body.style.backgroundColor = darkColor;
    document.body.style.backgroundAttachment = 'fixed';
    document.documentElement.style.background = darkBg;
    document.documentElement.style.backgroundColor = darkColor;
    document.documentElement.style.backgroundAttachment = 'fixed';

    return () => {
      document.body.style.background = prevBodyBg;
      document.body.style.backgroundColor = prevBodyBgColor;
      document.body.style.backgroundAttachment = prevBodyAttachment;
      document.documentElement.style.background = prevHtmlBg;
      document.documentElement.style.backgroundColor = prevHtmlBgColor;
      document.documentElement.style.backgroundAttachment = prevHtmlAttachment;
    };
  }, [theme]);

  // PostMessage Height Protocol to Parent iframe (dx:height)
  const sendHeight = useCallback(() => {
    if (typeof window !== 'undefined') {
      const height = Math.max(
        containerRef.current ? containerRef.current.offsetHeight + 24 : 0,
        420
      );
      try {
        window.parent.postMessage({ type: 'dx:height', height }, '*');
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    sendHeight();
    const timer1 = setTimeout(sendHeight, 250);
    const timer2 = setTimeout(sendHeight, 800);
    window.addEventListener('resize', sendHeight);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', sendHeight);
    };
  }, [sendHeight, stage, showUnlockDrawer, showSecondChanceModal]);

  // Urgency Timer Countdown
  useEffect(() => {
    if (stage !== 'offer') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  // Confetti celebration
  const triggerConfetti = () => {
    sounds.playFanfare();
    if (typeof window === 'undefined') return;
    const canvas = canvasConfettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const particles = [];
    const colors = [theme.primaryColor, theme.accentGold, '#ffffff', '#38bdf8', '#fbbf24'];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width * 0.5,
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.8) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }

    let animationFrame;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45;
        p.rotation += p.vRot;
        p.opacity -= 0.012;
        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });
      if (alive) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    render();
  };

  // Gatekeeper called BEFORE a tile starts scratching:
  // Enforces strict maximum of 3 picks per round and dynamically assigns the tile content based on round & pick order
  const handleCanStartScratch = useCallback((idx) => {
    if (roundLockedRef.current || scratchedTilesRef.current[idx]) {
      return false;
    }

    // Allow continuing to scratch a tile that was already picked
    if (pickedOrderRef.current.includes(idx)) {
      return true;
    }

    // Prevent multi-touching another tile while one is actively being scratched
    if (activeTileRef.current !== null && activeTileRef.current !== idx) {
      return false;
    }

    // STRICT 3-PICK CAP: Never allow more than 3 numbers to be scratched in a round
    if (pickedOrderRef.current.length >= 3) {
      return false;
    }

    const nextPicked = [...pickedOrderRef.current, idx];
    pickedOrderRef.current = nextPicked;
    setPickedOrder(nextPicked);
    activeTileRef.current = idx;
    setActiveTileIndex(idx);

    const pickNumber = nextPicked.length; // 1, 2, or 3
    const currentRound = scratchRoundRef.current;
    const cfg = paramsRef.current || {};
    const activeProduct = ensureScratchProductSelected(cfg);
    const carImage = activeProduct?.image || cfg.scratchPrizeImage || '/uploads/images/img_1794593368169_3x36rj.png';
    const carTitle = activeProduct?.title || cfg.scratchPrizeTitle || 'SAVEIRO CROSS';

    let assignedTile;
    if (currentRound === 1) {
      // ROUND 1:
      // 1st pick -> Car figure
      // 2nd pick -> Car figure
      // 3rd pick -> NEVER Car! Always "NÃO FOI DESSA VEZ"
      if (pickNumber === 1 || pickNumber === 2) {
        assignedTile = {
          tileNumber: idx + 1,
          isBonus: true,
          isCar: true,
          image: carImage,
          label: carTitle,
          sub: carTitle,
          title: '🚗',
          symbol: '🚗',
          prize: { label: carTitle, symbol: '🚗', image: carImage },
        };
      } else {
        assignedTile = {
          tileNumber: idx + 1,
          isBonus: false,
          isCar: false,
          image: null,
          label: 'NÃO FOI DESSA VEZ',
          sub: 'NÃO FOI DESSA VEZ',
          title: '❌',
          symbol: '❌',
          prize: null,
        };
      }
    } else {
      // ROUND 2:
      // 1st, 2nd, and 3rd picks -> Always "BÔNUS"
      if (pickNumber >= 3) {
        unlockVideoWithSoundOnGesture();
      }
      assignedTile = {
        tileNumber: idx + 1,
        isBonus: true,
        isCar: false,
        image: null,
        label: 'BÔNUS',
        sub: 'BÔNUS',
        title: '🎁',
        symbol: '🎁',
        prize: { label: 'BÔNUS', symbol: '🎁', image: null },
      };
    }

    setTiles((prev) => {
      const next = [...prev];
      next[idx] = assignedTile;
      return next;
    });

    return true;
  }, [ensureScratchProductSelected]);

  // Raspadinha Single Tile Reveal Handler
  const handleRevealTile = useCallback((idx) => {
    if (scratchedTilesRef.current[idx]) return;
    if (!pickedOrderRef.current.includes(idx)) return;

    const currentScratchedCount = scratchedTilesRef.current.filter(Boolean).length;
    if (currentScratchedCount >= 3) return;

    const updated = [...scratchedTilesRef.current];
    updated[idx] = true;
    scratchedTilesRef.current = updated;
    setScratchedTiles(updated);

    if (activeTileRef.current === idx) {
      activeTileRef.current = null;
      setActiveTileIndex(null);
    }

    const revealedCount = updated.filter(Boolean).length;
    const currentRound = scratchRoundRef.current;

    if (currentRound === 1) {
      const cfg = paramsRef.current || {};
      const activeProduct = selectedScratchProductRef.current || getActiveScratchProducts(cfg)[0];
      const prizeTitle = activeProduct?.title || cfg.scratchPrizeTitle || cfg.premio || 'Saveiro Cross';

      if (revealedCount === 1 || revealedCount === 2) {
        sounds.playPop();
        setBonusCount(revealedCount);
        // Marco 1 (1x por sessão): game_started apenas no 1º clique/raspagem
        emitGameStartedOnce({ first_tile_number: idx + 1 });
      } else if (revealedCount >= 3) {
        roundLockedRef.current = true;
        sounds.playNearMiss();

        // Marco 2 (1x por sessão): Gatilho Psicológico "Quase Ganhou" (2 de 3 na raspadinha)
        if (!hevonMilestonesSentRef.current.near_miss) {
          hevonMilestonesSentRef.current.near_miss = true;
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cherminho.app';
          const urlOrder = typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('parent_order_id') ||
              new URLSearchParams(window.location.search).get('order_id') ||
              new URLSearchParams(window.location.search).get('ref') ||
              ''
            : '';
          emitHevonEvent({
            event: 'near_miss',
            progress: {
              target_title: prizeTitle,
              score_achieved: 2,
              score_required: 3,
              missing_item: `Último Símbolo de ${prizeTitle}`,
              status: 'almost_won',
            },
            recovery_link: `${baseUrl}/raspadinha${urlOrder ? `?retry=${encodeURIComponent(urlOrder)}` : ''}`,
          });
        }

        setTimeout(() => {
          setShowSecondChanceModal(true);
          sendHeight();
        }, 850);
      }
    } else {
      // ROUND 2: All 3 picks reveal "BÔNUS"
      sounds.playPop();
      setBonusCount(revealedCount);

      if (revealedCount >= 3) {
        roundLockedRef.current = true;
        unlockVideoWithSoundOnGesture();
        setWonCarPrize(null);
        setWonPrize({ label: 'BÔNUS', symbol: '🎁', image: null });
        setShowStamp(true);
        triggerConfetti();
        sounds.playFanfare();

        // Marco 3 (1x por sessão): Conquista de Bonificação na Raspadinha
        if (!hevonMilestonesSentRef.current.reward_granted) {
          hevonMilestonesSentRef.current.reward_granted = true;
          const cfg = paramsRef.current || {};
          emitHevonEvent({
            event: 'reward_granted',
            reward: {
              type: 'secret_offer',
              title: cfg.bonus ? `Bônus ${cfg.bonus}` : 'Bônus Exclusivo Raspadinha',
              bonus_quantity: 0,
              cash_value: 0,
              special_checkout_url: getTaggedOfferUrl(cfg.dest || '') || null,
            },
          });
        }

        // Automatically redirect to Stage 2 (video informing of prize + redirect link)
        setTimeout(() => {
          setShowStamp(false);
          setShowUnlockDrawer(false);
          setStage('offer');
          startOfferVideoWithSound();
          sendHeight();
          setTimeout(() => {
            sendHeight();
            if (videoRef.current && videoRef.current.paused) {
              startOfferVideoWithSound();
            }
          }, 150);
        }, 1200);
      }
    }
  }, [sendHeight, unlockVideoWithSoundOnGesture, startOfferVideoWithSound, emitHevonEvent, emitGameStartedOnce, getTaggedOfferUrl]);

  // Reset grid and start Round 2 ("Nova chance de pegar a benção")
  const handleStartSecondChance = useCallback(() => {
    sounds.init();
    sounds.playPop();
    unlockVideoWithSoundOnGesture();
    scratchRoundRef.current = 2;
    setScratchRound(2);
    pickedOrderRef.current = [];
    setPickedOrder([]);
    activeTileRef.current = null;
    setActiveTileIndex(null);
    roundLockedRef.current = false;
    const emptyScratched = Array(9).fill(false);
    scratchedTilesRef.current = emptyScratched;
    setScratchedTiles(emptyScratched);
    setBonusCount(0);
    setShowStamp(false);
    setShowSecondChanceModal(false);
    const { grid } = createInitialNeutralGrid(paramsRef.current || {});
    setTiles(grid);
    setRoundKey((k) => k + 1);
    sendHeight();
  }, [sendHeight, unlockVideoWithSoundOnGesture]);

  // Caixa Misteriosa Box Selection
  const handleChooseBox = (idx) => {
    if (openedBoxIndex !== null) return;
    sounds.playChestOpen();
    setWobblingBox(idx);

    // Marco 1 (1x por sessão): game_started
    emitGameStartedOnce({ box_index: idx });

    setTimeout(() => {
      setOpenedBoxIndex(idx);
      setWobblingBox(null);
      triggerConfetti();
      if (!hevonMilestonesSentRef.current.reward_granted) {
        hevonMilestonesSentRef.current.reward_granted = true;
        const cfg = paramsRef.current || {};
        emitHevonEvent({
          event: 'reward_granted',
          reward: {
            type: 'secret_offer',
            title: cfg.bonus ? `Bônus ${cfg.bonus}` : 'Prêmio Caixa Misteriosa',
            bonus_quantity: 0,
            cash_value: 0,
            special_checkout_url: getTaggedOfferUrl(cfg.dest || '') || null,
          },
        });
      }
      setTimeout(() => {
        setShowUnlockDrawer(true);
        sendHeight();
      }, 550);
    }, 450);
  };

  // Roleta Spin Action
  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    sounds.playPop();

    // Marco 1 (1x por sessão): game_started
    emitGameStartedOnce();

    // Sound ticks during spin
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      sounds.playTick();
      tickCount++;
      if (tickCount > 35) clearInterval(tickInterval);
    }, 110);

    // Guaranteed landing on winning sector 0 (BÔNUS R$ 30.000) exactly at 12 o'clock
    const targetDeg = wheelAngle + 2160;
    setWheelAngle(targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      triggerConfetti();
      if (!hevonMilestonesSentRef.current.reward_granted) {
        hevonMilestonesSentRef.current.reward_granted = true;
        const cfg = paramsRef.current || {};
        emitHevonEvent({
          event: 'reward_granted',
          reward: {
            type: 'bonus_tickets',
            title: cfg.bonus ? `Bônus ${cfg.bonus}` : 'Bônus Roleta Premiada',
            bonus_quantity: 0,
            cash_value: 0,
            special_checkout_url: getTaggedOfferUrl(cfg.dest || '') || null,
          },
        });
      }
      setTimeout(() => {
        setShowUnlockDrawer(true);
        sendHeight();
      }, 500);
    }, 4500);
  };

  // Figurinha / Booster Pack Action - 1 Clique = 1 Peça Gerada (Sorteio Aleatório / Random)
  const handleOpenPack = () => {
    if (packOpened || rippingPack) return;

    const currentCount = collectedPieces.length;
    if (currentCount >= 9) return;

    // Peças padrão (1 a 8) ainda não coletadas
    const remainingStandard = [1, 2, 3, 4, 5, 6, 7, 8].filter(
      (num) => !collectedPieces.includes(num)
    );

    let nextPieceNum;

    if (remainingStandard.length > 0) {
      // Sorteia aleatoriamente entre as peças padrão ainda não encaixadas
      const randomIndex = Math.floor(Math.random() * remainingStandard.length);
      nextPieceNum = remainingStandard[randomIndex];
    } else {
      // Quando as 8 peças padrão já estão no tabuleiro, a 9ª é a Peça Chave Dourada (#9)
      nextPieceNum = 9;
    }

    setRippingPack(true);
    setJustUnlockedPiece(nextPieceNum);

    const cfg = paramsRef.current || {};
    const newTotalPlaced = currentCount + 1;

    // Marco 1 (1x por sessão): game_started apenas no 1º clique (sem spam por peça!)
    emitGameStartedOnce({ first_piece_number: nextPieceNum });

    if (nextPieceNum === 9) {
      // Clímax: Última peça (#9 - Peça Chave Dourada)
      sounds.playFanfare();
      setCollectedPieces([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      setPackOpened(true);
      setRippingPack(false);
      triggerConfetti();

      // Marco 3 (1x por sessão): reward_granted
      if (!hevonMilestonesSentRef.current.reward_granted) {
        hevonMilestonesSentRef.current.reward_granted = true;
        emitHevonEvent({
          event: 'reward_granted',
          reward: {
            type: 'bonus_tickets',
            title: cfg.bonus ? `Quebra-Cabeça Completo · ${cfg.bonus}` : 'Quebra-Cabeça Completo',
            bonus_quantity: 0,
            cash_value: 0,
            special_checkout_url: getTaggedOfferUrl(cfg.dest || '') || null,
          },
        });
      }

      setTimeout(() => {
        setShowUnlockDrawer(true);
        sendHeight();
      }, 700);
    } else {
      // Peças normais: geradas e encaixadas 1 a 1 de forma aleatória no tabuleiro!
      sounds.playChestOpen();
      sounds.playPop();
      setCollectedPieces((prev) => [...prev, nextPieceNum]);

      // Marco 2 (1x por sessão): Quando falta exatamente 1 peça (8 de 9), dispara near_miss!
      if (newTotalPlaced === 8 && !hevonMilestonesSentRef.current.near_miss) {
        hevonMilestonesSentRef.current.near_miss = true;
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cherminho.app';
        const urlOrder = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('parent_order_id') ||
            new URLSearchParams(window.location.search).get('order_id') ||
            new URLSearchParams(window.location.search).get('ref') ||
            ''
          : '';
        emitHevonEvent({
          event: 'near_miss',
          progress: {
            target_title: cfg.premio || 'Quebra-Cabeça Premiado',
            score_achieved: 8,
            score_required: 9,
            missing_item: 'Peça Chave Dourada #9',
            status: 'almost_won',
          },
          recovery_link: `${baseUrl}/puzzle${urlOrder ? `?retry=${encodeURIComponent(urlOrder)}` : ''}`,
        });
      }

      setTimeout(() => {
        setRippingPack(false);
        setJustUnlockedPiece(null);
      }, 350);
    }
  };

  // Transition to Stage 2 (Offer)
  const handleViewOffer = () => {
    unlockVideoWithSoundOnGesture();
    sounds.playPop();
    setShowUnlockDrawer(false);
    setStage('offer');
    sendHeight();
    startOfferVideoWithSound();
    setTimeout(() => {
      sendHeight();
    }, 350);
  };

  // Video Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime || 0;
    const dur = videoRef.current.duration || 1;
    const pct = (cur / dur) * 100;
    if (pct > hevonMaxVideoPctRef.current) {
      hevonMaxVideoPctRef.current = Math.min(100, Math.round(pct));
    }
    setVideoProgress(pct);

    const format = (t) => {
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    setCurrentTimeStr(format(cur));
    setDurationStr(format(dur));
  };

  // Final Action: Navigate Parent Window to destination URL (com UTM automática de atribuição HEVON)
  const handleCtaClick = (e) => {
    e.preventDefault();
    sounds.playPop();
    const targetUrl = getTaggedOfferUrl(params.dest || '');
    if (!hevonMilestonesSentRef.current.cta_clicked) {
      hevonMilestonesSentRef.current.cta_clicked = true;
      emitHevonEvent({
        event: 'game_interacted',
        interaction: {
          action: 'special_checkout_cta_clicked',
          target_url: targetUrl || null,
        },
      });
    }
    try {
      if (window.top && window.top !== window) {
        window.top.location.href = targetUrl;
        return;
      }
    } catch (err) { }
    try {
      window.open(targetUrl, '_top');
      return;
    } catch (err) { }
    window.location.href = targetUrl;
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `0${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const tela1Color = params.tela1Color || (params.raspadinhaTheme === 'emerald' ? '#10b981' : (params.raspadinhaTheme === 'gold' ? '#f59e0b' : '#e52e2e'));
  const tela2Color = params.tela2Color || theme.primaryColor || '#10b981';

  return (
    <div
      className={`dx-scope game-theme-${gameType}`}
      style={{
        height: gameType === 'raspadinha' && stage !== 'offer' ? '100dvh' : 'auto',
        maxHeight: gameType === 'raspadinha' && stage !== 'offer' ? '100dvh' : 'none',
        minHeight: gameType === 'raspadinha' && stage !== 'offer' ? '100%' : '100vh',
        width: '100%',
        maxWidth: '100vw',
        background: gameType === 'raspadinha' ? 'transparent' : theme.bgGradient,
        backgroundColor: gameType === 'raspadinha' ? 'transparent' : (theme.baseBg || '#05040f'),
        backgroundAttachment: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: gameType === 'raspadinha' ? (stage === 'offer' ? '20px 12px' : '0 10px') : '24px 12px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: gameType === 'raspadinha' && stage !== 'offer' ? 'hidden' : 'auto',
        overflowX: 'hidden',
        touchAction: gameType === 'raspadinha' && stage !== 'offer' ? 'none' : 'auto',
        overscrollBehavior: 'none',
      }}
    >
      {/* Real Photographic Background with Deep Contrast Dark Overlay ("Esse Preto" - Presell Match) */}
      {gameType === 'raspadinha' && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          {/* 1. Foto do Fundo Escolhida pelo Usuário */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${params.raspadinhaBgImage || '/uploads/images/img_1794594245457_jttjin.jpg'})`,
              backgroundColor: '#050807',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              zIndex: 1,
            }}
          />
          {/* 2. Deep Black Tint Overlay EXCLUSIVO no Fundo ("Esse Preto" - Idêntico ao da Página Presell) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: `rgba(5, 8, 7, ${(params.raspadinhaBgOverlay ?? 75) / 100})`,
              zIndex: 2,
            }}
          />
          {/* 3. Vinheta Atmosférica Radial EXCLUSIVA no Fundo */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 38%, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.65) 100%)',
              zIndex: 3,
            }}
          />
        </div>
      )}

      {/* Google Fonts Preconnect & Styles */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Sora:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        html, body {
          background: ${gameType === 'raspadinha' ? '#000000' : theme.bgGradient} !important;
          background-color: ${gameType === 'raspadinha' ? '#000000' : (theme.baseBg || '#010c08')} !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
          ${gameType === 'raspadinha' && stage !== 'offer' ? `
            height: 100% !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            overflow: hidden !important;
            overscroll-behavior: none !important;
            touch-action: none !important;
          ` : `
            min-height: 100vh !important;
            overflow-x: hidden !important;
          `}
        }

        .dx-card-frame {
          container-type: inline-size;
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
          overflow: hidden;
          background: ${theme.bgGradient};
          border-radius: clamp(18px, 4cqw, 28px);
          box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.95), 0 0 60px -26px ${theme.primaryGlow};
          padding: clamp(16px, 4.2cqw, 26px) clamp(14px, 4cqw, 24px) clamp(28px, 6.5cqw, 38px);
          animation: npem 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: background 0.5s ease;
          box-sizing: border-box;
        }

        .dx-card-frame::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 30;
          pointer-events: none;
          border-radius: clamp(18px, 4cqw, 28px);
          padding: 1px;
          background: linear-gradient(158deg, ${theme.pillBorder}, rgba(255, 255, 255, 0.08) 52%, ${theme.pillBorder});
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .mkld {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: clamp(10px, 2.6cqw, 16px);
          animation: o482 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.06s both;
        }

        /* DYNAMIC RADAR BEAM BADGE (Rotates continuous radar beam in predominant theme color) */
        .dx-radar-badge-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1.5px;
          border-radius: 9999px;
          overflow: hidden;
          background: transparent;
          box-shadow: 0 0 16px -2px ${tela1Color}55;
        }

        .dx-radar-badge-wrapper::before {
          content: "";
          position: absolute;
          width: 250%;
          height: 250%;
          top: -75%;
          left: -75%;
          background: conic-gradient(
            from 0deg,
            transparent 0% 55%,
            ${tela1Color} 82%,
            #ffffff 96%,
            ${tela1Color} 100%
          );
          animation: dxSpinRadar 3.2s linear infinite;
          z-index: 1;
        }

        .dx-radar-badge-pill {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          border-radius: 9999px;
          background: #09090b;
          color: #ffffff;
          font-family: 'Archivo', sans-serif;
          font-size: clamp(9px, 2.3cqw, 11px);
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .dx-radar-dot {
          position: relative;
          width: 6.5px;
          height: 6.5px;
          border-radius: 50%;
          background-color: ${tela1Color};
          box-shadow: 0 0 8px ${tela1Color};
          flex-shrink: 0;
        }

        .dx-radar-dot::after {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid ${tela1Color};
          opacity: 0.85;
          animation: dxRadarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .dx-radar-text {
          font-size: clamp(9px, 2.3cqw, 11px);
          font-weight: 900;
          letter-spacing: 0.16em;
          color: #ffffff;
        }

        @keyframes dxSpinRadar {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes dxRadarPing {
          0% {
            transform: scale(0.8);
            opacity: 0.9;
          }
          75%, 100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }

        .nlng {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: clamp(9px, 2.3cqw, 11px);
          font-weight: 700;
          letter-spacing: 0.2em;
          color: ${theme.pillText};
          border: 1px solid ${theme.pillBorder};
          background: ${theme.pillBg};
          padding: 4px 12px;
          border-radius: 999px;
          box-shadow: 0 0 14px ${theme.primaryGlow};
        }

        .nlng i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: ${theme.primaryColor};
          animation: ak4m 1.8s ease-out infinite;
        }

        .dvx0 {
          font-family: "Archivo", sans-serif;
          font-size: clamp(22px, 6cqw, 36px);
          font-weight: 900;
          letter-spacing: -0.032em;
          line-height: 1.05;
          text-transform: uppercase;
          margin: 0 0 clamp(14px, 3.2cqw, 20px);
          text-align: center;
          color: #ffffff;
          animation: o482 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
        }

        .dvx0 em {
          font-style: normal;
          color: #ffc531;
          display: inline-block;
        }

        .ayv5 {
          position: relative;
          width: min(100%, 360px);
          margin: 0 auto clamp(12px, 2.8cqw, 16px);
          animation: k1g7 0.6s cubic-bezier(0.2, 1.25, 0.4, 1) 0.2s both;
        }

        .uvkx {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(8px, 2.2cqw, 12px);
          padding: clamp(10px, 2.6cqw, 14px);
          border-radius: clamp(18px, 4cqw, 24px);
          background: #08080a;
          border: 1px solid ${tela1Color}40;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.85), inset 0 0 20px rgba(0, 0, 0, 0.5), 0 16px 40px -16px rgba(0, 0, 0, 0.9);
        }

        .tp5j {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 25;
          pointer-events: none;
          padding: 8px 18px;
          border-radius: 8px;
          border: 3px solid #ffc531;
          color: #ffc531;
          background: rgba(3, 20, 13, 0.94);
          font-family: 'Archivo', sans-serif;
          font-weight: 900;
          font-size: clamp(22px, 7cqw, 36px);
          letter-spacing: 0.04em;
          white-space: nowrap;
          box-shadow: 0 0 30px rgba(255, 197, 49, 0.7), inset 0 0 14px rgba(255, 197, 49, 0.25);
          transform: translate(-50%, -50%) rotate(-8deg) scale(2);
          opacity: 0;
        }

        .tp5j.ylbi {
          animation: tp5j 1.3s cubic-bezier(0.2, 1.6, 0.4, 1) both;
        }

        .dx-hand-guide {
          position: absolute;
          z-index: 24;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          pointer-events: none;
          transition: opacity 0.35s ease, transform 0.35s ease;
        }

        .dx-hand-guide.dx-guide-hidden {
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, -50%) scale(0.6);
        }

        .dx-coin-animator {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: dxCoinScratchMotion 2.2s ease-in-out infinite;
          transform-origin: 28% 90%;
        }

        .dx-finger-coin-img {
          width: clamp(84px, 22cqw, 112px);
          height: auto;
          filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.9)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.7));
          user-select: none;
          -webkit-user-drag: none;
          pointer-events: none;
        }

        @keyframes dxCoinScratchMotion {
          0% {
            transform: translate(-16px, -12px) rotate(-14deg) scale(1);
          }
          18% {
            transform: translate(16px, 14px) rotate(-4deg) scale(1.03);
          }
          36% {
            transform: translate(-14px, 10px) rotate(-16deg) scale(0.98);
          }
          54% {
            transform: translate(18px, -10px) rotate(-6deg) scale(1.02);
          }
          72% {
            transform: translate(-8px, -4px) rotate(-12deg) scale(1.01);
          }
          88% {
            transform: translate(12px, 6px) rotate(-7deg) scale(1);
          }
          100% {
            transform: translate(-16px, -12px) rotate(-14deg) scale(1);
          }
        }

        .dx-hand-badge {
          padding: 5px 14px;
          border-radius: 9999px;
          background: rgba(18, 14, 12, 0.95);
          border: 1.5px solid #d97706;
          color: #fef3c7;
          font-family: 'Archivo', sans-serif;
          font-weight: 900;
          font-size: clamp(9px, 2.4cqw, 11px);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          box-shadow: 0 0 16px rgba(217, 119, 6, 0.5), inset 0 0 8px rgba(0, 0, 0, 0.6);
        }

        .gcer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: clamp(8px, 2cqw, 12px);
          margin-bottom: 4px;
        }

        .zvwa {
          display: inline-flex;
          gap: 7px;
        }

        .zvwa i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.16);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
          transition: all 0.3s cubic-bezier(0.2, 1.4, 0.4, 1);
        }

        .zvwa i.ylbi {
          background: #f59e0b;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.9), inset 0 0 0 1px #fde68a;
          transform: scale(1.15);
        }

        .dpdx {
          font-family: 'Archivo', sans-serif;
          font-size: clamp(10.5px, 2.7cqw, 12.5px);
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #f59e0b;
          text-shadow: 0 0 12px rgba(245, 158, 11, 0.45);
        }

        .e6hd {
          display: block;
          font-family: 'Sora', sans-serif;
          font-size: clamp(9px, 2.3cqw, 11px);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
          text-align: center;
          margin-bottom: clamp(12px, 2.8cqw, 16px);
        }

        /* PULSING QUICK ACTION BUTTON (PULSE NO BOTÃO RASPAR TUDO) */
        .pzvp {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: min(100%, 340px);
          padding: clamp(12px, 3cqw, 15px) 20px;
          border-radius: clamp(12px, 2.9cqw, 16px);
          cursor: pointer;
          border: 1.5px solid ${tela1Color};
          background: ${tela1Color};
          color: #ffffff;
          font-family: 'Archivo', sans-serif;
          font-weight: 900;
          font-size: clamp(13px, 3.3cqw, 15px);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          box-shadow: 0 4px 18px ${tela1Color}50, inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.2s cubic-bezier(0.2, 1, 0.3, 1);
          animation: raspadinhaButtonPulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes raspadinhaButtonPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 18px ${tela1Color}55, 0 0 0 0 ${tela1Color}80;
          }
          50% {
            transform: scale(1.028);
            box-shadow: 0 8px 30px ${tela1Color}85, 0 0 0 11px rgba(0, 0, 0, 0);
          }
        }

        .pzvp:hover {
          background: ${tela1Color};
          filter: brightness(1.1);
          border-color: ${tela1Color};
          box-shadow: 0 10px 32px ${tela1Color}95, 0 0 0 4px ${tela1Color}40;
          transform: translateY(-2px) scale(1.035);
          animation-play-state: paused;
        }

        .pzvp:active {
          transform: translateY(1px) scale(0.98);
        }

        .pzvp svg {
          width: 1.2em;
          height: 1.2em;
        }

        /* Specialized Premium Styling for Raspadinha (Framed Solid Card Container) */
        .dx-card-anchor {
          position: relative;
          z-index: 10 !important;
          width: 100%;
          max-width: min(92vw, 360px);
          margin: 0 auto;
        }

        .game-theme-raspadinha .dx-card-anchor {
          position: relative !important;
          z-index: 10 !important;
          width: 100%;
          max-width: min(92vw, calc((100dvh - 140px) * 0.65), 350px) !important;
          margin: 0 auto !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform: translateY(clamp(14px, 3vh, 26px));
          animation: npem 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .game-theme-raspadinha .dx-card-anchor.dx-anchor-offer {
          margin: 16px auto !important;
          transform: none !important;
          max-width: 440px !important;
        }

        .game-theme-raspadinha .dx-card-frame {
          background: rgba(18, 18, 24, 0.92) !important;
          backdrop-filter: blur(20px) saturate(160%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
          border: 1.5px solid ${tela1Color}95 !important;
          box-shadow: 0 16px 45px -8px rgba(0, 0, 0, 0.75), 0 0 35px ${tela1Color}35, inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
          border-radius: clamp(16px, 3.8cqw, 22px) !important;
          padding: clamp(10px, 2vh, 16px) clamp(10px, 3cqw, 16px) clamp(10px, 2vh, 14px) !important;
          margin: 0 auto !important;
          overflow: visible !important;
          position: relative !important;
          z-index: 10 !important;
          animation: none !important;
          box-sizing: border-box !important;
          width: 100% !important;
        }

        .game-theme-raspadinha .dx-card-frame::before {
          display: none !important;
        }

        /* Cherminho Character Emerging Behind Black Card Box (Waist Up) */
        .dx-cherminho-behind {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, -55%);
          z-index: 5 !important;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        .dx-cherminho-behind img {
          width: clamp(170px, 48vw, 230px);
          max-width: 230px;
          height: auto;
          display: block;
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.8)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4)) brightness(1.08) contrast(1.05);
        }

        .game-theme-raspadinha .dx-card-frame.dx-card-offer {
          padding: 0 0 24px 0 !important;
          background: #09090b !important;
          border: 1.5px solid ${tela2Color}80 !important;
          box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 35px ${tela2Color}30 !important;
          border-radius: clamp(20px, 4cqw, 28px) !important;
          overflow: hidden !important;
        }

        .game-theme-raspadinha .dvx0 em {
          background: none !important;
          -webkit-background-clip: border-box !important;
          background-clip: border-box !important;
          -webkit-text-fill-color: ${tela1Color} !important;
          color: ${tela1Color} !important;
          filter: none !important;
          text-shadow: 0 0 24px ${tela1Color}70, 0 3px 8px rgba(0, 0, 0, 0.9) !important;
        }

        .game-theme-raspadinha .mkld {
          margin-bottom: clamp(4px, 1vh, 8px) !important;
        }

        .game-theme-raspadinha .dx-radar-badge-pill {
          padding: 3px 12px !important;
          font-size: clamp(9.5px, 2.3cqw, 11px) !important;
        }

        .game-theme-raspadinha .nlng {
          background: #141418 !important;
          border: 1.5px solid ${tela1Color}80 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7), 0 0 12px ${tela1Color}35 !important;
          padding: 4px 12px !important;
          border-radius: 9999px !important;
          font-size: clamp(9.5px, 2.3cqw, 11px) !important;
          font-weight: 800 !important;
          letter-spacing: 0.12em !important;
        }

        .game-theme-raspadinha .uvkx {
          background: rgba(10, 10, 14, 0.88) !important;
          border: 1.5px solid ${tela1Color}70 !important;
          box-shadow: 0 0 24px ${tela1Color}30, 0 12px 30px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.08) !important;
          border-radius: clamp(14px, 3.4cqw, 18px) !important;
          padding: clamp(6px, 1.8cqw, 10px) !important;
          gap: clamp(6px, 1.8cqw, 8px) !important;
          touch-action: none !important;
          user-select: none !important;
        }

        .game-theme-raspadinha .zvwa i {
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
          background: transparent !important;
          border: 1.5px solid rgba(255, 255, 255, 0.45) !important;
          box-shadow: none !important;
        }

        .game-theme-raspadinha .zvwa i.ylbi {
          background: ${tela1Color} !important;
          border-color: ${tela1Color} !important;
          box-shadow: 0 0 12px ${tela1Color} !important;
          transform: scale(1.08) !important;
        }

        .game-theme-raspadinha .dpdx {
          font-family: 'Archivo', sans-serif !important;
          font-size: clamp(11px, 2.8cqw, 13px) !important;
          font-weight: 900 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          color: #ffffff !important;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8) !important;
        }

        .game-theme-raspadinha .e6hd {
          font-family: 'Sora', sans-serif !important;
          font-size: clamp(9px, 2.2cqw, 10.5px) !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          color: rgba(255, 255, 255, 0.88) !important;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8) !important;
          margin-top: 1px !important;
          margin-bottom: clamp(6px, 1.3vh, 10px) !important;
        }

        .game-theme-raspadinha .pzvp {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 9px !important;
          width: min(100%, 340px) !important;
          padding: clamp(10px, 1.8vh, 14px) 24px !important;
          border-radius: 9999px !important;
          border: none !important;
          background: ${tela1Color} !important;
          color: #ffffff !important;
          font-family: 'Archivo', sans-serif !important;
          font-weight: 900 !important;
          font-size: clamp(13px, 3.4cqw, 16px) !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          box-shadow: 0 6px 20px ${tela1Color}70 !important;
          transition: filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
          cursor: pointer !important;
        }

        .game-theme-raspadinha .pzvp:hover {
          background: ${tela1Color} !important;
          filter: brightness(1.12) !important;
          box-shadow: 0 8px 26px ${tela1Color}90 !important;
          transform: translateY(-1px) scale(1.02) !important;
        }

        .game-theme-raspadinha .e4ic {
          background: #0d0d10 !important;
          border-top: 1.5px solid ${tela1Color}80 !important;
          box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.95), 0 0 30px ${tela1Color}25 !important;
        }

        .game-theme-raspadinha .jdfb {
          background: ${tela1Color} !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px ${tela1Color}40 !important;
        }

        .game-theme-raspadinha .g1hg b {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background: none !important;
          filter: none !important;
        }

        .game-theme-raspadinha .e4ic .zg24 {
          background: ${tela1Color} !important;
          box-shadow: 0 8px 24px ${tela1Color}60 !important;
          border: none !important;
          border-radius: 9999px !important;
          animation: dtl7Tela1 2.5s ease-in-out infinite !important;
        }

        @keyframes dtl7Tela1 {
          0%, 100% {
            box-shadow: 0 10px 30px -8px ${tela1Color}80, inset 0 1px 0 rgba(255, 255, 255, 0.22);
          }
          50% {
            box-shadow: 0 14px 45px -4px ${tela1Color}, inset 0 1px 0 rgba(255, 255, 255, 0.32);
          }
        }



        .e4ic {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          padding: clamp(20px, 5cqw, 28px) clamp(14px, 4cqw, 24px) clamp(22px, 5cqw, 28px);
          background: ${theme.drawerBg};
          border-radius: 26px 26px 0 0;
          box-shadow: 0 -1px 0 rgba(255, 197, 49, 0.6), 0 -30px 60px -10px rgba(0, 0, 0, 0.85);
          animation: slideUpUnlockDrawer 0.55s cubic-bezier(0.2, 1.2, 0.35, 1) forwards;
          pointer-events: auto;
        }

        @keyframes slideUpUnlockDrawer {
          0% {
            transform: translateY(115%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .e4ic.ylbi {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .e4ic-handle {
          width: 40px;
          height: 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.22);
          margin-bottom: 6px;
        }

        .jdfb {
          padding: 4px 11px;
          border-radius: 6px;
          background: ${theme.drawerBadgeBg};
          color: #ffffff;
          font-size: clamp(9.5px, 2.4cqw, 11px);
          font-weight: 800;
          letter-spacing: 0.16em;
          transform: rotate(-2deg);
          box-shadow: 0 4px 12px ${theme.primaryGlow};
        }

        .g1hg {
          font-family: 'Archivo', sans-serif;
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 1;
          font-size: clamp(32px, 10.5cqw, 52px);
          white-space: nowrap;
          text-transform: uppercase;
        }

        .g1hg b {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: #ffc531;
        }

        .ngkj {
          font-family: 'Archivo', sans-serif;
          font-weight: 900;
          font-size: clamp(12px, 3.2cqw, 15px);
          letter-spacing: 0.08em;
          color: #ffffff;
        }

        .vt7b {
          margin: 2px 0 8px;
          font-size: clamp(11.5px, 3cqw, 13.5px);
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.65);
        }

        .zg24 {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(7px, 1.8cqw, 11px);
          width: 100%;
          padding: clamp(14px, 3.6cqw, 18px) clamp(10px, 2.4cqw, 16px);
          border: 0;
          border-radius: clamp(12px, 2.9cqw, 18px);
          cursor: pointer;
          background: ${theme.btnGradient};
          color: #ffffff;
          font-family: 'Archivo', sans-serif;
          font-weight: 900;
          font-size: clamp(15px, 3.9cqw, 19px);
          letter-spacing: -0.01em;
          text-transform: uppercase;
          box-shadow: ${theme.btnShadow};
          animation: dtl7 2.5s ease-in-out 1s infinite;
          transition: transform 0.13s cubic-bezier(0.3, 0.9, 0.4, 1);
        }

        .zg24:active {
          transform: scale(0.978);
        }

        .ve1z {
          display: none;
        }

        .zg24 span:not(.ve1z) {
          position: relative;
          z-index: 2;
        }

        .zg24 svg {
          position: relative;
          z-index: 2;
          width: 1.1em;
          height: 1.1em;
          flex-shrink: 0;
          animation: d9dl 1.6s ease-in-out infinite;
        }

        .dx-rodape {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 20;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: clamp(24px, 5.5cqw, 32px);
          padding-bottom: 3px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.92), transparent);
        }

        .dx-rodape span {
          font-size: clamp(7.5px, 1.8cqw, 9.5px);
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.35);
          line-height: 1;
        }

        .dx-rodape img {
          display: block;
          width: clamp(44px, 10cqw, 54px);
          height: auto;
          opacity: 0.5;
        }

        @keyframes ak4m {
          0% { box-shadow: 0 0 0 0 ${tela1Color}bf; }
          70% { box-shadow: 0 0 0 7px ${tela1Color}00; }
          100% { box-shadow: 0 0 0 0 ${tela1Color}00; }
        }

        @keyframes npem {
          0% { opacity: 0; transform: translateY(14px) scale(0.98); }
          100% { opacity: 1; transform: none; }
        }

        @keyframes o482 {
          0% { opacity: 0; transform: translateY(11px); }
          100% { opacity: 1; transform: none; }
        }

        @keyframes k1g7 {
          0% { opacity: 0; transform: translateY(12px) scale(0.94); }
          100% { opacity: 1; transform: none; }
        }

        @keyframes ecxb {
          0%, 100% { transform: translate(-165%, -50%) rotate(-12deg); opacity: 0.55; }
          50% { transform: translate(65%, -50%) rotate(10deg); opacity: 1; }
        }

        @keyframes tp5j {
          0% { opacity: 0; transform: translate(-50%, -50%) rotate(-14deg) scale(2); }
          18% { opacity: 1; transform: translate(-50%, -50%) rotate(-6deg) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(-6deg) scale(1.1); }
        }

        @keyframes jf57 {
          0%, 100% { box-shadow: inset 0 0 0 2px #ffc531, 0 0 26px -4px rgba(255, 197, 49, 0.9); }
          50% { box-shadow: inset 0 0 0 2px #ffffd8, 0 0 34px -2px rgba(255, 197, 49, 1); }
        }

        @keyframes cumo {
          0% { opacity: 0; transform: scale(0.62); }
          100% { opacity: 1; transform: none; }
        }

        @keyframes dt7t {
          0% { transform: translateX(-130%); }
          45%, 100% { transform: translateX(130%); }
        }

        @keyframes d9dl {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }

        @keyframes dtl7 {
          0%, 100% {
            box-shadow: 0 10px 30px -8px ${tela2Color}80, inset 0 1px 0 rgba(255, 255, 255, 0.22);
          }
          50% {
            box-shadow: 0 14px 45px -4px ${tela2Color}, inset 0 1px 0 rgba(255, 255, 255, 0.32);
          }
        }

        .dx-main-title {
          font-family: 'Archivo', sans-serif !important;
          font-weight: 900 !important;
          font-size: clamp(23px, 5.8vw, 32px) !important;
          line-height: 1.15 !important;
          text-align: center !important;
          text-transform: uppercase !important;
          margin: 0 0 16px !important;
          letter-spacing: -0.02em !important;
          color: #ffffff !important;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9) !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        .dx-gold-glow {
          color: #fbbf24 !important;
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.8), 0 2px 8px rgba(0, 0, 0, 0.9) !important;
          display: inline-block !important;
        }

        @keyframes dxMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes dxPulseGlow {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px ${theme.primaryGlow});
          }
          50% {
            transform: scale(1.025);
            filter: drop-shadow(0 0 25px ${theme.primaryGlow});
          }
        }

        @keyframes dxWobbleBox {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-8deg) scale(1.08); }
          40% { transform: rotate(8deg) scale(1.08); }
          60% { transform: rotate(-6deg) scale(1.05); }
          80% { transform: rotate(6deg) scale(1.05); }
        }

        @keyframes dxFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @keyframes dxHandMove {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(-30%, -60%) rotate(12deg); }
          50% { transform: translate(-70%, -40%) rotate(-12deg); }
          75% { transform: translate(-40%, -65%) rotate(8deg); }
        }

        @keyframes dxSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes dxFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes dxSpinLed {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes dxTickWobble {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          50% { transform: translateX(-50%) rotate(-6deg); }
        }

        @keyframes dxGoldShimmer {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.7), inset 0 0 10px rgba(251, 191, 36, 0.4);
          }
          50% {
            box-shadow: 0 0 34px rgba(251, 191, 36, 1), inset 0 0 18px rgba(255, 255, 255, 0.8);
          }
        }

        .dx-card-frame.dx-card-offer {
          padding: 0 0 24px 0 !important;
          background: #09090b !important;
          border: 1.5px solid ${tela2Color}80 !important;
          box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 35px ${tela2Color}30 !important;
          border-radius: clamp(20px, 4cqw, 28px) !important;
          overflow: hidden !important;
        }

        .dx-card-frame.dx-card-offer::before {
          display: none !important;
        }
      `}</style>

      <div
        className={`dx-card-anchor ${stage === 'offer' ? 'dx-anchor-offer' : ''}`}
        style={{ position: 'relative', zIndex: 10 }}
      >
        {/* Cherminho Behind the Black Card Box (Waist Up) */}
        {gameType === 'raspadinha' && stage === 'game' && (
          <div
            className="dx-cherminho-behind"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translate(-50%, -55%)',
              zIndex: 5,
              pointerEvents: 'none',
              userSelect: 'none',
              WebkitUserDrag: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
            }}
          >
            <img
              src="/images/cherminho-bota-chelsea-Photoroom.png"
              alt="Cherminho"
              style={{
                width: 'clamp(170px, 48vw, 230px)',
                maxWidth: '230px',
                height: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.8)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4)) brightness(1.08) contrast(1.05)',
              }}
            />
          </div>
        )}

        <div
          ref={containerRef}
          className={`dx-card-frame ${stage === 'offer' ? 'dx-card-offer' : ''}`}
          style={{
            position: 'relative',
            zIndex: 10,
            background: 'rgba(18, 18, 24, 0.94)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: `1.5px solid ${tela1Color}95`,
            boxShadow: `0 16px 45px -8px rgba(0, 0, 0, 0.75), 0 0 35px ${tela1Color}35, inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
            borderRadius: 'clamp(16px, 3.8cqw, 22px)',
            padding: 'clamp(10px, 2vh, 16px) clamp(10px, 3cqw, 16px) clamp(10px, 2vh, 14px)',
            margin: '0 auto',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >

          {/* Dynamic Scratch Particles Canvas Overlay (60fps) */}
          <canvas
            ref={(el) => {
              if (el) {
                el.width = el.parentElement ? el.parentElement.offsetWidth : 400;
                el.height = el.parentElement ? el.parentElement.offsetHeight : 550;
                particleEngine.attach(el);
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 60,
            }}
          />

          {/* Confetti Celebration Canvas Overlay */}
          <canvas
            ref={canvasConfettiRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 90,
            }}
          />

          {/* ============================================================== */}
          {/* STAGE 1: GAME SCREEN                                           */}
          {/* ============================================================== */}
          {stage === 'game' && (
            <div style={{ animation: 'dxFadeIn 0.35s ease' }}>
              {/* COMPRA CONFIRMADA RADAR BADGE */}
              <div className="mkld">
                <div
                  className="dx-radar-badge-wrapper"
                  style={{ '--radar-color': tela1Color }}
                >
                  <div className="dx-radar-badge-pill">
                    <span className="dx-radar-dot" />
                    {gameType === 'raspadinha' ? (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={tela1Color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    ) : null}
                    <span className="dx-radar-text">
                      {params.raspadinhaBadgeText || 'COMPRA CONFIRMADA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* MAIN HEADER TITLE */}
              <h2 className="dvx0">
                {gameType === 'raspadinha' ? (
                  <>
                    <span style={{ display: 'block', fontSize: 'clamp(13px, 4cqw, 17px)', letterSpacing: '-0.02em', fontWeight: 900, color: '#ffffff', textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)' }}>
                      {params.nome ? `${params.nome.toUpperCase()}, ` : ''}{((params.raspadinhaTitle1 || 'Raspe e ache')).toUpperCase()}
                    </span>
                    <em style={{
                      display: 'block',
                      fontSize: 'clamp(23px, 7.2cqw, 32px)',
                      lineHeight: 1.05,
                      fontWeight: 900,
                      letterSpacing: '0.02em',
                      color: tela1Color,
                      WebkitTextFillColor: tela1Color,
                      background: 'none',
                      textShadow: `0 0 20px ${tela1Color}70, 0 2px 6px rgba(0, 0, 0, 0.9)`,
                      marginTop: '1px',
                      fontStyle: 'normal',
                    }}>
                      {((params.raspadinhaTitle2 || '3 IGUAIS')).toUpperCase()}
                    </em>
                  </>
                ) : (
                  <>
                    {params.nome && <span className="rr9z">{params.nome}, </span>}
                    {gameType === 'caixa' && (
                      <>
                        <span>ESCOLHA SUA CAIXA</span><br />
                        <em>BÔNUS PREMIADO</em>
                      </>
                    )}
                    {gameType === 'roleta' && (
                      <>
                        <span>GIRE A ROLETA</span><br />
                        <em>BÔNUS EXCLUSIVO</em>
                      </>
                    )}
                    {(gameType === 'figurinha' || gameType === 'puzzle') && (
                      <>
                        <span>MONTE O QUEBRA-CABEÇA</span><br />
                        <em>ENCAIXE AS PEÇAS</em>
                      </>
                    )}
                  </>
                )}
              </h2>

              {/* 1. RASPADINHA INTERATIVA COM CANVAS REAL */}
              {gameType === 'raspadinha' && (
                <>
                  {!tilesLoaded ? (
                    <div
                      style={{
                        padding: 'clamp(36px, 8cqw, 48px) 20px',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '14px',
                      }}
                    >
                      Carregando raspadinha...
                    </div>
                  ) : tiles.length === 0 ? (
                    <div
                      style={{
                        padding: 'clamp(28px, 6cqw, 38px) clamp(16px, 4cqw, 24px)',
                        textAlign: 'center',
                        background: 'rgba(15, 12, 28, 0.95)',
                        border: '1.5px dashed rgba(239, 68, 68, 0.45)',
                        borderRadius: '20px',
                        margin: '12px 0 16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      }}
                    >
                      <div style={{ fontSize: '42px', marginBottom: '10px' }}>🎟️</div>
                      <h3
                        style={{
                          fontFamily: "'Archivo', sans-serif",
                          fontWeight: 900,
                          fontSize: 'clamp(14px, 3.8cqw, 17px)',
                          color: '#f87171',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          margin: '0 0 8px',
                        }}
                      >
                        Nenhum Prêmio Cadastrado
                      </h3>
                      <p
                        style={{
                          color: '#94a3b8',
                          fontSize: 'clamp(12px, 3cqw, 13.5px)',
                          lineHeight: 1.5,
                          margin: 0,
                          maxWidth: '320px',
                          marginLeft: 'auto',
                          marginRight: 'auto',
                        }}
                      >
                        Esta raspadinha não possui prêmios ativos no sistema. Cadastre os prêmios no{' '}
                        <strong style={{ color: '#ffffff' }}>Painel Admin &gt; Raspadinha Digital</strong> para liberar a grade de raspagem.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="ayv5" style={{ position: 'relative', width: '100%' }}>
                        <div
                          className="uvkx"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 'clamp(6px, 1.8cqw, 8px)',
                            padding: 'clamp(6px, 1.8cqw, 10px)',
                            borderRadius: '16px',
                            background: 'rgba(10, 10, 14, 0.88)',
                            border: `1.5px solid ${tela1Color}70`,
                            boxShadow: `0 0 24px ${tela1Color}30, 0 12px 30px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.08)`,
                            touchAction: 'none',
                            userSelect: 'none',
                          }}
                        >
                          {tiles.map((tile, idx) => {
                            const tileDisabled =
                              (pickedOrder.length >= 3 && !pickedOrder.includes(idx)) ||
                              (activeTileIndex !== null && activeTileIndex !== idx && !scratchedTiles[idx]);
                            return (
                              <ScratchTile
                                key={`${roundKey}-${idx}`}
                                index={idx}
                                tileData={tile}
                                isScratched={scratchedTiles[idx]}
                                isDisabled={tileDisabled}
                                onCanStartScratch={handleCanStartScratch}
                                onReveal={handleRevealTile}
                                onFriction={() => sounds.playScratchFriction()}
                                themeColor={tela1Color}
                              />
                            );
                          })}
                        </div>

                        {/* Stamp Climax Banner */}
                        <span aria-hidden="true" className={`tp5j ${showStamp ? 'ylbi' : ''}`}>
                          {wonCarPrize ? 'ACHOU O CARRO!' : 'ACHOU OS 3 BÔNUS!'}
                        </span>

                        {/* SECOND CHANCE MODAL OVERLAY AFTER ROUND 1 NEAR-MISS */}
                        {showSecondChanceModal && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              zIndex: 85,
                              borderRadius: '16px',
                              background: 'rgba(10, 10, 15, 0.96)',
                              backdropFilter: 'blur(12px)',
                              WebkitBackdropFilter: 'blur(12px)',
                              border: `2px solid ${tela1Color}`,
                              boxShadow: `0 0 35px ${tela1Color}55, inset 0 1px 0 rgba(255,255,255,0.18)`,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 'clamp(16px, 4.5cqw, 26px)',
                              textAlign: 'center',
                              animation: 'dxFadeIn 0.3s ease',
                            }}
                          >
                            <div
                              style={{
                                width: '54px',
                                height: '54px',
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${tela1Color}35 0%, rgba(251, 191, 36, 0.15) 100%)`,
                                border: '2px solid #fbbf24',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '26px',
                                marginBottom: '12px',
                                boxShadow: '0 0 20px rgba(251, 191, 36, 0.45)',
                              }}
                            >
                              🙌
                            </div>

                            <span
                              style={{
                                display: 'inline-block',
                                background: 'rgba(251, 191, 36, 0.18)',
                                color: '#fbbf24',
                                border: '1px solid rgba(251, 191, 36, 0.5)',
                                borderRadius: '999px',
                                padding: '3px 12px',
                                fontSize: '10.5px',
                                fontWeight: 900,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                marginBottom: '10px',
                              }}
                            >
                              NOVA CHANCE LIBERADA
                            </span>

                            <p
                              style={{
                                fontFamily: "'Archivo', sans-serif",
                                fontSize: 'clamp(15px, 4.3cqw, 19px)',
                                fontWeight: 900,
                                lineHeight: 1.3,
                                color: '#ffffff',
                                margin: '0 0 18px',
                                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                                maxWidth: '310px',
                              }}
                            >
                              Não foi dessa vez, mas estamos te dando uma nova chance de pegar a benção!
                            </p>

                            <button
                              type="button"
                              onClick={handleStartSecondChance}
                              className="zg24"
                              style={{
                                width: '100%',
                                maxWidth: '280px',
                                borderRadius: '999px',
                                padding: '14px 20px',
                                fontSize: 'clamp(13px, 3.6cqw, 15px)',
                                fontWeight: 900,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                background: `linear-gradient(135deg, ${tela1Color} 0%, #b91c1c 100%)`,
                                color: '#ffffff',
                                border: '1.5px solid rgba(255,255,255,0.35)',
                                boxShadow: `0 8px 24px ${tela1Color}70`,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                              }}
                            >
                              <span className="ve1z" />
                              <span>RASPAR NOVAMENTE</span>
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12h14M13 6l6 6-6 6" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Indicators: 3 Picks Progress & Remaining Chances */}
                      <div className="gcer">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <span className="zvwa">
                            <i className={bonusCount >= 1 ? 'ylbi' : ''} />
                            <i className={bonusCount >= 2 ? 'ylbi' : ''} />
                            <i className={bonusCount >= 3 ? 'ylbi' : ''} />
                          </span>
                          <span
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#fbbf24',
                              border: '1px solid rgba(251, 191, 36, 0.45)',
                              borderRadius: '999px',
                              padding: '2px 9px',
                              fontSize: '11px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {`CHANCES: ${Math.max(0, 3 - scratchedTiles.filter(Boolean).length)} DE 3`}
                          </span>
                          <span className="dpdx">
                            {scratchRound === 2 ? 'NOVA CHANCE • ESCOLHA 3 NÚMEROS' : 'ESCOLHA 3 NÚMEROS'}
                          </span>
                        </div>
                      </div>
                      <span className="e6hd" style={{ marginBottom: '4px' }}>
                        {scratchRound === 2
                          ? 'PASSE O DEDO EM 3 NÚMEROS PARA PEGAR SUA BENÇÃO'
                          : 'PASSE O DEDO NOS NÚMEROS PARA RASPAR'}
                      </span>
                    </>
                  )}
                </>
              )}

              {/* 2. CAIXA MISTERIOSA (3D Interactive Luxury Chests) */}
              {gameType === 'caixa' && (
                <div className="ayv5">
                  <div
                    className="uvkx"
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      justifyContent: 'center',
                      gap: 'clamp(8px, 2cqw, 12px)',
                      width: '100%',
                      aspectRatio: '1',
                      padding: 'clamp(10px, 2.5cqw, 14px)',
                      boxSizing: 'border-box',
                    }}
                  >
                    {[0, 1, 2].map((idx) => {
                      const isOpened = openedBoxIndex === idx;
                      const isWobbling = wobblingBox === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleChooseBox(idx)}
                          style={{
                            flex: 1,
                            height: '100%',
                            borderRadius: 'clamp(14px, 3.2cqw, 20px)',
                            background: isOpened
                              ? '#f59e0b'
                              : 'rgba(24, 3, 41, 0.95)',
                            border: isOpened
                              ? '2px solid #fbbf24'
                              : `1.5px solid ${theme.pillBorder}`,
                            boxShadow: isOpened
                              ? '0 0 36px rgba(251, 191, 36, 0.9), inset 0 0 16px rgba(255, 255, 255, 0.5)'
                              : `0 12px 28px -10px ${theme.primaryGlow}`,
                            cursor: isOpened ? 'default' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 'clamp(16px, 4cqw, 24px) clamp(6px, 1.5cqw, 10px)',
                            transition: 'all 0.35s cubic-bezier(0.2, 1.2, 0.3, 1)',
                            transform: isOpened ? 'scale(1.05)' : 'scale(1)',
                            animation: isWobbling
                              ? 'dxWobbleBox 0.45s ease-in-out'
                              : openedBoxIndex === null
                                ? 'dxFloat 3.2s infinite ease-in-out'
                                : 'none',
                            animationDelay: `${idx * 0.35}s`,
                            userSelect: 'none',
                          }}
                        >
                          <div
                            style={{
                              fontSize: isOpened ? 'clamp(44px, 11cqw, 62px)' : 'clamp(40px, 10cqw, 56px)',
                              marginBottom: '10px',
                              filter: isOpened ? 'drop-shadow(0 0 16px #fbbf24)' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                              transition: 'transform 0.3s ease',
                            }}
                          >
                            {isOpened ? '🏆' : '🎁'}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Archivo', sans-serif",
                              fontWeight: 900,
                              fontSize: 'clamp(10px, 2.5cqw, 12px)',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              textAlign: 'center',
                              color: isOpened ? '#451a03' : '#e9d5ff',
                              lineHeight: 1.2,
                            }}
                          >
                            {isOpened ? (
                              <>
                                <span>BÔNUS</span>
                                <br />
                                <strong style={{ color: '#78350f', fontSize: '1.1em' }}>R$30K!</strong>
                              </>
                            ) : (
                              `CAIXA #${idx + 1}`
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. ROLETA CYBERPUNK (Mathematic SVG Alignment & Ultra-Legible Badges) */}
              {gameType === 'roleta' && (
                <div
                  className="ayv5"
                  style={{
                    position: 'relative',
                    width: 'min(100%, 360px)',
                    aspectRatio: '1',
                    margin: '0 auto clamp(12px, 2.8cqw, 16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: 'min(100%, 330px)',
                      aspectRatio: '1',
                    }}
                  >
                    {/* Outer LED Glowing Ring */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: '-8px',
                        borderRadius: '50%',
                        border: `2px dashed ${theme.primaryColor}`,
                        boxShadow: `0 0 30px ${theme.primaryGlow}, inset 0 0 20px ${theme.primaryGlow}`,
                        animation: 'dxSpinLed 20s linear infinite',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Top Pointer Ticker Needle */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 30,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.85))',
                        animation: isSpinning ? 'dxTickWobble 0.11s infinite' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '0',
                          height: '0',
                          borderLeft: '14px solid transparent',
                          borderRight: '14px solid transparent',
                          borderTop: '28px solid #fbbf24',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: '-28px',
                            left: '-8px',
                            width: '0',
                            height: '0',
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: '20px solid #fef08a',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#b45309',
                          border: '2px solid #fef08a',
                          marginTop: '-32px',
                        }}
                      />
                    </div>

                    {/* Rotating Wheel Body */}
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        position: 'relative',
                        overflow: 'hidden',
                        transform: `rotate(${wheelAngle}deg)`,
                        transition: isSpinning
                          ? 'transform 4.5s cubic-bezier(0.12, 0.8, 0.25, 1)'
                          : 'none',
                        border: '4px solid #1e293b',
                        boxShadow: '0 0 24px rgba(0,0,0,0.9)',
                      }}
                    >
                      {/* SVG With 8 Slices & Legible Direct Text (No Badges/Borders) */}
                      <svg viewBox="0 0 300 300" style={{ width: '100%', height: '100%', display: 'block' }}>
                        {WHEEL_SLICES.map((s, idx) => (
                          <g key={s.id} transform={`rotate(${idx * 45} 150 150)`}>
                            {/* Sector Path */}
                            <path
                              d="M 150 150 L 97.19 22.50 A 138 138 0 0 1 202.81 22.50 Z"
                              fill={s.color}
                              stroke="#0f172a"
                              strokeWidth="2"
                            />
                            {/* Outer rim gold peg */}
                            <circle cx="150" cy="15" r="3.5" fill="#fef08a" stroke="#78350f" strokeWidth="1.2" />

                            {/* Text directly on slice with contrasting color - NO BORDER */}
                            <text
                              x="150"
                              y="48"
                              textAnchor="middle"
                              fill={s.textColor || '#ffffff'}
                              fontSize="12"
                              fontWeight="900"
                              fontFamily="'Archivo', sans-serif"
                              letterSpacing="0.04em"
                            >
                              {s.title}
                            </text>
                            <text
                              x="150"
                              y="65"
                              textAnchor="middle"
                              fill={s.textColor || '#ffffff'}
                              fontSize="11"
                              fontWeight="800"
                              fontFamily="'Archivo', sans-serif"
                              letterSpacing="0.02em"
                            >
                              {s.value}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    {/* Center Spin Hub Button */}
                    <button
                      type="button"
                      onClick={handleSpinWheel}
                      disabled={isSpinning}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 25,
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        border: '3.5px solid #fef08a',
                        boxShadow: '0 0 24px rgba(245, 158, 11, 0.9), inset 0 2px 4px rgba(255,255,255,0.7)',
                        cursor: isSpinning ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Archivo', sans-serif",
                        fontWeight: 900,
                        fontSize: '13px',
                        letterSpacing: '0.04em',
                        color: '#451a03',
                      }}
                    >
                      {isSpinning ? '...' : 'GIRAR'}
                    </button>
                  </div>
                </div>
              )}

              {/* 4. ÁLBUM DE FIGURINHAS VIP (3D Booster Pack & 3x3 Collection) */}
              {(gameType === 'figurinha' || gameType === 'puzzle') && (
                <div
                  className="ayv5"
                  style={{
                    position: 'relative',
                    width: 'min(100%, 360px)',
                    aspectRatio: '1',
                    margin: '0 auto clamp(12px, 2.8cqw, 16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Genuine Jigsaw Puzzle Board with Interlocking Tabs & Sockets */}
                  <JigsawPuzzleBoard
                    collectedPieces={collectedPieces}
                    justUnlockedPiece={justUnlockedPiece}
                    isCompleted={packOpened}
                    imageUrl={resolvePuzzleImageUrl(params.puzzleImage || params.image)}
                    onPieceClick={!packOpened ? handleOpenPack : undefined}
                    size={330}
                  />
                </div>
              )}

              {/* STATUS / INSTRUCTION (for other game types) */}
              {gameType !== 'raspadinha' && (
                <>
                  <div className="gcer">
                    <span className="zvwa">
                      {[0, 1, 2].map((i) => (
                        <i
                          key={i}
                          className={
                            i <
                              (openedBoxIndex !== null || packOpened || (gameType === 'roleta' && (showUnlockDrawer || (wheelAngle > 0 && !isSpinning)))
                                ? 3
                                : (gameType === 'figurinha' || gameType === 'puzzle')
                                  ? (collectedPieces.length >= 8 ? 2 : collectedPieces.length > 0 ? 1 : 0)
                                  : 0)
                              ? 'ylbi'
                              : ''
                          }
                        />
                      ))}
                    </span>
                    <span className="dpdx">
                      {gameType === 'caixa'
                        ? 'ESCOLHA 1 DAS 3 CAIXAS'
                        : (gameType === 'figurinha' || gameType === 'puzzle')
                          ? (packOpened
                            ? 'QUEBRA-CABEÇA 9/9 COMPLETO!'
                            : collectedPieces.length === 8
                              ? '8/9 PEÇAS • FALTA A DOURADA!'
                              : collectedPieces.length > 0
                                ? `${collectedPieces.length}/9 PEÇAS ENCAIXADAS`
                                : 'QUEBRA-CABEÇA VAZIO (0/9)')
                          : 'GIRE PARA RESGATAR O BÔNUS'}
                    </span>
                  </div>

                  <span className="e6hd">
                    {gameType === 'caixa' && 'Toque na caixa para desbloquear seu prêmio'}
                    {gameType === 'roleta' && 'Toque no centro da roleta para girar'}
                    {(gameType === 'figurinha' || gameType === 'puzzle') && (
                      collectedPieces.length === 0
                        ? 'Toque no botão para gerar a 1ª peça do prêmio'
                        : collectedPieces.length === 8
                          ? 'Toque no botão para encaixar a última peça e liberar o prêmio'
                          : packOpened
                            ? 'Prêmio desbloqueado com sucesso!'
                            : `Peça #${collectedPieces[collectedPieces.length - 1]} no tabuleiro! Toque para gerar a próxima`
                    )}
                  </span>

                  {/* QUICK ACTION BUTTON */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="pzvp"
                      onClick={
                        (gameType === 'figurinha' || gameType === 'puzzle')
                          ? handleOpenPack
                          : gameType === 'caixa'
                            ? () => handleChooseBox(1)
                            : handleSpinWheel
                      }
                      style={{
                        background: tela1Color,
                        borderColor: tela1Color,
                        color: '#ffffff',
                      }}
                    >
                      <span>
                        {gameType === 'caixa' && '🎁'}
                        {gameType === 'roleta' && '🎯'}
                        {(gameType === 'figurinha' || gameType === 'puzzle') && '🧩'}
                      </span>
                      <span>
                        {gameType === 'caixa' && 'ABRIR CAIXAS'}
                        {gameType === 'roleta' && 'GIRAR AGORA'}
                        {(gameType === 'figurinha' || gameType === 'puzzle') && (
                          packOpened
                            ? 'QUEBRA-CABEÇA COMPLETO'
                            : collectedPieces.length === 8
                              ? 'ENCAIXAR PEÇA FINAL DOURADA'
                              : collectedPieces.length === 0
                                ? 'GERAR 1ª PEÇA'
                                : 'GERAR PRÓXIMA PEÇA'
                        )}
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* SLIDE-UP DRAWER UPON UNLOCK */}
              {showUnlockDrawer && (
                <div
                  aria-hidden={!showUnlockDrawer}
                  className={`e4ic ${showUnlockDrawer ? 'ylbi' : ''}`}
                >
                  <div className="e4ic-handle" />

                  <span className="jdfb">
                    VOCÊ DESBLOQUEOU
                  </span>

                  <span className="g1hg lqf4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {wonPrize?.image ? (
                      <img
                        src={wonPrize.image}
                        alt={wonPrize.label || 'Prêmio'}
                        style={{
                          width: '38px',
                          height: '26px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1.5px solid #fbbf24',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                          flexShrink: 0,
                        }}
                      />
                    ) : wonPrize?.symbol ? (
                      <span style={{ fontSize: '1.15em' }}>{wonPrize.symbol}</span>
                    ) : null}
                    <b>{wonPrize?.label || 'UM BÔNUS'}</b>
                  </span>

                  <span className="ngkj">
                    SÓ POR ESTA PÁGINA
                  </span>

                  <p className="vt7b">
                    toca pra ver o que é
                  </p>

                  <button
                    type="button"
                    className="zg24"
                    onClick={handleViewOffer}
                  >
                    <span className="ve1z" />
                    <span>VER MEU BÔNUS</span>
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 2: OFFER SCREEN                                          */}
          {/* ============================================================== */}
          {/* ============================================================== */}
          {/* STAGE 2: OFFER / UPSELL SCREEN (PROFESSIONAL VSL FUNNEL LAYOUT) */}
          {/* ============================================================== */}
          <div
            style={{
              display: stage === 'offer' ? 'block' : 'none',
              animation: stage === 'offer' ? 'dxFadeIn 0.35s ease' : 'none',
            }}
          >
              {/* 1. HERO VIDEO AT TOP (FLUSH EDGE-TO-EDGE) */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  overflow: 'hidden',
                  background: '#000000',
                  aspectRatio: '16 / 9',
                }}
              >
                <video
                  ref={videoRef}
                  src={params.videoUrl}
                  preload="auto"
                  playsInline
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                {/* Badge "PRA VOCÊ, {NOME}" */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: tela2Color,
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    zIndex: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  {(() => {
                    const rawBadge = String(params.badgeVideo || 'PRA VOCÊ');
                    const cleanNome = String(params.nome || '').trim().toUpperCase();
                    if (/\{(FULANO|NOME)\}/i.test(rawBadge)) {
                      return rawBadge
                        .replace(/\{(FULANO|NOME)\}/gi, cleanNome)
                        .replace(/^\s*,\s*|\s*,\s*$/g, '')
                        .replace(/\s{2,}/g, ' ')
                        .trim() || 'PRA VOCÊ';
                    }
                    return `${rawBadge}${cleanNome ? `, ${cleanNome}` : ''}`;
                  })()}
                </div>

                {/* Center Play Button Overlay (With "VER DE NOVO" when paused) */}
                {!isPlaying && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      zIndex: 4,
                    }}
                  >
                    <button
                      type="button"
                      onClick={togglePlay}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: tela2Color,
                        border: '2.5px solid rgba(255, 255, 255, 0.95)',
                        color: '#ffffff',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 24px ${tela2Color}70, 0 4px 14px rgba(0,0,0,0.7)`,
                        paddingLeft: '4px',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      ▶
                    </button>
                    <span
                      style={{
                        fontFamily: "'Archivo', sans-serif",
                        fontSize: '10.5px',
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        background: 'rgba(0, 0, 0, 0.82)',
                        padding: '3px 11px',
                        borderRadius: '999px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      }}
                    >
                      VER DE NOVO
                    </span>
                  </div>
                )}

                {/* Bottom Video Controls / Scrubber */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.92))',
                    padding: '14px 12px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 3,
                  }}
                >
                  <button
                    type="button"
                    onClick={togglePlay}
                    style={{
                      background: 'none',
                      border: 0,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {isPlaying ? '❚❚' : '▶'}
                  </button>

                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                    {currentTimeStr}
                  </span>

                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      background: 'rgba(255,255,255,0.25)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${videoProgress}%`,
                        height: '100%',
                        background: tela2Color,
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                    {durationStr !== '0:00' ? `-${durationStr}` : '-0:00'}
                  </span>

                  <button
                    type="button"
                    onClick={toggleMute}
                    style={{
                      background: 'none',
                      border: 0,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>
              </div>

              {/* 2. THREE-COLUMN TRUST RIBBON BAR (EDGE-TO-EDGE) */}
              <div
                style={{
                  width: '100%',
                  background: '#0d0d10',
                  borderTop: `1px solid ${tela2Color}40`,
                  borderBottom: `1px solid ${tela2Color}40`,
                  padding: '11px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ffffff' }}>
                  <span style={{ color: tela2Color }}>🏆</span> {params.ribbon1 || 'MÁXIMO DE SORTE'}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontWeight: 300 }}>|</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ffffff' }}>
                  <span style={{ color: tela2Color }}>⚡</span> {params.ribbon2 || 'SÓ POR ESTA PÁGINA'}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontWeight: 300 }}>|</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ffffff' }}>
                  <span style={{ color: tela2Color }}>🎁</span> {params.ribbon3 || 'SÓ POR HOJE'}
                </span>
              </div>

              {/* 3. OFFER BODY CONTENT WITH PADDING */}
              <div style={{ padding: '22px 16px 0' }}>
                {/* HEADLINE SECTION */}
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <div
                    style={{
                      fontFamily: "'Archivo', sans-serif",
                      fontSize: '11px',
                      fontWeight: 900,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 0.72)',
                      marginBottom: '4px',
                    }}
                  >
                    SUA SORTE{params.nome ? `, ${params.nome.toUpperCase()}` : ''}
                  </div>

                  <h1
                    style={{
                      fontFamily: "'Archivo', sans-serif",
                      fontWeight: 900,
                      fontSize: 'clamp(34px, 9.5cqw, 48px)',
                      lineHeight: 0.95,
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      margin: '0 0 2px',
                      letterSpacing: '-0.02em',
                      color: '#ffffff',
                      textShadow: '0 3px 8px rgba(0, 0, 0, 0.9)',
                    }}
                  >
                    {params.step3TitleLine1 || params.premio || 'MÁXIMO'}
                  </h1>

                  <div
                    style={{
                      fontFamily: "'Archivo', sans-serif",
                      fontWeight: 900,
                      fontSize: 'clamp(36px, 10.5cqw, 52px)',
                      lineHeight: 0.95,
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '-0.01em',
                      color: tela2Color,
                      textShadow: `0 0 22px ${tela2Color}70, 0 3px 8px rgba(0, 0, 0, 0.9)`,
                      margin: '0 0 8px',
                    }}
                  >
                    {params.step3TitleLine2 || params.bonus || 'DE SORTE'}
                  </div>

                  <p
                    style={{
                      textAlign: 'center',
                      margin: '0',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.65)',
                      lineHeight: 1.4,
                    }}
                  >
                    {params.subtitulo || (
                      <>se {params.artigo || 'a'} <strong style={{ color: '#ffffff' }}>cota premiada</strong> sair pra você comprando por aqui</>
                    )}
                  </p>
                </div>

                {/* 4. THREE CIRCULAR BENEFIT ICONS IN A ROW (3 COLUMNS) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    margin: '22px 0 20px',
                    textAlign: 'center',
                  }}
                >
                  {/* Column 1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: tela2Color,
                        border: '1.5px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: `0 4px 16px ${tela2Color}50`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Archivo', sans-serif",
                        fontSize: '11px',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        lineHeight: 1.25,
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        display: 'block',
                        maxWidth: '105px',
                      }}
                    >
                      <span>{params.step1BadgeLine1 || 'COMPRAS'}</span>
                      <span style={{ display: 'block', color: 'rgba(255, 255, 255, 0.85)' }}>
                        {params.step1BadgeLine2 || `ACIMA DE ${params.compraMinima || '20'}`}
                      </span>
                    </span>
                  </div>

                  {/* Column 2 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: tela2Color,
                        border: '1.5px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: `0 4px 16px ${tela2Color}50`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Archivo', sans-serif",
                        fontSize: '11px',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        lineHeight: 1.25,
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        display: 'block',
                        maxWidth: '105px',
                      }}
                    >
                      <span>{params.step2BadgeLine1 || 'MAIS CHANCES'}</span>
                      <span style={{ display: 'block', color: 'rgba(255, 255, 255, 0.85)' }}>
                        {params.step2BadgeLine2 || 'NO PRÓXIMO GIRO'}
                      </span>
                    </span>
                  </div>

                  {/* Column 3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: tela2Color,
                        border: '1.5px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: `0 4px 16px ${tela2Color}50`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 12 20 22 4 22 4 12"></polyline>
                        <rect x="2" y="7" width="20" height="5"></rect>
                        <line x1="12" y1="22" x2="12" y2="7"></line>
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                      </svg>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Archivo', sans-serif",
                        fontSize: '11px',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        lineHeight: 1.25,
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        display: 'block',
                        maxWidth: '105px',
                      }}
                    >
                      <span>{params.step3BadgeLine1 || 'GIRO PREMIADO'}</span>
                      <span style={{ display: 'block', color: 'rgba(255, 255, 255, 0.85)' }}>
                        {params.step3BadgeLine2 || 'LEVA 10X MAIS'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 5. CAPSULE URGENCY COUNTDOWN BOX */}
                <div
                  style={{
                    background: '#090909',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    margin: '20px 0 18px',
                    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span
                      style={{
                        fontFamily: "'Archivo', sans-serif",
                        fontSize: '12px',
                        fontWeight: 900,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                      }}
                    >
                      {params.timerLabel || 'ÚLTIMO MINUTO'}
                    </span>
                  </div>

                  <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '18px', fontWeight: 300 }}>|</span>

                  <span
                    style={{
                      fontFamily: "'Archivo', sans-serif",
                      fontSize: '32px',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                      color: tela2Color,
                      textShadow: `0 0 18px ${tela2Color}80`,
                    }}
                  >
                    {formatTimer(timeLeft)}
                  </span>
                </div>

                {/* 6. PRIMARY CTA BUTTON */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleCtaClick}
                    className="zg24"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      margin: '0 auto',
                      borderRadius: '9999px',
                      padding: '18px 24px',
                      fontSize: '18px',
                      fontWeight: 900,
                      letterSpacing: '0.05em',
                      background: tela2Color,
                      boxShadow: `0 8px 25px ${tela2Color}60`,
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    <span className="ve1z" />
                    <span>{params.btnText || 'GARANTIR AGORA'}</span>
                    <svg
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.5"
                      viewBox="0 0 24 24"
                      style={{ width: '1.2em', height: '1.2em' }}
                    >
                      <path d="M5 12h14M13 6l6 6-6 6"></path>
                    </svg>
                  </button>

                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          window.parent.postMessage({ type: 'dx:dismiss' }, '*');
                          window.parent.postMessage({ type: 'dx:height', height: 0 }, '*');
                        } catch (e) { }
                      }}
                      style={{
                        background: 'none',
                        border: 0,
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        color: 'rgba(255, 255, 255, 0.45)',
                        textDecoration: 'underline',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {params.footerText || 'mostrar meus números'}
                    </button>
                  </div>

                  {/* Divider Line */}
                  <div
                    style={{
                      width: '100%',
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      margin: '22px 0 16px',
                    }}
                  />

                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
