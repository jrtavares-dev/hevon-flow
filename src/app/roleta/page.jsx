'use client';

import React, { Suspense } from 'react';
import DxOfferGameLayout from '@/components/games/DxOfferGameLayout';

export default function RoletaPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            background: '#010c14',
            backgroundColor: '#010c14',
          }}
        />
      }
    >
      <DxOfferGameLayout gameType="roleta" />
    </Suspense>
  );
}
