import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;
  return NextResponse.redirect(new URL(`/admin/presells/edit/${id}`, request.url));
}
