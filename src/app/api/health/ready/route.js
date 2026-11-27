import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de Readiness (Fase 05: OBS-01)
 * Verifica se as dependências essenciais (banco de dados PostgreSQL Supabase) estão prontas para tráfego.
 */
export async function GET() {
  const start = Date.now();
  try {
    const res = await queryOne('SELECT 1 as live');
    const latencyMs = Date.now() - start;

    if (!res) {
      return NextResponse.json(
        { status: 'unready', database: 'no_response' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ready',
      database: 'connected',
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'unready',
        database: 'disconnected',
        error: 'Database check failed',
      },
      { status: 503 }
    );
  }
}
