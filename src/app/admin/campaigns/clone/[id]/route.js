import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { cloneCampaign } from '@/lib/models/campaign';

export async function GET(request, { params }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const { id } = await params;
    await cloneCampaign(id);
  } catch (err) {
    console.error('Error cloning campaign via GET:', err);
  }

  return NextResponse.redirect(new URL('/admin/campaigns', request.url));
}
