import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getPresellById, getPresellFullAnalytics } from '@/lib/models/presell';
import { formatTimeBR } from '@/lib/formatters';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'tudo';

    const page = await getPresellById(id);
    if (!page) {
      return NextResponse.json({ success: false, error: 'Presell não encontrada' }, { status: 404 });
    }

    const analytics = await getPresellFullAnalytics(page, period);
    const now = new Date();
    const updatedAt = now.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const response = NextResponse.json({
      success: true,
      summary: analytics?.summary || {},
      timeSeries: analytics?.timeSeries || { labels: [], views: [], clicks: [] },
      buttonStats: analytics?.buttonStats || [],
      updatedAt,
      updatedAtShort: formatTimeBR(now),
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (err) {
    console.error('GET /api/admin/presells/[id]/analytics error:', err);
    return NextResponse.json({ success: false, error: 'Erro ao carregar analytics em tempo real' }, { status: 500 });
  }
}
