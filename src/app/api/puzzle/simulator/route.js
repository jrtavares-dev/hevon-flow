import { NextResponse } from 'next/server';
import { DistributionEngine } from '@/lib/puzzle/DistributionEngine';

export async function POST(req) {
  try {
    const body = await req.json();
    const count = Math.min(100, Math.max(1, parseInt(body.count || 10)));
    const customerEmail = body.customer_email || 'simulacao@teste.com';
    const amount = parseFloat(body.amount || 50.0);
    const campaignId = body.campaign_id ? parseInt(body.campaign_id) : null;

    const results = [];
    const puzzleDistributionCounts = {};
    let completedCount = 0;
    const rewardsGenerated = [];

    for (let i = 1; i <= count; i++) {
      const ref = `SIM-UPFLOW-${Date.now()}-${i}-${Math.floor(Math.random() * 900 + 100)}`;
      try {
        const singleRes = await DistributionEngine.processParticipation({
          customerEmail,
          customerName: 'Cliente Simulado',
          amount,
          externalReference: ref,
          campaignId,
          source: 'admin_simulation',
        });

        if (singleRes.success && singleRes.data) {
          const pName = singleRes.data.puzzle_name;
          puzzleDistributionCounts[pName] = (puzzleDistributionCounts[pName] || 0) + 1;
          if (singleRes.data.is_completed) completedCount++;
          if (singleRes.data.reward) rewardsGenerated.push(singleRes.data.reward);
        }
        results.push(singleRes);
      } catch (simErr) {
        results.push({
          success: false,
          error: simErr.message,
          iteration: i,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Simulação de ${count} jogadas concluída com sucesso!`,
      data: {
        total_simulated: count,
        success_count: successCount,
        distribution_counts: puzzleDistributionCounts,
        completed_count: completedCount,
        rewards_generated: rewardsGenerated,
        sample_results: results.slice(0, 5),
      },
    });
  } catch (err) {
    console.error('Error running simulation:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
