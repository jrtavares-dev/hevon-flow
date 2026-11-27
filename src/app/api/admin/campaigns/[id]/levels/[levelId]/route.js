import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getCampaignLevelById, updateCampaignLevel, deleteCampaignLevel } from '@/lib/models/campaign';

export async function GET(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const { levelId } = await params;
  const level = await getCampaignLevelById(levelId);
  if (!level) {
    return NextResponse.json({ success: false, message: 'Nível não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: level });
}

export async function PUT(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { levelId } = await params;
    const body = await request.json();
    await updateCampaignLevel(levelId, body);
    return NextResponse.json({ success: true, message: 'Nível atualizado com sucesso!' });
  } catch (err) {
    console.error('Error updating level:', err);
    return NextResponse.json({ success: false, message: 'Erro ao atualizar nível.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { levelId } = await params;
    await deleteCampaignLevel(levelId);
    return NextResponse.json({ success: true, message: 'Nível excluído com sucesso!' });
  } catch (err) {
    console.error('Error deleting level:', err);
    return NextResponse.json({ success: false, message: 'Erro ao excluir nível.' }, { status: 500 });
  }
}
