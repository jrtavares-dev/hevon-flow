'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { DEFAULT_PRESELL_BUYERS } from '@/lib/constants/presellBuyers';

const FAKE_BUYERS = DEFAULT_PRESELL_BUYERS;

const GRADIENTS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#06b6d4',
  '#14b8a6',
  '#6366f1',
];

export default function PresellPageView({ presell, buttons: passedButtons = [], variation = 'A', queryParams = {} }) {
  const [socialToast, setSocialToast] = useState(null);
  const [toastHiding, setToastHiding] = useState(false);
  const activeTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const isPausedRef = useRef(false);
  const dismissToastRef = useRef(null);
  const [pitchDelayPassed, setPitchDelayPassed] = useState(!presell.pitch_delay_enabled);
  const [unmuted, setUnmuted] = useState(false);
  const videoIframeRef = useRef(null);
  const mp4VideoRef = useRef(null);

  // Marketing Pixels Script Injection
  useEffect(() => {
    // 1. Meta Pixel
    if (presell.meta_pixel_id && typeof window !== 'undefined' && !window.fbq) {
      /* eslint-disable */
      (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', presell.meta_pixel_id);
      window.fbq('track', 'PageView');
      /* eslint-enable */
    }

    // 2. Google Analytics 4
    if (presell.ga4_measurement_id && typeof window !== 'undefined' && !window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${presell.ga4_measurement_id}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', presell.ga4_measurement_id);
    }

    // 3. TikTok Pixel
    if (presell.tiktok_pixel_id && typeof window !== 'undefined' && !window.ttq) {
      /* eslint-disable */
      !(function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page',
          'track',
          'identify',
          'instances',
          'debug',
          'on',
          'off',
          'once',
          'ready',
          'alias',
          'group',
          'enableCookie',
          'disableCookie',
        ];
        ttq.setAndDefer = function (t, e) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
          return e;
        };
        ttq.load = function (e, n) {
          var r = 'https://analytics.tiktok.com/i18n/pixel/events.js',
            o = n && n.partner;
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = r;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          var a = document.createElement('script');
          a.type = 'text/javascript';
          a.async = !0;
          a.src = r + '?sdkid=' + e + '&lib=' + t;
          var c = document.getElementsByTagName('script')[0];
          c.parentNode.insertBefore(a, c);
        };
        ttq.load(presell.tiktok_pixel_id);
        ttq.page();
      })(window, document, 'ttq');
      /* eslint-enable */
    }
  }, [presell.meta_pixel_id, presell.ga4_measurement_id, presell.tiktok_pixel_id]);

  // Pitch Delay Engine with localStorage resume
  useEffect(() => {
    if (!presell.pitch_delay_enabled || !presell.pitch_delay_seconds) {
      setPitchDelayPassed(true);
      return;
    }

    const storageKey = `ps_pitch_revealed_${presell.id}`;
    if (presell.pitch_delay_resume && typeof window !== 'undefined' && localStorage.getItem(storageKey) === '1') {
      setPitchDelayPassed(true);
      return;
    }

    const timer = setTimeout(() => {
      setPitchDelayPassed(true);
      if (presell.pitch_delay_resume && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, '1');
        } catch {}
      }
    }, Number(presell.pitch_delay_seconds || 0) * 1000);

    return () => clearTimeout(timer);
  }, [presell]);

  // Unmute Handler for Video VSL
  const handleUnmute = () => {
    setUnmuted(true);

    if (mp4VideoRef.current) {
      mp4VideoRef.current.muted = false;
      mp4VideoRef.current.currentTime = 0;
      mp4VideoRef.current.play().catch(() => {});
    }

    if (videoIframeRef.current) {
      try {
        videoIframeRef.current.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
        videoIframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        videoIframeRef.current.contentWindow.postMessage('{"method":"setVolume","value":"1"}', '*');
      } catch {}
    }
  };

  // Social Proof Toasts Loop
  useEffect(() => {
    if (!presell.social_proof_enabled) return;

    let intervalMin = 6000;
    let intervalMax = 11000;
    if (presell.social_proof_interval === 'fast') {
      intervalMin = 4000;
      intervalMax = 7000;
    } else if (presell.social_proof_interval === 'slow') {
      intervalMin = 12000;
      intervalMax = 20000;
    }

    const dismissToast = () => {
      setToastHiding(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setSocialToast(null);
        setToastHiding(false);
        const nextDelay = Math.floor(Math.random() * (intervalMax - intervalMin + 1)) + intervalMin;
        activeTimerRef.current = setTimeout(showToast, nextDelay);
      }, 360);
    };

    dismissToastRef.current = dismissToast;

    const showToast = () => {
      const buyersList = Array.isArray(presell.social_proof_buyers) && presell.social_proof_buyers.length > 0
        ? presell.social_proof_buyers
        : FAKE_BUYERS;
      const randomBuyer = buyersList[Math.floor(Math.random() * buyersList.length)] || FAKE_BUYERS[0];
      const randomGrad = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
      const initials = (randomBuyer.name || 'C')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const timeOptions = ['agora mesmo', 'há 35 segundos', 'há 1 min', 'há 2 min'];
      const randomTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];

      setToastHiding(false);
      setSocialToast({
        name: randomBuyer.name,
        city: randomBuyer.city,
        initials,
        grad: randomGrad,
        time: randomTime,
      });

      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      activeTimerRef.current = setTimeout(dismissToast, 4800);
    };

    activeTimerRef.current = setTimeout(showToast, 2200);

    return () => {
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [presell.social_proof_enabled, presell.social_proof_interval]);

  const handleToastMouseEnter = () => {
    isPausedRef.current = true;
    if (activeTimerRef.current) {
      clearTimeout(activeTimerRef.current);
    }
  };

  const handleToastMouseLeave = () => {
    if (isPausedRef.current) {
      isPausedRef.current = false;
      if (!toastHiding && socialToast) {
        if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
        activeTimerRef.current = setTimeout(() => {
          dismissToastRef.current?.();
        }, 1800);
      }
    }
  };

  const handleCloseToast = (e) => {
    if (e) e.stopPropagation();
    if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
    dismissToastRef.current?.();
  };

  // CTA Click Pixel Trigger
  const handleCtaClick = (label = 'CTA') => {
    if (typeof window !== 'undefined') {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', { content_name: label });
        window.fbq('track', 'Contact');
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'generate_lead', {
          event_category: 'Presell',
          event_label: label,
        });
      }
      if (typeof window.ttq === 'object' && typeof window.ttq.track === 'function') {
        window.ttq.track('ClickButton');
      }
    }
  };

  const styles = presell.page_styles || {};
  const buttons = passedButtons.length > 0 ? passedButtons : (presell.buttons_list || []);

  const avatarSrc = presell.avatar_url || '/uploads/presells/cherminho_avatar.jpg';
  const overlayOpacity = (presell.bg_overlay_opacity ?? 75) / 100;
  const accentColor = presell.accent_color || '#22c55e';
  const glowColor = presell.glow_color || '#22c55e';

  // Video embed helper
  const renderVideoPlayer = () => {
    const vType = presell.video_type;
    const vUrl = presell.video_url?.trim() || '';
    if (!vType || vType === 'none' || !vUrl) return null;

    if (vType === 'youtube') {
      let ytId = vUrl;
      const match = vUrl.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
      if (match) ytId = match[1];

      return (
        <iframe
          ref={videoIframeRef}
          src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${unmuted ? 0 : 1}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      );
    }

    if (vType === 'vimeo') {
      let vimeoId = vUrl;
      const match = vUrl.match(/(?:player\.)?vimeo\.com\/(?:video\/)?([0-9]+)/);
      if (match) vimeoId = match[1];

      return (
        <iframe
          ref={videoIframeRef}
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=${unmuted ? 0 : 1}&background=1&playsinline=1`}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      );
    }

    if (vType === 'mp4') {
      return (
        <video
          ref={mp4VideoRef}
          src={vUrl}
          autoPlay
          muted={!unmuted}
          playsInline
          loop
          controlsList="nodownload nofullscreen noremoteplayback"
          onContextMenu={(e) => e.preventDefault()}
        />
      );
    }

    return <div dangerouslySetInnerHTML={{ __html: vUrl }} />;
  };

  return (
    <>
      <style>{`
        :root {
          --accent-color: ${accentColor};
          --glow-color: ${glowColor};
          --button-color: ${presell.button_color || '#22c55e'};
          --button-text-color: ${presell.button_text_color || '#ffffff'};
          --overlay-opacity: ${overlayOpacity};
        }
        html, body {
          width: 100%;
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #050807;
          background: #050807;
          color: #ffffff;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }
        .bg-wallpaper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 1;
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
        }
        .bg-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 2;
          pointer-events: none;
        }
        .bg-grid {
          position: fixed;
          inset: 0;
          z-index: 2;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }
        .presell-wrapper {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px 50px 20px;
          max-width: 460px;
          margin: 0 auto;
          text-align: center;
        }
        .badge-beam-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1.5px;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 22px;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
        }
        .badge-beam-wrapper::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 340px;
          height: 340px;
          margin-top: -170px;
          margin-left: -170px;
          background: conic-gradient(from 0deg, transparent 0% 55%, var(--beam-color, #22c55e) 82%, #ffffff 97%, var(--beam-color, #22c55e) 100%);
          animation: spinRing 3.2s linear infinite;
          z-index: 1;
          pointer-events: none;
        }
        .badge-pill {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          border-radius: 999px;
          background: rgba(8, 14, 11, 0.94);
          backdrop-filter: blur(12px);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: blinkDot 1.8s infinite;
        }
        @keyframes blinkDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
        .av-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .av-wrapper::after {
          content: '';
          position: absolute;
          inset: -3.5px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.12);
          z-index: 1;
          pointer-events: none;
        }
        .av-wrapper::before {
          content: '';
          position: absolute;
          inset: -4.5px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0% 55%, var(--glow-color, #22c55e) 82%, #ffffff 97%, var(--glow-color, #22c55e) 100%);
          animation: spinRing 2.8s linear infinite;
          filter: drop-shadow(0 0 12px var(--glow-color, #22c55e)) drop-shadow(0 0 4px #ffffff);
          z-index: 1;
        }
        .av-wrapper img {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          z-index: 2;
          border: 3.5px solid #050807;
          background-color: #111a14;
        }
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .headline-title {
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.6);
          word-break: break-word;
        }
        .accent-divider {
          width: 44px;
          height: 3px;
          border-radius: 2px;
          margin: 12px auto 14px auto;
        }
        .subheadline-title {
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 22px;
          line-height: 1.4;
          word-break: break-word;
        }
        .video-container {
          width: 100%;
          position: relative;
          margin-bottom: 24px;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #000000;
        }
        .video-aspect-ratio {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
        }
        .video-aspect-ratio iframe,
        .video-aspect-ratio video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
          object-fit: cover;
        }
        .unmute-banner {
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0, 0, 0, 0.85);
          border: 1.5px solid var(--accent-color, #22c55e);
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(34, 197, 94, 0.4);
          white-space: nowrap;
        }
        .buttons-stack {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 28px;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .buttons-stack.delayed-hidden {
          display: none !important;
          opacity: 0;
        }
        .buttons-stack.delayed-visible {
          display: flex !important;
        }
        .presell-btn {
          width: 100%;
          min-height: 64px;
          display: flex;
          align-items: center;
          border-radius: 18px;
          text-decoration: none;
          cursor: pointer;
          overflow: hidden;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .presell-btn:active {
          transform: scale(0.97);
        }
        .btn-type-primary {
          box-shadow: 0 10px 32px rgba(0, 0, 0, 0.35);
        }
        .btn-type-primary::after {
          display: none;
        }
        .btn-type-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(10px);
        }
        .btn-type-outline {
          background: transparent;
          color: #ffffff;
          border: 1.5px solid var(--btn-glow, #22c55e);
        }
        .ps-icon-box {
          width: 54px;
          align-self: stretch;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.16);
          flex-shrink: 0;
          color: inherit;
        }
        .ps-icon-box::before,
        .ps-icon-box::after,
        .bi-box::before,
        .bi-box::after {
          display: none !important;
          content: none !important;
        }
        .btn-type-secondary .ps-icon-box {
          background: rgba(255, 255, 255, 0.08);
        }
        .ps-text-box {
          flex: 1;
          min-width: 0;
          text-align: left;
          padding: 12px 14px;
          color: inherit;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .ps-text-box b {
          display: block;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.015em;
          text-transform: uppercase;
          line-height: 1.22;
          word-break: break-word;
        }
        .ps-text-box small {
          display: block;
          font-size: 11px;
          font-weight: 700;
          opacity: 0.9;
          margin-top: 3px;
          line-height: 1.25;
        }
        .ps-arrow-box {
          width: 32px;
          height: 32px;
          margin-right: 14px;
          margin-left: 4px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.16);
          color: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          animation: arrowNudge 1.6s ease-in-out infinite;
        }
        .ps-arrow-box::before,
        .ps-arrow-box::after {
          display: none !important;
          content: none !important;
        }
        @keyframes arrowNudge {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        .anim-pulse {
          animation: dynamicButtonPulse 2.1s ease-out infinite;
        }
        @keyframes dynamicButtonPulse {
          0% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 0 var(--btn-glow); }
          70% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 14px transparent; }
          100% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 0 transparent; }
        }
        .anim-glow {
          animation: dynamicButtonGlow 2s infinite alternate;
        }
        @keyframes dynamicButtonGlow {
          0% { box-shadow: 0 0 10px var(--btn-glow); }
          100% { box-shadow: 0 0 26px var(--btn-glow); }
        }
        .anim-bounce {
          animation: buttonBounce 2s infinite;
        }
        @keyframes buttonBounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
          60% { transform: translateY(-3px); }
        }
        .footer-tagline {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.3);
          text-align: center;
          line-height: 1.4;
        }
        .sp-toast-container {
          position: fixed;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sp-pos-bottom-left { bottom: 24px; left: 24px; }
        .sp-pos-bottom-right { bottom: 24px; right: 24px; }
        .sp-toast-card {
          pointer-events: auto;
          width: 325px;
          max-width: 92vw;
          background: rgba(10, 15, 20, 0.92);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-left: 4px solid var(--accent-color, #22c55e);
          border-radius: 14px;
          padding: 12px 14px 14px 14px;
          box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.75), 0 0 20px rgba(34, 197, 94, 0.12);
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
          user-select: none;
        }
        .sp-toast-card.sp-active {
          animation: spToastEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .sp-toast-card.sp-hiding {
          animation: spToastExit 0.35s ease-in forwards;
        }
        @keyframes spToastEnter {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes spToastExit {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(18px) scale(0.94);
          }
        }
        .sp-avatar-box {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.15);
        }
        .sp-verified-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #10b981;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          border: 2px solid #0d1117;
        }
        .sp-content-box { flex: 1; min-width: 0; text-align: left; }
        .sp-top-meta { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 2px; }
        .sp-user-name { font-size: 13px; font-weight: 800; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sp-time-ago { font-size: 10px; font-weight: 600; color: #94a3b8; }
        .sp-action-text { font-size: 12px; font-weight: 500; color: #cbd5e1; line-height: 1.35; margin-top: 1px; }
        .sp-action-text b { color: #4ade80; font-weight: 700; }
        .sp-location-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: #94a3b8; margin-top: 3px; font-weight: 600; }
        .sp-live-pulse-dot { width: 6px; height: 6px; border-radius: 50%; background-color: #22c55e; box-shadow: 0 0 8px #22c55e; display: inline-block; }
        .sp-btn-close { position: absolute; top: 6px; right: 8px; background: transparent; border: none; color: #64748b; font-size: 16px; cursor: pointer; }
        .sp-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: var(--accent-color, #22c55e);
          width: 100%;
          transform-origin: left;
          border-radius: 0 0 0 14px;
          animation: spProgressBarCountdown 4.8s linear forwards;
        }
        .sp-toast-container:hover .sp-progress-bar {
          animation-play-state: paused;
        }
        @keyframes spProgressBarCountdown {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
      {/* Background Wallpaper */}
      {presell.background_url && (
        <div
          className="bg-wallpaper"
          style={{ backgroundImage: `url('${presell.background_url}')` }}
        ></div>
      )}

      {/* Vignette Overlay */}
      <div
        className="bg-overlay"
        style={{
          background: `rgba(5, 8, 7, ${overlayOpacity})`,
        }}
      ></div>

      {/* Subtle Grid */}
      <div className="bg-grid"></div>

      {/* Presell Main Container */}
      <main className="presell-wrapper">
        {/* Animated Badge */}
        {presell.badge_text && (
          <div
            className="badge-beam-wrapper"
            style={{
              '--beam-color': styles.badge_text_color || accentColor,
            }}
          >
            <div
              className="badge-pill"
              style={{
                background: styles.badge_bg_color || 'rgba(8, 14, 11, 0.94)',
                color: styles.badge_text_color || accentColor,
                fontSize: styles.badge_font_size || '10px',
              }}
            >
              <span
                className="badge-dot"
                style={{
                  backgroundColor: styles.badge_text_color || accentColor,
                  boxShadow: `0 0 10px ${styles.badge_text_color || accentColor}`,
                }}
              ></span>
              <span>{presell.badge_text}</span>
            </div>
          </div>
        )}

        {/* Spinning Gradient Glowing Avatar */}
        <div
          className="av-wrapper"
          style={{
            '--glow-color': glowColor,
          }}
        >
          <img
            src={avatarSrc}
            alt={presell.name}
            onError={(e) => {
              e.currentTarget.src = '/uploads/presells/cherminho_avatar.jpg';
            }}
          />
        </div>

        {/* Headline */}
        <h1
          className="headline-title"
          style={{
            color: styles.headline_color || '#ffffff',
            fontSize: styles.headline_font_size || '30px',
          }}
        >
          {presell.headline || presell.name}
        </h1>

        {/* Accent Divider */}
        <div
          className="accent-divider"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        ></div>

        {/* Subheadline */}
        {presell.subheadline && (
          <div
            className="subheadline-title"
            style={{
              color: styles.subheadline_color || '#94a3b8',
              fontSize: styles.subheadline_font_size || '12px',
            }}
          >
            {presell.subheadline}
          </div>
        )}

        {/* VSL Video Player */}
        {presell.video_type && presell.video_type !== 'none' && (
          <div className="video-container" id="presellVideoContainer">
            {Boolean(presell.video_sound_banner) && !unmuted && (
              <div
                className="unmute-banner"
                style={{ borderColor: accentColor }}
                onClick={handleUnmute}
              >
                <Volume2 size={16} className="me-1" style={{ color: accentColor, verticalAlign: 'middle', display: 'inline-block' }} />
                <span>SEU VÍDEO JÁ COMEÇOU! <strong>CLIQUE PARA OUVIR</strong></span>
              </div>
            )}
            <div className="video-aspect-ratio">{renderVideoPlayer()}</div>
          </div>
        )}

        {/* Multi-Button Stack with Pitch Delay */}
        <div
          className={`buttons-stack ${
            presell.pitch_delay_enabled && !pitchDelayPassed ? 'delayed-hidden' : 'delayed-visible'
          }`}
          id="presellButtonsStack"
        >
          {buttons
            .filter((btn) => !btn.hidden && !btn.is_hidden && btn.visible !== false)
            .map((btn, idx) => {
            const btnUrl = btn.track_url || `/p/${presell.slug}/go?btn=${idx}&v=${variation}`;

            let iconSvg = (
              <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.364 2.76 1.057 3.96L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
              </svg>
            );

            if (btn.icon === 'telegram') {
              iconSvg = (
                <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09"/>
                </svg>
              );
            } else if (btn.icon === 'instagram') {
              iconSvg = (
                <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                </svg>
              );
            } else if (btn.icon === 'youtube') {
              iconSvg = (
                <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 4.669v6.662l5.8-3.331z"/>
                </svg>
              );
            } else if (btn.icon === 'cart') {
              iconSvg = (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                </svg>
              );
            } else if (btn.icon === 'star') {
              iconSvg = (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>
              );
            } else if (btn.icon === 'globe') {
              iconSvg = (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.67A6.96 6.96 0 0 0 1 8c0 .34.028.674.08 1h2.14c-.174-.782-.282-1.623-.312-2.5M3.508 10h-2.14a7 7 0 0 0 1.887 2.467c-.244-.303-.44-.616-.597-.933A9.3 9.3 0 0 1 3.508 10m1.637 2h-2.35a7 7 0 0 0 3.013 1.923 8 8 0 0 1-.663-1.923M7.5 14.923V12h-2.355c.18.783.47 1.458.847 1.855.552 1.035 1.217 1.651 1.887 1.855m1-1.855c.377-.397.667-1.072.847-1.855H8.5v2.923c.67-.204 1.335-.82 1.887-1.855m1.508-2.068a8 8 0 0 1-.663 1.923h2.35a7 7 0 0 0 3.013-1.923zM12.492 10a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933 7.03 7.03 0 0 0 3.073-2.472zm.582-3.5c-.03.877-.138 1.718-.312 2.5h2.14c.052-.326.08-.66.08-1s-.028-.674-.08-1h-2.14c.174.782.282 1.623.312 2.5m-.582-2.5h2.14a7.03 7.03 0 0 0-3.073-2.472c.244.303.44.616.597.933.24.475.46 1.002.64 1.539m-1.637-2h2.35a7 7 0 0 0-3.013-1.923 8 8 0 0 1 .663 1.923M8.5 1.077V4h2.355c-.18-.783-.47-1.458-.847-1.855C9.458 1.11 8.793.494 8.5 1.077M7.5 5H4.177c-.17.78-.27 1.62-.294 2.5h3.617zm0 3.5H3.883c.024.88.124 1.72.294 2.5H7.5zm1 2.5h3.323c.17-.78.27-1.62.294-2.5H8.5zm0-3.5h3.617c-.024-.88-.124-1.72-.294-2.5H8.5z"/>
                </svg>
              );
            }

            const animClass =
              btn.animation === 'pulse'
                ? 'anim-pulse'
                : btn.animation === 'glow'
                ? 'anim-glow'
                : btn.animation === 'bounce'
                ? 'anim-bounce'
                : '';

            const typeClass =
              btn.type === 'secondary'
                ? 'btn-type-secondary'
                : btn.type === 'outline'
                ? 'btn-type-outline'
                : 'btn-type-primary';

            const btnColor = btn.bg_color || presell.button_color || '#22c55e';
            const btnTextColor = btn.text_color || presell.button_text_color || '#000000';

            return (
              <a
                key={idx}
                href={btnUrl}
                className={`presell-btn ${typeClass} ${animClass}`}
                style={{
                  '--btn-glow': btnColor,
                  background: btn.type === 'primary' ? btnColor : undefined,
                  color: btnTextColor,
                }}
                onClick={() => handleCtaClick(btn.main_text)}
              >
                <div className="ps-icon-box" style={{ color: 'inherit' }}>
                  {iconSvg}
                </div>
                <div className="ps-text-box" style={{ color: 'inherit' }}>
                  <b
                    style={{
                      fontSize: btn.main_text_size || '15px',
                      color: 'inherit',
                    }}
                  >
                    {btn.main_text || 'ENTRAR NA COMUNIDADE'}
                  </b>
                  {btn.sub_text && (
                    <small
                      style={{
                        fontSize: btn.sub_text_size || '11px',
                        color: btn.sub_text_color || 'inherit',
                      }}
                    >
                      {btn.sub_text}
                    </small>
                  )}
                </div>
                <div className="ps-arrow-box" style={{ color: 'inherit' }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                  </svg>
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer Tagline */}
        {presell.footer_text && (
          <footer
            className="footer-tagline"
            style={{
              fontSize: styles.footer_font_size || '11px',
              color: styles.footer_text_color || '#64748b',
            }}
          >
            {presell.footer_text}
          </footer>
        )}
      </main>

      {/* Floating Social Proof Toast */}
      {socialToast && (
        <div
          id="spToastContainer"
          className={`sp-toast-container ${presell.social_proof_position === 'bottom-right' ? 'sp-pos-bottom-right' : 'sp-pos-bottom-left'}`}
          aria-live="polite"
          onMouseEnter={handleToastMouseEnter}
          onMouseLeave={handleToastMouseLeave}
        >
          <div
            className={`sp-toast-card ${toastHiding ? 'sp-hiding' : 'sp-active'}`}
            key={`${socialToast.name}-${socialToast.time}`}
          >
            <button
              type="button"
              className="sp-btn-close"
              title="Fechar"
              onClick={handleCloseToast}
            >
              &times;
            </button>
            <div
              className="sp-avatar-box"
              style={{
                background: socialToast.grad,
              }}
            >
              <span>{socialToast.initials}</span>
              <span className="sp-verified-badge" title="Compra Verificada">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z" />
                </svg>
              </span>
            </div>
            <div className="sp-content-box">
              <div className="sp-top-meta">
                <span className="sp-user-name">{socialToast.name}</span>
                <span className="sp-time-ago">{socialToast.time}</span>
              </div>
              <div className="sp-action-text">
                <span style={{ color: '#4ade80', fontWeight: 700 }}>
                  {(presell.social_proof_text || 'acabou de comprar')
                    .replace('{name}', '')
                    .replace('de {city}', '')
                    .replace('{city}', '')
                    .trim() || 'acabou de comprar'}
                </span>
              </div>
              <div className="sp-location-tag">
                <span className="sp-live-pulse-dot"></span>
                <span>{socialToast.city}</span>
              </div>
            </div>
            <div className="sp-progress-bar" key={`bar-${socialToast.name}-${socialToast.time}`}></div>
          </div>
        </div>
      )}
    </>
  );
}
