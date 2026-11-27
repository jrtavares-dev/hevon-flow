import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getCampaignLevels, createCampaignLevel } from '@/lib/models/campaign';

export async function GET(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const levels = await getCampaignLevels(id);
  return NextResponse.json({ success: true, data: levels });
}

export async function POST(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const levelId = await createCampaignLevel(id, body);
    return NextResponse.json({ success: true, message: 'Nível adicionado com sucesso!', id: levelId });
  } catch (err) {
    console.error('Error adding level:', err);
    return NextResponse.json({ success: false, message: 'Erro ao adicionar nível.' }, { status: 500 });
  }
}
