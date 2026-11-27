'use client';

import React, { Suspense } from 'react';
import DxOfferGameLayout from '@/components/games/DxOfferGameLayout';

export default function CaixaMisteriosaPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            background: '#0a0112',
            backgroundColor: '#0a0112',
          }}
        />
      }
    >
      <DxOfferGameLayout gameType="caixa" />
    </Suspense>
  );
}
