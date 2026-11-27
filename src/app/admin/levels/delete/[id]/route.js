import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const { id } = await params;
    await execute('DELETE FROM campaign_levels WHERE id = ?', [id]);
  } catch (err) {
    console.error('Delete level error via GET:', err);
  }

  return NextResponse.redirect(new URL('/admin/levels', request.url));
}
