import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de Liveness (Fase 05: OBS-01)
 * Utilizado por balanceadores e PM2 para confirmar que o processo Node.js está vivo e respondendo requisições.
 * Não toca no banco de dados para evitar overhead desnecessário.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
