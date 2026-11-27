import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { deletePresell } from '@/lib/models/presell';

export async function GET(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const { id } = await params;
    await deletePresell(id);
  } catch (err) {
    console.error('Error deleting presell via GET:', err);
  }

  return NextResponse.redirect(new URL('/admin/presells', request.url));
}
