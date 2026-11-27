(function() {
    // UpsellFlow Tracker (Otimizado - Fase 03: EVT-01/EVT-03)
    const endpoint = '/api/v1/events';
    const sessionToken = window.UF_SESSION_TOKEN || null;
    const levelId = window.UF_LEVEL_ID || null;
    
    let scrollLogged = {
        '25': false,
        '50': false,
        '75': false,
        '100': false
    };

    function sendEvent(type, data = {}) {
        const payload = JSON.stringify({
            event_type: type,
            token: sessionToken,
            level_id: levelId,
            event_data: data
        });

        // Tentar sendBeacon se a página estiver descarregando, senão fetch padrão
        if (navigator.sendBeacon && (document.visibilityState === 'hidden' || type === 'page_exit')) {
            try {
                const blob = new Blob([payload], { type: 'application/json' });
                navigator.sendBeacon(endpoint, blob);
                return;
            } catch (e) {}
        }

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        }).catch(function(e) {
            // Silencioso em produção para não poluir console do visitante
        });
    }

    // Scroll Tracking com listener passivo (melhora Web Vitals e suavidade de rolagem no mobile)
    let scrollTicking = false;
    window.addEventListener('scroll', function() {
        if (!scrollTicking) {
            window.requestAnimationFrame(function() {
                const totalHeight = document.body.scrollHeight - window.innerHeight;
                if (totalHeight > 0) {
                    const scrollPercent = Math.round((window.scrollY / totalHeight) * 100);
                    
                    if (scrollPercent >= 25 && !scrollLogged['25']) { scrollLogged['25'] = true; sendEvent('scroll_25'); }
                    if (scrollPercent >= 50 && !scrollLogged['50']) { scrollLogged['50'] = true; sendEvent('scroll_50'); }
                    if (scrollPercent >= 75 && !scrollLogged['75']) { scrollLogged['75'] = true; sendEvent('scroll_75'); }
                    if (scrollPercent >= 98 && !scrollLogged['100']) { scrollLogged['100'] = true; sendEvent('scroll_100'); }
                }
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    // Time on page (30, 60, 120, 300 segundos)
    let seconds = 0;
    const timerInterval = setInterval(function() {
        seconds += 10;
        if (seconds === 30 || seconds === 60 || seconds === 120 || seconds === 300) {
            sendEvent('time_on_page', { seconds: seconds });
        }
        if (seconds > 300) {
            clearInterval(timerInterval);
        }
    }, 10000);

})();
