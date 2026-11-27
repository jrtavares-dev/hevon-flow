import { query, queryOne, execute } from '../db.js';
import { PuzzleService } from './PuzzleService.js';

export class DistributionEngine {
  /**
   * Processa uma participação e concede uma nova peça do quebra-cabeça
   */
  static async processParticipation({
    customerEmail = 'joao@silva.com.br',
    customerName = 'João da Silva',
    customerCpf = '',
    customerPhone = '',
    amount = 50.00,
    externalReference,
    campaignId = null,
    source = 'web_checkout',
    targetPuzzleId = null,
  }) {
    // 1. Idempotência: verificar se a referência externa já foi processada
    const existing = await queryOne(
      `SELECT * FROM puzzle_participations WHERE external_reference = ? LIMIT 1`,
      [externalReference]
    );

    if (existing && existing.processed) {
      return {
        success: true,
        is_idempotent: true,
        message: 'Participação já processada anteriormente.',
        participation_id: existing.id,
      };
    }

    // 2. Obter Campanha Ativa
    let campaign = null;
    if (campaignId) {
      campaign = await queryOne(`SELECT * FROM puzzle_campaigns WHERE id = ?`, [campaignId]);
    } else {
      campaign = await PuzzleService.getActiveCampaign();
    }

    if (!campaign || campaign.status !== 'active') {
      throw new Error('Nenhuma campanha de quebra-cabeça ativa no momento.');
    }

    const validCampaignId = campaign.id;

    // 3. Obter Quebra-cabeças Disponíveis
    const activePuzzles = await query(
      `SELECT * FROM puzzles 
       WHERE campaign_id = ? AND status = 'active' 
       ORDER BY priority DESC, id ASC`,
      [validCampaignId]
    );

    if (!activePuzzles || activePuzzles.length === 0) {
      throw new Error('Não há quebra-cabeças ativos disponíveis nesta campanha.');
    }

    // Filtrar puzzles que ainda não atingiram o limite máximo de ganhadores
    const availablePuzzles = activePuzzles.filter(
      p => Number(p.current_winners || 0) < Number(p.max_winners || 9999)
    );

    if (availablePuzzles.length === 0) {
      throw new Error('Todos os prêmios ativos já atingiram o limite máximo de ganhadores.');
    }

    // 4. Selecionar Quebra-Cabeça (por alvo ou sorteio ponderado)
    let selectedPuzzle = null;
    if (targetPuzzleId) {
      selectedPuzzle = availablePuzzles.find(p => Number(p.id) === Number(targetPuzzleId));
    }

    if (!selectedPuzzle) {
      // Priorizar puzzles incompletos do usuário
      const incompletePuzzles = [];
      for (const p of availablePuzzles) {
        const prog = await queryOne(
          `SELECT completed FROM puzzle_user_progress 
           WHERE customer_email = ? AND puzzle_id = ? LIMIT 1`,
          [customerEmail, p.id]
        );
        if (!prog || !prog.completed) {
          incompletePuzzles.push(p);
        }
      }

      const pool = incompletePuzzles.length > 0 ? incompletePuzzles : availablePuzzles;

      // Sorteio Ponderado por distribution_weight
      const totalWeight = pool.reduce((acc, curr) => acc + Math.max(1, Number(curr.distribution_weight || 10)), 0);
      let randomVal = Math.random() * totalWeight;

      for (const p of pool) {
        const weight = Math.max(1, Number(p.distribution_weight || 10));
        if (randomVal <= weight) {
          selectedPuzzle = p;
          break;
        }
        randomVal -= weight;
      }

      if (!selectedPuzzle) selectedPuzzle = pool[0];
    }

    // 5. Selecionar a Peça a ser entregue para o usuário
    const allPieces = await query(
      `SELECT * FROM puzzle_pieces WHERE puzzle_id = ? ORDER BY piece_number ASC`,
      [selectedPuzzle.id]
    );

    const userOwnedPieces = await query(
      `SELECT DISTINCT piece_number FROM puzzle_user_pieces 
       WHERE puzzle_id = ? AND customer_email = ?`,
      [selectedPuzzle.id, customerEmail]
    );

    const ownedSet = new Set(userOwnedPieces.map(up => Number(up.piece_number)));
    const unownedPieces = allPieces.filter(pc => !ownedSet.has(Number(pc.piece_number)));

    let selectedPiece = null;
    let isDuplicate = false;

    // Contar total de participações anteriores do usuário
    const partCountRow = await queryOne(
      `SELECT COUNT(*) as count FROM puzzle_participations WHERE customer_email = ?`,
      [customerEmail]
    );
    const userParticipationCount = Number(partCountRow?.count || 0) + 1;

    // Filtrar peças elegíveis (respeitar regras especiais de peças raras)
    const eligibleUnowned = unownedPieces.filter(pc => {
      if (pc.piece_type === 'special') {
        // Se a regra for manual/bloqueada, a última peça NUNCA sai por sorte comum (controle 100% do admin)
        if (pc.unlock_rule_type === 'manual' || pc.unlock_rule_type === 'locked') {
          return false;
        }

        if (pc.unlock_rule_type === 'min_participations') {
          let ruleData = {};
          try {
            ruleData = typeof pc.unlock_rule_data === 'string' ? JSON.parse(pc.unlock_rule_data) : (pc.unlock_rule_data || {});
          } catch {}
          const minReq = Number(ruleData.min_count || 3);
          return userParticipationCount >= minReq;
        }

        if (pc.unlock_rule_type === 'min_amount') {
          let ruleData = {};
          try {
            ruleData = typeof pc.unlock_rule_data === 'string' ? JSON.parse(pc.unlock_rule_data) : (pc.unlock_rule_data || {});
          } catch {}
          const minAmount = Number(ruleData.min_amount || 50);
          return Number(amount || 0) >= minAmount;
        }
      }
      return true;
    });

    if (eligibleUnowned.length > 0) {
      // Sorteia uma das peças que ele ainda não tem
      const randomIndex = Math.floor(Math.random() * eligibleUnowned.length);
      selectedPiece = eligibleUnowned[randomIndex];
    } else if (unownedPieces.length > 0) {
      // Ele ainda tem peças faltando, mas estão bloqueadas por regra especial -> entrega peça comum repetida
      selectedPiece = allPieces[0];
      isDuplicate = true;
    } else {
      // Já completou todas as peças desse puzzle -> repetida
      selectedPiece = allPieces[0];
      isDuplicate = true;
    }

    // 6. Gravar Participação
    const partRes = await execute(
      `INSERT INTO puzzle_participations 
       (customer_name, customer_email, customer_cpf, customer_phone, campaign_id, external_reference, amount, source, eligible, processed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, true)`,
      [
        customerName,
        customerEmail,
        customerCpf,
        customerPhone,
        validCampaignId,
        externalReference,
        amount,
        source
      ]
    );

    const participationId = partRes.insertId;

    // 7. Gravar Peça do Usuário
    await execute(
      `INSERT INTO puzzle_user_pieces 
       (customer_email, puzzle_id, piece_id, piece_number, is_duplicate, participation_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        customerEmail,
        selectedPuzzle.id,
        selectedPiece.id,
        selectedPiece.piece_number,
        isDuplicate,
        participationId
      ]
    );

    // 8. Atualizar Progresso do Usuário
    const updatedOwned = await query(
      `SELECT DISTINCT piece_number FROM puzzle_user_pieces 
       WHERE puzzle_id = ? AND customer_email = ?`,
      [selectedPuzzle.id, customerEmail]
    );

    const currentOwnedCount = updatedOwned.length;
    const totalCount = Number(selectedPuzzle.pieces_count || 9);
    const isCompleted = currentOwnedCount >= totalCount;

    await execute(
      `INSERT INTO puzzle_user_progress (customer_email, puzzle_id, pieces_count, completed, completed_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (customer_email, puzzle_id) 
       DO UPDATE SET pieces_count = EXCLUDED.pieces_count, 
                     completed = EXCLUDED.completed, 
                     completed_at = CASE WHEN EXCLUDED.completed = true AND puzzle_user_progress.completed = false THEN NOW() ELSE puzzle_user_progress.completed_at END,
                     updated_at = NOW()`,
      [customerEmail, selectedPuzzle.id, currentOwnedCount, isCompleted, isCompleted ? new Date() : null]
    );

    // 9. Se o quebra-cabeça foi 100% completado agora, gerar Prêmio!
    let reward = null;
    if (isCompleted) {
      // Verificar se já gerou prêmio para esse quebra-cabeça e usuário
      const existingReward = await queryOne(
        `SELECT * FROM puzzle_rewards WHERE customer_email = ? AND puzzle_id = ? LIMIT 1`,
        [customerEmail, selectedPuzzle.id]
      );

      if (!existingReward) {
        const rewardCode = `PZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const rewRes = await execute(
          `INSERT INTO puzzle_rewards 
           (customer_name, customer_email, customer_phone, customer_cpf, puzzle_id, reward_code, prize_name, prize_value, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            customerName,
            customerEmail,
            customerPhone,
            customerCpf,
            selectedPuzzle.id,
            rewardCode,
            selectedPuzzle.prize_name,
            selectedPuzzle.prize_value || 0
          ]
        );

        // Incrementar current_winners no quebra-cabeça
        await execute(
          `UPDATE puzzles SET current_winners = current_winners + 1 WHERE id = ?`,
          [selectedPuzzle.id]
        );

        reward = {
          id: rewRes.insertId,
          reward_code: rewardCode,
          prize_name: selectedPuzzle.prize_name,
          prize_value: selectedPuzzle.prize_value,
        };
      }
    }

    // 10. Gravar log de distribuição
    await execute(
      `INSERT INTO puzzle_distribution_logs 
       (participation_id, customer_email, selected_puzzle_id, selected_piece_id, result)
       VALUES (?, ?, ?, ?, ?::jsonb)`,
      [
        participationId,
        customerEmail,
        selectedPuzzle.id,
        selectedPiece.id,
        JSON.stringify({
          puzzle_name: selectedPuzzle.name,
          piece_number: selectedPiece.piece_number,
          is_duplicate: isDuplicate,
          is_completed: isCompleted,
          reward_code: reward ? reward.reward_code : null
        })
      ]
    );

    return {
      success: true,
      message: isDuplicate 
        ? `Você tirou uma peça repetida (#${selectedPiece.piece_number})!` 
        : `Parabéns! Você desbloqueou a peça #${selectedPiece.piece_number} do quebra-cabeça "${selectedPuzzle.name}"!`,
      data: {
        puzzle_id: selectedPuzzle.id,
        puzzle_name: selectedPuzzle.name,
        puzzle_image: selectedPuzzle.image,
        piece_number: selectedPiece.piece_number,
        is_duplicate: isDuplicate,
        pieces_owned: currentOwnedCount,
        pieces_total: totalCount,
        progress_percentage: Math.min(100, Math.round((currentOwnedCount / totalCount) * 100)),
        is_completed: isCompleted,
        reward: reward,
      }
    };
  }
}
