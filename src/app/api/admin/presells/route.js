import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getAllPresells, createPresell } from '@/lib/models/presell';
import { syncHevonCatalogAsync } from '@/lib/hevon';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const presells = await getAllPresells();
  return NextResponse.json({ success: true, data: presells });
}

export async function POST(request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.name || !body.destination_url) {
      return NextResponse.json(
        { success: false, message: 'Nome da página e URL de destino são obrigatórios.' },
        { status: 400 }
      );
    }

    const id = await createPresell(body);
    syncHevonCatalogAsync();
    return NextResponse.json({ success: true, message: 'Página criada com sucesso!', id });
  } catch (err) {
    console.error('Error creating presell:', err);
    return NextResponse.json({ success: false, message: 'Erro ao criar página presell.' }, { status: 500 });
  }
}
