'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function EditPresellError({ error, reset }) {
  useEffect(() => {
    console.error('Presell Edit Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="container py-5">
      <div className="card shadow-sm border rounded-4 p-4 text-center mx-auto" style={{ maxWidth: 540 }}>
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
          style={{ width: 56, height: 56, background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}
        >
          <AlertCircle size={28} />
        </div>
        <h4 className="fw-bold text-dark mb-2">Erro ao carregar editor da Presell</h4>
        <p className="text-muted small mb-4">
          Ocorreu uma instabilidade momentânea ao carregar os dados desta página presell.
          {error?.message ? ` (${error.message})` : ''}
        </p>
        <div className="d-flex align-items-center justify-content-center gap-2">
          <button
            onClick={() => reset()}
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2 rounded-3 fw-bold"
          >
            <RefreshCw size={14} /> Tentar Novamente
          </button>
          <Link
            href="/admin/presells"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2 rounded-3"
          >
            <ArrowLeft size={14} /> Voltar para Presells
          </Link>
        </div>
      </div>
    </div>
  );
}
