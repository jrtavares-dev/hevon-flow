import React, { Suspense } from 'react';
import { queryOne, query } from '@/lib/db';
import DxOfferGameLayout from '@/components/games/DxOfferGameLayout';

export const dynamic = 'force-dynamic';

// Cache SSR de curta duração (3s) para evitar milhares de SELECTs repetidos em picos de live
const ssrScratchCache = globalThis._ssrScratchCache || (globalThis._ssrScratchCache = { timestamp: 0, config: null, prizes: null });
const SSR_CACHE_TTL_MS = 3000;

export default async function RaspadinhaPage() {
  let initialConfig = {
    premio: 'MT - 03',
    artigo: 'a',
    bonus: 'R$30.000',
    compraMinima: 'R$20',
    dest: 'https://www.cherminho.com.br/campanha/191-corolla-xei-87083',
    videoUrl:
      'https://midia.dxhost.com.br/media/01a0deef-3837-730c-bd2a-e6528229aea0/502f7bcddef242c20cd2c7ea83f9898c5bde1bb16985441c5bf7e200637ce91c.mp4',
    badgeVideo: 'PRA VOCÊ',
    prazoMinutos: 3,
    timerLabel: 'ÚLTIMO MINUTO',
    btnText: 'GARANTIR AGORA ➔',
    ribbon1: 'MÁXIMO DE SORTE',
    ribbon2: 'SÓ POR ESTA PÁGINA',
    ribbon3: 'SÓ POR HOJE',
    raspadinhaBgImage: '/uploads/images/img_1794594245457_jttjin.jpg',
    raspadinhaBgOverlay: 75,
    raspadinhaBadgeText: 'COMPRA CONFIRMADA',
    raspadinhaTitle1: 'Raspe e ache',
    raspadinhaTitle2: '3 IGUAIS',
    raspadinhaTheme: 'red',
    tela1Color: '#e52e2e',
    tela2Color: '#10b981',
    scratchGameMode: 'numbered',
    scratchPrizeImage: '/uploads/images/img_1794593368169_3x36rj.png',
    scratchPrizeTitle: 'SAVEIRO CROSS',
    scratchNonWinningText: 'NÃO FOI DESSA VEZ',
    ssrLoaded: true,
  };
  let initialPrizes = [];

  try {
    if (ssrScratchCache.config && Date.now() - ssrScratchCache.timestamp < SSR_CACHE_TTL_MS) {
      initialConfig = ssrScratchCache.config;
      initialPrizes = ssrScratchCache.prizes || [];
    } else {
      const row = await queryOne(
        `SELECT id, name, offer_config FROM scratch_campaigns ORDER BY (status = 'active') DESC, id DESC LIMIT 1`
      );
      if (row) {
        if (row.offer_config) {
          const parsed =
            typeof row.offer_config === 'string'
              ? JSON.parse(row.offer_config)
              : row.offer_config;
          initialConfig = { ...initialConfig, ...parsed, ssrLoaded: true };
        }
        const prizes = await query(
          `SELECT id, label, symbol, reward_type, reward_value, weight, status FROM scratch_prizes WHERE campaign_id = ? AND status = 'active' ORDER BY weight DESC, id ASC`,
          [row.id]
        );
        initialPrizes = prizes || [];
      }
      ssrScratchCache.timestamp = Date.now();
      ssrScratchCache.config = initialConfig;
      ssrScratchCache.prizes = initialPrizes;
    }
  } catch (err) {
    console.error('Error loading scratch campaign in SSR:', err);
  }

  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            background: '#050807',
            backgroundColor: '#050807',
          }}
        />
      }
    >
      <DxOfferGameLayout
        gameType="raspadinha"
        initialConfig={initialConfig}
        initialPrizes={initialPrizes}
      />
    </Suspense>
  );
}
