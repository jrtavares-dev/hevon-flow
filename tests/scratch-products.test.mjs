import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeScratchProducts,
  getActiveScratchProducts,
  pickRandomScratchProduct,
  applyProductsToOfferConfig,
} from '../src/lib/scratch/scratchProducts.js';

test('Raspadinha: mantém retrocompatibilidade quando só existe 1 produto legado (scratchPrizeImage/Title)', () => {
  const list = normalizeScratchProducts({
    scratchPrizeImage: '/uploads/images/saveiro.png',
    scratchPrizeTitle: 'SAVEIRO CROSS',
  });

  assert.equal(list.length, 1);
  assert.equal(list[0].title, 'SAVEIRO CROSS');
  assert.equal(list[0].image, '/uploads/images/saveiro.png');
  assert.equal(list[0].active, true);
});

test('Raspadinha: ignora produtos pausados e evita repetir o mesmo produto em F5 seguidos', () => {
  const cfg = {
    scratchPrizeProducts: [
      { id: 'p1', title: 'SAVEIRO CROSS', image: '/img/carro.png', active: true },
      { id: 'p2', title: 'MOTO MT-03', image: '/img/moto.png', active: true },
      { id: 'p3', title: 'IPHONE PAUSADO', image: '/img/iphone.png', active: false },
    ],
  };

  const active = getActiveScratchProducts(cfg);
  assert.equal(active.length, 2);
  assert.deepEqual(
    active.map((p) => p.id),
    ['p1', 'p2']
  );

  // Se o último F5 mostrou p1, o próximo DEVE retornar p2 (mesmo com randomFn = 0)
  const nextAfterP1 = pickRandomScratchProduct(cfg, { lastProductId: 'p1', randomFn: () => 0 });
  assert.equal(nextAfterP1.id, 'p2');

  // Se o último F5 mostrou p2, o próximo DEVE retornar p1
  const nextAfterP2 = pickRandomScratchProduct(cfg, { lastProductId: 'p2', randomFn: () => 0.99 });
  assert.equal(nextAfterP2.id, 'p1');
});

test('Raspadinha: applyProductsToOfferConfig sincroniza campos legados com o 1º produto ativo', () => {
  const updated = applyProductsToOfferConfig(
    { scratchGameMode: 'numbered' },
    [
      { id: 'p1', title: 'PAUSADO', image: '/img/off.png', active: false },
      { id: 'p2', title: 'MOTO MT-03', image: '/img/moto.png', active: true },
    ]
  );

  assert.equal(updated.scratchPrizeProducts.length, 2);
  assert.equal(updated.scratchPrizeTitle, 'MOTO MT-03');
  assert.equal(updated.scratchPrizeImage, '/img/moto.png');
});

test('Raspadinha: preserva espaços durante edição e sanitiza/remove itens vazios ao salvar', () => {
  const editing = normalizeScratchProducts({
    scratchPrizeProducts: [{ id: 'p1', title: 'MOTO ', image: '/img/moto.png', active: true }],
  });
  assert.equal(editing[0].title, 'MOTO ');

  const saved = applyProductsToOfferConfig(
    {},
    [
      { id: 'p1', title: '  MOTO MT-03  ', image: ' /img/moto.png ', active: true },
      { id: 'p2', title: '   ', image: '   ', active: true },
    ],
    { sanitize: true }
  );

  assert.equal(saved.scratchPrizeProducts.length, 1);
  assert.equal(saved.scratchPrizeProducts[0].title, 'MOTO MT-03');
  assert.equal(saved.scratchPrizeProducts[0].image, '/img/moto.png');
});
