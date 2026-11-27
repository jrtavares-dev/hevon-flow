import { NextResponse } from 'next/server';
import { queryOne, query, execute } from '@/lib/db';
import { syncHevonCatalogAsync } from '@/lib/hevon';

export const dynamic = 'force-dynamic';

// In-memory cache de 5s para refletir alterações dos prêmios no admin quase em tempo real
const gamesConfigCache = globalThis._gamesConfigCache || (globalThis._gamesConfigCache = new Map());
const CACHE_TTL_MS = 5 * 1000;

const DEFAULT_OFFER_CONFIG = {
  premio: 'MT - 03',
  artigo: 'a',
  bonus: 'R$30.000',
  compraMinima: 'R$20',
  dest: 'https://www.cherminho.com.br/campanha/191-corolla-xei-87083',
  videoUrl: 'https://midia.dxhost.com.br/media/01a0deef-3837-730c-bd2a-e6528229aea0/502f7bcddef242c20cd2c7ea83f9898c5bde1bb16985441c5bf7e200637ce91c.mp4',
  badgeVideo: 'PRA VOCÊ',
  step1Text: 'Compra por esta página fezinha acima de R$20',
  step2Text: 'A cota premiada sai pra você',
  step3Title: 'Leva a MT - 03 + R$30.000',
  step3Sub: 'no site: só a MT - 03',
  prazoMinutos: 3,
  timerLabel: 'ÚLTIMO MINUTO',
  btnText: 'GARANTIR AGORA ➔',
  ribbon1: 'MÁXIMO DE SORTE',
  ribbon2: 'SÓ POR ESTA PÁGINA',
  ribbon3: 'SÓ POR HOJE',
  // Raspadinha Layout & Appearance
  raspadinhaBgImage: '/uploads/images/img_1794594245457_jttjin.jpg',
  raspadinhaBgOverlay: 75,
  raspadinhaBadgeText: 'COMPRA CONFIRMADA',
  raspadinhaTitle1: 'Raspe e ache',
  raspadinhaTitle2: '3 IGUAIS',
  raspadinhaTheme: 'red',
  tela1Color: '#e52e2e',
  tela2Color: '#10b981',
  raspadinhaInstruction: 'ACHE 3 IGUAIS',
  raspadinhaSubInstruction: 'PASSE A MOEDA PARA RASPAR',
  raspadinhaBtnText: 'RASPAR TUDO',
  // Raspadinha Car / Numbered Mode
  scratchGameMode: 'numbered',
  scratchPrizeImage: '/uploads/images/img_1794593368169_3x36rj.png',
  scratchPrizeTitle: 'SAVEIRO CROSS',
  scratchWinningNumber: '4',
  scratchAllowedAttempts: 1,
  scratchNonWinningText: 'NÃO FOI DESSA VEZ',
};

function getTableName(game) {
  const g = (game || '').toLowerCase();
  if (g === 'roleta' || g === 'wheel') return 'wheel_campaigns';
  if (g === 'raspadinha' || g === 'scratch') return 'scratch_campaigns';
  if (g === 'caixa' || g === 'mystery_box' || g === 'mystery-box') return 'mystery_box_campaigns';
  if (g === 'figurinha' || g === 'puzzle' || g === 'puzzles') return 'puzzle_campaigns';
  return null;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get('game') || 'raspadinha';

    // 1. Checa cache em memória
    const cached = gamesConfigCache.get(game);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return NextResponse.json(cached.data);
    }

    const table = getTableName(game);

    if (!table) {
      return NextResponse.json({ success: false, error: 'Jogo inválido' }, { status: 400 });
    }

    const row = await queryOne(
      `SELECT id, name, offer_config FROM ${table} ORDER BY (status = 'active') DESC, id DESC LIMIT 1`
    );

    let config = { ...DEFAULT_OFFER_CONFIG };
    if (row && row.offer_config) {
      const parsed = typeof row.offer_config === 'string' ? JSON.parse(row.offer_config) : row.offer_config;
      config = { ...config, ...parsed };
    }

    const g = (game || '').toLowerCase();
    let scratchPrizes = [];
    if (g === 'raspadinha' || g === 'scratch') {
      try {
        scratchPrizes = await query(
          `SELECT id, label, symbol, reward_type, reward_value, weight, status FROM scratch_prizes WHERE campaign_id = ? AND status = 'active' ORDER BY weight DESC, id ASC`,
          [row?.id || 1]
        );
        config.prizes = scratchPrizes || [];
      } catch (przErr) {
        console.error('Error fetching scratch prizes in /api/games/config:', przErr);
      }
    }

    if (g === 'figurinha' || g === 'puzzle' || g === 'puzzles') {
      if (!config.puzzleImage) {
        try {
          const activePuzzle = await queryOne(`SELECT image FROM puzzles ORDER BY (status = 'active') DESC, priority DESC, id ASC LIMIT 1`);
          if (activePuzzle && activePuzzle.image) {
            config.puzzleImage = activePuzzle.image;
          }
        } catch (pzErr) {
          console.error('Error fetching default puzzle image:', pzErr);
        }
      }
    }

    const responseData = {
      success: true,
      game,
      campaign_id: row?.id || 1,
      offer_config: config,
      prizes: scratchPrizes || [],
    };

    gamesConfigCache.set(game, { timestamp: Date.now(), data: responseData });

    return NextResponse.json(responseData);
  } catch (err) {
    console.error('Error fetching game offer config:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const game = body.game || 'raspadinha';
    const table = getTableName(game);

    if (!table) {
      return NextResponse.json({ success: false, error: 'Jogo inválido' }, { status: 400 });
    }

    const offerConfig = body.offer_config || {};
    const jsonStr = JSON.stringify(offerConfig);

    const campaignId = body.campaign_id ? parseInt(body.campaign_id) : null;

    if (campaignId) {
      await execute(
        `UPDATE ${table} SET offer_config = ?::jsonb, updated_at = NOW() WHERE id = ?`,
        [jsonStr, campaignId]
      );
    } else {
      await execute(
        `UPDATE ${table} SET offer_config = ?::jsonb, updated_at = NOW() WHERE id = (
          SELECT id FROM ${table} ORDER BY (status = 'active') DESC, id DESC LIMIT 1
        )`,
        [jsonStr]
      );
    }

    const g = (game || '').toLowerCase();
    if ((g === 'figurinha' || g === 'puzzle' || g === 'puzzles') && (offerConfig.puzzleImage || offerConfig.image)) {
      const pzImg = offerConfig.puzzleImage || offerConfig.image;
      try {
        await execute(
          `UPDATE puzzles SET image = ?, updated_at = NOW() WHERE status = 'active' OR campaign_id = ?`,
          [pzImg, campaignId || 1]
        );
      } catch (pzSyncErr) {
        console.error('Error syncing puzzle image in games config POST:', pzSyncErr);
      }
    }

    // Invalida cache imediatamente para refletir no jogo
    gamesConfigCache.delete(game);
    gamesConfigCache.delete('raspadinha');
    if (globalThis._ssrScratchCache) {
      globalThis._ssrScratchCache.timestamp = 0;
      globalThis._ssrScratchCache.config = null;
    }
    syncHevonCatalogAsync();

    return NextResponse.json({
      success: true,
      message: 'Configurações da tela de oferta (Etapa 2) salvas com sucesso!',
      offer_config: offerConfig,
    });
  } catch (err) {
    console.error('Error updating game offer config:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
