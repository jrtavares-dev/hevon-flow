'use client';

import React, { Suspense } from 'react';
import DxOfferGameLayout from '@/components/games/DxOfferGameLayout';

export default function PuzzlePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            background: '#05040f',
            backgroundColor: '#05040f',
          }}
        />
      }
    >
      <DxOfferGameLayout gameType="figurinha" />
    </Suspense>
  );
}
