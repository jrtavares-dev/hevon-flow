import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { clonePresell } from '@/lib/models/presell';

export async function POST(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const newId = await clonePresell(id);
  if (!newId) {
    return NextResponse.json({ success: false, message: 'Erro ao duplicar.' }, { status: 400 });
  }
  return NextResponse.json({ success: true, message: 'Página duplicada com sucesso!', id: newId });
}
