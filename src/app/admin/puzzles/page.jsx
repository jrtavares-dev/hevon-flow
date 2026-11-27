import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { PuzzleService } from '@/lib/puzzle/PuzzleService';
import PuzzleManagerClient from '@/components/puzzle/PuzzleManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminPuzzlesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  let puzzles = [];
  let campaign = null;
  let stats = null;
  let recentDrops = [];

  try {
    puzzles = await PuzzleService.getAllPuzzles();
    campaign = await PuzzleService.getActiveCampaign();
    stats = await PuzzleService.getPuzzleStats();
    recentDrops = await PuzzleService.getRecentDrops(10);
  } catch (err) {
    console.error('Error fetching puzzle data in AdminPuzzlesPage:', err);
  }

  // Safe JSON serialization to prevent non-plain objects, Date or BigInt crash across RSC boundary
  const safePuzzles = JSON.parse(JSON.stringify(puzzles || []));
  const safeCampaign = campaign ? JSON.parse(JSON.stringify(campaign)) : null;
  const safeStats = stats ? JSON.parse(JSON.stringify(stats)) : null;
  const safeRecentDrops = JSON.parse(JSON.stringify(recentDrops || []));

  return (
    <div className="w-100">
      <PuzzleManagerClient 
        initialPuzzles={safePuzzles} 
        initialCampaign={safeCampaign} 
        initialStats={safeStats}
        initialRecentDrops={safeRecentDrops}
      />
    </div>
  );
}
