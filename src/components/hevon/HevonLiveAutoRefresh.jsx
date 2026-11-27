'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Pause, Play } from 'lucide-react';

function getBrazilClockHMS() {
  try {
    return new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}

/**
 * HevonLiveAutoRefresh — Atualização em tempo real silenciosa (sem flicker/sem perder scroll)
 * via router.refresh() + useTransition.
 * - Pausa automaticamente quando a aba do navegador não está visível (economia de banco)
 * - Retoma imediatamente ao voltar para a aba
 * - Exibe horário exato (HH:MM:SS) no fuso America/Sao_Paulo
 */
export default function HevonLiveAutoRefresh({
  intervalMs = 5000,
  defaultEnabled = true,
  initialTime = null,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [lastUpdated, setLastUpdated] = useState(initialTime || '');

  const triggerRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
    setLastUpdated(getBrazilClockHMS());
  }, [router]);

  useEffect(() => {
    if (!lastUpdated) {
      setLastUpdated(getBrazilClockHMS());
    }
  }, [lastUpdated]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        triggerRefresh();
      }
    }, intervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, intervalMs, triggerRefresh]);

  const intervalSec = Math.round(intervalMs / 1000);

  return (
    <div className="d-inline-flex align-items-center flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => setEnabled((prev) => !prev)}
        className={`hevon-badge ${enabled ? 'hevon-badge-success' : 'hevon-badge-neutral'}`}
        style={{
          height: '30px',
          padding: '0 10px',
          fontSize: '11px',
          cursor: 'pointer',
        }}
        title={
          enabled
            ? `Atualização automática a cada ${intervalSec}s ativa. Clique para pausar.`
            : 'Atualização automática pausada. Clique para ativar.'
        }
      >
        <span
          className="hevon-badge-dot"
          style={enabled ? { animation: 'pulseDot 1.5s infinite' } : { opacity: 0.45 }}
        />
        <span>{enabled ? `Ao Vivo (${intervalSec}s)` : 'Pausado'}</span>
        {enabled ? <Pause size={10} /> : <Play size={10} />}
      </button>

      {lastUpdated && (
        <span
          className="hevon-data-secondary hevon-mono hevon-tabular d-none d-md-inline"
          style={{ fontSize: '11px' }}
          title="Última atualização (horário de Brasília)"
        >
          {lastUpdated}
        </span>
      )}

      <button
        type="button"
        onClick={triggerRefresh}
        disabled={isPending}
        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
        style={{ height: '30px', minHeight: '30px', padding: '0 10px', fontSize: '11.5px' }}
        title="Atualizar métricas agora"
      >
        <RefreshCw size={12} className={isPending ? 'uf-spinner' : ''} />
        <span className="d-none d-sm-inline">{isPending ? 'Atualizando...' : 'Atualizar'}</span>
      </button>
    </div>
  );
}
