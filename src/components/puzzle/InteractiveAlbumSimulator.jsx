'use client';

import { useState } from 'react';
import {
  Sparkles,
  Trophy,
  Zap,
  Gift,
  CheckCircle,
  RotateCcw,
  Star,
  ExternalLink,
  ChevronDown,
  Layers,
  Award,
} from 'lucide-react';
import JigsawPuzzleBoard from './JigsawPuzzleBoard';

export default function InteractiveAlbumSimulator({
  puzzles = [],
  selectedPuzzle = null,
  onSelectPuzzle,
  onSimulatePack,
  simResult = null,
  simulating = false,
  onResetSim,
}) {
  const activePuzzle = selectedPuzzle || puzzles[0] || null;

  // Renderiza o grid 3x3 do álbum
  const totalPieces = Number(activePuzzle?.pieces_count || 9);
  const piecesArray = Array.from({ length: totalPieces }, (_, i) => i + 1);

  return (
    <div className="card border shadow-sm rounded-4 overflow-hidden puzzle-admin-card">
      {/* Header do Card */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 puzzle-admin-card-header">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{
              width: '32px',
              height: '32px',
              background: '#10b981',
              color: '#ffffff',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <h6 className="fw-bold text-dark mb-0 fs-6">Vitrine do Quebra-cabeça & Simulador</h6>
            <span className="text-muted small" style={{ fontSize: '11px' }}>
              Teste a experiência visual de montagem de peças em tempo real
            </span>
          </div>
        </div>

        {/* Seletor de Quebra-Cabeça caso haja mais de 1 */}
        {puzzles.length > 1 && (
          <div className="d-flex align-items-center gap-1.5">
            <label className="small text-muted mb-0 fw-semibold" style={{ fontSize: '11px' }}>
              Quebra-cabeça:
            </label>
            <select
              value={activePuzzle?.id || ''}
              onChange={(e) => {
                const found = puzzles.find((p) => p.id === parseInt(e.target.value));
                if (found && onSelectPuzzle) onSelectPuzzle(found);
              }}
              className="form-select form-select-sm rounded-3 py-1 px-2 border puzzle-select-dropdown"
              style={{ fontSize: '12px', minWidth: '150px' }}
            >
              {puzzles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-3 p-lg-4 text-center">
        {activePuzzle ? (
          <>
            {/* Banner do Prêmio Alvo */}
            <div className="d-flex align-items-center justify-content-between p-2.5 px-3 rounded-3 mb-3 border text-start puzzle-target-banner">
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-xs"
                  style={{ width: '36px', height: '36px', background: '#10b981', color: '#fff' }}
                >
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="fw-bold text-dark small" style={{ fontSize: '13px' }}>
                    {activePuzzle.name}
                  </div>
                  <div className="text-muted small" style={{ fontSize: '11.5px' }}>
                    Prêmio: <strong className="text-primary">{activePuzzle.prize_name}</strong>
                    {Number(activePuzzle.prize_value || 0) > 0 && (
                      <span className="ms-1.5 badge bg-primary-subtle text-primary border border-primary-subtle">
                        R$ {Number(activePuzzle.prize_value).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-end">
                <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold rounded-pill px-2 py-1 small">
                  9 Peças
                </span>
              </div>
            </div>

            {/* Tabuleiro Real de Quebra-cabeça com Encaixes */}
            <JigsawPuzzleBoard
              collectedPieces={
                simResult?.piece
                  ? Array.from(new Set([1, 2, 4, 5, 7, Number(simResult.piece.piece_number)]))
                  : [1, 2, 4, 5, 7]
              }
              justUnlockedPiece={simResult?.piece ? Number(simResult.piece.piece_number) : null}
              isCompleted={Boolean(simResult?.reward)}
              imageUrl={
                activePuzzle?.image?.startsWith('/') || activePuzzle?.image?.startsWith('http')
                  ? activePuzzle.image
                  : activePuzzle?.image
                  ? `/images/puzzles/${activePuzzle.image}`
                  : null
              }
              size={300}
              className="mb-3"
            />

            {/* Painel do Resultado da Simulação */}
            {simResult && (
              <div
                className={`p-3 rounded-4 mb-3 text-start border shadow-sm animate-fade-in puzzle-sim-result ${
                  simResult.reward ? 'success' : 'default'
                }`}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-1.5">
                    {simResult.reward ? (
                      <span className="badge bg-success text-white fw-bold d-inline-flex align-items-center gap-1">
                        <Trophy size={12} />
                        Quebra-cabeça Montado!
                      </span>
                    ) : (
                      <span className="badge bg-primary text-white fw-bold d-inline-flex align-items-center gap-1">
                        <Sparkles size={12} />
                        Figurinha Sorteada
                      </span>
                    )}
                    <span
                      className={`badge ${
                        simResult.is_duplicate ? 'bg-secondary' : 'bg-warning text-dark'
                      } fw-bold`}
                    >
                      {simResult.is_duplicate ? '🔁 Repetida' : '✨ Nova Figurinha'}
                    </span>
                  </div>

                  {onResetSim && (
                    <button
                      type="button"
                      onClick={onResetSim}
                      className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                      style={{ fontSize: '11px' }}
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2.5 my-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-xs"
                    style={{
                      width: '42px',
                      height: '42px',
                      background:
                        simResult.piece?.piece_type === 'special' ? '#f59e0b' : '#10b981',
                      color: '#ffffff',
                      fontSize: '18px',
                    }}
                  >
                    #{simResult.piece?.piece_number || 1}
                  </div>
                  <div>
                    <div className="fw-bold text-dark small" style={{ fontSize: '13.5px' }}>
                      {simResult.piece?.piece_type === 'special'
                        ? '⭐ Peça Especial Dourada'
                        : `Peça #${simResult.piece?.piece_number || 1} do Álbum`}
                    </div>
                    <div className="text-muted small" style={{ fontSize: '11.5px' }}>
                      Coleção: <strong>{simResult.puzzle?.name || activePuzzle.name}</strong>
                    </div>
                  </div>
                </div>

                {/* Se completou o álbum e liberou prêmio/cupom */}
                {simResult.reward && (
                  <div
                    className="p-2.5 rounded-3 mt-2 border bg-white"
                    style={{ borderColor: '#86efac' }}
                  >
                    <div className="text-success fw-bold small d-flex align-items-center gap-1.5">
                      <Gift size={14} />
                      Cupom Gerado Automaticamente:
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-1">
                      <code
                        className="fw-bold fs-6 text-dark bg-light px-2 py-0.5 rounded border"
                        style={{ letterSpacing: '0.05em' }}
                      >
                        {simResult.reward.reward_code}
                      </code>
                      <span className="fw-bold text-success small">
                        {simResult.reward.prize_name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botão de Ação do Simulador */}
            <button
              type="button"
              onClick={onSimulatePack}
              disabled={simulating}
              className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
              style={{
                fontSize: '13.5px',
                border: 'none',
              }}
            >
              {simulating ? (
                <>
                  <div
                    className="spinner-border spinner-border-sm text-white"
                    role="status"
                  ></div>
                  <span>Abrindo Pacote & Sorteando...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Abrir Pacote de Teste (Simular Sorteio)</span>
                </>
              )}
            </button>
            <div className="text-muted small mt-2" style={{ fontSize: '11px' }}>
              Simula a probabilidade exata calculada pelo motor de distribuição.
            </div>
          </>
        ) : (
          <div className="py-5 text-center text-muted">
            <Layers size={36} className="mb-2 opacity-50" />
            <div className="fw-semibold small">Nenhum quebra-cabeça configurado</div>
            <div className="small">Clique em "+ Nova Peça" ao lado para criar o primeiro.</div>
          </div>
        )}
      </div>
    </div>
  );
}
