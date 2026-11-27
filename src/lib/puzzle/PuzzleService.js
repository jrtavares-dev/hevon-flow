import { query, queryOne, execute } from '../db.js';

export class PuzzleService {
  /**
   * Retorna a campanha ativa de puzzle
   */
  static async getActiveCampaign() {
    const row = await queryOne(
      `SELECT * FROM puzzle_campaigns 
       WHERE status = 'active' 
       AND start_at <= NOW() 
       AND end_at >= NOW() 
       ORDER BY id DESC LIMIT 1`
    );
    if (row) return row;

    // Fallback: qualquer campanha com status active
    return await queryOne(`SELECT * FROM puzzle_campaigns WHERE status = 'active' ORDER BY id DESC LIMIT 1`);
  }

  /**
   * Lista todos os quebra-cabeças com progresso para um usuário/lead
   */
  static async getUserPuzzles(customerEmail = 'joao@silva.com.br', campaignId = null) {
    let sql = `
      SELECT p.*, 
        COALESCE(prog.pieces_count, 0) as pieces_owned,
        COALESCE(prog.completed, false) as is_completed,
        prog.completed_at
      FROM puzzles p
      LEFT JOIN puzzle_user_progress prog 
        ON prog.puzzle_id = p.id AND prog.customer_email = ?
      WHERE p.status = 'active'
    `;
    const params = [customerEmail];

    if (campaignId) {
      sql += ' AND p.campaign_id = ?';
      params.push(campaignId);
    }

    sql += ' ORDER BY p.priority DESC, p.id ASC';

    const rows = await query(sql, params);

    return rows.map(r => {
      const owned = Number(r.pieces_owned || 0);
      const total = Number(r.pieces_count || 9);
      const pct = total > 0 ? Math.min(100, Math.round((owned / total) * 100)) : 0;
      return {
        ...r,
        pieces_owned: owned,
        pieces_count: total,
        progress_percentage: pct,
        is_completed: Boolean(r.is_completed),
      };
    });
  }

  /**
   * Retorna os detalhes de um quebra-cabeça com todas as 9 peças e status de desbloqueio
   */
  static async getUserPuzzleView(customerEmail = 'joao@silva.com.br', puzzleId) {
    const puzzle = await queryOne(`SELECT * FROM puzzles WHERE id = ?`, [puzzleId]);
    if (!puzzle) return null;

    const pieces = await query(
      `SELECT * FROM puzzle_pieces WHERE puzzle_id = ? ORDER BY piece_number ASC`,
      [puzzleId]
    );

    const userPieces = await query(
      `SELECT DISTINCT piece_number FROM puzzle_user_pieces 
       WHERE puzzle_id = ? AND customer_email = ?`,
      [puzzleId, customerEmail]
    );

    const ownedNumbers = new Set(userPieces.map(up => Number(up.piece_number)));

    const mappedPieces = pieces.map(pc => {
      const isOwned = ownedNumbers.has(Number(pc.piece_number));
      let ruleData = null;
      try {
        ruleData = typeof pc.unlock_rule_data === 'string' ? JSON.parse(pc.unlock_rule_data) : pc.unlock_rule_data;
      } catch {}

      return {
        id: pc.id,
        piece_number: pc.piece_number,
        piece_type: pc.piece_type,
        unlock_rule_type: pc.unlock_rule_type,
        unlock_rule_data: ruleData,
        is_owned: isOwned,
      };
    });

    const ownedCount = ownedNumbers.size;
    const totalCount = Number(puzzle.pieces_count || 9);
    const progress = totalCount > 0 ? Math.min(100, Math.round((ownedCount / totalCount) * 100)) : 0;
    const isCompleted = ownedCount >= totalCount;

    return {
      puzzle: {
        ...puzzle,
        pieces_owned: ownedCount,
        progress_percentage: progress,
        is_completed: isCompleted,
      },
      pieces: mappedPieces,
    };
  }

  /**
   * Lista todos os quebra-cabeças cadastrados para o Painel Admin
   */
  static async getAllPuzzles(campaignId = null) {
    let sql = `
      SELECT p.*, c.name as campaign_name,
        (SELECT COUNT(*) FROM puzzle_rewards r WHERE r.puzzle_id = p.id) as total_rewards_claimed,
        (SELECT pp.unlock_rule_type FROM puzzle_pieces pp WHERE pp.puzzle_id = p.id AND pp.piece_number = p.pieces_count LIMIT 1) as last_piece_rule,
        (SELECT pp.unlock_rule_data FROM puzzle_pieces pp WHERE pp.puzzle_id = p.id AND pp.piece_number = p.pieces_count LIMIT 1) as last_piece_rule_data
      FROM puzzles p
      LEFT JOIN puzzle_campaigns c ON c.id = p.campaign_id
    `;
    const params = [];
    if (campaignId) {
      sql += ' WHERE p.campaign_id = ?';
      params.push(campaignId);
    }
    sql += ' ORDER BY p.id ASC';

    return await query(sql, params);
  }

  /**
   * Criação de novo quebra-cabeça
   */
  static async createPuzzle(data) {
    const res = await execute(
      `INSERT INTO puzzles 
       (campaign_id, name, description, image, prize_name, prize_value, pieces_count, distribution_weight, max_winners, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.campaign_id || 1,
        data.name,
        data.description || '',
        data.image || 'iphone.svg',
        data.prize_name,
        data.prize_value || 0,
        data.pieces_count || 9,
        data.distribution_weight || 10,
        data.max_winners || 10,
        data.status || 'active'
      ]
    );

    const puzzleId = res.insertId;
    const piecesCount = Number(data.pieces_count || 9);

    // Gerar as peças do puzzle automaticamente
    const lastRule = data.last_piece_rule || 'manual';
    const lastRuleData = data.last_piece_rule_data ? JSON.stringify(data.last_piece_rule_data) : null;
    for (let i = 1; i <= piecesCount; i++) {
      const isLast = (i === piecesCount);
      await execute(
        `INSERT INTO puzzle_pieces (puzzle_id, piece_number, piece_type, unlock_rule_type, unlock_rule_data)
         VALUES (?, ?, ?, ?, ?)`,
        [puzzleId, i, isLast ? 'special' : 'common', isLast ? lastRule : 'none', isLast ? lastRuleData : null]
      );
    }

    return puzzleId;
  }

  /**
   * Atualização de quebra-cabeça
   */
  static async updatePuzzle(id, data) {
    await execute(
      `UPDATE puzzles 
       SET name = ?, description = ?, prize_name = ?, prize_value = ?, 
           image = ?, distribution_weight = ?, max_winners = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        data.name,
        data.description,
        data.prize_name,
        data.prize_value,
        data.image || 'iphone.svg',
        data.distribution_weight,
        data.max_winners,
        data.status,
        id
      ]
    );

    if (data.last_piece_rule) {
      const ruleData = data.last_piece_rule_data ? JSON.stringify(data.last_piece_rule_data) : null;
      const targetPiecesCount = Number(data.pieces_count || 9);
      await execute(
        `UPDATE puzzle_pieces 
         SET unlock_rule_type = ?, unlock_rule_data = ?,
             piece_type = CASE WHEN ? = 'none' THEN 'common' ELSE 'special' END
         WHERE puzzle_id = ? AND piece_number = ?`,
        [data.last_piece_rule, ruleData, data.last_piece_rule, id, targetPiecesCount]
      );
    }

    if (data.image) {
      try {
        const camp = await queryOne(`SELECT id, offer_config FROM puzzle_campaigns ORDER BY (status = 'active') DESC, id DESC LIMIT 1`);
        if (camp) {
          let oc = typeof camp.offer_config === 'string' ? JSON.parse(camp.offer_config) : (camp.offer_config || {});
          oc.puzzleImage = data.image;
          await execute(
            `UPDATE puzzle_campaigns SET offer_config = ?::jsonb, updated_at = NOW() WHERE id = ?`,
            [JSON.stringify(oc), camp.id]
          );
        }
      } catch (errSync) {
        console.error('Error syncing puzzle image to campaign:', errSync);
      }
    }

    return true;
  }

  /**
   * Alterna rapidamente a liberação da peça final do quebra-cabeça (Controle rápido do Admin)
   */
  static async toggleLastPieceRule(puzzleId, ruleType = 'manual') {
    const puzzle = await queryOne(`SELECT pieces_count FROM puzzles WHERE id = ?`, [puzzleId]);
    const piecesCount = Number(puzzle?.pieces_count || 9);
    await execute(
      `UPDATE puzzle_pieces 
       SET unlock_rule_type = ?,
           piece_type = CASE WHEN ? = 'none' THEN 'common' ELSE 'special' END
       WHERE puzzle_id = ? AND piece_number = ?`,
      [ruleType, ruleType, puzzleId, piecesCount]
    );
    return true;
  }

  /**
   * Atualiza a regra especial de uma peça
   */
  static async updatePieceRule(pieceId, ruleType, ruleData) {
    const jsonStr = ruleData ? JSON.stringify(ruleData) : null;
    return await execute(
      `UPDATE puzzle_pieces 
       SET unlock_rule_type = ?, unlock_rule_data = ?::jsonb, 
           piece_type = CASE WHEN ? = 'none' THEN 'common' ELSE 'special' END
       WHERE id = ?`,
      [ruleType, jsonStr, ruleType, pieceId]
    );
  }

  /**
   * Atualiza as configurações da campanha e orçamento diário
   */
  static async updateCampaign(id, data) {
    const ruleData = typeof data.eligibility_rule_data === 'object'
      ? JSON.stringify(data.eligibility_rule_data)
      : (data.eligibility_rule_data || '{"threshold": 25.00, "allow_duplicates": false}');

    const offerConfigJson = data.offer_config !== undefined
      ? (typeof data.offer_config === 'object' ? JSON.stringify(data.offer_config) : data.offer_config)
      : null;

    if (offerConfigJson !== null) {
      const res = await execute(
        `UPDATE puzzle_campaigns 
         SET name = ?, description = ?, daily_budget = ?, total_budget = ?, 
             eligibility_rule_type = ?, eligibility_rule_data = ?::jsonb, 
             offer_config = ?::jsonb,
             status = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          data.name,
          data.description || '',
          parseFloat(data.daily_budget) || 2000.00,
          parseFloat(data.total_budget) || 50000.00,
          data.eligibility_rule_type || 'accumulated_value',
          ruleData,
          offerConfigJson,
          data.status || 'active',
          id
        ]
      );

      const parsedOc = typeof data.offer_config === 'string' ? JSON.parse(data.offer_config) : data.offer_config;
      const targetImg = parsedOc?.puzzleImage || parsedOc?.image;
      if (targetImg) {
        try {
          await execute(
            `UPDATE puzzles SET image = ?, updated_at = NOW() WHERE campaign_id = ? OR status = 'active'`,
            [targetImg, id]
          );
        } catch (syncErr) {
          console.error('Error syncing puzzle image in puzzles table:', syncErr);
        }
      }

      return res;
    }

    return await execute(
      `UPDATE puzzle_campaigns 
       SET name = ?, description = ?, daily_budget = ?, total_budget = ?, 
           eligibility_rule_type = ?, eligibility_rule_data = ?::jsonb, 
           status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        data.name,
        data.description || '',
        parseFloat(data.daily_budget) || 2000.00,
        parseFloat(data.total_budget) || 50000.00,
        data.eligibility_rule_type || 'accumulated_value',
        ruleData,
        data.status || 'active',
        id
      ]
    );
  }

  /**
   * Métricas gerais para o Dashboard Admin do Puzzle
   */
  static async getPuzzleStats(campaignId = 1) {
    try {
      const partStats = await queryOne(
        `SELECT 
           COUNT(*) as total_drops,
           COUNT(DISTINCT customer_email) as unique_collectors
         FROM puzzle_participations`
      );
      const rewStats = await queryOne(
        `SELECT 
           COUNT(*) as total_rewards_claimed,
           COALESCE(SUM(prize_value), 0) as total_value_awarded
         FROM puzzle_rewards`
      );
      return {
        total_drops: Number(partStats?.total_drops || 0),
        unique_collectors: Number(partStats?.unique_collectors || 0),
        total_rewards: Number(rewStats?.total_rewards_claimed || 0),
        total_value: Number(rewStats?.total_value_awarded || 0),
      };
    } catch {
      return { total_drops: 0, unique_collectors: 0, total_rewards: 0, total_value: 0 };
    }
  }

  /**
   * Histórico das últimas figurinhas/prêmios entregues
   */
  static async getRecentDrops(limit = 10) {
    try {
      const rows = await query(
        `SELECT r.id, r.customer_email, r.customer_name, r.prize_name, r.prize_value, r.reward_code, r.status, r.created_at, p.name as puzzle_name, p.image
         FROM puzzle_rewards r
         LEFT JOIN puzzles p ON p.id = r.puzzle_id
         ORDER BY r.id DESC LIMIT ?`,
        [limit]
      );
      return rows || [];
    } catch {
      return [];
    }
  }

  /**
   * Deleta um quebra-cabeça
   */
  static async deletePuzzle(id) {
    return await execute(`DELETE FROM puzzles WHERE id = ?`, [id]);
  }
}
