import { NextResponse } from 'next/server';
import { PuzzleService } from '@/lib/puzzle/PuzzleService';
import { DistributionEngine } from '@/lib/puzzle/DistributionEngine';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'joao@silva.com.br';
    const campaignId = searchParams.get('campaign_id') ? parseInt(searchParams.get('campaign_id')) : null;
    const mode = searchParams.get('mode') || 'user'; // 'user' ou 'admin'

    if (mode === 'admin') {
      const puzzles = await PuzzleService.getAllPuzzles(campaignId);
      const campaign = await PuzzleService.getActiveCampaign();
      const stats = await PuzzleService.getPuzzleStats(campaignId);
      const recentDrops = await PuzzleService.getRecentDrops(10);
      return NextResponse.json({ 
        success: true, 
        puzzles, 
        campaign, 
        stats, 
        recent_drops: recentDrops 
      });
    }

    const puzzles = await PuzzleService.getUserPuzzles(email, campaignId);
    const campaign = await PuzzleService.getActiveCampaign();

    return NextResponse.json({
      success: true,
      campaign,
      puzzles,
      total_count: puzzles.length,
    });
  } catch (err) {
    console.error('Error fetching puzzles:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const action = body.action || 'create';

    if (action === 'create') {
      const id = await PuzzleService.createPuzzle(body);
      return NextResponse.json({ success: true, id, message: 'Figurinha / Quebra-cabeça criado com sucesso!' });
    }

    if (action === 'update') {
      const id = parseInt(body.id);
      if (!id) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
      await PuzzleService.updatePuzzle(id, body);
      return NextResponse.json({ success: true, message: 'Figurinha / Quebra-cabeça atualizado com sucesso!' });
    }

    if (action === 'delete') {
      const id = parseInt(body.id);
      if (!id) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
      await PuzzleService.deletePuzzle(id);
      return NextResponse.json({ success: true, message: 'Figurinha / Quebra-cabeça removido com sucesso!' });
    }

    if (action === 'toggle_last_piece') {
      const id = parseInt(body.id);
      if (!id) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
      const ruleType = body.rule_type || 'manual';
      await PuzzleService.toggleLastPieceRule(id, ruleType);
      return NextResponse.json({
        success: true,
        message: ruleType === 'none' 
          ? '🎉 Peça #9 LIBERADA para sorteio no quebra-cabeça!' 
          : '🔒 Peça #9 BLOQUEADA com sucesso (Controle manual do Admin)!',
        rule_type: ruleType,
      });
    }

    if (action === 'update_campaign') {
      const id = parseInt(body.id);
      if (!id) return NextResponse.json({ success: false, error: 'ID da campanha inválido' }, { status: 400 });
      await PuzzleService.updateCampaign(id, body);
      const updatedCampaign = await PuzzleService.getActiveCampaign();
      return NextResponse.json({ 
        success: true, 
        message: 'Configurações e teto de segurança atualizados com sucesso!',
        campaign: updatedCampaign
      });
    }

    if (action === 'simulate_pack') {
      const externalRef = `SIM-PZ-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const result = await DistributionEngine.processParticipation({
        customerEmail: body.email || 'admin.teste@upsellflow.com',
        customerName: body.name || 'Admin Teste (Simulador)',
        amount: parseFloat(body.amount || 79.90),
        externalReference: externalRef,
        campaignId: body.campaign_id ? parseInt(body.campaign_id) : null,
        targetPuzzleId: body.puzzle_id ? parseInt(body.puzzle_id) : null,
        source: 'admin_simulator',
      });

      const stats = await PuzzleService.getPuzzleStats();
      const recentDrops = await PuzzleService.getRecentDrops(10);

      return NextResponse.json({
        success: true,
        data: result,
        stats,
        recent_drops: recentDrops,
      });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida' }, { status: 400 });
  } catch (err) {
    console.error('Error saving puzzle:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
