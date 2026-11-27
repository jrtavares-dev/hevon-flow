import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logout realizado.' });
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/admin/login', process.env.APP_URL || 'http://localhost:3000'));
  response.cookies.delete(COOKIE_NAME);
  return response;
}
