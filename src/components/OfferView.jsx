'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VideoCallOfferView from '@/components/VideoCallOfferView';
import { appendUpsellFlowUtm } from '@/lib/hevonClient';

export default function OfferView({ session, campaign, level, isPreview = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Number(level?.timer_duration) || 300);
  const [isMuted, setIsMuted] = useState(true);
  const [socialToast, setSocialToast] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitTriggered, setExitTriggered] = useState(false);
  const [exitProcessing, setExitProcessing] = useState(false);
  const videoRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Web Audio FX Synthesizer
  const playUiSound = (type) => {
    if (isPreview) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.5, now + 0.3);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      // Audio autoplay restrictions
    }
  };

  // Telemetry event sender
  const sendEvent = (eventType, eventData = {}) => {
    if (isPreview) return;
    try {
      fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session?.token,
          level_id: level?.id,
          event_type: eventType,
          event_data: eventData,
        }),
      }).catch(() => {});
    } catch {}
  };

  // Log initial page view
  useEffect(() => {
    if (!isPreview) {
      sendEvent('page_view', { title: level?.headline || campaign?.name });
    }
  }, [level?.id, isPreview]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 30 && prev > 0) {
          playUiSound('tick');
        }
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Sound toggle handler
  const handleToggleSound = () => {
    playUiSound('pop');
    if (!videoRef.current) return;
    if (videoRef.current.muted) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Live Social Proof Notification Engine
  useEffect(() => {
    if (level?.social_proof_enabled === 0 || level?.social_proof_enabled === false) return;

    const names = [
      'Lucas M.', 'Mariana S.', 'Carlos Eduardo', 'Rafael F.', 'Beatriz L.',
      'Rodrigo A.', 'Camila V.', 'Thiago B.', 'Gabriel P.', 'Fernanda C.'
    ];
    const cities = [
      'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR',
      'Salvador, BA', 'Goiânia, GO', 'Fortaleza, CE', 'Campinas, SP', 'Porto Alegre, RS', 'Recife, PE'
    ];
    const times = ['há 1 min', 'há 2 min', 'há 3 min', 'há 4 min', 'agora mesmo'];
    const template = level?.social_proof_text || '{name} de {city} acabou de garantir +50 cotas!';

    const trigger = () => {
      const name = names[Math.floor(Math.random() * names.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const time = times[Math.floor(Math.random() * times.length)];
      const initials = name.split(' ').map((p) => p[0]).join('').substring(0, 2);

      let msg = template.replace('{name}', name).replace('{city}', city);
      if (!msg.includes(name)) {
        msg = `🔥 ${name} (${city}) - ` + msg;
      }

      setSocialToast({ initials, msg, time });
      setTimeout(() => setSocialToast(null), 4500);
    };

    const firstTimer = setTimeout(trigger, 3500);
    const interval = setInterval(trigger, 12000);
    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [level?.social_proof_enabled, level?.social_proof_text]);

  // Exit intent detector (desktop mouseleave + mobile popstate)
  useEffect(() => {
    if (isPreview) return;
    if (level?.exit_intent_enabled === 0 || level?.exit_intent_enabled === false) return;

    const triggerExit = () => {
      if (!exitTriggered) {
        setExitTriggered(true);
        setShowExitModal(true);
        playUiSound('pop');
      }
    };

    const handleMouseLeave = (e) => {
      if (e.clientY <= 5) triggerExit();
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    // Mobile back button intercept
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'offer' }, '', window.location.href);
      const handlePopState = () => {
        triggerExit();
        window.history.pushState({ page: 'offer' }, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        document.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('popstate', handlePopState);
      };
    }

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [exitTriggered, level?.exit_intent_enabled, isPreview]);

  // Accept Offer (1-Click Upsell or External Checkout URL)
  const handleAccept = async () => {
    if (isPreview) return;
    if (loading) return;
    playUiSound('pop');
    setLoading(true);
    sendEvent('cta_click', { price: level?.price });

    if (level?.external_checkout_url && String(level.external_checkout_url).trim() !== '') {
      try {
        fetch('/api/v1/checkout', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: session?.token,
            level_id: level?.id,
            price: level?.price,
            product_id: level?.product_id,
          }),
        }).catch(() => {});
      } catch {
        // ignore
      }
      window.location.href = appendUpsellFlowUtm(String(level.external_checkout_url).trim(), 'upsell');
      return;
    }

    try {
      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session?.token,
          level_id: level?.id,
          price: level?.price,
          product_id: level?.product_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        playUiSound('success');
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          window.location.reload();
        }
      } else {
        alert('Erro: ' + (data.message || 'Falha ao processar pedido.'));
        setLoading(false);
      }
    } catch {
      alert('Erro de conexão ao processar.');
      setLoading(false);
    }
  };

  // Decline Offer
  const handleDecline = async () => {
    if (isPreview) return;
    if (loading) return;
    setLoading(true);
    sendEvent('cta_decline');

    try {
      const res = await fetch('/api/v1/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: session?.token }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          window.location.reload();
        }
      } else {
        alert('Erro: ' + (data.message || 'Falha ao recusar oferta.'));
        setLoading(false);
      }
    } catch {
      alert('Erro de conexão.');
      setLoading(false);
    }
  };

  // Accept Exit Intent Discount
  const exitDiscount = level?.exit_intent_discount_price || Math.round((Number(level?.price) || 97.0) * 0.65 * 100) / 100;
  const exitTitle = level?.exit_intent_title || 'ESPERE! Liberei um desconto secreto exclusivo para você:';
  const exitCta = level?.exit_intent_cta_text || 'SIM! QUERO APROVEITAR COM ESSE DESCONTO';

  const handleExitAccept = async () => {
    if (isPreview) return;
    if (exitProcessing) return;
    setExitProcessing(true);
    playUiSound('success');
    sendEvent('exit_accept', { price: exitDiscount });

    try {
      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session?.token,
          level_id: level?.id,
          price: exitDiscount,
          product_id: level?.product_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          window.location.reload();
        }
      } else {
        alert('Erro: ' + (data.message || 'Falha ao processar'));
        setShowExitModal(false);
        setExitProcessing(false);
      }
    } catch {
      setShowExitModal(false);
      setExitProcessing(false);
    }
  };

  const videoSrc = level?.video || '';
  const prizeImg = level?.image || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop&q=80';
  const progressVal = Number(level?.progress_value) || 86;

  let benefitsObj = {};
  try {
    if (typeof level?.benefits === 'object' && level?.benefits !== null) {
      benefitsObj = level.benefits;
    } else if (typeof level?.benefits === 'string' && level?.benefits.trim().startsWith('{')) {
      benefitsObj = JSON.parse(level.benefits);
    }
  } catch (e) {
    benefitsObj = {};
  }

  if (benefitsObj.offer_template === 'videocall' || level?.theme_name === 'videocall') {
    return (
      <VideoCallOfferView
        session={session}
        campaign={campaign}
        level={level}
        benefits={benefitsObj}
        onAcceptCheckout={handleAccept}
        onDeclineOffer={handleDecline}
        isPreview={isPreview}
      />
    );
  }

  return (
    <div className={`offer-body-wrap ${isPreview ? 'is-preview-mode' : ''}`}>
      <style>{`
        .offer-body-wrap {
          --bg-0: 220 35% 4%;
          --bg-1: 220 25% 7%;
          --bg-2: 220 22% 12%;
          --border-soft: 0 0% 100%;
          --text: 213 24% 97%;
          --text-soft: 215 17% 83%;
          --text-muted: 217 12% 60%;
          --text-dim: 219 11% 40%;
          --campaign-accent: 151 84% 54%;
          --campaign-accent-bright: 151 89% 67%;
          --campaign-accent-deep: 151 79% 36%;
          --campaign-shadow-rgb: 41, 236, 143;
          --green: 152 84% 54%;
          --green-bright: 150 100% 68%;
          --green-deep: 152 78% 37%;
          --red: 4 100% 67%;
          --red-bright: 4 100% 73%;
        }

        .offer-body-wrap {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: hsl(var(--bg-0));
          color: hsl(var(--text));
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
          user-select: none;
          -webkit-user-select: none;
        }

        @media (min-width: 481px) {
          .offer-body-wrap {
            background: hsl(var(--bg-0));
          }
        }

        .campaign-aura {
          display: none;
        }

        .main-container {
          position: relative;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          max-width: 380px;
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 160px);
        }

        /* Top Bar */
        .top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
        }

        .brand-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Manrope', system-ui, sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .brand-icon {
          display: flex;
          height: 24px;
          width: 24px;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          background: hsl(var(--campaign-accent));
          color: hsl(var(--bg-0));
          box-shadow: 0 4px 12px rgba(var(--campaign-shadow-rgb), 0.35);
        }

        .timer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 9999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.025em;
          background: rgba(255, 94, 84, 0.10);
          border: 1px solid rgba(255, 94, 84, 0.25);
          color: hsl(var(--red));
        }

        .timer-dot {
          height: 6px;
          width: 6px;
          border-radius: 9999px;
          background: hsl(var(--red));
          animation: timerPulse 1.2s ease-out infinite;
        }

        /* Hero Video Section */
        .hero-media-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          height: 100svh;
          max-height: 640px;
          background: hsl(var(--bg-0));
        }

        .hero-video {
          position: absolute;
          inset: 0;
          height: 100%;
          width: 100%;
          object-fit: cover;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 80% 35% at 50% 100%, hsl(var(--campaign-accent) / 0.07) 0%, transparent 70%),
                      linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.88) 68%, rgba(0,0,0,1) 100%);
        }

        .live-tag {
          position: absolute;
          top: 52px;
          left: 16px;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 6px;
          padding: 4px 10px;
          background: rgba(255, 94, 84, 0.85);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .live-dot {
          height: 6px;
          width: 6px;
          border-radius: 9999px;
          background: #fff;
          animation: liveDot 1s ease-in-out infinite;
        }

        .live-text {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #fff;
        }

        /* Sound Button */
        .sound-trigger {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -58%);
          z-index: 15;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .sound-button {
          position: relative;
          display: flex;
          height: 64px;
          width: 64px;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          border: 0;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 0 0 8px rgba(var(--campaign-shadow-rgb), 0.14),
                      0 0 28px rgba(var(--campaign-shadow-rgb), 0.30),
                      0 14px 40px rgba(0, 0, 0, 0.5);
        }

        .sound-ring {
          position: absolute;
          inset: -10px;
          border-radius: 9999px;
          border: 1.5px solid rgba(var(--campaign-shadow-rgb), 0.35);
          animation: pulseRing 2s ease-out infinite;
        }

        .play-triangle {
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 11px 0 11px 20px;
          border-color: transparent transparent transparent hsl(var(--bg-0));
          margin-left: 5px;
        }

        .sound-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 9999px;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 600;
          color: #fff;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Hero Text Content inside Video */
        .hero-text-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 10;
          padding: 0 16px 20px 16px;
        }

        .eyebrow-line-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .eyebrow-line {
          display: block;
          height: 1px;
          width: 14px;
          opacity: 0.7;
          background: hsl(var(--campaign-accent));
        }

        .eyebrow-text {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: hsl(var(--campaign-accent));
        }

        .hero-title {
          font-family: 'Manrope', system-ui, sans-serif;
          font-weight: 900;
          font-size: clamp(30px, 8.5vw, 38px);
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: #fff;
          text-shadow: 0 3px 20px rgba(0,0,0,0.9), 0 0 60px hsl(var(--campaign-accent) / 0.16);
          margin-bottom: 10px;
        }

        .text-grad-green {
          color: hsl(var(--green-bright));
          font-weight: 900;
        }

        .hero-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.68);
          line-height: 1.5;
          text-shadow: 0 1px 10px rgba(0,0,0,0.95);
          max-width: 90%;
        }

        /* Content Area */
        .content-body {
          padding: 16px;
        }

        .luck-badge-center {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }

        .luck-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 9999px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: rgba(var(--campaign-shadow-rgb), 0.10);
          border: 1px solid rgba(var(--campaign-shadow-rgb), 0.30);
          color: hsl(var(--campaign-accent-bright));
        }

        /* Heat Probability Card */
        .heat-card {
          position: relative;
          margin-bottom: 16px;
          overflow: hidden;
          border-radius: 18px;
          background: hsla(var(--campaign-accent), 0.06);
          border: 1px solid hsla(var(--campaign-accent), 0.30);
          padding: 16px;
        }

        .heat-card-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.025em;
          color: hsl(var(--text-soft));
          margin-bottom: 12px;
        }

        .heat-card-stat {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .heat-percentage {
          font-family: 'Manrope', system-ui, sans-serif;
          font-weight: 900;
          font-size: 58px;
          line-height: 0.9;
          letter-spacing: -0.04em;
          color: hsl(var(--campaign-accent-bright));
        }

        .heat-card-desc {
          flex: 1;
          font-size: 13px;
          font-weight: 600;
          color: hsl(var(--text-soft));
          min-width: 120px;
          line-height: 1.35;
        }

        .heat-bar-track {
          position: relative;
          margin-bottom: 8px;
          overflow: hidden;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.05);
          height: 16px;
        }

        .heat-bar-fill {
          position: relative;
          height: 100%;
          background: hsl(var(--campaign-accent));
          border-radius: 99px;
          box-shadow: 0 0 14px rgba(var(--campaign-shadow-rgb), 0.5);
          animation: heatFill 1.4s cubic-bezier(0.22, 1, 0.36, 1) backwards, heatGlow 2.5s ease-in-out 1.4s infinite;
        }

        .heat-bar-glow-tip {
          position: absolute;
          right: -2px;
          top: 0;
          height: 100%;
          width: 14px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.55);
          filter: blur(4px);
        }

        .heat-card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: hsl(var(--text-dim));
        }

        .heat-card-footer-right {
          color: hsl(var(--campaign-accent-bright));
          font-weight: 800;
        }

        /* Product / Prize Spotlight Card */
        .prize-card {
          overflow: hidden;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 16px;
        }

        .prize-image-wrap {
          position: relative;
          width: 100%;
          height: 200px;
          background-size: cover;
          background-position: center;
          background-color: hsl(var(--bg-1));
        }

        .prize-image-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.65) 100%);
        }

        .prize-tag {
          position: absolute;
          left: 12px;
          top: 12px;
          z-index: 1;
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: rgba(0, 0, 0, 0.65);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
        }

        .prize-card-content {
          padding: 14px 16px 16px;
        }

        .prize-title {
          font-family: 'Manrope', system-ui, sans-serif;
          font-size: 18px;
          font-weight: 800;
          line-height: 1.25;
          color: hsl(var(--text));
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .prize-subtitle {
          font-size: 13px;
          font-weight: 500;
          line-height: 1.35;
          color: hsl(var(--text-muted));
        }

        .prize-price-tag {
          margin-top: 10px;
          display: inline-block;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(var(--campaign-shadow-rgb), 0.1);
          border: 1px solid rgba(var(--campaign-shadow-rgb), 0.25);
          font-family: 'Manrope', system-ui, sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: hsl(var(--campaign-accent-bright));
        }

        /* Loss Alert Frame */
        .loss-frame {
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-radius: 14px;
          padding: 12px 14px;
          background: rgba(255, 94, 84, 0.06);
          border: 1px solid rgba(255, 94, 84, 0.28);
        }

        .loss-icon-wrap {
          margin-top: 2px;
          display: flex;
          height: 22px;
          width: 22px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: rgba(255, 94, 84, 0.18);
          color: hsl(var(--red-bright));
        }

        .loss-text {
          font-size: 13px;
          font-weight: 500;
          color: hsl(var(--text-soft));
          line-height: 1.4;
        }

        /* Fixed Sticky Bottom CTA */
        .cta-fade {
          pointer-events: none;
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 49;
          height: 120px;
          width: 100%;
          max-width: 480px;
          background: hsl(var(--bg-0));
          opacity: 0.95;
        }

        .cta-bottom-bar {
          position: fixed;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          display: flex;
          width: calc(100% - 32px);
          max-width: 380px;
          flex-direction: column;
          gap: 8px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .cta-button {
          position: relative;
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          overflow: hidden;
          border-radius: 16px;
          border: 0;
          padding: 17px 18px;
          font-family: 'Manrope', system-ui, sans-serif;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0.025em;
          background: hsl(var(--campaign-accent));
          color: hsl(var(--bg-0));
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
          animation: ctaBreathe 2.4s ease-in-out infinite;
        }

        .cta-button:active {
          transform: scale(0.985);
        }

        .cta-shine:after {
          display: none;
        }

        .cta-subtext {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--text-muted));
        }

        .cta-decline-link {
          text-align: center;
          font-size: 12px;
          color: hsl(var(--text-dim));
          text-decoration: underline;
          cursor: pointer;
          margin-top: 2px;
          transition: color 0.2s;
        }

        .cta-decline-link:hover {
          color: hsl(var(--text-muted));
        }

        /* Animations */
        @keyframes ctaBreathe {
          0%, 100% { transform: scale(1); box-shadow: 0 12px 38px rgba(var(--campaign-shadow-rgb), 0.32); }
          50% { transform: scale(1.015); box-shadow: 0 16px 46px rgba(var(--campaign-shadow-rgb), 0.46); }
        }

        @keyframes ctaShine {
          0% { left: -75%; }
          60%, 100% { left: 130%; }
        }

        @keyframes timerPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 94, 84, 0.6); }
          100% { box-shadow: 0 0 0 7px rgba(255, 94, 84, 0); }
        }

        @keyframes liveDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        @keyframes heatFill {
          0% { width: 0%; }
        }

        @keyframes heatGlow {
          0%, 100% { box-shadow: 0 0 14px rgba(var(--campaign-shadow-rgb), 0.5); }
          50% { box-shadow: 0 0 24px rgba(var(--campaign-shadow-rgb), 0.85); }
        }

        /* Social Proof Floating Toast */
        .social-proof-toast {
          position: fixed;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 120px);
          left: 16px;
          right: 16px;
          max-width: 380px;
          margin: 0 auto;
          z-index: 48;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(14, 21, 33, 0.90);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(var(--campaign-shadow-rgb), 0.4);
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.65), 0 0 18px rgba(var(--campaign-shadow-rgb), 0.18);
          transform: translateY(0);
          opacity: 1;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
        }

        .is-preview-toast {
          position: absolute !important;
          bottom: 80px !important;
          left: 12px !important;
          right: 12px !important;
          max-width: calc(100% - 24px) !important;
          margin: 0 !important;
          z-index: 99 !important;
        }

        .social-proof-avatar {
          height: 36px;
          width: 36px;
          border-radius: 9999px;
          background: hsl(var(--campaign-accent));
          color: hsl(var(--bg-0));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          flex-shrink: 0;
          box-shadow: 0 0 12px rgba(var(--campaign-shadow-rgb), 0.4);
        }

        .social-proof-body {
          flex: 1;
          min-width: 0;
        }

        .social-proof-title {
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
          margin-bottom: 2px;
        }

        .social-proof-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: hsl(var(--campaign-accent-bright));
          font-weight: 600;
        }

        .social-proof-meta-dot {
          height: 4px;
          width: 4px;
          border-radius: 9999px;
          background: hsl(var(--campaign-accent-bright));
        }

        /* Exit Intent Modal */
        .exit-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          transition: opacity 0.3s ease;
        }

        .exit-modal-card {
          position: relative;
          width: 100%;
          max-width: 380px;
          border-radius: 24px;
          background: #0b0f19;
          border: 1.5px solid rgba(255, 94, 84, 0.5);
          box-shadow: 0 25px 60px rgba(0,0,0,0.8);
          padding: 24px 20px;
          text-align: center;
        }

        .exit-modal-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(255, 94, 84, 0.15);
          border: 1px solid rgba(255, 94, 84, 0.4);
          color: #ff5e54;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .exit-modal-title {
          font-family: 'Manrope', system-ui, sans-serif;
          font-size: 20px;
          font-weight: 900;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 10px;
        }

        .exit-modal-price-box {
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .exit-modal-old-price {
          font-size: 13px;
          color: #9ca3af;
          text-decoration: line-through;
          margin-bottom: 2px;
        }

        .exit-modal-new-price {
          font-family: 'Manrope', system-ui, sans-serif;
          font-size: 28px;
          font-weight: 900;
          color: hsl(var(--green-bright));
        }

        .exit-modal-cta {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: 0;
          background: #10b981;
          color: #052e16;
          font-family: 'Manrope', system-ui, sans-serif;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
          margin-bottom: 10px;
        }

        .exit-modal-close-link {
          font-size: 12px;
          color: #6b7280;
          text-decoration: underline;
          cursor: pointer;
        }

        /* Preview Mode inside Simulator Frame */
        .offer-body-wrap.is-preview-mode {
          min-height: 100% !important;
          height: 100% !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          position: relative !important;
          background: hsl(var(--bg-0)) !important;
        }

        .offer-body-wrap.is-preview-mode .main-container {
          max-width: 100% !important;
          padding-bottom: 24px !important;
          position: relative !important;
        }

        .offer-body-wrap.is-preview-mode .hero-media-wrapper {
          height: 380px !important;
          max-height: 380px !important;
        }

        .offer-body-wrap.is-preview-mode .top-bar {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          padding: 10px 14px !important;
        }

        .offer-body-wrap.is-preview-mode .live-tag {
          top: 44px !important;
          left: 14px !important;
        }

        .offer-body-wrap.is-preview-mode .cta-fade {
          display: none !important;
        }

        .offer-body-wrap.is-preview-mode .cta-bottom-bar {
          position: relative !important;
          bottom: auto !important;
          left: auto !important;
          transform: none !important;
          width: 100% !important;
          max-width: 100% !important;
          margin-top: 18px !important;
          padding: 0 4px !important;
        }
      `}</style>

      {/* Campaign Aura */}
      <div className="campaign-aura" aria-hidden="true" />

      <div className="main-container">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="brand-badge">
            <span className="brand-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
              </svg>
            </span>
            <span>{campaign?.name || 'UpsellFlow'}</span>
          </div>

          <div className="timer-badge" aria-label="Oferta termina em">
            <span className="timer-dot" />
            <span id="countdown">{formattedTime}</span>
          </div>
        </header>

        {/* Hero Media Video Section */}
        <section className="hero-media-wrapper">
          {/* Live Tag */}
          <div className="live-tag">
            <span className="live-dot" />
            <span className="live-text">{benefitsObj.live_badge || 'AO VIVO'}</span>
          </div>

          {/* Video Player */}
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              playsInline
              autoPlay
              loop
              muted
              className="hero-video"
            />
          ) : (
            <div
              className="hero-video"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at 50% 30%, #172554 0%, #030712 75%)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '10px',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="m7 4 12 8-12 8V4z" />
                </svg>
              </div>
              <span style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600 }}>
                {isPreview ? 'Envie ou cole a URL do vídeo na aba Vídeo' : 'Aguardando vídeo...'}
              </span>
            </div>
          )}

          {/* Background Gradient Overlay */}
          <div className="hero-overlay" />

          {/* Center Sound Button Trigger */}
          <div className="sound-trigger" onClick={handleToggleSound}>
            <div className="sound-button">
              <span className="sound-ring" />
              <span className="play-triangle" />
            </div>
            <div className="sound-pill">
              {isMuted ? (benefitsObj.sound_on_text || '🔊 Toca pra ouvir') : (benefitsObj.sound_off_text || '🔇 Som ativado')}
            </div>
          </div>

          {/* Hero Bottom Headline Content */}
          <div className="hero-text-bottom">
            <div className="eyebrow-line-wrap">
              <span className="eyebrow-line" />
              <span className="eyebrow-text">{benefitsObj.eyebrow_text || 'Oferta Especial'}</span>
            </div>
            <h1 className="hero-title">
              {benefitsObj.headline_prefix ? `${benefitsObj.headline_prefix} ` : ''}
              <span className="text-grad-green">
                {level?.headline || 'muito mais fácil levar uma cota!'}
              </span>
            </h1>
            <p className="hero-subtitle">
              {level?.subheadline || 'Achar uma cota premiada por esta página é muito mais fácil.'}
            </p>
          </div>
        </section>

        {/* Content Sections */}
        <main className="content-body">
          {/* Luck Eyebrow Pill */}
          <div className="luck-badge-center">
            <span className="luck-badge-pill">{benefitsObj.luck_badge || '⚡ MÁXIMO DE SORTE ATIVADO'}</span>
          </div>

          {/* Heat Probability Card */}
          <div className="heat-card">
            <div className="heat-card-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--campaign-accent-bright))' }}>
                <path d="m13 2-3 7h6l-3 7" />
              </svg>
              <span>{benefitsObj.progress_title || level?.progress_text || 'Sua chance de achar uma cota premiada'}</span>
            </div>
            <div className="heat-card-stat">
              <span className="heat-percentage">{progressVal}%</span>
              <span className="heat-card-desc">{benefitsObj.progress_desc || 'Por esta página, achar cota premiada está muito mais provável.'}</span>
            </div>
            <div className="heat-bar-track">
              <div className="heat-bar-fill" style={{ width: `${progressVal}%` }}>
                <span className="heat-bar-glow-tip" />
              </div>
            </div>
            <div className="heat-card-footer">
              <span>{benefitsObj.progress_footer_left || 'FLUXO NORMAL'}</span>
              <span className="heat-card-footer-right">{benefitsObj.progress_footer_right || 'ESTA PÁGINA · MUITO MAIOR'}</span>
            </div>
          </div>

          {/* Prize Spotlight Card */}
          <div className="prize-card">
            <div className="prize-image-wrap" style={{ backgroundImage: `url('${prizeImg}')` }}>
              <div className="prize-image-overlay" />
              <span className="prize-tag">{level?.badge || 'PRÊMIO PRINCIPAL'}</span>
            </div>
            <div className="prize-card-content">
              <div className="prize-title">
                {level?.name || '15 IPHONE 17 PRO MAX + 10 BOOMBOX 4 OU R$120 MIL 🤩'}
              </div>
              <div className="prize-subtitle">
                {benefitsObj.prize_subtitle || 'Participe e concorra com condições exclusivas!'}
              </div>
              {level?.price && (
                <div className="prize-price-tag">
                  R$ {Number(level.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          </div>

          {/* Loss Aversion Warning Frame */}
          <div className="loss-frame">
            <span className="loss-icon-wrap">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M12 2 1 21h22L12 2z" />
              </svg>
            </span>
            <div className="loss-text">
              {benefitsObj.loss_alert_text || 'Saindo daqui, sua chance volta pra 1 em 50. Esse atalho é só desta página.'}
            </div>
          </div>
        </main>

        {/* Floating Bottom CTA Bar */}
        <div className="cta-fade" aria-hidden="true" />
        <div className="cta-bottom-bar">
          <button
            type="button"
            className="cta-button cta-shine"
            onClick={handleAccept}
            disabled={loading}
          >
            <span>{loading ? 'Processando...' : (level?.cta_text || 'Garantir agora!')}</span>
          </button>
          <div className="cta-subtext">
            {benefitsObj.cta_subtext || 'Aproveite a condição especial.'}
          </div>
          <div className="cta-decline-link" onClick={handleDecline}>
            {benefitsObj.decline_text || 'Não, obrigado. Quero recusar esta oferta.'}
          </div>
        </div>
      </div>

      {/* Live Social Proof Floating Toast */}
      {socialToast && (
        <div className={`social-proof-toast ${isPreview ? 'is-preview-toast' : ''}`}>
          <div className="social-proof-avatar">{socialToast.initials}</div>
          <div className="social-proof-body">
            <div className="social-proof-title">{socialToast.msg}</div>
            <div className="social-proof-meta">
              <span className="social-proof-meta-dot" />
              <span>{socialToast.time}</span>
              <span>• Compra Verificada</span>
            </div>
          </div>
        </div>
      )}

      {/* Exit Intent Downsell Modal */}
      {showExitModal && (
        <div className="exit-modal-backdrop">
          <div className="exit-modal-card">
            <div className="exit-modal-badge">
              <span>{benefitsObj.exit_badge || '🚨 OFERTA RELÂMPAGO DE SAÍDA'}</span>
            </div>
            <h3 className="exit-modal-title">{exitTitle}</h3>
            <div className="exit-modal-price-box">
              <div className="exit-modal-old-price">
                De R$ {Number(level?.price || 97).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por apenas:
              </div>
              <div className="exit-modal-new-price">
                R$ {Number(exitDiscount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <button
              type="button"
              className="exit-modal-cta"
              onClick={handleExitAccept}
              disabled={exitProcessing}
            >
              {exitProcessing ? 'Processando...' : exitCta}
            </button>
            <div className="exit-modal-close-link" onClick={() => setShowExitModal(false)}>
              {benefitsObj.exit_decline_text || 'Não, prefiro sair e perder este desconto exclusivo.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
