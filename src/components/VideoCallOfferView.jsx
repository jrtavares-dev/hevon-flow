'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  trackHevonClientEvent,
  prefetchHevonClientIps,
  appendUpsellFlowUtm,
} from '@/lib/hevonClient';

export const DEFAULT_VIDEOCALL_CONFIG = {
  offer_template: 'classic', // 'classic' | 'videocall'
  // Tela 1: Chamada de Vídeo Recebida
  caller_name: 'Cherminho',
  caller_handle: '@cherminhopremiacoes',
  caller_verified: true,
  caller_verified_color: '#3897f0',
  caller_avatar: '/uploads/images/img_1793306564746_lkt5pk.jpg',
  caller_initials: '',
  call_blur_avatar_bg: true,
  call_badge_text: 'CHAMADA DE VÍDEO',
  call_status_text: 'recebida agora',
  call_status_waiting_text: 'ainda na linha...',
  call_greeting_prefix: 'quer falar com você,',
  call_visitor_name: 'FULANO',
  call_greeting_fallback: 'quer falar com você agora',
  call_accept_text: 'Atender',
  call_accept_color: '#25d366',
  call_decline_text: 'Recusar',
  call_decline_color: '#e5223a',
  call_decline_behavior: 'missed_call', // 'missed_call' | 'go_to_offer' | 'answer_anyway' | 'decline_funnel'
  missed_call_title: 'Chamada perdida.',
  missed_call_subtitle: 'Ele deixou um recado pra você.',
  missed_call_status_text: 'Não atendida',
  missed_call_delay: 4,
  missed_call_video_url: '',
  missed_call_avatar_mode: 'auto', // 'auto' | 'initials'
  missed_call_btn_cancel_text: 'Cancelar',
  missed_call_btn_voice_text: 'Gravar mensagem de voz',
  missed_call_btn_redial_text: 'Ligar novamente',
  show_skip_link: true,
  skip_link_text: 'mostrar meus números',
  call_ringtone_enabled: true,
  call_sfx_enabled: true,
  call_vibration_enabled: true,

  // Tela 2: Vídeo da Chamada em Andamento
  video_object_fit: 'cover', // 'cover' | 'contain'
  video_show_header: true,
  video_live_dot_color: '#25d366',
  video_cta_delay: 3,
  video_cta_badge: 'COROLLA + MOTO só por esta página',
  video_cta_text: 'PARTICIPAR AGORA',
  video_cta_action: 'go_to_offer', // 'go_to_offer' | 'direct_checkout'
  video_show_controls: true,
  video_ended_text: 'Chamada encerrada',
  video_unmute_text: 'TOQUE PARA ATIVAR O SOM',
  video_play_text: 'TOQUE PARA OUVIR',

  // Tela 3: Oferta Especial de Bônus
  offer_top_badge: 'PRÓXIMA RASPADINHA DA MOTO',
  offer_headline_prefix: 'achou',
  offer_normal_prize: 'a moto',
  offer_headline_mid: 'comprando',
  offer_headline_highlight: 'por aqui?',
  offer_custom_headline: '', // Se preenchido, substitui a estrutura automática
  offer_card_top_text: 'em vez de levar',
  offer_card_strike_prefix: 'só',
  offer_card_top_suffix: ', você leva',
  offer_bonus_main: 'COROLLA + MOTO',
  offer_min_purchase: 'com compra de qualquer valor',
  offer_disclaimer_text: 'Vale só se a raspadinha premiada da moto sair de compra feita por esta página.',
  offer_timer_label: 'acaba em',
  offer_timer_urgent_label: 'últimos segundos',
  offer_show_replay_btn: true,
  offer_replay_btn_text: 'rever a chamada',
  offer_show_decline_btn: true,
  offer_decline_btn_text: 'mostrar meus números',
  offer_decline_url: '',
  external_checkout_url: '',

  // Tela 4: Confirmação / Redirecionamento
  redirect_screen_enabled: true,
  redirect_step1_text: 'Confirmando seu acesso...',
  redirect_step2_text: 'Liberando seu bônus exclusivo...',
  redirect_step3_text: 'Tudo pronto! Redirecionando...',

  // Cores & Estilo Geral
  vc_accent_color: '#ff1030',
  vc_bg_color: '#0c0608',
  vc_page_bg_color: '#050203',
  vc_gold_color: '#ffc531',
  vc_text_color: '#ffffff',
  vc_card_max_width: 360,
};

function getInitials(name) {
  if (!name) return 'VIP';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return ((parts[0][0] || '') + (parts[1][0] || '')).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return (parts[0].slice(0, 2)).toUpperCase();
  }
  return (parts[0] || 'V').toUpperCase();
}

function formatMMSS(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m < 10 ? '0' : ''}${m}:${r < 10 ? '0' : ''}${r}`;
}

function adjustColorHex(hex, amount) {
  try {
    let col = String(hex || '#ff1030').replace('#', '');
    if (col.length === 3) {
      col = col.split('').map((c) => c + c).join('');
    }
    const num = parseInt(col, 16);
    if (isNaN(num)) return hex;
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return hex;
  }
}

function buildRedirectUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    url = 'https://' + url;
  }
  if (typeof window !== 'undefined' && window.location.search) {
    try {
      const parsed = new URL(url, window.location.origin);
      const curParams = new URLSearchParams(window.location.search);
      curParams.forEach((val, key) => {
        if (!parsed.searchParams.has(key)) {
          parsed.searchParams.set(key, val);
        }
      });
      return parsed.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}${window.location.search.replace(/^\?/, '')}`;
    }
  }
  return url;
}

export default function VideoCallOfferView({
  session,
  campaign,
  level,
  benefits = {},
  onAcceptCheckout,
  onDeclineOffer,
  isPreview = false,
  previewStage = null, // 'call' | 'video' | 'offer' | 'redirect' | null
}) {
  const cfg = {
    ...DEFAULT_VIDEOCALL_CONFIG,
    ...(benefits && typeof benefits === 'object' && !Array.isArray(benefits) ? benefits : {}),
  };

  // Sync with standard level fields when present
  const avatarUrl = level?.image !== undefined && level?.image !== null && level?.image !== ''
    ? level.image
    : cfg.caller_avatar;
  const videoUrl = level?.video || cfg.video_url || '';
  const finalCtaText = level?.cta_text || cfg.offer_cta_text || 'GARANTIR AGORA';
  const timerEnabled = level?.timer_enabled !== undefined ? Boolean(level.timer_enabled) : true;
  const timerDurationSec = Math.max(10, Number(level?.timer_duration || 180));

  // Visitor first name resolution
  const rawSessionName = session?.customer_name && session.customer_name !== 'Visitante Oferta' && session.customer_name !== 'Visitante'
    ? session.customer_name.trim().split(/\s+/)[0]
    : '';
  const visitorName = rawSessionName || (cfg.call_visitor_name || '').trim();

  // Stage state: 'call' | 'video' | 'offer' | 'redirect'
  const [stage, setStage] = useState(previewStage === 'missed' ? 'call' : (previewStage || 'call'));
  const [missedCallState, setMissedCallState] = useState(previewStage === 'missed');
  const [missedCountdown, setMissedCountdown] = useState(Math.max(1, Number(cfg.missed_call_delay) || 4));
  const [isMissedCallVideo, setIsMissedCallVideo] = useState(false);
  const [ringCount, setRingCount] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);
  const [videoCtaVisible, setVideoCtaVisible] = useState(false);
  const [callEndedOverlay, setCallEndedOverlay] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [centerPromptMode, setCenterPromptMode] = useState(null); // null | 'sound' | 'play'
  const [hasWatchedCall, setHasWatchedCall] = useState(false);
  const [offerTimeLeft, setOfferTimeLeft] = useState(timerDurationSec);
  const [redirectProgress, setRedirectProgress] = useState({ text: cfg.redirect_step1_text, pct: 28 });

  const videoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const callTimerRef = useRef(null);
  const ctaTimeoutRef = useRef(null);
  const offerTimerRef = useRef(null);
  const missedTimerRef = useRef(null);
  const missedIntervalRef = useRef(null);
  const hevonStartTimeRef = useRef(Date.now());
  const hevonMilestonesSentRef = useRef({
    game_started: false,
    reward_granted: false,
    cta_clicked: false,
  });

  useEffect(() => {
    if (!isPreview) {
      prefetchHevonClientIps();
    }
  }, [isPreview]);

  const getVideoWatchedPct = useCallback(() => {
    try {
      const vid = videoRef.current;
      if (vid && vid.duration && vid.duration > 0) {
        return Math.min(100, Math.round((vid.currentTime / vid.duration) * 100));
      }
    } catch {}
    return 0;
  }, []);

  const currentTimeString = useMemo(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, []);

  // Sync previewStage when in editor preview
  useEffect(() => {
    if (previewStage) {
      if (previewStage === 'missed') {
        setStage('call');
        setMissedCallState(true);
      } else {
        setStage(previewStage);
        setMissedCallState(false);
      }
      if (previewStage === 'video') {
        setVideoCtaVisible(true);
        setCallEndedOverlay(false);
      }
    }
  }, [previewStage]);

  useEffect(() => {
    setOfferTimeLeft(timerDurationSec);
  }, [timerDurationSec]);

  // Web Audio Synthesizer (exact RaspVIP tones)
  const getAudioCtx = useCallback(() => {
    if (isPreview) return null;
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    } catch {
      // ignore
    }
    return audioCtxRef.current;
  }, [isPreview]);

  const resumeAudio = useCallback(() => {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      try {
        ctx.resume();
      } catch {
        // ignore
      }
    }
  }, [getAudioCtx]);

  const playTone = useCallback((freq, duration, type = 'sine', gainVal = 0.08, startTime = null) => {
    const ctx = getAudioCtx();
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = startTime || ctx.currentTime;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(gainVal, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    } catch {
      // ignore
    }
  }, [getAudioCtx]);

  const vibrate = useCallback((pattern) => {
    if (isPreview || !cfg.call_vibration_enabled) return;
    try {
      if (navigator?.vibrate) navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }, [isPreview, cfg.call_vibration_enabled]);

  const sfx = {
    ring: () => {
      if (!cfg.call_ringtone_enabled || isPreview) return;
      const ctx = getAudioCtx();
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const notes = [659, 784, 880, 784, 659, 784, 1046, 880];
      notes.forEach((n, idx) => {
        playTone(n, 0.22, 'sine', 0.07, now + idx * 0.17);
      });
    },
    pick: () => {
      if (!cfg.call_sfx_enabled || isPreview) return;
      const ctx = getAudioCtx();
      playTone(523, 0.12, 'sine', 0.08);
      if (ctx) playTone(784, 0.18, 'sine', 0.07, ctx.currentTime + 0.1);
    },
    hang: () => {
      if (!cfg.call_sfx_enabled || isPreview) return;
      const ctx = getAudioCtx();
      playTone(440, 0.12, 'sine', 0.05);
      if (ctx) playTone(330, 0.18, 'sine', 0.05, ctx.currentTime + 0.13);
    },
    moeda: () => {
      if (!cfg.call_sfx_enabled || isPreview) return;
      const ctx = getAudioCtx();
      playTone(1318, 0.1, 'sine', 0.07);
      if (ctx) playTone(1760, 0.22, 'sine', 0.07, ctx.currentTime + 0.08);
    },
    bip: (urgent = false) => {
      if (!cfg.call_sfx_enabled || isPreview) return;
      playTone(urgent ? 1400 : 1000, 0.06, 'sine', 0.04);
    },
  };

  // Unlock Web Audio on first user interaction
  useEffect(() => {
    if (isPreview) return;
    const unlock = () => resumeAudio();
    document.addEventListener('pointerdown', unlock, { once: true, passive: true });
    document.addEventListener('touchstart', unlock, { once: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, [isPreview, resumeAudio]);

  // Ringing loop in Stage 1 ('call')
  useEffect(() => {
    if (isPreview || stage !== 'call' || missedCallState) {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      return;
    }
    const doRing = () => {
      sfx.ring();
      vibrate([200, 100, 200]);
      setRingCount((c) => c + 1);
    };
    doRing();
    ringIntervalRef.current = setInterval(doRing, 2600);
    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, [isPreview, stage, missedCallState, cfg.call_ringtone_enabled]);

  // Go to Offer Stage ('offer')
  const goToOfferStage = useCallback(() => {
    if (ctaTimeoutRef.current) clearTimeout(ctaTimeoutRef.current);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    try {
      if (videoRef.current) videoRef.current.pause();
    } catch {
      // ignore
    }
    sfx.moeda();
    vibrate([40, 60, 40]);
    setStage('offer');
  }, [vibrate]);

  // End Call transition
  const handleEndVideoCall = useCallback((fromEndedEvent = false) => {
    if (ctaTimeoutRef.current) clearTimeout(ctaTimeoutRef.current);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    try {
      if (videoRef.current) videoRef.current.pause();
    } catch {
      // ignore
    }
    if (!fromEndedEvent) {
      sfx.hang();
      vibrate(20);
    }
    setCallEndedOverlay(true);
    setTimeout(() => {
      setCallEndedOverlay(false);
      goToOfferStage();
    }, fromEndedEvent ? 900 : 650);
  }, [goToOfferStage, vibrate]);

  // Answer Call -> Go to Stage 2 ('video')
  const handleAnswerCall = useCallback((fromMissed = false) => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    if (missedIntervalRef.current) clearInterval(missedIntervalRef.current);
    if (missedTimerRef.current) clearTimeout(missedTimerRef.current);
    resumeAudio();
    sfx.pick();
    vibrate(30);
    setHasWatchedCall(true);
    setCallEndedOverlay(false);
    setVideoCtaVisible(isPreview);
    setCallSeconds(0);
    setCenterPromptMode(null);
    setMissedCallState(false);
    setIsMissedCallVideo(Boolean(fromMissed));
    setStage('video');

    if (!isPreview && !hevonMilestonesSentRef.current.game_started) {
      hevonMilestonesSentRef.current.game_started = true;
      trackHevonClientEvent(
        {
          event: 'game_interacted',
          game_type: 'video_call',
          experience_slug: campaign?.slug || 'video_call',
          experience_name: campaign?.name || level?.headline || 'Chamada de Vídeo',
          action_id: campaign?.slug || undefined,
          interaction: {
            action: 'game_started',
            call_source: fromMissed ? 'missed_call' : 'incoming_call',
            campaign_id: campaign?.id || null,
            level_id: level?.id || null,
          },
        },
        {
          session,
          destUrl: appendUpsellFlowUtm(
            level?.external_checkout_url || cfg.external_checkout_url || campaign?.final_redirect_url || '',
            'video_call'
          ),
          startTimeMs: hevonStartTimeRef.current,
          videoWatchedPct: getVideoWatchedPct(),
        }
      );
    }

    const chosenVideo = (fromMissed && cfg.missed_call_video_url)
      ? cfg.missed_call_video_url
      : videoUrl;

    const delayMs = Math.max(0, ( parseFloat(cfg.video_cta_delay) || 0 )) * 1000;
    if (ctaTimeoutRef.current) clearTimeout(ctaTimeoutRef.current);
    ctaTimeoutRef.current = setTimeout(() => {
      setVideoCtaVisible(true);
      sfx.moeda();
      vibrate([20, 40, 20]);
    }, delayMs);

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);

    // Start video playback after state update
    setTimeout(() => {
      const vid = videoRef.current;
      if (!vid || !chosenVideo) return;
      try {
        if (vid.src !== chosenVideo) {
          vid.src = chosenVideo;
          vid.load();
        }
        vid.currentTime = 0;
        vid.muted = false;
        setIsMuted(false);
        const playPromise = vid.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(() => {
            vid.muted = true;
            setIsMuted(true);
            const mutedPlay = vid.play();
            if (mutedPlay && mutedPlay.catch) {
              mutedPlay.catch(() => {
                setCenterPromptMode('play');
              });
            }
            setCenterPromptMode('sound');
          });
        }
      } catch {
        // ignore
      }
    }, 50);
  }, [cfg.missed_call_video_url, cfg.video_cta_delay, isPreview, resumeAudio, vibrate, videoUrl]);

  // Final Checkout Action (with optional Stage 4 redirect screen)
  const triggerFinalCheckout = useCallback(() => {
    if (offerTimerRef.current) clearInterval(offerTimerRef.current);
    try {
      if (videoRef.current) videoRef.current.pause();
    } catch {
      // ignore
    }
    sfx.moeda();
    vibrate(18);

    const rawUrl = (
      level?.external_checkout_url ||
      cfg.external_checkout_url ||
      campaign?.final_redirect_url ||
      ''
    ).trim();

    const destUrl = appendUpsellFlowUtm(buildRedirectUrl(rawUrl), 'video_call');

    if (!isPreview) {
      if (!hevonMilestonesSentRef.current.reward_granted) {
        hevonMilestonesSentRef.current.reward_granted = true;
        trackHevonClientEvent(
          {
            event: 'reward_granted',
            game_type: 'video_call',
            experience_slug: campaign?.slug || 'video_call',
            experience_name: campaign?.name || level?.headline || 'Chamada de Vídeo',
            action_id: campaign?.slug || undefined,
            reward: {
              type: 'secret_offer',
              title: cfg.offer_bonus_main || level?.headline || campaign?.name || 'Oferta Especial Chamada de Vídeo',
              bonus_quantity: 0,
              cash_value: Number(level?.price || 0),
              special_checkout_url: destUrl || null,
            },
          },
          {
            session,
            destUrl: destUrl || rawUrl,
            startTimeMs: hevonStartTimeRef.current,
            videoWatchedPct: getVideoWatchedPct(),
          }
        );
      }

      if (!hevonMilestonesSentRef.current.cta_clicked) {
        hevonMilestonesSentRef.current.cta_clicked = true;
        trackHevonClientEvent(
          {
            event: 'game_interacted',
            game_type: 'video_call',
            experience_slug: campaign?.slug || 'video_call',
            experience_name: campaign?.name || level?.headline || 'Chamada de Vídeo',
            action_id: campaign?.slug || undefined,
            interaction: {
              action: 'special_checkout_cta_clicked',
              target_url: destUrl || null,
            },
          },
          {
            session,
            destUrl: destUrl || rawUrl,
            startTimeMs: hevonStartTimeRef.current,
            videoWatchedPct: getVideoWatchedPct(),
          }
        );
      }
    }

    // Fire conversion tracking in background
    try {
      if (session?.token) {
        fetch('/api/v1/checkout', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: session.token,
            level_id: level?.id,
            price: level?.price,
            product_id: level?.product_id,
          }),
        }).catch(() => {});
      }
    } catch {
      // ignore
    }

    const executeRedirection = () => {
      if (isPreview) {
        if (destUrl) {
          try {
            window.open(destUrl, '_blank');
          } catch {
            // ignore
          }
        }
        if (onAcceptCheckout) onAcceptCheckout(destUrl);
        return;
      }

      if (destUrl) {
        window.location.href = destUrl;
        return;
      }

      if (onAcceptCheckout) {
        onAcceptCheckout();
      }
    };

    if (cfg.redirect_screen_enabled) {
      setStage('redirect');
      setRedirectProgress({ text: cfg.redirect_step1_text || 'Confirmando seu acesso...', pct: 28 });
      setTimeout(() => {
        setRedirectProgress({ text: cfg.redirect_step2_text || 'Liberando seu bônus exclusivo...', pct: 64 });
      }, 700);
      setTimeout(() => {
        const finalMsg = visitorName
          ? `${visitorName}, ${(cfg.redirect_step3_text || 'Redirecionando...')}`
          : (cfg.redirect_step3_text || 'Tudo pronto! Redirecionando...');
        setRedirectProgress({ text: finalMsg, pct: 100 });
      }, 1400);
      setTimeout(() => {
        executeRedirection();
      }, 2100);
    } else {
      executeRedirection();
    }
  }, [
    campaign?.final_redirect_url,
    cfg.external_checkout_url,
    cfg.redirect_screen_enabled,
    cfg.redirect_step1_text,
    cfg.redirect_step2_text,
    cfg.redirect_step3_text,
    isPreview,
    level?.external_checkout_url,
    level?.id,
    level?.price,
    level?.product_id,
    onAcceptCheckout,
    session?.token,
    vibrate,
    visitorName,
  ]);

  // Decline Call Button Handler
  const handleDeclineCall = () => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    sfx.hang();
    vibrate(20);
    const behavior = cfg.call_decline_behavior || 'missed_call';
    if (behavior === 'answer_anyway') {
      handleAnswerCall();
    } else if (behavior === 'go_to_offer') {
      goToOfferStage();
    } else if (behavior === 'decline_funnel') {
      if (onDeclineOffer) onDeclineOffer();
    } else {
      setMissedCallState(true);
    }
  };

  // Auto-transition timer from WhatsApp "Não atendida" screen to video
  useEffect(() => {
    if (!missedCallState || stage !== 'call') {
      if (missedIntervalRef.current) clearInterval(missedIntervalRef.current);
      if (missedTimerRef.current) clearTimeout(missedTimerRef.current);
      return;
    }

    const totalSec = Math.max(1, Number(cfg.missed_call_delay) || 4);
    setMissedCountdown(totalSec);

    if (missedIntervalRef.current) clearInterval(missedIntervalRef.current);
    if (missedTimerRef.current) clearTimeout(missedTimerRef.current);

    missedIntervalRef.current = setInterval(() => {
      setMissedCountdown((c) => {
        if (c <= 1) {
          clearInterval(missedIntervalRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    missedTimerRef.current = setTimeout(() => {
      handleAnswerCall(true);
    }, totalSec * 1000);

    return () => {
      if (missedIntervalRef.current) clearInterval(missedIntervalRef.current);
      if (missedTimerRef.current) clearTimeout(missedTimerRef.current);
    };
  }, [missedCallState, stage, cfg.missed_call_delay, handleAnswerCall]);

  // Offer Stage Countdown Timer
  useEffect(() => {
    if (isPreview || stage !== 'offer' || !timerEnabled) return;
    offerTimerRef.current = setInterval(() => {
      setOfferTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(offerTimerRef.current);
          return 0;
        }
        const next = prev - 1;
        if (next <= 10) {
          vibrate(6);
          sfx.bip(next <= 3);
        }
        return next;
      });
    }, 1000);
    return () => {
      if (offerTimerRef.current) clearInterval(offerTimerRef.current);
    };
  }, [isPreview, stage, timerEnabled, vibrate]);

  // Bonus title split on '+' (like "COROLLA + MOTO" -> "COROLLA" + <small>+ MOTO</small>)
  const renderBonusFormatted = () => {
    const raw = String(cfg.offer_bonus_main || 'COROLLA + MOTO');
    if (raw.includes('+')) {
      const parts = raw.split('+');
      const mainPart = parts[0].trim();
      const subPart = '+ ' + parts.slice(1).join('+').trim();
      return (
        <>
          {mainPart}
          <small>{subPart}</small>
        </>
      );
    }
    return raw;
  };

  // Colors calculation
  const accentColor = cfg.vc_accent_color || '#ff1030';
  const accentLight = adjustColorHex(accentColor, 45);
  const accentDark = adjustColorHex(accentColor, -65);
  const cardBgColor = cfg.vc_bg_color || '#0c0608';
  const pageBgColor = cfg.vc_page_bg_color || '#050203';
  const goldColor = cfg.vc_gold_color || '#ffc531';
  const goldLight = adjustColorHex(goldColor, 55);
  const goldDark = adjustColorHex(goldColor, -50);
  const textColor = cfg.vc_text_color || '#ffffff';
  const acceptColor = cfg.call_accept_color || '#25d366';
  const declineColor = cfg.call_decline_color || '#e5223a';
  const missedBtnColor = cfg.missed_call_btn_color || '#25d366';
  const missedBtnLight = adjustColorHex(missedBtnColor, 35);
  const missedBtnDark = adjustColorHex(missedBtnColor, -45);

  const initials = (cfg.caller_initials || '').trim() || getInitials(cfg.caller_name);
  const isUrgentTimer = offerTimeLeft <= 60;
  const cardMaxWidth = Math.min(520, Math.max(280, Number(cfg.vc_card_max_width) || 360));

  return (
    <div
      className="vc-root-wrapper"
      style={{
        '--dx-cor-destaque': accentColor,
        '--dx-cor-fundo': cardBgColor,
        '--qxdy': accentColor,
        '--rp0c': cardBgColor,
        '--egyo': accentColor,
        '--ucai': accentLight,
        '--mwtx': accentDark,
        '--jif8': accentLight,
        '--ll8b': accentDark,
        '--y2zp': acceptColor,
        '--mut9': declineColor,
        '--qo73': goldColor,
        '--k8tt': goldLight,
        '--gt4b': goldDark,
        '--mrvg': textColor,
        backgroundColor: isPreview ? cardBgColor : pageBgColor,
        minHeight: isPreview ? '100%' : '100vh',
        height: isPreview ? '100%' : 'auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isPreview ? 'stretch' : 'center',
        alignItems: 'center',
        padding: isPreview ? '0' : '16px 12px',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Sora:wght@400;600;700;800&display=swap');

        .vc-container {
          container-type: inline-size;
          position: relative;
          width: 100%;
          max-width: ${cardMaxWidth}px;
          margin: 0 auto;
          font-family: "Sora", system-ui, -apple-system, sans-serif;
          color: var(--mrvg);
          -webkit-font-smoothing: antialiased;
          text-align: center;
          box-sizing: border-box;
        }
        .vc-container *, .vc-container *::before, .vc-container *::after {
          box-sizing: border-box;
        }
        .vc-container button {
          font-family: inherit;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .vc-container svg {
          display: block;
        }
        .vc-card {
          position: relative;
          width: 100%;
          border-radius: 28px;
          overflow: hidden;
          background: var(--rp0c);
          box-shadow: 0 30px 70px -30px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.08);
        }
        .vc-screen {
          animation: vcFadeIn .35s ease both;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        @keyframes vcFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        /* STAGE 1: INCOMING CALL */
        .vc-stage-call {
          position: relative;
          min-height: clamp(500px, 146cqw, 560px);
          flex: 1;
          display: flex;
        }
        .vc-call-bg {
          position: absolute;
          inset: -12%;
          background: var(--rp0c);
          background-size: cover;
          background-position: center;
        }
        .vc-call-bg.has-img {
          background-size: cover;
          filter: blur(26px) brightness(.42) saturate(1.2);
          transform: scale(1.1);
        }
        .vc-call-inner {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: clamp(18px, 5cqw, 26px) clamp(16px, 5cqw, 24px) clamp(28px, 7cqw, 38px);
        }
        .vc-call-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: auto;
        }
        .vc-badge-call {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.18);
          color: var(--qxdy);
          font-size: clamp(9.5px, 2.5cqw, 11px);
          font-weight: 800;
          letter-spacing: .2em;
          text-transform: uppercase;
        }
        .vc-badge-call svg {
          width: 14px;
          height: 14px;
        }
        .vc-call-status {
          font-size: clamp(10.5px, 2.8cqw, 12px);
          color: rgba(255,242,242,.64);
        }
        .vc-avatar-wrap {
          position: relative;
          width: clamp(108px, 30cqw, 132px);
          aspect-ratio: 1;
          margin: auto 0 clamp(14px, 4cqw, 20px);
        }
        .vc-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid var(--qxdy);
          opacity: 0.75;
          animation: vcRingPulse 2.4s ease-out infinite;
        }
        .vc-ring:nth-child(2) { animation-delay: .8s; }
        .vc-ring:nth-child(3) { animation-delay: 1.6s; }
        @keyframes vcRingPulse {
          0% { transform: scale(1); opacity: .85; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        .vc-avatar-circle {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--qxdy);
          box-shadow: 0 0 0 4px var(--rp0c), 0 0 0 7px var(--qxdy), 0 18px 40px -10px rgba(0,0,0,.8);
          animation: vcWiggle 2.4s ease-in-out infinite;
        }
        .vc-avatar-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .vc-avatar-circle span {
          font-family: "Archivo", sans-serif;
          font-weight: 900;
          font-size: clamp(38px, 11cqw, 48px);
          letter-spacing: -.04em;
          color: #fff;
        }
        @keyframes vcWiggle {
          0%, 100% { transform: rotate(0); }
          6% { transform: rotate(-4deg); }
          12% { transform: rotate(4deg); }
          18% { transform: rotate(-3deg); }
          24% { transform: rotate(0); }
        }
        .vc-stage-call.missed .vc-ring { display: none; }
        .vc-stage-call.missed .vc-avatar-circle { animation: none; filter: grayscale(.3); }
        .vc-caller-name {
          margin: 0;
          font-family: "Archivo", sans-serif;
          font-weight: 900;
          font-size: clamp(24px, 7.4cqw, 32px);
          letter-spacing: -.03em;
          line-height: 1.05;
          color: var(--mrvg);
        }
        .vc-caller-handle {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin: 6px 0 0;
          font-size: clamp(11.5px, 3.1cqw, 13px);
          font-weight: 700;
          color: var(--qxdy);
        }
        .vc-caller-handle svg {
          width: 15px;
          height: 15px;
        }
        .vc-caller-greeting {
          margin: 6px 0 0;
          font-size: clamp(12.5px, 3.4cqw, 15px);
          color: rgba(255,242,242,.64);
        }
        .vc-caller-greeting b {
          color: var(--mrvg);
        }
        .vc-call-actions {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 100%;
          max-width: clamp(220px, 72cqw, 260px);
          margin-top: auto;
          padding-top: clamp(28px, 8cqw, 44px);
        }
        .vc-call-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: 0;
          color: var(--mrvg);
          font-size: clamp(11px, 3cqw, 13px);
          font-weight: 600;
        }
        .vc-call-btn-icon {
          width: clamp(64px, 18cqw, 76px);
          height: clamp(64px, 18cqw, 76px);
          padding: 19px;
          border-radius: 50%;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .15s;
        }
        .vc-call-btn-icon svg {
          width: 100%;
          height: 100%;
        }
        .vc-call-btn:active .vc-call-btn-icon {
          transform: scale(.92);
        }
        .vc-call-btn.accept .vc-call-btn-icon {
          animation: vcAcceptBounce 1.1s ease-in-out infinite;
        }
        @keyframes vcAcceptBounce {
          0%, 100% { transform: translateY(0) rotate(0); }
          15% { transform: translateY(-6px) rotate(-10deg); }
          30% { transform: translateY(0) rotate(8deg); }
          45% { transform: translateY(-4px) rotate(-6deg); }
          60% { transform: translateY(0) rotate(0); }
        }
        .vc-missed-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
          margin-top: auto;
          padding-top: clamp(22px, 7cqw, 36px);
        }
        .vc-missed-text {
          margin: 0;
          font-size: clamp(12.5px, 3.4cqw, 14.5px);
          color: rgba(255,242,242,.64);
        }
        .vc-missed-text b {
          color: var(--mrvg);
        }

        /* STAGE 2: VIDEO CALL */
        .vc-stage-video {
          background: #000;
          padding-bottom: 24px;
        }
        .vc-video-frame {
          position: relative;
          width: 100%;
          height: min(calc(100cqw * 5 / 4), 680px);
          min-height: 460px;
          overflow: hidden;
          background: #000;
        }
        .vc-video-el {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: #000;
        }
        .vc-video-topbar {
          position: absolute;
          z-index: 3;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 14px;
          background: linear-gradient(180deg, rgba(0,0,0,.55), transparent);
        }
        .vc-video-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px 7px 10px;
          border-radius: 999px;
          background: rgba(0,0,0,.45);
          backdrop-filter: blur(6px);
          font-size: clamp(11px, 3cqw, 13px);
          color: #fff;
        }
        .vc-video-pill b { font-weight: 800; }
        .vc-video-pill .timer {
          font-variant-numeric: tabular-nums;
          color: rgba(255,255,255,.75);
        }
        .vc-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: vcBlink 1.2s ease-in-out infinite;
        }
        @keyframes vcBlink { 50% { opacity: .35; } }

        .vc-center-prompt {
          position: absolute;
          z-index: 4;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: 0;
          color: #fff;
          font-size: clamp(10.5px, 2.8cqw, 12px);
          font-weight: 800;
          letter-spacing: .16em;
        }
        .vc-center-prompt-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: var(--qxdy);
          box-shadow: 0 14px 34px -8px var(--qxdy);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vc-video-cta-overlay {
          position: absolute;
          z-index: 4;
          left: 0;
          right: 0;
          bottom: 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          padding: 26px 24px 8px;
          background: linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,.35) 60%, transparent);
          pointer-events: none;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .4s ease, transform .5s cubic-bezier(.2,1.4,.4,1);
        }
        .vc-video-cta-overlay.visible {
          opacity: 1;
          transform: none;
          pointer-events: auto;
        }
        .vc-video-cta-badge {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(0,0,0,.6);
          border: 1px solid rgba(255,255,255,.22);
          backdrop-filter: blur(6px);
          font-size: clamp(10px, 2.7cqw, 12px);
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #fff;
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vc-video-controls {
          position: absolute;
          z-index: 3;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: clamp(16px, 5cqw, 24px);
          padding: 10px 16px 14px;
          background: linear-gradient(0deg, rgba(0,0,0,.6), transparent);
        }
        .vc-ctrl-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 0;
          background: rgba(255,255,255,.18);
          backdrop-filter: blur(6px);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .15s;
        }
        .vc-ctrl-btn:active { transform: scale(.92); }
        .vc-ctrl-btn svg { width: 22px; height: 22px; }
        .vc-ctrl-btn.hangup {
          width: 56px;
          height: 56px;
          background: var(--mut9);
          box-shadow: 0 14px 30px -8px var(--mut9);
        }
        .vc-ctrl-btn.hangup svg { width: 30px; height: 30px; }
        .vc-ended-overlay {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,.82);
          opacity: 0;
          pointer-events: none;
          transition: opacity .3s;
        }
        .vc-ended-overlay.visible { opacity: 1; }
        .vc-ended-overlay span {
          font-family: "Archivo", sans-serif;
          font-weight: 900;
          font-size: clamp(18px, 5.4cqw, 24px);
          letter-spacing: -.02em;
        }

        /* STAGE 3: BONUS OFFER */
        .vc-stage-offer {
          background: var(--rp0c);
          padding-bottom: 24px;
        }
        .vc-offer-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: clamp(22px, 6cqw, 28px) clamp(18px, 5cqw, 24px) clamp(18px, 5cqw, 22px);
        }
        .vc-offer-top-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255,197,49,.1);
          border: 1px solid rgba(255,197,49,.35);
          font-size: clamp(9.5px, 2.6cqw, 11px);
          font-weight: 800;
          letter-spacing: .2em;
          color: var(--qo73);
          text-transform: uppercase;
          animation: vcSlideFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.05s;
        }
        .vc-offer-top-badge i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--qo73);
          animation: vcBlink 1.2s ease-in-out infinite;
        }
        .vc-offer-headline {
          margin: 14px 0 0;
          font-family: "Archivo", sans-serif;
          font-weight: 900;
          font-size: clamp(22px, 6.8cqw, 30px);
          line-height: 1.08;
          letter-spacing: -.03em;
          color: var(--mrvg);
          animation: vcSlideFadeIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 0.16s;
        }
        .vc-offer-headline em {
          font-style: normal;
          color: var(--qo73);
        }
        .vc-bonus-card {
          width: 100%;
          margin-top: clamp(16px, 4.6cqw, 22px);
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.09);
          padding: clamp(18px, 5cqw, 22px) clamp(14px, 4cqw, 18px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
          animation: vcBonusPopIn 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
          animation-delay: 0.28s;
        }
        .vc-bonus-line {
          font-size: clamp(12px, 3.3cqw, 14px);
          color: var(--mrvg);
          font-weight: 600;
          line-height: 1.25;
        }
        .vc-bonus-line s {
          color: rgba(255,242,242,.64);
          text-decoration-thickness: 2px;
        }
        .vc-bonus-line b {
          font-size: clamp(11.5px, 3.1cqw, 13px);
          font-weight: 800;
          color: var(--qo73);
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .vc-bonus-giant {
          font-family: "Archivo", sans-serif;
          font-weight: 900;
          font-size: clamp(32px, 10.5cqw, 46px);
          letter-spacing: -.04em;
          line-height: .94;
          text-align: center;
          margin: 4px 0 2px;
          color: var(--qo73);
          animation: vcGiantShimmer 3s ease-in-out infinite 1.2s;
        }
        .vc-bonus-giant small {
          display: block;
          font-size: .6em;
          letter-spacing: 0;
          margin-top: 2px;
        }
        .vc-offer-disclaimer {
          margin: 10px 0 0;
          font-size: clamp(11px, 3cqw, 12.5px);
          line-height: 1.4;
          color: rgba(255,242,242,.64);
          max-width: 34ch;
          animation: vcSlideFadeIn 0.5s ease both;
          animation-delay: 0.44s;
        }
        .vc-offer-disclaimer b {
          color: var(--mrvg);
          font-weight: 700;
        }

        /* MAIN CTA BUTTON (Shared across stages) */
        .vc-main-cta {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          margin-top: clamp(14px, 4cqw, 18px);
          padding: clamp(15px, 4.4cqw, 18px) 18px;
          border: 0;
          border-radius: 14px;
          background: var(--qxdy);
          color: #fff;
          font-family: "Archivo", sans-serif;
          font-weight: 900;
          font-size: clamp(16px, 4.8cqw, 20px);
          letter-spacing: .04em;
          text-decoration: none;
          box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.65);
          transition: transform .15s, filter .15s;
          animation: vcCtaEntrance 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both 0.54s, vcCtaGlowPulse 2.4s ease-in-out infinite 1.3s;
        }
        .vc-main-cta:hover { filter: brightness(1.06); }
        .vc-main-cta:active { transform: scale(.978); }
        .vc-cta-shine {
          display: block;
          position: absolute;
          top: 0;
          left: -110%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent);
          transform: skewX(-20deg);
          animation: vcCtaShineSweep 3.2s infinite ease-in-out 1.6s;
          pointer-events: none;
          z-index: 1;
        }
        .vc-main-cta span:not(.vc-cta-shine) {
          position: relative;
          z-index: 2;
        }
        .vc-main-cta svg {
          position: relative;
          z-index: 2;
          width: 1.1em;
          height: 1.1em;
          flex-shrink: 0;
          animation: vcArrowSlide 1.6s ease-in-out infinite;
        }
        @keyframes vcArrowSlide {
          50% { transform: translateX(5px); }
        }
        @keyframes vcSlideFadeIn {
          0% {
            opacity: 0;
            transform: translateY(18px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes vcBonusPopIn {
          0% {
            opacity: 0;
            transform: scale(0.86) translateY(24px);
            box-shadow: 0 0 0 rgba(255, 197, 49, 0);
          }
          65% {
            opacity: 1;
            transform: scale(1.03) translateY(-3px);
            box-shadow: 0 10px 32px -8px rgba(255, 197, 49, 0.45);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            box-shadow: 0 4px 18px -8px rgba(0, 0, 0, 0.5);
          }
        }
        @keyframes vcGiantShimmer {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 2px 6px rgba(255, 197, 49, 0.2));
          }
          50% {
            transform: scale(1.025);
            filter: drop-shadow(0 4px 16px rgba(255, 197, 49, 0.6));
          }
        }
        @keyframes vcCtaEntrance {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(22px);
          }
          65% {
            opacity: 1;
            transform: scale(1.035) translateY(-3px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes vcCtaGlowPulse {
          0%, 100% {
            box-shadow: 0 10px 24px -6px rgba(0, 0, 0, 0.7), 0 0 0 0 rgba(255, 255, 255, 0);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 14px 34px -4px rgba(0, 0, 0, 0.8), 0 0 22px 4px var(--qxdy);
            transform: scale(1.02);
          }
        }
        @keyframes vcCtaShineSweep {
          0% { left: -110%; }
          30% { left: 160%; }
          100% { left: 160%; }
        }
        .vc-offer-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 6px 16px;
          margin-top: 12px;
          font-size: clamp(11px, 3cqw, 12.5px);
          color: rgba(255,242,242,.64);
          animation: vcSlideFadeIn 0.5s ease both;
          animation-delay: 0.68s;
        }
        .vc-offer-timer {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-variant-numeric: tabular-nums;
        }
        .vc-offer-timer i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--qxdy);
          animation: vcBlink 1.2s ease-in-out infinite;
        }
        .vc-offer-timer b {
          font-family: "Archivo", sans-serif;
          color: var(--mrvg);
          font-weight: 800;
        }
        .vc-offer-timer.urgent b {
          color: #ff5a6e;
        }
        .vc-link-btn {
          background: transparent;
          border: 0;
          padding: 4px;
          color: rgba(255,242,242,.5);
          font-size: clamp(10.5px, 2.8cqw, 12px);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .vc-link-btn:hover {
          color: var(--mrvg);
        }

        /* WHATSAPP STYLE MISSED CALL SCREEN */
        .vc-wa-missed-screen {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 14px 16px 26px;
          background: #0b141a;
          background-image: 
            radial-gradient(circle at 50% 18%, rgba(37, 211, 102, 0.08), transparent 48%),
            linear-gradient(180deg, #0e1b22 0%, #0b141a 100%);
          color: #e9edef;
          animation: vcSlideFadeIn 0.35s ease both;
          box-sizing: border-box;
          user-select: none;
        }

        .vc-wa-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 6px;
          font-size: 13.5px;
          font-weight: 600;
          color: #e9edef;
          letter-spacing: -0.2px;
        }

        .vc-wa-status-icons {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #e9edef;
        }

        .vc-wa-center-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 6px;
          margin-bottom: auto;
          padding-top: clamp(20px, 7cqw, 36px);
        }

        .vc-wa-avatar-wrap {
          width: clamp(94px, 28cqw, 114px);
          height: clamp(94px, 28cqw, 114px);
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
          background: #202c33;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: vcBonusPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .vc-wa-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vc-wa-avatar-initials {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1f2c34 0%, #2a3942 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: clamp(34px, 10cqw, 42px);
          font-weight: 700;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .vc-wa-caller-name {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: clamp(22px, 6.6cqw, 28px);
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
          line-height: 1.15;
          max-width: 90%;
        }

        .vc-wa-status-text {
          margin: 6px 0 0;
          font-size: 14.5px;
          color: #8696a0;
          font-weight: 400;
        }

        .vc-wa-auto-notice {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 22px;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(32, 44, 51, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11.5px;
          color: #aebac1;
          letter-spacing: 0.1px;
        }

        .vc-wa-auto-notice b {
          color: #25d366;
          font-weight: 700;
        }

        .vc-wa-spinner {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          border: 2px solid rgba(37, 211, 102, 0.3);
          border-top-color: #25d366;
          animation: vcSpin 0.9s linear infinite;
        }

        .vc-wa-actions-bar {
          display: flex;
          align-items: flex-start;
          justify-content: space-around;
          width: 100%;
          padding-top: 18px;
        }

        .vc-wa-action-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 90px;
          text-align: center;
        }

        .vc-wa-action-btn {
          width: clamp(52px, 15cqw, 58px);
          height: clamp(52px, 15cqw, 58px);
          border-radius: 50%;
          border: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s, filter 0.15s;
          cursor: pointer;
        }

        .vc-wa-action-btn:active {
          transform: scale(0.92);
        }

        .vc-wa-action-btn.cancel {
          background: #202c33;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }

        .vc-wa-action-btn.voice {
          background: #202c33;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }

        .vc-wa-action-btn.redial {
          background: #25d366;
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
          animation: vcAcceptBounce 1.4s ease-in-out infinite;
        }

        .vc-wa-action-label {
          margin-top: 9px;
          font-size: 11px;
          color: #8696a0;
          line-height: 1.25;
          font-weight: 500;
          letter-spacing: -0.1px;
        }

        /* STAGE 4: REDIRECT / CONFIRMATION */
        .vc-stage-redirect {
          background: var(--rp0c);
        }
        .vc-redirect-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: clamp(44px, 12cqw, 64px) 24px;
        }
        .vc-spinner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 4px solid rgba(255,255,255,.12);
          border-top-color: var(--qxdy);
          animation: vcSpin .8s linear infinite;
        }
        @keyframes vcSpin { to { transform: rotate(360deg); } }
        .vc-redirect-text {
          margin: 0;
          font-size: clamp(12.5px, 3.4cqw, 14.5px);
          font-weight: 700;
        }
        .vc-redirect-bar {
          width: 100%;
          max-width: 240px;
          height: 5px;
          border-radius: 5px;
          background: rgba(255,255,255,.1);
          overflow: hidden;
        }
        .vc-redirect-bar b {
          display: block;
          height: 100%;
          background: var(--qxdy);
          transition: width .6s ease;
        }
      `}</style>

      <div className="vc-container" style={isPreview ? { height: '100%', display: 'flex', flexDirection: 'column' } : undefined}>
        <div
          className="vc-card"
          style={
            isPreview
              ? { borderRadius: 0, boxShadow: 'none', flex: 1, display: 'flex', flexDirection: 'column' }
              : undefined
          }
        >
          {/* =========================================================
              TELA 1: CHAMADA DE VÍDEO RECEBIDA OU TELA NÃO ATENDIDA
             ========================================================= */}
          {stage === 'call' && (
            <section className={`vc-screen vc-stage-call ${missedCallState ? 'missed' : ''}`}>
              {missedCallState ? (
                <div className="vc-wa-missed-screen">
                  {/* WhatsApp Top Bar */}
                  <div className="vc-wa-top-bar">
                    <span className="vc-wa-time">{currentTimeString}</span>
                    <div className="vc-wa-status-icons">
                      <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
                        <circle cx="2" cy="8.5" r="1.5" />
                        <circle cx="6" cy="6.5" r="1.5" />
                        <circle cx="10" cy="4.5" r="1.5" />
                        <circle cx="14" cy="2.5" r="1.5" />
                      </svg>
                      <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
                        <path d="M7.5 3C5.5 3 3.7 3.8 2.4 5.1L0.6 3.3C2.4 1.5 4.8 0.5 7.5 0.5C10.2 0.5 12.6 1.5 14.4 3.3L12.6 5.1C11.3 3.8 9.5 3 7.5 3Z" />
                        <path d="M7.5 6.5C6.3 6.5 5.2 7 4.4 7.8L2.6 6C3.9 4.7 5.6 4 7.5 4C9.4 4 11.1 4.7 12.4 6L10.6 7.8C9.8 7 8.7 6.5 7.5 6.5Z" />
                        <circle cx="7.5" cy="9.5" r="1.5" />
                      </svg>
                      <svg width="24" height="11" viewBox="0 0 24 11" fill="currentColor">
                        <rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke="currentColor" fill="none" strokeWidth="1" />
                        <rect x="2.5" y="2.5" width="14" height="6" rx="1.5" fill="#25d366" />
                        <path d="M22 3.5C22.6 3.9 23 4.4 23 5.5C23 6.6 22.6 7.1 22 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* WhatsApp Center Profile */}
                  <div className="vc-wa-center-box">
                    <div className="vc-wa-avatar-wrap">
                      {avatarUrl && cfg.missed_call_avatar_mode !== 'initials' ? (
                        <img src={avatarUrl} alt={cfg.caller_name || 'Chamador'} className="vc-wa-avatar-img" />
                      ) : (
                        <div className="vc-wa-avatar-initials">
                          {getInitials(cfg.caller_name)}
                        </div>
                      )}
                    </div>

                    <h2 className="vc-wa-caller-name">{cfg.caller_name || 'Heverton Artur'}</h2>
                    <p className="vc-wa-status-text">{cfg.missed_call_status_text || 'Não atendida'}</p>

                    <div className="vc-wa-auto-notice">
                      <span className="vc-wa-spinner" />
                      <span>Conectando recado em <b>{missedCountdown}s</b>...</span>
                    </div>
                  </div>

                  {/* WhatsApp Bottom Actions */}
                  <div className="vc-wa-actions-bar">
                    <div className="vc-wa-action-col">
                      <button
                        type="button"
                        className="vc-wa-action-btn cancel"
                        onClick={() => {
                          if (missedIntervalRef.current) clearInterval(missedIntervalRef.current);
                          if (missedTimerRef.current) clearTimeout(missedTimerRef.current);
                          if (onDeclineOffer) onDeclineOffer();
                          else goToOfferStage();
                        }}
                        aria-label={cfg.missed_call_btn_cancel_text || 'Cancelar'}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <span className="vc-wa-action-label">{cfg.missed_call_btn_cancel_text || 'Cancelar'}</span>
                    </div>

                    <div className="vc-wa-action-col">
                      <button
                        type="button"
                        className="vc-wa-action-btn voice"
                        onClick={() => handleAnswerCall(true)}
                        aria-label={cfg.missed_call_btn_voice_text || 'Gravar mensagem de voz'}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </button>
                      <span className="vc-wa-action-label">{cfg.missed_call_btn_voice_text || 'Gravar mensagem de voz'}</span>
                    </div>

                    <div className="vc-wa-action-col">
                      <button
                        type="button"
                        className="vc-wa-action-btn redial"
                        onClick={() => handleAnswerCall(true)}
                        aria-label={cfg.missed_call_btn_redial_text || 'Ligar novamente'}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.51c0-.56-.45-1.01-1-1.01z" />
                        </svg>
                      </button>
                      <span className="vc-wa-action-label">{cfg.missed_call_btn_redial_text || 'Ligar novamente'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`vc-call-bg ${cfg.call_blur_avatar_bg && avatarUrl ? 'has-img' : ''}`}
                    style={
                      cfg.call_blur_avatar_bg && avatarUrl
                        ? { backgroundImage: `url("${avatarUrl}")` }
                        : undefined
                    }
                  />
                  <div className="vc-call-inner">
                    <div className="vc-call-top">
                      {cfg.call_badge_text && (
                        <span className="vc-badge-call">
                          <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24">
                            <path d="M15 10l5-3v10l-5-3" />
                            <rect height="12" rx="2" width="12" x="3" y="6" />
                          </svg>
                          {cfg.call_badge_text}
                        </span>
                      )}
                      <span className="vc-call-status">
                        {ringCount >= 10
                          ? cfg.call_status_waiting_text || 'ainda na linha...'
                          : cfg.call_status_text || 'recebida agora'}
                      </span>
                    </div>

                    <div className="vc-avatar-wrap">
                      <i className="vc-ring" />
                      <i className="vc-ring" />
                      <i className="vc-ring" />
                      <div className="vc-avatar-circle">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={cfg.caller_name || 'Avatar'} />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                    </div>

                    <h2 className="vc-caller-name">{cfg.caller_name || 'Cherminho'}</h2>

                    {cfg.caller_handle && (
                      <p className="vc-caller-handle">
                        <span>{cfg.caller_handle}</span>
                        {cfg.caller_verified && (
                          <svg viewBox="0 0 24 24">
                            <path
                              d="M12 1.5l2.6 2.2 3.4-.4 1 3.3 3 1.6-1.2 3.2 1.2 3.2-3 1.6-1 3.3-3.4-.4L12 22.5l-2.6-2.2-3.4.4-1-3.3-3-1.6 1.2-3.2L2 9.4l3-1.6 1-3.3 3.4.4z"
                              fill={cfg.caller_verified_color || '#3897f0'}
                            />
                            <path
                              d="M7.5 12.2l3 3 6-6.4"
                              fill="none"
                              stroke="#fff"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.2"
                            />
                          </svg>
                        )}
                      </p>
                    )}

                    <p className="vc-caller-greeting">
                      {visitorName ? (
                        <>
                          {cfg.call_greeting_prefix || 'quer falar com você,'} <b>{visitorName}</b>
                        </>
                      ) : (
                        cfg.call_greeting_fallback || 'quer falar com você agora'
                      )}
                    </p>

                    <div className="vc-call-actions">
                      <button
                        type="button"
                        className="vc-call-btn decline"
                        onClick={handleDeclineCall}
                        aria-label={cfg.call_decline_text || 'Recusar'}
                      >
                        <span
                          className="vc-call-btn-icon"
                          style={{
                            background: declineColor,
                            boxShadow: `0 14px 30px -10px ${declineColor}`,
                          }}
                        >
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path
                              d="M21.6 15.1c-1.2-1-2.6-1.7-4.1-2.1-.4-.1-.8 0-1.1.3l-1.4 1.6c-2.4-1.1-4.5-2.7-6.2-4.7L10.4 8.7c.3-.3.4-.7.3-1.1-.4-1.5-1.2-2.9-2.2-4.1-.3-.4-.8-.5-1.2-.3L3.9 4.8c-.4.2-.6.6-.6 1 .3 3.2 1.6 6.3 3.8 8.8 2.3 2.5 5.2 4.2 8.4 4.9.4.1.8-.1 1-.4l2.5-3.1c.3-.4.2-.9-.1-1.2z"
                              transform="rotate(135 12 12)"
                            />
                          </svg>
                        </span>
                        <span>{cfg.call_decline_text || 'Recusar'}</span>
                      </button>

                      <button
                        type="button"
                        className="vc-call-btn accept"
                        onClick={handleAnswerCall}
                        aria-label={cfg.call_accept_text || 'Atender'}
                      >
                        <span
                          className="vc-call-btn-icon"
                          style={{
                            background: acceptColor,
                            boxShadow: `0 14px 34px -8px ${acceptColor}`,
                          }}
                        >
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21.6 15.1c-1.2-1-2.6-1.7-4.1-2.1-.4-.1-.8 0-1.1.3l-1.4 1.6c-2.4-1.1-4.5-2.7-6.2-4.7L10.4 8.7c.3-.3.4-.7.3-1.1-.4-1.5-1.2-2.9-2.2-4.1-.3-.4-.8-.5-1.2-.3L3.9 4.8c-.4.2-.6.6-.6 1 .3 3.2 1.6 6.3 3.8 8.8 2.3 2.5 5.2 4.2 8.4 4.9.4.1.8-.1 1-.4l2.5-3.1c.3-.4.2-.9-.1-1.2z" />
                          </svg>
                        </span>
                        <span>{cfg.call_accept_text || 'Atender'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* =========================================================
              TELA 2: VÍDEO DA CHAMADA EM ANDAMENTO
             ========================================================= */}
          {stage === 'video' && (
            <section className="vc-screen vc-stage-video">
              <div className="vc-video-frame">
                {(isMissedCallVideo && cfg.missed_call_video_url ? cfg.missed_call_video_url : videoUrl) ? (
                  <video
                    ref={videoRef}
                    className="vc-video-el"
                    src={isMissedCallVideo && cfg.missed_call_video_url ? cfg.missed_call_video_url : videoUrl}
                    playsInline
                    webkit-playsinline="webkit-playsinline"
                    style={{ objectFit: cfg.video_object_fit === 'contain' ? 'contain' : 'cover' }}
                    playsInline
                    webkit-playsinline="webkit-playsinline"
                    style={{ objectFit: cfg.video_object_fit === 'contain' ? 'contain' : 'cover' }}
                    onEnded={() => handleEndVideoCall(true)}
                    onClick={() => {
                      const vid = videoRef.current;
                      if (!vid) return;
                      if (centerPromptMode === 'sound') {
                        vid.muted = false;
                        setIsMuted(false);
                        setCenterPromptMode(null);
                        vid.play().catch(() => {});
                      } else if (vid.paused) {
                        vid.play().catch(() => {});
                        setCenterPromptMode(null);
                      } else {
                        vid.pause();
                        setCenterPromptMode('play');
                      }
                    }}
                  />
                ) : (
                  <div
                    className="vc-video-el"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px',
                      background: '#050203',
                    }}
                  >
                    <div className="vc-avatar-wrap" style={{ margin: '0 0 14px', width: '96px' }}>
                      <div className="vc-avatar-circle" style={{ animation: 'none' }}>
                        {avatarUrl ? <img src={avatarUrl} alt={cfg.caller_name} /> : <span>{initials}</span>}
                      </div>
                    </div>
                    <strong style={{ fontSize: '15px' }}>{cfg.caller_name || 'Cherminho'}</strong>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.55)', marginTop: '4px' }}>
                      {isPreview ? 'Envie ou cole a URL do vídeo vertical na aba Mídia' : 'Em chamada de vídeo...'}
                    </span>
                  </div>
                )}

                {cfg.video_show_header && (
                  <div className="vc-video-topbar">
                    <div className="vc-video-pill">
                      <span
                        className="vc-live-dot"
                        style={{
                          background: cfg.video_live_dot_color || '#25d366',
                          boxShadow: `0 0 0 3px ${(cfg.video_live_dot_color || '#25d366')}4d`,
                        }}
                      />
                      <b>{cfg.caller_name || 'Cherminho'}</b>
                      <span className="timer">{formatMMSS(callSeconds)}</span>
                    </div>
                  </div>
                )}

                {centerPromptMode && (
                  <button
                    type="button"
                    className="vc-center-prompt"
                    onClick={() => {
                      const vid = videoRef.current;
                      if (!vid) return;
                      vid.muted = false;
                      setIsMuted(false);
                      setCenterPromptMode(null);
                      vid.play().catch(() => {});
                    }}
                  >
                    <span className="vc-center-prompt-circle">
                      {centerPromptMode === 'sound' ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 5L6 9H2v6h4l5 4z" />
                          <path d="M15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14" />
                        </svg>
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </span>
                    <span>
                      {centerPromptMode === 'sound'
                        ? cfg.video_unmute_text || 'TOQUE PARA ATIVAR O SOM'
                        : cfg.video_play_text || 'TOQUE PARA OUVIR'}
                    </span>
                  </button>
                )}

                <div className={`vc-video-cta-overlay ${videoCtaVisible ? 'visible' : ''}`}>
                  {cfg.video_cta_badge && (
                    <span className="vc-video-cta-badge">{cfg.video_cta_badge}</span>
                  )}
                  <button
                    type="button"
                    className="vc-main-cta"
                    style={{ marginTop: 0 }}
                    onClick={() => {
                      if (cfg.video_cta_action === 'direct_checkout') {
                        triggerFinalCheckout();
                      } else {
                        goToOfferStage();
                      }
                    }}
                  >
                    <span className="vc-cta-shine" />
                    <span>{cfg.video_cta_text || 'PARTICIPAR AGORA'}</span>
                    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>

                {cfg.video_show_controls && (
                  <div className="vc-video-controls">
                    <button
                      type="button"
                      className="vc-ctrl-btn"
                      aria-label="Som"
                      onClick={() => {
                        const vid = videoRef.current;
                        if (vid) {
                          vid.muted = !vid.muted;
                          setIsMuted(vid.muted);
                          if (!vid.muted && centerPromptMode === 'sound') setCenterPromptMode(null);
                        } else {
                          setIsMuted((m) => !m);
                        }
                      }}
                    >
                      {!isMuted ? (
                        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path d="M11 5L6 9H2v6h4l5 4z" />
                          <path d="M15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14" />
                        </svg>
                      ) : (
                        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path d="M11 5L6 9H2v6h4l5 4z" />
                          <path d="M23 9l-6 6M17 9l6 6" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      className="vc-ctrl-btn hangup"
                      aria-label="Encerrar"
                      onClick={() => handleEndVideoCall(false)}
                    >
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M21.6 15.1c-1.2-1-2.6-1.7-4.1-2.1-.4-.1-.8 0-1.1.3l-1.4 1.6c-2.4-1.1-4.5-2.7-6.2-4.7L10.4 8.7c.3-.3.4-.7.3-1.1-.4-1.5-1.2-2.9-2.2-4.1-.3-.4-.8-.5-1.2-.3L3.9 4.8c-.4.2-.6.6-.6 1 .3 3.2 1.6 6.3 3.8 8.8 2.3 2.5 5.2 4.2 8.4 4.9.4.1.8-.1 1-.4l2.5-3.1c.3-.4.2-.9-.1-1.2z"
                          transform="rotate(135 12 12)"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="vc-ctrl-btn"
                      aria-label="Ver a oferta"
                      onClick={goToOfferStage}
                    >
                      <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24">
                        <path d="M5 4l10 8-10 8z" />
                        <path d="M19 4v16" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className={`vc-ended-overlay ${callEndedOverlay ? 'visible' : ''}`}>
                  <span>{cfg.video_ended_text || 'Chamada encerrada'}</span>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              TELA 3: OFERTA ESPECIAL DE BÔNUS (PÓS-CHAMADA)
             ========================================================= */}
          {stage === 'offer' && (
            <section className="vc-screen vc-stage-offer">
              <div className="vc-offer-inner">
                {cfg.offer_top_badge && (
                  <span className="vc-offer-top-badge">
                    <i />
                    <span>{cfg.offer_top_badge}</span>
                  </span>
                )}

                <h3 className="vc-offer-headline">
                  {cfg.offer_custom_headline ? (
                    cfg.offer_custom_headline
                  ) : (
                    <>
                      {visitorName ? `${visitorName}, ` : ''}
                      {cfg.offer_headline_prefix || 'achou'}{' '}
                      <span>{cfg.offer_normal_prize || 'a moto'}</span>
                      <br />
                      {cfg.offer_headline_mid || 'comprando'}{' '}
                      <em>{cfg.offer_headline_highlight || 'por aqui?'}</em>
                    </>
                  )}
                </h3>

                <div className="vc-bonus-card">
                  <span className="vc-bonus-line">
                    {cfg.offer_card_top_text || 'em vez de levar'}{' '}
                    <s>
                      {cfg.offer_card_strike_prefix ? `${cfg.offer_card_strike_prefix} ` : ''}
                      {cfg.offer_normal_prize || 'a moto'}
                    </s>
                    {cfg.offer_card_top_suffix || ', você leva'}
                  </span>

                  <span className="vc-bonus-giant">{renderBonusFormatted()}</span>

                  {cfg.offer_min_purchase && (
                    <span className="vc-bonus-line">
                      <b>{cfg.offer_min_purchase}</b>
                    </span>
                  )}
                </div>

                {cfg.offer_disclaimer_text && (
                  <p className="vc-offer-disclaimer">{cfg.offer_disclaimer_text}</p>
                )}

                <button
                  type="button"
                  className="vc-main-cta"
                  onClick={triggerFinalCheckout}
                >
                  <span className="vc-cta-shine" />
                  <span>{finalCtaText}</span>
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>

                <div className="vc-offer-footer">
                  {timerEnabled && (
                    <span className={`vc-offer-timer ${isUrgentTimer ? 'urgent' : ''}`}>
                      <i />
                      <span>
                        {isUrgentTimer
                          ? cfg.offer_timer_urgent_label || 'últimos segundos'
                          : cfg.offer_timer_label || 'acaba em'}
                      </span>{' '}
                      <b>{formatMMSS(offerTimeLeft)}</b>
                    </span>
                  )}

                  {cfg.offer_show_replay_btn && (hasWatchedCall || isPreview) && (
                    <button
                      type="button"
                      className="vc-link-btn"
                      onClick={handleAnswerCall}
                    >
                      {cfg.offer_replay_btn_text || 'rever a chamada'}
                    </button>
                  )}

                  {cfg.offer_show_decline_btn && (
                    <button
                      type="button"
                      className="vc-link-btn"
                      onClick={() => {
                        if (cfg.offer_decline_url) {
                          window.location.href = cfg.offer_decline_url;
                        } else if (onDeclineOffer) {
                          onDeclineOffer();
                        }
                      }}
                    >
                      {cfg.offer_decline_btn_text || 'mostrar meus números'}
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              TELA 4: CONFIRMAÇÃO / REDIRECIONANDO
             ========================================================= */}
          {stage === 'redirect' && (
            <section className="vc-screen vc-stage-redirect">
              <div className="vc-redirect-inner">
                <span className="vc-spinner" />
                <p className="vc-redirect-text">{redirectProgress.text}</p>
                <div className="vc-redirect-bar">
                  <b style={{ width: `${redirectProgress.pct}%` }} />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

