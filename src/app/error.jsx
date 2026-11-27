'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GlobalErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log the error
    console.error('UpsellFlow Client Boundary Caught Error:', error);

    // Auto-reload on ChunkLoadError or transient connection drop
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module');

    if (typeof window !== 'undefined') {
      const isPublic = window.location.pathname.startsWith('/p/') || 
                       window.location.pathname.startsWith('/presell/') ||
                       window.location.pathname.startsWith('/c/');
      const key = 'uf_chunk_reload_boundary_ts';
      const last = sessionStorage.getItem(key);
      const now = Date.now();
      if ((isChunkError || isPublic) && (!last || now - Number(last) > 3000)) {
        sessionStorage.setItem(key, String(now));
        setTimeout(() => {
          window.location.reload();
        }, isChunkError ? 150 : 1200);
      }
    }
  }, [error]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 p-4" style={{ backgroundColor: 'var(--body-bg, #f8fafc)' }}>
      <div
        className="card border shadow-lg rounded-4 p-4 p-md-5 text-center"
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--surface-card, #ffffff)',
          borderColor: 'var(--border-subtle, #e2e8f0)',
        }}
      >
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
          style={{
            width: '64px',
            height: '64px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
          }}
        >
          <AlertTriangle size={32} />
        </div>

        <h3 className="fw-bold mb-2 fs-4" style={{ color: 'var(--text-main, #0f172a)' }}>
          Conectando à Página...
        </h3>

        <p className="small mb-4" style={{ color: 'var(--text-muted, #64748b)', lineHeight: 1.6 }}>
          Estamos sincronizando os dados com o servidor. Se não carregar em instantes, clique no botão abaixo para recarregar.
        </p>

        {process.env.NODE_ENV !== 'production' && error && (
          <div
            className="text-start p-3 mb-3 rounded-3"
            style={{
              background: '#1e293b',
              color: '#f87171',
              fontFamily: 'monospace',
              fontSize: '12px',
              maxHeight: '180px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            <strong>{error.name || 'Error'}:</strong> {error.message || String(error)}
            {error.stack && (
              <div style={{ color: '#94a3b8', marginTop: '6px', fontSize: '11px' }}>
                {error.stack}
              </div>
            )}
          </div>
        )}

        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.reload();
            }}
            className="btn btn-primary d-flex align-items-center justify-content-center gap-2 w-100 shadow-sm"
            style={{ height: '44px', fontWeight: 700 }}
          >
            <RefreshCw size={16} />
            <span>Recarregar Página</span>
          </button>

          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 w-100"
            style={{ height: '44px' }}
          >
            <span>Tentar Novamente</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-top">
          <Link
            href="/admin/dashboard"
            className="text-decoration-none small d-inline-flex align-items-center gap-1.5"
            style={{ color: 'var(--text-muted, #64748b)' }}
          >
            <ArrowLeft size={14} />
            <span>Voltar ao Painel Principal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
