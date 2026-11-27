import { query, queryOne, execute } from '../db.js';

export class RewardService {
  /**
   * Lista os prêmios conquistados por um usuário
   */
  static async getUserRewards(customerEmail = 'joao@silva.com.br') {
    return await query(
      `SELECT r.*, p.name as puzzle_name, p.image as puzzle_image
       FROM puzzle_rewards r
       JOIN puzzles p ON p.id = r.puzzle_id
       WHERE r.customer_email = ?
       ORDER BY r.id DESC`,
      [customerEmail]
    );
  }

  /**
   * Lista todos os prêmios para a gestão no painel de administração
   */
  static async getAllRewards(status = null) {
    let sql = `
      SELECT r.*, p.name as puzzle_name, p.image as puzzle_image
      FROM puzzle_rewards r
      JOIN puzzles p ON p.id = r.puzzle_id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.id DESC';

    return await query(sql, params);
  }

  /**
   * Resgate de prêmio pelo usuário (envio de chave PIX ou endereço físico)
   */
  static async claimReward({ rewardId, customerEmail, claimType = 'pix', pixKey = '', shippingAddress = '' }) {
    const reward = await queryOne(
      `SELECT * FROM puzzle_rewards WHERE id = ? AND customer_email = ? LIMIT 1`,
      [rewardId, customerEmail]
    );

    if (!reward) {
      throw new Error('Prêmio não encontrado ou não pertence a este usuário.');
    }

    if (reward.status !== 'pending' && reward.status !== 'claimed') {
      throw new Error(`Este prêmio já está com status "${reward.status}".`);
    }

    await execute(
      `UPDATE puzzle_rewards 
       SET claim_type = ?, pix_key = ?, shipping_address = ?, status = 'claimed', updated_at = NOW()
       WHERE id = ?`,
      [claimType, pixKey, shippingAddress, rewardId]
    );

    return {
      success: true,
      message: 'Solicitação de resgate enviada com sucesso! Nossa equipe analisará e fará o envio/pagamento.',
    };
  }

  /**
   * Atualização de status pelo Admin (Aprovado, Pago/Enviado, Rejeitado)
   */
  static async updateRewardStatus(rewardId, status, notes = '') {
    return await execute(
      `UPDATE puzzle_rewards 
       SET status = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, notes, rewardId]
    );
  }
}
