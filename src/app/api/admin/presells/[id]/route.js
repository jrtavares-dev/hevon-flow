import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getPresellById, updatePresell, deletePresell, clonePresell } from '@/lib/models/presell';
import { syncHevonCatalogAsync } from '@/lib/hevon';

export async function GET(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const presell = await getPresellById(id);
  if (!presell) {
    return NextResponse.json({ success: false, message: 'Página não encontrada.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: presell });
}

export async function PUT(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    await updatePresell(id, body);
    syncHevonCatalogAsync();
    return NextResponse.json({ success: true, message: 'Página atualizada com sucesso!' });
  } catch (err) {
    console.error('Error updating presell:', err);
    return NextResponse.json({ 
      success: false, 
      message: err?.message ? `Erro ao atualizar página: ${err.message}` : 'Erro ao atualizar página.' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deletePresell(id);
    syncHevonCatalogAsync();
    return NextResponse.json({ success: true, message: 'Página excluída com sucesso!' });
  } catch (err) {
    console.error('Error deleting presell:', err);
    return NextResponse.json({ success: false, message: 'Erro ao excluir página.' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const newId = await clonePresell(id);
  syncHevonCatalogAsync();
  return NextResponse.json({ success: true, message: 'Página duplicada com sucesso!', id: newId });
}
