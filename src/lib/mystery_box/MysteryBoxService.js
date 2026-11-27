import { query, queryOne, execute, isPostgres } from '../db.js';
import { DistributionEngine } from '../puzzle/DistributionEngine.js';
import { PuzzleService } from '../puzzle/PuzzleService.js';

export class MysteryBoxService {
  /**
   * Retorna a campanha ativa da Caixa Misteriosa e seus prêmios ordenados por peso
   */
  static async getActiveCampaign(slug = 'caixa-misteriosa-oficial') {
    const campaign = await queryOne(
      `SELECT * FROM mystery_box_campaigns WHERE slug = ? AND status = 'active' LIMIT 1`,
      [slug]
    );
    if (!campaign) return null;

    const prizes = await query(
      `SELECT * FROM mystery_box_prizes WHERE campaign_id = ? AND status = 'active' ORDER BY weight DESC, id ASC`,
      [campaign.id]
    );

    return {
      ...campaign,
      prizes: prizes || [],
    };
  }

  /**
   * Retorna dados completos para o Admin (métricas, prêmios e limites)
   */
  static async getCampaignForAdmin(campaignId = null) {
    let campaign = null;
    if (campaignId) {
      campaign = await queryOne(`SELECT * FROM mystery_box_campaigns WHERE id = ?`, [campaignId]);
    } else {
      campaign = await queryOne(`SELECT * FROM mystery_box_campaigns ORDER BY id DESC LIMIT 1`);
    }

    if (!campaign) return null;

    const prizes = await query(
      `SELECT * FROM mystery_box_prizes WHERE campaign_id = ? ORDER BY weight DESC, id ASC`,
      [campaign.id]
    );

    const stats = await queryOne(
      `SELECT 
         COUNT(*) as total_plays,
         COUNT(DISTINCT customer_email) as unique_players,
         COALESCE(SUM(CASE WHEN reward_type = 'cash_pix' THEN reward_value ELSE 0 END), 0) as total_cash_awarded,
         COALESCE(SUM(CASE WHEN reward_type IN ('discount_percentage', 'discount_fixed') THEN 1 ELSE 0 END), 0) as total_coupons_awarded
       FROM mystery_box_plays WHERE campaign_id = ?`,
      [campaign.id]
    );

    return {
      ...campaign,
      prizes: prizes || [],
      stats: {
        total_plays: Number(stats?.total_plays || 0),
        unique_players: Number(stats?.unique_players || 0),
        total_cash_awarded: Number(stats?.total_cash_awarded || 0),
        total_coupons_awarded: Number(stats?.total_coupons_awarded || 0),
      },
    };
  }

  /**
   * Histórico das últimas jogadas para auditoria
   */
  static async getRecentPlays(campaignId = null, limit = 20) {
    const sql = campaignId
      ? `SELECT * FROM mystery_box_plays WHERE campaign_id = ? ORDER BY id DESC LIMIT ${parseInt(limit)}`
      : `SELECT * FROM mystery_box_plays ORDER BY id DESC LIMIT ${parseInt(limit)}`;
    const params = campaignId ? [campaignId] : [];
    const rows = await query(sql, params);
    return rows || [];
  }

  /**
   * Atualização das configurações da campanha
   */
  static async updateCampaign(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.trigger_type !== undefined) { fields.push('trigger_type = ?'); values.push(data.trigger_type); }
    if (data.box_theme !== undefined) { fields.push('box_theme = ?'); values.push(data.box_theme); }
    if (data.daily_budget !== undefined) { fields.push('daily_budget = ?'); values.push(parseFloat(data.daily_budget)); }
    if (data.offer_config !== undefined) {
      fields.push('offer_config = ?::jsonb');
      values.push(typeof data.offer_config === 'object' ? JSON.stringify(data.offer_config) : data.offer_config);
    }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return false;

    values.push(id);
    await execute(
      `UPDATE mystery_box_campaigns SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    return true;
  }

  /**
   * Atualiza um prêmio
   */
  static async updatePrize(prizeId, data) {
    const fields = [];
    const values = [];

    if (data.label !== undefined) { fields.push('label = ?'); values.push(data.label); }
    if (data.symbol !== undefined) { fields.push('symbol = ?'); values.push(data.symbol); }
    if (data.reward_type !== undefined) { fields.push('reward_type = ?'); values.push(data.reward_type); }
    if (data.reward_value !== undefined) { fields.push('reward_value = ?'); values.push(parseFloat(data.reward_value)); }
    if (data.weight !== undefined) { fields.push('weight = ?'); values.push(parseInt(data.weight)); }
    if (data.max_daily_winners !== undefined) { fields.push('max_daily_winners = ?'); values.push(parseInt(data.max_daily_winners)); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return false;

    values.push(prizeId);
    await execute(`UPDATE mystery_box_prizes SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  /**
   * Adiciona um novo prêmio
   */
  static async addPrize(campaignId, data) {
    await execute(
      `INSERT INTO mystery_box_prizes (campaign_id, label, symbol, reward_type, reward_value, weight, max_daily_winners, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        campaignId,
        data.label || 'Novo Prêmio',
        data.symbol || '🎁',
        data.reward_type || 'discount_percentage',
        parseFloat(data.reward_value || 10),
        parseInt(data.weight || 10),
        parseInt(data.max_daily_winners || 999),
      ]
    );
    return true;
  }

  /**
   * Remove um prêmio
   */
  static async deletePrize(prizeId) {
    await execute(`DELETE FROM mystery_box_prizes WHERE id = ?`, [prizeId]);
    return true;
  }

  /**
   * Executa a abertura de 1 entre as 3 caixas:
   * - O cliente escolhe `chosen_box_index` (0, 1 ou 2).
   * - O algoritmo sorteia o prêmio vencedor de acordo com probabilidades e orçamento.
   * - O algoritmo seleciona 2 outros prêmios secundários para colocar nas outras 2 caixas
   *   (efeito de "Você teve sorte!", mostrando o que tinha nas outras).
   */
  static async openBox({ campaign_id, customer_email, customer_name = 'Comprador', chosen_box_index = 1 }) {
    let campaign = null;
    if (campaign_id) {
      campaign = await queryOne(`SELECT * FROM mystery_box_campaigns WHERE id = ?`, [campaign_id]);
    } else {
      campaign = await queryOne(`SELECT * FROM mystery_box_campaigns WHERE status = 'active' ORDER BY id DESC LIMIT 1`);
    }

    if (!campaign) {
      throw new Error('Nenhuma campanha de Caixa Misteriosa ativa encontrada.');
    }

    // Reset diário de budget se virou o dia
    const today = new Date().toISOString().split('T')[0];
    const lastReset = campaign.last_reset_date ? new Date(campaign.last_reset_date).toISOString().split('T')[0] : null;
    if (lastReset !== today) {
      await execute(
        `UPDATE mystery_box_campaigns SET current_daily_awarded = 0, last_reset_date = CURRENT_DATE WHERE id = ?`,
        [campaign.id]
      );
      await execute(
        `UPDATE mystery_box_prizes SET current_daily_winners = 0 WHERE campaign_id = ?`,
        [campaign.id]
      );
      campaign.current_daily_awarded = 0;
    }

    const prizes = await query(
      `SELECT * FROM mystery_box_prizes WHERE campaign_id = ? AND status = 'active' ORDER BY weight DESC`,
      [campaign.id]
    );

    if (!prizes || prizes.length === 0) {
      throw new Error('Nenhum prêmio ativo configurado para esta Caixa Misteriosa.');
    }

    // Filtrar elegíveis respeitando teto de orçamento
    const currentDaily = parseFloat(campaign.current_daily_awarded || 0);
    const dailyBudget = parseFloat(campaign.daily_budget || 1000);

    const eligiblePrizes = prizes.filter((p) => {
      if (p.max_daily_winners && p.current_daily_winners >= p.max_daily_winners) {
        return false;
      }
      if (p.reward_type === 'cash_pix') {
        if (currentDaily + parseFloat(p.reward_value || 0) > dailyBudget) {
          return false;
        }
      }
      return true;
    });

    const pool = eligiblePrizes.length > 0 ? eligiblePrizes : prizes.filter(p => p.reward_type !== 'cash_pix');

    // Sorteio Ponderado da Caixa Escolhida
    const totalWeight = pool.reduce((acc, curr) => acc + (curr.weight || 1), 0);
    let randomNum = Math.random() * totalWeight;
    let winningPrize = pool[0];

    for (const p of pool) {
      randomNum -= (p.weight || 1);
      if (randomNum <= 0) {
        winningPrize = p;
        break;
      }
    }

    // Selecionar 2 prêmios diferentes para as outras 2 caixas (efeito de revelação pós-abertura)
    const otherPrizes = prizes.filter(p => p.id !== winningPrize.id);
    const altPrize1 = otherPrizes[0] || winningPrize;
    const altPrize2 = otherPrizes[1] || otherPrizes[0] || winningPrize;

    // Gerar Código de Cupom Único
    const shortRand = Math.random().toString(36).substring(2, 7).toUpperCase();
    let couponPrefix = 'BOX';
    if (winningPrize.reward_type === 'discount_percentage') {
      couponPrefix = `BOX-${Math.round(winningPrize.reward_value)}OFF`;
    } else if (winningPrize.reward_type === 'discount_fixed') {
      couponPrefix = `BOX-R$${Math.round(winningPrize.reward_value)}`;
    } else if (winningPrize.reward_type === 'free_shipping') {
      couponPrefix = 'BOX-FRETE';
    } else if (winningPrize.reward_type === 'cash_pix') {
      couponPrefix = `PIX-${Math.round(winningPrize.reward_value)}`;
    } else {
      couponPrefix = 'PUZZLE-BOX';
    }
    const couponCode = `${couponPrefix}-${shortRand}`;

    // Montar os 3 dados de caixas (índices 0, 1 e 2)
    const validChosenIndex = Math.min(2, Math.max(0, parseInt(chosen_box_index) || 0));
    const boxesData = [
      { index: 0, theme: 'gold', label: 'Caixa Dourada VIP' },
      { index: 1, theme: 'ruby', label: 'Caixa Rubi Mágica' },
      { index: 2, theme: 'emerald', label: 'Caixa Esmeralda Secreta' },
    ];

    let altIndex = 0;
    const alts = [altPrize1, altPrize2];

    const finalBoxes = boxesData.map((box, idx) => {
      if (idx === validChosenIndex) {
        return {
          ...box,
          is_chosen: true,
          prize: {
            id: winningPrize.id,
            label: winningPrize.label,
            symbol: winningPrize.symbol,
            reward_type: winningPrize.reward_type,
            reward_value: winningPrize.reward_value,
          },
        };
      } else {
        const alt = alts[altIndex % alts.length];
        altIndex++;
        return {
          ...box,
          is_chosen: false,
          prize: {
            id: alt.id,
            label: alt.label,
            symbol: alt.symbol,
            reward_type: alt.reward_type,
            reward_value: alt.reward_value,
          },
        };
      }
    });

    // Se o prêmio for de peças de quebra-cabeça, conceder ao usuário no banco
    let puzzleAwarded = null;
    if (winningPrize.reward_type === 'puzzle_pieces') {
      try {
        const piecesToGrant = Math.max(1, Math.round(winningPrize.reward_value || 1));
        puzzleAwarded = { count: piecesToGrant };
        for (let k = 0; k < piecesToGrant; k++) {
          await DistributionEngine.processParticipation({
            customerEmail: customer_email,
            customerName: customer_name,
            externalReference: `box_${Date.now()}_${k}_${Math.random()}`,
            source: 'mystery_box',
          });
        }
      } catch (e) {
        console.error('Erro ao conceder peças de puzzle via Caixa Misteriosa:', e);
      }
    }

    // Atualizar métricas de winners e budget
    if (winningPrize.reward_type === 'cash_pix') {
      await execute(
        `UPDATE mystery_box_campaigns SET current_daily_awarded = current_daily_awarded + ? WHERE id = ?`,
        [winningPrize.reward_value, campaign.id]
      );
    }
    await execute(
      `UPDATE mystery_box_prizes SET current_daily_winners = current_daily_winners + 1 WHERE id = ?`,
      [winningPrize.id]
    );

    // Salvar no banco
    const isPg = isPostgres();
    let playId = null;

    if (isPg) {
      const insertSql = `
        INSERT INTO mystery_box_plays (
          campaign_id, customer_name, customer_email, chosen_box_index,
          boxes_data, winning_prize_id, reward_type, reward_value, reward_label, coupon_code, claimed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)
        RETURNING id
      `;
      const res = await query(insertSql, [
        campaign.id,
        customer_name,
        customer_email,
        validChosenIndex,
        JSON.stringify(finalBoxes),
        winningPrize.id,
        winningPrize.reward_type,
        winningPrize.reward_value,
        winningPrize.label,
        couponCode,
      ]);
      playId = res[0]?.id;
    } else {
      const res = await execute(
        `INSERT INTO mystery_box_plays (
          campaign_id, customer_name, customer_email, chosen_box_index,
          boxes_data, winning_prize_id, reward_type, reward_value, reward_label, coupon_code, claimed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
        [
          campaign.id,
          customer_name,
          customer_email,
          validChosenIndex,
          JSON.stringify(finalBoxes),
          winningPrize.id,
          winningPrize.reward_type,
          winningPrize.reward_value,
          winningPrize.label,
          couponCode,
        ]
      );
      playId = res?.insertId;
    }

    return {
      play_id: playId,
      chosen_box_index: validChosenIndex,
      boxes: finalBoxes,
      winning_prize: {
        id: winningPrize.id,
        label: winningPrize.label,
        symbol: winningPrize.symbol,
        reward_type: winningPrize.reward_type,
        reward_value: winningPrize.reward_value,
      },
      coupon_code: couponCode,
      puzzle_awarded: puzzleAwarded,
      message: `Você abriu a ${finalBoxes[validChosenIndex].label} e revelou: [${winningPrize.label}]!`,
    };
  }

  /**
   * Resgata o prêmio
   */
  static async claimPrize(playId) {
    if (!playId) return false;
    await execute(`UPDATE mystery_box_plays SET claimed = TRUE WHERE id = ?`, [playId]);
    return true;
  }
}
