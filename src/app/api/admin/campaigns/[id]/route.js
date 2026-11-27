import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getCampaignById, updateCampaign, deleteCampaign, cloneCampaign, getCampaignLevels } from '@/lib/models/campaign';
import { syncHevonCatalogAsync } from '@/lib/hevon';

export async function GET(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) {
    return NextResponse.json({ success: false, message: 'Campanha não encontrada.' }, { status: 404 });
  }

  const levels = await getCampaignLevels(id);

  return NextResponse.json({ success: true, data: { ...campaign, levels } });
}

export async function PUT(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    await updateCampaign(id, body);
    syncHevonCatalogAsync();
    return NextResponse.json({ success: true, message: 'Campanha atualizada com sucesso!' });
  } catch (err) {
    console.error('Error updating campaign:', err);
    return NextResponse.json({ success: false, message: 'Erro ao atualizar campanha.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteCampaign(id);
    syncHevonCatalogAsync();
    return NextResponse.json({ success: true, message: 'Campanha excluída com sucesso!' });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    return NextResponse.json({ success: false, message: 'Erro ao excluir campanha.' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const newId = await cloneCampaign(id);
  syncHevonCatalogAsync();
  return NextResponse.json({ success: true, message: 'Campanha duplicada com sucesso!', id: newId });
}
