'use client';

import React from 'react';

// Exact mathematical 3x3 jigsaw paths for 300x300 canvas
// Every adjacent edge has identical mating curves (tabs & sockets) with 0 gap
export const JIGSAW_PIECES_DATA = [
  {
    num: 1,
    col: 0,
    row: 0,
    center: { x: 50, y: 50 },
    d: "M 0 0 L 100 0 L 100.00 36.00 C 98.00 37.00 104.00 34.00 110.00 36.00 C 117.00 38.00 119.00 42.00 119.00 50.00 C 119.00 58.00 117.00 62.00 110.00 64.00 C 104.00 66.00 98.00 63.00 100.00 64.00 L 100.00 100.00 L 64.00 100.00 C 63.00 98.00 66.00 104.00 64.00 110.00 C 62.00 117.00 58.00 119.00 50.00 119.00 C 42.00 119.00 38.00 117.00 36.00 110.00 C 34.00 104.00 37.00 98.00 36.00 100.00 L 0.00 100.00 L 0 0 Z"
  },
  {
    num: 2,
    col: 1,
    row: 0,
    center: { x: 150, y: 50 },
    d: "M 100 0 L 200 0 L 200.00 36.00 C 202.00 37.00 196.00 34.00 190.00 36.00 C 183.00 38.00 181.00 42.00 181.00 50.00 C 181.00 58.00 183.00 62.00 190.00 64.00 C 196.00 66.00 202.00 63.00 200.00 64.00 L 200.00 100.00 L 164.00 100.00 C 163.00 102.00 166.00 96.00 164.00 90.00 C 162.00 83.00 158.00 81.00 150.00 81.00 C 142.00 81.00 138.00 83.00 136.00 90.00 C 134.00 96.00 137.00 102.00 136.00 100.00 L 100.00 100.00 L 100.00 64.00 C 98.00 63.00 104.00 66.00 110.00 64.00 C 117.00 62.00 119.00 58.00 119.00 50.00 C 119.00 42.00 117.00 38.00 110.00 36.00 C 104.00 34.00 98.00 37.00 100.00 36.00 L 100.00 0.00 Z"
  },
  {
    num: 3,
    col: 2,
    row: 0,
    center: { x: 250, y: 50 },
    d: "M 200 0 L 300 0 L 300 100 L 264.00 100.00 C 263.00 98.00 266.00 104.00 264.00 110.00 C 262.00 117.00 258.00 119.00 250.00 119.00 C 242.00 119.00 238.00 117.00 236.00 110.00 C 234.00 104.00 237.00 98.00 236.00 100.00 L 200.00 100.00 L 200.00 64.00 C 202.00 63.00 196.00 66.00 190.00 64.00 C 183.00 62.00 181.00 58.00 181.00 50.00 C 181.00 42.00 183.00 38.00 190.00 36.00 C 196.00 34.00 202.00 37.00 200.00 36.00 L 200.00 0.00 Z"
  },
  {
    num: 4,
    col: 0,
    row: 1,
    center: { x: 50, y: 150 },
    d: "M 0 100 L 36.00 100.00 C 37.00 98.00 34.00 104.00 36.00 110.00 C 38.00 117.00 42.00 119.00 50.00 119.00 C 58.00 119.00 62.00 117.00 64.00 110.00 C 66.00 104.00 63.00 98.00 64.00 100.00 L 100.00 100.00 L 100.00 136.00 C 102.00 137.00 96.00 134.00 90.00 136.00 C 83.00 138.00 81.00 142.00 81.00 150.00 C 81.00 158.00 83.00 162.00 90.00 164.00 C 96.00 166.00 102.00 163.00 100.00 164.00 L 100.00 200.00 L 64.00 200.00 C 63.00 202.00 66.00 196.00 64.00 190.00 C 62.00 183.00 58.00 181.00 50.00 181.00 C 42.00 181.00 38.00 183.00 36.00 190.00 C 34.00 196.00 37.00 202.00 36.00 200.00 L 0.00 200.00 L 0 100 Z"
  },
  {
    num: 5,
    col: 1,
    row: 1,
    center: { x: 150, y: 150 },
    d: "M 100 100 L 136.00 100.00 C 137.00 102.00 134.00 96.00 136.00 90.00 C 138.00 83.00 142.00 81.00 150.00 81.00 C 158.00 81.00 162.00 83.00 164.00 90.00 C 166.00 96.00 163.00 102.00 164.00 100.00 L 200.00 100.00 L 200.00 136.00 C 198.00 137.00 204.00 134.00 210.00 136.00 C 217.00 138.00 219.00 142.00 219.00 150.00 C 219.00 158.00 217.00 162.00 210.00 164.00 C 204.00 166.00 198.00 163.00 200.00 164.00 L 200.00 200.00 L 164.00 200.00 C 163.00 198.00 166.00 204.00 164.00 210.00 C 162.00 217.00 158.00 219.00 150.00 219.00 C 142.00 219.00 138.00 217.00 136.00 210.00 C 134.00 204.00 137.00 198.00 136.00 200.00 L 100.00 200.00 L 100.00 164.00 C 102.00 163.00 96.00 166.00 90.00 164.00 C 83.00 162.00 81.00 158.00 81.00 150.00 C 81.00 142.00 83.00 138.00 90.00 136.00 C 96.00 134.00 102.00 137.00 100.00 136.00 L 100.00 100.00 Z"
  },
  {
    num: 6,
    col: 2,
    row: 1,
    center: { x: 250, y: 150 },
    d: "M 200 100 L 236.00 100.00 C 237.00 98.00 234.00 104.00 236.00 110.00 C 238.00 117.00 242.00 119.00 250.00 119.00 C 258.00 119.00 262.00 117.00 264.00 110.00 C 266.00 104.00 263.00 98.00 264.00 100.00 L 300.00 100.00 L 300 200 L 264.00 200.00 C 263.00 202.00 266.00 196.00 264.00 190.00 C 262.00 183.00 258.00 181.00 250.00 181.00 C 242.00 181.00 238.00 183.00 236.00 190.00 C 234.00 196.00 237.00 202.00 236.00 200.00 L 200.00 200.00 L 200.00 164.00 C 198.00 163.00 204.00 166.00 210.00 164.00 C 217.00 162.00 219.00 158.00 219.00 150.00 C 219.00 142.00 217.00 138.00 210.00 136.00 C 204.00 134.00 198.00 137.00 200.00 136.00 L 200.00 100.00 Z"
  },
  {
    num: 7,
    col: 0,
    row: 2,
    center: { x: 50, y: 250 },
    d: "M 0 200 L 36.00 200.00 C 37.00 202.00 34.00 196.00 36.00 190.00 C 38.00 183.00 42.00 181.00 50.00 181.00 C 58.00 181.00 62.00 183.00 64.00 190.00 C 66.00 196.00 63.00 202.00 64.00 200.00 L 100.00 200.00 L 100.00 236.00 C 98.00 237.00 104.00 234.00 110.00 236.00 C 117.00 238.00 119.00 242.00 119.00 250.00 C 119.00 258.00 117.00 262.00 110.00 264.00 C 104.00 266.00 98.00 263.00 100.00 264.00 L 100.00 300.00 L 0 300 L 0 200 Z"
  },
  {
    num: 8,
    col: 1,
    row: 2,
    center: { x: 150, y: 250 },
    d: "M 100 200 L 136.00 200.00 C 137.00 198.00 134.00 204.00 136.00 210.00 C 138.00 217.00 142.00 219.00 150.00 219.00 C 158.00 219.00 162.00 217.00 164.00 210.00 C 166.00 204.00 163.00 198.00 164.00 200.00 L 200.00 200.00 L 200.00 236.00 C 198.00 237.00 204.00 234.00 210.00 236.00 C 217.00 238.00 219.00 242.00 219.00 250.00 C 219.00 258.00 217.00 262.00 210.00 264.00 C 204.00 266.00 198.00 263.00 200.00 264.00 L 200.00 300.00 L 100 300 L 100.00 264.00 C 98.00 263.00 104.00 266.00 110.00 264.00 C 117.00 262.00 119.00 258.00 119.00 250.00 C 119.00 242.00 117.00 238.00 110.00 236.00 C 104.00 234.00 98.00 237.00 100.00 236.00 L 100.00 200.00 Z"
  },
  {
    num: 9,
    col: 2,
    row: 2,
    center: { x: 250, y: 250 },
    d: "M 200 200 L 236.00 200.00 C 237.00 202.00 234.00 196.00 236.00 190.00 C 238.00 183.00 242.00 181.00 250.00 181.00 C 258.00 181.00 262.00 183.00 264.00 190.00 C 266.00 196.00 263.00 202.00 264.00 200.00 L 300.00 200.00 L 300 300 L 200 300 L 200.00 264.00 C 198.00 263.00 204.00 266.00 210.00 264.00 C 217.00 262.00 219.00 258.00 219.00 250.00 C 219.00 242.00 217.00 238.00 210.00 236.00 C 204.00 234.00 198.00 237.00 200.00 236.00 L 200.00 200.00 Z"
  }
];

export default function JigsawPuzzleBoard({
  collectedPieces = [], // Por padrão o tabuleiro inicia 100% VAZIO (0 peças)
  justUnlockedPiece = null,
  isCompleted = false,
  imageUrl = null,
  onPieceClick = null,
  className = '',
  style = {},
  size = 320,
}) {
  const isPieceCollected = (num) => {
    if (isCompleted) return true;
    if (!collectedPieces) return false;
    if (Array.isArray(collectedPieces)) {
      if (collectedPieces.length === 0) return false;
      if (typeof collectedPieces[0] === 'boolean') {
        return Boolean(collectedPieces[num - 1]);
      }
      return collectedPieces.includes(num);
    }
    return Boolean(collectedPieces[num - 1]);
  };

  return (
    <div
      className={`jigsaw-puzzle-board-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: `${size}px`,
        margin: '0 auto',
        aspectRatio: '1 / 1',
        userSelect: 'none',
        ...style,
      }}
    >
      <style>{`
        @keyframes dxPieceSnapIn {
          0% { transform: scale(1.3) rotate(-3deg); filter: brightness(1.7) drop-shadow(0 0 16px #fbbf24); }
          50% { transform: scale(0.96) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); filter: none; }
        }
      `}</style>

      {/* Outer Puzzle Board Frame */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '22px',
          background: '#0b1120',
          padding: '12px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), inset 0 2px 6px rgba(255, 255, 255, 0.1)',
          border: '1.5px solid rgba(99, 102, 241, 0.35)',
        }}
      >
        <svg
          viewBox="-10 -10 320 320"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            overflow: 'visible',
          }}
        >
          <defs>
            {/* Ambient Shadow for Jigsaw Pieces */}
            <filter id="jigsawShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.85" />
            </filter>

            {/* Radiant Golden Glow for Special Piece #9 */}
            <filter id="goldPieceGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#fbbf24" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.75" />
            </filter>

            {/* Gradients for Standard Pieces */}
            <linearGradient id="gradPieceStandard" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="50%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>

            <linearGradient id="gradPieceHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Radiant Gold Gradient for Golden Piece #9 */}
            <linearGradient id="gradPieceGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Empty Slot / Socket Background Gradient */}
            <radialGradient id="gradEmptySlot" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(30, 41, 59, 0.45)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0.95)" />
            </radialGradient>

            {/* Mathematical Interlocking ClipPaths for Slicing Any Uploaded Photo */}
            {JIGSAW_PIECES_DATA.map((pc) => (
              <clipPath key={`clip-${pc.num}`} id={`jigsawClip${pc.num}`}>
                <path d={pc.d} />
              </clipPath>
            ))}
          </defs>

          {/* 1. Underlying Socket Lines & Cut Silhouettes (The dark base board) */}
          <rect
            x="0"
            y="0"
            width="300"
            height="300"
            rx="8"
            fill="#090d16"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />

          {/* Render all 9 pieces */}
          {JIGSAW_PIECES_DATA.map((piece) => {
            const collected = isPieceCollected(piece.num);
            const isSpecial = piece.num === 9;
            const isJustUnlocked = justUnlockedPiece === piece.num;

            // Missing / Socket state
            if (!collected) {
              return (
                <g
                  key={piece.num}
                  id={`jigsaw-slot-${piece.num}`}
                  onClick={() => onPieceClick && onPieceClick(piece.num)}
                  style={{ cursor: onPieceClick ? 'pointer' : 'default' }}
                >
                  {/* Empty socket path */}
                  <path
                    d={piece.d}
                    fill="url(#gradEmptySlot)"
                    stroke={isSpecial ? '#fbbf24' : 'rgba(255, 255, 255, 0.14)'}
                    strokeWidth={isSpecial ? '1.8' : '1.2'}
                    strokeDasharray={isSpecial ? '4 3' : 'none'}
                    strokeLinejoin="round"
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                  />

                  {/* Pulsing beacon center for missing slot */}
                  <circle
                    cx={piece.center.x}
                    cy={piece.center.y - 8}
                    r={isSpecial ? 16 : 12}
                    fill={isSpecial ? 'rgba(251, 191, 36, 0.15)' : 'rgba(99, 102, 241, 0.08)'}
                    stroke={isSpecial ? 'rgba(251, 191, 36, 0.6)' : 'rgba(255, 255, 255, 0.1)'}
                    strokeWidth="1"
                  />

                  <text
                    x={piece.center.x}
                    y={piece.center.y - 4}
                    textAnchor="middle"
                    fill={isSpecial ? '#fbbf24' : 'rgba(255, 255, 255, 0.35)'}
                    fontSize={isSpecial ? '15' : '12'}
                    fontWeight="900"
                    fontFamily="'Archivo', sans-serif"
                    letterSpacing="0.04em"
                  >
                    #{piece.num}
                  </text>

                  <text
                    x={piece.center.x}
                    y={piece.center.y + 14}
                    textAnchor="middle"
                    fill={isSpecial ? '#fef08a' : 'rgba(255, 255, 255, 0.25)'}
                    fontSize="8.5"
                    fontWeight="800"
                    fontFamily="'Archivo', sans-serif"
                    letterSpacing="0.06em"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {isSpecial ? 'Peça Chave' : 'Encaixar'}
                  </text>
                </g>
              );
            }

            // Collected piece state
            const fillGradient = isSpecial ? 'url(#gradPieceGold)' : 'url(#gradPieceStandard)';
            const strokeColor = isSpecial ? '#ffffff' : 'rgba(199, 210, 254, 0.85)';
            const strokeWidth = isSpecial ? '2.2' : '1.5';
            const filterUrl = isSpecial ? 'url(#goldPieceGlow)' : 'url(#jigsawShadow)';

            return (
              <g
                key={piece.num}
                id={`jigsaw-piece-${piece.num}`}
                onClick={() => onPieceClick && onPieceClick(piece.num)}
                style={{
                  cursor: onPieceClick ? 'pointer' : 'default',
                  transformOrigin: `${piece.center.x}px ${piece.center.y}px`,
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  animation: isJustUnlocked ? 'dxPieceSnapIn 0.38s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                }}
              >
                {imageUrl ? (
                  <>
                    {/* Sliced Photo Piece using mathematical SVG ClipPath */}
                    <g clipPath={`url(#jigsawClip${piece.num})`} filter={filterUrl}>
                      <image
                        href={imageUrl}
                        xlinkHref={imageUrl}
                        x="0"
                        y="0"
                        width="300"
                        height="300"
                        preserveAspectRatio="xMidYMid slice"
                      />
                      {isSpecial && (
                        <rect
                          x="0"
                          y="0"
                          width="300"
                          height="300"
                          fill="rgba(245, 158, 11, 0.18)"
                          style={{ mixBlendMode: 'color-dodge' }}
                        />
                      )}
                    </g>

                    {/* 3D Interlocking Beveled Edge & Glow */}
                    <path
                      d={piece.d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                      style={{ pointerEvents: 'none' }}
                    />
                    <path
                      d={piece.d}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.35)"
                      strokeWidth="0.8"
                      style={{ pointerEvents: 'none' }}
                    />
                  </>
                ) : (
                  <>
                    {/* Genuine Jigsaw Interlocking Cut Path */}
                    <path
                      d={piece.d}
                      fill={fillGradient}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                      filter={filterUrl}
                    />

                    {/* Subtle Inner Highlight for 3D Beveled Puzzle Feel */}
                    <path
                      d={piece.d}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="0.8"
                      style={{ pointerEvents: 'none' }}
                    />
                  </>
                )}

                {/* Piece Badge Pill */}
                <circle
                  cx={piece.center.x}
                  cy={piece.center.y - (imageUrl ? 0 : (isSpecial ? 3 : 2))}
                  r={imageUrl ? 12 : 16}
                  fill={imageUrl ? 'rgba(0, 0, 0, 0.65)' : 'transparent'}
                  stroke={imageUrl ? (isSpecial ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)') : 'none'}
                  strokeWidth="1"
                />

                <text
                  x={piece.center.x}
                  y={piece.center.y + (imageUrl ? 4 : (isSpecial ? -3 : -2))}
                  textAnchor="middle"
                  fill={isSpecial ? '#fbbf24' : '#ffffff'}
                  fontSize={imageUrl ? '11' : (isSpecial ? '16' : '14')}
                  fontWeight="900"
                  fontFamily="'Archivo', sans-serif"
                  letterSpacing="0.02em"
                  style={{
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                  }}
                >
                  #{piece.num}
                </text>

                {!imageUrl && (
                  <text
                    x={piece.center.x}
                    y={piece.center.y + 13}
                    textAnchor="middle"
                    fill={isSpecial ? '#78350f' : '#c7d2fe'}
                    fontSize="8"
                    fontWeight="800"
                    fontFamily="'Archivo', sans-serif"
                    letterSpacing="0.06em"
                    style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
                  >
                    {isSpecial ? 'Dourada' : 'Peça'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Golden Confetti / Sparkle Effect when Completed */}
        {isCompleted && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '10px',
              background: '#f59e0b',
              color: '#451a03',
              fontSize: '10px',
              fontWeight: 900,
              padding: '3px 9px',
              borderRadius: '999px',
              boxShadow: '0 0 16px rgba(251, 191, 36, 0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              pointerEvents: 'none',
            }}
          >
            ★ Completo
          </div>
        )}
      </div>
    </div>
  );
}
