'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dices,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Gamepad2,
  Puzzle,
} from 'lucide-react';

export default function SimulatorClient({ puzzles = [] }) {
  const [count, setCount] = useState(25);
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/puzzle/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, amount }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-100">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2.5">
            <h1 className="page-title mb-0 fs-3 fw-bold text-dark" style={{ margin: 0, lineHeight: 1.2 }}>
              Simulador do Motor de Distribuição
            </h1>
            <span
              className="badge px-2.5 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '11px',
                height: '24px',
                lineHeight: 1,
                alignSelf: 'center',
              }}
            >
              <Dices size={12} />
              Probabilidades & Odds
            </span>
          </div>
          <div className="text-muted small mt-1" style={{ fontSize: '12.5px' }}>
            Simule dezenas ou centenas de jogadas automáticas para calibrar probabilidades e testar entrega de prêmios.
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link
            href="/admin/games"
            className="btn btn-sm btn-outline-secondary shadow-sm d-inline-flex align-items-center gap-1.5"
            style={{ height: '36px', fontSize: '12px' }}
          >
            <Gamepad2 size={15} />
            <span>Central de Jogos</span>
          </Link>
          <Link
            href="/admin/puzzles"
            className="btn btn-sm btn-primary shadow-sm d-inline-flex align-items-center gap-1.5"
            style={{ height: '36px', fontSize: '12px' }}
          >
            <span>Ver Quebra-Cabeças</span>
          </Link>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="card border shadow-sm rounded-4 p-4 mb-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-5">
            <label className="form-label text-dark small fw-bold mb-1.5">Número de Jogadas a Simular</label>
            <div className="d-flex gap-2">
              {[10, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`btn btn-sm flex-grow-1 rounded-3 fw-semibold ${count === n ? 'btn-primary shadow-sm' : 'btn-light border text-secondary'}`}
                  style={{ height: '38px', fontSize: '13px' }}
                >
                  {n}x
                </button>
              ))}
            </div>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label text-dark small fw-bold mb-1.5">Valor Médio da Compra (R$)</label>
            <input
              type="number"
              className="form-control rounded-3"
              style={{ height: '38px' }}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 50)}
            />
          </div>

          <div className="col-12 col-md-3">
            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="btn btn-primary w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 fw-semibold shadow-sm"
              style={{ height: '38px' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Rodar Simulação ({count}x)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger rounded-4 d-flex align-items-center gap-2 mb-4 shadow-sm">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="row g-4">
          {/* KPI Summary Cards */}
          <div className="col-12 col-md-4">
            <div className="card border shadow-sm rounded-4 p-4 h-100 bg-white" style={{ borderColor: '#e2e8f0' }}>
              <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                Jogadas Realizadas
              </span>
              <h3 className="fw-bold text-dark mt-2 mb-0 fs-2">{result.total_simulated}</h3>
              <div className="text-success small fw-semibold mt-2 d-flex align-items-center gap-1">
                <CheckCircle size={14} />
                <span>{result.success_count} concluídas com sucesso</span>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border shadow-sm rounded-4 p-4 h-100 bg-white" style={{ borderColor: '#e2e8f0' }}>
              <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                Álbuns 100% Completados
              </span>
              <h3 className="fw-bold text-warning mt-2 mb-0 fs-2">{result.completed_count}</h3>
              <div className="text-muted small mt-2">
                Ganhadores gerados nesta bateria de testes
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border shadow-sm rounded-4 p-4 h-100 bg-white" style={{ borderColor: '#e2e8f0' }}>
              <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>
                Novos Prêmios Emitidos
              </span>
              <h3 className="fw-bold text-primary mt-2 mb-0 fs-2">{result.rewards_generated?.length || 0}</h3>
              <div className="text-muted small mt-2">
                Códigos de resgate criados no banco
              </div>
            </div>
          </div>

          {/* Distribution per Puzzle Breakdown */}
          <div className="col-12 col-lg-7">
            <div className="card border shadow-sm rounded-4 p-4 bg-white" style={{ borderColor: '#e2e8f0' }}>
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 fs-6">
                <TrendingUp className="text-primary" size={18} />
                <span>Distribuição de Peças por Quebra-Cabeça</span>
              </h5>

              <div className="d-flex flex-column gap-3">
                {Object.entries(result.distribution_counts || {}).map(([pName, pCount]) => {
                  const pct = ((pCount / result.total_simulated) * 100).toFixed(1);
                  return (
                    <div key={pName}>
                      <div className="d-flex justify-content-between small mb-1">
                        <strong className="text-dark">{pName}</strong>
                        <span className="text-muted">{pCount} peças ({pct}%)</span>
                      </div>
                      <div className="progress rounded-pill" style={{ height: '7px', background: '#e2e8f0' }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sample Draws Log */}
          <div className="col-12 col-lg-5">
            <div className="card border shadow-sm rounded-4 p-4 bg-white h-100" style={{ borderColor: '#e2e8f0' }}>
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 fs-6">
                <Layers className="text-primary" size={18} />
                <span>Amostra de Sorteios Recentes</span>
              </h5>

              <div className="d-flex flex-column gap-2">
                {(result.sample_results || []).map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-3 bg-light border small"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="text-dark">#{idx + 1} {s.data?.puzzle_name}</strong>
                      <span className="badge bg-white text-dark border">
                        Peça #{s.data?.piece_number}
                      </span>
                    </div>
                    <div className="mt-1 text-muted" style={{ fontSize: '11.5px' }}>
                      {s.data?.is_duplicate ? '⚠️ Peça Repetida' : '✅ Nova Peça Adicionada'} · Progresso: {s.data?.progress_percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
