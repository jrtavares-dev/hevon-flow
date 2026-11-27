import { query, queryOne, execute } from '../db.js';
import { DistributionEngine } from '../puzzle/DistributionEngine.js';
import { PuzzleService } from '../puzzle/PuzzleService.js';

const activeWheelCache = globalThis._activeWheelCache || (globalThis._activeWheelCache = { timestamp: 0, data: null });
const WHEEL_CACHE_TTL_MS = 10 * 1000; // 10 segundos

export class WheelService {
  static clearActiveWheelCache() {
    activeWheelCache.data = null;
    activeWheelCache.timestamp = 0;
  }

  /**
   * Retorna a roleta ativa e suas fatias ordenadas (em cache de memória de alta performance)
   */
  static async getActiveWheel() {
    if (activeWheelCache.data && (Date.now() - activeWheelCache.timestamp < WHEEL_CACHE_TTL_MS)) {
      return activeWheelCache.data;
    }

    const wheel = await queryOne(
      `SELECT * FROM wheel_campaigns WHERE status = 'active' ORDER BY id DESC LIMIT 1`
    );
    if (!wheel) return null;

    const slices = await query(
      `SELECT * FROM wheel_slices WHERE wheel_id = ? AND status = 'active' ORDER BY slice_index ASC`,
      [wheel.id]
    );

    const result = {
      ...wheel,
      slices: slices || [],
    };
    activeWheelCache.data = result;
    activeWheelCache.timestamp = Date.now();
    return result;
  }

  /**
   * Retorna os detalhes completos da roleta para o Admin (mesmo inativa)
   */
  static async getWheelForAdmin(wheelId = null) {
    let wheel = null;
    if (wheelId) {
      wheel = await queryOne(`SELECT * FROM wheel_campaigns WHERE id = ?`, [wheelId]);
    } else {
      wheel = await queryOne(`SELECT * FROM wheel_campaigns ORDER BY id DESC LIMIT 1`);
    }

    if (!wheel) return null;

    const slices = await query(
      `SELECT * FROM wheel_slices WHERE wheel_id = ? ORDER BY slice_index ASC`,
      [wheel.id]
    );

    const stats = await queryOne(
      `SELECT 
         COUNT(*) as total_spins,
         COUNT(DISTINCT customer_email) as unique_players,
         COALESCE(SUM(CASE WHEN reward_type = 'cash_pix' THEN reward_value ELSE 0 END), 0) as total_cash_awarded,
         COALESCE(SUM(CASE WHEN reward_type IN ('discount_percentage', 'discount_fixed') THEN 1 ELSE 0 END), 0) as total_coupons_awarded
       FROM wheel_spins WHERE wheel_id = ?`,
      [wheel.id]
    );

    return {
      ...wheel,
      slices: slices || [],
      stats: {
        total_spins: Number(stats?.total_spins || 0),
        unique_players: Number(stats?.unique_players || 0),
        total_cash_awarded: Number(stats?.total_cash_awarded || 0),
        total_coupons_awarded: Number(stats?.total_coupons_awarded || 0),
      },
    };
  }

  /**
   * Atualiza configurações principais da Roleta
   */
  static async updateWheel(id, data) {
    const offerConfigJson = data.offer_config !== undefined
      ? (typeof data.offer_config === 'object' ? JSON.stringify(data.offer_config) : data.offer_config)
      : null;

    let res;
    if (offerConfigJson !== null) {
      res = await execute(
        `UPDATE wheel_campaigns 
         SET name = ?, description = ?, trigger_type = ?, theme = ?, 
             daily_budget = ?, offer_config = ?::jsonb, status = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          data.name,
          data.description || '',
          data.trigger_type || 'post_purchase',
          data.theme || 'gold_dark',
          parseFloat(data.daily_budget) || 1000.00,
          offerConfigJson,
          data.status || 'active',
          id
        ]
      );
    } else {
      res = await execute(
        `UPDATE wheel_campaigns 
         SET name = ?, description = ?, trigger_type = ?, theme = ?, 
             daily_budget = ?, status = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          data.name,
          data.description || '',
          data.trigger_type || 'post_purchase',
          data.theme || 'gold_dark',
          parseFloat(data.daily_budget) || 1000.00,
          data.status || 'active',
          id
        ]
      );
    }
    WheelService.clearActiveWheelCache();
    return res;
  }

  /**
   * Atualiza uma fatia específica
   */
  static async updateSlice(sliceId, data) {
    return await execute(
      `UPDATE wheel_slices 
       SET label = ?, sublabel = ?, reward_type = ?, reward_value = ?, 
           color_bg = ?, color_text = ?, icon = ?, weight = ?, status = ?
       WHERE id = ?`,
      [
        data.label,
        data.sublabel || '',
        data.reward_type,
        parseFloat(data.reward_value) || 0,
        data.color_bg || '#10b981',
        data.color_text || '#ffffff',
        data.icon || 'gift',
        parseInt(data.weight) || 10,
        data.status || 'active',
        sliceId
      ]
    );
    WheelService.clearActiveWheelCache();
    return res;
  }

  /**
   * Adiciona nova fatia
   */
  static async addSlice(wheelId, data) {
    const countRes = await queryOne(`SELECT COUNT(*) as cnt FROM wheel_slices WHERE wheel_id = ?`, [wheelId]);
    const nextIndex = Number(countRes?.cnt || 0);

    return await execute(
      `INSERT INTO wheel_slices 
       (wheel_id, slice_index, label, sublabel, reward_type, reward_value, color_bg, color_text, icon, weight, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        wheelId,
        nextIndex,
        data.label,
        data.sublabel || '',
        data.reward_type,
        parseFloat(data.reward_value) || 0,
        data.color_bg || '#10b981',
        data.color_text || '#ffffff',
        data.icon || 'gift',
        parseInt(data.weight) || 10
      ]
    );
  }

  /**
   * Exclui uma fatia e reordena os índices
   */
  static async deleteSlice(sliceId, wheelId) {
    await execute(`DELETE FROM wheel_slices WHERE id = ?`, [sliceId]);

    // Reordenar
    const remaining = await query(
      `SELECT id FROM wheel_slices WHERE wheel_id = ? ORDER BY slice_index ASC, id ASC`,
      [wheelId]
    );

    for (let idx = 0; idx < remaining.length; idx++) {
      await execute(`UPDATE wheel_slices SET slice_index = ? WHERE id = ?`, [idx, remaining[idx].id]);
    }
  }

  /**
   * Processa o Giro da Roleta com seleção ponderada e controle de orçamento
   */
  static async spinWheel({ customer_email, customer_name = 'Comprador', wheel_id = null }) {
    let wheel = null;
    if (wheel_id) {
      wheel = await queryOne(`SELECT * FROM wheel_campaigns WHERE id = ? AND status = 'active'`, [wheel_id]);
    } else {
      wheel = await queryOne(`SELECT * FROM wheel_campaigns WHERE status = 'active' ORDER BY id DESC LIMIT 1`);
    }

    if (!wheel) {
      throw new Error('Nenhuma roleta ativa no momento.');
    }

    const slices = await query(
      `SELECT * FROM wheel_slices WHERE wheel_id = ? AND status = 'active' ORDER BY slice_index ASC`,
      [wheel.id]
    );

    if (!slices || slices.length === 0) {
      throw new Error('A roleta não possui fatias ativas configuradas.');
    }

    // 1. Verificar Orçamento Diário (Budget Lock)
    const today = new Date().toISOString().split('T')[0];
    if (wheel.last_reset_date !== today) {
      await execute(
        `UPDATE wheel_campaigns SET current_daily_awarded = 0.00, last_reset_date = ? WHERE id = ?`,
        [today, wheel.id]
      );
      wheel.current_daily_awarded = 0.00;
    }

    const dailyBudget = parseFloat(wheel.daily_budget || 1000);
    const currentDaily = parseFloat(wheel.current_daily_awarded || 0);

    // Filtrar fatias cujo custo em dinheiro não exceda o orçamento restante
    let eligiblePool = slices.filter((s) => {
      if (s.reward_type === 'cash_pix') {
        return (currentDaily + parseFloat(s.reward_value)) <= dailyBudget;
      }
      return true;
    });

    if (eligiblePool.length === 0) {
      eligiblePool = slices.filter(s => s.reward_type !== 'cash_pix');
    }

    // 2. Sorteio Ponderado por 'weight'
    const totalWeight = eligiblePool.reduce((acc, curr) => acc + Math.max(1, Number(curr.weight || 10)), 0);
    let randomVal = Math.random() * totalWeight;
    let selectedSlice = eligiblePool[0];

    for (const slice of eligiblePool) {
      const weight = Math.max(1, Number(slice.weight || 10));
      if (randomVal <= weight) {
        selectedSlice = slice;
        break;
      }
      randomVal -= weight;
    }

    // 3. Atualizar consumo de orçamento diário se for prêmio financeiro
    if (selectedSlice.reward_type === 'cash_pix' && parseFloat(selectedSlice.reward_value) > 0) {
      await execute(
        `UPDATE wheel_campaigns SET current_daily_awarded = current_daily_awarded + ? WHERE id = ?`,
        [parseFloat(selectedSlice.reward_value), wheel.id]
      );
    }

    // 4. Gerar Cupom Único se for desconto
    const couponCode = selectedSlice.reward_type.startsWith('discount')
      ? `SPIN-${Math.floor(selectedSlice.reward_value)}OFF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      : null;

    // 5. Integração com Puzzle: Conceder peça se o prêmio for peça de quebra-cabeça!
    let puzzleAwarded = null;
    if (selectedSlice.reward_type === 'puzzle_pieces' || selectedSlice.reward_type === 'puzzle_special_piece') {
      try {
        const count = Number(selectedSlice.reward_value || 1);
        for (let i = 0; i < count; i++) {
          puzzleAwarded = await DistributionEngine.processParticipation({
            customer_email,
            customer_name,
            amount: 50.0,
            source: 'wheel_spin',
          });
        }
      } catch (err) {
        console.warn('Integração Puzzle no giro da roleta:', err.message);
      }
    }

    // 6. Registrar o giro em wheel_spins
    const spinLog = await execute(
      `INSERT INTO wheel_spins 
       (wheel_id, slice_id, customer_name, customer_email, reward_type, reward_value, reward_label, coupon_code, claimed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        wheel.id,
        selectedSlice.id,
        customer_name,
        customer_email,
        selectedSlice.reward_type,
        parseFloat(selectedSlice.reward_value) || 0,
        selectedSlice.label,
        couponCode,
        selectedSlice.reward_type === 'no_prize'
      ]
    );

    // 7. Calcular o Ângulo Exato para o Ponteiro (Física Visual)
    // Número total de fatias
    const totalSlices = slices.length;
    const arcDegrees = 360 / totalSlices;
    // O ponteiro fica no topo (270 graus ou 0 graus dependendo do canvas).
    // Para a fatia selectedSlice.slice_index parar no ponteiro:
    const sliceIndex = Number(selectedSlice.slice_index);
    const sliceCenterAngle = (sliceIndex * arcDegrees) + (arcDegrees / 2);
    // 5 voltas completas (1800 deg) + offset exato para centralizar a fatia no ponteiro superior
    const baseRotations = 360 * 5; 
    // Ajuste de parada no topo (270 graus padrão de ponteiro de roleta)
    const targetStopAngle = baseRotations + (360 - sliceCenterAngle + 270) % 360;

    return {
      spin_id: spinLog.insertId,
      slice_index: sliceIndex,
      slice_id: selectedSlice.id,
      label: selectedSlice.label,
      sublabel: selectedSlice.sublabel,
      reward_type: selectedSlice.reward_type,
      reward_value: parseFloat(selectedSlice.reward_value),
      color_bg: selectedSlice.color_bg,
      color_text: selectedSlice.color_text,
      coupon_code: couponCode,
      target_stop_angle: targetStopAngle,
      puzzle_awarded: puzzleAwarded,
      message: `Você ganhou: ${selectedSlice.label}!`,
    };
  }

  /**
   * Retorna os últimos giros registrados
   */
  static async getRecentSpins(wheelId = null, limit = 15) {
    let sql = `
      SELECT s.*, w.name as wheel_name 
      FROM wheel_spins s
      JOIN wheel_campaigns w ON w.id = s.wheel_id
    `;
    const params = [];
    if (wheelId) {
      sql += ' WHERE s.wheel_id = ?';
      params.push(wheelId);
    }
    sql += ' ORDER BY s.id DESC LIMIT ?';
    params.push(limit);

    return await query(sql, params);
  }
}
